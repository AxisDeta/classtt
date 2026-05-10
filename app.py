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
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 86400
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = IS_PRODUCTION

# Initialize session
from flask_session import Session
Session(app)

# Admin configuration
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD_HASH = os.getenv('ADMIN_PASSWORD_HASH', '')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', '')
if not ADMIN_PASSWORD_HASH and ADMIN_PASSWORD:
    ADMIN_PASSWORD_HASH = bcrypt.hashpw(ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
if not ADMIN_PASSWORD_HASH:
    if IS_PRODUCTION:
        raise RuntimeError("ADMIN_PASSWORD or ADMIN_PASSWORD_HASH must be set in production.")
    LOG_FALLBACK_ADMIN_PASSWORD = 'change-me'
    ADMIN_PASSWORD_HASH = bcrypt.hashpw(LOG_FALLBACK_ADMIN_PASSWORD.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

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
    outlines_path = os.path.join(os.path.dirname(__file__), 'courseoutlines.md')
    if not os.path.exists(outlines_path):
        return outlines

    with open(outlines_path, 'r', encoding='utf-8') as f:
        current = None
        buffer = []
        for raw_line in f:
            line = raw_line.rstrip('\n')
            if line.startswith('##'):
                if current:
                    outlines[current] = '\n'.join(buffer).strip()
                heading = line.lstrip('#').strip()
                match = re.match(r'(?:\d+\.\s*)?([A-Z0-9 ]+):\s*(.+)', heading)
                if match:
                    current = match.group(1).replace(' ', '')
                else:
                    current = heading
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
            {"time": "7:00am – 9:00am", "subject": "SST205", "title": "Probability & Statistics II", "color": "#FF6B6B"},
            {"time": "1:00pm – 3:00pm", "subject": "SMA203", "title": "Linear Algebra II", "color": "#4ECDC4"}
        ],
        "deep_study": {"time": "9:45am – 11:45am", "subject": "SST205", "title": "Deep Study", "color": "#FF6B6B"},
        "revision": {"time": "7:30pm – 8:30pm", "subject": "SMA201", "title": "Revision", "color": "#95E1D3"}
    },
    "Tuesday": {
        "day_number": 2,
        "classes": [
            {"time": "3:00pm – 5:00pm", "subject": "SST201", "title": "Operations Research I", "color": "#FFE66D"}
        ],
        "deep_study": {"time": "8:00am – 10:00am", "subject": "SMA203", "title": "Deep Study", "color": "#4ECDC4"},
        "revision": {"time": "7:00pm – 8:00pm", "subject": "SST205", "title": "Revision", "color": "#FF6B6B"}
    },
    "Wednesday": {
        "day_number": 3,
        "classes": [
            {"time": "7:00am – 8:00am", "subject": "SMA201", "title": "Calculus III", "color": "#95E1D3"},
            {"time": "9:00am – 11:00am", "subject": "SST203", "title": "Database Systems", "color": "#A8E6CF"},
            {"time": "1:00pm – 3:00pm", "subject": "SMA204", "title": "Algebraic Structures", "color": "#FFD3B6"}
        ],
        "deep_study": {"time": "3:45pm – 5:45pm", "subject": "SMA204", "title": "Deep Study", "color": "#FFD3B6"},
        "revision": {"time": "7:30pm – 8:30pm", "subject": "SMA203", "title": "Revision", "color": "#4ECDC4"}
    },
    "Thursday": {
        "day_number": 4,
        "classes": [
            {"time": "7:00am – 9:00am", "subject": "SST201", "title": "Operations Research I", "color": "#FFE66D"},
            {"time": "9:00am – 11:00am", "subject": "SMA201", "title": "Calculus III", "color": "#95E1D3"}
        ],
        "deep_study": {"time": "1:00pm – 3:00pm", "subject": "SMA201", "title": "Deep Study", "color": "#95E1D3"},
        "revision": {"time": "7:00pm – 8:00pm", "subject": "SST203", "title": "Revision", "color": "#A8E6CF"}
    },
    "Friday": {
        "day_number": 5,
        "classes": [
            {"time": "1:00pm – 2:00pm", "subject": "SMA204", "title": "Algebraic Structures", "color": "#FFD3B6"}
        ],
        "deep_study": {"time": "8:00am – 10:00am", "subject": "SST201", "title": "Deep Study", "color": "#FFE66D"},
        "revision": {"time": "7:00pm – 8:00pm", "subject": "SMA204", "title": "Revision", "color": "#FFD3B6"}
    },
    "Saturday": {
        "day_number": 6,
        "classes": [],
        "deep_study": {"time": "8:00am – 10:00am", "subject": "SST203", "title": "Deep Study", "color": "#A8E6CF"},
        "revision": {"time": "6:00pm – 7:00pm", "subject": "SST201", "title": "Revision", "color": "#FFE66D"}
    },
    "Sunday": {
        "day_number": 7,
        "classes": [],
        "deep_study": None,
        "revision": {"time": "4:00pm – 5:00pm", "subject": "Weekly Reflection", "title": "Reflection & Planning", "color": "#FFDAB9"}
    }
}

