from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid

class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's input message")
    history: Optional[List[Dict[str, str]]] = Field(default=[], description="Chat history")

class CampaignOptimizationRequest(BaseModel):
    budget: float = Field(..., description="Total Budget")
    duration_days: int = Field(..., description="Duration in days")
    location: Optional[str] = Field(None, description="Target city or area")
    category: Optional[str] = Field(None, description="Business category")
    target_audience: Optional[str] = Field(None, description="Target demographic/interests")


class RecommendedBillboard(BaseModel):
    billboard_id: uuid.UUID
    title: str
    price_per_day: float
    city: str
    state: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    projected_impressions: int
    roi_score: float
    match_reason: str


class CampaignPlan(BaseModel):
    budget: float
    duration_days: int
    target_audience: Optional[str]
    total_cost: float
    total_impressions: int
    billboards: List[RecommendedBillboard]
    audience_insights: Optional[Dict[str, Any]] = None
    location_trends: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    text: str = Field(..., description="The AI's textual response")
    campaign_plan: Optional[CampaignPlan] = Field(None, description="Structured campaign plan if generated")
