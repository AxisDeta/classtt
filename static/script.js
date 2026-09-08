// Global variables
let scheduleData = {};
let subjects = {};
let strategyData = {};
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
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>'
};

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    initializeTheme();
    await loadScheduleData();
    await loadFreeTasks();
    initializeEventListeners();
    initTimer();
    initMobileNavBar();
    initKeyboardShortcuts();
    
    const currentDay = getCurrentDayName() || 'Monday';
    // Highlight active and today tabs
    document.querySelectorAll('.tab-btn').forEach(b => {
        if (b.dataset.day === currentDay) {
            b.classList.add('active');
            b.classList.add('today-tab');
        } else {
            b.classList.remove('active');
        }
    });
    displayDay(currentDay);
    populateSubjectsList();
    updateTodaysFocus();
    await refreshProgressAndInsights();
});

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
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
        scheduleData = data.schedule || {};
        subjects = data.subjects || {};
        strategyData = data.strategy || {};
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
                    <div class="task-card-title">${escapeHtml(task.title)}</div>
                    <div class="task-card-meta">
                        <span class="task-card-tag">${escapeHtml(task.tag)}</span>
                        <span class="task-card-day">${escapeHtml(task.day)}</span>
                        ${completed ? `<span class="task-card-done">Done • ${formatHours(duration)}</span>` : ''}
                    </div>
                </div>
                <div class="task-card-time">${escapeHtml(task.time)}</div>
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
    
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

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
            markAllBtn.disabled = true;
            markAllBtn.textContent = 'Marking...';
            
            try {
                const updated = await acknowledgeAllRecommendations();
                const recommendationElements = document.querySelectorAll('.recommendation-item');
                recommendationElements.forEach(el => {
                    el.style.opacity = '0.5';
                    el.style.pointerEvents = 'none';
                });
                showNotification(`Marked ${updated} recommendation(s) as read`, 'success');
                markAllBtn.disabled = false;
                markAllBtn.textContent = 'Mark All';
                setTimeout(() => refreshProgressAndInsights(), 800);
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
            output.textContent = 'Generating AI study tips...';
            const tips = await getStudyTips(activeSubjectCode);
            if (!tips || tips.length === 0) {
                output.textContent = 'No tips available right now.';
                return;
            }
            output.innerHTML = `<strong>AI Subject Guidance:</strong><ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>`;
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
    if (!timeStr) return 0;
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
        const timeA = (a.time || '').split('–')[0].trim();
        const timeB = (b.time || '').split('–')[0].trim();
        return timeToMinutes(timeA) - timeToMinutes(timeB);
    });
}

