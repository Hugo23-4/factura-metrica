from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import Gasto, JustificacionFiscal
from app.schemas.comprobante import DatosExtraidosResponse, EvaluacionFiscalResponse
from app.schemas.gasto import GastoCreate, GastoResponse, JustificacionCreate, JustificacionResponse, RevisionCreate
from app.services.fiscal import evaluar_gasto

router = APIRouter()


def mapear_gasto_a_response(gasto: Gasto) -> GastoResponse:
    justificacion_resp = None
    if gasto.justificacion:
        justificacion_resp = JustificacionResponse(
            id=gasto.justificacion.id,
            motivoProfesional=gasto.justificacion.motivo_profesional,
            nifClienteReunion=gasto.justificacion.nif_cliente_reunion,
            nombreClienteReunion=gasto.justificacion.nombre_cliente_reunion,
            fechaRegistro=gasto.justificacion.fecha_registro.isoformat() if gasto.justificacion.fecha_registro else "",
        )

    return GastoResponse(
        id=gasto.id,
        clienteId=gasto.cliente_id,
        asesoriaId=gasto.asesoria_id,
        fechaEmision=gasto.fecha_emision.isoformat() if gasto.fecha_emision else "",
        nifEmisor=gasto.nif_emisor,
        razonSocialEmisor=gasto.razon_social_emisor,
        nifReceptor=gasto.nif_receptor,
        baseImponible=gasto.base_imponible,
        tipoIva=gasto.tipo_iva,
        cuotaIva=gasto.cuota_iva,
        total=gasto.total,
        categoria=gasto.categoria,
        cuentaPgc=gasto.cuenta_pgc,
        tipoDocumento=gasto.tipo_documento,
        estadoSemaforo=gasto.estado_semaforo,
        motivoRiesgo=gasto.motivo_riesgo,
        hashSha256=gasto.hash_sha256,
        urlDocumento=gasto.url_documento,
        justificacion=justificacion_resp,
        createdAt=gasto.created_at.isoformat() if gasto.created_at else "",
    )


@router.post("/gastos/evaluar", response_model=EvaluacionFiscalResponse)
async def evaluar_gasto_fiscal(datos: DatosExtraidosResponse):
    """Evalúa las reglas fiscales preventivas sin persistir en base de datos."""
    return evaluar_gasto(datos)


@router.get("/gastos", response_model=List[GastoResponse])
def listar_gastos(
    cliente_id: Optional[str] = Query(None, description="Filtrar por cliente"),
    asesoria_id: Optional[str] = Query(None, description="Filtrar por asesoría"),
    estado_semaforo: Optional[str] = Query(None, description="verde, amarillo o rojo"),
    db: Session = Depends(get_db),
):
    """Consulta la lista de gastos aplicando filtros de multi-tenant y estado fiscal."""
    query = db.query(Gasto)
    if cliente_id:
        query = query.filter(Gasto.cliente_id == cliente_id)
    if asesoria_id:
        query = query.filter(Gasto.asesoria_id == asesoria_id)
    if estado_semaforo:
        query = query.filter(Gasto.estado_semaforo == estado_semaforo)

    gastos = query.order_by(Gasto.fecha_emision.desc()).all()
    return [mapear_gasto_a_response(g) for g in gastos]


