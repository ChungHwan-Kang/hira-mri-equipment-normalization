# Level A validation status

Final validation date: 17 September 2026

Validated package branch:

- branch: `paper/reproducibility-release`
- Level A implementation commit: `1eea952e6218379badd15d5ad063dc37c7ad4939`
- documentation baseline before final validation update: `398f3e4198047a00e1855f88698fa8b5cf4e4f0f`

## Final clean-environment validation

A network-enabled Windows environment was used to validate the Level A package after copying only `reproducibility/cmpb/` into a newly created temporary directory. A new Python 3.13 virtual environment was created inside that temporary package directory, and the locked dependencies were installed with pip from `environment/requirements.lock.txt`.

Observed environment:

- Python: `3.13.14` (`MSC v.1944 64 bit (AMD64)`)
- pandas: `2.2.3`
- TheFuzz: `0.22.1`
- RapidFuzz: `3.14.3`
- pytest: `9.0.2`
- pip after upgrade: `26.2.1`
- host: Windows PowerShell environment; exact Windows build was not captured

The dependency installation completed successfully from the network-enabled clean virtual environment.

## Validation result

Synthetic example command:

```text
.\.venv\Scripts\python.exe .\scripts\run_synthetic_example.py
```

Result:

```text
PASS: synthetic output matches expected_output.csv
```

The verified synthetic output included the expected exact-only, fuzzy-inclusive, manual-review, deterministic-fallback, and ambiguous/underspecified paths.

Test command:

```text
.\.venv\Scripts\python.exe -m pytest -q
```

Result:

```text
..... [100%]
5 passed in 1.07s
```

Accordingly, the Level A status is:

```text
LEVEL_A_IMPLEMENTATION = COMPLETED
LEVEL_A_LOGIC_CHECK = COMPLETED
ACTUAL_THEFUZZ_0.22.1_CLEAN_ENV_TEST = PASS
NETWORK_DEPENDENCY_INSTALL_TEST = PASS
LEVEL_A_FINAL_VALIDATION = PASS
PUBLIC_CLONE_ACCEPTANCE = NOT_COMPLETED
```

`PUBLIC_CLONE_ACCEPTANCE` remains separate because the reproducibility package has not yet been published to the public repository. After publication, a fresh clone of the public release must repeat the documented install, example, and pytest commands before the manuscript cites that release URL or DOI.

## Reproducibility boundary

This validation demonstrates that the Level A package is self-contained with respect to its synthetic code-mechanics demonstration. It did not require HIRA raw data, reviewer workbooks, row-level semantic-review evidence, or the production `model_canonical_mapping.csv` asset.

It does not constitute a full replay of the 2019-2025 empirical HIRA study.

## Runtime reporting

The `5 passed in 1.07s` value is test-suite timing for the tiny synthetic Level A package. It is not a production-pipeline runtime and must not be used as a manuscript performance benchmark.
