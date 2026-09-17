"""Run and verify the deterministic CMPB synthetic reproducibility fixture."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PACKAGE_ROOT / "src"))

from governance_demo import load_fixture, load_mapping, run_synthetic_pipeline  # noqa: E402


def main() -> int:
    """Run the fixture and require exact agreement with the frozen expected CSV."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional path for writing the verified synthetic output.",
    )
    args = parser.parse_args()

    fixture = load_fixture(PACKAGE_ROOT / "fixtures" / "synthetic_raw_models.csv")
    mapping = load_mapping(PACKAGE_ROOT / "fixtures" / "synthetic_mapping.csv")
    actual = run_synthetic_pipeline(fixture, mapping)
    expected = pd.read_csv(
        PACKAGE_ROOT / "fixtures" / "expected_output.csv",
        keep_default_na=False,
    )

    pd.testing.assert_frame_equal(actual, expected, check_dtype=False)

    if args.output is not None:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        actual.to_csv(args.output, index=False, lineterminator="\n")

    print("PASS: synthetic output matches expected_output.csv")
    print(actual.to_csv(index=False, lineterminator="\n"), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
