"""
Agent 1 — Parser Agent
======================
Responsibilities:
  1. Extract raw text from PDF / DOCX resume files.
  2. Detect which sections are present (Education, Skills, etc.).
  3. Chunk text into overlapping windows for downstream RAG embedding.
  4. Return structured metadata about the resume.
"""

from __future__ import annotations

import re
from typing import Any

import pdfminer.high_level
import docx


class ParserAgent:
    """
    Parser Agent: File ingestion and NLP pre-processing.

    Usage
    -----
    agent = ParserAgent()
    result = agent.run("/path/to/resume.pdf", "pdf")
    print(result["metadata"])  # {'word_count': 350, 'sections_found': [...]}
    """

    SECTION_PATTERNS: dict[str, str] = {
        "education": r"(education|academic|qualification|degree|university|college|b\.?tech|m\.?tech|b\.?e\.?|b\.?sc)",
        "experience": r"(experience|employment|work history|internship|job|career|professional)",
        "skills": r"(skills|technologies|tech stack|tools|competencies|proficiencies|expertise)",
        "projects": r"(projects|portfolio|work samples|implementations|applications built|case study)",
        "certifications": r"(certif|certification|credential|licence|license|award|achievement|badges)",
        "summary": r"(summary|objective|profile|about me|overview|introduction|career goal)",
        "achievements": r"(achievement|accomplishment|recognition|honor|honour|award)",
        "publications": r"(publication|research|paper|journal|conference|arxiv)",
    }

    # ---------------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------------

    def run(self, filepath: str, ext: str) -> dict[str, Any]:
        """
        Main entry point for the Parser Agent.

        Parameters
        ----------
        filepath : str — absolute path to the uploaded resume file.
        ext      : str — file extension ('pdf' or 'docx').

        Returns
        -------
        dict with keys: text, sections, chunks, metadata
        """
        text = self._extract_text(filepath, ext)
        sections = self._detect_sections(text)
        chunks = self._chunk_text(text, chunk_size=400, overlap=80)

        metadata = {
            "word_count": len(text.split()),
            "char_count": len(text),
            "line_count": len(text.splitlines()),
            "sections_found": list(sections.keys()),
            "section_count": len(sections),
            "chunk_count": len(chunks),
            "has_education": "education" in sections,
            "has_experience": "experience" in sections,
            "has_projects": "projects" in sections,
            "has_skills": "skills" in sections,
            "has_certifications": "certifications" in sections,
            "has_summary": "summary" in sections,
            "quality_score": self._resume_quality_score(sections, text),
        }

        return {
            "text": text,
            "sections": sections,
            "chunks": chunks,
            "metadata": metadata,
        }

    # ---------------------------------------------------------------------------
    # Text Extraction
    # ---------------------------------------------------------------------------

    def _extract_text(self, filepath: str, ext: str) -> str:
        if ext == "pdf":
            return self._extract_pdf(filepath)
        elif ext == "docx":
            return self._extract_docx(filepath)
        raise ValueError(f"Unsupported file extension: {ext!r}")

    def _extract_pdf(self, filepath: str) -> str:
        try:
            text = pdfminer.high_level.extract_text(filepath)
            return text.strip() if text else ""
        except Exception as exc:
            raise RuntimeError(f"PDF extraction failed: {exc}") from exc

    def _extract_docx(self, filepath: str) -> str:
        try:
            doc = docx.Document(filepath)
            paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
            return "\n".join(paragraphs).strip()
        except Exception as exc:
            raise RuntimeError(f"DOCX extraction failed: {exc}") from exc

    # ---------------------------------------------------------------------------
    # Section Detection
    # ---------------------------------------------------------------------------

    def _detect_sections(self, text: str) -> dict[str, str]:
        """
        Detect which resume sections are present using regex patterns.
        Returns a dict of {section_name: 'detected'}.
        """
        text_lower = text.lower()
        return {
            section: "detected"
            for section, pattern in self.SECTION_PATTERNS.items()
            if re.search(pattern, text_lower)
        }

    # ---------------------------------------------------------------------------
    # Text Chunking (for RAG pipeline)
    # ---------------------------------------------------------------------------

    def _chunk_text(
        self, text: str, chunk_size: int = 400, overlap: int = 80
    ) -> list[str]:
        """
        Split text into overlapping word-level chunks.
        Overlapping windows ensure context isn't lost at chunk boundaries.

        chunk_size : number of words per chunk.
        overlap    : number of words shared between consecutive chunks.
        """
        words = text.split()
        chunks: list[str] = []
        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunks.append(" ".join(words[start:end]))
            if end == len(words):
                break
            start += chunk_size - overlap
        return chunks

    # ---------------------------------------------------------------------------
    # Quality Scoring
    # ---------------------------------------------------------------------------

    def _resume_quality_score(self, sections: dict, text: str) -> int:
        """
        Heuristic quality score out of 100.
        Penalises missing key sections; rewards length and completeness.
        """
        score = 0
        section_scores = {
            "education": 15,
            "experience": 20,
            "skills": 20,
            "projects": 20,
            "certifications": 10,
            "summary": 10,
        }
        for section, pts in section_scores.items():
            if section in sections:
                score += pts

        # Length bonus (200–600 words is ideal range)
        wc = len(text.split())
        if 200 <= wc <= 800:
            score += 5
        return min(score, 100)
