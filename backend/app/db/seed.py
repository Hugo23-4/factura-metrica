import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.entities import Asesoria, ClienteAutonomo, Gasto, JustificacionFiscal, Usuario

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def poblar_datos_prueba(db: Session):
    """Puebla la base de datos con los datos oficiales de prueba para el tribunal."""
    logger.info("Inicializando datos de prueba en la base de datos...")

    # 1. Asesorías
    asesoria_albarregas = db.query(Asesoria).filter(Asesoria.cif == "B06123456").first()
    if not asesoria_albarregas:
        asesoria_albarregas = Asesoria(
            id="ase-albarregas-01",
            cif="B06123456",
            razon_social="Asesoría Albarregas S.L.",
            email_contacto="contacto@albarregas.test",
            telefono="924300100",
            codigo_invitacion="ALB2026",
            activo=True,
        )
        db.add(asesoria_albarregas)

    gestoria_emerita = db.query(Asesoria).filter(Asesoria.cif == "B06654321").first()
    if not gestoria_emerita:
        gestoria_emerita = Asesoria(
            id="ase-emerita-02",
            cif="B06654321",
            razon_social="Gestoría Emérita S.L.",
            email_contacto="info@emerita.test",
            telefono="924300200",
            codigo_invitacion="EMERITA",
            activo=True,
        )
        db.add(gestoria_emerita)

    db.commit()

    # 2. Usuarios Gestores
    hash_gestor = hash_password("Gestor2026!")
    hash_cliente = hash_password("Cliente2026!")

    gestores_data = [
        ("usr-gestora-laura", asesoria_albarregas.id, "laura.gestora@facturametrica.test", "Laura", "Gómez Gestora", "ADMIN"),
        ("usr-gestor-javier", asesoria_albarregas.id, "javier.gestor@facturametrica.test", "Javier", "Pérez Gestor", "ASESOR"),
        ("usr-gestora-marta", gestoria_emerita.id, "marta.gestora@facturametrica.test", "Marta", "Sánchez Gestora", "ADMIN"),
    ]

    for uid, ase_id, email, nombre, apellidos, rol in gestores_data:
        if not db.query(Usuario).filter(Usuario.email == email).first():
            usr = Usuario(
                id=uid,
                asesoria_id=ase_id,
                email=email,
                password_hash=hash_gestor,
                rol=rol,
                nombre=nombre,
                apellidos=apellidos,
                activo=True,
            )
            db.add(usr)

    # 3. Autónomos y Clientes
    autonomos_data = [
        ("usr-autonomo-carlos", "cli-carlos-01", asesoria_albarregas.id, "carlos@facturametrica.test", "Carlos", "Martínez Solís", "12345678Z", "Carlos Martínez Fontanería", "Fontanería e instalaciones", "600111222", True),
        ("usr-autonomo-ana", "cli-ana-02", asesoria_albarregas.id, "ana@facturametrica.test", "Ana", "Gómez Vega", "87654321A", "Ana Gómez Diseño Creativo", "Diseño gráfico y web", "600333444", True),
        ("usr-autonomo-pedro", "cli-pedro-03", asesoria_albarregas.id, "pedro@facturametrica.test", "Pedro", "Sánchez Silva", "45678912B", "Pedro Sánchez Dev", "Programación informática", "600555666", True),
        ("usr-autonomo-lucia", "cli-lucia-04", asesoria_albarregas.id, "lucia@facturametrica.test", "Lucía", "Vega Gil", "78912345C", "Lucía Vega Marketing", "Servicios de publicidad y RR.PP.", "600777888", True),
        ("usr-autonomo-rosa", "cli-rosa-05", asesoria_albarregas.id, "rosa@facturametrica.test", "Rosa", "Gil Carrasco", "32165498D", "Rosa Gil Abogados", "Asesoría jurídica laboral", "600999000", True),
        ("usr-autonomo-miguel", "cli-miguel-06", asesoria_albarregas.id, "miguel@facturametrica.test", "Miguel", "Ruiz Ramos", "65498732E", "Miguel Ruiz Fotografía", "Servicios fotográficos", "600222333", False),  # Pausado
    ]

    for usr_id, cli_id, ase_id, email, nombre, apellidos, nif, nombre_fiscal, actividad, tel, activo in autonomos_data:
        usr = db.query(Usuario).filter(Usuario.email == email).first()
        if not usr:
            usr = Usuario(
                id=usr_id,
                asesoria_id=ase_id,
                email=email,
                password_hash=hash_cliente,
                rol="AUTONOMO",
                nombre=nombre,
                apellidos=apellidos,
                activo=activo,
            )
            db.add(usr)
            db.flush()

        cli = db.query(ClienteAutonomo).filter(ClienteAutonomo.nif == nif).first()
        if not cli:
            cli = ClienteAutonomo(
                id=cli_id,
                usuario_id=usr.id,
                asesoria_id=ase_id,
                nif=nif,
                nombre_fiscal=nombre_fiscal,
                actividad_iae=actividad,
                telefono=tel,
                domicilio_fiscal="Calle Trajano 14, 06800 Mérida, Badajoz",
            )
            db.add(cli)

    db.commit()

    # 4. Comprobantes de gastos de ejemplo
    carlos_cli = db.query(ClienteAutonomo).filter(ClienteAutonomo.id == "cli-carlos-01").first()
    if carlos_cli and db.query(Gasto).filter(Gasto.cliente_id == carlos_cli.id).count() == 0:
        ahora = datetime.now(timezone.utc)
        gastos_carlos = [
            # Gasto Verde: Material de oficina
            Gasto(
                id="gst-carlos-01",
                cliente_id=carlos_cli.id,
                asesoria_id=asesoria_albarregas.id,
                fecha_emision=ahora - timedelta(days=5),
                nif_emisor="B06123456",
                razon_social_emisor="Papelería Albarregas S.L.",
                nif_receptor="12345678Z",
                base_imponible=45.50,
                tipo_iva=21,
                cuota_iva=9.56,
                total=55.06,
                categoria="material_oficina",
                cuenta_pgc="629",
                tipo_documento="factura_pdf",
                estado_semaforo="verde",
            ),
            # Gasto Amarillo con justificación: Restauración reunión de trabajo
            Gasto(
                id="gst-carlos-02",
                cliente_id=carlos_cli.id,
                asesoria_id=asesoria_albarregas.id,
                fecha_emision=ahora - timedelta(days=3),
                nif_emisor="B06654321",
                razon_social_emisor="Restaurante El Puente Romano",
                nif_receptor=None,
                base_imponible=58.20,
                tipo_iva=10,
                cuota_iva=5.82,
                total=64.02,
                categoria="restauracion",
                cuenta_pgc="629",
                tipo_documento="ticket",
                estado_semaforo="amarillo",
                motivo_riesgo="Gasto en horario nocturno / fin de semana o exceso de manutención diaria",
            ),
            # Gasto Amarillo: Combustible
            Gasto(
                id="gst-carlos-03",
                cliente_id=carlos_cli.id,
                asesoria_id=asesoria_albarregas.id,
                fecha_emision=ahora - timedelta(days=2),
                nif_emisor="A06987654",
                razon_social_emisor="Estación de Servicio Vía de la Plata",
                nif_receptor="12345678Z",
                base_imponible=60.00,
                tipo_iva=21,
                cuota_iva=12.60,
                total=72.60,
                categoria="combustible",
                cuenta_pgc="629",
                tipo_documento="ticket",
                estado_semaforo="amarillo",
                motivo_riesgo="El combustible requiere afectación demostrable a la actividad (deducción estándar 50%)",
            ),
            # Gasto Rojo: Multa de tráfico
            Gasto(
                id="gst-carlos-04",
                cliente_id=carlos_cli.id,
                asesoria_id=asesoria_albarregas.id,
                fecha_emision=ahora - timedelta(days=1),
                nif_emisor="P0608300J",
                razon_social_emisor="Ayuntamiento de Mérida – Policía Local",
                nif_receptor="12345678Z",
                base_imponible=100.00,
                tipo_iva=0,
                cuota_iva=0.00,
                total=100.00,
                categoria="multas",
                cuenta_pgc="629",
                tipo_documento="ticket",
                estado_semaforo="rojo",
                motivo_riesgo="Las multas y sanciones administrativas no son deducibles según el art. 15 de la LIS",
            ),
        ]
        db.add_all(gastos_carlos)
        db.flush()

        # Añadir justificación para el gasto amarillo de restaurante
        just = JustificacionFiscal(
            id="jst-carlos-01",
            gasto_id="gst-carlos-02",
            motivo_profesional="Almuerzo de trabajo con proveedor de fontanería para negociación de tarifas de tuberías de cobre",
            nombre_cliente_reunion="Distribuciones Hidráulicas del Guadiana S.L.",
            nif_cliente_reunion="B06999888",
        )
        db.add(just)
        db.commit()

    logger.info("Datos de prueba inicializados satisfactoriamente.")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        poblar_datos_prueba(session)
