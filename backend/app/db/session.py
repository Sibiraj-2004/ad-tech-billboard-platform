"""
Database Session Management
============================
Provides async engine and session factory for the application.
Uses asyncpg as the async PostgreSQL driver.

Architecture Decision:
- Async sessions allow FastAPI to handle concurrent DB operations
  without blocking the event loop.
- Connection pooling (pool_size=20, max_overflow=10) prevents
  database connection exhaustion under load.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings

settings = get_settings()

# ── Async Engine ─────────────────────────────────────────────
# pool_pre_ping: Tests connections before use (handles stale connections)
# pool_size: Number of persistent connections in the pool
# max_overflow: Extra connections allowed beyond pool_size under load
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
)

# ── Session Factory ──────────────────────────────────────────
# expire_on_commit=False: Prevents lazy-load errors after commit
# in async context where implicit IO is not allowed
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """
    Dependency that provides a database session.
    Used via FastAPI's Depends() system.

    Usage:
        @router.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
