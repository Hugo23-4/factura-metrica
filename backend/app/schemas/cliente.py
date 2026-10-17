from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ClienteCreate(BaseModel):
    usuarioId: str
    asesoriaId: str
    nif: str = Field(..., description="NIF o NIE del autónomo")
    nombreFiscal: str = Field(..., description="Nombre completo o razón social")
    actividadIae: Optional[str] = Field(None, description="Epígrafe del IAE o actividad")
    telefono: Optional[str] = None
    domicilioFiscal: Optional[str] = None


class ClienteResponse(BaseModel):
    id: str
    usuarioId: str
    asesoriaId: str
    nif: str
    nombreFiscal: str
    actividadIae: Optional[str] = None
    telefono: Optional[str] = None
    domicilioFiscal: Optional[str] = None
    fechaAlta: str

    model_config = ConfigDict(from_attributes=True)
