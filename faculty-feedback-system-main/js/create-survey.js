// Create Survey Functionality

let selectedQuestionIds = [];
let allAvailableQuestionIds = [];

const currentUser = checkAuth('admin');
if (!currentUser) {
    // User will be redirected
} else {
    // Defer initialization until DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCreateSurvey);
    } else {
        initializeCreateSurvey();
    }
}

function initializeCreateSurvey() {
    // Load departments into dropdown
    loadDepartments();

    // Load questions
    loadAvailableQuestions();

    // Form submission
    document.getElementById('createSurveyForm').addEventListener('submit', handleSurveySubmit);
    
    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadDepartments();
            loadAvailableQuestions();
        }
    });
}

function loadDepartments() {
    const departments = Storage.getDepartments();
    const departmentSelect = document.getElementById('department');

    departmentSelect.innerHTML = '<option value="">Select Department</option><option value="ALL">ALL Departments</option>';

    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
    });
}

function loadFaculties() {
    const departmentId = document.getElementById('department').value;
    const container = document.getElementById('facultyCheckboxContainer');

    if (!departmentId) {
        container.innerHTML = '<div class="faculty-list-item empty-state"><p>📭 Please select a department first</p></div>';
        updateFacultiesCounter(0);
        return;
    }

    if (departmentId === 'ALL') {
        // Calculate total faculties across all departments
        const allDepartments = Storage.getDepartments();
        let totalFaculties = 0;
        let deptList = [];
        
        allDepartments.forEach(dept => {
            const facultyCount = (dept.faculties || []).length;
            totalFaculties += facultyCount;
            deptList.push(`${dept.name} (${facultyCount})`);
        });

        container.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(17, 153, 142, 0.08) 0%, rgba(56, 239, 125, 0.05) 100%); border: 2px solid rgba(17, 153, 142, 0.2); border-radius: 12px; padding: 20px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div style="font-size: 2rem;">🌍</div>
                    <div>
                        <h3 style="color: #1a202c; margin: 0; font-size: 1.1rem; font-weight: 700;">All Departments Selected</h3>
                        <p style="color: #4a5568; margin: 5px 0 0 0; font-size: 0.9rem;">Survey will be created for all departments</p>
                    </div>
                </div>

                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center; border: 1px solid rgba(17, 153, 142, 0.2);">
                    <div style="font-size: 2rem; font-weight: 700; color: #11998e;">${totalFaculties}</div>
                    <div style="color: #4a5568; font-size: 0.9rem; font-weight: 600;">Total Faculty Members</div>
                </div>

                <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #11998e;">
                    <p style="color: #4a5568; margin: 0; font-size: 0.9rem;">
                        <strong>Departments:</strong> ${deptList.join(' • ')}
                    </p>
                </div>
            </div>
        `;
        updateFacultiesCounter(totalFaculties);
        return;
    }

    const faculties = Storage.getFacultiesByDepartment(departmentId);

    if (faculties.length === 0) {
        container.innerHTML = '<div class="faculty-list-item empty-state"><p>📭 No faculties added for this department</p><p>Go to <a href="manage-faculties.html">Manage Faculties</a> to add faculty members first.</p></div>';
        updateFacultiesCounter(0);
        return;
    }

    container.innerHTML = '';
    updateFacultiesCounter(faculties.length);

    faculties.forEach(faculty => {
        const facultyItem = document.createElement('div');
        facultyItem.className = 'faculty-list-item';
        facultyItem.id = `faculty-item-${faculty.id}`;
        
        facultyItem.innerHTML = `
            <div class="faculty-item-content">
                <p class="faculty-item-name">
                    <span class="faculty-item-icon">👨‍🏫</span>
                    ${faculty.name}
                </p>
            </div>
        `;
        
        container.appendChild(facultyItem);
    });
}

function updateFacultiesCounter(count) {
    const counter = document.getElementById('selectedFacultiesCount');
    if (counter) {
        counter.textContent = count;
    }
}

function loadAvailableQuestions() {
    const questions = Storage.getQuestions();
    const container = document.getElementById('questionsContainer');

    if (questions.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; padding: 40px 20px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.02) 100%); border-radius: 8px; text-align: center; border: 2px dashed var(--border-color);">
                <p style="color: var(--text-muted); margin: 0 0 10px 0; font-size: 1rem;">📭 No questions available yet.</p>
                <p style="color: var(--text-muted); margin: 0; font-size: 0.9rem;">Go to <a href="manage-questions.html" style="color: var(--primary-color); font-weight: 600;">Manage Questions</a> to create questions first.</p>
            </div>
        `;
        allAvailableQuestionIds = [];
        updateQuestionCounter();
        return;
    }

    container.innerHTML = '';
    allAvailableQuestionIds = questions.map(q => q.id);

    questions.forEach((question, index) => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        questionItem.id = `question-item-${question.id}`;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = question.id;
        checkbox.id = `question-checkbox-${question.id}`;
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                if (!selectedQuestionIds.includes(question.id)) {
                    selectedQuestionIds.push(question.id);
                }
                questionItem.classList.add('selected');
            } else {
                selectedQuestionIds = selectedQuestionIds.filter(id => id !== question.id);
                questionItem.classList.remove('selected');
            }
            updateQuestionCounter();
        });

        const content = document.createElement('div');
        content.className = 'question-content';

        const text = document.createElement('p');
        text.className = 'question-text';
        text.textContent = question.text;

        const meta = document.createElement('p');
        meta.className = 'question-meta';
        meta.textContent = `Added on ${new Date(question.createdAt).toLocaleDateString()}`;

        content.appendChild(text);
        content.appendChild(meta);

        questionItem.appendChild(checkbox);
        questionItem.appendChild(content);
        container.appendChild(questionItem);
    });

    // Add search functionality
    const searchInput = document.getElementById('questionSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterQuestions);
    }

    updateQuestionCounter();
}

