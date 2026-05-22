"""
Base Repository
================
Generic CRUD operations that all repositories inherit.
Eliminates boilerplate — each specific repository only needs
to add domain-specific queries.
"""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar
from uuid import UUID

from sqlalchemy import func, select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base

# Generic type variable for the model class
ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Generic CRUD repository.

    Usage:
        class UserRepository(BaseRepository[User]):
            def __init__(self, db: AsyncSession):
                super().__init__(User, db)
    """

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        """Get a single record by its primary key."""
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
    ) -> List[ModelType]:
        """Get all records with pagination."""
        result = await self.db.execute(
            select(self.model)
            .offset(skip)
            .limit(limit)
            .order_by(self.model.created_at.desc())
        )
        return list(result.scalars().all())

    async def count(self) -> int:
        """Get total count of records."""
        result = await self.db.execute(
            select(func.count()).select_from(self.model)
        )
        return result.scalar_one()

    async def create(self, obj_data: Dict[str, Any]) -> ModelType:
        """Create a new record from a dictionary."""
        db_obj = self.model(**obj_data)
        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, id: UUID, obj_data: Dict[str, Any]) -> Optional[ModelType]:
        """Update a record by ID with the provided fields."""
        # Remove None values to only update provided fields
        update_data = {k: v for k, v in obj_data.items() if v is not None}
        if not update_data:
            return await self.get_by_id(id)

        await self.db.execute(
            update(self.model)
            .where(self.model.id == id)
            .values(**update_data)
        )
        await self.db.flush()
        return await self.get_by_id(id)

    async def delete(self, id: UUID) -> bool:
        """Delete a record by ID. Returns True if found and deleted."""
        result = await self.db.execute(
            delete(self.model).where(self.model.id == id)
        )
        await self.db.flush()
        return result.rowcount > 0
