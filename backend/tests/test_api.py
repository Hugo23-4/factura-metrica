from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_ocr_endpoint_dummy():
    fake_content = b"RESTAURANTE EL FARO\nNIF: B06123456\nTOTAL: 24.50 EUR\nFECHA: 14/10/2026\n"
    response = client.post(
        "/api/v1/comprobantes/ocr",
        files={"archivo": ("ticket.jpg", fake_content, "image/jpeg")},
        data={"tipo_documento": "ticket"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["nifEmisor"] == "B06123456"
    assert data["total"] == 24.50
    assert data["categoria"] == "restauracion"


def test_evaluar_gasto_laborable():
    payload = {
        "fechaEmision": "2026-10-14T10:00:00Z",
        "nifEmisor": "B06123456",
        "razonSocialEmisor": "Papelería Albarregas",
        "nifReceptor": "12345678Z",
        "baseImponible": 20.0,
        "tipoIva": 21,
        "cuotaIva": 4.2,
        "total": 24.2,
        "categoria": "material_oficina",
        "tipoDocumento": "ticket",
    }
    response = client.post("/api/v1/gastos/evaluar", json=payload)
    assert response.status_code == 200
    assert response.json()["semaforo"] == "verde"
    assert response.json()["cuentaPgc"] == "602"


def test_evaluar_gasto_multa():
    payload = {
        "fechaEmision": "2026-10-14T10:00:00Z",
        "nifEmisor": "P0608300J",
        "razonSocialEmisor": "Policía Local",
        "nifReceptor": "12345678Z",
        "baseImponible": 100.0,
        "tipoIva": 0,
        "cuotaIva": 0.0,
        "total": 100.0,
        "categoria": "multas",
        "tipoDocumento": "ticket",
    }
    response = client.post("/api/v1/gastos/evaluar", json=payload)
    assert response.status_code == 200
    assert response.json()["semaforo"] == "rojo"


def test_poblar_datos_demo_endpoint():
    response = client.post("/api/v1/demo/poblar")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
