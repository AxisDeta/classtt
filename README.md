# Flask Weekly Study Scheduler with AI & Progress Tracking

A beautiful, modern Flask application for organizing your weekly study schedule with progress tracking, dark mode, and AI-powered personalized recommendations.

## ✨ Features

### Frontend
- **Beautiful Gradient UI** - Modern design with responsive layout
- **7-Day Schedule Navigation** - View your entire week at a glance
- **Dark Mode Toggle** - Switch between light and dark themes (persisted in localStorage)
- **SVG Icons** - Clean, crisp icons instead of external dependencies
- **Chronological Sorting** - Events automatically sorted by time
- **Date-Aware Display** - Shows countdown before semester or today's schedule
- **Subject Sidebar** - Color-coded subjects with quick access

### Backend
- **MySQL Database** - Persistent storage for study sessions, progress, and recommendations
- **Progress Tracking** - Track study hours, sessions, and completion rates per subject
- **Groq AI Integration** - Intelligent study recommendations based on progress
- **RESTful API** - Complete endpoints for scheduling, progress, and AI functions

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- MySQL Server 5.7+
- Groq API Key (get from https://console.groq.com)

### Installation

1. **Navigate to project directory**
```bash
cd Products/StudyPath/flask_scheduler
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
# Copy the template
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your text editor
```

5. **Set up MySQL database**
```bash
# Login to MySQL
mysql -u root -p

# In MySQL CLI:
CREATE DATABASE study_scheduler;
```

6. **Run the application**
```bash
python app.py
```

7. **Open in browser**
Navigate to `http://127.0.0.1:5000`

## 📋 Environment Configuration

Create a `.env` file in the project root with these variables:

```env
# Flask Configuration
FLASK_SECRET=your-random-secret-key-here-change-in-production
APP_BASE_URL=http://127.0.0.1:5000
PORT=5000

# MySQL Database Configuration
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=study_scheduler
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password_here
MYSQL_CONNECT_TIMEOUT=10

# Groq AI API Configuration
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

**How to get GROQ_API_KEY:**
1. Visit https://console.groq.com
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy it to `.env`

## 🗄️ Database Schema

### Tables Created Automatically

**study_sessions**
- Records individual study sessions
- Fields: subject_code, session_type, scheduled_date, duration_minutes, completed, notes, focus_areas

**progress_tracking**
- Aggregated progress per subject
- Fields: subject_code, total_hours, sessions_completed, completion_percentage

**ai_recommendations**
- AI-generated recommendations and tips
- Fields: subject_code, recommendation_type (improvement/insight/tip/warning), content, acknowledged

**subject_stats**
- Summary statistics per subject
- Fields: subject_code, total_study_hours, average_session_hours, completion_rate

## 📡 API Endpoints

### Schedule
- `GET /api/schedule` - Get full schedule data

### Progress Tracking
- `POST /api/progress/record` - Record a study session
- `GET /api/progress/subject/<code>` - Get progress for subject
- `GET /api/progress/all` - Get all progress data
- `GET /api/progress/weekly` - Get weekly statistics and AI summary

### AI Recommendations
- `GET /api/ai/recommendations` - Get pending recommendations
- `GET /api/ai/recommendation/<code>` - Generate recommendation for subject
- `GET /api/ai/tips/<code>` - Get 3 quick study tips
- `GET /api/ai/pattern` - Analyze study patterns
- `POST /api/ai/acknowledge/<id>` - Mark recommendation as read

## 🎨 Frontend Functions

### Recording Progress
```javascript
// Record a study session
await recordStudyProgress(
    'SMA201',           // subject_code
    'deep-study',       // session_type: 'class', 'deep-study', 'revision'
    90,                 // duration_minutes
    'Notes here'        // optional notes
);
```

### Getting Progress
```javascript
// Get progress for a subject
const progress = await getSubjectProgress('SMA201');

// Get all subjects' progress
const allProgress = await getAllProgress();

// Get weekly stats and AI summary
const weekly = await getWeeklyProgress();
console.log(weekly.summary);  // AI-generated summary
```

### AI Recommendations
```javascript
// Get all pending recommendations
const recs = await getRecommendations();

// Get recommendation for specific subject
const rec = await getSubjectRecommendation('SMA201');

// Get quick study tips
const tips = await getStudyTips('SMA201');

// Analyze your study patterns
const pattern = await getStudyPattern();

// Mark as acknowledged
await acknowledgeRecommendation(recommendationId);
```

## 🛠️ Project Structure

```
flask_scheduler/
├── app.py                 # Flask application & routes
├── database.py            # MySQL database manager
├── ai.py                  # Groq AI integration
├── requirements.txt       # Python dependencies
├── .env.example          # Environment template
├── .env                  # Configuration (not in git)
├── static/
│   ├── script.js         # Frontend functionality
│   └── style.css         # Styling & dark theme
└── templates/
    └── index.html        # HTML template
```

## ✅ Setup Checklist

- [ ] Python 3.8+ installed
- [ ] MySQL server running
- [ ] Virtual environment created and activated
- [ ] Requirements installed: `pip install -r requirements.txt`
- [ ] `.env` file created with valid credentials
- [ ] MySQL database created: `study_scheduler`
- [ ] Groq API key obtained from console.groq.com
- [ ] Flask app starts without errors: `python app.py`
- [ ] Browser opens to http://127.0.0.1:5000

## 🔧 Troubleshooting

### Database Connection Error
```
Error: No module named 'mysql'
Solution: pip install mysql-connector-python
```

### Groq API Error
```
Error: GROQ_API_KEY not found
Solution: Make sure .env file exists and contains valid GROQ_API_KEY
```

### Port Already in Use
```
Error: Address already in use
Solution: Change PORT in .env or kill process on port 5000
```

### Theme Not Persisting
```
Clear browser localStorage: localStorage.clear()
Hard refresh: Ctrl+Shift+R
```

## 📊 Typical Workflow

1. **View Schedule** - Open app, see week view with classes
2. **Record Session** - After studying, log progress with duration
3. **Get Recommendation** - AI analyzes work and suggests improvements
4. **Check Progress** - View total hours and completion rate
5. **Analyze Pattern** - See insights about study consistency
6. **Toggle Theme** - Switch to dark mode for evening study

## 🎯 AI Recommendation Types

Based on study progress, the AI generates different types:

- **insight** - Advanced tips when progress is good
- **tip** - Actionable techniques for improvement
- **improvement** - Suggestions for weak areas
- **warning** - Alert when sessions are too short

## 📱 Responsive Design

- Desktop (1024px+) - Full 2-column layout
- Tablet (768px+) - Adjusted grid
- Mobile (<768px) - Single column, stacked

## 🔒 Security Notes

- Change `FLASK_SECRET` in production
- Use strong MySQL password
- Never commit `.env` file (already in .gitignore)
- Validate all user inputs on backend
- Use HTTPS in production

## 📄 License

Personal use for academic purposes.

---

**Made with ❤️ for focused, strategic learning**

