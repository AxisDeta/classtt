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
    initViewNavigation();
    initKeyboardShortcuts();
    
    const currentDay = getCurrentDayName() || 'Monday';
    // Highlight active and today day pills
    document.querySelectorAll('.day-pill-btn').forEach(b => {
        if (b.dataset.day === currentDay) {
            b.classList.add('active');
            b.classList.add('today-pill');
        } else {
            b.classList.remove('active');
        }
    });
    displayDay(currentDay);
    populateSubjectsList();
    updateTodaysFocus();
    await refreshProgressAndInsights();
    loadDueReviews();
    loadAttentionTopics();
    loadMilestones();
    initSubjectModalTabs();
    initNotesModule();
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
            if (!activeSubjectCode) {
                showNotification('Please select a subject first.', 'info');
                return;
            }
            const output = document.getElementById('modalAiOutput');
            if (!output) return;

            const originalHtml = subjectTipsBtn.innerHTML;
            subjectTipsBtn.disabled = true;
            subjectTipsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Tips...';

            output.innerHTML = '<div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.85rem;"><i class="fas fa-spinner fa-spin"></i> Analyzing syllabus & generating high-yield study tips...</div>';

            try {
                const res = await getStudyTips(activeSubjectCode);
                if (res.ok && res.tips && res.tips.length > 0) {
                    output.innerHTML = `<strong>AI Subject Guidance:</strong><ul class="modal-tips-list">${res.tips.map(t => `<li>${formatInlineMarkdown(t)}</li>`).join('')}</ul>`;
                    renderMath(output);
                } else if (res.status === 401) {
                    output.innerHTML = '<div style="color: var(--danger); font-size: 0.85rem;"><i class="fas fa-lock"></i> Session expired. <a href="/login" style="text-decoration: underline; font-weight: 600; color: inherit;">Please log in again</a> to generate AI tips.</div>';
                } else {
                    const errMsg = res.error || 'No tips available right now.';
                    output.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;"><i class="fas fa-exclamation-circle"></i> ${escapeHtml(errMsg)} <button type="button" class="btn btn-sm btn-outline" style="margin-left: 8px; padding: 2px 8px; font-size: 0.75rem;" onclick="document.getElementById('subjectTipsBtn').click()">Retry</button></div>`;
                }
            } catch (err) {
                console.error('Failed to get tips:', err);
                output.innerHTML = '<div style="color: var(--danger); font-size: 0.85rem;"><i class="fas fa-exclamation-triangle"></i> Network error fetching tips. Please try again.</div>';
            } finally {
                subjectTipsBtn.disabled = false;
                subjectTipsBtn.innerHTML = originalHtml;
            }
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

    // Spaced review checkbox toggle in record modal
    const flagCheck = document.getElementById('recordFlagReview');
    const struggledWrap = document.getElementById('recordStruggledTopicWrap');
    if (flagCheck && struggledWrap) {
        flagCheck.addEventListener('change', () => {
            if (flagCheck.checked) {
                struggledWrap.classList.remove('hidden');
                const inp = document.getElementById('recordStruggledTopic');
                if (inp) inp.focus();
            } else {
                struggledWrap.classList.add('hidden');
            }
        });
    }

    // Print 1-page weekly battle plan
    const printBtn = document.getElementById('printBattlePlanBtn');
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    // Subject Grill Me button in subject modal
    const subjectGrillBtn = document.getElementById('subjectGrillBtn');
    if (subjectGrillBtn) {
        subjectGrillBtn.addEventListener('click', () => {
            if (!activeSubjectCode) {
                showNotification('Please select a subject first', 'info');
                return;
            }
            openGrillModal(activeSubjectCode);
        });
    }

    // Grill Modal events
    const grillModal = document.getElementById('grillModal');
    const grillModalClose = document.getElementById('grillModalClose');
    if (grillModalClose && grillModal) {
        grillModalClose.addEventListener('click', () => {
            grillModal.classList.remove('active');
        });
        grillModal.addEventListener('click', (e) => {
            if (e.target === grillModal) grillModal.classList.remove('active');
        });
    }

    const grillHintBtn = document.getElementById('grillHintBtn');
    const grillHintText = document.getElementById('grillHintText');
    if (grillHintBtn && grillHintText) {
        grillHintBtn.addEventListener('click', () => {
            grillHintText.classList.toggle('hidden');
        });
    }

    const grillNewQuestionBtn = document.getElementById('grillNewQuestionBtn');
    if (grillNewQuestionBtn) {
        grillNewQuestionBtn.addEventListener('click', () => {
            if (activeSubjectCode) {
                fetchGrillQuestion(activeSubjectCode, currentGrillTopic);
            }
        });
    }

    const grillAnswerForm = document.getElementById('grillAnswerForm');
    if (grillAnswerForm) {
        grillAnswerForm.addEventListener('submit', handleGrillAnswerSubmit);
    }

    const evalScheduleReviewBtn = document.getElementById('evalScheduleReviewBtn');
    if (evalScheduleReviewBtn) {
        evalScheduleReviewBtn.addEventListener('click', async () => {
            if (!activeSubjectCode) return;
            evalScheduleReviewBtn.disabled = true;
            evalScheduleReviewBtn.textContent = 'Scheduling...';
            try {
                const res = await fetch('/api/reviews/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject_code: activeSubjectCode,
                        topic: currentGrillTopic || (currentGrillQuestion ? currentGrillQuestion.substring(0, 60) + '...' : 'Proof Derivation Practice'),
                        interval_days: 3
                    })
                });
                if (res.ok) {
                    showNotification('Added to 3-day spaced recall queue!', 'success');
                    evalScheduleReviewBtn.innerHTML = '<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align: -2px; margin-right: 4px; color: var(--success);\"><polyline points=\"20 6 9 17 4 12\"></polyline></svg>Scheduled for Recall';
                    loadDueReviews();
                } else {
                    showNotification('Failed to schedule review', 'error');
                    evalScheduleReviewBtn.disabled = false;
                    evalScheduleReviewBtn.innerHTML = '<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align: -2px; margin-right: 4px;\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect><line x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"></line><line x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"></line><line x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"></line></svg>Add to Spaced Review Queue';
                }
            } catch (err) {
                showNotification('Network error scheduling review', 'error');
                evalScheduleReviewBtn.disabled = false;
                evalScheduleReviewBtn.innerHTML = '<svg width=\"13\" height=\"13\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"vertical-align: -2px; margin-right: 4px;\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect><line x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"></line><line x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"></line><line x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"></line></svg>Add to Spaced Review Queue';
            }
        });
    }

    // Milestones Modal & Form
    const milestoneModal = document.getElementById('milestoneModal');
    const milestoneModalClose = document.getElementById('milestoneModalClose');
    const addMilestoneBtn = document.getElementById('addMilestoneBtn');
    const milestoneForm = document.getElementById('milestoneForm');

    if (addMilestoneBtn && milestoneModal) {
        addMilestoneBtn.addEventListener('click', () => {
            milestoneModal.classList.add('active');
            const dateInput = document.getElementById('milestoneDate');
            if (dateInput && !dateInput.value) {
                const future = new Date();
                future.setDate(future.getDate() + 21);
                dateInput.value = future.toISOString().split('T')[0];
            }
        });
    }

    if (milestoneModalClose && milestoneModal) {
        milestoneModalClose.addEventListener('click', () => {
            milestoneModal.classList.remove('active');
        });
        milestoneModal.addEventListener('click', (e) => {
            if (e.target === milestoneModal) milestoneModal.classList.remove('active');
        });
    }

    if (milestoneForm) {
        milestoneForm.addEventListener('submit', handleMilestoneSubmit);
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

// Display schedule for a specific day
function displayDay(day) {
    const dayContent = document.getElementById('dayContent');
    if (!dayContent) return;

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
    loadSubjectTopics(subjectCode);
    switchModalTab('syllabus');
    loadSubjectNotes(subjectCode, false);
    modal.classList.add('active');
    renderMath(modal);
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
    const flagCheck = document.getElementById('recordFlagReview');
    const wrap = document.getElementById('recordStruggledTopicWrap');
    const topicInput = document.getElementById('recordStruggledTopic');
    if (flagCheck) flagCheck.checked = false;
    if (wrap) wrap.classList.add('hidden');
    if (topicInput) topicInput.value = '';
    const reviewToggleWrap = document.querySelector('.form-review-toggle-wrap');
    if (reviewToggleWrap) reviewToggleWrap.style.display = 'block';

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
    const reviewToggleWrap = document.querySelector('.form-review-toggle-wrap');
    if (reviewToggleWrap) reviewToggleWrap.style.display = 'none';

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
    const flagCheck = document.getElementById('recordFlagReview');
    const topicInput = document.getElementById('recordStruggledTopic');
    const flagForReview = flagCheck ? flagCheck.checked : false;
    const struggledTopic = topicInput ? topicInput.value.trim() : '';

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
            : await recordStudyProgress(subjectCode, sessionType, durationMinutes, notes, flagForReview, struggledTopic);
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
    await loadMilestones();
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
    // Normalize excessive backslashes
    let clean = text.replace(/\\\\([a-zA-Z\(\)\[\]\{\}])/g, '\\$1');

    // Auto-repair unclosed inline math \( ... without \)
    const openMatches = (clean.match(/\\\(/g) || []).length;
    const closeMatches = (clean.match(/\\\)/g) || []).length;
    if (openMatches > closeMatches) {
        let diff = openMatches - closeMatches;
        if (clean.endsWith('\\')) clean = clean.slice(0, -1).trimEnd();
        const bOpen = (clean.match(/\{/g) || []).length;
        const bClose = (clean.match(/\}/g) || []).length;
        if (bOpen > bClose) clean += '}'.repeat(bOpen - bClose);
        clean += '\\)'.repeat(diff);
    }

    // Protect inline math: \( ... \) or $ ... $
    const inlineMath = [];
    let sanitized = clean.replace(/\\\(([\s\S]*?)\\\)/g, (match) => {
        const id = `__INLINE_MATH_${inlineMath.length}__`;
        inlineMath.push(match);
        return id;
    });
    sanitized = sanitized.replace(/(?<!\$)\$([^\$\n]+?)\$(?!\$)/g, (match) => {
        const id = `__INLINE_MATH_${inlineMath.length}__`;
        inlineMath.push(match);
        return id;
    });

    // Escape prose for HTML safety
    let res = escapeHtml(sanitized);

    // Standard markdown
    res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    res = res.replace(/\*(.*?)\*/g, '<em>$1</em>');
    res = res.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Restore inline math expressions verbatim
    inlineMath.forEach((math, idx) => {
        res = res.replace(`__INLINE_MATH_${idx}__`, math);
    });

    return res;
}

// ==================== MATHEMATICAL TYPOGRAPHY & KATEX ====================

function renderMath(element) {
    if (!element) return;

    const katexDelimiters = [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false }
    ];

    if (typeof renderMathInElement === 'function') {
        try {
            renderMathInElement(element, {
                delimiters: katexDelimiters,
                throwOnError: false,
                ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
            });
            return;
        } catch (err) {
            console.warn('KaTeX auto-render error:', err);
        }
    }

    // If KaTeX script is still loading asynchronously from CDN, schedule retry
    if (typeof renderMathInElement !== 'function' && typeof window !== 'undefined') {
        setTimeout(() => {
            if (typeof renderMathInElement === 'function') {
                try {
                    renderMathInElement(element, {
                        delimiters: katexDelimiters,
                        throwOnError: false,
                        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
                    });
                } catch (e) {}
            }
        }, 300);
    }
}