// Helper: Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Display schedule for a specific day, strategy tab, or the free tasks tab
function displayDay(day) {
    const dayContent = document.getElementById('dayContent');
    const strategyContent = document.getElementById('strategyContent');
    const freeTasksContent = document.getElementById('freeTasksContent');
    const chartsContainer = document.getElementById('chartsContainer');

    if (day === 'Strategy') {
        document.body.classList.remove('show-free-tasks');
        if (dayContent) dayContent.classList.add('hidden');
        if (freeTasksContent) freeTasksContent.classList.add('hidden');
        if (chartsContainer) chartsContainer.classList.add('hidden');
        if (strategyContent) {
            strategyContent.classList.remove('hidden');
            strategyContent.style.display = 'block';
        }
        renderStrategyView();
        return;
    }

    if (day === 'FreeTasks') {
        document.body.classList.add('show-free-tasks');
        if (dayContent) dayContent.classList.add('hidden');
        if (strategyContent) strategyContent.classList.add('hidden');
        if (chartsContainer) chartsContainer.classList.add('hidden');
        if (freeTasksContent) {
            freeTasksContent.classList.remove('hidden');
            freeTasksContent.style.display = 'block';
        }
        renderFreeTasks();
        return;
    }

    // Normal Day
    document.body.classList.remove('show-free-tasks');
    if (freeTasksContent) freeTasksContent.classList.add('hidden');
    if (strategyContent) strategyContent.classList.add('hidden');
    if (dayContent) dayContent.classList.remove('hidden');
    if (chartsContainer) chartsContainer.classList.remove('hidden');
    if (freeTasksContent) freeTasksContent.style.display = 'none';
    if (strategyContent) strategyContent.style.display = 'none';
    if (dayContent) dayContent.style.display = '';
    if (chartsContainer) chartsContainer.style.display = '';

    const dayData = scheduleData[day];
    
    if (!dayData) {
        dayContent.innerHTML = '<div class="empty-state">' + SVG_ICONS.emptyCalendar + '<p>No schedule available for this day.</p></div>';
        return;
    }

    let allEvents = [];

    // Classes
    if (dayData.classes && Array.isArray(dayData.classes)) {
        dayData.classes.forEach(cls => {
            allEvents.push({ ...cls, type: 'class' });
        });
    }

    // Deep Study (Array or Object)
    if (dayData.deep_study) {
        if (Array.isArray(dayData.deep_study)) {
            dayData.deep_study.forEach(ds => allEvents.push({ ...ds, type: 'deep-study' }));
        } else {
            allEvents.push({ ...dayData.deep_study, type: 'deep-study' });
        }
    }

    // Revision (Array or Object)
    if (dayData.revision) {
        if (Array.isArray(dayData.revision)) {
            dayData.revision.forEach(r => allEvents.push({ ...r, type: 'revision' }));
        } else {
            allEvents.push({ ...dayData.revision, type: 'revision' });
        }
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
                <p>Rest day! Focus on recovery, light consolidation, and mental reset.</p>
            </div>
        `;
    }

    dayContent.innerHTML = html;

    // Add click listeners to event cards
    document.querySelectorAll('.event-card').forEach(card => {
        card.addEventListener('click', () => {
            const subject = card.dataset.subject;
            if (subject && subject !== 'Weekly Reflection' && subject !== 'Optional Light Revision') {
                showSubjectModal(subject);
            }
        });
    });

    document.querySelectorAll('.record-btn:not(.free-task-record-btn)').forEach(btn => {
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

// Create an event card HTML with rich session context
function createEventCard(event, type) {
    const subjectInfo = subjects[event.subject];
    const bgColor = event.color || '#10B981';

    let typeIcon = SVG_ICONS.book;
    let typeName = 'Class';

    if (type === 'deep-study') {
        typeIcon = SVG_ICONS.fire;
        typeName = 'Deep Study';
    } else if (type === 'revision') {
        typeIcon = SVG_ICONS.sync;
        typeName = 'Revision';
    }

    let reasonHtml = '';
    if (event.reason) {
        reasonHtml = `<div class="event-reason"><span class="reason-label">Strategic Objective:</span> ${escapeHtml(event.reason)}</div>`;
    }

    let focusHtml = '';
    if (event.focus) {
        if (Array.isArray(event.focus)) {
            focusHtml = `<div class="event-focus"><span class="focus-label">Key Focus Areas:</span><ul>${event.focus.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul></div>`;
        } else {
            focusHtml = `<div class="event-focus"><span class="focus-label">Key Focus:</span> ${escapeHtml(event.focus)}</div>`;
        }
    }

    const isNonSubject = (event.subject === 'Weekly Reflection' || event.subject === 'Optional Light Revision');

    return `
        <div class="event-card ${type}" data-subject="${event.subject}" style="border-left-color: ${bgColor}; --accent: ${bgColor}">
            <div class="event-header">
                <div class="event-time">
                    ${typeIcon}
                    ${escapeHtml(event.time)}
                </div>
                <span class="event-badge ${type}">${typeName}</span>
            </div>
            <div class="event-title">${escapeHtml(event.title)}</div>
            <div class="event-meta-row">
                <span class="event-subject" style="background-color: ${bgColor}; color: white;">
                    ${escapeHtml(event.subject)}
                </span>
                ${subjectInfo && subjectInfo.difficulty_label ? `<span class="difficulty-pill">${escapeHtml(subjectInfo.difficulty_label)}</span>` : ''}
            </div>
            ${subjectInfo && type === 'class' ? `<p class="event-description">${escapeHtml(subjectInfo.description)}</p>` : ''}
            ${reasonHtml}
            ${focusHtml}
            <div class="event-actions">
                <button class="record-btn" data-subject="${event.subject}" data-type="${type}" data-time="${event.time}" type="button">
                    ${isNonSubject ? 'Log Session' : 'Record Session'}
                </button>
            </div>
        </div>
    `;
}

// Render Strategy & Strategic Framework Dashboard
function renderStrategyView() {
    const container = document.getElementById('strategyContent');
    if (!container) return;

    const rules = strategyData.non_negotiable_rules || [];
    const protocol = strategyData.productivity_protocol || [];
    const ranking = strategyData.difficulty_ranking || [];
    const resources = strategyData.resources || {};

    let rulesHtml = rules.map(r => `
        <div class="rule-card">
            <div class="rule-header">
                <span class="rule-badge">${SVG_ICONS.shield} ${escapeHtml(r.rule || 'Rule')}</span>
            </div>
            <p class="rule-text">${escapeHtml(r.text)}</p>
        </div>
    `).join('');

    let protocolHtml = protocol.map(p => `
        <div class="protocol-card">
            <div class="protocol-phase-header">
                <span class="protocol-phase-badge">${SVG_ICONS.zap} ${escapeHtml(p.phase)}</span>
            </div>
            <ul class="protocol-list">
                ${p.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
        </div>
    `).join('');

    let rankingHtml = ranking.map(r => {
        const sub = subjects[r.code] || {};
        const color = sub.color || '#667eea';
        return `
            <div class="ranking-card" style="border-left-color: ${color}">
                <div class="ranking-rank">#${r.rank}</div>
                <div class="ranking-info">
                    <div class="ranking-title"><strong>${escapeHtml(r.code)}</strong> — ${escapeHtml(r.title)}</div>
                    <div class="ranking-meta">
                        <span class="ranking-level">${escapeHtml(r.level)}</span>
                        <span class="ranking-touchpoints">${escapeHtml(r.touchpoints)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    let resourcesHtml = Object.entries(resources).map(([code, resText]) => {
        const sub = subjects[code] || {};
        const color = sub.color || '#667eea';
        return `
            <div class="resource-item" style="border-left-color: ${color}">
                <span class="resource-code" style="background-color: ${color}; color: #fff;">${escapeHtml(code)}</span>
                <span class="resource-text">${escapeHtml(resText)}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="strategy-dashboard">
            <div class="strategy-hero">
                <h2>${SVG_ICONS.target} 3rd Year, 1st Semester Strategic Blueprint</h2>
                <p>Built around cognitive energy optimization, high-difficulty prioritization, and protected morning deep-study blocks.</p>
            </div>

            <section class="strategy-section">
                <h3 class="strategy-section-title">${SVG_ICONS.shield} 6 Non-Negotiable Rules</h3>
                <div class="rules-grid">
                    ${rulesHtml}
                </div>
            </section>

            <section class="strategy-section">
                <h3 class="strategy-section-title">${SVG_ICONS.zap} Productivity Protocol (Every Deep Study Block)</h3>
                <div class="protocol-grid">
                    ${protocolHtml}
                </div>
            </section>

            <section class="strategy-section">
                <h3 class="strategy-section-title">${SVG_ICONS.target} Difficulty Hierarchy & Touchpoints</h3>
                <div class="ranking-grid">
                    ${rankingHtml}
                </div>
            </section>

            <section class="strategy-section">
                <h3 class="strategy-section-title">${SVG_ICONS.book} Core Textbooks & Resources</h3>
                <div class="resources-list">
                    ${resourcesHtml}
                </div>
            </section>
        </div>
    `;
}

// Populate subjects list in sidebar
function populateSubjectsList() {
    const subjectsList = document.getElementById('subjectsList');
    if (!subjectsList) return;
    let html = '';

    Object.entries(subjects).forEach(([code, info]) => {
        const color = info.color || '#667eea';
        html += `
            <div class="subject-item" style="border-left-color: ${color}" onclick="showSubjectModal('${code}')">
                <div class="subject-item-header">
                    <span class="subject-item-code">${escapeHtml(code)}</span>
                    ${info.difficulty_label ? `<span class="subject-item-diff">${escapeHtml(info.difficulty_label)}</span>` : ''}
                </div>
                <div class="subject-item-title">${escapeHtml(info.title)}</div>
            </div>
        `;
    });

    subjectsList.innerHTML = html;
}

// Show subject details in modal with complete strategy & syllabus
function showSubjectModal(subjectCode) {
    const subject = subjects[subjectCode];
    if (!subject) return;

    activeSubjectCode = subjectCode;

    const modal = document.getElementById('subjectModal');
    const color = subject.color || '#667eea';

    document.getElementById('modalTitle').innerHTML = `
        <span class="modal-subject-tag" style="background-color: ${color}; color: #fff;">${escapeHtml(subjectCode)}</span>
        <span>${escapeHtml(subject.title)}</span>
        ${subject.difficulty_label ? `<span class="modal-diff-badge">${escapeHtml(subject.difficulty_label)}</span>` : ''}
    `;

    let strategyBlock = '';
    if (subject.method || subject.mistake) {
        strategyBlock = `
            <div class="modal-strategy-box">
                ${subject.method ? `<div class="strategy-item-good"><strong>Best Method:</strong> ${escapeHtml(subject.method)}</div>` : ''}
                ${subject.mistake ? `<div class="strategy-item-bad"><strong>Common Pitfall to Avoid:</strong> ${escapeHtml(subject.mistake)}</div>` : ''}
            </div>
        `;
    }

    let resourcesBlock = '';
    if (subject.resources) {
        resourcesBlock = `
            <div class="modal-resources-box">
                <strong>Recommended Resources:</strong> ${escapeHtml(subject.resources)}
            </div>
        `;
    }

    document.getElementById('modalDescription').innerHTML = `
        <p>${escapeHtml(subject.description)}</p>
        ${strategyBlock}
        ${resourcesBlock}
    `;

    document.getElementById('modalOutline').innerHTML = subject.outline
        ? `<strong>Course Outline & Syllabus:</strong>${formatTextForDisplay(subject.outline)}`
        : '';

    // Find when this subject appears in the schedule
    let schedule = '<strong>Weekly Touchpoints:</strong><ul class="modal-schedule-list">';
    days.forEach(day => {
        const dayData = scheduleData[day];
        if (dayData) {
            if (dayData.classes && Array.isArray(dayData.classes)) {
                dayData.classes.filter(c => c.subject === subjectCode).forEach(c => {
                    schedule += `<li><strong>${day}:</strong> Class (${escapeHtml(c.time)})</li>`;
                });
            }
            if (dayData.deep_study) {
                const dsList = Array.isArray(dayData.deep_study) ? dayData.deep_study : [dayData.deep_study];
                dsList.filter(ds => ds.subject === subjectCode).forEach(ds => {
                    schedule += `<li><strong>${day}:</strong> Deep Study (${escapeHtml(ds.time)})</li>`;
                });
            }
            if (dayData.revision) {
                const revList = Array.isArray(dayData.revision) ? dayData.revision : [dayData.revision];
                revList.filter(r => r.subject === subjectCode).forEach(r => {
                    schedule += `<li><strong>${day}:</strong> Revision (${escapeHtml(r.time)})</li>`;
                });
            }
        }
    });
    schedule += '</ul>';

    document.getElementById('modalSchedule').innerHTML = schedule;
    document.getElementById('modalAiOutput').textContent = 'Use the AI button above for personalized tips and exam preparation guidance.';
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
    document.getElementById('recordDuration').value = sessionType === 'class' ? 120 : (sessionType === 'deep-study' ? 120 : 60);
    document.getElementById('recordNotes').value = '';
    document.getElementById('recordNotes').placeholder = 'What did you cover, derive from memory, or struggle with?';
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
    document.getElementById('recordNotes').placeholder = 'What did you finish or accomplish?';
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
        progressEl.innerHTML = '<p class="empty-note">No study sessions recorded yet. Start logging sessions to track your hours!</p>';
    } else {
        const topRows = progressRows.slice(0, 6);
        progressEl.innerHTML = topRows.map(row => {
            const sub = subjects[row.subject_code] || {};
            const color = sub.color || '#667eea';
            return `
            <div class="progress-item" style="border-left: 3px solid ${color}">
                <div class="progress-head">
                    <span class="progress-code">${escapeHtml(row.subject_code)}</span>
                    <span class="progress-hours">${Number(row.total_study_hours || 0).toFixed(1)}h</span>
                </div>
                <div class="progress-meta">${row.total_sessions || 0} sessions • avg ${Number(row.average_session_hours || 0).toFixed(1)}h</div>
            </div>
            `;
        }).join('');
    }

    if (weeklyData && weeklyData.summary) {
        summaryEl.innerHTML = formatTextForDisplay(weeklyData.summary);
    } else {
        const weeklyCount = weeklyData && weeklyData.weekly_stats ? weeklyData.weekly_stats.length : 0;
        summaryEl.textContent = weeklyCount > 0
            ? `Weekly statistics active for ${weeklyCount} subject(s).`
            : 'No weekly study sessions logged yet. Record a session to begin!';
    }
}

function renderRecommendations(rows) {
    const container = document.getElementById('recommendationsList');
    if (!container) return;

    if (!rows || rows.length === 0) {
        container.innerHTML = '<p class="empty-note">No pending recommendations. Keep studying consistently!</p>';
        return;
    }

    container.innerHTML = rows.map(rec => `
        <div class="recommendation-item">
            <div class="recommendation-head">
                <span class="recommendation-tag ${rec.recommendation_type}">${escapeHtml(rec.recommendation_type)}</span>
                <strong>${escapeHtml(rec.subject_code)}</strong>
            </div>
            <p class="recommendation-content">${escapeHtml(rec.content)}</p>
            <div class="recommendation-actions">
                <button class="mini-btn recommendation-ack-btn" data-id="${rec.id}" type="button">Mark Read</button>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('.recommendation-ack-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const recId = btn.dataset.id;
            const recElement = btn.closest('.recommendation-item');
            
            btn.disabled = true;
            btn.textContent = 'Marking...';
            
            try {
                await acknowledgeRecommendation(recId);
                recElement.style.opacity = '0.5';
                recElement.style.pointerEvents = 'none';
                showNotification('Recommendation marked as read', 'success');
                setTimeout(() => refreshProgressAndInsights(), 800);
            } catch (error) {
                console.error('Error marking recommendation as read:', error);
                showNotification('Failed to mark recommendation as read', 'error');
                btn.disabled = false;
                btn.textContent = 'Mark Read';
            }
        });
    });
}

function formatInlineMarkdown(text) {
    if (!text) return '';
    let res = escapeHtml(text);
    // Bold
    res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    res = res.replace(/`([^`]+)`/g, '<code>$1</code>');
    // LaTeX math symbols
    res = res.replace(/\\mathfrak\{R\}/g, 'ℝ');
    res = res.replace(/\\underline\{([A-Za-z0-9_]+)\}/g, '<span class="math-vector">$1</span>');
    res = res.replace(/\\Sigma/g, 'Σ');
    res = res.replace(/\\mu/g, 'μ');
    res = res.replace(/\\sigma/g, 'σ');
    res = res.replace(/\\alpha/g, 'α');
    res = res.replace(/\\beta/g, 'β');
    res = res.replace(/\\epsilon/g, 'ε');
    res = res.replace(/\\delta/g, 'δ');
    res = res.replace(/\\theta/g, 'θ');
    res = res.replace(/\\phi/g, 'ϕ');
    res = res.replace(/\\le/g, '≤');
    res = res.replace(/\\ge/g, '≥');
    res = res.replace(/\\neq/g, '≠');
    res = res.replace(/\\pm/g, '±');
    res = res.replace(/\\times/g, '×');
    res = res.replace(/\\div/g, '÷');
    res = res.replace(/\\to/g, '→');
    res = res.replace(/\\infty/g, '∞');
    res = res.replace(/\\partial/g, '∂');
    res = res.replace(/\\int/g, '∫');
    res = res.replace(/\\sum/g, '∑');
    res = res.replace(/\\cup/g, '∪');
    res = res.replace(/\\cap/g, '∩');
    res = res.replace(/\\subset/g, '⊂');
    res = res.replace(/\\in/g, '∈');
    res = res.replace(/\\sup/g, 'sup');
    res = res.replace(/\\inf/g, 'inf');
    res = res.replace(/\\lim/g, 'lim');
    res = res.replace(/\\sqrt\[(\w+)\]\{([^}]+)\}/g, '$1√($2)');
    res = res.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
    res = res.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
    // Math expression wrapping
    res = res.replace(/\$([^\$]+)\$/g, '<span class="math-expr">$1</span>');
    return res;
}

function formatTextForDisplay(text) {
    if (!text) return '';
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n');
    
    let html = '';
    let inTable = false;
    let tableHeader = [];
    let tableRows = [];
    let inList = false;
    let listItems = [];

    const flushList = () => {
        if (inList && listItems.length > 0) {
            html += `<ul class="modal-outline-list">${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
            listItems = [];
            inList = false;
        }
    };

    const flushTable = () => {
        if (inTable && tableHeader.length > 0) {
            html += `<div class="table-responsive"><table class="outline-table"><thead><tr>`;
            html += tableHeader.map(h => `<th>${formatInlineMarkdown(h)}</th>`).join('');
            html += `</tr></thead><tbody>`;
            tableRows.forEach(row => {
                html += `<tr>${row.map(cell => `<td>${formatInlineMarkdown(cell)}</td>`).join('')}</tr>`;
            });
            html += `</tbody></table></div>`;
            tableHeader = [];
            tableRows = [];
            inTable = false;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const trimmed = rawLine.trim();

        if (!trimmed) {
            flushList();
            flushTable();
            continue;
        }

        // Table line
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            flushList();
            const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
            // Check delimiter row
            if (cells.every(c => /^:?-+:?$/.test(c))) {
                continue;
            }
            if (!inTable) {
                inTable = true;
                tableHeader = cells;
            } else {
                tableRows.push(cells);
            }
            continue;
        } else {
            flushTable();
        }

        // Module / Lesson Headings (###)
        if (/^#{1,4}\s+/.test(trimmed)) {
            flushList();
            const headingText = trimmed.replace(/^#{1,4}\s+/, '').replace(/\*\*/g, '');
            html += `<div class="outline-module-header">
                <span class="module-indicator"></span>
                <h5>${escapeHtml(headingText)}</h5>
            </div>`;
            continue;
        }

        // Horizontal rule
        if (/^---+$/.test(trimmed)) {
            flushList();
            html += `<hr class="outline-divider" />`;
            continue;
        }

        // List item: * or - or • or 1.
        if (/^\s*([*•-]|(?:\d+\.))\s+/.test(rawLine)) {
            inList = true;
            const isSubItem = /^\s{4,}/.test(rawLine);
            const content = trimmed.replace(/^([*•-]|(?:\d+\.))\s+/, '');
            const formatted = formatInlineMarkdown(content);
            if (isSubItem) {
                listItems.push(`<div class="outline-sub-item">${formatted}</div>`);
            } else {
                listItems.push(formatted);
            }
            continue;
        } else {
            flushList();
        }

        // Normal paragraph
        html += `<p class="outline-paragraph">${formatInlineMarkdown(trimmed)}</p>`;
    }

    flushList();
    flushTable();

    return html;
}

// Render progress charts with 3rd-year subject palette
function renderCharts(progressRows) {
    if (!progressRows || progressRows.length === 0) {
        return;
    }

    const topSubjects = progressRows.slice(0, 8);
    const labels = topSubjects.map(row => row.subject_code);
    const hoursData = topSubjects.map(row => Number(row.total_study_hours || 0).toFixed(2));
    const sessionsData = topSubjects.map(row => row.total_sessions || 0);

    const chartColors = labels.map(code => {
        if (subjects[code] && subjects[code].color) {
            return subjects[code].color;
        }
        return '#10B981';
    });

    renderHoursChart(labels, hoursData, chartColors);
    renderSessionsChart(labels, sessionsData, chartColors);
}

function renderHoursChart(labels, data, colors) {
    const ctx = document.getElementById('hoursChart');
    if (!ctx) return;

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
                borderColor: colors,
                borderWidth: 0,
                borderRadius: 6
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
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    cornerRadius: 6,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' hours studied';
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
                        callback: function(val) { return val + 'h'; }
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.4)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(100, 116, 139, 0.8)',
                        font: { size: 11, weight: '600' }
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
                        padding: 10,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    cornerRadius: 6,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.parsed;
                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${value} sessions (${percent}%)`;
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

    const barColor = '#0f766e';

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
        container.innerHTML = '<p class="empty-note">No weekly insights yet. Record study sessions to receive personalized advice.</p>';
        return;
    }

    const { summary, total_recommendations, struggles, improvements, top_subjects, improvement_areas } = insights;

    let improvementList = '';
    if (improvement_areas && improvement_areas.length > 0) {
        improvementList = `
        <div class="insights-summary" style="margin-top: 1rem;">
            <strong>High-Impact Study Strategies:</strong>
            <ol style="margin-top: 0.5rem; padding-left: 1.25rem;">
                ${improvement_areas.map(area => `<li>${escapeHtml(area)}</li>`).join('')}
            </ol>
        </div>
        `;
    }

    container.innerHTML = `
        <div class="insights-stat">
            <span class="insights-stat-label">Total Insights</span>
            <span class="insights-stat-value">${total_recommendations || 0}</span>
        </div>
        <div class="insights-stat">
            <span class="insights-stat-label">Areas to Focus</span>
            <span class="insights-stat-value">${struggles || 0}</span>
        </div>
        <div class="insights-stat">
            <span class="insights-stat-label">Progress Areas</span>
            <span class="insights-stat-value">${improvements || 0}</span>
        </div>
        ${top_subjects && top_subjects.length > 0 ? `
        <div class="insights-stat">
            <span class="insights-stat-label">Most Studied</span>
            <span class="insights-stat-value">${escapeHtml(top_subjects[0])}</span>
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

// Update today's focus section dynamically
function updateTodaysFocus() {
    const todayElement = document.getElementById('todayFocus');
    if (!todayElement) return;

    const todayDay = getCurrentDayName();
    const today = scheduleData[todayDay];
    
    if (!today) {
        todayElement.innerHTML = `<p style="color: var(--text-secondary);">No sessions scheduled for ${todayDay}.</p>`;
        return;
    }

    let allEvents = [];

    if (today.classes && Array.isArray(today.classes)) {
        today.classes.forEach(cls => {
            allEvents.push({ ...cls, type: 'class' });
        });
    }

    if (today.deep_study) {
        const dsList = Array.isArray(today.deep_study) ? today.deep_study : [today.deep_study];
        dsList.forEach(ds => allEvents.push({ ...ds, type: 'deep-study' }));
    }

    if (today.revision) {
        const revList = Array.isArray(today.revision) ? today.revision : [today.revision];
        revList.forEach(r => allEvents.push({ ...r, type: 'revision' }));
    }

    // Sort chronologically
    allEvents = sortEventsByTime(allEvents);

    let html = `<div class="today-day-banner"><strong>${todayDay}</strong> — Today's Target</div>`;

    allEvents.forEach(event => {
        let icon = SVG_ICONS.book;
        let badgeClass = 'class';
        if (event.type === 'deep-study') {
            icon = SVG_ICONS.fire;
            badgeClass = 'deep-study';
        } else if (event.type === 'revision') {
            icon = SVG_ICONS.sync;
            badgeClass = 'revision';
        }

        html += `
            <div class="focus-item ${badgeClass}">
                <div class="focus-time">${icon} ${escapeHtml(event.time)}</div>
                <div class="focus-title"><strong>${escapeHtml(event.subject)}</strong> — ${escapeHtml(event.title)}</div>
            </div>
        `;
    });

    todayElement.innerHTML = html || `<p style="color: var(--text-secondary);">${todayDay}: Rest day — light consolidation.</p>`;
}

// Get current day name based on local date
function getCurrentDayName() {
    const currentDate = new Date();
    const dayIndex = currentDate.getDay(); // 0=Sunday, 1=Monday...
    const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayMap[dayIndex];
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
            showNotification(`✓ Session recorded: ${durationMinutes} minutes`, 'success');
            return data;
        } else {
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

async function getSubjectProgress(subjectCode) {
    try {
        const response = await fetch(`/api/progress/subject/${subjectCode}`);
        const progress = await response.json();
        if (response.ok) return progress;
        return null;
    } catch (error) {
        console.error('Error fetching progress:', error);
        return null;
    }
}

async function getAllProgress() {
    try {
        const response = await fetch('/api/progress/all');
        const progress = await response.json();
        if (response.ok) return progress;
        return [];
    } catch (error) {
        console.error('Error fetching progress:', error);
        return [];
    }
}

async function getWeeklyProgress() {
    try {
        const response = await fetch('/api/progress/weekly');
        const data = await response.json();
        if (response.ok) return data;
        return { weekly_stats: [], summary: '' };
    } catch (error) {
        console.error('Error fetching weekly progress:', error);
        return { weekly_stats: [], summary: '' };
    }
}

async function getRecommendations() {
    try {
        const response = await fetch('/api/ai/recommendations');
        const recommendations = await response.json();
        if (response.ok) return recommendations;
        return [];
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }
}

async function getStudyTips(subjectCode) {
    try {
        const response = await fetch(`/api/ai/tips/${subjectCode}`);
        const data = await response.json();
        if (response.ok) return data.tips;
        return [];
    } catch (error) {
        console.error('Error fetching study tips:', error);
        return [];
    }
}

async function getWeeklyInsights() {
    try {
        const response = await fetch('/api/ai/weekly-insights');
        const data = await response.json();
        if (response.ok) return data.insights;
        return null;
    } catch (error) {
        console.error('Error fetching weekly insights:', error);
        return null;
    }
}

async function acknowledgeRecommendation(recId) {
    try {
        await fetch(`/api/ai/acknowledge/${recId}`, { method: 'POST' });
    } catch (error) {
        console.error('Error acknowledging recommendation:', error);
    }
}

async function acknowledgeAllRecommendations() {
    try {
        const response = await fetch('/api/ai/acknowledge-all', { method: 'POST' });
        const data = await response.json();
        if (response.ok) return data.updated || 0;
        return 0;
    } catch (error) {
        console.error('Error acknowledging all recommendations:', error);
        return 0;
    }
}

// Show notification popup
function showNotification(message, type = 'info') {
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
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

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

// ==================== FOCUS TIMER LOGIC ====================
let timerDurationMinutes = 120;
let timerSecondsRemaining = 120 * 60;
let timerInterval = null;
let timerIsRunning = false;

function initTimer() {
    const timerDisplay = document.getElementById('timerDisplay');
    const timerProgress = document.getElementById('timerProgressFill');
    const startBtn = document.getElementById('timerStartBtn');
    const resetBtn = document.getElementById('timerResetBtn');
    const logBtn = document.getElementById('timerLogBtn');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const modeBadge = document.getElementById('timerModeBadge');

    if (!timerDisplay) return;

    function updateTimerUI() {
        const mins = Math.floor(timerSecondsRemaining / 60);
        const secs = timerSecondsRemaining % 60;
        timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        
        const totalSecs = timerDurationMinutes * 60;
        const progressPct = totalSecs > 0 ? (timerSecondsRemaining / totalSecs) * 100 : 0;
        if (timerProgress) {
            timerProgress.style.width = `${progressPct}%`;
        }
    }

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (timerIsRunning) {
                clearInterval(timerInterval);
                timerIsRunning = false;
                if (startBtn) {
                    startBtn.classList.remove('running');
                    startBtn.textContent = 'Start Focus';
                }
            }
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            timerDurationMinutes = parseInt(btn.dataset.mins, 10) || 60;
            timerSecondsRemaining = timerDurationMinutes * 60;
            
            if (modeBadge) {
                if (timerDurationMinutes >= 120) modeBadge.textContent = 'Deep Study';
                else if (timerDurationMinutes >= 60) modeBadge.textContent = 'Revision';
                else if (timerDurationMinutes >= 30) modeBadge.textContent = 'Drill Block';
                else modeBadge.textContent = 'Pomodoro';
            }
            updateTimerUI();
        });
    });

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!timerIsRunning) {
                timerIsRunning = true;
                startBtn.classList.add('running');
                startBtn.textContent = 'Pause';
                
                timerInterval = setInterval(() => {
                    if (timerSecondsRemaining > 0) {
                        timerSecondsRemaining--;
                        updateTimerUI();
                    } else {
                        clearInterval(timerInterval);
                        timerIsRunning = false;
                        startBtn.classList.remove('running');
                        startBtn.textContent = 'Completed!';
                        showNotification('Focus study block completed! Great work.', 'success');
                    }
                }, 1000);
            } else {
                clearInterval(timerInterval);
                timerIsRunning = false;
                startBtn.classList.remove('running');
                startBtn.textContent = 'Resume Focus';
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (timerInterval) clearInterval(timerInterval);
            timerIsRunning = false;
            timerSecondsRemaining = timerDurationMinutes * 60;
            if (startBtn) {
                startBtn.classList.remove('running');
                startBtn.textContent = 'Start Focus';
            }
            updateTimerUI();
        });
    }

    if (logBtn) {
        logBtn.addEventListener('click', () => {
            const timeElapsedMins = Math.max(10, Math.round((timerDurationMinutes * 60 - timerSecondsRemaining) / 60));
            openRecordModal({
                subject_code: 'SMA300',
                session_type: timerDurationMinutes >= 120 ? 'deep-study' : 'revision',
                duration_minutes: timeElapsedMins > 0 ? timeElapsedMins : timerDurationMinutes,
                notes: `Completed ${timeElapsedMins || timerDurationMinutes}-minute study focus block.`
            });
        });
    }

    updateTimerUI();
}

// ==================== MOBILE NAVIGATION BAR ====================
function initMobileNavBar() {
    const mobileBtns = document.querySelectorAll('.mobile-nav-btn');
    if (!mobileBtns || mobileBtns.length === 0) return;

    mobileBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            mobileBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetView = btn.dataset.target;
            
            document.body.setAttribute('data-mobile-view', targetView);
            
            if (targetView === 'strategy') {
                displayDay('Strategy');
                document.querySelectorAll('.tab-btn').forEach(b => {
                    if (b.dataset.day === 'Strategy') b.classList.add('active');
                    else b.classList.remove('active');
                });
            } else if (targetView === 'schedule') {
                const curDay = getCurrentDayName() || 'Monday';
                displayDay(curDay);
                document.querySelectorAll('.tab-btn').forEach(b => {
                    if (b.dataset.day === curDay) b.classList.add('active');
                    else b.classList.remove('active');
                });
            }
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ==================== KEYBOARD SHORTCUTS ====================
function initKeyboardShortcuts() {
    const dayKeys = {
        '1': 'Monday',
        '2': 'Tuesday',
        '3': 'Wednesday',
        '4': 'Thursday',
        '5': 'Friday',
        '6': 'Saturday',
        '7': 'Sunday'
    };

    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in an input or textarea
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            return;
        }

        if (dayKeys[e.key]) {
            const selectedDay = dayKeys[e.key];
            document.querySelectorAll('.tab-btn').forEach(b => {
                if (b.dataset.day === selectedDay) b.classList.add('active');
                else b.classList.remove('active');
            });
            displayDay(selectedDay);
        } else if (e.key.toLowerCase() === 's') {
            document.querySelectorAll('.tab-btn').forEach(b => {
                if (b.dataset.day === 'Strategy') b.classList.add('active');
                else b.classList.remove('active');
            });
            displayDay('Strategy');
        } else if (e.key.toLowerCase() === 't') {
            const today = getCurrentDayName() || 'Monday';
            document.querySelectorAll('.tab-btn').forEach(b => {
                if (b.dataset.day === today) b.classList.add('active');
                else b.classList.remove('active');
            });
            displayDay(today);
            showNotification(`Jumped to Today (${today})`, 'info');
        } else if (e.key.toLowerCase() === 'd') {
            toggleTheme();
        } else if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal.active');
            activeModals.forEach(m => m.classList.remove('active'));
        }
    });
}
