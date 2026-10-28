from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import Asesoria, ExportacionContable, Gasto
from app.schemas.exportacion import (
    ExportacionCreate,
    ExportacionDetalleResponse,
    ExportacionResponse,
    FormatoExportacionEnum,
)
from app.services.exportacion_engine import (
    convertir_gastos_a_asientos,
    generar_csv,
    generar_json,
)

router = APIRouter()

MESES_TRIMESTRE = {
    1: [1, 2, 3],
    2: [4, 5, 6],
    3: [7, 8, 9],
    4: [10, 11, 12],
}


@router.post("/exportaciones", response_model=ExportacionDetalleResponse, status_code=status.HTTP_201_CREATED)
def crear_exportacion(
    exp_in: ExportacionCreate,
    db: Session = Depends(get_db),
):
    """Genera un nuevo lote de exportación contable (RF-11 / CU-08) para el trimestre especificado."""
    asesoria = db.query(Asesoria).filter(Asesoria.id == exp_in.asesoriaId).first()
    if not asesoria:
        raise HTTPException(status_code=404, detail="Asesoría no encontrada")

    meses = MESES_TRIMESTRE.get(exp_in.trimestre)
    if not meses:
        raise HTTPException(status_code=400, detail="Trimestre inválido (debe ser de 1 a 4)")

    query = db.query(Gasto).filter(
        Gasto.asesoria_id == exp_in.asesoriaId,
        extract("year", Gasto.fecha_emision) == exp_in.anio,
        extract("month", Gasto.fecha_emision).in_(meses),
        Gasto.estado_semaforo != "rojo",
    )
    if exp_in.clienteId:
        query = query.filter(Gasto.cliente_id == exp_in.clienteId)

    gastos = query.order_by(Gasto.fecha_emision.asc()).all()

    asientos = convertir_gastos_a_asientos(gastos)
    total_importe = sum(a.total for a in asientos)

    # Persistir en la base de datos el registro del lote
    nueva_exp = ExportacionContable(
        asesoria_id=exp_in.asesoriaId,
        trimestre=exp_in.trimestre,
        anio=exp_in.anio,
        formato=exp_in.formato.value,
        num_asientos=len(asientos),
        total_importe=round(total_importe, 2),
    )
    db.add(nueva_exp)
    db.commit()
    db.refresh(nueva_exp)

    metadatos = {
        "exportacionId": nueva_exp.id,
        "asesoriaCif": asesoria.cif,
        "asesoriaRazonSocial": asesoria.razon_social,
        "trimestre": f"{exp_in.trimestre}T",
        "anio": exp_in.anio,
        "numAsientos": len(asientos),
        "totalImporte": round(total_importe, 2),
        "fechaGeneracion": nueva_exp.created_at.isoformat() if nueva_exp.created_at else datetime.now().isoformat(),
    }

    if exp_in.formato == FormatoExportacionEnum.JSON:
        contenido = generar_json(asientos, metadatos)
    else:
        contenido = generar_csv(asientos)

    return ExportacionDetalleResponse(
        id=nueva_exp.id,
        asesoriaId=nueva_exp.asesoria_id,
        trimestre=nueva_exp.trimestre,
        anio=nueva_exp.anio,
        formato=nueva_exp.formato,
        numAsientos=nueva_exp.num_asientos,
        totalImporte=nueva_exp.total_importe,
        createdAt=nueva_exp.created_at.isoformat() if nueva_exp.created_at else "",
        asientos=asientos,
        contenido=contenido,
    )


@router.get("/exportaciones", response_model=List[ExportacionResponse])
def listar_exportaciones(
    asesoria_id: Optional[str] = Query(None, description="Filtrar por asesoría"),
    db: Session = Depends(get_db),
):
    """Consulta el historial de lotes de exportación contable generados."""
    query = db.query(ExportacionContable)
    if asesoria_id:
        query = query.filter(ExportacionContable.asesoria_id == asesoria_id)

    lotes = query.order_by(ExportacionContable.created_at.desc()).all()
    return [
        ExportacionResponse(
            id=l.id,
            asesoriaId=l.asesoria_id,
            trimestre=l.trimestre,
            anio=l.anio,
            formato=l.formato,
            numAsientos=l.num_asientos,
            totalImporte=l.total_importe,
            createdAt=l.created_at.isoformat() if l.created_at else "",
        )
        for l in lotes
    ]


@router.get("/exportaciones/{exportacion_id}", response_model=ExportacionResponse)
def obtener_exportacion(
    exportacion_id: str,
    db: Session = Depends(get_db),
):
    """Obtiene el resumen de un lote de exportación."""
    lote = db.query(ExportacionContable).filter(ExportacionContable.id == exportacion_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote de exportación no encontrado")

    return ExportacionResponse(
        id=lote.id,
        asesoriaId=lote.asesoria_id,
        trimestre=lote.trimestre,
        anio=lote.anio,
        formato=lote.formato,
        numAsientos=lote.num_asientos,
        totalImporte=lote.total_importe,
        createdAt=lote.created_at.isoformat() if lote.created_at else "",
    )


@router.get("/exportaciones/{exportacion_id}/descargar")
def descargar_archivo_exportacion(
    exportacion_id: str,
    db: Session = Depends(get_db),
):
    """Descarga el fichero contable generado (.csv o .json) con los encabezados HTTP apropiados."""
    lote = db.query(ExportacionContable).filter(ExportacionContable.id == exportacion_id).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote de exportación no encontrado")

    meses = MESES_TRIMESTRE.get(lote.trimestre, [])
    gastos = db.query(Gasto).filter(
        Gasto.asesoria_id == lote.asesoria_id,
        extract("year", Gasto.fecha_emision) == lote.anio,
        extract("month", Gasto.fecha_emision).in_(meses),
        Gasto.estado_semaforo != "rojo",
    ).order_by(Gasto.fecha_emision.asc()).all()

    asientos = convertir_gastos_a_asientos(gastos)
    nombre_archivo = f"asientos_{lote.anio}_{lote.trimestre}T.{lote.formato.lower()}"

    if lote.formato.upper() == "JSON":
        contenido = generar_json(asientos, {"loteId": lote.id, "trimestre": lote.trimestre, "anio": lote.anio})
        media_type = "application/json; charset=utf-8"
    else:
        contenido = generar_csv(asientos)
        media_type = "text/csv; charset=utf-8"

    headers = {
        "Content-Disposition": f'attachment; filename="{nombre_archivo}"',
    }
    return Response(content=contenido, media_type=media_type, headers=headers)
