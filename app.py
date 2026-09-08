from flask import Flask, render_template, jsonify, request, make_response, session, redirect, url_for, flash
from datetime import datetime, timedelta
import logging
import os
import re
from functools import wraps, lru_cache
from time import time
from dotenv import load_dotenv
import bcrypt

# Load environment variables
load_dotenv()
IS_PRODUCTION = os.getenv('FLASK_ENV') == 'production'

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET') or os.getenv('SECRET_KEY') or 'dev-secret-key'
if IS_PRODUCTION and app.config['SECRET_KEY'] == 'dev-secret-key':
    raise RuntimeError("FLASK_SECRET must be set in production.")
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = os.getenv('SESSION_FILE_DIR', 'flask_session')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 86400
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = IS_PRODUCTION

# Initialize session
from flask_session import Session
Session(app)

# Owner authentication configuration (from Render environment variables)
AUTH_EMAIL = (os.getenv('AUTH_EMAIL') or os.getenv('LOGIN_EMAIL') or os.getenv('ADMIN_EMAIL') or os.getenv('OWNER_EMAIL') or 'shivogojohn@gmail.com').strip().lower()
AUTH_PASSWORD = os.getenv('AUTH_PASSWORD') or os.getenv('LOGIN_PASSWORD') or os.getenv('ADMIN_PASSWORD') or os.getenv('OWNER_PASSWORD') or ''
AUTH_PASSWORD_HASH = os.getenv('AUTH_PASSWORD_HASH') or os.getenv('ADMIN_PASSWORD_HASH') or ''

if not AUTH_PASSWORD_HASH and AUTH_PASSWORD:
    AUTH_PASSWORD_HASH = bcrypt.hashpw(AUTH_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

if not AUTH_PASSWORD_HASH:
    if IS_PRODUCTION:
        raise RuntimeError("AUTH_PASSWORD or AUTH_PASSWORD_HASH must be set in production.")
    LOG_FALLBACK_AUTH_PASSWORD = 'study_secure_pass_2026'
    AUTH_PASSWORD_HASH = bcrypt.hashpw(LOG_FALLBACK_AUTH_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', AUTH_EMAIL)
ADMIN_PASSWORD_HASH = AUTH_PASSWORD_HASH

# Setup logging
logging.basicConfig(level=logging.INFO)
LOG = logging.getLogger(__name__)

try:
    from flask_compress import Compress
    Compress(app)
    LOG.info("✓ Flask-Compress enabled")
except ImportError:
    LOG.warning("Flask-Compress not installed; gzip compression unavailable")

# Simple endpoint response caching
def simple_cache(timeout=20):
    def decorator(func):
        cache = {}
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = (func.__name__, args, tuple(sorted(kwargs.items())))
            entry = cache.get(key)
            if entry and time() - entry[0] < timeout:
                return entry[1]
            result = func(*args, **kwargs)
            cache[key] = (time(), result)
            return result
        return wrapper
    return decorator

# Import database and AI modules
from database import init_db, get_db
from ai import init_ai, get_ai

# Initialize database and AI
try:
    db = init_db()
    LOG.info("✓ Database initialized")
except Exception as err:
    LOG.error(f"✗ Database initialization failed: {err}")
    db = None

try:
    ai = init_ai()
    LOG.info("✓ AI module initialized")
except Exception as err:
    LOG.error(f"✗ AI initialization failed: {err}")
    ai = None


@lru_cache(maxsize=1)
def load_course_outlines():
    outlines = {}
    possible_paths = [
        os.path.join(os.path.dirname(__file__), 'courseoutlines.md'),
        os.path.join(os.path.dirname(__file__), 'CourseOutlines.md'),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), 'CourseOutlines.md')
    ]
    outlines_path = None
    for p in possible_paths:
        if os.path.exists(p):
            outlines_path = p
            break

    if not outlines_path:
        return outlines

    with open(outlines_path, 'r', encoding='utf-8') as f:
        current = None
        buffer = []
        for raw_line in f:
            line = raw_line.rstrip('\r\n')
            match = re.match(r'^(?:#+)?\s*(?:\d+\.\s*)?([A-Za-z]{3}\s*\d{3})\b(?::?\s*(.*))?', line.strip())
            if match and ('SST' in line.upper() or 'SMA' in line.upper()) and line.strip().startswith('#'):
                if current:
                    outlines[current] = '\n'.join(buffer).strip()
                current = match.group(1).replace(' ', '').upper()
                buffer = []
            else:
                if current is not None:
                    buffer.append(line)
        if current:
            outlines[current] = '\n'.join(buffer).strip()

    return outlines

course_outlines = load_course_outlines()

