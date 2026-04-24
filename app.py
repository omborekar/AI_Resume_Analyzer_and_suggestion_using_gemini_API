"""
ResumeIQ Pro — Flask Backend API
==================================
Agentic AI Resume Intelligence Platform
Targeted at: Cognizant ACE Fresher Role (12 LPA)

Architecture:
  POST /api/analyze  →  ParserAgent → SkillAgent → RAGAgent → CoachAgent
  GET  /api/health   →  health check (Cloud Run, Kubernetes liveness probe)

Tech Stack Demonstrated:
  ✓ Python (Flask REST API)
  ✓ Agentic AI (4-agent orchestration pipeline)
  ✓ Gen AI (Gemini 2.0 Flash)
  ✓ RAG (TF-IDF retrieval over knowledge base)
  ✓ Prompt Engineering (chain-of-thought, few-shot, structured output)
  ✓ DSA (Trie + Levenshtein for skill matching)
  ✓ Cloud-ready (CORS, health endpoint, Docker-compatible)
"""

import os
import uuid
import time
import sqlite3
from datetime import datetime

import dotenv
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

# Load env vars before importing agents (they need GEMINI_API_KEY)
dotenv.load_dotenv()

from agents.parser_agent import ParserAgent
from agents.skill_agent import SkillAgent
from agents.rag_agent import RAGAgent
from agents.coach_agent import CoachAgent

# ---------------------------------------------------------------------------
# App Setup
# ---------------------------------------------------------------------------

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app, resources={r"/api/*": {"origins": "*"}})

os.makedirs("temp", exist_ok=True)

# ---------------------------------------------------------------------------
# Agent Initialisation (singleton — loaded once at startup)
# ---------------------------------------------------------------------------

print("[ResumeIQ Pro] Initialising agents...")
parser_agent = ParserAgent()
skill_agent = SkillAgent()
rag_agent = RAGAgent()
coach_agent = CoachAgent()
print(f"  [OK] ParserAgent   ready")
print(f"  [OK] SkillAgent    ready  (Trie size: {len(skill_agent.trie)} skills)")
print(f"  [OK] RAGAgent      ready  (JD chunks: {len(rag_agent._jd_chunks)})")
print(f"  [OK] CoachAgent    ready  (Gemini {CoachAgent.MODEL_ID})")

# ---------------------------------------------------------------------------
# Database Setup
# ---------------------------------------------------------------------------

def init_db() -> None:
    """Create the analyses table if it doesn't exist."""
    with sqlite3.connect("resumes.db") as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id      TEXT NOT NULL,
                filename        TEXT,
                word_count      INTEGER,
                match_pct       REAL,
                weighted_score  REAL,
                ats_score       INTEGER,
                overall_rating  INTEGER,
                processing_ms   INTEGER,
                analyzed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

