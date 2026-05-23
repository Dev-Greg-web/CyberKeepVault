import base64
import os
import sqlite3

import pytest

from backend.app import create_app
from backend.extensions import db


@pytest.fixture()
def app(tmp_path, monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", "AdminGreg")
    monkeypatch.setenv("ADMIN_PASSWORD", "Lego2012@")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-jwt-secret-with-more-than-thirty-two-bytes")
    monkeypatch.setenv("ENCRYPTION_KEY", base64.urlsafe_b64encode(os.urandom(32)).decode())

    db_path = tmp_path / "test.db"
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{db_path.as_posix()}",
        }
    )
    app.config["TEST_DB_PATH"] = db_path

    yield app

    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def auth_headers(client):
    response = client.post(
        "/api/auth/login",
        json={"username": "AdminGreg", "password": "Lego2012@"},
    )
    assert response.status_code == 200
    token = response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_admin_login_success_and_failure(client):
    success = client.post("/api/auth/login", json={"username": "AdminGreg", "password": "Lego2012@"})
    failure = client.post("/api/auth/login", json={"username": "AdminGreg", "password": "wrong"})

    assert success.status_code == 200
    assert success.get_json()["user"]["username"] == "AdminGreg"
    assert failure.status_code == 401


def test_folders_can_be_nested_moved_to_root_and_deleted(client, auth_headers):
    root = client.post("/api/folders", headers=auth_headers, json={"name": "Gemini"}).get_json()
    child = client.post(
        "/api/folders",
        headers=auth_headers,
        json={"name": "NotebookLM", "parent_id": root["id"]},
    ).get_json()

    moved_root = client.patch(
        f"/api/folders/{child['id']}/move",
        headers=auth_headers,
        json={"parent_id": None},
    )

    folders = client.get("/api/folders", headers=auth_headers).get_json()

    assert moved_root.status_code == 200
    assert moved_root.get_json()["parent_id"] is None
    assert len(folders) == 2

    deleted = client.delete(f"/api/folders/{root['id']}", headers=auth_headers)
    folders_after_delete = client.get("/api/folders", headers=auth_headers).get_json()

    assert deleted.status_code == 200
    assert [folder["name"] for folder in folders_after_delete] == ["NotebookLM"]


def test_folder_move_rejects_self_and_descendant_cycles(client, auth_headers):
    root = client.post("/api/folders", headers=auth_headers, json={"name": "Root"}).get_json()
    child = client.post(
        "/api/folders",
        headers=auth_headers,
        json={"name": "Child", "parent_id": root["id"]},
    ).get_json()

    self_move = client.patch(
        f"/api/folders/{root['id']}/move",
        headers=auth_headers,
        json={"parent_id": root["id"]},
    )
    cycle_move = client.patch(
        f"/api/folders/{root['id']}/move",
        headers=auth_headers,
        json={"parent_id": child["id"]},
    )

    assert self_move.status_code == 400
    assert cycle_move.status_code == 400


def test_password_and_prompt_items_crud(client, auth_headers):
    folder = client.post("/api/folders", headers=auth_headers, json={"name": "Vault"}).get_json()

    password = client.post(
        f"/api/folders/{folder['id']}/items",
        headers=auth_headers,
        json={
            "type": "password",
            "title": "Gmail",
            "login": "greg@example.com",
            "url": "https://mail.google.com",
            "password": "secret-pass",
            "notes": "2FA enabled",
        },
    )
    prompt = client.post(
        f"/api/folders/{folder['id']}/items",
        headers=auth_headers,
        json={
            "type": "prompt",
            "title": "Research",
            "prompt_text": "Summarize this source.",
            "notes": "Use bullets",
        },
    )

    assert password.status_code == 201
    assert prompt.status_code == 201

    patched = client.patch(
        f"/api/items/{password.get_json()['id']}",
        headers=auth_headers,
        json={"title": "Gmail main", "password": "new-secret"},
    )
    items = client.get(f"/api/folders/{folder['id']}/items", headers=auth_headers).get_json()
    deleted = client.delete(f"/api/items/{prompt.get_json()['id']}", headers=auth_headers)

    assert patched.status_code == 200
    assert any(item["title"] == "Gmail main" and item["password"] == "new-secret" for item in items)
    assert deleted.status_code == 200


def test_encrypted_fields_are_not_plaintext_in_sqlite(app, client, auth_headers):
    folder = client.post("/api/folders", headers=auth_headers, json={"name": "Secrets"}).get_json()
    client.post(
        f"/api/folders/{folder['id']}/items",
        headers=auth_headers,
        json={"type": "password", "title": "Bank", "password": "ultra-secret-value"},
    )

    connection = sqlite3.connect(app.config["TEST_DB_PATH"])
    try:
        rows = connection.execute("select password from vault_items").fetchall()
    finally:
        connection.close()

    assert rows
    assert rows[0][0] != "ultra-secret-value"
    assert "ultra-secret-value" not in rows[0][0]
