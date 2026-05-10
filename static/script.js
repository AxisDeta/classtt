// Global variables
let scheduleData = {};
let subjects = {};
let freeTasks = [];
let activeSubjectCode = null;
let hoursChartInstance = null;
let sessionsChartInstance = null;
let freeTasksChartInstance = null;
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// SVG Icons
const SVG_ICONS = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2s1 2 1 5c0 2-1 3-1 3M9 4c0 2-1 3-1 3m6 0c0 2 1 3 1 3M6 8c0 3 1 5 1 7 0 2.67-1 4-3 4s-3-1.33-3-4c0-2 1-4 1-4m12 0c0 3-1 5-1 7 0 2.67 1 4 3 4s3-1.33 3-4c0-2-1-4-1-4"></path></svg>',
    sync: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path></svg>',
    emptyCalendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
};

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    initializeTheme();
    await loadScheduleData();
    await loadFreeTasks();
    initializeEventListeners();
    displayDay('Monday');
    populateSubjectsList();
    updateTodaysFocus();
    await refreshProgressAndInsights();
});

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

// Load schedule data from API
async function loadScheduleData() {
    try {
        const response = await fetch('/api/schedule');
        const data = await response.json();
        scheduleData = data.schedule;
        subjects = data.subjects;
        document.getElementById('dateRange').textContent = data.date_range;
    } catch (error) {
        console.error('Error loading schedule:', error);
    }
}

async function loadFreeTasks() {
    try {
        const response = await fetch('/api/tasks');
        const data = await response.json();
        if (response.ok) {
            freeTasks = data.tasks || [];
        } else {
            console.error('Failed to load free tasks:', data.error);
            freeTasks = [];
        }
    } catch (error) {
        console.error('Error loading free tasks:', error);
        freeTasks = [];
    }
    renderFreeTasks();
    renderFreeTaskChart();
}

async function submitFreeTaskForm() {
    const title = document.getElementById('taskTitle').value.trim();
    const tag = document.getElementById('taskTag').value.trim();
    const day = document.getElementById('taskDay').value;
    const time = document.getElementById('taskTime').value;

    if (!title || !tag || !day || !time) {
        showNotification('Please fill out all free task fields.', 'error');
        return;
    }

    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, tag, day, time })
        });

        const result = await response.json();
        if (response.ok) {
            freeTasks.unshift(result.task);
            renderFreeTasks();
            renderFreeTaskChart();
            document.getElementById('freeTaskForm').reset();
            showNotification('Free task added successfully.', 'success');
        } else {
            showNotification(result.error || 'Unable to add task.', 'error');
        }
    } catch (error) {
        console.error('Error submitting free task:', error);
        showNotification('Error adding free task.', 'error');
    }
}

function renderFreeTasks() {
    const container = document.getElementById('freeTasksList');
    if (!container) return;

    if (!freeTasks || freeTasks.length === 0) {
        container.innerHTML = '<p class="empty-note">No free-time tasks yet. Add one to keep your week organized.</p>';
        renderFreeTaskChart();
        return;
    }

    const sortedTasks = [...freeTasks].sort((a, b) => {
        const dayOrder = days.indexOf(a.day) - days.indexOf(b.day);
        if (dayOrder !== 0) return dayOrder;
        return a.time.localeCompare(b.time);
    });

    container.innerHTML = sortedTasks.map(task => {
        const completed = Boolean(task.completed);
        const duration = Number(task.duration_minutes || 0);
        return `
        <div class="task-card ${completed ? 'completed' : ''}">
            <div class="task-card-header">
                <div>
                    <div class="task-card-title">${task.title}</div>
                    <div class="task-card-meta">
                        <span class="task-card-tag">${task.tag}</span>
                        <span class="task-card-day">${task.day}</span>
                        ${completed ? `<span class="task-card-done">Done • ${formatHours(duration)}</span>` : ''}
                    </div>
                </div>
                <div class="task-card-time">${task.time}</div>
            </div>
            <div class="task-card-actions">
                <button class="record-btn free-task-record-btn"
                    data-task-id="${task.id}"
                    type="button">
                    ${completed ? 'Update Time Spent' : 'Log Time Spent'}
                </button>
            </div>
        </div>
    `;
    }).join('');

    document.querySelectorAll('.free-task-record-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const task = freeTasks.find(item => String(item.id) === String(btn.dataset.taskId));
            if (task) {
                openFreeTaskRecordModal(task);
            }
        });
    });
    renderFreeTaskChart();
}