function formatTextForDisplay(text) {
    if (!text) return '';
    // Normalize excessive backslashes
    let clean = text.replace(/\\\\([a-zA-Z\(\)\[\]\{\}])/g, '\\$1');

    // Auto-repair unclosed display math \[ ... without \]
    const dispOpenMatches = (clean.match(/\\\[/g) || []).length;
    const dispCloseMatches = (clean.match(/\\\]/g) || []).length;
    if (dispOpenMatches > dispCloseMatches) {
        let diff = dispOpenMatches - dispCloseMatches;
        if (clean.endsWith('\\')) clean = clean.slice(0, -1).trimEnd();
        const bOpen = (clean.match(/\{/g) || []).length;
        const bClose = (clean.match(/\}/g) || []).length;
        if (bOpen > bClose) clean += '}'.repeat(bOpen - bClose);
        clean += '\\]'.repeat(diff);
    }

    // Protect display math blocks: \[ ... \] or $$ ... $$ across newlines
    const displayMath = [];
    clean = clean.replace(/\\\[([\s\S]*?)\\\]/g, (match) => {
        const id = `__DISPLAY_MATH_${displayMath.length}__`;
        displayMath.push(match);
        return `\n\n${id}\n\n`;
    });
    clean = clean.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
        const id = `__DISPLAY_MATH_${displayMath.length}__`;
        displayMath.push(match);
        return `\n\n${id}\n\n`;
    });

    const normalized = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
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

        // Check for display math placeholder
        const dispMatch = trimmed.match(/^__DISPLAY_MATH_(\d+)__$/);
        if (dispMatch) {
            flushList();
            flushTable();
            const mathBlock = displayMath[parseInt(dispMatch[1])];
            html += `<div class="math-display-block">${mathBlock}</div>`;
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

// High-contrast, distinct palette guaranteeing no two subjects share colors
const DISTINCT_CHART_PALETTE = [
    '#10B981', // Emerald Green (SMA300)
    '#F97316', // Vibrant Orange (SST205)
    '#EF4444', // Crimson Red (SST305)
    '#14B8A6', // Modern Teal (SMA203)
    '#3B82F6', // Royal Blue (SMA335)
    '#F59E0B', // Amber (SMA330)
    '#8B5CF6', // Violet (SST304)
    '#06B6D4', // Cyan (SST301)
    '#EC4899', // Rose Pink (SST101)
    '#6366F1', // Indigo (SMA201)
    '#D946EF', // Fuchsia (SST201)
    '#84CC16', // Lime
    '#0EA5E9'  // Sky Blue
];

// Render progress charts with guaranteed distinct subject palette
function renderCharts(progressRows) {
    if (!progressRows || progressRows.length === 0) {
        return;
    }

    const topSubjects = progressRows.slice(0, 8);
    const labels = topSubjects.map(row => row.subject_code);
    const hoursData = topSubjects.map(row => Number(row.total_study_hours || 0).toFixed(2));
    const sessionsData = topSubjects.map(row => row.total_sessions || 0);

    const usedColors = new Set();
    const chartColors = labels.map((code, index) => {
        const assigned = subjects[code] && subjects[code].color ? subjects[code].color : null;
        if (assigned && !usedColors.has(assigned.toLowerCase())) {
            usedColors.add(assigned.toLowerCase());
            return assigned;
        }
        const fallback = DISTINCT_CHART_PALETTE.find(c => !usedColors.has(c.toLowerCase()));
        if (fallback) {
            usedColors.add(fallback.toLowerCase());
            return fallback;
        }
        const cycleColor = DISTINCT_CHART_PALETTE[index % DISTINCT_CHART_PALETTE.length];
        usedColors.add(cycleColor.toLowerCase());
        return cycleColor;
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

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

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
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 12,
                    titleFont: { size: 13, weight: 'bold' },
                    bodyFont: { size: 12 },
                    cornerRadius: 6,
                    displayColors: true,
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
                        color: isDark ? 'rgba(148, 163, 184, 0.85)' : 'rgba(100, 116, 139, 0.75)',
                        font: { size: 11 },
                        callback: function(val) { return val + 'h'; }
                    },
                    grid: {
                        color: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.4)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: isDark ? 'rgba(226, 232, 240, 0.9)' : 'rgba(51, 65, 85, 0.9)',
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

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const borderColor = isDark ? '#1e293b' : '#ffffff';

    sessionsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: borderColor,
                borderWidth: 2,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 11, weight: '600' },
                        color: isDark ? 'rgba(226, 232, 240, 0.85)' : 'rgba(71, 85, 105, 0.9)',
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
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

// Update today's focus section dynamically for both mini sidebar and full Today view
function updateTodaysFocus() {
    const miniEl = document.getElementById('todayFocusMini');
    const fullEl = document.getElementById('todayFocusFull');
    if (!miniEl && !fullEl) return;

    const todayDay = getCurrentDayName();
    const today = scheduleData[todayDay];

    if (!today) {
        const emptyMsg = `<p style="color: var(--text-secondary); padding: 0.5rem 0;">No sessions scheduled for today (${todayDay}).</p>`;
        if (miniEl) miniEl.innerHTML = emptyMsg;
        if (fullEl) fullEl.innerHTML = emptyMsg;
        return;
    }

    let allEvents = [];

    if (today.classes && Array.isArray(today.classes)) {
        today.classes.forEach(cls => allEvents.push({ ...cls, type: 'class' }));
    }

    if (today.deep_study) {
        const dsList = Array.isArray(today.deep_study) ? today.deep_study : [today.deep_study];
        dsList.forEach(ds => allEvents.push({ ...ds, type: 'deep-study' }));
    }

    if (today.revision) {
        const revList = Array.isArray(today.revision) ? today.revision : [today.revision];
        revList.forEach(r => allEvents.push({ ...r, type: 'revision' }));
    }

    allEvents = sortEventsByTime(allEvents);

    // 1. Mini sidebar version
    if (miniEl) {
        let miniHtml = `<div class="today-day-banner"><strong>${todayDay}</strong></div>`;
        if (allEvents.length === 0) {
            miniHtml += `<p class="empty-note">Rest day — light review.</p>`;
        } else {
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
                miniHtml += `
                    <div class="focus-item ${badgeClass}">
                        <div class="focus-time">${icon} ${escapeHtml(event.time)}</div>
                        <div class="focus-title"><strong>${escapeHtml(event.subject)}</strong> — ${escapeHtml(event.title)}</div>
                    </div>
                `;
            });
        }
        miniEl.innerHTML = miniHtml;
    }

    // 2. Full Dedicated Today View version
    if (fullEl) {
        if (allEvents.length === 0) {
            fullEl.innerHTML = `
                <div class="empty-state">
                    ${SVG_ICONS.emptyCalendar}
                    <p>No study sessions scheduled for today (${todayDay}). Enjoy your rest or do light consolidation.</p>
                </div>
            `;
        } else {
            let fullHtml = `<div class="today-cards-grid">`;
            allEvents.forEach(event => {
                fullHtml += createEventCard(event, event.type);
            });
            fullHtml += `</div>`;
            fullEl.innerHTML = fullHtml;

            // Bind click listeners in full view
            fullEl.querySelectorAll('.event-card').forEach(card => {
                card.addEventListener('click', () => {
                    const subject = card.dataset.subject;
                    if (subject && subject !== 'Weekly Reflection' && subject !== 'Optional Light Revision') {
                        showSubjectModal(subject);
                    }
                });
            });

            fullEl.querySelectorAll('.record-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openRecordModal(btn.dataset.subject, btn.dataset.type, btn.dataset.time);
                });
            });
        }
    }

    loadDueReviews();
    loadAttentionTopics();
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
async function recordStudyProgress(subjectCode, sessionType, durationMinutes, notes = '', flagForReview = false, struggledTopic = '') {
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
                notes: notes,
                flag_for_review: flagForReview ? 1 : 0,
                struggled_topic: struggledTopic
            })
        });

        let data = null;
        try {
            data = await response.json();
        } catch (parseError) {
            data = { error: 'Non-JSON response from server' };
        }
        
        if (response.ok) {
            showNotification(`Session recorded: ${durationMinutes} minutes`, 'success');
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
        const response = await fetch(`/api/ai/tips/${encodeURIComponent(subjectCode)}`);
        const data = await response.json();
        if (response.ok && data.tips && Array.isArray(data.tips) && data.tips.length > 0) {
            return { ok: true, tips: data.tips, status: response.status };
        }
        return { 
            ok: false, 
            status: response.status, 
            error: data.error || (response.ok ? 'No tips returned' : `Server responded with status ${response.status}`),
            tips: [] 
        };
    } catch (error) {
        console.error('Error fetching study tips:', error);
        return { ok: false, status: 0, error: 'Network error fetching study tips', tips: [] };
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


// ==================== UNIFIED VIEW SWITCHING (PC & MOBILE) ====================
let currentActiveView = 'schedule';

function switchView(viewName) {
    currentActiveView = viewName;

    // Update nav menu buttons on PC and Mobile
    document.querySelectorAll('.nav-menu-btn').forEach(btn => {
        if (btn.dataset.view === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        if (btn.dataset.target === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Toggle view containers
    const views = {
        'schedule': document.getElementById('viewSchedule'),
        'today': document.getElementById('viewToday'),
        'timer': document.getElementById('viewTimer'),
        'overview': document.getElementById('viewOverview'),
        'strategy': document.getElementById('viewStrategy'),
        'freetasks': document.getElementById('viewFreeTasks')
    };

    Object.entries(views).forEach(([v, el]) => {
        if (el) {
            if (v === viewName) {
                el.classList.remove('hidden');
                el.classList.add('active');
            } else {
                el.classList.add('hidden');
                el.classList.remove('active');
            }
        }
    });

    // Toggle day pills bar (only relevant for Schedule view)
    const dayPillsBar = document.getElementById('dayPillsBar');
    if (dayPillsBar) {
        if (viewName === 'schedule') {
            dayPillsBar.classList.remove('hidden');
        } else {
            dayPillsBar.classList.add('hidden');
        }
    }

    // Trigger view-specific renderers
    if (viewName === 'today') {
        updateTodaysFocus();
    } else if (viewName === 'overview') {
        refreshProgressAndInsights();
    } else if (viewName === 'strategy') {
        renderStrategyView();
    } else if (viewName === 'freetasks') {
        renderFreeTasks();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initViewNavigation() {
    // Primary PC Menu buttons
    document.querySelectorAll('.nav-menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.dataset.view;
            if (targetView) switchView(targetView);
        });
    });

    // Mobile Navigation buttons
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.dataset.target;
            if (targetView) switchView(targetView);
        });
    });

    // Day Pill buttons (Mon - Sun)
    document.querySelectorAll('.day-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.day-pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const day = btn.dataset.day;
            displayDay(day);
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
            switchView('schedule');
            document.querySelectorAll('.day-pill-btn').forEach(b => {
                if (b.dataset.day === selectedDay) b.classList.add('active');
                else b.classList.remove('active');
            });
            displayDay(selectedDay);
        } else if (e.key.toLowerCase() === 's') {
            switchView('strategy');
        } else if (e.key.toLowerCase() === 't') {
            switchView('today');
        } else if (e.key.toLowerCase() === 'd') {
            toggleTheme();
        } else if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal.active');
            activeModals.forEach(m => m.classList.remove('active'));
            closeLightbox();
        }
    });
}