# Schedule data structure
schedule_data = {
    "Monday": {
        "day_number": 1,
        "classes": [
            {"time": "7:00am – 9:00am", "subject": "SMA335", "title": "ODEs I", "color": "#3B82F6"},
            {"time": "9:00am – 11:00am", "subject": "SMA330", "title": "Numerical Analysis I", "color": "#F59E0B"},
            {"time": "11:00am – 1:00pm", "subject": "SST305", "title": "Theory of Estimation", "color": "#EF4444"}
        ],
        "deep_study": [
            {
                "time": "2:00pm – 4:00pm",
                "subject": "SST305",
                "title": "SST 305 Deep Study",
                "color": "#EF4444",
                "reason": "You've just had 6 straight hours of lectures ending with Estimation Theory. Striking while it's fresh matters more here than anywhere else this week — MLE derivations and estimator-property proofs decay fast if left even a day."
            }
        ],
        "revision": [
            {
                "time": "7:00pm – 8:00pm",
                "subject": "SMA335",
                "title": "SMA 335 Revision",
                "color": "#3B82F6",
                "focus": [
                    "Classify the ODE type before attempting a method",
                    "Redo one first-order and one second-order example from memory",
                    "Review integrating factor / characteristic equation shortcuts"
                ]
            }
        ]
    },
    "Tuesday": {
        "day_number": 2,
        "classes": [
            {"time": "7:00am – 9:00am", "subject": "SST304", "title": "Multivariate Statistical Methods I", "color": "#8B5CF6"},
            {"time": "1:00pm – 2:00pm", "subject": "SMA330", "title": "Numerical Analysis I", "color": "#F59E0B"}
        ],
        "deep_study": [
            {
                "time": "9:30am – 11:30am",
                "subject": "SST304",
                "title": "SST 304 Deep Study",
                "color": "#8B5CF6",
                "reason": "Multivariate methods and matrix decompositions studied right after exposure while theory is fresh. Dedicated deep block for covariance structures and PCA.",
                "focus": [
                    "Covariance and correlation matrices",
                    "Spectral decomposition and eigen-properties",
                    "Derive multivariate normal density"
                ]
            },
            {
                "time": "2:30pm – 4:30pm",
                "subject": "SST101",
                "title": "SST 101 Deep Study (retake)",
                "color": "#EC4899",
                "reason": "Free slot in an otherwise light afternoon. Placeholder until the actual SST 101 lecture time is confirmed — move right after the real lecture once known.",
                "focus": [
                    "Target prior CAT/exam weak points",
                    "Probability distributions and Bayes theorem",
                    "Hypothesis testing worked problems"
                ]
            }
        ],
        "revision": [
            {
                "time": "7:00pm – 8:00pm",
                "subject": "SST301",
                "title": "SST 301 Revision",
                "color": "#06B6D4",
                "focus": [
                    "Syntax drills (30 min)",
                    "One small script from scratch, no copy-paste (30 min)"
                ]
            }
        ]
    },
    "Wednesday": {
        "day_number": 3,
        "classes": [
            {"time": "7:00am – 8:00am", "subject": "SST301", "title": "Programming for Statistics I", "color": "#06B6D4"},
            {"time": "1:00pm – 2:00pm", "subject": "SST305", "title": "Theory of Estimation", "color": "#EF4444"}
        ],
        "deep_study": [
            {
                "time": "8:30am – 10:30am",
                "subject": "SMA300",
                "title": "SMA 300 Deep Study",
                "color": "#10B981",
                "reason": "Real Analysis's primary weekly block, placed deliberately in the morning with no lecture pressing on either side — sustained, undistracted proof-construction time."
            }
        ],
        "revision": [
            {
                "time": "7:00pm – 8:00pm",
                "subject": "SMA330",
                "title": "SMA 330 Revision",
                "color": "#F59E0B",
                "focus": [
                    "Redo one root-finding and one interpolation problem",
                    "Check error bounds by hand, not by intuition"
                ]
            }
        ]
    },
    "Thursday": {
        "day_number": 4,
        "classes": [
            {"time": "7:00am – 9:00am", "subject": "SMA335", "title": "ODEs I", "color": "#3B82F6"},
            {"time": "9:00am – 11:00am", "subject": "SST301", "title": "Programming for Statistics I", "color": "#06B6D4"},
            {"time": "3:00pm – 5:00pm", "subject": "SMA300", "title": "Real Analysis I", "color": "#10B981"}
        ],
        "deep_study": [
            {
                "time": "11:15am – 1:15pm",
                "subject": "SMA335",
                "title": "SMA 335 Deep Study",
                "color": "#3B82F6",
                "reason": "Right after this week's second ODE lecture and before afternoon Real Analysis class — consolidate ODE methods while doubly fresh."
            }
        ],
        "revision": [
            {
                "time": "5:00pm – 6:00pm",
                "subject": "SST101",
                "title": "SST 101 Revision (retake)",
                "color": "#EC4899",
                "focus": [
                    "Redo one probability distribution problem and one hypothesis-testing problem from memory",
                    "Prioritize whichever topic caused difficulty previously"
                ]
            },
            {
                "time": "7:00pm – 8:00pm",
                "subject": "SST305",
                "title": "SST 305 Revision",
                "color": "#EF4444",
                "focus": [
                    "Redo one MLE derivation from scratch",
                    "One unbiasedness/consistency proof, no notes"
                ]
            }
        ]
    },
    "Friday": {
        "day_number": 5,
        "classes": [
            {"time": "8:00am – 9:00am", "subject": "SST304", "title": "Multivariate Statistical Methods I", "color": "#8B5CF6"},
            {"time": "3:00pm – 4:00pm", "subject": "SMA300", "title": "Real Analysis I", "color": "#10B981"}
        ],
        "deep_study": [
            {
                "time": "9:30am – 11:30am",
                "subject": "SMA330",
                "title": "SMA 330 Deep Study",
                "color": "#F59E0B",
                "reason": "Second and final Numerical Analysis block for the week, in the morning while sharp, well before afternoon Real Analysis lecture."
            }
        ],
        "revision": [
            {
                "time": "4:15pm – 5:15pm",
                "subject": "SMA300",
                "title": "SMA 300 Revision (Reinforcement)",
                "color": "#10B981",
                "focus": [
                    "Immediate post-lecture proof reconstruction",
                    "Catch whatever lecture introduced before weekend gap"
                ]
            }
        ]
    },
    "Saturday": {
        "day_number": 6,
        "classes": [],
        "deep_study": [
            {
                "time": "8:00am – 10:00am",
                "subject": "SMA300",
                "title": "SMA 300 Bonus Deep Study",
                "color": "#10B981",
                "reason": "Real Analysis 3rd weekly touchpoint. Fully rested morning to push into harder problem sets or past-paper problems."
            }
        ],
        "revision": [
            {
                "time": "10:30am – 11:30am",
                "subject": "SST304",
                "title": "SST 304 Revision",
                "color": "#8B5CF6",
                "focus": [
                    "Redo one PCA or discriminant analysis worked example by hand",
                    "Connect explicitly to machine learning practical background"
                ]
            }
        ]
    },
    "Sunday": {
        "day_number": 7,
        "classes": [],
        "deep_study": [],
        "revision": [
            {
                "time": "4:00pm – 5:00pm",
                "subject": "Weekly Reflection",
                "title": "Weekly Reflection & Audit",
                "color": "#A78BFA",
                "focus": [
                    "Identify single weakest unit from the week (usually SMA 300 or SST 305)",
                    "Update running note on unjustified claims/proofs",
                    "Prepare for Monday's 3-lecture morning"
                ]
            },
            {
                "time": "7:00pm – 8:00pm",
                "subject": "Optional Light Revision",
                "title": "Optional Light Revision (Weakest Unit)",
                "color": "#C084FC",
                "focus": [
                    "Only the single weakest unit identified during reflection — do not touch multiple subjects"
                ]
            }
        ]
    }
}