// Initialize event listeners
function initializeEventListeners() {
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const day = btn.dataset.day;
            displayDay(day);
        });
    });

    const freeTaskForm = document.getElementById('freeTaskForm');
    if (freeTaskForm) {
        freeTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitFreeTaskForm();
        });
    }

    const freeTaskToggle = document.getElementById('freeTaskToggle');
    const freeTaskCard = document.getElementById('freeTaskCard');
    if (freeTaskToggle && freeTaskCard) {
        freeTaskToggle.addEventListener('click', () => {
            const isCollapsed = freeTaskCard.classList.toggle('collapsed');
            freeTaskToggle.setAttribute('aria-expanded', String(!isCollapsed));
        });
    }

    // Modal close button
    const modal = document.getElementById('subjectModal');
    const closeBtn = document.getElementById('modalClose');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Refresh AI/progress panel
    const refreshBtn = document.getElementById('refreshInsights');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await refreshProgressAndInsights();
            showNotification('Insights refreshed', 'info');
        });
    }

    const markAllBtn = document.getElementById('markAllRead');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', async () => {
            // Show immediate feedback
            markAllBtn.disabled = true;
            markAllBtn.textContent = 'Marking...';
            
            try {
                const updated = await acknowledgeAllRecommendations();
                
                // Update UI immediately without full refresh
                const recommendationElements = document.querySelectorAll('.recommendation-item');
                recommendationElements.forEach(el => {
                    el.style.opacity = '0.5';
                    el.style.pointerEvents = 'none';
                });
                
                // Show notification
                showNotification(`Marked ${updated} recommendation(s) as read`, 'success');
                
                // Re-enable button
                markAllBtn.disabled = false;
                markAllBtn.textContent = 'Mark All';
                
                // Optional: refresh insights after a short delay
                setTimeout(() => refreshProgressAndInsights(), 1000);
                
            } catch (error) {
                console.error('Error marking all as read:', error);
                showNotification('Failed to mark recommendations as read', 'error');
                markAllBtn.disabled = false;
                markAllBtn.textContent = 'Mark All';
            }
        });
    }

    // Subject AI actions in modal
    const subjectTipsBtn = document.getElementById('subjectTipsBtn');
    if (subjectTipsBtn) {
        subjectTipsBtn.addEventListener('click', async () => {
            if (!activeSubjectCode) return;
            const output = document.getElementById('modalAiOutput');
            output.textContent = 'Generating tips...';
            const tips = await getStudyTips(activeSubjectCode);
            if (!tips || tips.length === 0) {
                output.textContent = 'No tips available right now.';
                return;
            }
            output.innerHTML = `<strong>AI Tips</strong><ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>`;
        });
    }

    // Record session modal
    const recordModal = document.getElementById('recordModal');
    const recordModalClose = document.getElementById('recordModalClose');
    const recordSessionForm = document.getElementById('recordSessionForm');

    if (recordModalClose && recordModal) {
        recordModalClose.addEventListener('click', closeRecordModal);
        recordModal.addEventListener('click', (e) => {
            if (e.target === recordModal) {
                closeRecordModal();
            }
        });
    }

    if (recordSessionForm) {
        recordSessionForm.addEventListener('submit', handleRecordSubmit);
    }
}

// Convert time string to minutes for sorting (e.g., "7:00am" -> 420)
function timeToMinutes(timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})(am|pm)/i);
    if (!match) return 0;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toLowerCase();
    
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
}

// Sort events chronologically
function sortEventsByTime(events) {
    return events.sort((a, b) => {
        const timeA = a.time.split('–')[0].trim();
        const timeB = b.time.split('–')[0].trim();
        return timeToMinutes(timeA) - timeToMinutes(timeB);
    });
}

