from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    accounting,
    customers,
    deals,
    departments,
    documents,
    employees,
    kpi,
    partners,
    properties,
    tenants,
)

app = FastAPI(
    title=settings.app_name,
    description="不動産業向け統合業務管理システム API（マルチテナント対応）",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tenants.router)
app.include_router(properties.router)
app.include_router(customers.router)
app.include_router(partners.router)
app.include_router(employees.router)
app.include_router(departments.router)
app.include_router(accounting.router)
app.include_router(deals.router)
app.include_router(kpi.router)
app.include_router(documents.router)


@app.get("/api/v1/health")
def health_check() -> dict[str, str]:
    return {"status": "healthy", "app": settings.app_name}
