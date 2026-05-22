from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceRead, InvoiceUpdate, ClientRead
from app.services.invoice_service import InvoiceService
from app.utils.pagination import paginated_response

router = APIRouter()


@router.post("", status_code=201)
async def create_invoice(
    data: InvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin creates an invoice for a confirmed booking."""
    service = InvoiceService(db)
    invoice = await service.create_invoice(data, current_user)
    return {
        "status": "success",
        "message": "Invoice generated successfully",
        "data": InvoiceRead.model_validate(invoice),
    }


@router.get("/admin")
async def list_admin_invoices(
    status: Optional[str] = Query(None, pattern="^(unpaid|paid|overdue|cancelled)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List invoices issued by the authenticated admin."""
    service = InvoiceService(db)
    invoices, total = await service.get_owner_invoices(
        owner_id=current_user.id, role=current_user.role, 
        status=status, page=page, per_page=per_page
    )
    data = []
    for inv in invoices:
        read = InvoiceRead.model_validate(inv)
        read.billboard_title = inv.booking.billboard.title if inv.booking and inv.booking.billboard else "Deleted Billboard"
        read.client_name = inv.client.full_name or inv.client.username if inv.client else "Deleted User"
        read.client_email = inv.client.email if inv.client else "N/A"
        data.append(read)
    return paginated_response(data, total, page, per_page)


@router.get("/client")
async def list_client_invoices(
    status: Optional[str] = Query(None, pattern="^(unpaid|paid|overdue|cancelled)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List invoices received by the authenticated client (advertiser)."""
    service = InvoiceService(db)
    invoices, total = await service.get_client_invoices(
        client_id=current_user.id, status=status,
        page=page, per_page=per_page
    )
    data = []
    for inv in invoices:
        read = InvoiceRead.model_validate(inv)
        read.billboard_title = inv.booking.billboard.title if inv.booking and inv.booking.billboard else "Deleted Billboard"
        read.client_name = inv.client.full_name or inv.client.username if inv.client else "Deleted User"
        read.client_email = inv.client.email if inv.client else "N/A"
        data.append(read)
    return paginated_response(data, total, page, per_page)


@router.get("/clients", response_model=List[ClientRead])
async def list_my_clients(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all unique clients who have booked with the authenticated owner."""
    if current_user.role != "admin":
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException("Only admins can view their client list")
    
    service = InvoiceService(db)
    clients = await service.get_owner_clients(current_user.id)
    return [ClientRead.model_validate(c) for c in clients]


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get invoice details."""
    service = InvoiceService(db)
    invoice = await service.get_invoice(invoice_id, current_user)
    return {
        "status": "success",
        "data": InvoiceRead.model_validate(invoice),
    }


@router.patch("/{invoice_id}/status")
async def update_invoice_status(
    invoice_id: UUID,
    status: str = Query(..., pattern="^(unpaid|paid|overdue|cancelled)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update invoice status."""
    service = InvoiceService(db)
    invoice = await service.update_invoice_status(invoice_id, status, current_user)
    
    read = InvoiceRead.model_validate(invoice)
    read.billboard_title = invoice.booking.billboard.title if invoice.booking and invoice.booking.billboard else "Deleted Billboard"
    read.client_name = invoice.client.full_name or invoice.client.username if invoice.client else "Deleted User"
    read.client_email = invoice.client.email if invoice.client else "N/A"
    
    return {
        "status": "success",
        "message": "Invoice status updated successfully",
        "data": read,
    }
