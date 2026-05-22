"""
Validators Utility
===================
Reusable validation helpers.
"""

import re


def is_valid_slug(value: str) -> bool:
    """Check if a string is a valid URL slug."""
    return bool(re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", value))


def slugify(text: str) -> str:
    """Convert text to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    return text.strip("-")
