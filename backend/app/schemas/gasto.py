from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.comprobante import CategoriaEnum, TipoDocumentoEnum


class JustificacionCreate(BaseModel):
    motivoProfesional: str = Field(..., description="Justificación contextual o motivo profesional")
    nifClienteReunion: Optional[str] = Field(None, description="NIF del cliente/proveedor si aplica")
    nombreClienteReunion: Optional[str] = Field(None, description="Nombre de la empresa o cliente")


class JustificacionResponse(BaseModel):
    id: str
    motivoProfesional: str
    nifClienteReunion: Optional[str] = None
    nombreClienteReunion: Optional[str] = None
    fechaRegistro: str

    model_config = ConfigDict(from_attributes=True)


class RevisionCreate(BaseModel):
    decision: str = Field(..., description="aprobado o rechazado")
    comentario: Optional[str] = Field(None, description="Observaciones del gestor")
    cuentaPgcRectificada: Optional[str] = Field(None, description="Subcuenta rectificada si aplica")


class GastoCreate(BaseModel):
    clienteId: str
    asesoriaId: str
    fechaEmision: str
    nifEmisor: Optional[str] = None
    razonSocialEmisor: str
    nifReceptor: Optional[str] = None
    baseImponible: float
    tipoIva: int = 21
    cuotaIva: Optional[float] = None
    total: Optional[float] = None
    categoria: CategoriaEnum
    cuentaPgc: str = "629"
    tipoDocumento: TipoDocumentoEnum = TipoDocumentoEnum.ticket
    hashSha256: Optional[str] = None
    urlDocumento: Optional[str] = None


class GastoUpdate(BaseModel):
    fechaEmision: Optional[str] = None
    nifEmisor: Optional[str] = None
    razonSocialEmisor: Optional[str] = None
    nifReceptor: Optional[str] = None
    baseImponible: Optional[float] = None
    tipoIva: Optional[int] = None
    cuotaIva: Optional[float] = None
    total: Optional[float] = None
    categoria: Optional[CategoriaEnum] = None
    cuentaPgc: Optional[str] = None
    tipoDocumento: Optional[TipoDocumentoEnum] = None


class GastoResponse(BaseModel):
    id: str
    clienteId: str
    asesoriaId: str
    fechaEmision: str
    nifEmisor: Optional[str] = None
    razonSocialEmisor: str
    nifReceptor: Optional[str] = None
    baseImponible: float
    tipoIva: int
    cuotaIva: float
    total: float
    categoria: str
    cuentaPgc: str
    tipoDocumento: str
    estadoSemaforo: str
    motivoRiesgo: Optional[str] = None
    hashSha256: Optional[str] = None
    urlDocumento: Optional[str] = None
    justificacion: Optional[JustificacionResponse] = None
    createdAt: str

    model_config = ConfigDict(from_attributes=True)
