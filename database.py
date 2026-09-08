"""
Database module for Study Scheduler
Handles MySQL connections and operations for tracking study progress
"""

import mysql.connector
from mysql.connector import pooling
from datetime import datetime, timedelta
import os
import logging

LOG = logging.getLogger(__name__)

class DatabaseManager:
    """Manages MySQL database connections and operations"""
    
    def __init__(self):
        self.pool = None
        self.connect()
    
    def connect(self):
        """Initialize MySQL connection pool"""
        try:
            self.pool = pooling.MySQLConnectionPool(
                pool_name="study_scheduler_pool",
                pool_size=5,
                pool_reset_session=True,
                host=os.getenv("MYSQL_HOST", "127.0.0.1"),
                port=int(os.getenv("MYSQL_PORT", 3306)),
                database=os.getenv("MYSQL_DATABASE", "study_scheduler"),
                user=os.getenv("MYSQL_USER", "root"),
                password=os.getenv("MYSQL_PASSWORD", ""),
                connect_timeout=int(os.getenv("MYSQL_CONNECT_TIMEOUT", 10))
            )
            LOG.info("✓ MySQL connection pool created successfully")
            self.init_database()
        except mysql.connector.Error as err:
            LOG.error(f"✗ MySQL connection failed: {err}")
            raise
    
    def get_connection(self):
        """Get a connection from the pool"""
        if not self.pool:
            self.connect()
        return self.pool.get_connection()

    def get_current_week_start(self):
        """Return Monday for the current calendar week"""
        today = datetime.now().date()
        return today - timedelta(days=today.weekday())
    
    def init_database(self):
        """Initialize database tables"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Study Sessions Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS studytt_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_code VARCHAR(20) NOT NULL,
                session_type ENUM('class', 'deep-study', 'revision') NOT NULL,
                scheduled_date DATE NOT NULL,
                scheduled_time TIME NOT NULL,
                actual_start DATETIME,
                actual_end DATETIME,
                duration_minutes INT,
                completed BOOLEAN DEFAULT FALSE,
                notes TEXT,
                focus_areas VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_subject (subject_code),
                INDEX idx_date (scheduled_date),
                INDEX idx_completed (completed)
            )
            """)
            
            # Progress Tracking Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS studytt_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_code VARCHAR(20) NOT NULL,
                total_planned_hours FLOAT DEFAULT 0,
                total_actual_hours FLOAT DEFAULT 0,
                sessions_completed INT DEFAULT 0,
                sessions_total INT DEFAULT 0,
                completion_percentage FLOAT DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_subject (subject_code),
                UNIQUE KEY unique_subject (subject_code)
            )
            """)
            
            # AI Recommendations Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS studytt_recommendations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_code VARCHAR(20) NOT NULL,
                recommendation_type ENUM('improvement', 'insight', 'tip', 'warning') NOT NULL,
                content TEXT NOT NULL,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                acknowledged BOOLEAN DEFAULT FALSE,
                INDEX idx_subject (subject_code),
                INDEX idx_type (recommendation_type)
            )
            """)
            
            # Subject Stats Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS studytt_stats (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_code VARCHAR(20) NOT NULL UNIQUE,
                total_study_hours FLOAT DEFAULT 0,
                total_sessions INT DEFAULT 0,
                average_session_hours FLOAT DEFAULT 0,
                completion_rate FLOAT DEFAULT 0,
                difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
                last_studied DATETIME,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_subject (subject_code)
            )
            """)

            # Free Time Tasks Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS studytt_tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                tag VARCHAR(100) NOT NULL,
                day ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
                time TIME NOT NULL,
                duration_minutes INT DEFAULT NULL,
                completed BOOLEAN DEFAULT FALSE,
                completed_at DATETIME DEFAULT NULL,
                notes TEXT,
                week_start DATE DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_day (day),
                INDEX idx_tag (tag),
                INDEX idx_completed (completed)
            )
            """)

            cursor.execute("SHOW COLUMNS FROM studytt_tasks")
            existing_task_columns = {row[0] for row in cursor.fetchall()}
            task_column_migrations = {
                "duration_minutes": "ALTER TABLE studytt_tasks ADD COLUMN duration_minutes INT DEFAULT NULL AFTER time",
                "completed": "ALTER TABLE studytt_tasks ADD COLUMN completed BOOLEAN DEFAULT FALSE AFTER duration_minutes",
                "completed_at": "ALTER TABLE studytt_tasks ADD COLUMN completed_at DATETIME DEFAULT NULL AFTER completed",
                "notes": "ALTER TABLE studytt_tasks ADD COLUMN notes TEXT AFTER completed_at",
                "week_start": "ALTER TABLE studytt_tasks ADD COLUMN week_start DATE DEFAULT NULL AFTER notes",
            }
            for column_name, alter_sql in task_column_migrations.items():
                if column_name not in existing_task_columns:
                    cursor.execute(alter_sql)

            cursor.execute(
                "UPDATE studytt_tasks SET week_start = %s WHERE week_start IS NULL",
                (self.get_current_week_start(),)
            )

            # Topic Mastery & Weakness Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS studytt_topic_mastery (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_code VARCHAR(20) NOT NULL,
                topic_title VARCHAR(255) NOT NULL,
                status ENUM('needs-work', 'reviewing', 'mastered') DEFAULT 'needs-work',
                last_reviewed DATETIME DEFAULT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_subject_topic (subject_code, topic_title),
                INDEX idx_topic_status (subject_code, status)
            )
            """)

            # Spaced Repetition Reviews Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS studytt_reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_code VARCHAR(20) NOT NULL,
                topic VARCHAR(255) NOT NULL,
                difficulty_reason VARCHAR(255),
                interval_stage INT DEFAULT 1,
                next_review_date DATE NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                completed_at DATETIME DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_review_sched (next_review_date, completed),
                INDEX idx_review_subj (subject_code)
            )
            """)

            # Exam Milestones & Target Velocity Table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS studytt_milestones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                subject_code VARCHAR(20) NOT NULL,
                title VARCHAR(100) NOT NULL,
                target_date DATE NOT NULL,
                target_hours FLOAT DEFAULT 20.0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_milestone_date (target_date)
            )
            """)

            # Course Notes & Scans
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS studytt_notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL DEFAULT 1,
                subject_code VARCHAR(20) NOT NULL,
                topic_title VARCHAR(255) NULL,
                title VARCHAR(255) NOT NULL,
                content_markdown LONGTEXT NULL,
                note_type VARCHAR(50) NOT NULL DEFAULT 'lecture',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_subj_notes (subject_code),
                INDEX idx_topic_notes (topic_title)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)

            # Note Image / Scan Attachments (GitHub-backed)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS studytt_note_attachments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                note_id INT NOT NULL,
                stored_path VARCHAR(500) NOT NULL,
                public_url VARCHAR(1000) NOT NULL,
                original_filename VARCHAR(255) NOT NULL,
                file_size_bytes INT NOT NULL DEFAULT 0,
                file_type VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_att_note_id (note_id),
                FOREIGN KEY (note_id) REFERENCES studytt_notes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            
            conn.commit()
            cursor.close()
            conn.close()
            LOG.info("✓ Database tables initialized successfully")
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Database initialization failed: {err}")
            raise
    
    def record_study_session(self, subject_code, session_type, scheduled_date,
                            scheduled_time, duration_minutes, notes=""):
        """Record a completed study session with short-window duplicate protection"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            # Guard against accidental double-submits within a short time window.
            cursor.execute("""
            SELECT id, actual_start, duration_minutes, notes
            FROM studytt_sessions
            WHERE subject_code = %s
              AND session_type = %s
              AND completed = TRUE
            ORDER BY actual_start DESC
            LIMIT 1
            """, (subject_code, session_type))

            last_session = cursor.fetchone()
            if last_session and last_session.get('actual_start'):
                minutes_since = (datetime.now() - last_session['actual_start']).total_seconds() / 60
                same_duration = int(last_session.get('duration_minutes') or 0) == int(duration_minutes)
                same_notes = (last_session.get('notes') or '').strip() == (notes or '').strip()

                if minutes_since <= 5 and same_duration and same_notes:
                    cursor.close()
                    conn.close()
                    LOG.info(f"↻ Duplicate session prevented for {subject_code} ({session_type})")
                    return {
                        "session_id": last_session['id'],
                        "duplicate": True,
                        "message": "Duplicate session prevented (same entry submitted too quickly)."
                    }
            
            cursor.execute("""
            INSERT INTO studytt_sessions 
            (subject_code, session_type, scheduled_date, scheduled_time, 
             actual_start, actual_end, duration_minutes, completed, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                subject_code,
                session_type,
                scheduled_date,
                scheduled_time,
                datetime.now(),
                datetime.now(),
                duration_minutes,
                True,
                notes
            ))
            
            conn.commit()
            session_id = cursor.lastrowid
            cursor.close()
            conn.close()
            
            # Update progress
            self.update_subject_progress(subject_code, duration_minutes)
            
            LOG.info(f"✓ Study session recorded: {subject_code} ({session_type})")
            return {
                "session_id": session_id,
                "duplicate": False,
                "message": "Study session recorded successfully."
            }
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to record study session: {err}")
            return None
    
    def update_subject_progress(self, subject_code, hours):
        """Update subject progress and statistics"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Check if subject exists in stats
            cursor.execute("SELECT id FROM studytt_stats WHERE subject_code = %s", (subject_code,))
            exists = cursor.fetchone()
            
            if not exists:
                cursor.execute("""
                INSERT INTO studytt_stats (subject_code, total_study_hours, total_sessions)
                VALUES (%s, %s, 1)
                """, (subject_code, hours / 60))
            else:
                cursor.execute("""
                UPDATE studytt_stats 
                SET total_study_hours = total_study_hours + %s,
                    total_sessions = total_sessions + 1,
                    average_session_hours = (total_study_hours + %s) / (total_sessions + 1),
                    last_studied = NOW()
                WHERE subject_code = %s
                """, (hours / 60, hours / 60, subject_code))
            
            conn.commit()
            cursor.close()
            conn.close()
            LOG.info(f"✓ Progress updated for {subject_code}")
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to update progress: {err}")
    
    def get_subject_progress(self, subject_code):
        """Get progress for a specific subject"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
            SELECT 
                subject_code,
                total_study_hours,
                total_sessions,
                average_session_hours,
                completion_rate,
                difficulty_level,
                last_studied
            FROM studytt_stats
            WHERE subject_code = %s
            """, (subject_code,))
            
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            return result or {
                'subject_code': subject_code,
                'total_study_hours': 0,
                'total_sessions': 0,
                'average_session_hours': 0,
                'completion_rate': 0,
                'difficulty_level': 'medium',
                'last_studied': None
            }
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to get subject progress: {err}")
            return None
    
    def get_all_progress(self):
        """Get progress for all subjects"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
            SELECT 
                subject_code,
                total_study_hours,
                total_sessions,
                average_session_hours,
                completion_rate,
                difficulty_level,
                last_studied
            FROM studytt_stats
            ORDER BY total_study_hours DESC
            """)
            
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return results if results else []
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to get all progress: {err}")
            return []
    
    def save_recommendation(self, subject_code, rec_type, content):
        """Save an AI recommendation"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
            INSERT INTO studytt_recommendations
            (subject_code, recommendation_type, content)
            VALUES (%s, %s, %s)
            """, (subject_code, rec_type, content))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            LOG.info(f"✓ Recommendation saved for {subject_code}")
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to save recommendation: {err}")
    
    def get_pending_recommendations(self, one_per_subject=True):
        """Get unacknowledged AI recommendations; optionally keep newest per subject."""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            cursor.execute("""
            SELECT 
                id,
                subject_code,
                recommendation_type,
                content,
                generated_at
            FROM studytt_recommendations
            WHERE acknowledged = FALSE
            ORDER BY generated_at DESC
            LIMIT 50
            """)
            
            results = cursor.fetchall()
            cursor.close()
            conn.close()

            if not results:
                return []

            if not one_per_subject:
                return results[:10]

            filtered = []
            seen_subjects = set()
            for row in results:
                subject_code = row.get('subject_code')
                if subject_code in seen_subjects:
                    continue
                seen_subjects.add(subject_code)
                filtered.append(row)
                if len(filtered) >= 10:
                    break

            return filtered
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to get recommendations: {err}")
            return []
    
    def acknowledge_recommendation(self, rec_id):
        """Mark a recommendation as acknowledged"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
            UPDATE studytt_recommendations
            SET acknowledged = TRUE
            WHERE id = %s
            """, (rec_id,))
            
            conn.commit()
            cursor.close()
            conn.close()
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to acknowledge recommendation: {err}")

    def acknowledge_all_recommendations(self):
        """Mark all pending recommendations as acknowledged"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()

            cursor.execute("""
            UPDATE studytt_recommendations
            SET acknowledged = TRUE
            WHERE acknowledged = FALSE
            """)

            updated = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            return updated

        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to acknowledge all recommendations: {err}")
            return 0
    
    def get_weekly_stats(self):
        """Get study stats for the past week"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            week_ago = datetime.now() - timedelta(days=7)
            
            cursor.execute("""
            SELECT 
                subject_code,
                COUNT(*) as sessions_count,
                SUM(duration_minutes) as total_minutes,
                AVG(duration_minutes) as avg_minutes
            FROM studytt_sessions
            WHERE actual_start >= %s AND completed = TRUE
            GROUP BY subject_code
            ORDER BY total_minutes DESC
            """, (week_ago,))
            
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return results if results else []
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to get weekly stats: {err}")
            return []

    def get_weekly_recommendations(self):
        """Get all recommendations generated in the past 7 days"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            
            week_ago = datetime.now() - timedelta(days=7)
            
            cursor.execute("""
            SELECT 
                id,
                subject_code,
                recommendation_type,
                content,
                generated_at,
                acknowledged
            FROM studytt_recommendations
            WHERE generated_at >= %s
            ORDER BY generated_at DESC
            """, (week_ago,))
            
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            
            return results if results else []
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to get weekly recommendations: {err}")
            return []

    def get_weekly_history(self, week_start):
        """Get academic and free-task history for a selected week"""
        try:
            week_end = week_start + timedelta(days=7)
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            cursor.execute("""
            SELECT
                subject_code AS label,
                COUNT(*) AS count,
                SUM(duration_minutes) AS total_minutes
            FROM studytt_sessions
            WHERE completed = TRUE
              AND actual_start >= %s
              AND actual_start < %s
            GROUP BY subject_code
            ORDER BY total_minutes DESC
            """, (week_start, week_end))
            academic_by_subject = cursor.fetchall()

            cursor.execute("""
            SELECT
                DAYNAME(actual_start) AS label,
                COUNT(*) AS count,
                SUM(duration_minutes) AS total_minutes
            FROM studytt_sessions
            WHERE completed = TRUE
              AND actual_start >= %s
              AND actual_start < %s
            GROUP BY DAYNAME(actual_start), WEEKDAY(actual_start)
            ORDER BY WEEKDAY(actual_start)
            """, (week_start, week_end))
            academic_by_day = cursor.fetchall()

            cursor.execute("""
            SELECT
                tag AS label,
                COUNT(*) AS count,
                SUM(duration_minutes) AS total_minutes
            FROM studytt_tasks
            WHERE completed = TRUE
              AND completed_at >= %s
              AND completed_at < %s
            GROUP BY tag
            ORDER BY total_minutes DESC
            """, (week_start, week_end))
            free_by_tag = cursor.fetchall()

            cursor.execute("""
            SELECT
                DAYNAME(completed_at) AS label,
                COUNT(*) AS count,
                SUM(duration_minutes) AS total_minutes
            FROM studytt_tasks
            WHERE completed = TRUE
              AND completed_at >= %s
              AND completed_at < %s
            GROUP BY DAYNAME(completed_at), WEEKDAY(completed_at)
            ORDER BY WEEKDAY(completed_at)
            """, (week_start, week_end))
            free_by_day = cursor.fetchall()

            cursor.close()
            conn.close()

            academic_minutes = sum(int(row.get('total_minutes') or 0) for row in academic_by_subject)
            free_minutes = sum(int(row.get('total_minutes') or 0) for row in free_by_tag)

            return {
                "week_start": week_start.isoformat(),
                "week_end": (week_end - timedelta(days=1)).isoformat(),
                "academic_by_subject": academic_by_subject,
                "academic_by_day": academic_by_day,
                "free_by_tag": free_by_tag,
                "free_by_day": free_by_day,
                "totals": {
                    "academic_minutes": academic_minutes,
                    "free_minutes": free_minutes,
                    "combined_minutes": academic_minutes + free_minutes,
                }
            }
        except mysql.connector.Error as err:
            LOG.error(f"Failed to get weekly history: {err}")
            return None

    def clear_all_data(self):
        """Clear all data from all tables (for testing/admin purposes)"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Clear all tables in correct order (respecting foreign keys if any)
            tables = ['studytt_recommendations', 'studytt_sessions', 'studytt_progress', 'studytt_stats', 'studytt_tasks']
            
            for table in tables:
                cursor.execute(f"DELETE FROM {table}")
                LOG.info(f"✓ Cleared {cursor.rowcount} records from {table}")
            
            conn.commit()
            cursor.close()
            conn.close()
            
            LOG.info("✓ All database data cleared successfully")
            return True
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to clear database: {err}")
            return False

    def get_all_sessions_for_admin(self):
        """Get all study sessions for admin management"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
            SELECT 
                id,
                subject_code,
                session_type,
                scheduled_date,
                scheduled_time,
                actual_start,
                actual_end,
                duration_minutes,
                completed,
                notes,
                focus_areas,
                created_at,
                updated_at
            FROM studytt_sessions
            ORDER BY scheduled_date DESC, scheduled_time DESC
            """)
            
            columns = [desc[0] for desc in cursor.description]
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            
            cursor.close()
            conn.close()
            
            return results if results else []
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to get sessions for admin: {err}")
            return []

    def get_all_tasks_for_admin(self):
        """Get all free tasks for admin management"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
            SELECT 
                id,
                title,
                tag,
                day,
                TIME_FORMAT(time, '%H:%i') as time,
                duration_minutes,
                completed,
                completed_at,
                notes,
                week_start,
                created_at,
                updated_at
            FROM studytt_tasks
            ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), time ASC
            """)

            columns = [desc[0] for desc in cursor.description]
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))

            cursor.close()
            conn.close()
            return results if results else []

        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to get tasks for admin: {err}")
            return []

    def get_tasks(self):
        """Get all free tasks for the week"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
            SELECT 
                id,
                title,
                tag,
                day,
                TIME_FORMAT(time, '%H:%i') as time,
                duration_minutes,
                completed,
                completed_at,
                notes,
                week_start
            FROM studytt_tasks
            WHERE week_start = %s
            ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), time ASC
            """, (self.get_current_week_start(),))
            results = cursor.fetchall()
            cursor.close()
            conn.close()
            return results if results else []
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to get tasks: {err}")
            return []

    def add_task(self, title, tag, day, time_value):
        """Add a new free task"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            week_start = self.get_current_week_start()
            cursor.execute("""
            INSERT INTO studytt_tasks (title, tag, day, time, week_start)
            VALUES (%s, %s, %s, %s, %s)
            """, (title, tag, day, time_value, week_start))
            task_id = cursor.lastrowid
            conn.commit()
            cursor.close()
            conn.close()
            return {
                'id': task_id,
                'title': title,
                'tag': tag,
                'day': day,
                'time': time_value,
                'duration_minutes': None,
                'completed': False,
                'completed_at': None,
                'notes': None,
                'week_start': week_start.isoformat()
            }
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to add task: {err}")
            return None

    def update_task(self, task_id, data):
        """Update an existing free task"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            update_fields = []
            values = []
            allowed_fields = ['title', 'tag', 'day', 'time', 'duration_minutes', 'completed', 'completed_at', 'notes']
            for field in allowed_fields:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    values.append(data[field])
            if not update_fields:
                return False
            values.append(task_id)
            query = f"UPDATE studytt_tasks SET {', '.join(update_fields)} WHERE id = %s"
            cursor.execute(query, values)
            updated = cursor.rowcount > 0
            conn.commit()
            cursor.close()
            conn.close()
            return updated
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to update task {task_id}: {err}")
            return False

    def delete_task(self, task_id):
        """Delete a free task by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM studytt_tasks WHERE id = %s", (task_id,))
            deleted = cursor.rowcount > 0
            conn.commit()
            cursor.close()
            conn.close()
            return deleted
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to delete task {task_id}: {err}")
            return False

    def delete_tasks(self, task_ids):
        """Delete multiple free tasks by ID"""
        if not task_ids:
            return 0
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            placeholders = ", ".join(["%s"] * len(task_ids))
            cursor.execute(f"DELETE FROM studytt_tasks WHERE id IN ({placeholders})", task_ids)
            deleted = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            return deleted
        except mysql.connector.Error as err:
            LOG.error(f"Failed to delete tasks in batch: {err}")
            return 0

    def complete_task(self, task_id, duration_minutes, notes=""):
        """Mark a free task as completed and store the time spent"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
            UPDATE studytt_tasks
            SET duration_minutes = %s,
                completed = TRUE,
                completed_at = NOW(),
                notes = %s
            WHERE id = %s
            """, (duration_minutes, notes, task_id))

            if cursor.rowcount == 0:
                conn.commit()
                cursor.close()
                conn.close()
                return None

            cursor.execute("""
            SELECT
                id,
                title,
                tag,
                day,
                TIME_FORMAT(time, '%H:%i') as time,
                duration_minutes,
                completed,
                completed_at,
                notes
            FROM studytt_tasks
            WHERE id = %s
            """, (task_id,))
            task = cursor.fetchone()
            conn.commit()
            cursor.close()
            conn.close()
            return task
        except mysql.connector.Error as err:
            LOG.error(f"Failed to complete task {task_id}: {err}")
            return None

    def delete_session(self, session_id):
        """Delete a study session by ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM studytt_sessions WHERE id = %s", (session_id,))
            deleted = cursor.rowcount > 0
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return deleted
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to delete session {session_id}: {err}")
            return False

    def delete_sessions(self, session_ids):
        """Delete multiple study sessions by ID"""
        if not session_ids:
            return 0
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            placeholders = ", ".join(["%s"] * len(session_ids))
            cursor.execute(f"DELETE FROM studytt_sessions WHERE id IN ({placeholders})", session_ids)
            deleted = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            return deleted
        except mysql.connector.Error as err:
            LOG.error(f"Failed to delete sessions in batch: {err}")
            return 0

    def update_session(self, session_id, data):
        """Update a study session"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Build update query dynamically
            update_fields = []
            values = []
            
            allowed_fields = [
                'subject_code', 'session_type', 'scheduled_date', 'scheduled_time',
                'actual_start', 'actual_end', 'duration_minutes', 'completed', 
                'notes', 'focus_areas'
            ]
            
            for field in allowed_fields:
                if field in data:
                    update_fields.append(f"{field} = %s")
                    values.append(data[field])
            
            if not update_fields:
                return False
            
            values.append(session_id)
            query = f"UPDATE studytt_sessions SET {', '.join(update_fields)} WHERE id = %s"
            
            cursor.execute(query, values)
            updated = cursor.rowcount > 0
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return updated
        
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to update session {session_id}: {err}")
            return False

    # ==================== TOPIC MASTERY METHODS ====================

    def get_topic_mastery(self, subject_code):
        """Get all tracked topic mastery statuses for a specific subject"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT topic_title, status, last_reviewed, notes, updated_at
                FROM studytt_topic_mastery
                WHERE subject_code = %s
            """, (subject_code,))
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            return {r['topic_title']: r for r in rows}
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to get topic mastery for {subject_code}: {err}")
            return {}

    def update_topic_status(self, subject_code, topic_title, status, notes=None):
        """Update or insert topic mastery status"""
        if status not in ('needs-work', 'reviewing', 'mastered'):
            status = 'needs-work'
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO studytt_topic_mastery (subject_code, topic_title, status, last_reviewed, notes)
                VALUES (%s, %s, %s, NOW(), %s)
                ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    last_reviewed = NOW(),
                    notes = COALESCE(VALUES(notes), notes)
            """, (subject_code, topic_title, status, notes))
            conn.commit()
            cursor.close()
            conn.close()
            return True
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to update topic status ({subject_code} - {topic_title}): {err}")
            return False

    def get_attention_needed_topics(self, limit=8):
        """Retrieve topics flagged as 'needs-work' or overdue for review"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, subject_code, topic_title, status, last_reviewed, notes
                FROM studytt_topic_mastery
                WHERE status = 'needs-work'
                ORDER BY COALESCE(last_reviewed, created_at) ASC
                LIMIT %s
            """, (limit,))
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            return rows
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to get attention needed topics: {err}")
            return []

    # ==================== SPACED REPETITION REVIEWS ====================

    def create_review_item(self, subject_code, topic, difficulty_reason=None, interval_days=3):
        """Schedule a spaced repetition review item"""
        try:
            target_date = datetime.now().date() + timedelta(days=interval_days)
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO studytt_reviews (subject_code, topic, difficulty_reason, interval_stage, next_review_date, completed)
                VALUES (%s, %s, %s, 1, %s, FALSE)
            """, (subject_code, topic, difficulty_reason, target_date))
            conn.commit()
            review_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return review_id
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to create review item: {err}")
            return None

    def get_due_reviews(self, target_date=None):
        """Retrieve pending reviews due on or before target_date"""
        try:
            check_date = target_date or datetime.now().date()
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, subject_code, topic, difficulty_reason, interval_stage, next_review_date, created_at
                FROM studytt_reviews
                WHERE completed = FALSE AND next_review_date <= %s
                ORDER BY next_review_date ASC, id ASC
            """, (check_date,))
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            return rows
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to fetch due reviews: {err}")
            return []

    def complete_review_item(self, review_id, advance_interval=True):
        """Mark a review item completed, optionally scheduling next interval (3d -> 7d -> 14d -> mastered)"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, subject_code, topic, interval_stage
                FROM studytt_reviews
                WHERE id = %s
            """, (review_id,))
            item = cursor.fetchone()
            if not item:
                cursor.close()
                conn.close()
                return False

            cursor.execute("""
                UPDATE studytt_reviews
                SET completed = TRUE, completed_at = NOW()
                WHERE id = %s
            """, (review_id,))

            # Schedule next interval if applicable
            next_stage = item['interval_stage'] + 1
            if advance_interval and next_stage <= 3:
                next_days = 7 if next_stage == 2 else 14
                next_date = datetime.now().date() + timedelta(days=next_days)
                cursor.execute("""
                    INSERT INTO studytt_reviews (subject_code, topic, difficulty_reason, interval_stage, next_review_date, completed)
                    VALUES (%s, %s, %s, %s, %s, FALSE)
                """, (item['subject_code'], item['topic'], f"Stage {next_stage} Spaced Review", next_stage, next_date))

            conn.commit()
            cursor.close()
            conn.close()
            return True
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to complete review item {review_id}: {err}")
            return False

    # ==================== EXAM MILESTONES ====================

    def get_milestones(self):
        """Get all upcoming exam and CAT milestones"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, subject_code, title, target_date, target_hours,
                       DATEDIFF(target_date, CURDATE()) as days_remaining
                FROM studytt_milestones
                ORDER BY target_date ASC
            """)
            rows = cursor.fetchall()
            cursor.close()
            conn.close()
            return rows
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to fetch milestones: {err}")
            return []

    def add_milestone(self, subject_code, title, target_date, target_hours=20.0):
        """Add a new milestone/exam target"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO studytt_milestones (subject_code, title, target_date, target_hours)
                VALUES (%s, %s, %s, %s)
            """, (subject_code, title, target_date, target_hours))
            conn.commit()
            new_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return new_id
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to add milestone: {err}")
            return None

    def delete_milestone(self, milestone_id):
        """Delete an exam milestone"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM studytt_milestones WHERE id = %s", (milestone_id,))
            conn.commit()
            deleted = cursor.rowcount > 0
            cursor.close()
            conn.close()
            return deleted
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to delete milestone {milestone_id}: {err}")
            return False

    # ==================== COURSE NOTES & SCANS ====================

    def create_note(self, subject_code, title, content_markdown, topic_title=None, note_type='lecture'):
        """Create a new course note entry and return its ID"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO studytt_notes (user_id, subject_code, topic_title, title, content_markdown, note_type)
                VALUES (1, %s, %s, %s, %s, %s)
            """, (subject_code, topic_title or None, title, content_markdown or '', note_type))
            conn.commit()
            note_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return note_id
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to create note for {subject_code}: {err}")
            return None

    def add_note_attachment(self, note_id, stored_path, public_url, original_filename, file_size_bytes=0, file_type='image/jpeg'):
        """Attach an image or scan (GitHub-backed) to a note"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO studytt_note_attachments
                (note_id, stored_path, public_url, original_filename, file_size_bytes, file_type)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (note_id, stored_path, public_url, original_filename, file_size_bytes, file_type))
            conn.commit()
            att_id = cursor.lastrowid
            cursor.close()
            conn.close()
            return att_id
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to add attachment to note {note_id}: {err}")
            return None

    def get_notes_by_subject(self, subject_code, topic_title=None):
        """Get all notes for a subject with their attached scans/images"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)

            if topic_title:
                cursor.execute("""
                    SELECT id, user_id, subject_code, topic_title, title, content_markdown, note_type,
                           created_at, updated_at
                    FROM studytt_notes
                    WHERE subject_code = %s AND topic_title = %s
                    ORDER BY created_at DESC
                """, (subject_code, topic_title))
            else:
                cursor.execute("""
                    SELECT id, user_id, subject_code, topic_title, title, content_markdown, note_type,
                           created_at, updated_at
                    FROM studytt_notes
                    WHERE subject_code = %s
                    ORDER BY created_at DESC
                """, (subject_code,))

            notes = cursor.fetchall()

            if notes:
                note_ids = [n['id'] for n in notes]
                format_strings = ','.join(['%s'] * len(note_ids))
                cursor.execute(f"""
                    SELECT id, note_id, stored_path, public_url, original_filename, file_size_bytes, file_type, created_at
                    FROM studytt_note_attachments
                    WHERE note_id IN ({format_strings})
                    ORDER BY created_at ASC
                """, tuple(note_ids))
                attachments = cursor.fetchall()

                # Group attachments by note_id
                att_by_note = {}
                for att in attachments:
                    nid = att['note_id']
                    if nid not in att_by_note:
                        att_by_note[nid] = []
                    att_by_note[nid].append(att)

                for n in notes:
                    n['attachments'] = att_by_note.get(n['id'], [])
            else:
                for n in notes:
                    n['attachments'] = []

            cursor.close()
            conn.close()
            return notes
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to fetch notes for {subject_code}: {err}")
            return []

    def get_note_by_id(self, note_id):
        """Get a single note with its attachments"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, user_id, subject_code, topic_title, title, content_markdown, note_type,
                       created_at, updated_at
                FROM studytt_notes
                WHERE id = %s
            """, (note_id,))
            note = cursor.fetchone()
            if note:
                cursor.execute("""
                    SELECT id, note_id, stored_path, public_url, original_filename, file_size_bytes, file_type, created_at
                    FROM studytt_note_attachments
                    WHERE note_id = %s
                    ORDER BY created_at ASC
                """, (note_id,))
                note['attachments'] = cursor.fetchall()
            cursor.close()
            conn.close()
            return note
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to fetch note {note_id}: {err}")
            return None

    def delete_note(self, note_id):
        """Delete note and return list of attachments so GitHub files can be deleted"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            # First fetch attachments for external cleanup
            cursor.execute("""
                SELECT id, stored_path, public_url FROM studytt_note_attachments WHERE note_id = %s
            """, (note_id,))
            attachments = cursor.fetchall()

            cursor.execute("DELETE FROM studytt_notes WHERE id = %s", (note_id,))
            conn.commit()
            deleted = cursor.rowcount > 0
            cursor.close()
            conn.close()
            return attachments if deleted else []
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to delete note {note_id}: {err}")
            return []

    def delete_note_attachment(self, attachment_id):
        """Delete a single attachment and return its stored_path"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT id, stored_path, public_url FROM studytt_note_attachments WHERE id = %s
            """, (attachment_id,))
            att = cursor.fetchone()
            if att:
                cursor.execute("DELETE FROM studytt_note_attachments WHERE id = %s", (attachment_id,))
                conn.commit()
            cursor.close()
            conn.close()
            return att
        except mysql.connector.Error as err:
            LOG.error(f"✗ Failed to delete attachment {attachment_id}: {err}")
            return None

# Initialize global database manager
db = None

def init_db():
    """Initialize the database manager"""
    global db
    db = DatabaseManager()
    return db

def get_db():
    """Get the database manager instance"""
    global db
    if db is None:
        db = init_db()
    return db
