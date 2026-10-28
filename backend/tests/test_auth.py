import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.db.seed import poblar_datos_prueba
from app.main import app


@pytest.fixture
def auth_client():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    with TestingSessionLocal() as session:
        poblar_datos_prueba(session)

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


def test_login_gestora_exitoso(auth_client):
    response = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "laura.gestora@facturametrica.test", "password": "Gestor2026!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["rol"] == "ADMIN"
    assert data["nombre"] == "Laura"
    assert data["token_type"] == "bearer"


def test_login_credenciales_invalidas(auth_client):
    response = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "laura.gestora@facturametrica.test", "password": "PasswordIncorrecto!"},
    )
    assert response.status_code == 401
    assert "detail" in response.json()


def test_login_usuario_pausado(auth_client):
    response = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "miguel@facturametrica.test", "password": "Cliente2026!"},
    )
    assert response.status_code == 403
    assert "pausada" in response.json()["detail"].lower()


def test_verificar_codigo_invitacion_valido(auth_client):
    response = auth_client.get("/api/v1/asesorias/verificar-codigo/ALB2026")
    assert response.status_code == 200
    data = response.json()
    assert data["codigoInvitacion"] == "ALB2026"
    assert data["razonSocial"] == "Asesoría Albarregas S.L."


def test_verificar_codigo_invitacion_invalido(auth_client):
    response = auth_client.get("/api/v1/asesorias/verificar-codigo/CODIGO_FALSO")
    assert response.status_code == 404


def test_registro_nuevo_autonomo(auth_client):
    response = auth_client.post(
        "/api/v1/auth/registro",
        json={
            "email": "nuevo.autonomo@facturametrica.test",
            "password": "Password123!",
            "nombre": "Elena",
            "apellidos": "Navarro",
            "codigoInvitacion": "ALB2026",
            "nif": "99887766K",
            "actividadIae": "Traducción e interpretación",
            "telefono": "611222333",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["rol"] == "AUTONOMO"
    assert data["nombre"] == "Elena"
    assert data["clienteId"] is not None

    # Verificar que puede obtener su perfil con el token
    token = data["access_token"]
    me_resp = auth_client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "nuevo.autonomo@facturametrica.test"
