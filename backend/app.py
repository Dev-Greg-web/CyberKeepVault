import os
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from extensions import db, jwt
from models import Folder, User, VaultItem

PROJECT_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"


def create_app(test_config=None):
    load_dotenv(PROJECT_ROOT / ".env")

    app = Flask(__name__, static_folder=str(FRONTEND_DIST), static_url_path="")
    app.config.update(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-secret-key"),
        JWT_SECRET_KEY=os.environ.get("JWT_SECRET_KEY", os.environ.get("SECRET_KEY", "dev-jwt-key")),
        SQLALCHEMY_DATABASE_URI=os.environ.get(
            "DATABASE_URL",
            f"sqlite:///{(PROJECT_ROOT / 'cyberkeep.db').as_posix()}",
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )

    if test_config:
        app.config.update(test_config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": ["http://127.0.0.1:5173", "http://localhost:5173"]}})

    with app.app_context():
        db.create_all()
        seed_admin()

    register_routes(app)
    register_frontend_routes(app)
    return app


def seed_admin():
    username = os.environ.get("ADMIN_USERNAME")
    password = os.environ.get("ADMIN_PASSWORD")
    if not username or not password:
        raise RuntimeError("ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env")

    admin = User.query.filter_by(username=username).first()
    if admin:
        return admin

    admin = User(username=username)
    admin.set_password(password)
    db.session.add(admin)
    db.session.commit()
    return admin


def current_user_id():
    return int(get_jwt_identity())


def get_owned_folder(folder_id, user_id):
    return Folder.query.filter_by(id=folder_id, user_id=user_id).first()


def get_owned_item(item_id, user_id):
    return VaultItem.query.filter_by(id=item_id, user_id=user_id).first()


def validate_hex_color(value, fallback):
    if not isinstance(value, str):
        return fallback
    value = value.strip()
    if len(value) == 7 and value.startswith("#"):
        valid = all(char in "0123456789abcdefABCDEF" for char in value[1:])
        if valid:
            return value
    return fallback


def folder_is_descendant(folder, possible_descendant):
    cursor = possible_descendant
    while cursor:
        if cursor.id == folder.id:
            return True
        cursor = cursor.parent
    return False


def validate_item_payload(data, partial=False):
    item_type = data.get("type")
    if not partial or item_type is not None:
        if item_type not in {"password", "prompt"}:
            return "Type must be 'password' or 'prompt'."

    title = data.get("title")
    if not partial or title is not None:
        if not isinstance(title, str) or not title.strip():
            return "Title is required."

    effective_type = item_type
    if effective_type == "password" and not partial:
        if not data.get("password"):
            return "Password value is required."
    if effective_type == "prompt" and not partial:
        if not data.get("prompt_text"):
            return "Prompt text is required."

    return None


def register_routes(app):
    @app.get("/api/status")
    def status():
        return jsonify({"status": "ok", "name": "CyberKeep"}), 200

    @app.post("/api/auth/login")
    def login():
        data = request.get_json(silent=True) or {}
        username = data.get("username", "")
        password = data.get("password", "")

        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            return jsonify({"message": "Invalid username or password."}), 401

        return jsonify({"access_token": create_access_token(identity=str(user.id)), "user": user.to_dict()}), 200

    @app.get("/api/auth/me")
    @jwt_required()
    def me():
        user = db.session.get(User, current_user_id())
        if not user:
            return jsonify({"message": "User not found."}), 404
        return jsonify(user.to_dict()), 200

    @app.get("/api/folders")
    @jwt_required()
    def list_folders():
        folders = (
            Folder.query.filter_by(user_id=current_user_id())
            .order_by(Folder.sort_order.asc(), Folder.name.asc())
            .all()
        )
        return jsonify([folder.to_dict() for folder in folders]), 200

    @app.post("/api/folders")
    @jwt_required()
    def create_folder():
        user_id = current_user_id()
        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()

        if not name:
            return jsonify({"message": "Folder name is required."}), 400

        parent_id = data.get("parent_id")
        if parent_id is not None and not get_owned_folder(parent_id, user_id):
            return jsonify({"message": "Parent folder was not found."}), 400

        folder = Folder(
            name=name,
            parent_id=parent_id,
            icon_color=validate_hex_color(data.get("icon_color"), "#38bdf8"),
            name_color=validate_hex_color(data.get("name_color"), "#e5e7eb"),
            sort_order=int(data.get("sort_order") or 0),
            user_id=user_id,
        )
        db.session.add(folder)
        db.session.commit()
        return jsonify(folder.to_dict()), 201

    @app.patch("/api/folders/<int:folder_id>")
    @jwt_required()
    def update_folder(folder_id):
        folder = get_owned_folder(folder_id, current_user_id())
        if not folder:
            return jsonify({"message": "Folder was not found."}), 404

        data = request.get_json(silent=True) or {}
        if "name" in data:
            name = (data.get("name") or "").strip()
            if not name:
                return jsonify({"message": "Folder name is required."}), 400
            folder.name = name
        if "icon_color" in data:
            folder.icon_color = validate_hex_color(data.get("icon_color"), folder.icon_color)
        if "name_color" in data:
            folder.name_color = validate_hex_color(data.get("name_color"), folder.name_color)
        if "sort_order" in data:
            folder.sort_order = int(data.get("sort_order") or 0)

        db.session.commit()
        return jsonify(folder.to_dict()), 200

    @app.patch("/api/folders/<int:folder_id>/move")
    @jwt_required()
    def move_folder(folder_id):
        user_id = current_user_id()
        folder = get_owned_folder(folder_id, user_id)
        if not folder:
            return jsonify({"message": "Folder was not found."}), 404

        data = request.get_json(silent=True) or {}
        new_parent_id = data.get("parent_id")

        if new_parent_id == folder.id:
            return jsonify({"message": "A folder cannot be moved into itself."}), 400

        new_parent = None
        if new_parent_id is not None:
            new_parent = get_owned_folder(new_parent_id, user_id)
            if not new_parent:
                return jsonify({"message": "Target folder was not found."}), 400
            if folder_is_descendant(folder, new_parent):
                return jsonify({"message": "A folder cannot be moved into its own descendant."}), 400

        folder.parent_id = new_parent.id if new_parent else None
        if "sort_order" in data:
            folder.sort_order = int(data.get("sort_order") or 0)
        db.session.commit()
        return jsonify(folder.to_dict()), 200

    @app.delete("/api/folders/<int:folder_id>")
    @jwt_required()
    def delete_folder(folder_id):
        folder = get_owned_folder(folder_id, current_user_id())
        if not folder:
            return jsonify({"message": "Folder was not found."}), 404

        db.session.delete(folder)
        db.session.commit()
        return jsonify({"message": "Folder deleted."}), 200

    @app.get("/api/folders/<int:folder_id>/items")
    @jwt_required()
    def list_items(folder_id):
        user_id = current_user_id()
        if not get_owned_folder(folder_id, user_id):
            return jsonify({"message": "Folder was not found."}), 404

        items = (
            VaultItem.query.filter_by(folder_id=folder_id, user_id=user_id)
            .order_by(VaultItem.updated_at.desc())
            .all()
        )
        return jsonify([item.to_dict() for item in items]), 200

    @app.post("/api/folders/<int:folder_id>/items")
    @jwt_required()
    def create_item(folder_id):
        user_id = current_user_id()
        if not get_owned_folder(folder_id, user_id):
            return jsonify({"message": "Folder was not found."}), 404

        data = request.get_json(silent=True) or {}
        error = validate_item_payload(data)
        if error:
            return jsonify({"message": error}), 400

        item = VaultItem(
            type=data["type"],
            title=data["title"].strip(),
            login=(data.get("login") or "").strip(),
            url=(data.get("url") or "").strip(),
            password=data.get("password") or "",
            prompt_text=data.get("prompt_text") or "",
            notes=data.get("notes") or "",
            folder_id=folder_id,
            user_id=user_id,
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201

    @app.patch("/api/items/<int:item_id>")
    @jwt_required()
    def update_item(item_id):
        item = get_owned_item(item_id, current_user_id())
        if not item:
            return jsonify({"message": "Item was not found."}), 404

        data = request.get_json(silent=True) or {}
        error = validate_item_payload(data, partial=True)
        if error:
            return jsonify({"message": error}), 400

        for key in ["type", "title", "login", "url", "password", "prompt_text", "notes"]:
            if key in data:
                value = data.get(key) or ""
                setattr(item, key, value.strip() if key in {"title", "login", "url"} else value)

        db.session.commit()
        return jsonify(item.to_dict()), 200

    @app.delete("/api/items/<int:item_id>")
    @jwt_required()
    def delete_item(item_id):
        item = get_owned_item(item_id, current_user_id())
        if not item:
            return jsonify({"message": "Item was not found."}), 404

        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Item deleted."}), 200


def register_frontend_routes(app):
    @app.get("/")
    def serve_index():
        if (FRONTEND_DIST / "index.html").exists():
            return send_from_directory(FRONTEND_DIST, "index.html")
        return jsonify({"name": "CyberKeep", "frontend": "Run npm run build in frontend."}), 200

    @app.get("/<path:path>")
    def serve_frontend(path):
        target = FRONTEND_DIST / path
        if target.exists() and target.is_file():
            return send_from_directory(FRONTEND_DIST, path)
        if (FRONTEND_DIST / "index.html").exists():
            return send_from_directory(FRONTEND_DIST, "index.html")
        return jsonify({"message": "Frontend build not found."}), 404


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    create_app().run(host="127.0.0.1", port=5000, debug=debug)
