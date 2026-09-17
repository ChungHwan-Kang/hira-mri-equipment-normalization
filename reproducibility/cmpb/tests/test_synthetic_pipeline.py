"""Tests for the self-contained CMPB Level A synthetic fixture."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import pandas as pd
from thefuzz import fuzz

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PACKAGE_ROOT / "src"))

from fuzzy_cluster import SIMILARITY_THRESHOLD, build_clusters  # noqa: E402
from governance_demo import load_fixture, load_mapping, run_synthetic_pipeline  # noqa: E402


def fixture_and_mapping() -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load the committed fictional Level A fixture."""
    fixture = load_fixture(PACKAGE_ROOT / "fixtures" / "synthetic_raw_models.csv")
    mapping = load_mapping(PACKAGE_ROOT / "fixtures" / "synthetic_mapping.csv")
    return fixture, mapping


def test_threshold_88_merge_is_explicit() -> None:
    """The fictional distinct Atlas identities meet the frozen threshold."""
    score = fuzz.token_sort_ratio("Atlas Nova", "Atlas N0va")
    assert score >= SIMILARITY_THRESHOLD


def test_greedy_cluster_is_order_dependent() -> None:
    """Equal-length representatives expose the frozen first-observed tie behavior."""
    forward = build_clusters(["Atlas Nova", "Atlas N0va"])
    reverse = build_clusters(["Atlas N0va", "Atlas Nova"])
    assert forward["Atlas N0va"] == "Atlas Nova"
    assert reverse["Atlas Nova"] == "Atlas N0va"


def test_exact_fallback_and_governance_dispositions() -> None:
    """Exercise exact, deterministic, manual-review, and ambiguous paths."""
    fixture, mapping = fixture_and_mapping()
    result = run_synthetic_pipeline(fixture, mapping).set_index("raw_model")

    assert result.at["Orion One", "exact_output"] == "Orion One"
    assert result.at["Comet   Prime", "exact_output"] == "Comet Prime"

    assert result.at["Atlas N0va", "fuzzy_output"] == "Atlas Nova"
    assert result.at["Atlas N0va", "governance_disposition"] == "manual_review"
    assert (
        result.at["Atlas N0va", "governance_reason"]
        == "cross_approved_canonical_conflict"
    )

    assert (
        result.at["Nebula", "governance_disposition"]
        == "ambiguous_or_underspecified"
    )
    assert result.at["Nebula", "governance_reason"] == "underspecified_model_family"


def test_complete_expected_output_matches_byte_semantics() -> None:
    """The synthetic example must exactly match the committed expected table."""
    fixture, mapping = fixture_and_mapping()
    actual = run_synthetic_pipeline(fixture, mapping)
    expected = pd.read_csv(
        PACKAGE_ROOT / "fixtures" / "expected_output.csv",
        keep_default_na=False,
    )
    pd.testing.assert_frame_equal(actual, expected, check_dtype=False)


def test_cli_example_runs_without_private_project_files() -> None:
    """The Level A entry point must run using only files in this package."""
    completed = subprocess.run(
        [sys.executable, str(PACKAGE_ROOT / "scripts" / "run_synthetic_example.py")],
        cwd=PACKAGE_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    assert "PASS: synthetic output matches expected_output.csv" in completed.stdout