subject_info = {
    "SMA300": {
        "title": "Real Analysis I",
        "color": "#10B981",
        "difficulty_rank": 1,
        "difficulty_label": "Hardest (3 touchpoints/week)",
        "description": "Rigorous foundation of real numbers ℝ, epsilon-delta limit proofs, sequence and series convergence, continuity, differentiability, and Riemann integration.",
        "method": "Reconstruct every proof from memory after first seeing it; never move to next theorem until you can restate previous logic unaided.",
        "mistake": "Reading a proof and believing that is the same as being able to produce one.",
        "resources": "Understanding Analysis (Abbott); MIT OCW 18.100A",
        "outline": course_outlines.get("SMA300", "Course outline not yet available.")
    },
    "SST305": {
        "title": "Theory of Estimation",
        "color": "#EF4444",
        "difficulty_rank": 2,
        "difficulty_label": "2nd Hardest (2 touchpoints/week)",
        "description": "Statistical estimation theory, MLE and Method of Moments derivations, estimator properties (unbiasedness, efficiency, consistency, sufficiency), CRLB, and Rao-Blackwell.",
        "method": "Derive, do not memorize — for every named estimator, show why it has the properties it has.",
        "mistake": "Treating 'unbiased', 'efficient', and 'consistent' as interchangeable praise words instead of distinct provable properties.",
        "resources": "Statistical Inference (Casella & Berger)",
        "outline": course_outlines.get("SST305", "Course outline not yet available.")
    },
    "SMA335": {
        "title": "Ordinary Differential Equations I",
        "color": "#3B82F6",
        "difficulty_rank": 3,
        "difficulty_label": "Medium-Hard",
        "description": "First-order ODEs, higher-order linear equations, characteristic equations, variation of parameters, systems of linear ODEs, and applied mathematical modeling.",
        "method": "Classify the equation type first, every single time, before reaching for a method.",
        "mistake": "Pattern-matching to a remembered solution instead of verifying the classification.",
        "resources": "Elementary Differential Equations (Boyce & DiPrima); Paul's Online Math Notes",
        "outline": course_outlines.get("SMA335", "Course outline not yet available.")
    },
    "SMA330": {
        "title": "Numerical Analysis I",
        "color": "#F59E0B",
        "difficulty_rank": 4,
        "difficulty_label": "Medium",
        "description": "Root-finding algorithms (Newton-Raphson, bisection), polynomial interpolation, numerical differentiation/integration, error propagation and analysis.",
        "method": "After solving, always ask how the error propagates or grows — active calculation beats intuition.",
        "mistake": "Getting a numerically 'close enough' answer without understanding why it is close or how error behaves.",
        "resources": "Numerical Analysis (Burden & Faires); 3Blue1Brown for intuition",
        "outline": course_outlines.get("SMA330", "Course outline not yet available.")
    },
    "SST304": {
        "title": "Multivariate Statistical Methods I",
        "color": "#8B5CF6",
        "difficulty_rank": 5,
        "difficulty_label": "Medium",
        "description": "Multivariate normal distributions, Principal Component Analysis (PCA), factor analysis, discriminant analysis, and multivariate regression.",
        "method": "Lean on existing ML background deliberately — connect every technique directly to practical ML tools.",
        "mistake": "Relearning these as abstract statistics instead of recognizing tools you already use.",
        "resources": "Applied Multivariate Statistical Analysis (Johnson & Wichern)",
        "outline": course_outlines.get("SST304", "Course outline not yet available.")
    },
    "SST301": {
        "title": "Programming Language for Statistics I",
        "color": "#06B6D4",
        "difficulty_rank": 6,
        "difficulty_label": "Lightest Touch",
        "description": "Statistical computing, data structures, syntax paradigms (R / Python), data wrangling pipelines, simulations, and custom statistical scripting.",
        "method": "Light, consistent touches: 30 min syntax drills + 30 min writing a small script from scratch without copy-pasting.",
        "mistake": "Under-investing so much that you miss language-specific statistical idioms (e.g., vectorized/formula syntax).",
        "resources": "R for Data Science (Hadley Wickham) / Python for Data Analysis",
        "outline": course_outlines.get("SST301", "Course outline not yet available.")
    },
    "SST101": {
        "title": "Intro to Probability & Statistics (Retake)",
        "color": "#EC4899",
        "difficulty_rank": 7,
        "difficulty_label": "Retake Focus (2 touchpoints/week)",
        "description": "Probability axioms, Bayes' theorem, discrete/continuous random variables, probability distributions, sampling theory, and hypothesis testing.",
        "method": "Identify exactly what caused previous exam difficulty; redo probability distribution and hypothesis testing problems from memory.",
        "mistake": "Treating a retake as 'easy content, low effort needed' instead of systematically fixing specific conceptual gaps.",
        "resources": "Probability & Statistics for Engineers & Scientists (Walpole et al.); past CATs/exams",
        "outline": course_outlines.get("SST101", "Course outline not yet available.")
    }
}