// ==================== TOPIC MASTERY & WEAKNESS HEATMAP ====================

async function loadSubjectTopics(subjectCode) {
    const listEl = document.getElementById('modalTopicsList');
    const countEl = document.getElementById('modalMasteryCount');
    const fillEl = document.getElementById('modalMasteryFill');
    if (!listEl) return;

    listEl.innerHTML = '<div class="topic-loading" style="padding: 12px 0; color: var(--text-secondary); font-size: 0.85rem;"><i class="fas fa-spinner fa-spin"></i> Loading syllabus topics...</div>';
    try {
        const res = await fetch(`/api/topics/${subjectCode}`);
        const data = await res.json();
        if (data.ok && data.topics && data.topics.length > 0) {
            renderTopicMasteryList(subjectCode, data.topics);
        } else {
            listEl.innerHTML = '<div class="topic-empty-note" style="padding: 10px 0; color: var(--text-secondary); font-size: 0.85rem;">No syllabus subtopics loaded for this subject.</div>';
            if (countEl) countEl.textContent = '0/0 Mastered';
            if (fillEl) fillEl.style.width = '0%';
        }
    } catch (err) {
        console.error('Failed to load subject topics:', err);
        listEl.innerHTML = '<div class="topic-error-note" style="color: var(--danger); font-size: 0.85rem;">Failed to load syllabus topics.</div>';
    }
}

