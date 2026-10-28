import json
import re
from typing import List, Tuple
from app.models.entities import Gasto
from app.schemas.exportacion import AsientoExportado

CUENTAS_PGC_NOMBRES = {
    "629": "Otros servicios",
    "628": "Suministros",
    "627": "Publicidad, propaganda y relaciones públicas",
    "623": "Servicios de profesionales independientes",
    "602": "Compras de otros aprovisionamientos",
}

CATEGORIAS_NOMBRES = {
    "material_oficina": "Material de oficina",
    "combustible": "Combustible",
    "restauracion": "Restauración y dietas",
    "suministros": "Suministros (luz, agua, internet)",
    "servicios_profesionales": "Servicios profesionales",
    "multas": "Multas y sanciones",
    "otros": "Otros gastos",
}

COLUMNAS = [
    ("fecha", "Fecha"),
    ("nifCliente", "NIF cliente"),
    ("cliente", "Cliente"),
    ("nifEmisor", "NIF emisor"),
    ("emisor", "Emisor"),
    ("cuentaPgc", "Cuenta PGC"),
    ("descripcionCuenta", "Descripción cuenta"),
    ("categoria", "Categoría"),
    ("baseImponible", "Base imponible"),
    ("tipoIva", "Tipo IVA"),
    ("cuotaIva", "Cuota IVA"),
    ("ivaDeducible", "IVA deducible"),
    ("baseDeducibleIrpf", "Base deducible IRPF"),
    ("total", "Total"),
    ("justificacion", "Justificación"),
]


def calcular_deducibilidad(gasto: Gasto) -> Tuple[float, float]:
    """Calcula la base deducible de IRPF y la cuota de IVA deducible."""
    if gasto.estado_semaforo == "rojo" or gasto.categoria == "multas":
        return 0.0, 0.0

    pct_iva = 1.0
    pct_irpf = 1.0

    if gasto.categoria == "combustible":
        pct_iva = 0.5
        pct_irpf = 0.5
    elif gasto.categoria == "restauracion":
        # Límite manutención España (art. 30.5 LIRPF) 26.67 €/día
        base_limite = min(gasto.base_imponible, 26.67)
        iva_ded = round((base_limite * gasto.tipo_iva) / 100.0, 2)
        return round(base_limite, 2), iva_ded

    base_deducible = round(gasto.base_imponible * pct_irpf, 2)
    iva_deducible = round(gasto.cuota_iva * pct_iva, 2)
    return base_deducible, iva_deducible


def convertir_gastos_a_asientos(gastos: List[Gasto]) -> List[AsientoExportado]:
    """Transforma las entidades Gasto en asientos contables normalizados."""
    asientos: List[AsientoExportado] = []
    for g in gastos:
        base_ded, iva_ded = calcular_deducibilidad(g)
        nombre_cliente = ""
        nif_cliente = ""
        if g.cliente:
            nombre_cliente = g.cliente.nombre_fiscal
            nif_cliente = g.cliente.nif

        justificacion_texto = ""
        if g.justificacion and g.justificacion.motivo_profesional:
            justificacion_texto = g.justificacion.motivo_profesional

        asiento = AsientoExportado(
            fecha=g.fecha_emision.strftime("%Y-%m-%d") if g.fecha_emision else "",
            nifCliente=nif_cliente,
            cliente=nombre_cliente,
            nifEmisor=g.nif_emisor or "",
            emisor=g.razon_social_emisor or "",
            cuentaPgc=g.cuenta_pgc or "629",
            descripcionCuenta=CUENTAS_PGC_NOMBRES.get(g.cuenta_pgc or "629", "Gastos diversos"),
            categoria=CATEGORIAS_NOMBRES.get(g.categoria, g.categoria),
            baseImponible=round(g.base_imponible, 2),
            tipoIva=g.tipo_iva,
            cuotaIva=round(g.cuota_iva, 2),
            ivaDeducible=iva_ded,
            baseDeducibleIrpf=base_ded,
            total=round(g.total, 2),
            justificacion=justificacion_texto,
        )
        asientos.append(asiento)
    return asientos


def generar_csv(asientos: List[AsientoExportado]) -> str:
    """Genera archivo CSV compatible con Excel y ERPs españoles (delimitador ';', coma decimal y BOM UTF-8)."""
    def formatear_celda(valor) -> str:
        if isinstance(valor, float):
            texto = f"{valor:.2f}".replace(".", ",")
        else:
            texto = str(valor)
        if re.search(r'[;"\n\r]', texto):
            escapado = texto.replace('"', '""')
            return f'"{escapado}"'
        return texto

    cabecera = ";".join(titulo for _, titulo in COLUMNAS)
    filas = []
    for a in asientos:
        fila = []
        for clave, _ in COLUMNAS:
            val = getattr(a, clave)
            if clave == "tipoIva":
                fila.append(str(val))
            else:
                fila.append(formatear_celda(val))
        filas.append(";".join(fila))

    # \ufeff es el Byte Order Mark (BOM) UTF-8
    return "\ufeff" + "\r\n".join([cabecera] + filas)


def generar_json(asientos: List[AsientoExportado], metadatos: dict) -> str:
    """Genera representación JSON para consumo de ERPs por API."""
    data = {
        **metadatos,
        "asientos": [a.model_dump() for a in asientos],
    }
    return json.dumps(data, indent=2, ensure_ascii=False)
