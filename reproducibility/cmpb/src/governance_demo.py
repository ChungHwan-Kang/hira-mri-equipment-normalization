"""Self-contained synthetic exact/fuzzy/governance demonstration."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from fuzzy_cluster import build_clusters

RAW_MODEL_COLUMN = "raw_model"
UNDERSPECIFIED_COLUMN = "underspecified_family"
MAPPING_RAW_COLUMN = "raw_model"
MAPPING_CANONICAL_COLUMN = "canonical_model"


def normalize_fixture(value: str) -> str:
    """Apply the fixture's deterministic fallback normalization."""
    return " ".join(str(value).split())


def load_fixture(path: Path) -> pd.DataFrame:
    """Load and validate the synthetic raw-model fixture."""
    frame = pd.read_csv(path, keep_default_na=False)
    required = {RAW_MODEL_COLUMN, UNDERSPECIFIED_COLUMN}
    missing = required - set(frame.columns)
    if missing:
        raise ValueError(f"Synthetic fixture columns missing: {sorted(missing)}")
    if frame[RAW_MODEL_COLUMN].duplicated().any():
        raise ValueError("Synthetic raw-model strings must be unique")
    return frame


def load_mapping(path: Path) -> pd.DataFrame:
    """Load and validate the fictional synthetic mapping."""
    mapping = pd.read_csv(path, keep_default_na=False)
    required = {MAPPING_RAW_COLUMN, MAPPING_CANONICAL_COLUMN}
    missing = required - set(mapping.columns)
    if missing:
        raise ValueError(f"Synthetic mapping columns missing: {sorted(missing)}")
    if mapping[MAPPING_RAW_COLUMN].duplicated().any():
        raise ValueError("Synthetic mapping raw-model keys must be unique")
    return mapping


def exact_only_values(raw_models: pd.Series, mapping: pd.DataFrame) -> pd.Series:
    """Apply approved exact mapping, then deterministic fixture normalization."""
    raw_to_target = dict(
        zip(
            mapping[MAPPING_RAW_COLUMN],
            mapping[MAPPING_CANONICAL_COLUMN],
            strict=True,
        )
    )
    return raw_models.map(
        lambda value: raw_to_target.get(str(value), normalize_fixture(str(value)))
    )


def run_synthetic_pipeline(
    fixture: pd.DataFrame,
    mapping: pd.DataFrame,
) -> pd.DataFrame:
    """Return exact-only, fuzzy-inclusive, and governance-aware fixture outputs."""
    result = fixture.copy()
    result["exact_output"] = exact_only_values(result[RAW_MODEL_COLUMN], mapping)

    cluster_map = build_clusters(result["exact_output"].tolist())
    result["fuzzy_output"] = result["exact_output"].map(cluster_map)
    result["fuzzy_changed"] = result["exact_output"].ne(result["fuzzy_output"])

    approved_keys = set(mapping[MAPPING_RAW_COLUMN])
    approved_targets_by_cluster: dict[str, set[str]] = {}
    for row in result.itertuples(index=False):
        if row.raw_model not in approved_keys:
            continue
        approved_targets_by_cluster.setdefault(row.fuzzy_output, set()).add(
            row.exact_output
        )

    dispositions: list[str] = []
    governance_outputs: list[str] = []
    reasons: list[str] = []

    for row in result.itertuples(index=False):
        underspecified = str(row.underspecified_family).strip().casefold() in {
            "true",
            "1",
            "yes",
        }
        conflict = len(approved_targets_by_cluster.get(row.fuzzy_output, set())) > 1

        if underspecified:
            dispositions.append("ambiguous_or_underspecified")
            governance_outputs.append("")
            reasons.append("underspecified_model_family")
        elif row.fuzzy_changed and conflict:
            dispositions.append("manual_review")
            governance_outputs.append("")
            reasons.append("cross_approved_canonical_conflict")
        elif row.fuzzy_changed:
            dispositions.append("auto_accepted")
            governance_outputs.append(row.fuzzy_output)
            reasons.append("")
        else:
            dispositions.append("exact_or_deterministic")
            governance_outputs.append(row.exact_output)
            reasons.append("")

    result["governance_disposition"] = dispositions
    result["governance_output"] = governance_outputs
    result["governance_reason"] = reasons

    return result[
        [
            RAW_MODEL_COLUMN,
            "exact_output",
            "fuzzy_output",
            "fuzzy_changed",
            "governance_disposition",
            "governance_output",
            "governance_reason",
        ]
    ]
