from bson import ObjectId


def str_to_oid(value: str) -> ObjectId:
    """Convert a hex string to ObjectId, raising ValueError on failure."""
    try:
        return ObjectId(value)
    except Exception:
        raise ValueError(f"Invalid ObjectId: {value!r}")


def doc_to_dict(doc: dict) -> dict:
    """Convert a MongoDB document to a JSON-serialisable dict."""
    if doc is None:
        return None
    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, list):
            result[key] = [
                doc_to_dict(item) if isinstance(item, dict) else
                (str(item) if isinstance(item, ObjectId) else item)
                for item in value
            ]
        elif isinstance(value, dict):
            result[key] = doc_to_dict(value)
        else:
            result[key] = value
    return result
