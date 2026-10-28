from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import ClienteAutonomo, Usuario
from app.schemas.cliente import ClienteCreate, ClienteResponse, ClienteUpdate

router = APIRouter()


def mapear_cliente_a_response(c: ClienteAutonomo) -> ClienteResponse:
    activo = c.usuario.activo if c.usuario else True
    return ClienteResponse(
        id=c.id,
        usuarioId=c.usuario_id,
        asesoriaId=c.asesoria_id,
        nif=c.nif,
        nombreFiscal=c.nombre_fiscal,
        actividadIae=c.actividad_iae,
        telefono=c.telefono,
        domicilioFiscal=c.domicilio_fiscal,
        activo=activo,
        fechaAlta=c.fecha_alta.isoformat() if c.fecha_alta else "",
    )


@router.get("/clientes", response_model=List[ClienteResponse])
def listar_clientes(
    asesoria_id: Optional[str] = Query(None, description="Filtrar por asesoría"),
    activo: Optional[bool] = Query(None, description="Filtrar por activos o pausados"),
    db: Session = Depends(get_db),
):
    """Obtiene la cartera de autónomos gestionados por la asesoría."""
    query = db.query(ClienteAutonomo)
    if asesoria_id:
        query = query.filter(ClienteAutonomo.asesoria_id == asesoria_id)
    if activo is not None:
        query = query.join(Usuario, ClienteAutonomo.usuario_id == Usuario.id).filter(Usuario.activo == activo)

    clientes = query.all()
    return [mapear_cliente_a_response(c) for c in clientes]


@router.get("/clientes/{cliente_id}", response_model=ClienteResponse)
def obtener_cliente(cliente_id: str, db: Session = Depends(get_db)):
    """Obtiene el detalle de un cliente autónomo."""
    cliente = db.query(ClienteAutonomo).filter(ClienteAutonomo.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return mapear_cliente_a_response(cliente)


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

    return mapear_cliente_a_response(nuevo_cliente)


@router.put("/clientes/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(
    cliente_id: str,
    cliente_in: ClienteUpdate,
    db: Session = Depends(get_db),
):
    """Edita los datos del autónomo o pausa/reactiva su acceso."""
    cliente = db.query(ClienteAutonomo).filter(ClienteAutonomo.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if cliente_in.nombreFiscal is not None:
        cliente.nombre_fiscal = cliente_in.nombreFiscal
    if cliente_in.actividadIae is not None:
        cliente.actividad_iae = cliente_in.actividadIae
    if cliente_in.telefono is not None:
        cliente.telefono = cliente_in.telefono
    if cliente_in.domicilioFiscal is not None:
        cliente.domicilio_fiscal = cliente_in.domicilioFiscal

    if cliente_in.activo is not None and cliente.usuario:
        cliente.usuario.activo = cliente_in.activo

    db.commit()
    db.refresh(cliente)
    return mapear_cliente_a_response(cliente)


@router.delete("/clientes/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_cliente(cliente_id: str, db: Session = Depends(get_db)):
    """Elimina al cliente autónomo y su usuario asociado (baja definitiva)."""
    cliente = db.query(ClienteAutonomo).filter(ClienteAutonomo.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    usuario = cliente.usuario
    db.delete(cliente)
    if usuario:
        db.delete(usuario)
    db.commit()
    return None
