# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
# 1. Run Alembic migrations to create/update all database tables
# 2. Seed the database with default admin user and categories
# 3. Start FastAPI with Uvicorn (no --reload in production)
CMD ["sh", "-c", "alembic upgrade head && python -c 'import asyncio; from app.db.session import async_session_factory; from app.db.init_db import init_db; asyncio.run(init_db(async_session_factory()))' && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
