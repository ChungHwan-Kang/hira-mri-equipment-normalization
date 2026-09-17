"""Tests for the CMPB release-content audit."""

from __future__ import annotations

import sys
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = PACKAGE_ROOT / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from audit_release_content import audit_package


def write_text(root: Path, relative: str, content: str = "ok") -> None:
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def test_current_release_package_passes() -> None:
    assert audit_package(PACKAGE_ROOT) == []


def test_rejects_production_mapping(tmp_path: Path) -> None:
    write_text(tmp_path, "data/mapping/model_canonical_mapping.csv")
    assert any("forbidden file" in finding for finding in audit_package(tmp_path))


def test_rejects_reviewer_workbook(tmp_path: Path) -> None:
    write_text(tmp_path, "review/reviewer.xlsx")
    assert any("forbidden workbook" in finding for finding in audit_package(tmp_path))


def test_rejects_private_absolute_path(tmp_path: Path) -> None:
    private_path = "C:" + "\\Users\\someone\\Downloads\\secret.csv"
    write_text(tmp_path, "README.md", f"path={private_path}")
    assert any("absolute private path" in finding for finding in audit_package(tmp_path))


def test_rejects_credential_like_token(tmp_path: Path) -> None:
    token = "gh" + "p_" + ("A" * 30)
    write_text(tmp_path, "README.md", f"token={token}")
    assert any("credential-like" in finding for finding in audit_package(tmp_path))