@router.post("/gastos", response_model=GastoResponse, status_code=status.HTTP_201_CREATED)
def crear_gasto(
    gasto_in: GastoCreate,
    db: Session = Depends(get_db),
):
    """Registra un nuevo comprobante evaluando automáticamente su semáforo fiscal."""
    # Evaluar semáforo preventivo automáticamente
    datos_eval = DatosExtraidosResponse(
        fechaEmision=gasto_in.fechaEmision,
        nifEmisor=gasto_in.nifEmisor,
        razonSocialEmisor=gasto_in.razonSocialEmisor,
        nifReceptor=gasto_in.nifReceptor,
        baseImponible=gasto_in.baseImponible,
        tipoIva=gasto_in.tipoIva,
        cuotaIva=gasto_in.cuotaIva,
        total=gasto_in.total,
        categoria=gasto_in.categoria,
        tipoDocumento=gasto_in.tipoDocumento,
    )
    resultado = evaluar_gasto(datos_eval)

    try:
        dt_emision = datetime.fromisoformat(gasto_in.fechaEmision.replace("Z", "+00:00"))
    except Exception:
        dt_emision = datetime.now(timezone.utc)

    nuevo_gasto = Gasto(
        cliente_id=gasto_in.clienteId,
        asesoria_id=gasto_in.asesoriaId,
        fecha_emision=dt_emision,
        nif_emisor=gasto_in.nifEmisor,
        razon_social_emisor=gasto_in.razonSocialEmisor,
        nif_receptor=gasto_in.nifReceptor,
        base_imponible=gasto_in.baseImponible,
        tipo_iva=gasto_in.tipoIva,
        cuota_iva=gasto_in.cuotaIva,
        total=gasto_in.total,
        categoria=gasto_in.categoria.value,
        cuenta_pgc=resultado.cuentaPgc,
        tipo_documento=gasto_in.tipoDocumento.value,
        estado_semaforo=resultado.semaforo,
        motivo_riesgo=resultado.motivoRiesgo,
        hash_sha256=gasto_in.hashSha256,
        url_documento=gasto_in.urlDocumento,
    )
    db.add(nuevo_gasto)
    db.commit()
    db.refresh(nuevo_gasto)
    return mapear_gasto_a_response(nuevo_gasto)


@router.get("/gastos/{gasto_id}", response_model=GastoResponse)
def obtener_gasto(gasto_id: str, db: Session = Depends(get_db)):
    """Obtiene el detalle completo de un gasto con su justificación."""
    gasto = db.query(Gasto).filter(Gasto.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return mapear_gasto_a_response(gasto)


@router.post("/gastos/{gasto_id}/justificar", response_model=GastoResponse)
def justificar_gasto(
    gasto_id: str,
    just_in: JustificacionCreate,
    db: Session = Depends(get_db),
):
    """Registra la justificación del autónomo ante el Asesor Fiscal Virtual."""
    gasto = db.query(Gasto).filter(Gasto.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    if gasto.justificacion:
        gasto.justificacion.motivo_profesional = just_in.motivoProfesional
        gasto.justificacion.nif_cliente_reunion = just_in.nifClienteReunion
        gasto.justificacion.nombre_cliente_reunion = just_in.nombreClienteReunion
        gasto.justificacion.fecha_registro = datetime.now(timezone.utc)
    else:
        nueva_just = JustificacionFiscal(
            gasto_id=gasto.id,
            motivo_profesional=just_in.motivoProfesional,
            nif_cliente_reunion=just_in.nifClienteReunion,
            nombre_cliente_reunion=just_in.nombreClienteReunion,
        )
        db.add(nueva_just)

    db.commit()
    db.refresh(gasto)
    return mapear_gasto_a_response(gasto)


@router.post("/gastos/{gasto_id}/revisar", response_model=GastoResponse)
def revisar_gasto(
    gasto_id: str,
    rev_in: RevisionCreate,
    db: Session = Depends(get_db),
):
    """Acción del gestor en 1 clic: aprobar, rechazar o rectificar subcuenta PGC."""
    gasto = db.query(Gasto).filter(Gasto.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    if rev_in.decision == "aprobado":
        gasto.estado_semaforo = "verde"
        gasto.motivo_riesgo = None
    elif rev_in.decision == "rechazado":
        gasto.estado_semaforo = "rojo"
        gasto.motivo_riesgo = rev_in.comentario or "Rechazado por el asesor contable"

    if rev_in.cuentaPgcRectificada:
        gasto.cuenta_pgc = rev_in.cuentaPgcRectificada

    db.commit()
    db.refresh(gasto)
    return mapear_gasto_a_response(gasto)


@router.delete("/gastos/{gasto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_gasto(gasto_id: str, db: Session = Depends(get_db)):
    """Elimina un comprobante de gasto."""
    gasto = db.query(Gasto).filter(Gasto.id == gasto_id).first()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    db.delete(gasto)
    db.commit()
    return None