// Display schedule for a specific day or the free tasks tab
function displayDay(day) {
    const dayContent = document.getElementById('dayContent');
    const freeTasksContent = document.getElementById('freeTasksContent');
    const chartsContainer = document.getElementById('chartsContainer');

    if (day === 'FreeTasks') {
        document.body.classList.add('show-free-tasks');
        if (dayContent) dayContent.classList.add('hidden');
        if (chartsContainer) chartsContainer.classList.add('hidden');
        if (dayContent) dayContent.style.display = 'none';
        if (chartsContainer) chartsContainer.style.display = 'none';
        if (freeTasksContent) {
            freeTasksContent.classList.remove('hidden');
            freeTasksContent.style.display = 'block';
        }
        renderFreeTasks();
        return;
    }

    document.body.classList.remove('show-free-tasks');
    if (freeTasksContent) freeTasksContent.classList.add('hidden');
    if (dayContent) dayContent.classList.remove('hidden');
    if (chartsContainer) chartsContainer.classList.remove('hidden');
    if (freeTasksContent) freeTasksContent.style.display = 'none';
    if (dayContent) dayContent.style.display = '';
    if (chartsContainer) chartsContainer.style.display = '';

    const dayData = scheduleData[day];
    
    if (!dayData) {
        dayContent.innerHTML = '<div class="empty-state">' + SVG_ICONS.emptyCalendar + '<p>No data available</p></div>';
        return;
    }

    let allEvents = [];

    // Classes
    if (dayData.classes && dayData.classes.length > 0) {
        dayData.classes.forEach(cls => {
            allEvents.push({ ...cls, type: 'class' });
        });
    }

    // Deep Study
    if (dayData.deep_study) {
        allEvents.push({ ...dayData.deep_study, type: 'deep-study' });
    }

    // Revision
    if (dayData.revision) {
        allEvents.push({ ...dayData.revision, type: 'revision' });
    }

    // Sort chronologically
    allEvents = sortEventsByTime(allEvents);

    let html = '';
    allEvents.forEach(event => {
        html += createEventCard(event, event.type);
    });

    if (!html) {
        html = `
            <div class="empty-state">
                ${SVG_ICONS.emptyCalendar}
                <p>Rest day! Focus on recovery and light consolidation.</p>
            </div>
        `;
    }

    dayContent.innerHTML = html;

    // Add click listeners to event cards
    document.querySelectorAll('.event-card').forEach(card => {
        card.addEventListener('click', () => {
            const subject = card.dataset.subject;
            if (subject !== 'Weekly Reflection') {
                showSubjectModal(subject);
            }
        });
    });

    document.querySelectorAll('.record-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            openRecordModal(
                btn.dataset.subject,
                btn.dataset.type,
                btn.dataset.time
            );
        });
    });
}

// Create an event card HTML
function createEventCard(event, type) {
    const subjectInfo = subjects[event.subject];
    const bgColor = event.color || '#667eea';

    let typeIcon = SVG_ICONS.book;
    let typeName = 'Class';

    if (type === 'deep-study') {
        typeIcon = SVG_ICONS.fire;
        typeName = 'Deep Study';
    } else if (type === 'revision') {
        typeIcon = SVG_ICONS.sync;
        typeName = 'Revision';
    }

    return `
        <div class="event-card" data-subject="${event.subject}" style="border-left-color: ${bgColor}; --accent: ${bgColor}">
            <div class="event-header">
                <div class="event-time">
                    ${typeIcon}
                    ${event.time}
                </div>
                <span class="event-badge ${type}">${typeName}</span>
            </div>
            <div class="event-title">${event.title}</div>
            <span class="event-subject" style="background-color: ${bgColor}; color: white;">
                ${event.subject}
            </span>
            ${subjectInfo && type === 'class' ? `<p class="event-description">${subjectInfo.description}</p>` : ''}
            <div class="event-actions">
                <button class="record-btn" data-subject="${event.subject}" data-type="${type}" data-time="${event.time}" type="button">Record Session</button>
            </div>
        </div>
    `;
}

// Populate subjects list in sidebar
function populateSubjectsList() {
    const subjectsList = document.getElementById('subjectsList');
    let html = '';

    Object.entries(subjects).forEach(([code, info]) => {
        const color = info.color || '#667eea';
        html += `
            <div class="subject-item" style="border-left-color: ${color}" onclick="showSubjectModal('${code}')">
                <div class="subject-item-code">${code}</div>
                <div class="subject-item-title">${info.title}</div>
            </div>
        `;
    });

    subjectsList.innerHTML = html;
}

