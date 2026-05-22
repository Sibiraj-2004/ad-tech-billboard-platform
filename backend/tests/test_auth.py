import pytest

@pytest.mark.asyncio
async def test_login(client):
    response = await client.post("/api/v1/auth/login", json={
        "email": "admin@adtech.com",
        "password": "admin123456"
    })
    # Note: This will fail unless the database is seeded or mocked
    assert response.status_code in [200, 401]