rules_and_strategy = {
    "title": "3rd Year, 1st Semester — Strategic Framework",
    "non_negotiable_rules": [
        {"rule": "Rule 1", "text": "Phone away during every deep study block, no exceptions for SMA 300 or SST 305."},
        {"rule": "Rule 2", "text": "Never study two technical subjects in the same block. Context switching costs you more than the time it takes."},
        {"rule": "Rule 3", "text": "Handwrite mathematics (SMA 300, SMA 330, SMA 335, SST 305 derivations). Typing invites shallow engagement on proof-heavy material."},
        {"rule": "Rule 4", "text": "Every Friday night, name the week's weakest unit. It almost always earns Saturday or Sunday's light-revision slot."},
        {"rule": "Rule 5", "text": "Start past papers by Week 3, especially for SMA 300 and SST 305. Waiting longer compounds the gap rather than closing it."},
        {"rule": "Rule 6", "text": "Keep a running note of any statistical or ML claim you use in practice without being able to fully justify it. Feeds directly into research paper directions."}
    ],
    "productivity_protocol": [
        {"phase": "First 15–20 Minutes", "items": ["Review previous session summary notes", "Identify specific weak point from last time", "Define one concrete objective for today's block"]},
        {"phase": "Next 80–90 Minutes", "items": ["Active problem solving only — no passive reading", "Derivations and proofs from memory before checking notes", "Worked examples redone without looking"]},
        {"phase": "Final 15–20 Minutes", "items": ["Condense today's work into a short note", "Flag anything still shaky for Sunday's reflection"]}
    ],
    "difficulty_ranking": [
        {"rank": 1, "code": "SMA300", "title": "Real Analysis I", "touchpoints": "3 touchpoints/week", "level": "Hardest"},
        {"rank": 2, "code": "SST305", "title": "Theory of Estimation", "touchpoints": "2 touchpoints/week", "level": "2nd Hardest"},
        {"rank": 3, "code": "SMA335", "title": "Ordinary Differential Equations I", "touchpoints": "2 touchpoints/week", "level": "Medium-Hard"},
        {"rank": 4, "code": "SMA330", "title": "Numerical Analysis I", "touchpoints": "2 touchpoints/week", "level": "Medium"},
        {"rank": 5, "code": "SST304", "title": "Multivariate Statistical Methods I", "touchpoints": "1 Deep + 1 Revision", "level": "Medium"},
        {"rank": 6, "code": "SST301", "title": "Programming Language for Stats I", "touchpoints": "1 Revision touchpoint", "level": "Easiest"},
        {"rank": 7, "code": "SST101", "title": "Intro to Probability & Statistics", "touchpoints": "2 touchpoints/week", "level": "Retake Focus"}
    ],
    "resources": {
        "SMA300": "Understanding Analysis (Abbott); MIT OCW 18.100A",
        "SST305": "Statistical Inference (Casella & Berger)",
        "SMA335": "Elementary Differential Equations (Boyce & DiPrima); Paul's Online Math Notes",
        "SMA330": "Numerical Analysis (Burden & Faires); 3Blue1Brown",
        "SST304": "Applied Multivariate Statistical Analysis (Johnson & Wichern)",
        "SST301": "R for Data Science (Hadley Wickham) / Python for Data Analysis",
        "SST101": "Probability & Statistics for Engineers & Scientists (Walpole et al.); past CATs/exams"
    }
}