// Show subject details in modal
function showSubjectModal(subjectCode) {
    const subject = subjects[subjectCode];
    if (!subject) return;

    activeSubjectCode = subjectCode;

    const modal = document.getElementById('subjectModal');
    document.getElementById('modalTitle').textContent = `${subjectCode} - ${subject.title}`;
    document.getElementById('modalDescription').textContent = subject.description;
    document.getElementById('modalOutline').innerHTML = subject.outline
        ? `<strong>Course Outline:</strong>${formatTextForDisplay(subject.outline)}`
        : '';

    // Find when this subject appears in the schedule
    let schedule = '<strong>When to study:</strong><ul>';
    days.forEach(day => {
        const dayData = scheduleData[day];
        if (dayData) {
            if (dayData.classes && dayData.classes.some(c => c.subject === subjectCode)) {
                schedule += `<li><strong>${day}:</strong> Classes - ${dayData.classes.find(c => c.subject === subjectCode).time}</li>`;
            }
            if (dayData.deep_study && dayData.deep_study.subject === subjectCode) {
                schedule += `<li><strong>${day}:</strong> Deep Study - ${dayData.deep_study.time}</li>`;
            }
            if (dayData.revision && dayData.revision.subject === subjectCode) {
                schedule += `<li><strong>${day}:</strong> Revision - ${dayData.revision.time}</li>`;
            }
        }
    });
    schedule += '</ul>';

    document.getElementById('modalSchedule').innerHTML = schedule;
    document.getElementById('modalAiOutput').textContent = 'Use AI actions to get instant guidance for this subject.';
    modal.classList.add('active');
}

function openRecordModal(subjectCode, sessionType, timeWindow) {
    const modal = document.getElementById('recordModal');
    const context = document.getElementById('recordModalContext');
    const feedback = document.getElementById('recordFormFeedback');
    document.querySelector('#recordModal h2').textContent = 'Record Study Session';
    document.getElementById('recordSubjectCode').value = subjectCode;
    document.getElementById('recordSessionType').value = sessionType;
    document.getElementById('recordTaskId').value = '';
    document.getElementById('recordMode').value = 'study';
    document.getElementById('recordDuration').value = sessionType === 'class' ? 120 : 60;
    document.getElementById('recordNotes').value = '';
    document.getElementById('recordNotes').placeholder = 'What did you cover, struggle with, or understand better?';
    document.querySelector('#recordSessionForm button[type="submit"]').textContent = 'Save Session';
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'form-feedback';
    }
    context.textContent = `${subjectCode} | ${sessionType.replace('-', ' ')} | ${timeWindow}`;
    modal.classList.add('active');
}

function openFreeTaskRecordModal(task) {
    const modal = document.getElementById('recordModal');
    const context = document.getElementById('recordModalContext');
    const feedback = document.getElementById('recordFormFeedback');
    document.querySelector('#recordModal h2').textContent = task.completed ? 'Update Free Task Time' : 'Log Free Task Time';
    document.getElementById('recordSubjectCode').value = '';
    document.getElementById('recordSessionType').value = 'free-task';
    document.getElementById('recordTaskId').value = task.id;
    document.getElementById('recordMode').value = 'free-task';
    document.getElementById('recordDuration').value = task.duration_minutes || 30;
    document.getElementById('recordNotes').value = task.notes || '';
    document.getElementById('recordNotes').placeholder = 'What did you finish or learn from this task?';
    document.querySelector('#recordSessionForm button[type="submit"]').textContent = 'Save Task Time';
    if (feedback) {
        feedback.textContent = '';
        feedback.className = 'form-feedback';
    }
    context.textContent = `${task.title} | ${task.tag} | planned ${task.day} ${task.time}`;
    modal.classList.add('active');
}