function renderTopicMasteryList(subjectCode, topics) {
    const listEl = document.getElementById('modalTopicsList');
    if (!listEl) return;

    listEl.innerHTML = '';

    topics.forEach(t => {
        const item = document.createElement('div');
        item.className = 'topic-mastery-item';
        item.dataset.topicId = t.id;

        item.innerHTML = `
            <div class="topic-main-info">
                <div class="topic-title-row">
                    <span class="topic-title">${escapeHtml(t.title)}</span>
                    <button type="button" class="topic-drill-btn" title="Proof drill on this topic"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>Drill</button>
                </div>
                ${t.description ? `<div class="topic-desc">${formatInlineMarkdown(t.description)}</div>` : ''}
            </div>
            <div class="topic-status-pills">
                <button type="button" class="status-pill-btn pill-needs-work ${t.status === 'needs-work' ? 'active' : ''}" data-status="needs-work" title="Mark as Needs Work">Needs Work</button>
                <button type="button" class="status-pill-btn pill-reviewing ${t.status === 'reviewing' ? 'active' : ''}" data-status="reviewing" title="Mark as Reviewing">Reviewing</button>
                <button type="button" class="status-pill-btn pill-mastered ${t.status === 'mastered' ? 'active' : ''}" data-status="mastered" title="Mark as Mastered">Mastered</button>
            </div>
        `;

        // Pill clicks
        item.querySelectorAll('.status-pill-btn').forEach(pill => {
            pill.addEventListener('click', async (e) => {
                e.stopPropagation();
                const newStatus = pill.dataset.status;
                const ok = await updateTopicStatus(subjectCode, t.id, newStatus);
                if (ok) {
                    item.querySelectorAll('.status-pill-btn').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    t.status = newStatus;
                    updateMasteryStats(topics);
                    loadAttentionTopics();
                }
            });
        });

        // Drill button
        const drillBtn = item.querySelector('.topic-drill-btn');
        if (drillBtn) {
            drillBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openGrillModal(subjectCode, t.title);
            });
        }

        listEl.appendChild(item);
    });

    updateMasteryStats(topics);
    renderMath(listEl);
}

function updateMasteryStats(topics) {
    const countEl = document.getElementById('modalMasteryCount');
    const fillEl = document.getElementById('modalMasteryFill');
    if (!countEl || !fillEl) return;

    const total = topics.length;
    const mastered = topics.filter(t => t.status === 'mastered').length;
    const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
    countEl.textContent = `${mastered}/${total} Mastered (${pct}%)`;
    fillEl.style.width = `${pct}%`;
}

