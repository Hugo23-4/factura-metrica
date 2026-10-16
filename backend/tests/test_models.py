import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models import Asesoria, Usuario, ClienteAutonomo, Gasto, JustificacionFiscal


@pytest.fixture
def db_session():
    # Base de datos en memoria aislada para las pruebas
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_creacion_completa_modelo_relacional(db_session):
    # 1. Crear Asesoría
    asesoria = Asesoria(
        cif="B06999888",
        razon_social="Asesoría Mérida Test",
        email_contacto="contacto@asesoriamerida.test",
        codigo_invitacion="TEST2026",
    )
    db_session.add(asesoria)
    db_session.commit()
    db_session.refresh(asesoria)
    assert asesoria.id is not None

    # 2. Crear Usuario
    usuario = Usuario(
        asesoria_id=asesoria.id,
        email="autonomo.test@facturametrica.test",
        password_hash="$2a$08$fakehashparaevitartestsdepassword",
        rol="AUTONOMO",
        nombre="Juan",
        apellidos="García",
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    assert usuario.id is not None

    # 3. Crear Cliente Autónomo
    cliente = ClienteAutonomo(
        usuario_id=usuario.id,
        asesoria_id=asesoria.id,
        nif="12345678Z",
        nombre_fiscal="Juan García Autónomo",
        actividad_iae="Desarrollo de Software",
    )
    db_session.add(cliente)
    db_session.commit()
    db_session.refresh(cliente)
    assert cliente.id is not None

    # 4. Crear Gasto
    gasto = Gasto(
        cliente_id=cliente.id,
        asesoria_id=asesoria.id,
        fecha_emision=datetime(2026, 10, 14, 13, 0),
        nif_emisor="B06123456",
        razon_social_emisor="Restaurante Plaza",
        base_imponible=50.0,
        tipo_iva=10,
        cuota_iva=5.0,
        total=55.0,
        categoria="restauracion",
        cuenta_pgc="629",
        estado_semaforo="amarillo",
        motivo_riesgo="Exceso de manutención",
    )
    db_session.add(gasto)
    db_session.commit()
    db_session.refresh(gasto)
    assert gasto.id is not None
    assert gasto.estado_semaforo == "amarillo"

    # 5. Crear Justificación Fiscal
    justificacion = JustificacionFiscal(
        gasto_id=gasto.id,
        motivo_profesional="Comida de trabajo con cliente potencial",
        nombre_cliente_reunion="Carlos Gómez",
    )
    db_session.add(justificacion)
    db_session.commit()
    db_session.refresh(justificacion)
    assert justificacion.id is not None
    assert justificacion.gasto.total == 55.0
