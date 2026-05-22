"""
Payment Routes (Razorpay)
=========================
Creates Razorpay orders and verifies payment signatures.
"""

import hashlib
import hmac
import logging
from uuid import UUID
import razorpay


from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.dependencies import get_current_user
from app.core.exceptions import BadRequestException
from app.db.session import get_db
from app.models.user import User
from app.services.booking_service import BookingService
from app.services.invoice_service import InvoiceService
from app.schemas.invoice import InvoiceCreate
from datetime import date, timedelta

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


class CreateOrderRequest(BaseModel):
    billboard_id: UUID
    amount: float  # Amount in INR


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    billboard_id: UUID
    start_date: str
    end_date: str
    notes: str = None


@router.post("/create-order")
async def create_razorpay_order(
    data: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
):
    """Create a Razorpay order for payment."""
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise BadRequestException("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env")

    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        # Amount in paise (Razorpay uses smallest currency unit)
        amount_paise = int(data.amount * 100)

        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"bb_{data.billboard_id}_{current_user.id}",
            "notes": {
                "billboard_id": str(data.billboard_id),
                "user_id": str(current_user.id),
            }
        }

        order = client.order.create(data=order_data)
        logger.info(f"Razorpay order created: {order['id']} for user {current_user.email}")

        return {
            "status": "success",
            "data": {
                "order_id": order["id"],
                "amount": order["amount"],
                "currency": order["currency"],
                "key_id": settings.RAZORPAY_KEY_ID,
            }
        }
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise BadRequestException(f"Payment order creation failed: {str(e)}")


@router.post("/verify")
async def verify_payment(
    data: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify Razorpay payment signature and create booking."""
    if not settings.RAZORPAY_KEY_SECRET:
        raise BadRequestException("Razorpay is not configured")

    # Verify signature
    message = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    generated_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    if generated_signature != data.razorpay_signature:
        raise BadRequestException("Payment verification failed — invalid signature")

    # Payment verified — now create the booking
    from app.schemas.booking import BookingCreate

    booking_data = BookingCreate(
        billboard_id=data.billboard_id,
        start_date=date.fromisoformat(data.start_date),
        end_date=date.fromisoformat(data.end_date),
        notes=data.notes,
    )

    # Payment verified — now create the booking as CONFIRMED
    booking_service = BookingService(db)
    booking = await booking_service.create_booking(booking_data, current_user, status="confirmed")

    # Automatically generate a PAID invoice
    invoice_service = InvoiceService(db)
    
    # We find the billboard to get the owner_id (for the invoice)
    from app.repositories.billboard_repo import BillboardRepository
    billboard_repo = BillboardRepository(db)
    billboard = await billboard_repo.get_by_id(data.billboard_id)

    # Prepare invoice data
    invoice_data = InvoiceCreate(
        booking_id=booking.id,
        amount=booking.total_price,
        status="paid",
        due_date=date.today(), # Paid today
        notes=f"Payment via Razorpay: {data.razorpay_payment_id}"
    )
    
    # Create the invoice. We use the billboard owner as the 'admin' who issued it.
    from app.models.user import User as UserModel
    owner = await db.get(UserModel, billboard.owner_id)
    await invoice_service.create_invoice(invoice_data, owner)

    logger.info(f"Payment verified, booking confirmed & invoice created: {booking.id}")

    from app.schemas.booking import BookingResponse
    return {
        "status": "success",
        "message": "Payment successful! Booking created.",
        "data": BookingResponse.model_validate(booking),
    }


@router.get("/config")
async def get_razorpay_config(
    current_user: User = Depends(get_current_user),
):
    """Get Razorpay public key for frontend."""
    return {
        "status": "success",
        "data": {
            "key_id": settings.RAZORPAY_KEY_ID,
            "enabled": bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET),
        }
    }
