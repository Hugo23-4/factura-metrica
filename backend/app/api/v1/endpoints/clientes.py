from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import ClienteAutonomo
from app.schemas.cliente import ClienteCreate, ClienteResponse

router = APIRouter()


@router.get("/clientes", response_model=List[ClienteResponse])
def listar_clientes(
    asesoria_id: Optional[str] = Query(None, description="Filtrar por asesoría"),
    db: Session = Depends(get_db),
):
    """Obtiene la cartera de autónomos gestionados por la asesoría."""
    query = db.query(ClienteAutonomo)
    if asesoria_id:
        query = query.filter(ClienteAutonomo.asesoria_id == asesoria_id)
    clientes = query.all()
    return [
        ClienteResponse(
            id=c.id,
            usuarioId=c.usuario_id,
            asesoriaId=c.asesoria_id,
            nif=c.nif,
            nombreFiscal=c.nombre_fiscal,
            actividadIae=c.actividad_iae,
            telefono=c.telefono,
            domicilioFiscal=c.domicilio_fiscal,
            fechaAlta=c.fecha_alta.isoformat() if c.fecha_alta else "",
        )
        for c in clientes
    ]


@router.post("/clientes", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def crear_cliente(
    cliente_in: ClienteCreate,
    db: Session = Depends(get_db),
):
    """Registra un nuevo autónomo en la cartera de la asesoría."""
    existente = db.query(ClienteAutonomo).filter(ClienteAutonomo.nif == cliente_in.nif).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ya existe un autónomo con este NIF")

    nuevo_cliente = ClienteAutonomo(
        usuario_id=cliente_in.usuarioId,
        asesoria_id=cliente_in.asesoriaId,
        nif=cliente_in.nif,
        nombre_fiscal=cliente_in.nombreFiscal,
        actividad_iae=cliente_in.actividadIae,
        telefono=cliente_in.telefono,
        domicilio_fiscal=cliente_in.domicilioFiscal,
    )
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)

    return ClienteResponse(
        id=nuevo_cliente.id,
        usuarioId=nuevo_cliente.usuario_id,
        asesoriaId=nuevo_cliente.asesoria_id,
        nif=nuevo_cliente.nif,
        nombreFiscal=nuevo_cliente.nombre_fiscal,
        actividadIae=nuevo_cliente.actividad_iae,
        telefono=nuevo_cliente.telefono,
        domicilioFiscal=nuevo_cliente.domicilio_fiscal,
        fechaAlta=nuevo_cliente.fecha_alta.isoformat() if nuevo_cliente.fecha_alta else "",
    )
