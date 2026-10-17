from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import ocr, gastos, clientes
from app.db.base import Base
from app.db.session import engine
import app.models  # noqa: F401

# Inicializar tablas de la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rutas API v1
app.include_router(ocr.router, prefix=settings.API_V1_STR, tags=["OCR Comprobantes"])
app.include_router(gastos.router, prefix=settings.API_V1_STR, tags=["Gastos & Reglas Fiscales"])
app.include_router(clientes.router, prefix=settings.API_V1_STR, tags=["Clientes Autónomos"])


@app.get("/health", tags=["Estado"])
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }
