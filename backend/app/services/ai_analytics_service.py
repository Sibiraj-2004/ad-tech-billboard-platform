"""
AI Analytics Service
====================
Uses the Gemma LLM model to generate intelligent ROI predictions,
audience demographics, and location trend analysis.
"""

import json
import logging
from typing import Dict, Any
import uuid

from app.services.llm_orchestrator import llm_client

logger = logging.getLogger(__name__)


class AIAnalyticsService:
    @staticmethod
    async def predict_roi(billboard_id: uuid.UUID, budget: float, duration: int) -> Dict[str, Any]:
        """
        Uses Gemma LLM to predict ROI based on budget, duration, and billboard context.
        """
        system_prompt = (
            "You are an AI advertising analytics engine. "
            "Given billboard campaign parameters, predict realistic ROI metrics. "
            "Output ONLY valid JSON in this exact format:\n"
            '{"predicted_roi": 0.85, "estimated_impressions": 210000, '
            '"confidence_score": 0.88, "best_time_to_display": "17:00 - 20:00 (Rush Hour)"}\n'
            "Rules:\n"
            "- predicted_roi: between 0.5 and 1.0\n"
            "- estimated_impressions: realistic daily estimate × duration\n"
            "- confidence_score: between 0.7 and 0.95\n"
            "- best_time_to_display: realistic peak display window\n"
            "- Output ONLY JSON, no other text."
        )

        user_prompt = (
            f"Billboard ID: {billboard_id}. "
            f"Campaign budget: ${budget}. Duration: {duration} days. "
            "Predict the ROI, estimated impressions, confidence score, and best display time."
        )

        try:
            response = await llm_client.get_response(system_prompt, user_prompt, temperature=0.2)
            cleaned = response.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned)
            # Validate and clamp values
            return {
                "predicted_roi": round(min(max(float(data.get("predicted_roi", 0.75)), 0.0), 1.0), 2),
                "estimated_impressions": int(data.get("estimated_impressions", duration * 15000)),
                "confidence_score": round(min(max(float(data.get("confidence_score", 0.85)), 0.0), 1.0), 2),
                "best_time_to_display": str(data.get("best_time_to_display", "17:00 - 20:00 (Rush Hour)"))
            }
        except Exception as e:
            logger.warning(f"LLM ROI prediction failed, using heuristic: {e}")
            # Deterministic fallback based on budget and duration
            base_impressions = int(duration * 15000 * (1 + (budget / 10000)))
            return {
                "predicted_roi": round(min(0.65 + (budget / 20000), 1.0), 2),
                "estimated_impressions": base_impressions,
                "confidence_score": 0.82,
                "best_time_to_display": "17:00 - 20:00 (Rush Hour)"
            }

    @staticmethod
    async def get_audience_demographics(billboard_id: uuid.UUID) -> Dict[str, Any]:
        """
        Uses Gemma LLM to generate audience demographics for a billboard location.
        """
        system_prompt = (
            "You are an AI audience analytics engine for billboard advertising. "
            "Generate realistic audience demographic data for a billboard location. "
            "Output ONLY valid JSON in this format:\n"
            '{"top_age_groups": ["25-34 (35%)", "35-44 (28%)"], '
            '"gender_split": {"male": 52, "female": 48}, '
            '"top_interests": ["Technology", "Automotive", "Business Services"], '
            '"income_bracket": "Middle to Upper Class"}\n'
            "- Provide 2-3 age groups with percentages\n"
            "- Gender split must add to 100\n"
            "- Provide 2-4 relevant interests\n"
            "- Output ONLY JSON, no other text."
        )

        user_prompt = f"Generate audience demographics for billboard {billboard_id}."

        try:
            response = await llm_client.get_response(system_prompt, user_prompt, temperature=0.3)
            cleaned = response.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned)
            return {
                "top_age_groups": data.get("top_age_groups", ["25-34 (35%)", "35-44 (28%)"]),
                "gender_split": data.get("gender_split", {"male": 52, "female": 48}),
                "top_interests": data.get("top_interests", ["Technology", "Automotive"]),
                "income_bracket": data.get("income_bracket", "Middle Class")
            }
        except Exception as e:
            logger.warning(f"LLM demographics failed, using defaults: {e}")
            return {
                "top_age_groups": ["25-34 (35%)", "35-44 (28%)"],
                "gender_split": {"male": 52, "female": 48},
                "top_interests": ["Technology", "Automotive", "Business Services"],
                "income_bracket": "Middle to Upper Class"
            }

    @staticmethod
    async def get_location_trends(city: str) -> Dict[str, Any]:
        """
        Uses Gemma LLM for AI-powered trend analysis for a city's advertising demand.
        """
        system_prompt = (
            "You are an AI market trend analyst for outdoor advertising. "
            "Analyze the advertising market trends for the given city. "
            "Output ONLY valid JSON in this format:\n"
            '{"demand_index": 0.78, "is_increasing": true, '
            '"seasonality_peak": "Summer / Quarter 3", '
            '"nearby_events_impact": "Medium-High"}\n'
            "- demand_index: 0.0 to 1.0 based on city size and ad demand\n"
            "- is_increasing: boolean market trend\n"
            "- seasonality_peak: when ads perform best\n"
            "- Output ONLY JSON, no other text."
        )

        user_prompt = f"Analyze outdoor advertising market trends for {city}."

        try:
            response = await llm_client.get_response(system_prompt, user_prompt, temperature=0.3)
            cleaned = response.replace("```json", "").replace("```", "").strip()
            data = json.loads(cleaned)
            return {
                "demand_index": round(min(max(float(data.get("demand_index", 0.75)), 0.0), 1.0), 2),
                "is_increasing": bool(data.get("is_increasing", True)),
                "seasonality_peak": str(data.get("seasonality_peak", "Summer / Q3")),
                "nearby_events_impact": str(data.get("nearby_events_impact", "Medium"))
            }
        except Exception as e:
            logger.warning(f"LLM trends failed, using defaults: {e}")
            return {
                "demand_index": 0.78,
                "is_increasing": True,
                "seasonality_peak": "Summer / Quarter 3",
                "nearby_events_impact": "Medium-High"
            }
