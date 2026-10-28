from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

PATRON_EMAIL = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class LoginRequest(BaseModel):
    email: str = Field(..., pattern=PATRON_EMAIL, description="Correo electrónico del usuario")
    password: str = Field(..., min_length=6, description="Contraseña")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuarioId: str
    email: str
    nombre: str
    rol: str
    asesoriaId: str
    clienteId: Optional[str] = None


class RegistroRequest(BaseModel):
    email: str = Field(..., pattern=PATRON_EMAIL, description="Correo del autónomo")
    password: str = Field(..., min_length=8, description="Contraseña de al menos 8 caracteres")
    nombre: str = Field(..., min_length=3, description="Nombre de pila")
    apellidos: Optional[str] = Field(None, description="Apellidos")
    codigoInvitacion: str = Field(..., description="Código de invitación de la asesoría (ej. ALB2026)")
    nif: str = Field(..., description="NIF o NIE del autónomo")
    nombreFiscal: Optional[str] = Field(None, description="Nombre fiscal (si difiere del personal)")
    actividadIae: Optional[str] = Field(None, description="Epígrafe o actividad económica")
    telefono: Optional[str] = Field(None, description="Teléfono de contacto")
    domicilioFiscal: Optional[str] = Field(None, description="Domicilio fiscal")


class UsuarioResponse(BaseModel):
    id: str
    email: str
    rol: str
    nombre: str
    apellidos: Optional[str] = None
    activo: bool
    asesoriaId: str
    createdAt: str

    model_config = ConfigDict(from_attributes=True)


class AsesoriaResponse(BaseModel):
    id: str
    cif: str
    razonSocial: str
    emailContacto: str
    telefono: Optional[str] = None
    codigoInvitacion: str
    activo: bool

    model_config = ConfigDict(from_attributes=True)
