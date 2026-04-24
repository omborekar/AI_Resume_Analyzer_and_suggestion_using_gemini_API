"""
DSA Implementation: Levenshtein Edit Distance & Fuzzy Matching
===============================================================
Used to handle typos, abbreviations, and alternate spellings
in resume skill keywords (e.g. "Pyhton" → "Python").

Algorithm: Wagner–Fischer dynamic programming (space-optimised).
Time Complexity : O(m * n)  where m, n = string lengths
Space Complexity: O(min(m, n)) — two-row DP, no full matrix stored

Cognizant ACE relevance: Edit distance is a classic DP interview question.
"""

from __future__ import annotations


# ---------------------------------------------------------------------------
# Core Algorithm
# ---------------------------------------------------------------------------


def levenshtein_distance(s1: str, s2: str) -> int:
    """
    Compute the minimum edit distance between two strings.

    Operations allowed: insert, delete, substitute (cost = 1 each).

    Space-Optimised version uses two rows instead of the full m×n matrix.

    Parameters
    ----------
    s1, s2 : str
        Input strings (case-insensitive — internally lowercased).

    Returns
    -------
    int
        Minimum number of single-character edits needed.

    Examples
    --------
    >>> levenshtein_distance("python", "pyhton")
    2
    >>> levenshtein_distance("reactjs", "react")
    2
    >>> levenshtein_distance("", "hello")
    5
    """
    s1, s2 = s1.lower(), s2.lower()

    # Ensure s1 is the longer string for space optimisation
    if len(s1) < len(s2):
        s1, s2 = s2, s1

    m, n = len(s1), len(s2)

    # Base cases
    if n == 0:
        return m

    # DP with two rows
    prev_row = list(range(n + 1))

    for i, c1 in enumerate(s1):
        curr_row = [i + 1]
        for j, c2 in enumerate(s2):
            cost = 0 if c1 == c2 else 1
            curr_row.append(
                min(
                    prev_row[j + 1] + 1,   # deletion
                    curr_row[j] + 1,        # insertion
                    prev_row[j] + cost,     # substitution
                )
            )
        prev_row = curr_row

    return prev_row[n]


def similarity_score(s1: str, s2: str) -> float:
    """
    Normalised similarity ∈ [0, 1] based on Levenshtein distance.
    1.0 = identical strings, 0.0 = completely different.
    """
    max_len = max(len(s1), len(s2), 1)
    return 1.0 - levenshtein_distance(s1, s2) / max_len


# ---------------------------------------------------------------------------
# Fuzzy Matching Utilities
# ---------------------------------------------------------------------------


def fuzzy_match(
    word: str,
    skill_list: list[str],
    threshold: int = 2,
) -> list[tuple[str, int]]:
    """
    Find all skills in *skill_list* within edit distance *threshold* of *word*.

    Checks both the full skill string and each individual word within
    multi-word skills (e.g. "Machine Learning" → checks "machine", "learning").

    Parameters
    ----------
    word       : str   — token from the resume text.
    skill_list : list  — canonical skill names to compare against.
    threshold  : int   — maximum edit distance to accept as a match.

    Returns
    -------
    list of (skill, distance) tuples sorted by ascending distance.
    """
    matches: list[tuple[str, int]] = []
    word_lower = word.lower()

    for skill in skill_list:
        # Full skill string comparison
        dist = levenshtein_distance(word_lower, skill.lower())
        if dist <= threshold:
            matches.append((skill, dist))
            continue

        # Word-by-word for multi-word skills (skip short stop-words)
        for part in skill.lower().split():
            if len(part) > 3:
                dist = levenshtein_distance(word_lower, part)
                if dist <= threshold:
                    matches.append((skill, dist))
                    break

    return sorted(matches, key=lambda x: x[1])


def best_fuzzy_match(
    word: str,
    skill_list: list[str],
    threshold: int = 2,
) -> tuple[str, int] | None:
    """
    Return the single closest fuzzy match, or None if no match within threshold.
    """
    matches = fuzzy_match(word, skill_list, threshold)
    return matches[0] if matches else None
