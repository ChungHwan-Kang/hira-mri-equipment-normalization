"""Audit the CMPB public reproducibility package for release-content leaks."""

from __future__ import annotations

import re
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[1]

IGNORED_DIRS = {".git", ".venv", "__pycache__", ".pytest_cache"}
FORBIDDEN_BASENAMES = {"model_canonical_mapping.csv"}
FORBIDDEN_SUFFIXES = {".xlsx", ".xls", ".xlsm"}
FORBIDDEN_PATH_PARTS = {
    "local_manuscript_evidence",
    "source_review",
    "raw_data",
    "reviewer_workbooks",
}

ABSOLUTE_PATH_PATTERNS = (
    re.compile(r"[A-Za-z]:\\(?:Users|Development|Documents|Downloads|Desktop)\\", re.IGNORECASE),
    re.compile(r"/(?:home|Users)/[^/\s]+/"),
)

SECRET_PATTERNS = (
    re.compile("gh" + r"p_[A-Za-z0-9]{20,}"),
    re.compile("github_" + r"pat_[A-Za-z0-9_]{20,}"),
    re.compile("AKIA" + r"[0-9A-Z]{16}"),
    re.compile("-----BEGIN " + r"(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
)


def iter_release_files(root: Path):
    """Yield release files while ignoring local execution artifacts."""
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(root)
        if any(part in IGNORED_DIRS for part in relative.parts):
            continue
        yield path, relative


def audit_package(root: Path = PACKAGE_ROOT) -> list[str]:
    """Return release-content findings; an empty list means the audit passed."""
    findings: list[str] = []

    for path, relative in iter_release_files(root):
        relative_text = relative.as_posix()

        if path.name in FORBIDDEN_BASENAMES:
            findings.append(f"forbidden file: {relative_text}")

        if path.suffix.lower() in FORBIDDEN_SUFFIXES:
            findings.append(f"forbidden workbook: {relative_text}")

        if any(part in FORBIDDEN_PATH_PARTS for part in relative.parts):
            findings.append(f"forbidden path component: {relative_text}")

        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            findings.append(f"non-UTF-8/binary file: {relative_text}")
            continue

        if any(pattern.search(content) for pattern in ABSOLUTE_PATH_PATTERNS):
            findings.append(f"absolute private path in content: {relative_text}")

        if any(pattern.search(content) for pattern in SECRET_PATTERNS):
            findings.append(f"credential-like token in content: {relative_text}")

    return findings


def main() -> int:
    """Run the release-content audit from the package root."""
    findings = audit_package()
    if findings:
        print("FAIL: CMPB release-content audit")
        for finding in findings:
            print(f"- {finding}")
        return 1

    print("PASS: CMPB release-content audit")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
