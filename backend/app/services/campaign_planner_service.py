import json
import logging
import math
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.billboard import Billboard
from app.schemas.campaign import CampaignPlan, RecommendedBillboard
from app.services.llm_orchestrator import llm_client
from app.services.ai_analytics_service import AIAnalyticsService
from app.services.data_enrichment_service import DataEnrichmentService

logger = logging.getLogger(__name__)

class CampaignPlannerService:
    @staticmethod
    async def process_chat(db: AsyncSession, message: str) -> Dict[str, Any]:
        """
        Process user message, extract intent, and orchestrate campaign generation.
        """
        # Step 1: Extract intent and parameters via LLM
        system_prompt = (
            "You are an AI Billboard Planner. Extract the user's needs for a campaign. "
            "Output strictly valid JSON in this format: "
            '{"action": "plan_campaign", "budget": 1000, "duration": 7, "location": "city_name_optional"}. '
            "If no budget or duration is mentioned, assume default budget 1000 and duration 7. "
            "Do not output conversational text, ONLY JSON."
        )
        
        extracted_info_str = await llm_client.get_response(system_prompt, message, temperature=0.1)
        
        try:
            # Clean possible markdown formatting
            cleaned_str = extracted_info_str.replace("```json", "").replace("```", "").strip()
            params = json.loads(cleaned_str)
        except json.JSONDecodeError:
            logger.warning("LLM failed to return structured JSON. Using fallback.")
            params = {"budget": 1000, "duration": 7}

        budget = float(params.get("budget", 1000))
        duration = int(params.get("duration", 7))
        location = params.get("location")

        plan = await CampaignPlannerService.generate_optimized_plan(db, budget, duration, location)

        # Step 3: Conversational Response Generation
        num_found = len(plan.billboards) if plan else 0
        location_text = f" in {location}" if location else ""
        total_cost = plan.total_cost if plan else 0
        context_str = f"Found {num_found} billboards{location_text} for a {duration}-day campaign totaling ${total_cost:.2f}."
        
        response_prompt = (
            "You are a helpful and persuasive AI Billboard Assistant. "
            "Based on the following internal context, write a brief, friendly 2-3 sentence response to the user. "
            f"Context: {context_str} Budget was ${budget}. "
            "Do not output JSON, just regular formatted text."
        )
        
        chat_text = await llm_client.get_response(response_prompt, message, temperature=0.5)

        return {
            "text": chat_text,
            "campaign_plan": plan.model_dump() if plan else None
        }

    @staticmethod
    async def generate_optimized_plan(
        db: AsyncSession, 
        budget: float, 
        duration: int, 
        location: Optional[str] = None,
        category: Optional[str] = None,
        audience: Optional[str] = None
    ) -> Optional[CampaignPlan]:
        """
        Generates a structured campaign plan.
        1. Tries to find matching billboards in the database.
        2. If none found, calls the external LLM API to generate
           AI-recommended billboard placements and ROI analysis.
        """
        # ── Step 1: Try Database Retrieval ────────────────────────
        stmt = select(Billboard).where(Billboard.status == "active")
        
        if location:
            stmt = stmt.where(Billboard.city.ilike(f"%{location}%"))
            
        result = await db.execute(stmt)
        billboards = result.scalars().all()

        # ── Step 2: If DB has billboards, use the enrichment pipeline ──
        if billboards:
            return await CampaignPlannerService._plan_from_db(
                billboards, budget, duration, location, category, audience
            )

        # ── Step 3: No DB results → Call External AI API ──────────
        logger.info(f"No billboards found in DB for '{location}'. Falling back to external AI API.")
        return await CampaignPlannerService._plan_from_external_ai(
            budget, duration, location, category, audience
        )

    @staticmethod
    async def _plan_from_db(
        billboards: list,
        budget: float,
        duration: int,
        location: Optional[str],
        category: Optional[str],
        audience: Optional[str]
    ) -> Optional[CampaignPlan]:
        """Build a plan using real billboard data from the database."""
        recommendations = []
        total_cost = 0.0
        total_impressions = 0
        
        sorted_billboards = sorted(billboards, key=lambda b: float(b.price_per_day or 0))
        
        for b in sorted_billboards:
            cost_for_duration = float(b.price_per_day or 0) * duration
            if total_cost + cost_for_duration <= budget:
                analytics = await AIAnalyticsService.predict_roi(b.id, budget, duration)
                enrichment = await DataEnrichmentService.get_traffic_data(
                    float(b.latitude or 0), float(b.longitude or 0)
                )
                
                projected_impressions = analytics["estimated_impressions"]
                roi_score = analytics["predicted_roi"]
                
                if category and category.lower() in (getattr(b, 'category', '') or "").lower():
                    roi_score += 0.1
                
                rec = RecommendedBillboard(
                    billboard_id=b.id,
                    title=b.title,
                    price_per_day=float(b.price_per_day),
                    city=b.city,
                    state=b.state,
                    latitude=float(b.latitude) if b.latitude else None,
                    longitude=float(b.longitude) if b.longitude else None,
                    projected_impressions=projected_impressions,
                    roi_score=min(roi_score, 1.0),
                    match_reason=(
                        f"Top-tier location in {b.city}. "
                        f"{enrichment['level']} traffic with "
                        f"{analytics['best_time_to_display']} peak viewing hours."
                    )
                )
                recommendations.append(rec)
                total_cost += cost_for_duration
                total_impressions += projected_impressions

            if total_cost > budget * 0.95:
                break

        if not recommendations:
            return None

        first_b_id = recommendations[0].billboard_id
        audience_insights = await AIAnalyticsService.get_audience_demographics(first_b_id)
        location_trends = await AIAnalyticsService.get_location_trends(
            location if location else recommendations[0].city
        )

        return CampaignPlan(
            budget=budget,
            duration_days=duration,
            target_audience=audience or "General Audience",
            total_cost=total_cost,
            total_impressions=total_impressions,
            billboards=recommendations,
            audience_insights=audience_insights,
            location_trends=location_trends
        )

    @staticmethod
    async def _plan_from_external_ai(
        budget: float,
        duration: int,
        location: Optional[str],
        category: Optional[str],
        audience: Optional[str]
    ) -> Optional[CampaignPlan]:
        """
        Generates a full campaign plan using the external LLM API
        when no database inventory is available.
        """
        location_str = location or "major metro area"
        category_str = category or "general"
        audience_str = audience or "General Audience"

        system_prompt = (
            "You are an expert AI Billboard Campaign Planner. "
            "Based on the user's campaign brief, generate a DETAILED campaign plan "
            "with recommended billboard placements, ROI projections, and audience insights. "
            "You MUST output ONLY valid JSON in this exact structure:\n"
            "{\n"
            '  "billboards": [\n'
            "    {\n"
            '      "title": "Billboard name/description",\n'
            '      "price_per_day": 150.00,\n'
            '      "city": "City Name",\n'
            '      "state": "State Name",\n'
            '      "latitude": 40.7128,\n'
            '      "longitude": -74.0060,\n'
            '      "projected_impressions": 25000,\n'
            '      "roi_score": 0.85,\n'
            '      "match_reason": "Why this location is ideal"\n'
            "    }\n"
            "  ],\n"
            '  "audience_insights": {\n'
            '    "top_age_groups": ["25-34 (40%)", "35-44 (30%)"],\n'
            '    "gender_split": {"male": 55, "female": 45},\n'
            '    "top_interests": ["Technology", "Retail"],\n'
            '    "income_bracket": "Middle Class"\n'
            "  },\n"
            '  "location_trends": {\n'
            '    "demand_index": 0.82,\n'
            '    "is_increasing": true,\n'
            '    "seasonality_peak": "Summer / Q3"\n'
            "  }\n"
            "}\n\n"
            "RULES:\n"
            f"- Total cost of all billboards × {duration} days must be within ${budget}.\n"
            "- Suggest 2-5 billboard placements with real-world coordinates.\n"
            "- ROI scores between 0.0 and 1.0.\n"
            "- Provide realistic impressions based on location population.\n"
            "- Do NOT include any text outside the JSON."
        )

        user_prompt = (
            f"Plan a {duration}-day billboard advertising campaign in {location_str}. "
            f"Budget: ${budget}. "
            f"Business category: {category_str}. "
            f"Target audience: {audience_str}. "
            "Recommend the best billboard placements with locations, pricing, and ROI."
        )

        response_text = await llm_client.get_response(system_prompt, user_prompt, temperature=0.3)

        try:
            # Clean markdown formatting if present
            cleaned = response_text.replace("```json", "").replace("```", "").strip()
            ai_data = json.loads(cleaned)
        except json.JSONDecodeError:
            logger.error(f"External AI returned invalid JSON: {response_text[:200]}")
            # Use fallback data
            ai_data = CampaignPlannerService._generate_fallback_plan(
                budget, duration, location_str, category_str
            )

        # Parse the AI response into our schema
        import uuid
        recommendations = []
        total_cost = 0.0
        total_impressions = 0

        for b in ai_data.get("billboards", []):
            cost_for_duration = float(b.get("price_per_day", 100)) * duration
            if total_cost + cost_for_duration <= budget:
                rec = RecommendedBillboard(
                    billboard_id=uuid.uuid4(),  # Generated ID for AI-suggested billboards
                    title=b.get("title", "AI Recommended Spot"),
                    price_per_day=float(b.get("price_per_day", 100)),
                    city=b.get("city", location_str),
                    state=b.get("state", ""),
                    latitude=float(b.get("latitude", 0)) if b.get("latitude") else None,
                    longitude=float(b.get("longitude", 0)) if b.get("longitude") else None,
                    projected_impressions=int(b.get("projected_impressions", 15000)),
                    roi_score=min(float(b.get("roi_score", 0.75)), 1.0),
                    match_reason=b.get("match_reason", f"AI-optimized placement in {location_str}")
                )
                recommendations.append(rec)
                total_cost += cost_for_duration
                total_impressions += int(b.get("projected_impressions", 15000))

        if not recommendations:
            return None

        # Extract audience insights and location trends from AI response
        audience_insights = ai_data.get("audience_insights", {
            "top_age_groups": ["25-34 (35%)", "35-44 (28%)"],
            "gender_split": {"male": 52, "female": 48},
            "top_interests": ["Technology", "Automotive", "Business Services"],
            "income_bracket": "Middle to Upper Class"
        })

        location_trends = ai_data.get("location_trends", {
            "demand_index": 0.78,
            "is_increasing": True,
            "seasonality_peak": "Summer / Q3"
        })

        return CampaignPlan(
            budget=budget,
            duration_days=duration,
            target_audience=audience or "General Audience",
            total_cost=total_cost,
            total_impressions=total_impressions,
            billboards=recommendations,
            audience_insights=audience_insights,
            location_trends=location_trends
        )

    @staticmethod
    def _generate_fallback_plan(
        budget: float, duration: int, location: str, category: str
    ) -> dict:
        """
        Fallback plan when the external AI API is unreachable.
        Generates realistic mock data based on the input parameters.
        """
        daily_budget = budget / duration
        num_billboards = min(max(int(daily_budget / 80), 1), 5)
        # Use floor to ensure total never exceeds budget
        price_per = math.floor((daily_budget / num_billboards) * 100) / 100

        # Default coordinates for common cities
        city_coords = {
            "new york": (40.7128, -74.0060),
            "los angeles": (34.0522, -118.2437),
            "chicago": (41.8781, -87.6298),
            "houston": (29.7604, -95.3698),
            "miami": (25.7617, -80.1918),
            "san francisco": (37.7749, -122.4194),
            "seattle": (47.6062, -122.3321),
            "boston": (42.3601, -71.0589),
            "dallas": (32.7767, -96.7970),
            "atlanta": (33.7490, -84.3880),
        }

        base_lat, base_lon = city_coords.get(location.lower(), (37.7749, -122.4194))

        billboards = []
        for i in range(num_billboards):
            billboards.append({
                "title": f"Premium {category.title()} Billboard #{i+1} - {location.title()}",
                "price_per_day": price_per,
                "city": location.title(),
                "state": "",
                "latitude": round(base_lat + (i * 0.01), 6),
                "longitude": round(base_lon + (i * 0.008), 6),
                "projected_impressions": 12000 + (i * 3000),
                "roi_score": round(0.72 + (i * 0.05), 2),
                "match_reason": f"High-visibility {category} corridor in {location.title()} with strong foot traffic."
            })

        return {
            "billboards": billboards,
            "audience_insights": {
                "top_age_groups": ["25-34 (38%)", "35-44 (27%)", "18-24 (20%)"],
                "gender_split": {"male": 51, "female": 49},
                "top_interests": ["Technology", "Retail", "Entertainment"],
                "income_bracket": "Middle Class"
            },
            "location_trends": {
                "demand_index": 0.75,
                "is_increasing": True,
                "seasonality_peak": "Summer / Q3"
            }
        }
