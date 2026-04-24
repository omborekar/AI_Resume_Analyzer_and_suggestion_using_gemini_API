"""
Agent 4 — Coach Agent
======================
Responsibilities:
  1. Construct a chain-of-thought + few-shot prompt for Google Gemini 2.0 Flash.
  2. Augment the prompt with RAG context (retrieved JD chunks).
  3. Enforce structured JSON output for reliable frontend rendering.
  4. Provide graceful fallback if the API call fails.

Prompt Engineering Techniques used:
  - Chain-of-Thought (CoT): "Think step by step..."
  - Few-Shot Learning: One worked example included in the prompt.
  - Structured Output: JSON schema enforced via prompt instruction.
  - Role Prompting: "You are an elite AI career coach..."
  - Contextual Grounding: RAG context injected at the top of the prompt.
"""

from __future__ import annotations

import json
import os
import re

import google.generativeai as genai


# ---------------------------------------------------------------------------
# Default fallback (when Gemini API is unavailable)
# ---------------------------------------------------------------------------

_FALLBACK_RESPONSE = {
    "overall_rating": 6,
    "verdict": (
        "Your profile shows solid foundational skills. "
        "Focus on building Gen AI project experience to qualify for the 12 LPA band."
    ),
    "ats_score": 62,
    "strengths": [
        "Strong programming fundamentals (Python / Java)",
        "Demonstrated project experience",
        "Good academic background",
    ],
    "critical_gaps": [
        "No Generative AI / LLM project demonstrated",
        "Missing cloud deployment experience (Docker / GCP)",
        "RAG and Agentic AI frameworks not mentioned",
    ],
    "action_items": [
        {
            "priority": "high",
            "action": "Build a LangChain RAG chatbot using Gemini API and ChromaDB",
            "timeline": "2 weeks",
            "resource": "LangChain docs + Google AI Studio",
        },
        {
            "priority": "high",
            "action": "Add a React + TypeScript frontend to your best project",
            "timeline": "2–3 weeks",
            "resource": "Official React docs, Vite starter",
        },
        {
            "priority": "high",
            "action": "Containerise your project with Docker and deploy to GCP Cloud Run",
            "timeline": "1 week",
            "resource": "GCP free tier, Docker docs",
        },
        {
            "priority": "medium",
            "action": "Complete the DeepLearning.AI Prompt Engineering course",
            "timeline": "1 month",
            "resource": "deeplearning.ai — free audit",
        },
        {
            "priority": "low",
            "action": "Study LeetCode medium-level DSA for the Cognizant coding round",
            "timeline": "Ongoing",
            "resource": "LeetCode Top 150 problems",
        },
    ],
    "interview_tips": [
        "Be ready to explain your Gen AI project end-to-end (architecture, challenges, metrics)",
        "Practice explaining RAG vs. fine-tuning trade-offs (a common Cognizant interview question)",
        "Solve 2–3 LeetCode medium problems daily; focus on arrays, trees, DP",
    ],
    "resume_improvements": [
        "Add quantifiable impact to every project (e.g., 'reduced response time by 40%')",
        "List the exact tech stack per project (model names, frameworks, cloud provider)",
        "Move the Skills section to the top of the resume — ATS scanners weight it heavily",
    ],
    "certifications_to_earn": [
        "Google Cloud Associate Cloud Engineer",
        "DeepLearning.AI Prompt Engineering Specialisation",
        "HuggingFace NLP Course",
    ],
}


