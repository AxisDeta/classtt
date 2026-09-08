"""
AI Module for Study Scheduler
Uses Groq API to provide smart recommendations and personalized study tips
"""

from groq import Groq
import os
import logging
import json
import re
from datetime import datetime

LOG = logging.getLogger(__name__)

class StudyAI:
    """Generates AI-powered study recommendations and insights"""
    
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        self.client = Groq(api_key=api_key)
        self.model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        self.fallback_models = [self.model, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "qwen/qwen3.6-27b"]
        LOG.info("Groq AI client initialized successfully")
    
    def _chat_completion(self, messages, temperature=0.7, max_tokens=150, top_p=1):
        """Execute chat completion with fallback models if the primary model is unavailable."""
        models_to_try = []
        for m in self.fallback_models:
            if m and m not in models_to_try:
                models_to_try.append(m)
        
        last_err = None
        for model_name in models_to_try:
            try:
                response = self.client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=temperature,
                    max_completion_tokens=max_tokens,
                    top_p=top_p,
                    stream=False
                )
                self.model = model_name
                return response
            except Exception as err:
                last_err = err
                LOG.warning(f"Groq model {model_name} failed: {err}. Trying next fallback...")
        if last_err:
            raise last_err
    
    def generate_study_recommendation(self, subject_code, subject_info, progress_data, recent_context=None):
        """
        Generate personalized study recommendations based on progress
        
        Args:
            subject_code: Subject code (e.g., "SMA201")
            subject_info: Dict with subject details
            progress_data: Dict with study progress
            recent_context: Optional dict with latest session details (notes, duration, session_type)
        
        Returns:
            Dict with recommendation type and content
        """
        try:
            # Build context
            hours_studied = progress_data.get('total_study_hours', 0)
            sessions = progress_data.get('total_sessions', 0)
            avg_session = progress_data.get('average_session_hours', 0)
            recent_context = recent_context or {}
            recent_notes = (recent_context.get('notes') or '').strip()
            recent_duration = recent_context.get('duration_minutes')
            recent_session_type = recent_context.get('session_type')

            context_block = ""
            if recent_notes or recent_duration or recent_session_type:
                context_block = f"""
Latest Session Context:
- Type: {recent_session_type or 'N/A'}
- Duration: {recent_duration if recent_duration is not None else 'N/A'} minutes
- Student Notes: {recent_notes if recent_notes else 'No notes provided'}

Use this context directly. If notes are provided, anchor your recommendation to them.
"""
            
            outline_block = ""
            if subject_info.get('outline'):
                outline_block = f"Course Outline:\n{subject_info.get('outline')}\n"

            # Determine recommendation type based on progress
            if hours_studied == 0:
                rec_type = "insight"
                prompt = f"""
You are speaking directly to a student as their personal study advisor. Use "you" throughout your response.

Subject: {subject_code} - {subject_info.get('title', 'Unknown')}
Description: {subject_info.get('description', '')}
{outline_block}
{context_block}

You have not started studying this subject yet.

Tell the student directly: You should [specific tip to help begin study journey].
Keep it concise (2-3 sentences), actionable, and motivating.
"""
            elif hours_studied < 5:
                rec_type = "tip"
                prompt = f"""
You are speaking directly to a student as their personal study advisor. Use "you" throughout your response.

Subject: {subject_code} - {subject_info.get('title', 'Unknown')}
Hours Studied: {hours_studied:.1f} hours
Sessions Completed: {sessions}
Average Session: {avg_session:.2f} hours
{context_block}

You have just started studying this subject.

Tell the student directly: You should [specific study technique or tip to use right now].
Keep it concise (2-3 sentences).
"""
            elif hours_studied > 15:
                rec_type = "insight"
                prompt = f"""
You are speaking directly to a student as their personal study advisor. Use "you" throughout your response.

Subject: {subject_code} - {subject_info.get('title', 'Unknown')}
Hours Studied: {hours_studied:.1f} hours
Sessions Completed: {sessions}
Average Session: {avg_session:.2f} hours
{context_block}

You have invested significant time in this subject.

Tell the student directly: [One insight about your progress] and [suggest one advanced technique].
Keep it concise (2-3 sentences).
"""
            elif avg_session < 1:
                rec_type = "warning"
                prompt = f"""
You are speaking directly to a student as their personal study advisor. Use "you" throughout your response.

Subject: {subject_code} - {subject_info.get('title', 'Unknown')}
Hours Studied: {hours_studied:.1f} hours
Average Session: {avg_session:.2f} hours
{context_block}

Your sessions are shorter than planned (goal is 2 hours for deep study).

Tell the student directly: You should [specific recommendation to extend study sessions].
Keep it concise (2-3 sentences).
"""
            else:
                rec_type = "improvement"
                prompt = f"""
You are speaking directly to a student as their personal study advisor. Use "you" throughout your response.

Subject: {subject_code} - {subject_info.get('title', 'Unknown')}
Hours Studied: {hours_studied:.1f} hours
Sessions Completed: {sessions}
{context_block}

You are making good progress on this subject.

Tell the student directly: You should focus on [specific area for improvement].
Keep it concise (2-3 sentences).
"""
            
            # Call Groq API
            message = self._chat_completion(
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=150,
                top_p=1
            )
            
            content = message.choices[0].message.content.strip()
            
            LOG.info(f"✓ Generated recommendation for {subject_code}")
            
            return {
                "type": rec_type,
                "subject_code": subject_code,
                "content": content,
                "timestamp": datetime.now().isoformat()
            }
        
        except Exception as err:
            LOG.error(f"✗ Failed to generate recommendation: {err}")
            return {
                "type": "error",
                "subject_code": subject_code,
                "content": "Unable to generate recommendation at this time.",
                "error": str(err)
            }
    
    def generate_weekly_summary(self, weekly_stats, all_progress):
        """
        Generate a weekly study summary with insights
        
        Args:
            weekly_stats: Dict of weekly study statistics per subject
            all_progress: List of all subject progress data
        
        Returns:
            String with weekly summary
        """
        try:
            # Build statistics context
            total_hours = sum(stat.get('total_minutes', 0) / 60 for stat in weekly_stats)
            subject_count = len(weekly_stats)
            
            if not weekly_stats:
                return "No study sessions recorded this week. Don't forget to stay consistent!"
            
            top_subject = max(weekly_stats, key=lambda x: x.get('total_minutes', 0))
            top_hours = top_subject.get('total_minutes', 0) / 60
            
            prompt = f"""
You are speaking directly to a student as their study coach. Use "you" throughout your response.

Weekly Study Summary:
- Total Study Hours: {total_hours:.1f} hours
- Subjects Studied: {subject_count}
- Top Subject: {top_subject.get('subject_code', 'Unknown')} ({top_hours:.1f} hours)
- Study Sessions: {len(weekly_stats)}

Tell the student directly: [One encouraging summary sentence about your progress] and [one actionable suggestion for next week].
Keep it concise (2-3 sentences total).
"""
            
            message = self._chat_completion(
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=100,
                top_p=1
            )
            
            summary = message.choices[0].message.content.strip()
            LOG.info("✓ Generated weekly summary")
            
            return summary
        
        except Exception as err:
            LOG.error(f"✗ Failed to generate weekly summary: {err}")
            return "Keep up with your consistent study schedule!"
    
    def get_study_tips(self, subject_code, subject_info):
        """
        Get quick study tips for a subject
        
        Args:
            subject_code: Subject code
            subject_info: Subject information
        
        Returns:
            List of 3 quick study tips
        """
        try:
            outline_block = ""
            if subject_info.get('outline'):
                outline_block = f"Course Outline:\n{subject_info.get('outline')}\n"

            prompt = f"""You are speaking directly to a student as an expert academic coach in {subject_code} - {subject_info.get('title', 'Unknown')}.
Subject Description: {subject_info.get('description', '')}
{outline_block}
Provide exactly 3 quick, high-yield, specific study tips for this subject.
Format each tip on a new line starting with:
1. You should [first tip]
2. You should [second tip]
3. You should [third tip]

Guidelines:
- When writing mathematical formulas, symbols, or notation, use standard LaTeX inline syntax wrapped in \\( ... \\) (e.g. \\(E[\\mathbf{{X}}]\\), \\(\\boldsymbol{{\\mu}}\\), \\(\\Sigma\\), \\(\\varepsilon\\text{{--}}\\delta\\)).
- Make each tip practical, actionable, and complete without cutting off.
"""
            
            message = self._chat_completion(
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=600,
                top_p=1
            )
            
            tips_text = message.choices[0].message.content.strip()
            
            # Robust parsing of tips
            tips = []
            for raw_line in tips_text.split('\n'):
                line = raw_line.strip()
                if not line:
                    continue
                # Match numbered or bulleted lines (e.g., "1. ", "**1.** ", "- ", "* ", "• ")
                cleaned = re.sub(r'^(?:\*{0,2}\d+[\.\)]\*{0,2}|\[\d+\]|[-*•])\s*', '', line).strip()
                if cleaned and len(cleaned) >= 15:
                    tips.append(cleaned)
            
            # If line-by-line parsing missed tips, try paragraph split
            if len(tips) < 2:
                paragraphs = [p.strip() for p in re.split(r'\n\s*\n', tips_text) if p.strip()]
                for p in paragraphs:
                    cleaned = re.sub(r'^(?:\*{0,2}\d+[\.\)]\*{0,2}|\[\d+\]|[-*•])\s*', '', p).strip()
                    if cleaned and len(cleaned) >= 20 and cleaned not in tips:
                        tips.append(cleaned)

            # Ensure we always return high-yield tips even if formatting was irregular
            if not tips:
                method = (subject_info.get('method') or '').strip()
                mistake = (subject_info.get('mistake') or '').strip()
                title = subject_info.get('title') or subject_code
                tips = [
                    f"You should derive key theorems and formulas from first principles without looking at your notes to build deep intuition for {title}.",
                    f"You should {method}" if method else f"You should work through past tutorial sheets and exam problems for {subject_code}.",
                    f"You should avoid this common pitfall: {mistake}" if mistake else f"You should create a one-page formula sheet summarizing definitions and core properties in {subject_code}."
                ]
            
            LOG.info(f"✓ Generated study tips for {subject_code}")
            return tips[:3]
        
        except Exception as err:
            LOG.error(f"✗ Failed to get study tips: {err}")
            method = (subject_info.get('method') or '').strip()
            mistake = (subject_info.get('mistake') or '').strip()
            title = subject_info.get('title') or subject_code
            return [
                f"You should derive key theorems and formulas from first principles without looking at your notes to build deep intuition for {title}.",
                f"You should {method}" if method else f"You should work through past tutorial sheets and exam problems for {subject_code}.",
                f"You should avoid this common pitfall: {mistake}" if mistake else f"You should create a one-page formula sheet summarizing definitions and core properties in {subject_code}."
            ]
    
    def analyze_study_pattern(self, weekly_stats):
        """
        Analyze study patterns and provide insights
        
        Args:
            weekly_stats: Weekly study statistics
        
        Returns:
            String with pattern analysis
        """
        try:
            if not weekly_stats:
                return "No study data to analyze yet. Start your study sessions!"
            
            # Calculate insights
            total_sessions = len(weekly_stats)
            avg_session_hours = sum(s.get('total_minutes', 0) for s in weekly_stats) / (total_sessions * 60) if total_sessions > 0 else 0
            
            prompt = f"""
You are speaking directly to a student as a study pattern analyst. Use "you" throughout your response.

Analysis Data:
- Total Sessions This Week: {total_sessions}
- Average Session Duration: {avg_session_hours:.1f} hours
- Subjects Covered: {total_sessions}

Based on this pattern, tell the student:
1. [One observation about your study consistency]
2. [One suggestion to optimize your schedule]

Keep it concise (2-3 sentences).
"""
            
            message = self._chat_completion(
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=120,
                top_p=1
            )
            
            analysis = message.choices[0].message.content.strip()
            LOG.info("✓ Generated study pattern analysis")
            
            return analysis
        
        except Exception as err:
            LOG.error(f"✗ Failed to analyze study pattern: {err}")
            return "Keep maintaining your study rhythm!"

    def generate_weekly_insights_from_recommendations(self, recommendations_list):
        """
        Generate a comprehensive weekly summary from all recommendations
        highlighting areas struggled with or lessons missed
        
        Args:
            recommendations_list: List of recommendations from past 7 days
        
        Returns:
            Dict with insights, struggles, and recommendations
        """
        try:
            if not recommendations_list:
                return {
                    "summary": "No recommendations recorded this week yet. Keep studying to track your progress!",
                    "areas_of_focus": [],
                    "recommendations": []
                }
            
            # Group recommendations by type and subject
            by_type = {}
            by_subject = {}
            
            for rec in recommendations_list:
                rec_type = rec.get('recommendation_type', 'unknown')
                subject = rec.get('subject_code', 'Unknown')
                content = rec.get('content', '')
                
                if rec_type not in by_type:
                    by_type[rec_type] = []
                by_type[rec_type].append(content)
                
                if subject not in by_subject:
                    by_subject[subject] = []
                by_subject[subject].append(content)
            
            # Build summary prompt
            struggle_count = len([r for r in recommendations_list if r.get('recommendation_type') == 'warning'])
            improvement_count = len([r for r in recommendations_list if r.get('recommendation_type') == 'improvement'])
            insight_count = len([r for r in recommendations_list if r.get('recommendation_type') == 'insight'])
            tip_count = len([r for r in recommendations_list if r.get('recommendation_type') == 'tip'])
            
            top_subjects = sorted(by_subject.items(), key=lambda x: len(x[1]), reverse=True)[:3]
            top_subjects_str = ', '.join([f"{s[0]} ({len(s[1])} recommendations)" for s in top_subjects])
            
            prompt = f"""
You are speaking directly to a student as an academic advisor. Use "you" throughout your response.

Weekly Recommendation Analysis (Past 7 Days):
- Total Recommendations: {len(recommendations_list)}
- Warnings/Struggles: {struggle_count}
- Improvement Areas: {improvement_count}
- Key Insights: {insight_count}
- Study Tips: {tip_count}
- Most Focused Subjects: {top_subjects_str}

Provide a brief weekly insights report in this format:
1. KEY STRUGGLES (if any): [List 1-2 main areas where you struggled]
2. PROGRESS AREAS: [List 1-2 subjects where you made good progress]
3. NEXT WEEK FOCUS: [One specific recommendation for next week]

Keep it concise and actionable (3-4 sentences total).
"""
            
            message = self._chat_completion(
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=250,
                top_p=1
            )
            
            insights = message.choices[0].message.content.strip()
            LOG.info("✓ Generated weekly insights from recommendations")
            
            return {
                "summary": insights,
                "total_recommendations": len(recommendations_list),
                "struggles": struggle_count,
                "improvements": improvement_count,
                "insights": insight_count,
                "tips": tip_count,
                "top_subjects": [s[0] for s in top_subjects]
            }
        
        except Exception as err:
            LOG.error(f"✗ Failed to generate weekly insights: {err}")
            return {
                "summary": "Unable to generate insights at this time.",
                "total_recommendations": 0,
                "struggles": 0,
                "improvements": 0,
                "insights": 0,
                "tips": 0,
                "top_subjects": []
            }

# Initialize global AI instance
ai = None

def init_ai():
    """Initialize the AI module"""
    global ai
    try:
        ai = StudyAI()
        return ai
    except ValueError as err:
        LOG.error(f"✗ AI initialization failed: {err}")
        return None

def get_ai():
    """Get the AI instance"""
    global ai
    if ai is None:
        ai = init_ai()
    return ai
