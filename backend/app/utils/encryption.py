import base64
import json
import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

_VERSION = 1
_ITERATIONS = 600_000


def _derive_key(passphrase: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=_ITERATIONS,
    )
    return kdf.derive(passphrase.encode("utf-8"))


def encrypt_blueprint(data: dict, passphrase: str) -> bytes:
    """Encrypt a blueprint dict with AES-256-GCM.
    Returns JSON bytes representing the envelope.
    """
    salt = os.urandom(16)
    nonce = os.urandom(12)
    key = _derive_key(passphrase, salt)
    aesgcm = AESGCM(key)
    plaintext = json.dumps(data).encode("utf-8")
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)  # tag appended automatically
    envelope = {
        "version": _VERSION,
        "salt": base64.b64encode(salt).decode(),
        "nonce": base64.b64encode(nonce).decode(),
        "data": base64.b64encode(ciphertext).decode(),
    }
    return json.dumps(envelope).encode("utf-8")


def decrypt_blueprint(raw: bytes, passphrase: str) -> dict:
    """Decrypt an envelope produced by encrypt_blueprint.
    Raises ValueError on bad passphrase or corrupted data.
    """
    try:
        envelope = json.loads(raw)
        salt = base64.b64decode(envelope["salt"])
        nonce = base64.b64decode(envelope["nonce"])
        ciphertext = base64.b64decode(envelope["data"])
        key = _derive_key(passphrase, salt)
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return json.loads(plaintext)
    except Exception as exc:
        raise ValueError("Failed to decrypt blueprint – wrong passphrase or corrupted file") from exc