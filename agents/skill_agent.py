"""
Agent 2 — Skill Agent
=====================
Responsibilities:
  1. Match skills from resume text using a Trie (DSA, O(m) per lookup).
  2. Apply Levenshtein fuzzy matching for typos / abbreviations.
  3. Compute weighted skill score (high-priority Cognizant ACE skills worth more).
  4. Build radar chart data for 6 competency categories.
  5. Tag each skill with its priority tier.
"""

from __future__ import annotations

from utils.trie import Trie
from utils.fuzzy import fuzzy_match

# ---------------------------------------------------------------------------
# Skill Taxonomy — 80+ skills covering all Cognizant ACE requirements
# ---------------------------------------------------------------------------

COGNIZANT_ACE_SKILLS: list[str] = [
    # Core Programming Languages (DSA languages)
    "Python", "Java", "C#", ".NET", "C++", "JavaScript", "TypeScript",
    "Node.js", "Go", "Rust", "PHP", "Ruby", "Kotlin", "Swift", "Scala",

    # Frontend Development
    "React", "React.js", "Angular", "Vue.js", "Next.js", "Svelte",
    "HTML", "CSS", "Tailwind CSS", "Material UI", "Bootstrap", "SASS",
    "Redux", "Zustand", "Vite", "Webpack",

    # Backend Frameworks
    "Flask", "Django", "FastAPI", "Spring Boot", "Express.js", "ASP.NET",
    "REST API", "GraphQL", "Microservices", "gRPC",

    # Generative AI & LLMs (Cognizant ACE Priority)
    "Generative AI", "Gen AI", "LLM", "Large Language Model",
    "Prompt Engineering", "Chain of Thought", "Few Shot Learning",
    "Zero Shot", "ReAct", "Structured Output",
    "RAG", "Retrieval Augmented Generation",
    "Agentic AI", "AI Agents", "Multi Agent",
    "LangChain", "LlamaIndex", "AutoGen", "CrewAI",
    "Gemini", "GPT-4", "ChatGPT", "OpenAI", "Claude", "Llama",
    "HuggingFace", "HuggingFace Transformers",

    # Machine Learning & Deep Learning
    "Machine Learning", "Deep Learning", "Neural Network",
    "Natural Language Processing", "NLP", "Computer Vision",
    "TensorFlow", "PyTorch", "scikit-learn", "Keras",
    "Reinforcement Learning", "Transfer Learning", "Fine Tuning",
    "Embeddings", "Semantic Search", "Similarity Search",

    # Vector Databases & RAG Infrastructure
    "ChromaDB", "FAISS", "Pinecone", "Weaviate", "Vector Database",
    "Sentence Transformers",

    # Cloud & DevOps
    "AWS", "Azure", "GCP", "Google Cloud", "Cloud Computing",
    "Docker", "Kubernetes", "CI/CD", "DevOps", "Terraform",
    "GitHub Actions", "Jenkins", "Cloud Run", "Lambda",
    "Cloud Storage", "Vertex AI",

    # Databases
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis",
    "SQLite", "Firebase", "DynamoDB",

    # Data Science
    "Data Science", "Data Analysis", "Pandas", "NumPy",
    "Matplotlib", "Seaborn", "Jupyter",

    # DSA & Software Engineering
    "Data Structures", "Algorithms", "Dynamic Programming",
    "Graph Algorithms", "Binary Search", "Sorting Algorithms",
    "System Design", "Object Oriented Programming", "OOP",
    "Design Patterns", "Clean Code", "SOLID",

    # Tools & Practices
    "Git", "GitHub", "Agile", "Scrum", "Unit Testing",
    "pytest", "JUnit", "Test Driven Development",

    # Soft Skills (bonus)
    "Problem Solving", "Communication", "Teamwork", "Leadership",
    "Critical Thinking",
]

# Priority tiers aligned with Cognizant ACE 12 LPA expectations
SKILL_PRIORITY: dict[str, list[str]] = {
    "critical": [
        "Python", "Java", "React", "React.js",
        "Generative AI", "Gen AI", "LLM",
        "Prompt Engineering", "RAG", "Retrieval Augmented Generation",
        "Agentic AI", "LangChain", "Gemini", "ChatGPT", "Machine Learning",
    ],
    "high": [
        ".NET", "C#", "TypeScript", "Node.js", "FastAPI", "Django", "Flask",
        "Deep Learning", "NLP", "TensorFlow", "PyTorch", "HuggingFace",
        "Docker", "Cloud Computing", "GCP", "AWS", "Azure",
        "Data Structures", "Algorithms", "System Design",
        "CI/CD", "Kubernetes", "REST API",
    ],
    "medium": [
        "JavaScript", "HTML", "CSS", "SQL", "MongoDB", "PostgreSQL",
        "Git", "GitHub", "Agile", "Scrum", "OOP", "Design Patterns",
        "NumPy", "Pandas", "scikit-learn", "Data Science",
        "Unit Testing", "Vector Database", "ChromaDB",
    ],
    "low": [
        "C++", "PHP", "Ruby", "Go", "Bootstrap", "Tailwind CSS",
        "Firebase", "Redis", "Matplotlib", "Jupyter",
        "Problem Solving", "Communication", "Teamwork",
    ],
}