async function updateTopicStatus(subjectCode, topicId, status) {
    try {
        const res = await fetch(`/api/topics/${subjectCode}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic_id: topicId, status: status })
        });
        const data = await res.json();
        if (res.ok) {
            showNotification(`Topic marked as ${status.replace('-', ' ')}`, 'success');
            return true;
        } else {
            showNotification(data.error || 'Failed to update topic status', 'error');
            return false;
        }
    } catch (err) {
        console.error('Error updating topic status:', err);
        showNotification('Network error updating topic', 'error');
        return false;
    }
}

// ==================== SPACED REPETITION REVIEW QUEUE ====================

async function loadDueReviews() {
    const card = document.getElementById('todayReviewsCard');
    const list = document.getElementById('todayReviewsList');
    const badge = document.getElementById('reviewsCountBadge');
    if (!card || !list) return;

    try {
        const res = await fetch('/api/reviews/due');
        const data = await res.json();
        if (res.ok && data.reviews && data.reviews.length > 0) {
            card.classList.remove('hidden');
            if (badge) badge.textContent = data.reviews.length;
            list.innerHTML = '';

            data.reviews.forEach(rev => {
                const item = document.createElement('div');
                item.className = 'review-queue-item';
                const subj = subjects[rev.subject_code] || { color: '#667eea', title: rev.subject_code };
                item.innerHTML = `
                    <div class="review-queue-info">
                        <div class="review-queue-header">
                            <span class="subject-tag-badge" style="background-color: ${subj.color || '#667eea'};">${escapeHtml(rev.subject_code)}</span>
                            <span class="review-interval-pill">${rev.interval_days}d Recall</span>
                            ${rev.due_label ? `<span class="review-due-tag ${rev.is_overdue ? 'overdue' : ''}">${escapeHtml(rev.due_label)}</span>` : ''}
                        </div>
                        <div class="review-queue-topic"><strong>${escapeHtml(rev.topic)}</strong></div>
                    </div>
                    <div class="review-queue-actions">
                        <button type="button" class="btn btn-sm btn-outline review-grill-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>Proof Drill</button>
                        <button type="button" class="btn btn-sm btn-primary review-done-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>Complete</button>
                    </div>
                `;

                // Done button
                item.querySelector('.review-done-btn').addEventListener('click', async () => {
                    const ok = await completeReviewItem(rev.id);
                    if (ok) {
                        item.style.opacity = '0.4';
                        item.style.pointerEvents = 'none';
                        setTimeout(() => loadDueReviews(), 500);
                    }
                });

                // Grill Me button
                item.querySelector('.review-grill-btn').addEventListener('click', () => {
                    openGrillModal(rev.subject_code, rev.topic);
                });

                list.appendChild(item);
            });
        } else {
            card.classList.add('hidden');
        }
    } catch (err) {
        console.error('Failed to load due reviews:', err);
        card.classList.add('hidden');
    }
}

async function completeReviewItem(reviewId) {
    try {
        const res = await fetch(`/api/reviews/${reviewId}/complete`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showNotification('Spaced review completed!', 'success');
            return true;
        } else {
            showNotification(data.error || 'Failed to complete review', 'error');
            return false;
        }
    } catch (err) {
        console.error('Error completing review:', err);
        showNotification('Network error completing review', 'error');
        return false;
    }
}

// ==================== WEAK TOPICS ATTENTION ====================

async function loadAttentionTopics() {
    const card = document.getElementById('todayAttentionCard');
    const list = document.getElementById('todayAttentionList');
    if (!card || !list) return;

    try {
        const res = await fetch('/api/topics/attention-needed');
        const data = await res.json();
        if (res.ok && data.attention && data.attention.length > 0) {
            card.classList.remove('hidden');
            list.innerHTML = '';
            data.attention.forEach(item => {
                const el = document.createElement('div');
                el.className = 'attention-topic-item';
                const subj = subjects[item.subject_code] || { color: '#ef4444', title: item.subject_code };
                el.innerHTML = `
                    <div class="attention-info">
                        <span class="subject-tag-badge" style="background-color: ${subj.color || '#ef4444'};">${escapeHtml(item.subject_code)}</span>
                        <span class="attention-title">${escapeHtml(item.title)}</span>
                    </div>
                    <div class="attention-actions">
                        <button type="button" class="btn btn-sm btn-outline attention-drill-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>Proof Drill</button>
                        <button type="button" class="btn btn-sm btn-secondary attention-review-btn">Open Syllabus</button>
                    </div>
                `;

                el.querySelector('.attention-drill-btn').addEventListener('click', () => {
                    openGrillModal(item.subject_code, item.title);
                });

                el.querySelector('.attention-review-btn').addEventListener('click', () => {
                    showSubjectModal(item.subject_code);
                });

                list.appendChild(el);
            });
        } else {
            card.classList.add('hidden');
        }
    } catch (err) {
        console.error('Failed to load attention topics:', err);
        card.classList.add('hidden');
    }
}

// ==================== ORAL EXAM & PROOF SIMULATOR ("GRILL ME") ====================

let currentGrillSubject = null;
let currentGrillTopic = null;
let currentGrillQuestion = null;

async function openGrillModal(subjectCode, topic = null) {
    currentGrillSubject = subjectCode;
    currentGrillTopic = topic;
    activeSubjectCode = subjectCode;

    const modal = document.getElementById('grillModal');
    if (!modal) return;

    const subjectTag = document.getElementById('grillSubjectTag');
    const topicSubtitle = document.getElementById('grillTopicSubtitle');
    const evalCard = document.getElementById('grillEvaluationCard');
    const answerInput = document.getElementById('grillAnswerInput');
    const hintToggle = document.getElementById('grillHintToggle');
    const hintText = document.getElementById('grillHintText');

    if (subjectTag) subjectTag.textContent = subjectCode;
    if (topicSubtitle) {
        topicSubtitle.textContent = topic
            ? `Target Topic: ${topic} — Mathematical proof and derivation rigor.`
            : `Mathematical proof construction and derivation analysis for ${subjectCode}.`;
    }
    if (answerInput) answerInput.value = '';
    if (evalCard) evalCard.classList.add('hidden');
    if (hintToggle) hintToggle.style.display = 'none';
    if (hintText) {
        hintText.classList.add('hidden');
        hintText.textContent = '';
    }

    modal.classList.add('active');
    await fetchGrillQuestion(subjectCode, topic);
}

async function fetchGrillQuestion(subjectCode, topic = null) {
    const questionText = document.getElementById('grillQuestionText');
    const hintToggle = document.getElementById('grillHintToggle');
    const hintText = document.getElementById('grillHintText');
    const submitBtn = document.getElementById('grillSubmitBtn');

    if (questionText) {
        questionText.innerHTML = '<div style="display: flex; align-items: center; gap: 8px; color: var(--text-muted); padding: 12px 0;"><i class="fas fa-spinner fa-spin"></i> Generating examination problem...</div>';
    }
    if (submitBtn) submitBtn.disabled = true;

    try {
        const res = await fetch('/api/ai/grill/question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject_code: subjectCode, topic: topic })
        });
        const data = await res.json();
        if (res.ok && data.question) {
            currentGrillQuestion = data.question;
            if (questionText) {
                questionText.innerHTML = formatTextForDisplay(data.question);
                renderMath(questionText);
            }
            if (data.hint && hintToggle && hintText) {
                hintToggle.style.display = 'block';
                hintText.innerHTML = formatTextForDisplay(data.hint);
                renderMath(hintText);
            }
            if (submitBtn) submitBtn.disabled = false;
        } else {
            if (questionText) {
                questionText.innerHTML = `<div style="color: var(--danger);">${escapeHtml(data.error || 'Failed to formulate examiner question.')}</div>`;
            }
        }
    } catch (err) {
        console.error('Error fetching grill question:', err);
        if (questionText) {
            questionText.innerHTML = '<div style="color: var(--danger);">Network error generating question.</div>';
        }
    }
}

async function handleGrillAnswerSubmit(e) {
    e.preventDefault();
    const answerInput = document.getElementById('grillAnswerInput');
    const answer = answerInput ? answerInput.value.trim() : '';
    if (!answer) {
        showNotification('Please enter your proof derivation before submitting.', 'info');
        return;
    }

    const submitBtn = document.getElementById('grillSubmitBtn');
    const evalCard = document.getElementById('grillEvaluationCard');
    const scoreBadge = document.getElementById('evalScoreBadge');
    const feedbackText = document.getElementById('evalFeedbackText');
    const strengthsList = document.getElementById('evalStrengthsList');
    const gapsList = document.getElementById('evalGapsList');
    const solutionBox = document.getElementById('evalModelSolution');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Evaluating Derivation...';
    }

    try {
        const res = await fetch('/api/ai/grill/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject_code: currentGrillSubject,
                topic: currentGrillTopic || '',
                question: currentGrillQuestion,
                student_answer: answer
            })
        });

        const data = await res.json();
        if (res.ok && data.evaluation) {
            const ev = data.evaluation;
            evalCard.classList.remove('hidden');

            const score = ev.score !== undefined ? ev.score : (ev.rigor_score || 0);
            scoreBadge.textContent = `${score}/10`;
            scoreBadge.className = 'eval-score-badge ' + (score >= 8 ? 'score-high' : (score >= 5 ? 'score-med' : 'score-low'));

            feedbackText.innerHTML = formatTextForDisplay(ev.feedback || '');

            strengthsList.innerHTML = '';
            (ev.strengths || []).forEach(s => {
                const li = document.createElement('li');
                li.innerHTML = formatTextForDisplay(s);
                strengthsList.appendChild(li);
            });

            gapsList.innerHTML = '';
            (ev.missing_steps || ev.gaps || []).forEach(g => {
                const li = document.createElement('li');
                li.innerHTML = formatTextForDisplay(g);
                gapsList.appendChild(li);
            });

            if (solutionBox) {
                solutionBox.innerHTML = formatTextForDisplay(ev.model_solution || 'No model solution provided.');
            }

            renderMath(evalCard);
            evalCard.scrollIntoView({ behavior: 'smooth' });
        } else {
            showNotification(data.error || 'Failed to evaluate proof.', 'error');
        }
    } catch (err) {
        console.error('Error evaluating proof:', err);
        showNotification('Network error during proof evaluation.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Evaluate Derivation';
        }
    }
}

// ==================== EXAM COUNTDOWN & VELOCITY CALCULATOR ====================

async function loadMilestones() {
    const list = document.getElementById('milestonesList');
    if (!list) return;

    try {
        const res = await fetch('/api/milestones');
        const data = await res.json();
        if (res.ok && data.milestones) {
            renderMilestones(data.milestones);
        }
    } catch (err) {
        console.error('Failed to load milestones:', err);
    }
}

function renderMilestones(milestones) {
    const list = document.getElementById('milestonesList');
    if (!list) return;

    if (milestones.length === 0) {
        list.innerHTML = `
            <div class="milestones-empty" style="padding: 1rem; color: var(--text-secondary); text-align: center;">
                <p>No exam milestones set yet. Click <strong>+ Add Exam Target</strong> to set your CAT and Finals dates and calculate your target weekly hours.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = '';
    milestones.forEach(m => {
        const subj = subjects[m.subject_code] || { color: '#667eea', title: m.subject_code };
        const card = document.createElement('div');
        card.className = 'milestone-item-card';

        const daysLeft = m.days_remaining !== undefined ? m.days_remaining : 0;
        let daysClass = 'days-normal';
        let daysText = `${daysLeft} days`;
        if (daysLeft < 0) {
            daysClass = 'days-past';
            daysText = 'Past';
        } else if (daysLeft === 0) {
            daysClass = 'days-urgent';
            daysText = 'TODAY!';
        } else if (daysLeft <= 7) {
            daysClass = 'days-urgent';
            daysText = `${daysLeft}d (This Week!)`;
        } else if (daysLeft <= 21) {
            daysClass = 'days-warning';
            daysText = `${daysLeft} days`;
        }

        card.innerHTML = `
            <div class="milestone-card-header">
                <span class="subject-tag-badge" style="background-color: ${subj.color || '#667eea'};">${escapeHtml(m.subject_code)}</span>
                <span class="milestone-days-badge ${daysClass}">${daysText}</span>
            </div>
            <h4 class="milestone-title">${escapeHtml(m.title)}</h4>
            <div class="milestone-date-label"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Target: ${escapeHtml(m.target_date)}</div>
            <div class="milestone-velocity-box">
                <div class="velocity-row">
                    <span class="velocity-label">Required Velocity:</span>
                    <span class="velocity-value">${m.velocity_hours_per_week || 0} hrs/week</span>
                </div>
                <div class="velocity-progress-row">
                    <span>${m.completed_hours || 0}h / ${m.target_hours || 0}h prepped</span>
                    <span>${m.progress_pct || 0}%</span>
                </div>
                <div class="velocity-bar">
                    <div class="velocity-fill" style="width: ${Math.min(100, m.progress_pct || 0)}%;"></div>
                </div>
            </div>
            <div class="milestone-card-actions">
                <button type="button" class="milestone-del-btn" title="Delete milestone"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>Delete</button>
            </div>
        `;

        card.querySelector('.milestone-del-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Delete exam target "${m.title}"?`)) {
                await deleteMilestone(m.id);
                await loadMilestones();
            }
        });

        list.appendChild(card);
    });
}

