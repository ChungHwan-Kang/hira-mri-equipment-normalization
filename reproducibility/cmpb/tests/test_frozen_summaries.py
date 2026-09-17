"""Tests for CMPB Level B frozen aggregate outputs."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PACKAGE_ROOT / "scripts"))

from verify_frozen_summaries import (  # noqa: E402
    verify_all,
    verify_evidence_manifest,
    verify_pipeline_summary,
    verify_threshold_summary,
)


def test_threshold_summary_matches_freeze() -> None:
    verify_threshold_summary()


def test_pipeline_summary_matches_freeze() -> None:
    verify_pipeline_summary()


def test_evidence_manifest_is_non_distributed_hash_only() -> None:
    verify_evidence_manifest()


def test_complete_level_b_verification() -> None:
    verify_all()


def test_level_b_cli_runs_without_private_evidence() -> None:
    completed = subprocess.run(
        [sys.executable, str(PACKAGE_ROOT / "scripts" / "verify_frozen_summaries.py")],
        cwd=PACKAGE_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    assert "PASS: frozen CMPB Level B aggregate summaries verified" in completed.stdout