class CoachAgent:
    """
    Coach Agent: Gemini-powered AI career advisor.

    Prompt Engineering techniques:
      - Role prompt          : Sets expert persona.
      - RAG context injection: Grounds advice in actual JD requirements.
      - Chain-of-thought     : Explicit reasoning steps in the prompt.
      - Few-shot example     : One worked example for output format.
      - Structured output    : JSON schema enforced, regex-extracted.
    """

    MODEL_ID = "gemini-2.0-flash"

    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel(self.MODEL_ID)
        else:
            self._model = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(
        self,
        resume_text: str,
        rag_context: str,
        skill_analysis: dict,
    ) -> dict:
        """
        Run the Coach Agent.

        Parameters
        ----------
        resume_text    : str  — full resume text.
        rag_context    : str  — top JD chunks retrieved by RAG Agent.
        skill_analysis : dict — output from Skill Agent.

        Returns
        -------
        dict — structured coaching report (JSON-parsed from Gemini).
        """
        if self._model is None:
            return _FALLBACK_RESPONSE

        prompt = self._build_prompt(resume_text, rag_context, skill_analysis)
        try:
            response = self._model.generate_content(prompt)
            return self._parse_response(response.text)
        except Exception as exc:
            print(f"[CoachAgent] Gemini API error: {exc}")
            return _FALLBACK_RESPONSE

    # ------------------------------------------------------------------
    # Prompt Engineering
    # ------------------------------------------------------------------

    def _build_prompt(
        self, resume_text: str, rag_context: str, skill_analysis: dict
    ) -> str:
        matched = skill_analysis.get("matched_skills", [])
        missing = skill_analysis.get("missing_skills", [])
        weighted = skill_analysis.get("weighted_score", 0)
        radar = skill_analysis.get("radar_data", {})

        # ----- CHAIN-OF-THOUGHT + FEW-SHOT PROMPT -----
        return f"""# ROLE
You are an elite AI career coach and technical recruiter with 10+ years of experience
placing freshers at Cognizant, TCS, Infosys, and Wipro. You specialise in Generative AI,
full-stack development, and cloud-native roles.

# JOB DESCRIPTION CONTEXT (Retrieved via RAG — Cognizant ACE 12 LPA)
{rag_context}

# CANDIDATE PROFILE
Skills Found in Resume : {', '.join(matched[:20]) if matched else 'None detected'}
Critical Missing Skills : {', '.join(missing[:10]) if missing else 'None — excellent profile!'}
Weighted Skill Score    : {weighted}%
Competency Radar        : {json.dumps(radar, indent=2)}

# RESUME EXCERPT (first 2500 characters)
{resume_text[:2500]}

# TASK — Think step by step:
STEP 1: Evaluate the candidate's current profile vs the Cognizant ACE JD.
STEP 2: Identify the 3 most critical skill gaps that would disqualify them.
STEP 3: Create 5 specific, actionable improvement tasks with timelines.
STEP 4: Rate the overall readiness on a scale of 1–10.
STEP 5: Estimate ATS (Applicant Tracking System) score out of 100.
STEP 6: Generate interview preparation tips specific to Cognizant's process.

# ONE-SHOT EXAMPLE (follow this JSON format exactly):
{{
  "overall_rating": 7,
  "verdict": "Strong Python background but missing Gen AI project experience critical for 12 LPA band.",
  "ats_score": 74,
  "strengths": ["Python + Flask projects", "React frontend experience", "SQL proficiency"],
  "critical_gaps": ["No LangChain / RAG project", "No Docker deployment", "Missing Gemini API usage"],
  "action_items": [
    {{"priority": "high", "action": "Build a RAG chatbot with LangChain + Gemini + ChromaDB", "timeline": "2 weeks", "resource": "LangChain quickstart + Google AI Studio"}},
    {{"priority": "high", "action": "Dockerise existing project + deploy to GCP Cloud Run", "timeline": "1 week", "resource": "GCP free tier docs"}}
  ],
  "interview_tips": ["Memorise Big-O for Merge Sort, Quick Sort, Binary Search", "Prepare a 3-min project walkthrough demo"],
  "resume_improvements": ["Quantify every project metric", "Add 'Tech Stack' badge section at top"],
  "certifications_to_earn": ["Google Cloud Associate Cloud Engineer", "DeepLearning.AI Prompt Engineering"]
}}

# YOUR RESPONSE
Respond ONLY with a single valid JSON object following the schema above.
Do not include any explanation text, markdown code blocks, or commentary outside the JSON.
Make advice highly specific to the Cognizant ACE role and the candidate's actual resume.
"""

    # ------------------------------------------------------------------
    # Response Parsing
    # ------------------------------------------------------------------

    def _parse_response(self, text: str) -> dict:
        """
        Extract JSON from the model response.
        Handles cases where Gemini wraps output in markdown code blocks.
        """
        # Strip markdown code fences if present
        cleaned = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("```").strip()

        # Find the outermost JSON object
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        # Last resort: return fallback
        return _FALLBACK_RESPONSE
