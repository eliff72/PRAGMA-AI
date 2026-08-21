from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_login_with_valid_demo_user_returns_token():
    response = client.post("/auth/login", json={"email": "admin@demo.local", "password": "demo1234"})
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_with_invalid_password_returns_401():
    response = client.post("/auth/login", json={"email": "admin@demo.local", "password": "wrong"})
    assert response.status_code == 401


def test_protected_endpoint_requires_matching_role():
    login = client.post("/auth/login", json={"email": "yarismaci@demo.local", "password": "demo1234"})
    token = login.json()["access_token"]

    response = client.get("/metrics/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403  # competitor, system_admin degil


def test_question_flow_returns_needs_human_without_rag_pipeline():
    login = client.post("/auth/login", json={"email": "yarismaci@demo.local", "password": "demo1234"})
    token = login.json()["access_token"]

    response = client.post(
        "/competitions/insansi-robot/questions",
        json={"question": "Robotun agirlik limiti nedir?"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["needs_human"] is True  # feature/backend-rag merge edilmeden fallback