async function deleteMilestone(milestoneId) {
    try {
        const res = await fetch(`/api/milestones/${milestoneId}`, { method: 'DELETE' });
        if (res.ok) {
            showNotification('Exam milestone deleted', 'info');
        }
    } catch (err) {
        console.error('Failed to delete milestone:', err);
    }
}

async function handleMilestoneSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const submitBtn = form.querySelector('button[type="submit"]');
    const feedback = document.getElementById('milestoneFormFeedback');

    const subjectCode = document.getElementById('milestoneSubject').value;
    const title = document.getElementById('milestoneTitle').value.trim();
    const targetDate = document.getElementById('milestoneDate').value;
    const targetHours = parseFloat(document.getElementById('milestoneHours').value) || 20;

    if (!subjectCode || !title || !targetDate) {
        if (feedback) feedback.textContent = 'Please fill out all required fields.';
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }

    try {
        const res = await fetch('/api/milestones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject_code: subjectCode,
                title: title,
                target_date: targetDate,
                target_hours: targetHours
            })
        });

        const data = await res.json();
        if (res.ok) {
            showNotification('Exam milestone target saved!', 'success');
            const modal = document.getElementById('milestoneModal');
            if (modal) modal.classList.remove('active');
            form.reset();
            if (feedback) feedback.textContent = '';
            await loadMilestones();
        } else {
            if (feedback) feedback.textContent = data.error || 'Failed to save milestone.';
        }
    } catch (err) {
        console.error('Error saving milestone:', err);
        if (feedback) feedback.textContent = 'Network error saving milestone.';
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Exam Target';
        }
    }
}


