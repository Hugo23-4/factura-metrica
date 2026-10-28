from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class FormatoExportacionEnum(str, Enum):
    CSV = "CSV"
    JSON = "JSON"


class AsientoExportado(BaseModel):
    fecha: str
    nifCliente: str
    cliente: str
    nifEmisor: str
    emisor: str
    cuentaPgc: str
    descripcionCuenta: str
    categoria: str
    baseImponible: float
    tipoIva: int
    cuotaIva: float
    ivaDeducible: float
    baseDeducibleIrpf: float
    total: float
    justificacion: str = ""

    model_config = ConfigDict(from_attributes=True)


class ExportacionCreate(BaseModel):
    asesoriaId: str = Field(..., description="ID de la asesoría")
    trimestre: int = Field(..., ge=1, le=4, description="Trimestre fiscal (1, 2, 3 o 4)")
    anio: int = Field(..., ge=2020, le=2035, description="Año fiscal (ej. 2026)")
    formato: FormatoExportacionEnum = Field(FormatoExportacionEnum.CSV, description="Formato del fichero")
    clienteId: Optional[str] = Field(None, description="Filtrar por cliente específico o todos si se omite")


class ExportacionResponse(BaseModel):
    id: str
    asesoriaId: str
    trimestre: int
    anio: int
    formato: str
    numAsientos: int
    totalImporte: float
    createdAt: str

    model_config = ConfigDict(from_attributes=True)


class ExportacionDetalleResponse(ExportacionResponse):
    asientos: List[AsientoExportado]
    contenido: Optional[str] = None
