// Student Dashboard Functionality

// Check authentication
const currentUser = checkAuth('student');
if (!currentUser) {
    // User will be redirected by checkAuth function
} else {
    initializeDashboard();
}

function initializeDashboard() {
    // Display user information
    document.getElementById('studentName').textContent = currentUser.name;
    document.getElementById('studentSemester').textContent = currentUser.department;

    // Set user initials
    const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userInitials').textContent = initials;

    // Load surveys
    loadSurveys();
    
    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadSurveys();
        }
    });
}

function loadSurveys() {
    // Get surveys filtered by student's department
    const surveys = Storage.getSurveysByDepartment(currentUser.department);
    
    // Debug logging
    console.log('Student Department:', currentUser.department);
    console.log('All Surveys:', Storage.getSurveys());
    console.log('Filtered Surveys:', surveys);

    const feedbacks = Storage.getFeedbacksByStudentId(currentUser.id);
    const completedSurveyIds = feedbacks.map(f => f.surveyId);

    // Calculate statistics
    const availableCount = surveys.length;
    const completedCount = completedSurveyIds.length;
    const pendingCount = availableCount - completedCount;

    document.getElementById('availableSurveys').textContent = availableCount;
    document.getElementById('completedSurveys').textContent = completedCount;
    document.getElementById('pendingSurveys').textContent = pendingCount;

    // Display surveys
    const surveysContainer = document.getElementById('surveysContainer');

    if (surveys.length === 0) {
        surveysContainer.innerHTML = `
            <div class="empty-state">
                <span>📭</span>
                <h3>No Surveys Available</h3>
                <p>There are no active surveys for ${currentUser.department} department at the moment.</p>
            </div>
        `;
        return;
    }

    surveysContainer.innerHTML = '';

    surveys.forEach(survey => {
        const isCompleted = completedSurveyIds.includes(survey.id);
        const card = createSurveyCard(survey, isCompleted);
        surveysContainer.appendChild(card);
    });
}

function createSurveyCard(survey, isCompleted) {
    const card = document.createElement('div');
    card.className = 'survey-card';

    const createdDate = new Date(survey.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    // Determine department display text
    let departmentDisplay = survey.department;
    
    // Get current faculty count from storage (dynamically updated)
    let facultyCount = (survey.faculties || []).length;
    try {
        const departments = Storage.getDepartments();
        if (departments && departments.length > 0) {
            const selectedDept = departments.find(dept => dept.name === survey.department);
            if (selectedDept && selectedDept.faculties) {
                facultyCount = selectedDept.faculties.length;
            }
        }
    } catch (error) {
        console.error('Error loading faculty count from storage:', error);
        // Fallback to survey snapshot count
        facultyCount = (survey.faculties || []).length;
    }

    card.innerHTML = `
        <div class="survey-header">
            <div class="survey-info">
                <h3>Faculty Feedback Survey</h3>
            </div>
            <span class="survey-badge">${departmentDisplay}</span>
        </div>
        
        <div class="survey-meta">
            <div class="meta-item">
                <span>📅</span>
                <span>${createdDate}</span>
            </div>
            <div class="meta-item">
                <span>📚</span>
                <span>${departmentDisplay}</span>
            </div>
        </div>
        
        <div class="teacher-count">
            <p>Teachers to evaluate:</p>
            <strong>${facultyCount} Faculties</strong>
        </div>
        
        <div class="survey-actions">
            ${isCompleted ?
            '<button class="btn btn-success">✅ Completed</button>' :
            `<a href="take-survey.html?id=${survey.id}" class="btn btn-primary">Take Survey →</a>`
        }
        </div>
    `;

    return card;
}