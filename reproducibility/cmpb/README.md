# CMPB reproducibility package

This directory contains the paper-specific reproducibility package for the CMPB manuscript:

> Governance and Reproducibility of a Reusable Pipeline for Administrative Health-Data Standardization: A Seven-Year HIRA MRI Study

## Scope

Level A demonstrates computational mechanics:

- approved exact mapping;
- deterministic normalization fallback;
- the frozen greedy/order-dependent `token_sort_ratio >= 88` clustering procedure;
- exact-only versus fuzzy-inclusive outputs;
- a cross-approved-canonical governance trigger;
- an ambiguous/underspecified family disposition; and
- byte-stable expected synthetic outputs.

Level B exposes frozen aggregate manuscript outputs without row-level source or reviewer evidence.

This package does **not** contain HIRA raw data, reviewer workbooks, row-level semantic-review evidence, the production canonical mapping asset, hospital-internal data, or credentials. The Level A model names are fictional.

This package is separate from the production dashboard surface.

## Frozen fuzzy-clustering procedure

The included `src/fuzzy_cluster.py` reproduces the manuscript's frozen mechanics:

1. preserve first-observed order while removing duplicates;
2. iterate unvisited names in that order;
3. seed a cluster with the current name;
4. compare the seed with later unvisited names using `thefuzz.fuzz.token_sort_ratio`;
5. include a later name when similarity is at least 88;
6. mark included names visited immediately;
7. choose the longest string in the group as the representative; and
8. map every member of the group to that representative.

This is a greedy, seed-based, order-dependent procedure. It is not transitive clustering. Threshold 88 is the frozen reference operating point, not an optimized threshold.

## Run Level A

From this directory:

```bash
python -m venv .venv
python -m pip install -r environment/requirements.lock.txt
python scripts/run_synthetic_example.py
python -m pytest -q
```

A successful example prints `PASS: synthetic output matches expected_output.csv`.

## Level A validation status

Level A final clean-environment validation was completed on 17 September 2026 using a temporary directory containing only this package, Python 3.13.14, and dependencies installed from `environment/requirements.lock.txt` in a newly created virtual environment.

Validated dependency versions were:

- pandas `2.2.3`
- thefuzz `0.22.1`
- rapidfuzz `3.14.3`
- pytest `9.0.2`

The synthetic example passed and all five Level A tests passed. Details are recorded in `environment/runtime.md`.

Level A package validation is complete. Public fresh-clone acceptance was completed on 18 September 2026 from public commit `effd69a040b57449c095eb59c5f2740f4be247d1`. Locked dependency installation, the synthetic example, the Level B verifier, the release-content audit, and the full package test suite all passed; the fresh-clone test suite completed with `15 passed in 1.63s`. Details are recorded in `environment/runtime.md`.

## Level B frozen aggregate outputs

Level B adds only aggregate, non-row-identifying manuscript outputs:

- `frozen_outputs/threshold_sensitivity_summary.json`;
- `frozen_outputs/pipeline_comparison_summary_public.json`;
- `frozen_outputs/evidence_manifest.sha256`;
- `scripts/verify_frozen_summaries.py`; and
- `tests/test_frozen_summaries.py`.

The public pipeline summary contains aggregate semantic-reference, exact-only, fuzzy-inclusive, governance-aware, pairwise-difference, and governance-gate counts. It does not contain reviewer row-level decisions, reviewer workbooks, HIRA raw rows, or the production canonical mapping asset.

`evidence_manifest.sha256` records only SHA-256 values and logical `NON_DISTRIBUTED/` labels for seven frozen local evidence artifacts. The listed source artifacts are not bundled in this package.

To verify Level B:

```bash
python scripts/verify_frozen_summaries.py
python -m pytest -q
```

A successful aggregate verification prints `PASS: frozen CMPB Level B aggregate summaries verified`.

The frozen JSON files are tied to analysis freeze `paper-cmpb-analysis-v1.0` (`349a047f9bdb3b6780edbc274f1742ad6d5d8f27`). Threshold 88 remains the frozen reference operating point and is not presented as optimal. The governance-aware arm remains a retrospective simulation informed by completed semantic review, not prespecified external validation.

## Release-content audit

Before public copying, run:

```bash
python scripts/audit_release_content.py
python -m pytest -q
```

The audit rejects protected mapping files, reviewer workbooks, known private/local evidence paths, non-UTF-8/binary files, user-home absolute paths, and common credential/private-key markers. A successful audit prints `PASS: CMPB release-content audit`.

## Expected Level A demonstration

The fixture intentionally includes two distinct approved fictional identities, `Atlas Nova` and `Atlas N0va`, whose token-sort similarity meets the frozen threshold. Because `Atlas Nova` is observed first, the greedy cluster uses it as the representative. The fuzzy-inclusive arm therefore changes `Atlas N0va` to `Atlas Nova`, while the governance demo routes that changed value to manual review because the candidate cluster spans two approved canonical identities.

`Comet   Prime` is intentionally absent from the synthetic mapping and demonstrates deterministic whitespace normalization. `Nebula` is explicitly flagged in the fixture as an underspecified family and is retained as an ambiguous disposition.

## Reproducibility boundary

Passing this package verifies Level A code mechanics and Level B frozen aggregate consistency. It does **not** reproduce the full 2019-2025 HIRA study. Full study replay additionally requires authoritative annual HIRA source snapshots and the frozen curated mapping/evidence state described in the manuscript release documentation.
