from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import Asesoria
from app.schemas.auth import AsesoriaResponse

router = APIRouter()


@router.get("/asesorias", response_model=List[AsesoriaResponse])
def listar_asesorias(db: Session = Depends(get_db)):
    """Lista las asesorías activas registradas en la plataforma."""
    asesorias = db.query(Asesoria).filter(Asesoria.activo == True).all()  # noqa: E712
    return [
        AsesoriaResponse(
            id=a.id,
            cif=a.cif,
            razonSocial=a.razon_social,
            emailContacto=a.email_contacto,
            telefono=a.telefono,
            codigoInvitacion=a.codigo_invitacion,
            activo=a.activo,
        )
        for a in asesorias
    ]


@router.get("/asesorias/verificar-codigo/{codigo}", response_model=AsesoriaResponse)
def verificar_codigo_invitacion(codigo: str, db: Session = Depends(get_db)):
    """Verifica si un código de invitación de asesoría es válido para el registro de clientes."""
    codigo_limpio = codigo.strip().upper()
    asesoria = db.query(Asesoria).filter(
        Asesoria.codigo_invitacion == codigo_limpio,
        Asesoria.activo == True,  # noqa: E712
    ).first()
    if not asesoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código de invitación no encontrado o asesoría inactiva",
        )
    return AsesoriaResponse(
        id=asesoria.id,
        cif=asesoria.cif,
        razonSocial=asesoria.razon_social,
        emailContacto=asesoria.email_contacto,
        telefono=asesoria.telefono,
        codigoInvitacion=asesoria.codigo_invitacion,
        activo=asesoria.activo,
    )

