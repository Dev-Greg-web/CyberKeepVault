import os
from datetime import datetime, timezone

from cryptography.fernet import Fernet
from sqlalchemy.types import Text, TypeDecorator
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db


def utc_now():
    return datetime.now(timezone.utc)


def get_fernet():
    key = os.environ.get("ENCRYPTION_KEY")
    if not key:
        raise RuntimeError("ENCRYPTION_KEY is missing. Set it in .env before using CyberKeep.")
    return Fernet(key.encode("utf-8"))


class EncryptedText(TypeDecorator):
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None or value == "":
            return value
        encrypted = get_fernet().encrypt(value.encode("utf-8"))
        return encrypted.decode("utf-8")

    def process_result_value(self, value, dialect):
        if value is None or value == "":
            return value
        try:
            decrypted = get_fernet().decrypt(value.encode("utf-8"))
            return decrypted.decode("utf-8")
        except Exception:
            return value


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now, nullable=False)

    folders = db.relationship("Folder", back_populates="owner", cascade="all, delete-orphan")
    items = db.relationship("VaultItem", back_populates="owner", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "username": self.username}


class Folder(db.Model):
    __tablename__ = "folders"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("folders.id"), nullable=True, index=True)
    icon_color = db.Column(db.String(20), nullable=False, default="#38bdf8")
    name_color = db.Column(db.String(20), nullable=False, default="#e5e7eb")
    sort_order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    owner = db.relationship("User", back_populates="folders")
    parent = db.relationship(
        "Folder",
        remote_side=[id],
        back_populates="children",
    )
    children = db.relationship(
        "Folder",
        back_populates="parent",
        cascade="all, delete-orphan",
        single_parent=True,
    )
    items = db.relationship("VaultItem", back_populates="folder", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "parent_id": self.parent_id,
            "icon_color": self.icon_color,
            "name_color": self.name_color,
            "sort_order": self.sort_order,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class VaultItem(db.Model):
    __tablename__ = "vault_items"

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(180), nullable=False)
    login = db.Column(EncryptedText, nullable=True)
    url = db.Column(EncryptedText, nullable=True)
    password = db.Column(EncryptedText, nullable=True)
    prompt_text = db.Column(EncryptedText, nullable=True)
    notes = db.Column(EncryptedText, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    folder_id = db.Column(db.Integer, db.ForeignKey("folders.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    folder = db.relationship("Folder", back_populates="items")
    owner = db.relationship("User", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "login": self.login or "",
            "url": self.url or "",
            "password": self.password or "",
            "prompt_text": self.prompt_text or "",
            "notes": self.notes or "",
            "folder_id": self.folder_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

