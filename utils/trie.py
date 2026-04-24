"""
DSA Implementation: Trie (Prefix Tree) Data Structure
======================================================
Used for O(m) skill keyword lookup in resume text.
m = length of the keyword being searched.

Time Complexity:
  - Insert: O(m)
  - Search: O(m)
  - Multi-word scan: O(n + z) where n=text length, z=matches

Space Complexity: O(N * M) where N=total skills, M=avg skill length

This is a core DSA concept tested in Cognizant ACE coding rounds.
"""

from __future__ import annotations
from typing import Optional


class TrieNode:
    """
    A single node in the Trie.
    Each node represents one character in a skill keyword.
    """

    def __init__(self) -> None:
        self.children: dict[str, TrieNode] = {}
        self.is_end: bool = False
        self.skill_canonical: Optional[str] = None  # Original casing

    def __repr__(self) -> str:
        return (
            f"TrieNode(chars={list(self.children.keys())}, "
            f"is_end={self.is_end}, skill={self.skill_canonical})"
        )


class Trie:
    """
    Trie (Prefix Tree) optimised for resume skill matching.

    Supports:
    - Exact skill lookup
    - Prefix checks
    - Full-text multi-word skill scanning (bigrams, trigrams)

    Example
    -------
    >>> t = Trie()
    >>> t.insert("Machine Learning")
    >>> t.search("machine learning")
    (True, 'Machine Learning')
    >>> t.search_all_in_text("I have experience in Machine Learning and Python")
    ['Machine Learning', 'Python']
    """

    def __init__(self) -> None:
        self.root = TrieNode()
        self._size: int = 0

    # ------------------------------------------------------------------
    # Core Operations
    # ------------------------------------------------------------------

    def insert(self, skill: str) -> None:
        """
        Insert a skill into the Trie.
        Time: O(m)  |  Space: O(m) per new path
        """
        node = self.root
        for char in skill.lower():
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        if not node.is_end:          # avoid duplicate counting
            node.is_end = True
            node.skill_canonical = skill
            self._size += 1

    def search(self, word: str) -> tuple[bool, Optional[str]]:
        """
        Exact skill lookup.
        Time: O(m)
        Returns (found, canonical_name)
        """
        node = self.root
        for char in word.lower():
            if char not in node.children:
                return False, None
            node = node.children[char]
        return node.is_end, node.skill_canonical if node.is_end else None

    def starts_with(self, prefix: str) -> bool:
        """
        Check whether any inserted skill starts with *prefix*.
        Time: O(m)
        """
        node = self.root
        for char in prefix.lower():
            if char not in node.children:
                return False
            node = node.children[char]
        return True

    # ------------------------------------------------------------------
    # Full-Text Scanning
    # ------------------------------------------------------------------

    def search_all_in_text(self, text: str) -> list[str]:
        """
        Scan free-form text and return every skill that appears in it.

        Algorithm
        ---------
        1. Tokenise text into words.
        2. Check each 1-gram, 2-gram, 3-gram, and 4-gram against the Trie.
        3. Return the list of canonical skill names found (de-duplicated).

        Time: O(n * k) where n = words in text, k = max n-gram width (4)
        """
        # Normalise separators
        normalised = (
            text.lower()
            .replace("\n", " ")
            .replace(",", " ")
            .replace("/", " ")
            .replace("|", " ")
            .replace("•", " ")
            .replace("·", " ")
        )
        tokens = normalised.split()
        # Strip punctuation from individual tokens
        cleaned = [t.strip(".,;:()[]{}!?\"'") for t in tokens]

        found: set[str] = set()

        for i, token in enumerate(cleaned):
            # 1-gram
            hit, canonical = self.search(token)
            if hit and canonical:
                found.add(canonical)

            # 2-gram, 3-gram, 4-gram (multi-word skills)
            for n in range(2, 5):
                if i + n <= len(cleaned):
                    phrase = " ".join(cleaned[i : i + n])
                    hit, canonical = self.search(phrase)
                    if hit and canonical:
                        found.add(canonical)

        return list(found)

    # ------------------------------------------------------------------
    # Dunder helpers
    # ------------------------------------------------------------------

    def __len__(self) -> int:
        return self._size

    def __repr__(self) -> str:
        return f"Trie(size={self._size})"