# ==================== AUTHENTICATION & ACCESS CONTROL ====================

@app.before_request
def require_login():
    """Global gatekeeper: Enforce login across all pages and APIs (except public auth endpoints)."""
    public_endpoints = {'login', 'logout', 'static', 'healthz', 'admin_login', 'admin_logout', 'get_study_tips'}
    
    # Allow static assets and health check
    if request.path.startswith('/static/') or request.path == '/healthz':
        return None
    
    if request.endpoint in public_endpoints:
        return None
    
    # Check if user has an active authenticated session
    if not session.get('user_logged_in'):
        if request.path.startswith('/api/'):
            return jsonify({"error": "Authentication required. Please log in."}), 401
        return redirect(url_for('login', next=request.url))

@app.context_processor
def inject_user():
    """Inject current authenticated user data into template rendering."""
    return {
        "current_user_email": session.get('user_email', ''),
        "is_authenticated": bool(session.get('user_logged_in'))
    }

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_logged_in'):
            if request.path.startswith('/api/'):
                return jsonify({"error": "Authentication required"}), 401
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_logged_in') or not session.get('admin_logged_in'):
            if request.path.startswith('/api/'):
                return jsonify({"error": "Admin authentication required"}), 401
            flash('Admin access required', 'error')
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if session.get('user_logged_in'):
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        
        # Strictly check that the email matches the authorized owner email
        if not email or email != AUTH_EMAIL:
            flash('Unauthorized email. Access is strictly restricted to the authorized owner only.', 'error')
            return render_template('login.html', prefill_email=email), 401
        
        # Verify password with bcrypt
        if password and bcrypt.checkpw(password.encode('utf-8'), AUTH_PASSWORD_HASH.encode('utf-8')):
            session.permanent = True
            session['user_logged_in'] = True
            session['user_email'] = AUTH_EMAIL
            session['admin_logged_in'] = True
            session['admin_username'] = AUTH_EMAIL
            
            flash('Login successful. Welcome back!', 'success')
            next_url = request.args.get('next')
            if next_url and next_url.startswith('/'):
                return redirect(next_url)
            return redirect(url_for('index'))
        else:
            flash('Invalid password. Please try again.', 'error')
            return render_template('login.html', prefill_email=email), 401
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully.', 'info')
    return redirect(url_for('login'))

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    return redirect(url_for('login', next=url_for('admin_dashboard')))

@app.route('/admin/logout')
def admin_logout():
    return redirect(url_for('logout'))

@app.route('/admin')
@admin_required
def admin_dashboard():
    return render_template('admin.html')

