from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class CategoriaEnum(str, Enum):
    restauracion = "restauracion"
    combustible = "combustible"
    alojamiento = "alojamiento"
    transporte = "transporte"
    material_oficina = "material_oficina"
    suministros = "suministros"
    servicios_profesionales = "servicios_profesionales"
    publicidad = "publicidad"
    otros = "otros"
    multas = "multas"
    consumo_personal = "consumo_personal"


class TipoDocumentoEnum(str, Enum):
    ticket = "ticket"
    factura_pdf = "factura_pdf"
    factura_imagen = "factura_imagen"


class DatosExtraidosResponse(BaseModel):
    fechaEmision: str = Field(..., description="Fecha de emisión en formato ISO 8601")
    nifEmisor: Optional[str] = Field(None, description="NIF/CIF del emisor")
    razonSocialEmisor: str = Field(..., description="Nombre comercial o razón social")
    nifReceptor: Optional[str] = Field(None, description="NIF/CIF del receptor si consta")
    baseImponible: float = Field(..., description="Base imponible")
    tipoIva: int = Field(..., description="Porcentaje de IVA (0, 4, 10, 21)")
    cuotaIva: float = Field(..., description="Importe de la cuota de IVA")
    total: float = Field(..., description="Importe total del comprobante")
    categoria: CategoriaEnum = Field(..., description="Categoría fiscal del gasto")
    tipoDocumento: TipoDocumentoEnum = Field(..., description="Tipo de documento")


class EvaluacionFiscalResponse(BaseModel):
    semaforo: str = Field(..., description="verde, amarillo o rojo")
    cuentaPgc: str = Field(..., description="Subcuenta del PGC asignada")
    motivoRiesgo: Optional[str] = None
    preguntaAsesor: Optional[str] = None
