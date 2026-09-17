"""Frozen greedy fuzzy-clustering mechanics used by the synthetic release."""

from __future__ import annotations

from thefuzz import fuzz

SIMILARITY_THRESHOLD = 88


def build_clusters(normalized_names: list[str]) -> dict[str, str]:
    """Return a normalized-name -> representative mapping.

    The algorithm intentionally preserves the frozen production behavior:
    first-observed order, greedy seed comparisons, immediate visitation, and
    longest-string representative selection.
    """
    unique = list(dict.fromkeys(normalized_names))
    visited: set[str] = set()
    clusters: dict[str, str] = {}

    for index, seed in enumerate(unique):
        if seed in visited:
            continue

        group = [seed]
        visited.add(seed)

        for candidate in unique[index + 1 :]:
            if candidate in visited:
                continue
            if fuzz.token_sort_ratio(seed, candidate) >= SIMILARITY_THRESHOLD:
                group.append(candidate)
                visited.add(candidate)

        representative = max(group, key=len)
        for member in group:
            clusters[member] = representative

    return clusters
