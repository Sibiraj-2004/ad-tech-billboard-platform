import pytest

@pytest.mark.asyncio
async def test_get_bookings_unauthorized(client):
    response = await client.get("/api/v1/bookings")
    assert response.status_code == 401