@app.route('/api/admin/clear-database', methods=['POST'])
@admin_required
def clear_database():
    """Clear all database data (admin only)"""
    if not db:
        return jsonify({"error": "Database not available"}), 500

    try:
        success = db.clear_all_data()
        if success:
            return jsonify({"success": True, "message": "All database data cleared successfully"}), 200
        else:
            return jsonify({"error": "Failed to clear database"}), 500
    except Exception as err:
        LOG.error(f"Error clearing database: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/admin/sessions', methods=['GET'])
@admin_required
def get_all_sessions():
    """Get all study sessions for admin editing"""
    if not db:
        return jsonify({"error": "Database not available"}), 500

    try:
        sessions = db.get_all_sessions_for_admin()
        return jsonify({"success": True, "sessions": sessions}), 200
    except Exception as err:
        LOG.error(f"Error getting sessions: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/admin/sessions/batch-delete', methods=['POST'])
@admin_required
def batch_delete_sessions():
    """Delete selected study sessions"""
    if not db:
        return jsonify({"error": "Database not available"}), 500

    try:
        data = request.get_json() or {}
        session_ids = [int(item) for item in data.get('ids', []) if str(item).isdigit()]
        if not session_ids:
            return jsonify({"error": "No sessions selected"}), 400

        deleted = db.delete_sessions(session_ids)
        return jsonify({"success": True, "deleted": deleted}), 200
    except Exception as err:
        LOG.error(f"Error batch deleting sessions: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/admin/sessions/<int:session_id>', methods=['PUT', 'DELETE'])
@admin_required
def manage_session(session_id):
    """Update or delete a study session"""
    if not db:
        return jsonify({"error": "Database not available"}), 500

    try:
        if request.method == 'DELETE':
            success = db.delete_session(session_id)
            if success:
                return jsonify({"success": True, "message": "Session deleted"}), 200
            else:
                return jsonify({"error": "Failed to delete session"}), 404
        
        elif request.method == 'PUT':
            data = request.get_json()
            success = db.update_session(session_id, data)
            if success:
                return jsonify({"success": True, "message": "Session updated"}), 200
            else:
                return jsonify({"error": "Failed to update session"}), 400
                
    except Exception as err:
        LOG.error(f"Error managing session: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/healthz')
def healthz():
    return jsonify({"status": "ok"}), 200

@app.route('/api/schedule')
@simple_cache(timeout=30)
def get_schedule():
    response = jsonify({
        "schedule": schedule_data,
        "subjects": subject_info,
        "strategy": rules_and_strategy,
        "semester_title": "3rd Year, 1st Semester",
        "date_range": "3rd Year, 1st Semester"
    })
    response.headers['Cache-Control'] = 'public, max-age=30'
    return response

@app.route('/api/strategy')
def get_strategy():
    """Get non-negotiable rules, productivity protocol, and resources"""
    return jsonify(rules_and_strategy), 200

@app.route('/api/tasks')
def get_tasks():
    """Get free tasks for the week"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    try:
        tasks = db.get_tasks()
        return jsonify({"success": True, "tasks": tasks}), 200
    except Exception as err:
        LOG.error(f"Error fetching free tasks: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new free task"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    try:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        tag = data.get('tag', '').strip()
        day = data.get('day', '').strip()
        time_value = data.get('time', '').strip()

        if not title or not tag or not day or not time_value:
            return jsonify({"error": "All task fields are required"}), 400

        task = db.add_task(title, tag, day, time_value)
        if not task:
            return jsonify({"error": "Failed to create task"}), 500

        return jsonify({"success": True, "task": task}), 201
    except Exception as err:
        LOG.error(f"Error creating free task: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/admin/tasks', methods=['GET'])
@admin_required
def get_admin_tasks():
    """Admin view of all free tasks"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    try:
        tasks = db.get_all_tasks_for_admin()
        return jsonify({"success": True, "tasks": tasks}), 200
    except Exception as err:
        LOG.error(f"Error getting admin tasks: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/admin/tasks/batch-delete', methods=['POST'])
@admin_required
def batch_delete_tasks():
    """Delete selected free tasks"""
    if not db:
        return jsonify({"error": "Database not available"}), 500

    try:
        data = request.get_json() or {}
        task_ids = [int(item) for item in data.get('ids', []) if str(item).isdigit()]
        if not task_ids:
            return jsonify({"error": "No tasks selected"}), 400

        deleted = db.delete_tasks(task_ids)
        return jsonify({"success": True, "deleted": deleted}), 200
    except Exception as err:
        LOG.error(f"Error batch deleting tasks: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/admin/history/weekly')
@admin_required
def get_admin_weekly_history():
    """Get weekly history charts for academic sessions and free tasks"""
    if not db:
        return jsonify({"error": "Database not available"}), 500

    try:
        raw_week_start = request.args.get('week_start', '').strip()
        if raw_week_start:
            week_start = datetime.strptime(raw_week_start, "%Y-%m-%d").date()
            week_start = week_start - timedelta(days=week_start.weekday())
        else:
            week_start = db.get_current_week_start()

        history = db.get_weekly_history(week_start)
        if history is None:
            return jsonify({"error": "Failed to load weekly history"}), 500

        return jsonify({"success": True, "history": history}), 200
    except ValueError:
        return jsonify({"error": "week_start must use YYYY-MM-DD format"}), 400
    except Exception as err:
        LOG.error(f"Error getting weekly history: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/admin/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
@admin_required
def manage_task(task_id):
    """Update or delete a free task"""
    if not db:
        return jsonify({"error": "Database not available"}), 500

    try:
        if request.method == 'DELETE':
            success = db.delete_task(task_id)
            if success:
                return jsonify({"success": True, "message": "Task deleted"}), 200
            return jsonify({"error": "Failed to delete task"}), 404

        data = request.get_json() or {}
        success = db.update_task(task_id, data)
        if success:
            return jsonify({"success": True, "message": "Task updated"}), 200
        return jsonify({"error": "Failed to update task"}), 400
    except Exception as err:
        LOG.error(f"Error managing task: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/tasks/<int:task_id>/complete', methods=['POST'])
def complete_task(task_id):
    """Mark a free task as completed with time spent"""
    if not db:
        return jsonify({"error": "Database not available"}), 500

    try:
        data = request.get_json() or {}
        duration_minutes = int(data.get('duration_minutes') or 0)
        notes = data.get('notes', '').strip()

        if duration_minutes <= 0:
            return jsonify({"error": "Please enter a valid duration"}), 400

        task = db.complete_task(task_id, duration_minutes, notes)
        if not task:
            return jsonify({"error": "Task not found or could not be completed"}), 404

        return jsonify({
            "success": True,
            "task": task,
            "message": f"Free task completed: {duration_minutes} minutes"
        }), 200
    except ValueError:
        return jsonify({"error": "Duration must be a number"}), 400
    except Exception as err:
        LOG.error(f"Error completing free task: {err}")
        return jsonify({"error": str(err)}), 500

# ==================== PROGRESS TRACKING ENDPOINTS ====================

@app.route('/api/progress/record', methods=['POST'])
def record_progress():
    """Record a completed study session"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        data = request.get_json()
        subject_code = data.get('subject_code')
        session_type = data.get('session_type', 'deep-study')
        duration_minutes = data.get('duration_minutes', 0)
        notes = data.get('notes', '')
        
        if not subject_code or duration_minutes <= 0:
            return jsonify({"error": "Invalid subject or duration"}), 400
        
        # Record session
        session_result = db.record_study_session(
            subject_code,
            session_type,
            datetime.now().date(),
            datetime.now().time(),
            duration_minutes,
            notes
        )
        
        if session_result:
            duplicate = bool(session_result.get('duplicate'))

            # Generate AI recommendation if available
            progress = db.get_subject_progress(subject_code)
            if ai and progress and not duplicate:
                rec = ai.generate_study_recommendation(
                    subject_code,
                    subject_info.get(subject_code, {}),
                    progress,
                    {
                        "notes": notes,
                        "duration_minutes": duration_minutes,
                        "session_type": session_type
                    }
                )
                if rec.get('type') != 'error':
                    db.save_recommendation(
                        subject_code,
                        rec.get('type'),
                        rec.get('content')
                    )
            
            return jsonify({
                "success": True,
                "session_id": session_result.get('session_id'),
                "duplicate": duplicate,
                "message": session_result.get('message') or f"Study session recorded: {duration_minutes} minutes"
            }), 200 if duplicate else 201
        else:
            return jsonify({"error": "Failed to record session"}), 500
    
    except Exception as err:
        LOG.error(f"Error recording progress: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/progress/subject/<subject_code>')
def get_subject_progress(subject_code):
    """Get progress for a specific subject"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        progress = db.get_subject_progress(subject_code)
        return jsonify(progress), 200
    except Exception as err:
        LOG.error(f"Error fetching progress: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/progress/all')
def get_all_progress():
    """Get progress for all subjects"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        progress = db.get_all_progress()
        return jsonify(progress), 200
    except Exception as err:
        LOG.error(f"Error fetching all progress: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/progress/weekly')
def get_weekly_progress():
    """Get study stats for the past week"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        stats = db.get_weekly_stats()
        
        # Generate weekly summary if AI is available
        summary = ""
        if ai:
            summary = ai.generate_weekly_summary(stats, db.get_all_progress())
        
        return jsonify({
            "weekly_stats": stats,
            "summary": summary
        }), 200
    except Exception as err:
        LOG.error(f"Error fetching weekly progress: {err}")
        return jsonify({"error": str(err)}), 500

# ==================== AI RECOMMENDATIONS ENDPOINTS ====================

@app.route('/api/ai/recommendations')
def get_recommendations():
    """Get pending AI recommendations"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        recommendations = db.get_pending_recommendations(one_per_subject=True)
        return jsonify(recommendations), 200
    except Exception as err:
        LOG.error(f"Error fetching recommendations: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/ai/tips/<subject_code>')
def get_study_tips(subject_code):
    """Get quick study tips for a subject"""
    try:
        norm_code = subject_code.strip().upper() if subject_code else ''
        subject = subject_info.get(norm_code) or subject_info.get(subject_code, {})
        
        if not subject:
            return jsonify({"error": f"Subject '{subject_code}' not found"}), 404
        
        if not ai:
            method = (subject.get('method') or '').strip()
            mistake = (subject.get('mistake') or '').strip()
            title = subject.get('title') or norm_code
            fallback_tips = [
                f"You should derive key theorems and formulas from first principles without looking at your notes to build deep intuition for {title}.",
                f"You should {method}" if method else f"You should practice past exam questions and weekly problem sets for {norm_code}.",
                f"You should avoid this common pitfall: {mistake}" if mistake else f"You should create a one-page formula sheet summarizing definitions and core properties in {norm_code}."
            ]
            return jsonify({
                "subject_code": norm_code or subject_code,
                "tips": fallback_tips
            }), 200

        tips = ai.get_study_tips(norm_code or subject_code, subject)
        
        return jsonify({
            "subject_code": norm_code or subject_code,
            "tips": tips
        }), 200
    
    except Exception as err:
        LOG.error(f"Error generating tips: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/ai/pattern')
def get_study_pattern():
    """Analyze study patterns"""
    if not db or not ai:
        return jsonify({"error": "AI or Database not available"}), 500
    
    try:
        stats = db.get_weekly_stats()
        pattern = ai.analyze_study_pattern(stats)
        
        return jsonify({
            "pattern_analysis": pattern,
            "stats_count": len(stats)
        }), 200
    
    except Exception as err:
        LOG.error(f"Error analyzing pattern: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/ai/acknowledge/<int:rec_id>', methods=['POST'])
def acknowledge_recommendation(rec_id):
    """Mark a recommendation as acknowledged"""
    if not db:
        return jsonify({"error": "Database not available"}), 500
    
    try:
        db.acknowledge_recommendation(rec_id)
        return jsonify({"success": True}), 200
    except Exception as err:
        LOG.error(f"Error acknowledging recommendation: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/ai/acknowledge-all', methods=['POST'])
def acknowledge_all_recommendations():
    """Mark all recommendations as acknowledged"""
    if not db:
        return jsonify({"error": "Database not available"}), 500

    try:
        updated = db.acknowledge_all_recommendations()
        return jsonify({"success": True, "updated": updated}), 200
    except Exception as err:
        LOG.error(f"Error acknowledging all recommendations: {err}")
        return jsonify({"error": str(err)}), 500

@app.route('/api/ai/weekly-insights')
def get_weekly_insights():
    """Get comprehensive weekly insights from all recommendations"""
    if not db or not ai:
        return jsonify({"error": "AI or Database not available"}), 500

    try:
        recommendations = db.get_weekly_recommendations()
        insights = ai.generate_weekly_insights_from_recommendations(recommendations)
        
        # Add list of improvement areas based on insights
        improvement_areas = [
            "SMA 300: Reconstruct every proof from memory immediately after reading",
            "SST 305: Derive estimator properties (unbiasedness, CRLB, MLE) step-by-step from scratch",
            "SMA 335: Classify ODE type before choosing an integrating factor or method",
            "SMA 330: Hand-calculate error bounds and error propagation for numerical solutions",
            "SST 304: Connect PCA and discriminant analysis to your practical machine learning intuition",
            "SST 301: Write statistics scripts from scratch without copying or passive reading",
            "SST 101: Focus on the specific exam and CAT topics that caused difficulty previously"
        ]
        
        return jsonify({
            "success": True,
            "insights": insights,
            "recommendations_count": len(recommendations),
            "improvement_areas": improvement_areas
        }), 200
    except Exception as err:
        LOG.error(f"Error generating weekly insights: {err}")
        return jsonify({"error": str(err)}), 500

if __name__ == '__main__':
    app.run(
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 5004)),
        debug=os.getenv('FLASK_DEBUG', '0') == '1',
        threaded=True
    )
