import logging
from typing import Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    BadRequestException, ForbiddenException, NotFoundException
)
from app.models.user import User
from app.repositories.invoice_repo import InvoiceRepository
from app.repositories.booking_repo import BookingRepository
from app.repositories.billboard_repo import BillboardRepository
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate

logger = logging.getLogger(__name__)


class InvoiceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.invoice_repo = InvoiceRepository(db)
        self.booking_repo = BookingRepository(db)
        self.billboard_repo = BillboardRepository(db)

    async def create_invoice(self, data: InvoiceCreate, admin: User):
        """Create an invoice for a confirmed booking."""
        booking = await self.booking_repo.get_by_id(data.booking_id)
        if not booking:
            raise NotFoundException("Booking not found")

        # Verify billboard ownership (Admins can issue invoices for any billboard)
        billboard = await self.billboard_repo.get_by_id(booking.billboard_id)
        if admin.role != "admin" and billboard.owner_id != admin.id:
            raise ForbiddenException("You can only issue invoices for your own billboards")

        if booking.status != "confirmed":
            raise BadRequestException("Invoices can only be issued for confirmed bookings")

        # Check if invoice already exists
        existing = await self.invoice_repo.get_by_booking_id(data.booking_id)
        if existing:
            raise BadRequestException("An invoice already exists for this booking")

        invoice_number = await self.invoice_repo.generate_invoice_number()

        invoice = await self.invoice_repo.create({
            "booking_id": data.booking_id,
            "owner_id": admin.id,
            "client_id": booking.user_id,
            "invoice_number": invoice_number,
            "amount": data.amount or booking.total_price,
            "status": data.status,
            "due_date": data.due_date,
            "notes": data.notes,
        })

        logger.info(f"Invoice {invoice_number} created by admin {admin.email}")
        return invoice

    async def get_invoice(self, invoice_id: UUID, user: User):
        """Get invoice for admin or client."""
        invoice = await self.invoice_repo.get_by_id(invoice_id)
        if not invoice:
            raise NotFoundException("Invoice not found")

        if user.role != "admin" and invoice.owner_id != user.id and invoice.client_id != user.id:
            raise ForbiddenException("You do not have permission to view this invoice")

        return invoice

    async def get_owner_invoices(
        self, owner_id: UUID, role: str, status: Optional[str] = None,
        page: int = 1, per_page: int = 20
    ):
        skip = (page - 1) * per_page
        if role == "admin":
            # Admin sees ALL invoices in the system
            return await self.invoice_repo.get_all(status=status, skip=skip, limit=per_page)
        
        return await self.invoice_repo.get_by_owner(
            owner_id=owner_id, status=status, skip=skip, limit=per_page
        )

    async def get_client_invoices(
        self, client_id: UUID, status: Optional[str] = None,
        page: int = 1, per_page: int = 20
    ):
        skip = (page - 1) * per_page
        return await self.invoice_repo.get_by_client(
            client_id=client_id, status=status, skip=skip, limit=per_page
        )

    async def update_invoice_status(self, invoice_id: UUID, status: str, user: User):
        """Update invoice status (e.g., mark as paid)."""
        invoice = await self.invoice_repo.get_by_id(invoice_id)
        if not invoice:
            raise NotFoundException("Invoice not found")

        # Only owner or admin can update status
        if user.role != "admin" and str(invoice.owner_id) != str(user.id):
            raise ForbiddenException(f"Permission denied. Role: {user.role}, Issuer: {invoice.owner_id}, You: {user.id}")

        updated = await self.invoice_repo.update(invoice_id, {"status": status})
        logger.info(f"Invoice {invoice_id} status updated to {status} by {user.email}")
        return updated

    async def get_owner_clients(self, owner_id: UUID):
        """Get list of clients for an owner."""
        return await self.invoice_repo.get_clients_by_owner(owner_id)
