# 🎓 Weekly Study Scheduler - Complete Setup Guide

## Overview

You now have a fully functional, beautiful Flask web application for managing your weekly study schedule. This guide will help you get started in minutes.

## ✨ What You Get

### Beautiful Features
- **Modern UI Design**: Gradient backgrounds, smooth animations, responsive layout
- **Color-Coded Schedule**: Different colors for classes, deep study, and revision
- **7-Day View**: Easy navigation between all days of the week
- **Subject Details**: Click any subject to see full information
- **Today's Focus**: Quick reference for your current day's schedule
- **Mobile Friendly**: Works on desktop, tablet, and mobile devices

### Smart Organization
- **Classes**: Your lecture times with descriptions
- **Deep Study Sessions**: 2-hour focused blocks for active learning
- **Daily Revision**: 1-hour targeted revision sessions
- **Strategic Timing**: Subjects scheduled when your cognitive energy is strongest

## 🚀 Quick Start (2 Minutes)

### Option 1: One-Click Start (Windows)
Simply double-click: `run.bat`

That's it! The app will:
1. Create a virtual environment automatically
2. Install all dependencies
3. Start the Flask server
4. Open your browser to the app

### Option 2: Manual Start

1. **Open Command Prompt/PowerShell**
   - Navigate to: `C:\Users\adm\.vscode\Products\StudyPath\flask_scheduler`

2. **Create Virtual Environment** (first time only)
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install Dependencies** (first time only)
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the App**
   ```bash
   python app.py
   ```

5. **Open Browser**
   - Go to: `http://localhost:5000`

## 📂 Project Structure

```
flask_scheduler/
├── app.py                      # Flask backend (schedule data & routes)
├── config.py                   # Configuration settings
├── requirements.txt            # Python dependencies
├── run.bat                     # One-click start script
├── README.md                   # Full documentation
├── SETUP_GUIDE.md              # This file
├── .gitignore                  # Git ignore rules
│
├── templates/
│   └── index.html              # Main HTML template
│
└── static/
    ├── style.css               # Beautiful styling
    └── script.js               # Interactivity
```

## 🎯 How to Use the App

### Daily Workflow

1. **Open the App**
   - Go to `http://localhost:5000`

2. **View Your Day**
   - Click day tabs at the top (Mon, Tue, Wed, etc.)
   - Your schedule appears immediately

3. **Understand Your Tasks**
   - **Blue cards**: Classes (lectures)
   - **Pink cards**: Deep Study (focused 2-hour blocks)
   - **Cyan cards**: Revision (1-hour daily sessions)

4. **Get Subject Details**
   - Click any subject code in the sidebar
   - See when you study it and what to focus on
   - Modal shows all relevant information

### Navigation

- **Tab Navigation**: Click day tabs to switch days
- **Subject Sidebar**: View all subjects with color coding
- **Today's Focus**: Quick glance at your schedule
- **Modal**: Click subjects for detailed information
- **Responsive**: Works at any screen size

## 🎨 Design Highlights

### Color Scheme
- **Gradients**: Smooth color transitions for modern look
- **Subject Colors**: Each subject has unique color for easy recognition
- **Activity Types**: Visual distinction between classes, study, and revision

### Animations
- **Smooth Hover**: Cards lift on hover for interactive feel
- **Fade Effects**: Subtle transitions between states
- **Pulse Animation**: Breathing effect on header icon

### Responsive
- **Desktop**: Full-featured layout with sidebar
- **Tablet**: Optimized column layout
- **Mobile**: Single column, thumb-friendly design

## ⚙️ Customization

### Change Schedule

Edit `app.py`, find `schedule_data` dictionary:

```python
schedule_data = {
    "Monday": {
        "classes": [
            {"time": "7:00am – 9:00am", "subject": "SST205", "title": "...", "color": "#FF6B6B"}
        ],
        "deep_study": {...},
        "revision": {...}
    },
    # ... etc
}
```

### Add New Subject

1. Add to `subject_info` in `app.py`:
```python
subject_info = {
    "YOUR_CODE": {
        "title": "Your Subject Name",
        "color": "#HEXCOLOR",
        "description": "What you'll learn..."
    }
}
```

2. Use in schedule with same code

3. Restart Flask server

### Change Colors

Edit `config.py`, modify `COLORS` dictionary:

```python
COLORS = {
    'SMA201': '#95E1D3',  # New color
    'SMA203': '#4ECDC4',  # etc
}
```

### Modify Study Tips

Edit `config.py`, update `STUDY_RECOMMENDATIONS`:

```python
STUDY_RECOMMENDATIONS = {
    'SMA201': {
        'focus': ['Your focus areas'],
        'method': 'Your study method',
        'mistake': 'Mistakes to avoid'
    }
}
```

## 🔧 Troubleshooting

### "Port 5000 is already in use"
```bash
# Use different port
python app.py --port 5001
```

### CSS/JavaScript not loading
1. Hard refresh: `Ctrl+Shift+R`
2. Clear browser cache
3. Restart Flask server

### Virtual environment not activating
```bash
# If on Windows and PowerShell gives permission error:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
venv\Scripts\activate
```

### Module not found error
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## 📚 Study Strategy Integration

The app reflects your study philosophy:

### 2-Hour Deep Study Blocks
- Scheduled at optimal cognitive times
- After relevant classes when concepts are fresh
- Enough time for real problem-solving
- Active learning, not passive reading

### Daily 1-Hour Revision
- Prevents knowledge decay
- Targets specific problem areas
- Builds long-term retention
- Maintains consistency

### Recovery Days
- Sunday is intentionally light
- Sleep consolidates learning
- Burnout prevention
- Sustainable pace

## 💡 Pro Tips

1. **Use Full Screen**: Maximize browser for best experience
2. **Print Schedule**: Print the day views for reference
3. **Set Reminders**: Use phone/calendar to alert you to study times
4. **Follow Timing**: Respect the scheduled times - they're scientifically optimized
5. **No Cramming**: Deep study approach prevents last-minute panic

## 📱 Mobile Usage

The app works great on phones:
- Vertical layout automatically
- Touch-friendly buttons
- Fast loading
- Full functionality

## 🔄 Keep It Updated

To add features or modify:
1. Edit files as needed
2. Restart Flask server
3. Refresh browser (Ctrl+R)
4. Hard refresh if needed (Ctrl+Shift+R)

## 📞 Need Help?

### Common Issues
- **Not Loading**: Check if Flask is running in terminal
- **Old Content**: Clear cache or hard refresh
- **No Styling**: Restart Flask server
- **Port Issues**: Check if another app uses port 5000

### Check Flask is Running
- Terminal should show "Running on http://127.0.0.1:5000"
- No error messages
- Flask is listening for connections

## 🎓 Remember

This scheduler is built on proven study principles:

✅ **Deep, Focused Learning** > Passive Reading
✅ **Consistent Daily Work** > Last-Minute Cramming  
✅ **Strategic Timing** > Random Scheduling
✅ **Active Problem-Solving** > Watching Solutions
✅ **Recovery & Rest** > Burnout Heroics

Use this app to implement these principles and watch your understanding deepen.

---

**Created for focused, strategic learning during your semester.**

**Made with ❤️ | Good luck with your studies! 📚**