subject_info = {
    "SMA201": {
        "title": "Calculus III",
        "color": "#95E1D3",
        "description": "Multivariable calculus, partial differentiation, multiple integrals, vector calculus, optimization, and integral theorems.",
        "outline": course_outlines.get("SMA201", "Course outline not yet available.")
    },
    "SMA203": {
        "title": "Linear Algebra II",
        "color": "#4ECDC4",
        "description": "Matrix theory, determinants, eigenvalues, eigenvectors, linear transformations, and change of basis.",
        "outline": course_outlines.get("SMA203", "Course outline not yet available.")
    },
    "SMA204": {
        "title": "Algebraic Structures",
        "color": "#FFD3B6",
        "description": "Group and ring theory, homomorphisms, fields, and algebraic system structure.",
        "outline": course_outlines.get("SMA204", "Course outline not yet available.")
    },
    "SST201": {
        "title": "Operations Research I",
        "color": "#FFE66D",
        "description": "Optimization models, linear programming, transportation, assignment, duality, and network analysis.",
        "outline": course_outlines.get("SST201", "Course outline not yet available.")
    },
    "SST203": {
        "title": "Database Systems",
        "color": "#A8E6CF",
        "description": "Database design, normalization, SQL querying, data modeling, and DBA fundamentals.",
        "outline": course_outlines.get("SST203", "Course outline not yet available.")
    },
    "SST205": {
        "title": "Probability & Statistics II",
        "color": "#FF6B6B",
        "description": "Probability distributions, conditional probability, statistical inference, and applied problem solving.",
        "outline": course_outlines.get("SST205", "Course outline not yet available.")
    }
}

# Admin authentication decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            # Check if this is an API request
            if request.path.startswith('/api/'):
                return jsonify({"error": "Admin authentication required"}), 401
            flash('Admin access required', 'error')
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# Admin routes
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        
        # Validate credentials
        if username == ADMIN_USERNAME and bcrypt.checkpw(password.encode('utf-8'), ADMIN_PASSWORD_HASH.encode('utf-8')):
            session['admin_logged_in'] = True
            session['admin_username'] = username
            flash('Login successful', 'success')
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid credentials', 'error')
    
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    session.pop('admin_username', None)
    flash('Logged out successfully', 'success')
    return redirect(url_for('index'))

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
        "date_range": "11 May 2026 → 26 June 2026"
    })
    response.headers['Cache-Control'] = 'public, max-age=30'
    return response

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
    if not ai:
        return jsonify({"error": "AI not available"}), 500
    
    try:
        subject = subject_info.get(subject_code, {})
        
        if not subject:
            return jsonify({"error": "Subject not found"}), 404
        
        tips = ai.get_study_tips(subject_code, subject)
        
        return jsonify({
            "subject_code": subject_code,
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
            "Master core concepts before moving to advanced topics",
            "Practice more problem-solving exercises regularly", 
            "Review lecture notes and key formulas weekly",
            "Focus on understanding rather than memorization",
            "Seek help early when struggling with concepts",
            "Balance study time across all subjects",
            "Use active recall and spaced repetition techniques"
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
