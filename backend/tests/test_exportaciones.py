from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.models.entities import Asesoria, ClienteAutonomo, Gasto, Usuario
from app.main import app


@pytest.fixture
def export_client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    # Preparar datos base
    with TestingSessionLocal() as db:
        asesoria = Asesoria(
            id="ase-test-exp-01",
            cif="B06999000",
            razon_social="Asesoría Exportadora S.L.",
            email_contacto="exp@test.com",
            codigo_invitacion="EXP2026",
        )
        db.add(asesoria)
        db.flush()

        usuario = Usuario(
            id="usr-test-exp-01",
            asesoria_id=asesoria.id,
            email="cliente.exp@test.com",
            password_hash="dummy",
            rol="AUTONOMO",
            nombre="Mario",
        )
        db.add(usuario)
        db.flush()

        cliente = ClienteAutonomo(
            id="cli-test-exp-01",
            usuario_id=usuario.id,
            asesoria_id=asesoria.id,
            nif="11223344X",
            nombre_fiscal="Mario Fontanero",
        )
        db.add(cliente)
        db.flush()

        # Gastos en 4T 2026
        g1 = Gasto(
            id="gst-exp-01",
            cliente_id=cliente.id,
            asesoria_id=asesoria.id,
            fecha_emision=datetime(2026, 10, 15, 11, 0, tzinfo=timezone.utc),
            nif_emisor="A06111222",
            razon_social_emisor="Proveedor de Suministros S.A.",
            base_imponible=100.0,
            tipo_iva=21,
            cuota_iva=21.0,
            total=121.0,
            categoria="material_oficina",
            cuenta_pgc="629",
            estado_semaforo="verde",
        )
        g2 = Gasto(
            id="gst-exp-02",
            cliente_id=cliente.id,
            asesoria_id=asesoria.id,
            fecha_emision=datetime(2026, 11, 20, 14, 0, tzinfo=timezone.utc),
            nif_emisor="B06333444",
            razon_social_emisor="Restaurante La Muralla",
            base_imponible=30.0,
            tipo_iva=10,
            cuota_iva=3.0,
            total=33.0,
            categoria="restauracion",
            cuenta_pgc="629",
            estado_semaforo="amarillo",
        )
        # Gasto rojo (no deducible) - no debe incluirse en la exportación
        g3 = Gasto(
            id="gst-exp-03",
            cliente_id=cliente.id,
            asesoria_id=asesoria.id,
            fecha_emision=datetime(2026, 10, 10, 9, 0, tzinfo=timezone.utc),
            razon_social_emisor="DGT Multa Tráfico",
            base_imponible=50.0,
            tipo_iva=0,
            cuota_iva=0.0,
            total=50.0,
            categoria="multas",
            cuenta_pgc="629",
            estado_semaforo="rojo",
        )
        db.add_all([g1, g2, g3])
        db.commit()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app)

    yield client

    app.dependency_overrides.clear()


def test_crear_exportacion_csv(export_client):
    response = export_client.post(
        "/api/v1/exportaciones",
        json={
            "asesoriaId": "ase-test-exp-01",
            "trimestre": 4,
            "anio": 2026,
            "formato": "CSV",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["formato"] == "CSV"
    assert data["trimestre"] == 4
    assert data["anio"] == 2026
    # g1 y g2 deben incluirse, g3 (rojo) excluido
    assert data["numAsientos"] == 2
    assert "contenido" in data
    # Comprobar que incluye cabecera con separador ';' y BOM UTF-8
    assert "Fecha;NIF cliente;Cliente;NIF emisor" in data["contenido"]


def test_crear_exportacion_json(export_client):
    response = export_client.post(
        "/api/v1/exportaciones",
        json={
            "asesoriaId": "ase-test-exp-01",
            "trimestre": 4,
            "anio": 2026,
            "formato": "JSON",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["formato"] == "JSON"
    assert data["numAsientos"] == 2
    assert "asientos" in data
    assert len(data["asientos"]) == 2


def test_listar_exportaciones(export_client):
    # Crear una exportación para asegurar datos
    export_client.post(
        "/api/v1/exportaciones",
        json={
            "asesoriaId": "ase-test-exp-01",
            "trimestre": 4,
            "anio": 2026,
            "formato": "CSV",
        },
    )
    response = export_client.get("/api/v1/exportaciones?asesoria_id=ase-test-exp-01")
    assert response.status_code == 200
    lotes = response.json()
    assert len(lotes) >= 1


def test_descargar_archivo_exportacion(export_client):
    # Generar un lote
    crear_resp = export_client.post(
        "/api/v1/exportaciones",
        json={
            "asesoriaId": "ase-test-exp-01",
            "trimestre": 4,
            "anio": 2026,
            "formato": "CSV",
        },
    )
    lote_id = crear_resp.json()["id"]

    download_resp = export_client.get(f"/api/v1/exportaciones/{lote_id}/descargar")
    assert download_resp.status_code == 200
    assert "Content-Disposition" in download_resp.headers
    assert "attachment; filename=" in download_resp.headers["Content-Disposition"]
