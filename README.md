# Ad-Tech Billboard Platform

A scalable, production-ready SaaS for digital billboard booking.

## Features
- Modular Monolith Architecture (FastAPI + React)
- Async Database Ops (SQLAlchemy 2.0 + PostgreSQL)
- Premium UI (TailwindCSS + Glassmorphism)
- RBAC (Admin, Owner, Advertiser)
- Advanced Booking Engine with Overlap Detection
- Real-time Analytics & Audit Logs

## Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Run `make up` (Docker)
4. Run `make migrate`
5. Run `make seed`

## Technology Stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, Alembic, Pydantic
- **Frontend**: React 18, Vite, TailwindCSS, Recharts
- **Infrastructure**: Docker, Nginx, PostgreSQL