function filterQuestions() {
    const searchTerm = document.getElementById('questionSearch').value.toLowerCase();
    const questionItems = document.querySelectorAll('.question-item');

    questionItems.forEach(item => {
        const questionText = item.querySelector('.question-text').textContent.toLowerCase();
        if (questionText.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

function updateQuestionCounter() {
    const selectedCount = document.getElementById('selectedCount');
    const totalCount = document.getElementById('totalCount');
    
    if (selectedCount && totalCount) {
        selectedCount.textContent = selectedQuestionIds.length;
        totalCount.textContent = allAvailableQuestionIds.length;
    }
}

function toggleSelectAllQuestions() {
    const allSelected = selectedQuestionIds.length === allAvailableQuestionIds.length;

    if (allSelected) {
        // Deselect all
        selectedQuestionIds = [];
        allAvailableQuestionIds.forEach(qId => {
            const checkbox = document.getElementById(`question-checkbox-${qId}`);
            const item = document.getElementById(`question-item-${qId}`);
            if (checkbox) {
                checkbox.checked = false;
            }
            if (item) {
                item.classList.remove('selected');
            }
        });
    } else {
        // Select all
        selectedQuestionIds = [...allAvailableQuestionIds];
        allAvailableQuestionIds.forEach(qId => {
            const checkbox = document.getElementById(`question-checkbox-${qId}`);
            const item = document.getElementById(`question-item-${qId}`);
            if (checkbox) {
                checkbox.checked = true;
            }
            if (item) {
                item.classList.add('selected');
            }
        });
    }
    
    updateQuestionCounter();
}

function handleSurveySubmit(e) {
    e.preventDefault();

    // Get basic information
    const departmentId = document.getElementById('department').value;

    // Validation
    if (!departmentId) {
        showAlert('❌ Please select a department', 'danger');
        document.getElementById('department').style.borderColor = '#dc3545';
        return;
    }

    document.getElementById('department').style.borderColor = '';

    // Get questions
    const questions = [];

    if (selectedQuestionIds.length === 0) {
        showAlert('❌ Please select at least one question', 'danger');
        return;
    }

    if (selectedQuestionIds.length > 50) {
        showAlert('❌ Maximum 50 questions allowed per survey', 'danger');
        return;
    }

    selectedQuestionIds.forEach(qId => {
        const question = Storage.getQuestionById(qId);
        if (question) {
            questions.push({
                id: question.id,
                text: question.text,
                allowComments: true
            });
        }
    });

    // Determine which departments to create surveys for
    let departmentsToCreateFor = [];

    if (departmentId === 'ALL') {
        // Create survey for each department
        departmentsToCreateFor = Storage.getDepartments();
    } else {
        // Create survey for selected department only
        const department = Storage.getDepartmentById(departmentId);
        if (!department) {
            showAlert('❌ Department not found', 'danger');
            return;
        }
        departmentsToCreateFor = [department];
    }

    if (departmentsToCreateFor.length === 0) {
        showAlert('❌ No departments found', 'danger');
        return;
    }

    // Validate faculties for each department
    let allValid = true;
    departmentsToCreateFor.forEach(department => {
        const faculties = (department.faculties || []).map(faculty => ({
            id: faculty.id,
            name: faculty.name
        }));

        if (faculties.length === 0) {
            showAlert(`❌ No faculties available for ${department.name} department. Please add faculties first.`, 'danger');
            allValid = false;
        }
    });

    if (!allValid) {
        return;
    }

    // Create a survey for each department
    let surveysCreated = 0;
    departmentsToCreateFor.forEach(department => {
        const faculties = (department.faculties || []).map(faculty => ({
            id: faculty.id,
            name: faculty.name
        }));

        // Create survey object
        const survey = {
            id: Storage.generateId(),
            department: department.name,
            faculties: faculties,
            questions: questions,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
            isActive: true
        };

        // Save survey
        Storage.saveSurvey(survey);
        surveysCreated++;
    });

    showAlert(`✅ Survey created successfully for ${surveysCreated} department(s)! Redirecting...`, 'success');

    setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
    }, 2000);
}

function showAlert(message, type = 'danger') {
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.textContent = message;
        alertDiv.className = `alert alert-${type} show`;

        setTimeout(() => {
            alertDiv.className = 'alert';
        }, 5000);
    }
}