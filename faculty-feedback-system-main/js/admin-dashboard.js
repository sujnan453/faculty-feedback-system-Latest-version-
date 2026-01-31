// Admin Dashboard Functionality

const currentUser = checkAuth('admin');
if (!currentUser) {
    // User will be redirected
} else {
    initializeAdminDashboard();
}

function initializeAdminDashboard() {
    // Display admin information
    document.getElementById('adminName').textContent = currentUser.name;

    // Set user initials
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userInitials').textContent = initials;

    // Add breadcrumb navigation
    addBreadcrumb();

    // Load statistics
    loadStatistics();

    // Load recent surveys
    loadRecentSurveys();
    
    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadStatistics();
            loadRecentSurveys();
        }
    });
}

function addBreadcrumb() {
    const breadcrumb = BreadcrumbManager.create([
        { label: '🏠 Home', href: 'admin-dashboard.html' },
        { label: 'Dashboard' }
    ]);
    BreadcrumbManager.insert(breadcrumb);
}

function loadStatistics() {
    const surveys = Storage.getSurveys();
    const feedbacks = Storage.getFeedbacks();
    const users = Storage.getUsers();
    const departments = Storage.getDepartments();

    const students = users.filter(u => u.role === 'student');
    const admins = users.filter(u => u.role === 'admin');
    const activeSurveys = surveys.filter(s => s.isActive !== false);
    const inactiveSurveys = surveys.filter(s => s.isActive === false);

    // Main stat values
    document.getElementById('totalSurveys').textContent = surveys.length;
    document.getElementById('totalResponses').textContent = feedbacks.length;
    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('activeSurveys').textContent = activeSurveys.length;

    // Survey Card Details
    document.getElementById('activeSurveysCount').textContent = activeSurveys.length;
    document.getElementById('inactiveSurveysCount').textContent = inactiveSurveys.length;

    // Response Card Details
    const avgResponsesPerSurvey = surveys.length > 0 ? (feedbacks.length / surveys.length).toFixed(1) : 0;
    document.getElementById('avgResponsesPerSurvey').textContent = avgResponsesPerSurvey;

    // Student Card Details
    document.getElementById('totalAdmins').textContent = admins.length;
    document.getElementById('totalUsers').textContent = users.length;

    // Active Surveys Card Details
    document.getElementById('totalDepartments').textContent = departments.length;

    // Add tooltips for additional information
    const surveyCard = document.querySelector('.stat-surveys');
    const responseCard = document.querySelector('.stat-responses');
    const studentCard = document.querySelector('.stat-students');
    const activeCard = document.querySelector('.stat-active');

    if (surveyCard) {
        TooltipManager.add(surveyCard, `Total Surveys: ${surveys.length} | Active: ${activeSurveys.length} | Inactive: ${inactiveSurveys.length}`);
    }

    if (responseCard) {
        const responseRate = surveys.length > 0 && students.length > 0 ? ((feedbacks.length / (surveys.length * students.length)) * 100).toFixed(1) : 0;
        TooltipManager.add(responseCard, `Total Responses: ${feedbacks.length} | Avg: ${avgResponsesPerSurvey} | Rate: ${responseRate}%`);
    }

    if (studentCard) {
        TooltipManager.add(studentCard, `Students: ${students.length} | Admins: ${admins.length} | Total: ${users.length}`);
    }

    if (activeCard) {
        TooltipManager.add(activeCard, `Active: ${activeSurveys.length} | Inactive: ${inactiveSurveys.length} | Departments: ${departments.length}`);
    }
}

function loadRecentSurveys() {
    const surveys = Storage.getSurveys();
    const container = document.getElementById('recentSurveysContainer');

    if (surveys.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📭</span>
                <h3>No Surveys Created Yet</h3>
                <p>Create your first survey to get started</p>
                <a href="create-survey.html" class="btn btn-primary" style="margin-top: 20px; display: inline-block;">Create Survey</a>
            </div>
        `;
        return;
    }

    // Sort by creation date (most recent first)
    const sortedSurveys = surveys.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Show only the 5 most recent
    const recentSurveys = sortedSurveys.slice(0, 5);

    container.innerHTML = '';

    recentSurveys.forEach((survey, index) => {
        const item = createSurveyItem(survey);
        item.classList.add('stagger-item');
        item.style.animationDelay = (index * 0.05) + 's';
        container.appendChild(item);
    });
}

function createSurveyItem(survey) {
    const item = document.createElement('div');
    item.className = 'survey-item';

    const createdDate = new Date(survey.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const feedbackCount = Storage.getFeedbacksBySurveyId(survey.id).length;
    const isActive = survey.isActive !== false;

    item.innerHTML = `
        <div class="survey-item-info">
            <h4>${survey.department} - Department</h4>
            <div class="survey-item-meta">
                <span>📅 Created: ${createdDate}</span>
                <span>❓ ${(survey.questions || []).length} Questions</span>
                <span>📝 ${feedbackCount} Responses</span>
            </div>
        </div>
        <div class="survey-item-actions">
            <span class="survey-status ${isActive ? 'status-active' : 'status-inactive'}">
                ${isActive ? '● Active' : '○ Inactive'}
            </span>
            <button class="btn btn-secondary btn-sm" onclick="viewSurveyDetails('${survey.id}')">View Details</button>
            <button class="btn btn-danger btn-sm" onclick="deleteSurvey('${survey.id}')" style="background: #f56565; color: white; border: none; padding: 4px 8px; font-size: 11px;">🗑️ Delete</button>
        </div>
    `;

    return item;
}

function viewSurveyDetails(surveyId) {
    // Show loading state
    notificationManager.info('Loading survey details...', 'Loading', 0);
    
    // Store the survey ID and redirect to view feedbacks page
    sessionStorage.setItem('selectedSurveyId', surveyId);
    
    setTimeout(() => {
        window.location.href = 'view-feedbacks.html';
    }, 300);
}

function deleteSurvey(surveyId) {
    if (confirm('⚠️ Are you sure you want to delete this survey? This will remove it from all students and cannot be undone.')) {
        LoadingManager.show(document.querySelector('.recent-surveys-section'));
        
        setTimeout(() => {
            Storage.deleteSurvey(surveyId);
            LoadingManager.hide(document.querySelector('.recent-surveys-section'));
            loadStatistics();
            loadRecentSurveys();
            notificationManager.success('Survey deleted successfully!', 'Success');
        }, 500);
    }
}