import json


def row_to_dict(row):
    """Convert SQLite Row to dictionary with JSON parsing for tags"""
    d = dict(row)
    if "tags" in d:
        d["tags"] = json.loads(d.get("tags") or "[]")
    return d