// ==================== COURSE NOTES & GITHUB-BACKED SCANS ====================

let currentSubjectNotes = [];
let stagedNoteFiles = [];

function initSubjectModalTabs() {
    const btnSyllabus = document.getElementById('tabBtnSyllabus');
    const btnNotes = document.getElementById('tabBtnNotes');

    if (btnSyllabus) {
        btnSyllabus.addEventListener('click', () => switchModalTab('syllabus'));
    }
    if (btnNotes) {
        btnNotes.addEventListener('click', () => {
            switchModalTab('notes');
            if (activeSubjectCode) {
                loadSubjectNotes(activeSubjectCode);
                populateNoteTopicDropdown(activeSubjectCode);
            }
        });
    }
}

function switchModalTab(tabName) {
    const btnSyllabus = document.getElementById('tabBtnSyllabus');
    const btnNotes = document.getElementById('tabBtnNotes');
    const paneSyllabus = document.getElementById('subjectTabSyllabus');
    const paneNotes = document.getElementById('subjectTabNotes');

    if (!btnSyllabus || !btnNotes || !paneSyllabus || !paneNotes) return;

    if (tabName === 'notes') {
        btnNotes.classList.add('active');
        btnSyllabus.classList.remove('active');
        paneNotes.classList.remove('hidden');
        paneSyllabus.classList.add('hidden');
    } else {
        btnSyllabus.classList.add('active');
        btnNotes.classList.remove('active');
        paneSyllabus.classList.remove('hidden');
        paneNotes.classList.add('hidden');
    }
}

function initNotesModule() {
    // Note composer toggle
    const toggleBtn = document.getElementById('noteComposerToggle');
    const form = document.getElementById('newNoteForm');
    const icon = document.getElementById('composerIcon');
    const cancelBtn = document.getElementById('cancelNoteBtn');

    if (toggleBtn && form) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = form.classList.toggle('hidden');
            if (icon) icon.textContent = isHidden ? '+' : '−';
            if (!isHidden) {
                const titleInput = document.getElementById('noteTitle');
                if (titleInput) titleInput.focus();
            }
        });
    }

    if (cancelBtn && form) {
        cancelBtn.addEventListener('click', () => {
            form.classList.add('hidden');
            if (icon) icon.textContent = '+';
            form.reset();
            stagedNoteFiles = [];
            renderStagedFiles();
        });
    }

    // Dropzone & File Input
    const dropzone = document.getElementById('noteImageDropzone');
    const fileInput = document.getElementById('noteFileInput');

    if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                stageFiles(e.target.files);
                fileInput.value = '';
            }
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                stageFiles(e.dataTransfer.files);
            }
        });
    }

    // Global Clipboard Paste Listener (Ctrl+V)
    window.addEventListener('paste', (e) => {
        const modal = document.getElementById('subjectModal');
        if (!modal || !modal.classList.contains('active')) return;

        const items = (e.clipboardData || window.clipboardData).items;
        if (!items) return;

        let hasImage = false;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const ext = blob.type.split('/')[1] || 'png';
                    const filename = `clipboard_scan_${Date.now()}.${ext}`;
                    const file = new File([blob], filename, { type: blob.type });
                    stageFiles([file]);
                    hasImage = true;
                }
            }
        }

        if (hasImage) {
            switchModalTab('notes');
            if (form && form.classList.contains('hidden')) {
                form.classList.remove('hidden');
                if (icon) icon.textContent = '−';
            }
            showNotification('Image pasted from clipboard!', 'info');
        }
    });

    // Form submit
    if (form) {
        form.addEventListener('submit', handleNoteSubmit);
    }

    // Search & Filter
    const searchInput = document.getElementById('notesSearchInput');
    const topicFilter = document.getElementById('notesTopicFilter');

    if (searchInput) {
        searchInput.addEventListener('input', () => filterAndRenderNotes());
    }
    if (topicFilter) {
        topicFilter.addEventListener('change', () => filterAndRenderNotes());
    }

    // Lightbox modal close
    const lightboxModal = document.getElementById('imageLightboxModal');
    const lightboxClose = document.getElementById('lightboxClose');

    if (lightboxClose && lightboxModal) {
        lightboxClose.addEventListener('click', closeLightbox);
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });
    }
}

function stageFiles(fileList) {
    for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        if (f.type.startsWith('image/')) {
            stagedNoteFiles.push(f);
        } else {
            showNotification(`Skipped non-image file: ${f.name}`, 'info');
        }
    }
    renderStagedFiles();
}

function renderStagedFiles() {
    const container = document.getElementById('stagedImagesList');
    if (!container) return;

    container.innerHTML = '';
    stagedNoteFiles.forEach((file, idx) => {
        const pill = document.createElement('div');
        pill.className = 'staged-img-pill';

        const imgUrl = URL.createObjectURL(file);
        pill.innerHTML = `
            <img src="${imgUrl}" class="staged-img-thumb" alt="Preview">
            <span class="staged-img-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
            <button type="button" class="staged-img-remove" title="Remove image">&times;</button>
        `;

        pill.querySelector('.staged-img-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            stagedNoteFiles.splice(idx, 1);
            renderStagedFiles();
        });

        container.appendChild(pill);
    });
}

function populateNoteTopicDropdown(subjectCode) {
    const select = document.getElementById('noteTopicSelect');
    const filterSelect = document.getElementById('notesTopicFilter');
    if (!select) return;

    select.innerHTML = '<option value="">General Subject Note</option>';
    if (filterSelect) filterSelect.innerHTML = '<option value="">All Topics</option>';

    // Fetch topics if not cached
    fetch(`/api/topics/${subjectCode}`)
        .then(res => res.json())
        .then(data => {
            const topics = data.topics || [];
            topics.forEach(t => {
                const opt1 = document.createElement('option');
                opt1.value = t.title;
                opt1.textContent = t.title;
                select.appendChild(opt1);

                if (filterSelect) {
                    const opt2 = document.createElement('option');
                    opt2.value = t.title;
                    opt2.textContent = t.title;
                    filterSelect.appendChild(opt2);
                }
            });
        })
        .catch(err => console.warn('Could not populate note topics dropdown:', err));
}

