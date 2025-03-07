from flask import Flask, request, jsonify, render_template, render_template_string
from flask_cors import CORS
from flask_mail import Mail, Message
import os
import uuid
import sqlite3
import pdfminer.high_level
import docx
import dotenv
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# ------------------ CONFIGURATION ------------------
os.makedirs("temp", exist_ok=True)
dotenv.load_dotenv()

# Gemini API Configuration
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Email Configuration (Secure)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")

if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD']:
    print("Warning: Email credentials not set. Email functionality may not work.")

mail = Mail(app)

# Required Skills
REQUIRED_SKILLS = [
    "Python", "JavaScript", "Machine Learning", "Flask", "React", "SQL",
    "Data Science", "HTML", "CSS", "NLP", "AI"
]

# ------------------ DATABASE SETUP ------------------
def init_db():
    with sqlite3.connect("resumes.db") as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS resumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT,
                filepath TEXT,
                match_percentage REAL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

init_db()

# ------------------ FILE PROCESSING ------------------
def extract_text_from_pdf(pdf_path):
    try:
        return pdfminer.high_level.extract_text(pdf_path)
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"


def extract_text_from_docx(docx_path):
    try:
        doc = docx.Document(docx_path)
        return '\n'.join([para.text for para in doc.paragraphs])
    except Exception as e:
        return f"Error extracting text from DOCX: {str(e)}"


# ------------------ RESUME ANALYSIS ------------------
def analyze_resume(text):
    found_skills = [skill for skill in REQUIRED_SKILLS if skill.lower() in text.lower()]
    missing_skills = [skill for skill in REQUIRED_SKILLS if skill.lower() not in text.lower()]
    percentage = (len(found_skills) / len(REQUIRED_SKILLS)) * 100

    recommendations = []
    if "projects" not in text.lower():
        recommendations.append("Consider adding a Projects section with real-world applications.")
    if "experience" not in text.lower():
        recommendations.append("Mention work experience or internships to strengthen your resume.")
    if "education" not in text.lower():
        recommendations.append("Include your educational background.")
    if "certification" not in text.lower():
        recommendations.append("Adding certifications can improve credibility.")

    ai_suggestions = get_resume_suggestions(text)

    return {
        "skills_matched": found_skills,
        "missing_skills": missing_skills,
        "match_percentage": round(percentage, 2),
        "recommendations": recommendations,
        "ai_suggestions": ai_suggestions
    }


# Gemini API Integration
def get_resume_suggestions(text):
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(f"Suggest improvements for this resume in 5-10 points keep it pointise and dont use bold:\n{text}")
        return response.text
    except Exception as e:
        return f"AI Error: {str(e)}"


# ------------------ EMAIL REPORT ------------------
def send_email(recipient, analysis):
    if not app.config['MAIL_USERNAME'] or not app.config['MAIL_PASSWORD']:
        print("Error: Email configuration missing. Cannot send email.")
        return

    msg = Message("Your Resume Analysis Report",
                  sender=app.config['MAIL_USERNAME'],
                  recipients=[recipient])
    msg.body = f"""
    Skills Matched: {', '.join(analysis['skills_matched'])}
    Missing Skills: {', '.join(analysis['missing_skills'])}
    Match Percentage: {analysis['match_percentage']}%
    Recommendations: {', '.join(analysis['recommendations'])}
    AI Suggestions: {analysis['ai_suggestions']}
    """
    mail.send(msg)


# ------------------ HTML RENDERING ------------------
def json_to_html(data):
    template = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume Analyzer</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: #333;
            text-align: center;
            padding: 40px;
            margin: 0;
        }
        .container {
            background: #ffffff;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 0 25px rgba(0, 0, 0, 0.3);
            width: 70%;
            margin: auto;
            animation: slideIn 0.8s ease-in-out;
            transition: transform 0.3s ease-in-out;

            
        }
        .container:hover {
            transform: scale(1.02);
        }
        h1 {
            color: #673ab7;
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        p {
            margin-bottom: 15px;
            font-size: 1.1em;
        }
        ul {
            text-align: left;
            display: inline-block;
            background: #f3f3f3;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    </style>
</head>
<body>
<div class="container">
    <h1>✅ Resume Analysis Result</h1>
    <p><strong>Matched Skills:</strong> {{ data['skills_matched']|join(", ") }}</p>
    <p><strong>Missing Skills:</strong> {{ data['missing_skills']|join(", ") }}</p>
    <p><strong>Match Percentage:</strong> {{ data['match_percentage'] }}%</p>
    <p><strong>AI Suggestions:</strong></p>
    <p>{{ data['ai_suggestions'].replace('*', '&#8226;').replace('\n', '<br>')|safe }}</p>
</div>
</body>
</html>
    '''
    return render_template_string(template, data=data)


@app.route('/')
def home():
    return render_template("index.html")


@app.route('/analyze', methods=['POST'])
def analyze():
    if 'resume' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['resume']
    ext = file.filename.rsplit('.', 1)[-1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join("temp", filename)
    file.save(filepath)

    text = extract_text_from_pdf(filepath) if ext == 'pdf' else extract_text_from_docx(filepath)
    result = analyze_resume(text)
    return json_to_html(result)

if __name__ == '__main__':
    app.run(debug=True)
