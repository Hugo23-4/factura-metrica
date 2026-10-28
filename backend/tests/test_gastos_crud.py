import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app as fastapi_app
from app.db.base import Base
from app.db.session import get_db
import app.models  # noqa: F401
from app.models import Asesoria, Usuario


@pytest.fixture
def client_and_ids():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    fastapi_app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(fastapi_app)

    # Crear asesoría y usuario iniciales en BD
    session = TestingSessionLocal()
    asesoria = Asesoria(
        cif="B06111222",
        razon_social="Gestoría Albarregas Test",
        email_contacto="albarregas@test.com",
        codigo_invitacion="ALBTEST",
    )
    session.add(asesoria)
    session.commit()
    session.refresh(asesoria)

    usuario = Usuario(
        asesoria_id=asesoria.id,
        email="carlos@test.com",
        password_hash="fakehash",
        rol="AUTONOMO",
        nombre="Carlos",
    )
    session.add(usuario)
    session.commit()
    session.refresh(usuario)

    asesoria_id = asesoria.id
    usuario_id = usuario.id
    session.close()

    yield test_client, asesoria_id, usuario_id

    fastapi_app.dependency_overrides.clear()


def test_flujo_completo_gastos_crud(client_and_ids):
    client, asesoria_id, usuario_id = client_and_ids

    # 1. Crear cliente autónomo
    res_cliente = client.post(
        "/api/v1/clientes",
        json={
            "usuarioId": usuario_id,
            "asesoriaId": asesoria_id,
            "nif": "12345678Z",
            "nombreFiscal": "Carlos López Autónomo",
            "actividadIae": "Hostelería",
        },
    )
    assert res_cliente.status_code == 201
    cliente_id = res_cliente.json()["id"]

    # 2. Listar clientes y consultar detalle
    res_list_clientes = client.get(f"/api/v1/clientes?asesoria_id={asesoria_id}")
    assert res_list_clientes.status_code == 200
    assert len(res_list_clientes.json()) == 1

    res_det_cliente = client.get(f"/api/v1/clientes/{cliente_id}")
    assert res_det_cliente.status_code == 200
    assert res_det_cliente.json()["nombreFiscal"] == "Carlos López Autónomo"
    assert res_det_cliente.json()["activo"] is True

    # 3. Editar cliente (pausar y cambiar teléfono)
    res_edit_cli = client.put(
        f"/api/v1/clientes/{cliente_id}",
        json={"activo": False, "telefono": "655443322"},
    )
    assert res_edit_cli.status_code == 200
    assert res_edit_cli.json()["activo"] is False
    assert res_edit_cli.json()["telefono"] == "655443322"

    # Reactivar cliente para continuar flujo
    client.put(f"/api/v1/clientes/{cliente_id}", json={"activo": True})

    # 4. Registrar gasto normal (laborable, debe ser verde)
    res_gasto_verde = client.post(
        "/api/v1/gastos",
        json={
            "clienteId": cliente_id,
            "asesoriaId": asesoria_id,
            "fechaEmision": "2026-10-14T10:00:00Z",  # Miércoles laborable
            "nifEmisor": "B06123456",
            "razonSocialEmisor": "Papelería Albarregas",
            "nifReceptor": "12345678Z",
            "baseImponible": 20.0,
            "tipoIva": 21,
            "categoria": "material_oficina",
            "tipoDocumento": "ticket",
        },
    )
    assert res_gasto_verde.status_code == 201
    gasto_verde_data = res_gasto_verde.json()
    assert gasto_verde_data["estadoSemaforo"] == "verde"
    assert gasto_verde_data["cuentaPgc"] == "602"
    assert gasto_verde_data["total"] == 24.2

    # 5. Editar gasto (actualizar razón social)
    res_edit_gasto = client.put(
        f"/api/v1/gastos/{gasto_verde_data['id']}",
        json={"razonSocialEmisor": "Papelería Albarregas Central"},
    )
    assert res_edit_gasto.status_code == 200
    assert res_edit_gasto.json()["razonSocialEmisor"] == "Papelería Albarregas Central"

    # 6. Registrar gasto dudoso (sábado, cena restauración > 26,67 € -> amarillo)
    res_gasto_amarillo = client.post(
        "/api/v1/gastos",
        json={
            "clienteId": cliente_id,
            "asesoriaId": asesoria_id,
            "fechaEmision": "2026-10-17T23:00:00Z",  # Sábado
            "nifEmisor": "B06987654",
            "razonSocialEmisor": "Restaurante El Puente",
            "nifReceptor": None,
            "baseImponible": 60.0,
            "tipoIva": 10,
            "cuotaIva": 6.0,
            "total": 66.0,
            "categoria": "restauracion",
            "tipoDocumento": "ticket",
        },
    )
    assert res_gasto_amarillo.status_code == 201
    gasto_amarillo_id = res_gasto_amarillo.json()["id"]
    assert res_gasto_amarillo.json()["estadoSemaforo"] == "amarillo"

    # 7. Justificar gasto ante el Asesor Fiscal Virtual
    res_just = client.post(
        f"/api/v1/gastos/{gasto_amarillo_id}/justificar",
        json={
            "motivoProfesional": "Cena con proveedor de suministros para cerrar acuerdo",
            "nombreClienteReunion": "Distribuciones Lusitania",
        },
    )
    assert res_just.status_code == 200
    assert res_just.json()["justificacion"] is not None
    assert "proveedor" in res_just.json()["justificacion"]["motivoProfesional"]

    # 8. Gestor revisa y aprueba el gasto en 1 clic
    res_revision = client.post(
        f"/api/v1/gastos/{gasto_amarillo_id}/revisar",
        json={
            "decision": "aprobado",
            "comentario": "Justificación profesional aceptada",
            "cuentaPgcRectificada": "629",
        },
    )
    assert res_revision.status_code == 200
    assert res_revision.json()["estadoSemaforo"] == "verde"

    # 9. Listar todos los gastos del cliente
    res_lista = client.get(f"/api/v1/gastos?cliente_id={cliente_id}")
    assert res_lista.status_code == 200
    assert len(res_lista.json()) == 2

    # 10. Eliminar un gasto
    res_del = client.delete(f"/api/v1/gastos/{gasto_amarillo_id}")
    assert res_del.status_code == 204

    # Verificar que queda 1
    res_final = client.get(f"/api/v1/gastos?cliente_id={cliente_id}")
    assert len(res_final.json()) == 1

    # 11. Eliminar cliente (baja definitiva)
    res_del_cli = client.delete(f"/api/v1/clientes/{cliente_id}")
    assert res_del_cli.status_code == 204
