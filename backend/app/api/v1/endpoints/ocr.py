from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from app.schemas.comprobante import DatosExtraidosResponse, TipoDocumentoEnum
from app.services.ocr_engine import procesar_documento

router = APIRouter()


@router.post("/comprobantes/ocr", response_model=DatosExtraidosResponse)
async def procesar_comprobante_ocr(
    archivo: UploadFile = File(...),
    tipo_documento: str = Form(...),
):
    try:
        tipo_enum = TipoDocumentoEnum(tipo_documento)
    except ValueError:
        tipo_enum = TipoDocumentoEnum.ticket

    contenido = await archivo.read()
    if not contenido:
        raise HTTPException(status_code=400, detail="El archivo está vacío")

    datos = procesar_documento(
        archivo_bytes=contenido,
        nombre_archivo=archivo.filename or "comprobante",
        tipo_documento=tipo_enum,
    )
    return datos
