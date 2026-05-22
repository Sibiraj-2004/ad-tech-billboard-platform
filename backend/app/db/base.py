"""
SQLAlchemy Declarative Base
============================
Central base class for all ORM models. Every model inherits from this base
so that Alembic can auto-discover all tables for migrations.
"""

from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models.
    All models inherit from this to share metadata and
    be auto-discovered by Alembic.
    """
    pass
