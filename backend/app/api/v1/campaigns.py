from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
from app.api.deps import get_db
from app.schemas.campaign import ChatRequest, ChatResponse, CampaignOptimizationRequest, CampaignPlan
from app.services.campaign_planner_service import CampaignPlannerService

router = APIRouter()


@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)

async def generate_campaign_plan(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    AI Campaign Planner Endpoint (Chat based).
    """
    try:
        response_data = await CampaignPlannerService.process_chat(db, request.message)
        return response_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate campaign plan: {str(e)}"
        )

@router.post("/optimize", response_model=CampaignPlan, status_code=status.HTTP_200_OK)
async def optimize_campaign(
    request: CampaignOptimizationRequest,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    AI Campaign Optimizer Endpoint (Form based).
    Fetches from DB inventory or falls back to external AI API for recommendations.
    """
    try:
        plan = await CampaignPlannerService.generate_optimized_plan(
            db, 
            request.budget, 
            request.duration_days, 
            request.location,
            request.category,
            request.target_audience
        )
        if not plan:
            raise HTTPException(
                status_code=404, 
                detail="Could not generate a campaign plan. Please try different parameters."
            )
        return plan
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Optimization failed: {str(e)}"
        )


