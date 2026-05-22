import pytest
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session_factory
from app.main import app
from httpx import AsyncClient, ASGITransport

@pytest.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session

@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
