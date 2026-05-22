import pytest

@pytest.mark.asyncio
async def test_get_billboards(client):
    response = await client.get("/api/v1/billboards")
    assert response.status_code == 200
    assert "data" in response.json()
