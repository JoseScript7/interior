"""
Contract loader (Python / backend side).
Loads the SAME JSON schema files the frontend uses, re-attaches the draft-07
dialect, and exposes them for jsonschema validation or Pydantic model derivation.
"""
import json
import os
from functools import lru_cache

DRAFT_07 = "http://json-schema.org/draft-07/schema#"
_CONTRACTS_DIR = os.path.dirname(os.path.abspath(__file__))


def _with_dialect(schema: dict) -> dict:
    schema = {k: v for k, v in schema.items() if k != "_meta"}
    return {"$schema": DRAFT_07, **schema}


@lru_cache(maxsize=None)
def load(name: str) -> dict:
    """Load a contract by relative path, e.g. 'json/scene-descriptor.json'."""
    path = os.path.join(_CONTRACTS_DIR, name)
    with open(path, "r", encoding="utf-8") as f:
        return _with_dialect(json.load(f))


def scene_descriptor() -> dict:
    return load("json/scene-descriptor.json")


def rest_api() -> dict:
    return load("json/rest-api.json")


def furniture_catalog() -> dict:
    return load("json/furniture-catalog.json")


def websocket_messages() -> dict:
    return load("websocket/messages.json")


def validate(instance: dict, schema_name: str) -> list[str]:
    """Validate an instance against a named contract. Returns list of error messages (empty = valid)."""
    try:
        from jsonschema import Draft7Validator
    except ImportError:
        return ["jsonschema package not installed"]
    validator = Draft7Validator(load(schema_name))
    return [e.message for e in validator.iter_errors(instance)]