function closeRecordModal() {
    const modal = document.getElementById('recordModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function handleRecordSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const submitBtn = form.querySelector('button[type="submit"]');
    const feedback = document.getElementById('recordFormFeedback');
    const subjectCode = document.getElementById('recordSubjectCode').value;
    const sessionType = document.getElementById('recordSessionType').value;
    const taskId = document.getElementById('recordTaskId').value;
    const recordMode = document.getElementById('recordMode').value;
    const durationMinutes = parseInt(document.getElementById('recordDuration').value, 10);
    const notes = document.getElementById('recordNotes').value.trim();

    if ((recordMode === 'study' && !subjectCode) || (recordMode === 'free-task' && !taskId) || !sessionType || !durationMinutes || durationMinutes <= 0) {
        if (feedback) {
            feedback.textContent = 'Please enter a valid duration.';
            feedback.className = 'form-feedback error';
        }
        showNotification('Please enter a valid duration', 'error');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }
    if (feedback) {
        feedback.textContent = 'Saving session...';
        feedback.className = 'form-feedback info';
    }

    try {
        const result = recordMode === 'free-task'
            ? await completeFreeTask(taskId, durationMinutes, notes)
            : await recordStudyProgress(subjectCode, sessionType, durationMinutes, notes);
        if (result) {
            if (feedback) {
                feedback.textContent = result.message || 'Session saved successfully.';
                feedback.className = `form-feedback ${result.duplicate ? 'info' : 'success'}`;
            }
            if (recordMode === 'free-task') {
                await loadFreeTasks();
            } else {
                await refreshProgressAndInsights();
            }
            setTimeout(() => {
                closeRecordModal();
            }, 650);
        } else if (feedback) {
            feedback.textContent = 'Session was submitted, but confirmation failed. Check backend logs.';
            feedback.className = 'form-feedback error';
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = recordMode === 'free-task' ? 'Save Task Time' : 'Save Session';
        }
    }
}

async function refreshProgressAndInsights() {
    const progress = await getAllProgress();
    const weeklyData = await getWeeklyProgress();
    const recommendations = await getRecommendations();
    const insights = await getWeeklyInsights();

    renderProgressOverview(progress, weeklyData);
    renderCharts(progress);
    renderRecommendations(recommendations);
    renderWeeklyInsights(insights);
}

function renderProgressOverview(progressRows, weeklyData) {
    const progressEl = document.getElementById('progressOverview');
    const summaryEl = document.getElementById('weeklySummary');
    if (!progressEl || !summaryEl) return;

    if (!progressRows || progressRows.length === 0) {
        progressEl.innerHTML = '<p class="empty-note">No sessions recorded yet.</p>';
    } else {
        const topRows = progressRows.slice(0, 5);
        progressEl.innerHTML = topRows.map(row => `
            <div class="progress-item">
                <div class="progress-head">
                    <span class="progress-code">${row.subject_code}</span>
                    <span class="progress-hours">${Number(row.total_study_hours || 0).toFixed(1)}h</span>
                </div>
                <div class="progress-meta">${row.total_sessions || 0} sessions • avg ${Number(row.average_session_hours || 0).toFixed(1)}h</div>
            </div>
        `).join('');
    }

    if (weeklyData && weeklyData.summary) {
        summaryEl.innerHTML = formatTextForDisplay(weeklyData.summary);
    } else {
        const weeklyCount = weeklyData && weeklyData.weekly_stats ? weeklyData.weekly_stats.length : 0;
        summaryEl.textContent = weeklyCount > 0
            ? `Weekly stats available for ${weeklyCount} subject(s).`
            : 'No weekly summary yet. Record a session to begin.';
    }
}

function renderRecommendations(rows) {
    const container = document.getElementById('recommendationsList');
    if (!container) return;

    if (!rows || rows.length === 0) {
        container.innerHTML = '<p class="empty-note">No pending recommendations.</p>';
        return;
    }

    container.innerHTML = rows.map(rec => `
        <div class="recommendation-item">
            <div class="recommendation-head">
                <span class="recommendation-tag ${rec.recommendation_type}">${rec.recommendation_type}</span>
                <strong>${rec.subject_code}</strong>
            </div>
            <p class="recommendation-content">${rec.content}</p>
            <div class="recommendation-actions">
                <button class="mini-btn recommendation-ack-btn" data-id="${rec.id}" type="button">Mark Read</button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.recommendation-ack-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const recId = btn.dataset.id;
            const recElement = btn.closest('.recommendation-item');
            
            // Show immediate feedback
            btn.disabled = true;
            btn.textContent = 'Marking...';
            
            try {
                await acknowledgeRecommendation(recId);
                
                // Update UI immediately
                recElement.style.opacity = '0.5';
                recElement.style.pointerEvents = 'none';
                
                // Show notification
                showNotification('Recommendation marked as read', 'success');
                
                // Optional: refresh insights after a short delay
                setTimeout(() => refreshProgressAndInsights(), 1000);
                
            } catch (error) {
                console.error('Error marking recommendation as read:', error);
                showNotification('Failed to mark recommendation as read', 'error');
                btn.disabled = false;
                btn.textContent = 'Mark Read';
            }
        });
    });
}

function formatTextForDisplay(text) {
    if (!text) return '';
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Convert markdown bold **text** to <strong>text</strong>
    const convertMarkdown = (line) => line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    let html = '';
    lines.forEach(line => {
        const converted = convertMarkdown(line);
        if (/^•|^[-*]\s+|^\d+\./.test(line)) {
            // It's a list item
            html += `<div class="formatted-list-item">${converted}</div>`;
        } else {
            // It's a paragraph
            html += `<p>${converted}</p>`;
        }
    });
    
    return html;
}

// Render progress charts
function renderCharts(progressRows) {
    if (!progressRows || progressRows.length === 0) {
        return;
    }

    // Prepare data: top 8 subjects by hours
    const topSubjects = progressRows.slice(0, 8);
    const labels = topSubjects.map(row => row.subject_code);
    const hoursData = topSubjects.map(row => Number(row.total_study_hours || 0).toFixed(2));
    const sessionsData = topSubjects.map(row => row.total_sessions || 0);

    // Chart colors (gradient-like)
    const chartColors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#FFD3B6', '#A8E6CF'
    ];

    // Render Hours Chart (Bar)
    renderHoursChart(labels, hoursData, chartColors);

    // Render Sessions Chart (Pie)
    renderSessionsChart(labels, sessionsData, chartColors);
}

function renderHoursChart(labels, data, colors) {
    const ctx = document.getElementById('hoursChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (hoursChartInstance) {
        hoursChartInstance.destroy();
    }

    hoursChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Hours Studied',
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(c => c),
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    cornerRadius: 6,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' hours';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(100, 116, 139, 0.7)',
                        font: { size: 11 }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.3)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(100, 116, 139, 0.7)',
                        font: { size: 11, weight: '500' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function renderSessionsChart(labels, data, colors) {
    const ctx = document.getElementById('sessionsChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (sessionsChartInstance) {
        sessionsChartInstance.destroy();
    }

    sessionsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: 'var(--white)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 11 },
                        color: 'rgba(100, 116, 139, 0.8)',
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    cornerRadius: 6,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.parsed;
                            const percent = ((value / total) * 100).toFixed(1);
                            return context.label + ': ' + value + ' sessions (' + percent + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Render free tasks weekly chart
function renderFreeTaskChart() {
    const ctx = document.getElementById('freeTasksChart');
    if (!ctx) return;

    const completedTasks = (freeTasks || []).filter(task => task.completed && Number(task.duration_minutes || 0) > 0);

    if (completedTasks.length === 0) {
        // Show empty state
        if (freeTasksChartInstance) {
            freeTasksChartInstance.destroy();
            freeTasksChartInstance = null;
        }
        return;
    }

    const topTasks = [...completedTasks]
        .sort((a, b) => Number(b.duration_minutes || 0) - Number(a.duration_minutes || 0))
        .slice(0, 8);
    const labels = topTasks.map(task => task.title.length > 18 ? `${task.title.slice(0, 18)}...` : task.title);
    const data = topTasks.map(task => Number(((task.duration_minutes || 0) / 60).toFixed(2)));

    // Use a gradient-like color for the bar chart
    const barColor = '#0f766e';

    // Destroy existing chart if it exists
    if (freeTasksChartInstance) {
        freeTasksChartInstance.destroy();
    }

    freeTasksChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Free Tasks',
                data: data,
                backgroundColor: barColor,
                borderColor: barColor,
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'x',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    cornerRadius: 6,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                const task = topTasks[context.dataIndex];
                                return `${formatHours(task.duration_minutes || 0)} spent`;
                            }
                        }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(100, 116, 139, 0.7)',
                        font: { size: 11 },
                        callback: function(value) {
                            return value + 'h';
                        }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.3)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(100, 116, 139, 0.7)',
                        font: { size: 11, weight: '500' }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Render weekly insights summary
function renderWeeklyInsights(insights) {
    const container = document.getElementById('weeklyInsights');
    if (!container) return;

    if (!insights) {
        container.innerHTML = '<p class="empty-note">No weekly insights yet. Record more sessions to get personalized analysis.</p>';
        return;
    }

    const { summary, total_recommendations, struggles, improvements, insights: insightCount, tips, top_subjects, improvement_areas } = insights;

    let improvementList = '';
    if (improvement_areas && improvement_areas.length > 0) {
        improvementList = `
        <div class="insights-summary" style="margin-top: 1rem;">
            <strong>7 Study Tips & Improvement Areas:</strong>
            <ol style="margin-top: 0.5rem; padding-left: 1.5rem;">
                ${improvement_areas.map(area => `<li>${area}</li>`).join('')}
            </ol>
        </div>
        `;
    }

    container.innerHTML = `
        <div class="insights-stat">
            <span class="insights-stat-label">Total Insights</span>
            <span class="insights-stat-value">${total_recommendations}</span>
        </div>
        <div class="insights-stat">
            <span class="insights-stat-label">Areas to Focus</span>
            <span class="insights-stat-value">${struggles}</span>
        </div>
        <div class="insights-stat">
            <span class="insights-stat-label">Progress Areas</span>
            <span class="insights-stat-value">${improvements}</span>
        </div>
        ${top_subjects && top_subjects.length > 0 ? `
        <div class="insights-stat">
            <span class="insights-stat-label">Most Studied</span>
            <span class="insights-stat-value">${top_subjects[0]}</span>
        </div>
        ` : ''}
        ${summary ? `
        <div class="insights-summary">
            <strong>Weekly Summary:</strong>
            ${formatTextForDisplay(summary)}
        </div>
        ` : ''}
        ${improvementList}
    `;
}

// Update today's focus section
function updateTodaysFocus() {
    const todayElement = document.getElementById('todayFocus');
    const todayDay = getCurrentDayName();
    
    // If semester hasn't started yet, show message
    if (!todayDay) {
        const semesterStart = new Date('2026-05-11');
        const today = new Date();
        const daysUntil = Math.ceil((semesterStart - today) / (1000 * 60 * 60 * 24));
        
        todayElement.innerHTML = `
            <div style="text-align: center; padding: 1rem 0;">
                <p style="color: var(--text-secondary); font-size: 0.9rem;">
                    Semester begins in <strong>${daysUntil} days</strong>
                </p>
                <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.5rem;">
                    ${semesterStart.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
        `;
        return;
    }

    const today = scheduleData[todayDay];
    
    if (!today) {
        todayElement.innerHTML = '<p style="color: var(--text-secondary);">No schedule for today</p>';
        return;
    }

    let allEvents = [];

    if (today.classes && today.classes.length > 0) {
        today.classes.forEach(cls => {
            allEvents.push({ ...cls, type: 'class' });
        });
    }

    if (today.deep_study) {
        allEvents.push({ ...today.deep_study, type: 'deep-study' });
    }

    if (today.revision) {
        allEvents.push({ ...today.revision, type: 'revision' });
    }

    // Sort chronologically
    allEvents = sortEventsByTime(allEvents);

    let html = '';

    allEvents.forEach(event => {
        let icon = SVG_ICONS.book;
        if (event.type === 'deep-study') {
            icon = SVG_ICONS.fire;
        } else if (event.type === 'revision') {
            icon = SVG_ICONS.sync;
        }

        html += `
            <div class="focus-item">
                <div class="focus-time">${icon} ${event.time}</div>
                <div class="focus-title">${event.subject} - ${event.title}</div>
            </div>
        `;
    });

    todayElement.innerHTML = html || '<p style="color: var(--text-secondary);">Rest day - light consolidation</p>';
}

// Get current day name
function getCurrentDayName() {
    const currentDate = new Date();
    const semesterStart = new Date('2026-05-11');
    
    // Only show if semester has started
    if (currentDate < semesterStart) {
        return null;
    }
    
    const dayIndex = currentDate.getDay();
    const dayMap = [6, 0, 1, 2, 3, 4, 5]; // Convert JS day (0=Sun) to our day array
    return days[dayMap[dayIndex]];
}

// Smooth scrolling for tab navigation
document.addEventListener('DOMContentLoaded', () => {
    const tabsContainer = document.querySelector('.tabs-container');
    let isScrolling = false;

    if (tabsContainer) {
        tabsContainer.addEventListener('wheel', (e) => {
            if (!isScrolling) {
                e.preventDefault();
                isScrolling = true;
                tabsContainer.scrollLeft += e.deltaY;
                setTimeout(() => isScrolling = false, 100);
            }
        });
    }
});

// ==================== PROGRESS TRACKING & AI FUNCTIONS ====================

// Record a study session
async function recordStudyProgress(subjectCode, sessionType, durationMinutes, notes = '') {
    try {
        const response = await fetch('/api/progress/record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subject_code: subjectCode,
                session_type: sessionType,
                duration_minutes: durationMinutes,
                notes: notes
            })
        });

        let data = null;
        try {
            data = await response.json();
        } catch (parseError) {
            data = { error: 'Non-JSON response from server' };
        }
        
        if (response.ok) {
            console.log('✓ Progress recorded:', data);
            showNotification(`✓ Study session recorded: ${durationMinutes} minutes`, 'success');
            return data;
        } else {
            console.error('✗ Failed to record progress:', data);
            const message = data && data.error ? data.error : 'Failed to record progress';
            showNotification(message, 'error');
            return null;
        }
    } catch (error) {
        console.error('Error recording progress:', error);
        showNotification(`Error recording progress: ${error.message}`, 'error');
        return null;
    }
}

async function completeFreeTask(taskId, durationMinutes, notes = '') {
    try {
        const response = await fetch(`/api/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                duration_minutes: durationMinutes,
                notes: notes
            })
        });

        const data = await response.json();
        if (response.ok) {
            const index = freeTasks.findIndex(task => String(task.id) === String(taskId));
            if (index !== -1 && data.task) {
                freeTasks[index] = data.task;
            }
            showNotification(`Free task completed: ${formatHours(durationMinutes)}`, 'success');
            return data;
        }

        showNotification(data.error || 'Failed to complete free task', 'error');
        return null;
    } catch (error) {
        console.error('Error completing free task:', error);
        showNotification(`Error completing free task: ${error.message}`, 'error');
        return null;
    }
}