# Radar chart: 6 competency categories
RADAR_CATEGORIES: dict[str, list[str]] = {
    "Programming": [
        "Python", "Java", "C#", ".NET", "JavaScript", "TypeScript", "C++",
    ],
    "Frontend": [
        "React", "React.js", "Angular", "Vue.js", "Next.js", "HTML", "CSS", "TypeScript",
    ],
    "Gen AI & ML": [
        "Generative AI", "Machine Learning", "Deep Learning",
        "NLP", "Prompt Engineering", "RAG",
        "LangChain", "Agentic AI", "LLM",
    ],
    "Cloud & DevOps": [
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD",
        "Cloud Computing", "Terraform",
    ],
    "Data & DB": [
        "SQL", "MongoDB", "PostgreSQL", "Data Science",
        "Pandas", "NumPy", "Vector Database", "ChromaDB",
    ],
    "DSA & Design": [
        "Data Structures", "Algorithms", "Dynamic Programming",
        "System Design", "OOP", "Design Patterns", "SOLID",
    ],
}


# ---------------------------------------------------------------------------
# Skill Agent
# ---------------------------------------------------------------------------


class SkillAgent:
    """
    Skill Agent: DSA-powered resume skill extractor.

    Pipeline
    --------
    1. Build Trie from 80+ skill taxonomy.
    2. Scan resume text — exact O(m) Trie lookup for 1-4 word skills.
    3. Fuzzy-match remaining tokens (Levenshtein ≤ 1 edit distance).
    4. Compute weighted skill score and radar data.
    """

    def __init__(self) -> None:
        self.trie = Trie()
        self._all_skills = COGNIZANT_ACE_SKILLS
        self._build_trie()

    def _build_trie(self) -> None:
        """Populate the Trie with all skills in the taxonomy."""
        for skill in self._all_skills:
            self.trie.insert(skill)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self, text: str) -> dict:
        """
        Analyse a resume text and return a comprehensive skill report.

        Returns
        -------
        dict with: matched_skills, missing_skills, match_percentage,
                   weighted_score, radar_data, trie_stats, priority_breakdown
        """
        # Step 1: Trie exact matching
        trie_matches: set[str] = set(self.trie.search_all_in_text(text))

        # Step 2: Fuzzy matching (catch typos / abbreviations)
        fuzzy_matches: set[str] = set()
        tokens = text.lower().replace("\n", " ").split()
        for token in tokens:
            token_clean = token.strip(".,;:()[]{}!?\"'")
            if len(token_clean) > 4 and token_clean not in {
                s.lower() for s in trie_matches
            }:
                hits = fuzzy_match(token_clean, self._all_skills, threshold=1)
                for skill, dist in hits:
                    if dist == 1:
                        fuzzy_matches.add(skill)

        all_matched = trie_matches | fuzzy_matches

        # Step 3: Priority classification
        priority_breakdown = self._classify_by_priority(all_matched)

        # Step 4: Missing critical skills
        critical_missing = [
            s for s in SKILL_PRIORITY["critical"] if s not in all_matched
        ]
        high_missing = [
            s for s in SKILL_PRIORITY["high"] if s not in all_matched
        ]

        # Step 5: Weighted score (critical > high > medium > low)
        weighted_score = self._calc_weighted_score(all_matched)

        # Step 6: Raw percentage
        match_pct = round(len(all_matched) / len(self._all_skills) * 100, 1)

        # Step 7: Radar data for Chart.js
        radar_data = self._build_radar_data(all_matched)

        return {
            "matched_skills": sorted(all_matched),
            "fuzzy_matched": sorted(fuzzy_matches),
            "missing_skills": critical_missing[:10],          # top-priority gaps
            "high_missing_skills": high_missing[:6],
            "match_percentage": match_pct,
            "weighted_score": weighted_score,
            "priority_breakdown": priority_breakdown,
            "radar_data": radar_data,
            "trie_stats": {
                "trie_size": len(self.trie),
                "exact_matches": len(trie_matches),
                "fuzzy_matches": len(fuzzy_matches),
                "total_matched": len(all_matched),
                "algorithm": "Trie O(m) + Levenshtein DP",
            },
        }

    # ------------------------------------------------------------------
    # Private Helpers
    # ------------------------------------------------------------------

    def _classify_by_priority(self, matched: set[str]) -> dict[str, list[str]]:
        return {
            tier: [s for s in skills if s in matched]
            for tier, skills in SKILL_PRIORITY.items()
        }

    def _calc_weighted_score(self, matched: set[str]) -> float:
        weights = {"critical": 50, "high": 30, "medium": 15, "low": 5}
        total, earned = 0.0, 0.0
        for tier, skills in SKILL_PRIORITY.items():
            w = weights[tier]
            total += len(skills) * w
            earned += sum(w for s in skills if s in matched)
        return round((earned / total) * 100, 1) if total else 0.0

    def _build_radar_data(self, matched: set[str]) -> dict[str, float]:
        return {
            cat: round(
                sum(1 for s in skills if s in matched) / len(skills) * 100, 1
            )
            for cat, skills in RADAR_CATEGORIES.items()
        }