async function loadSubjectNotes(subjectCode, renderImmediately = true) {
    const badge = document.getElementById('modalNotesCountBadge');
    const feed = document.getElementById('subjectNotesFeed');
    const notice = document.getElementById('notesGithubNotice');

    try {
        const res = await fetch(`/api/notes/${subjectCode}`);
        const data = await res.json();
        if (res.ok) {
            currentSubjectNotes = data.notes || [];
            if (badge) badge.textContent = currentSubjectNotes.length;

            if (notice) {
                if (!data.github_configured) {
                    notice.classList.remove('hidden');
                } else {
                    notice.classList.add('hidden');
                }
            }

            if (renderImmediately && feed) {
                filterAndRenderNotes();
            }
        }
    } catch (err) {
        console.error('Failed to load subject notes:', err);
    }
}

function filterAndRenderNotes() {
    const feed = document.getElementById('subjectNotesFeed');
    const searchInput = document.getElementById('notesSearchInput');
    const topicFilter = document.getElementById('notesTopicFilter');
    if (!feed) return;

    const query = (searchInput ? searchInput.value.trim().toLowerCase() : '');
    const selectedTopic = (topicFilter ? topicFilter.value : '');

    const filtered = currentSubjectNotes.filter(n => {
        const matchesTopic = !selectedTopic || (n.topic_title === selectedTopic);
        const matchesQuery = !query ||
            (n.title && n.title.toLowerCase().includes(query)) ||
            (n.content_markdown && n.content_markdown.toLowerCase().includes(query)) ||
            (n.topic_title && n.topic_title.toLowerCase().includes(query));
        return matchesTopic && matchesQuery;
    });

    if (filtered.length === 0) {
        feed.innerHTML = `
            <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
                <p>No notes or scans found${selectedTopic || query ? ' matching your filters' : ''}.</p>
                <p style="font-size: 0.8rem; margin-top: 4px;">Use the form above to record your first handwritten derivation or lecture notes.</p>
            </div>
        `;
        return;
    }

    feed.innerHTML = '';
    filtered.forEach(note => {
        const card = document.createElement('div');
        card.className = 'note-card';

        const dateStr = note.created_at ? new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

        let attachmentsHtml = '';
        if (note.attachments && note.attachments.length > 0) {
            attachmentsHtml = `<div class="note-gallery-grid">`;
            note.attachments.forEach(att => {
                attachmentsHtml += `
                    <div class="note-thumbnail-wrap" data-img-url="${escapeHtml(att.public_url)}" data-caption="${escapeHtml(note.title)} - ${escapeHtml(att.original_filename)}">
                        <img src="${escapeHtml(att.public_url)}" class="note-thumbnail" alt="${escapeHtml(att.original_filename)}" loading="lazy">
                        <span class="note-thumbnail-badge">View</span>
                    </div>
                `;
            });
            attachmentsHtml += `</div>`;
        }

        card.innerHTML = `
            <div class="note-card-header">
                <div class="note-title-wrap">
                    <h4 class="note-card-title">${escapeHtml(note.title)}</h4>
                    <div class="note-meta-row">
                        <span class="note-type-tag">${escapeHtml(note.note_type || 'lecture')}</span>
                        ${note.topic_title ? `<span class="note-topic-tag">${escapeHtml(note.topic_title)}</span>` : ''}
                        <span>• ${dateStr}</span>
                        ${note.attachments ? `<span>• ${note.attachments.length} scan${note.attachments.length === 1 ? '' : 's'}</span>` : ''}
                    </div>
                </div>
                <button type="button" class="note-del-btn" title="Delete note"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>Delete</button>
            </div>
            ${note.content_markdown ? `<div class="note-content-body">${formatTextForDisplay(note.content_markdown)}</div>` : ''}
            ${attachmentsHtml}
        `;

        // Delete note button
        card.querySelector('.note-del-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Delete note "${note.title}" and any attached scans?`)) {
                await deleteNote(note.id);
            }
        });

        // Lightbox thumbnails
        card.querySelectorAll('.note-thumbnail-wrap').forEach(wrap => {
            wrap.addEventListener('click', () => {
                openLightbox(wrap.dataset.imgUrl, wrap.dataset.caption);
            });
        });

        feed.appendChild(card);
    });

    renderMath(feed);
}

async function handleNoteSubmit(e) {
    e.preventDefault();

    const titleInput = document.getElementById('noteTitle');
    const topicSelect = document.getElementById('noteTopicSelect');
    const typeSelect = document.getElementById('noteTypeSelect');
    const contentText = document.getElementById('noteContent');
    const submitBtn = document.getElementById('saveNoteBtn');
    const form = document.getElementById('newNoteForm');

    const title = titleInput ? titleInput.value.trim() : '';
    if (!title) {
        showNotification('Please provide a note title', 'error');
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading to GitHub & Saving...';
    }

    const formData = new FormData();
    formData.append('subject_code', activeSubjectCode);
    formData.append('title', title);
    formData.append('topic_title', topicSelect ? topicSelect.value : '');
    formData.append('note_type', typeSelect ? typeSelect.value : 'lecture');
    formData.append('content_markdown', contentText ? contentText.value : '');

    stagedNoteFiles.forEach(file => {
        formData.append('images', file);
    });

    try {
        const res = await fetch('/api/notes', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            showNotification('Note and scans saved successfully!', 'success');
            if (data.upload_warnings && data.upload_warnings.length > 0) {
                showNotification(data.upload_warnings[0], 'info');
            }
            form.reset();
            stagedNoteFiles = [];
            renderStagedFiles();
            form.classList.add('hidden');
            const icon = document.getElementById('composerIcon');
            if (icon) icon.textContent = '+';
            await loadSubjectNotes(activeSubjectCode);
        } else {
            showNotification(data.error || 'Failed to save note', 'error');
        }
    } catch (err) {
        console.error('Error saving note:', err);
        showNotification('Network error saving note', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Note & Upload Scans';
        }
    }
}

async function deleteNote(noteId) {
    try {
        const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
        if (res.ok) {
            showNotification('Note deleted', 'info');
            await loadSubjectNotes(activeSubjectCode);
        } else {
            const data = await res.json();
            showNotification(data.error || 'Failed to delete note', 'error');
        }
    } catch (err) {
        console.error('Error deleting note:', err);
        showNotification('Network error deleting note', 'error');
    }
}

function openLightbox(imgUrl, caption) {
    const modal = document.getElementById('imageLightboxModal');
    const img = document.getElementById('lightboxImage');
    const cap = document.getElementById('lightboxCaption');

    if (!modal || !img) return;

    img.src = imgUrl;
    if (cap) cap.textContent = caption || '';
    modal.classList.add('active');
}

function closeLightbox() {
    const modal = document.getElementById('imageLightboxModal');
    const img = document.getElementById('lightboxImage');
    if (modal) modal.classList.remove('active');
    if (img) img.src = '';
}