init_db()

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Serve the legacy HTML UI (fallback when React dev server isn't running)."""
    try:
        return render_template("index.html")
    except Exception:
        return jsonify({
            "message": "ResumeIQ Pro API is running.",
            "docs": "POST /api/analyze with a resume file to get started.",
            "health": "/api/health",
        })


@app.route("/api/health", methods=["GET"])
def health():
    """
    Health check endpoint.
    Used by: GCP Cloud Run, Kubernetes liveness probe, Docker health check.
    """
    return jsonify({
        "status": "healthy",
        "version": "2.0.0",
        "project": "ResumeIQ Pro",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "agents": {
            "parser":  {"status": "ready"},
            "skill":   {"status": "ready", "trie_size": len(skill_agent.trie)},
            "rag":     {"status": "ready", "jd_chunks": len(rag_agent._jd_chunks)},
            "coach":   {"status": "ready", "model": CoachAgent.MODEL_ID},
        },
        "tech_stack": [
            "Gemini 2.0 Flash (Gen AI)",
            "TF-IDF RAG Pipeline",
            "Trie + Levenshtein DSA",
            "Agentic 4-Agent Architecture",
            "Flask REST API",
            "Docker / Cloud Run ready",
        ],
    })


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    Main analysis endpoint.
    Orchestrates the 4-agent pipeline and returns a complete analysis report.

    Request: multipart/form-data with field 'resume' (PDF or DOCX).
    Response: JSON with full analysis from all 4 agents.
    """
    start_time = time.time()
    session_id = str(uuid.uuid4())

    # --- Validate uploaded file ---
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded. Use field name 'resume'."}), 400

    file = request.files["resume"]
    if not file.filename:
        return jsonify({"error": "Empty filename."}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "docx"):
        return jsonify({"error": "Only PDF and DOCX formats are supported."}), 415

    # Save temp file
    filename = f"{session_id}.{ext}"
    filepath = os.path.join("temp", filename)
    file.save(filepath)

    try:
        # ============================================================
        # AGENT 1 — Parser Agent
        # ============================================================
        t0 = time.time()
        parse_result = parser_agent.run(filepath, ext)
        parser_ms = int((time.time() - t0) * 1000)

        # ============================================================
        # AGENT 2 — Skill Agent (DSA: Trie + Levenshtein)
        # ============================================================
        t0 = time.time()
        skill_result = skill_agent.run(parse_result["text"])
        skill_ms = int((time.time() - t0) * 1000)

        # ============================================================
        # AGENT 3 — RAG Agent (TF-IDF retrieval over Cognizant JD)
        # ============================================================
        t0 = time.time()
        rag_result = rag_agent.run(parse_result["text"])
        rag_ms = int((time.time() - t0) * 1000)

        # ============================================================
        # AGENT 4 — Coach Agent (Gemini Prompt Engineering)
        # ============================================================
        t0 = time.time()
        coach_result = coach_agent.run(
            parse_result["text"],
            rag_result["context"],
            skill_result,
        )
        coach_ms = int((time.time() - t0) * 1000)

        total_ms = int((time.time() - start_time) * 1000)

        # --- Persist summary to SQLite ---
        _log_analysis(
            session_id=session_id,
            filename=file.filename,
            word_count=parse_result["metadata"]["word_count"],
            match_pct=skill_result["match_percentage"],
            weighted_score=skill_result["weighted_score"],
            ats_score=coach_result.get("ats_score", 0),
            overall_rating=coach_result.get("overall_rating", 0),
            processing_ms=total_ms,
        )

        # --- Build response ---
        return jsonify({
            "success": True,
            "session_id": session_id,
            "processing_ms": total_ms,

            # ---- Agent outputs ----
            "agents": {
                "parser": {
                    "status": "complete",
                    "duration_ms": parser_ms,
                    "result": parse_result["metadata"],
                },
                "skill": {
                    "status": "complete",
                    "duration_ms": skill_ms,
                    "result": skill_result,
                },
                "rag": {
                    "status": "complete",
                    "duration_ms": rag_ms,
                    "result": {
                        "jd_similarity_score": rag_result["jd_similarity_score"],
                        "rag_confidence": rag_result["rag_confidence"],
                        "keyword_gaps": rag_result["keyword_gaps"],
                        "retrieval_stats": rag_result["retrieval_stats"],
                    },
                },
                "coach": {
                    "status": "complete",
                    "duration_ms": coach_ms,
                    "result": coach_result,
                },
            },
        })

    except Exception as exc:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(exc), "session_id": session_id}), 500

    finally:
        # Clean up temp file
        if os.path.exists(filepath):
            os.remove(filepath)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _log_analysis(**kwargs) -> None:
    try:
        with sqlite3.connect("resumes.db") as conn:
            conn.execute(
                """INSERT INTO analyses
                   (session_id, filename, word_count, match_pct, weighted_score,
                    ats_score, overall_rating, processing_ms)
                   VALUES (:session_id, :filename, :word_count, :match_pct,
                           :weighted_score, :ats_score, :overall_rating, :processing_ms)""",
                kwargs,
            )
            conn.commit()
    except Exception as exc:
        print(f"[DB] Logging failed (non-fatal): {exc}")


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    print(f"\n[ResumeIQ Pro] Backend running at http://localhost:{port}")
    print(f"  React frontend  -> http://localhost:5173\n")
    app.run(debug=debug, port=port, host="0.0.0.0")
