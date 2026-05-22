from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.invoice import Invoice
from app.models.user import User
from app.models.booking import Booking
from app.repositories.base import BaseRepository


class InvoiceRepository(BaseRepository[Invoice]):
    def __init__(self, db: AsyncSession):
        super().__init__(Invoice, db)

    async def get_by_id(self, id: UUID) -> Optional[Invoice]:
        """Get a single invoice with relations loaded."""
        query = (
            select(Invoice)
            .options(
                joinedload(Invoice.booking).joinedload(Booking.billboard),
                joinedload(Invoice.client)
            )
            .where(Invoice.id == id)
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_by_booking_id(self, booking_id: UUID) -> Optional[Invoice]:
        query = select(Invoice).where(Invoice.booking_id == booking_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self, status: Optional[str] = None,
        skip: int = 0, limit: int = 20,
    ) -> Tuple[List[Invoice], int]:
        """Get all invoices in the platform (Admin view)."""
        query = select(Invoice)
        if status:
            query = query.where(Invoice.status == status)
        
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            query.options(
                joinedload(Invoice.booking).joinedload(Booking.billboard),
                joinedload(Invoice.client)
            )
            .order_by(Invoice.created_at.desc())
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_by_owner(
        self, owner_id: UUID, status: Optional[str] = None,
        skip: int = 0, limit: int = 20,
    ) -> Tuple[List[Invoice], int]:
        """Get invoices issued by an owner."""
        query = select(Invoice).where(Invoice.owner_id == owner_id)
        if status:
            query = query.where(Invoice.status == status)
        
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            query.options(
                joinedload(Invoice.booking).joinedload(Booking.billboard),
                joinedload(Invoice.client)
            )
            .order_by(Invoice.created_at.desc())
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_by_client(
        self, client_id: UUID, status: Optional[str] = None,
        skip: int = 0, limit: int = 20,
    ) -> Tuple[List[Invoice], int]:
        """Get invoices received by a client."""
        query = select(Invoice).where(Invoice.client_id == client_id)
        if status:
            query = query.where(Invoice.status == status)
        
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        query = (
            query.options(
                joinedload(Invoice.booking).joinedload(Booking.billboard),
                joinedload(Invoice.client)
            )
            .order_by(Invoice.created_at.desc())
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def get_clients_by_owner(self, owner_id: UUID) -> List[dict]:
        """Get unique clients who have booked with this owner."""
        # Query users who have bookings on billboards owned by owner_id
        from app.models.billboard import Billboard
        
        query = (
            select(
                User.id,
                User.full_name,
                User.email,
                User.username,
                User.phone,
                func.count(Booking.id).label("total_bookings"),
                func.sum(Booking.total_price).label("total_spent")
            )
            .join(Booking, User.id == Booking.user_id)
            .join(Billboard, Booking.billboard_id == Billboard.id)
            .where(Billboard.owner_id == owner_id)
            .group_by(User.id)
            .order_by(func.count(Booking.id).desc())
        )
        
        result = await self.db.execute(query)
        return [dict(row._mapping) for row in result.all()]

    async def generate_invoice_number(self) -> str:
        """Generate a unique invoice number (e.g., INV-2024-001)."""
        from datetime import datetime
        year = datetime.now().year
        
        # Get count of invoices this year
        query = select(func.count(Invoice.id)).where(
            Invoice.invoice_number.like(f"INV-{year}-%")
        )
        result = await self.db.execute(query)
        count = result.scalar_one()
        
        return f"INV-{year}-{(count + 1):04d}"
