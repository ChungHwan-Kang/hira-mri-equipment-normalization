"""Verify frozen CMPB Level B aggregate release artifacts."""

from __future__ import annotations

import json
import re
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
FROZEN_OUTPUTS = PACKAGE_ROOT / "frozen_outputs"
ANALYSIS_FREEZE_COMMIT = "349a047f9bdb3b6780edbc274f1742ad6d5d8f27"
SHA256_LINE = re.compile(r"^[0-9a-f]{64}  NON_DISTRIBUTED/.+$")


def verify_threshold_summary() -> None:
    """Verify manuscript threshold reference values."""
    payload = json.loads(
        (FROZEN_OUTPUTS / "threshold_sensitivity_summary.json").read_text(
            encoding="utf-8"
        )
    )
    freeze = payload["analysis_freeze"]
    assert freeze["commit"] == ANALYSIS_FREEZE_COMMIT
    assert freeze["reference_threshold"] == 88
    assert freeze["reference_threshold_is_optimal"] is False

    rows = {row["threshold"]: row for row in payload["threshold_sensitivity"]}
    assert sorted(rows) == [80, 85, 88, 90, 92, 95]
    assert rows[88]["fuzzy_dependent_raw_models"] == 47
    assert rows[88]["year_raw_model_combinations"] == 276
    assert rows[88]["affected_records"] == 2248
    assert rows[88]["affected_equipment_observations"] == 2327
    assert rows[88]["cross_approved_canonical_conflict_clusters"] == 23
    assert rows[88]["cross_manufacturer_conflict_clusters"] == 0


def verify_pipeline_summary() -> None:
    """Verify frozen three-pipeline and governance aggregates."""
    payload = json.loads(
        (FROZEN_OUTPUTS / "pipeline_comparison_summary_public.json").read_text(
            encoding="utf-8"
        )
    )
    assert payload["analysis_freeze"]["commit"] == ANALYSIS_FREEZE_COMMIT

    exact = payload["pipelines"]["exact_only"]
    fuzzy = payload["pipelines"]["fuzzy_inclusive"]
    governance = payload["pipelines"]["governance_aware"]

    assert (exact["semantic_concordant"], exact["semantic_evaluable"]) == (43, 45)
    assert (fuzzy["semantic_concordant"], fuzzy["semantic_evaluable"]) == (10, 45)
    assert governance["manual_review"] == 45
    assert governance["ambiguous_or_underspecified"] == 2
    assert governance["auto_accepted_fuzzy_candidates"] == 0

    gates = payload["governance_gates"]["raw_model_level_47"]
    assert gates["cross_approved_canonical"] == 47
    assert gates["cross_manufacturer"] == 0
    assert gates["field_strength_incompatibility"] == 27

    differences = payload["pairwise_output_differences"]
    assert differences["exact_only_vs_fuzzy_inclusive"] == {
        "equipment_observations": 2327,
        "raw_models": 47,
        "records": 2248,
        "year_raw_model_combinations": 276,
    }
    assert differences["governance_aware_vs_fuzzy_inclusive"] == {
        "equipment_observations": 2452,
        "raw_models": 47,
        "records": 2373,
        "year_raw_model_combinations": 298,
    }


def verify_evidence_manifest() -> None:
    """Validate the non-distributed evidence hash manifest structure."""
    lines = (
        (FROZEN_OUTPUTS / "evidence_manifest.sha256")
        .read_text(encoding="utf-8")
        .splitlines()
    )
    entries = [line for line in lines if line and not line.startswith("#")]
    assert len(entries) == 7
    assert len(set(entries)) == 7
    assert all(SHA256_LINE.fullmatch(line) for line in entries)


def verify_all() -> None:
    """Run all Level B verification checks."""
    verify_threshold_summary()
    verify_pipeline_summary()
    verify_evidence_manifest()


def main() -> int:
    verify_all()
    print("PASS: frozen CMPB Level B aggregate summaries verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
