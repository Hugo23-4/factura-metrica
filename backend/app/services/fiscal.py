import re
from datetime import date, datetime
from typing import Optional, Tuple
from app.schemas.comprobante import CategoriaEnum, DatosExtraidosResponse, EvaluacionFiscalResponse

LETRAS_DNI = "TRWAGMYFPDXBNJZSQVHLCKE"
LIMITE_FACTURA_SIMPLIFICADA = 400.0
LIMITE_MANUTENCION_DIA = 26.67

CUENTAS_PGC = {
    CategoriaEnum.restauracion: "629",
    CategoriaEnum.combustible: "628",
    CategoriaEnum.alojamiento: "629",
    CategoriaEnum.transporte: "624",
    CategoriaEnum.material_oficina: "602",
    CategoriaEnum.suministros: "628",
    CategoriaEnum.servicios_profesionales: "623",
    CategoriaEnum.publicidad: "627",
    CategoriaEnum.otros: "629",
    CategoriaEnum.multas: "678",
    CategoriaEnum.consumo_personal: "—",
}

FESTIVOS_FIJOS = [
    (1, 1),
    (1, 6),
    (5, 1),
    (8, 15),
    (10, 12),
    (11, 1),
    (12, 6),
    (12, 8),
    (12, 25),
]


def domingo_de_pascua(anio: int) -> date:
    a = anio % 19
    b = anio // 100
    c = anio % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    mes = (h + l - 7 * m + 114) // 31
    dia = ((h + l - 7 * m + 114) % 31) + 1
    return date(anio, mes, dia)


def es_festivo_nacional(dt: date) -> bool:
    if (dt.month, dt.day) in FESTIVOS_FIJOS:
        return True
    pascua = domingo_de_pascua(dt.year)
    # Viernes Santo es 2 días antes del Domingo de Pascua
    from datetime import timedelta
    viernes_santo = pascua - timedelta(days=2)
    return dt == viernes_santo


def es_nif_valido(valor: Optional[str]) -> bool:
    if not valor:
        return False
    nif = re.sub(r"[\s-]", "", valor.upper())
    if re.match(r"^\d{8}[A-Z]$", nif):
        return LETRAS_DNI[int(nif[:8]) % 23] == nif[8]
    if re.match(r"^[XYZ]\d{7}[A-Z]$", nif):
        mapping = {"X": "0", "Y": "1", "Z": "2"}
        numero = mapping[nif[0]] + nif[1:8]
        return LETRAS_DNI[int(numero) % 23] == nif[8]
    return bool(re.match(r"^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$", nif))


def evaluar_gasto(datos: DatosExtraidosResponse) -> EvaluacionFiscalResponse:
    cuenta_pgc = CUENTAS_PGC.get(datos.categoria, "629")
    try:
        dt = datetime.fromisoformat(datos.fechaEmision.replace("Z", "+00:00"))
        d_date = dt.date()
    except Exception:
        d_date = date.today()
        dt = datetime.now()

    # 1. Error de lectura
    if not datos.nifEmisor or not es_nif_valido(datos.nifEmisor) or datos.total <= 0:
        return EvaluacionFiscalResponse(
            semaforo="amarillo",
            cuentaPgc=cuenta_pgc,
            motivoRiesgo="Error de lectura: no se ha podido leer un NIF válido del emisor o el importe.",
            preguntaAsesor="No encuentro el NIF del establecimiento. Corrige los datos si puedes y descríbenos la actividad.",
        )

    # 2. No afecto a la actividad (rojo)
    if datos.categoria in (CategoriaEnum.multas, CategoriaEnum.consumo_personal):
        motivo = (
            "Las multas y sanciones no son gasto deducible (art. 15 LIS)."
            if datos.categoria == CategoriaEnum.multas
            else "Los gastos de consumo personal no están afectos a la actividad y no son deducibles."
        )
        return EvaluacionFiscalResponse(
            semaforo="rojo",
            cuentaPgc=cuenta_pgc,
            motivoRiesgo=motivo,
        )

    # 3. Fin de semana o festivo nacional
    es_fin_de_semana = dt.weekday() in (5, 6)
    if es_fin_de_semana or es_festivo_nacional(d_date):
        cuando = "en fin de semana" if es_fin_de_semana else "en un día festivo"
        return EvaluacionFiscalResponse(
            semaforo="amarillo",
            cuentaPgc=cuenta_pgc,
            motivoRiesgo=f"Riesgo de fin de semana: gasto realizado {cuando}. La AEAT exige acreditar la correlación con la actividad.",
            preguntaAsesor=f"Detectamos este gasto {cuando}. ¿Con qué cliente o motivo profesional se realizó?",
        )

    # 4. Exceso de manutención
    if datos.categoria == CategoriaEnum.restauracion and datos.total > LIMITE_MANUTENCION_DIA:
        return EvaluacionFiscalResponse(
            semaforo="amarillo",
            cuentaPgc=cuenta_pgc,
            motivoRiesgo=f"Exceso de manutención: supera el límite de {LIMITE_MANUTENCION_DIA} €/día sin pernocta.",
            preguntaAsesor="Esta comida supera el límite diario de manutención. ¿Fue una reunión con clientes o proveedores?",
        )

    # 5. Falta NIF del receptor en tickets de más de 400 €
    if not datos.nifReceptor and datos.total > LIMITE_FACTURA_SIMPLIFICADA:
        return EvaluacionFiscalResponse(
            semaforo="amarillo",
            cuentaPgc=cuenta_pgc,
            motivoRiesgo=f"Falta NIF del receptor: un ticket de más de {LIMITE_FACTURA_SIMPLIFICADA} € requiere factura completa nominativa.",
            preguntaAsesor="Este importe requiere factura completa con tu NIF. Solicítala al proveedor y cuéntanos el motivo.",
        )

    # 6. Deducible sin incidencias
    return EvaluacionFiscalResponse(
        semaforo="verde",
        cuentaPgc=cuenta_pgc,
    )
