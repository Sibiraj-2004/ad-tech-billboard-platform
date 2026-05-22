"""
Admin Service
==============
Business logic for admin operations with audit logging.
Every admin action is recorded in the admin_logs table.
"""

import logging
from uuid import UUID

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_log import AdminLog
from app.models.user import User

logger = logging.getLogger(__name__)


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_action(
        self,
        admin: User,
        action: str,
        entity_type: str,
        entity_id: UUID = None,
        details: dict = None,
        ip_address: str = None,
    ) -> None:
        """
        Record an admin action to the audit log.
        Called by route handlers after each admin operation.
        """
        log_entry = AdminLog(
            admin_id=admin.id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {},
            ip_address=ip_address,
        )
        self.db.add(log_entry)
        await self.db.flush()

        logger.info(
            f"Admin action: {action} on {entity_type}({entity_id}) "
            f"by {admin.email} from {ip_address}"
        )

    async def get_logs(self, skip: int = 0, limit: int = 50) -> list:
        """Get admin activity logs."""
        from sqlalchemy import select
        from app.models.admin_log import AdminLog

        result = await self.db.execute(
            select(AdminLog)
            .order_by(AdminLog.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
