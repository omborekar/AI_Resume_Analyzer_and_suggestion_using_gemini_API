"""
Agent 3 — RAG Agent (Retrieval-Augmented Generation)
=====================================================
Implements a lightweight RAG pipeline WITHOUT external vector DB dependencies:

  1. INDEXING  : TF-IDF vectorise the Cognizant JD knowledge base at startup.
  2. RETRIEVAL : Cosine-similarity search to find the most relevant JD chunks
                 for the candidate's resume text.
  3. AUGMENTATION: Return top-k context snippets to the Coach Agent prompt,
                   enabling factual, role-specific coaching advice.

Why TF-IDF instead of neural embeddings?
  - Zero extra downloads, dependency-free (scikit-learn is already installed).
  - Fully transparent — interviewers can understand the math.
  - Easily upgradeable to ChromaDB + sentence-transformers or Vertex AI embeddings.

Architecture note: In a production system this module would be replaced by
  ChromaDB / FAISS with Google's text-embedding-004 model for semantic search.
"""

from __future__ import annotations

import os
import re
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class RAGAgent:
    """
    RAG Agent: TF-IDF based Retrieval-Augmented Generation pipeline.

    Stage 1 (Indexing)  — done once at __init__:
        - Load Cognizant JD knowledge base.
        - Split into overlapping chunks.
        - Fit TF-IDF vectoriser and build document matrix.

    Stage 2 (Retrieval) — called per resume:
        - Transform resume text with the SAME vectoriser.
        - Cosine-similarity against all JD chunks.
        - Return top-k chunks as RAG context.

    Stage 3 (Gap Analysis):
        - Compare skill keywords in top chunks vs. resume → surface gaps.
    """

    DEFAULT_JD_PATH = Path(__file__).parent.parent / "knowledge_base" / "cognizant_jd.txt"
    CHUNK_SIZE_WORDS = 80
    CHUNK_OVERLAP_WORDS = 20
    TOP_K = 4

    def __init__(self) -> None:
        self._jd_chunks: list[str] = []
        self._vectoriser = TfidfVectorizer(
            ngram_range=(1, 3),
            max_features=8000,
            sublinear_tf=True,          # log-scaled TF (better for long docs)
            stop_words="english",
        )
        self._jd_matrix = None
        self._load_and_index()

    # ------------------------------------------------------------------
    # Stage 1 — Indexing
    # ------------------------------------------------------------------

    def _load_and_index(self, jd_path: Path | None = None) -> None:
        """Load JD file, chunk it, and build the TF-IDF index."""
        path = jd_path or self.DEFAULT_JD_PATH
        if not path.exists():
            raise FileNotFoundError(f"Knowledge base not found: {path}")

        raw = path.read_text(encoding="utf-8")
        self._jd_chunks = self._chunk_text(raw)
        self._jd_matrix = self._vectoriser.fit_transform(self._jd_chunks)

    def _chunk_text(self, text: str) -> list[str]:
        """Word-level sliding-window chunking with overlap."""
        words = text.split()
        chunks, start = [], 0
        while start < len(words):
            end = min(start + self.CHUNK_SIZE_WORDS, len(words))
            chunks.append(" ".join(words[start:end]))
            if end == len(words):
                break
            start += self.CHUNK_SIZE_WORDS - self.CHUNK_OVERLAP_WORDS
        return chunks

    # ------------------------------------------------------------------
    # Stage 2 + 3 — Retrieval & Gap Analysis
    # ------------------------------------------------------------------

    def run(self, resume_text: str) -> dict:
        """
        Main entry point for the RAG Agent.

        Parameters
        ----------
        resume_text : str — raw text of the uploaded resume.

        Returns
        -------
        dict with: context, top_chunks, jd_similarity_score, keyword_gaps,
                   rag_confidence, retrieval_stats
        """
        # Transform resume with the fitted vectoriser
        resume_vec = self._vectoriser.transform([resume_text])

        # Cosine similarity against all JD chunks
        scores: np.ndarray = cosine_similarity(resume_vec, self._jd_matrix)[0]

        top_indices = np.argsort(scores)[::-1][: self.TOP_K]
        top_scores = scores[top_indices]
        top_chunks = [self._jd_chunks[i] for i in top_indices]

        context = "\n\n---\n\n".join(top_chunks)
        jd_sim_score = float(np.mean(top_scores)) * 100
        overall_sim = float(np.max(scores)) * 100

        # Keyword gap analysis — JD terms NOT present in resume
        jd_keywords = self._extract_jd_keywords(context)
        resume_lower = resume_text.lower()
        keyword_gaps = [kw for kw in jd_keywords if kw not in resume_lower]

        return {
            "context": context,
            "top_chunks": top_chunks,
            "jd_similarity_score": round(overall_sim, 2),
            "rag_confidence": round(jd_sim_score, 2),
            "keyword_gaps": keyword_gaps[:10],
            "retrieval_stats": {
                "chunks_indexed": len(self._jd_chunks),
                "top_k_retrieved": self.TOP_K,
                "similarity_scores": [round(float(s) * 100, 2) for s in top_scores],
                "algorithm": "TF-IDF cosine similarity (sklearn)",
                "vectoriser_features": self._vectoriser.max_features,
            },
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _extract_jd_keywords(self, context: str) -> list[str]:
        """
        Extract domain keywords from retrieved JD chunks that recruiters care about.
        Simple regex-based extraction — fast and explainable.
        """
        important_terms = [
            "generative ai", "rag", "prompt engineering", "langchain",
            "agentic ai", "react", "python", "java", "docker", "kubernetes",
            "cloud", "gcp", "aws", "azure", "machine learning", "deep learning",
            "nlp", "llm", "vector database", "chromadb", "embeddings",
            "ci/cd", "microservices", "system design", "dsa", "data structures",
            "algorithms", "typescript", "rest api", "unit testing", "agile",
            "gemini", "huggingface", "fastapi", "django", "spring boot",
        ]
        context_lower = context.lower()
        return [term for term in important_terms if term in context_lower]
