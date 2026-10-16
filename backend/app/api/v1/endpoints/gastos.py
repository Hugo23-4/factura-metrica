from fastapi import APIRouter
from app.schemas.comprobante import DatosExtraidosResponse, EvaluacionFiscalResponse
from app.services.fiscal import evaluar_gasto

router = APIRouter()


@router.post("/gastos/evaluar", response_model=EvaluacionFiscalResponse)
async def evaluar_gasto_fiscal(datos: DatosExtraidosResponse):
    return evaluar_gasto(datos)