// Get progress for a subject
async function getSubjectProgress(subjectCode) {
    try {
        const response = await fetch(`/api/progress/subject/${subjectCode}`);
        const progress = await response.json();
        
        if (response.ok) {
            return progress;
        }
        return null;
    } catch (error) {
        console.error('Error fetching progress:', error);
        return null;
    }
}

// Get all progress
async function getAllProgress() {
    try {
        const response = await fetch('/api/progress/all');
        const progress = await response.json();
        
        if (response.ok) {
            return progress;
        }
        return [];
    } catch (error) {
        console.error('Error fetching progress:', error);
        return [];
    }
}

// Get weekly progress
async function getWeeklyProgress() {
    try {
        const response = await fetch('/api/progress/weekly');
        const data = await response.json();
        
        if (response.ok) {
            return data;
        }
        return { weekly_stats: [], summary: '' };
    } catch (error) {
        console.error('Error fetching weekly progress:', error);
        return { weekly_stats: [], summary: '' };
    }
}

// Get AI recommendations
async function getRecommendations() {
    try {
        const response = await fetch('/api/ai/recommendations');
        const recommendations = await response.json();
        
        if (response.ok) {
            return recommendations;
        }
        return [];
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
}

// Get study tips for a subject
async function getStudyTips(subjectCode) {
    try {
        const response = await fetch(`/api/ai/tips/${subjectCode}`);
        const data = await response.json();
        
        if (response.ok) {
            return data.tips;
        }
        return [];
    } catch (error) {
        console.error('Error fetching study tips:', error);
        return [];
    }
}

// Get study pattern analysis
async function getStudyPattern() {
    try {
        const response = await fetch('/api/ai/pattern');
        const data = await response.json();
        
        if (response.ok) {
            return data.pattern_analysis;
        }
        return '';
    } catch (error) {
        console.error('Error fetching study pattern:', error);
        return '';
    }
}

// Get weekly insights summary
async function getWeeklyInsights() {
    try {
        const response = await fetch('/api/ai/weekly-insights');
        const data = await response.json();
        
        if (response.ok) {
            return data.insights;
        }
        return null;
    } catch (error) {
        console.error('Error fetching weekly insights:', error);
        return null;
    }
}

// Acknowledge a recommendation
async function acknowledgeRecommendation(recId) {
    try {
        const response = await fetch(`/api/ai/acknowledge/${recId}`, {
            method: 'POST'
        });
        
        if (response.ok) {
            console.log('✓ Recommendation acknowledged');
        }
    } catch (error) {
        console.error('Error acknowledging recommendation:', error);
    }
}

async function acknowledgeAllRecommendations() {
    try {
        const response = await fetch('/api/ai/acknowledge-all', {
            method: 'POST'
        });

        const data = await response.json();
        if (response.ok) {
            return data.updated || 0;
        }
        return 0;
    } catch (error) {
        console.error('Error acknowledging all recommendations:', error);
        return 0;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Helper function to format hours
function formatHours(minutes) {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
        return `${hours}h ${mins}m`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        return `${mins}m`;
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
