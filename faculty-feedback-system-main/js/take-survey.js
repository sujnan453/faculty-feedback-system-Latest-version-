// Take Survey - New Redesigned Flow

let currentSurvey = null;
let currentUser_Survey = null;
let selectedTeachers = [];
let currentQuestionIndex = 0;
let ratings = {}; // Store ratings as { questionId: { teacherId: rating } }

const currentUser = checkAuth('student');
if (!currentUser) {
    // User will be redirected
} else {
    currentUser_Survey = currentUser;
    initializeSurvey();
}

function initializeSurvey() {
    const urlParams = new URLSearchParams(window.location.search);
    const surveyId = urlParams.get('id');

    if (!surveyId) {
        alert('Invalid survey ID');
        window.location.href = 'student-dashboard.html';
        return;
    }

    currentSurvey = Storage.getSurveyById(surveyId);

    if (!currentSurvey) {
        alert('Survey not found');
        window.location.href = 'student-dashboard.html';
        return;
    }

    // Verify survey is for student's department (case-insensitive)
    if (currentSurvey.department && currentUser_Survey.department) {
        const surveyDeptNormalized = currentSurvey.department.trim().toLowerCase();
        const studentDeptNormalized = currentUser_Survey.department.trim().toLowerCase();
        
        if (surveyDeptNormalized !== studentDeptNormalized) {
            alert('This survey is not available for your department');
            window.location.href = 'student-dashboard.html';
            return;
        }
    }

    // Check if already submitted
    if (Storage.hasSubmittedFeedback(currentUser_Survey.id, surveyId)) {
        alert('You have already submitted feedback for this survey');
        window.location.href = 'student-dashboard.html';
        return;
    }

    // Initialize ratings objects
    currentSurvey.questions.forEach(q => {
        ratings[q.id] = {};
    });

    // Auto-populate student info from login details
    autoPopulateStudentInfo();

    showStep(1);
}

function autoPopulateStudentInfo() {
    // Get current logged-in student's data
    if (currentUser_Survey) {
        // Set roll number only (auto-filled, readonly)
        if (currentUser_Survey.rollNumber) {
            document.getElementById('rollNo').value = currentUser_Survey.rollNumber;
        }

        // Year and Class must be selected by student
        // Don't auto-populate these fields

        console.log('✅ Student roll number auto-populated:', {
            rollNumber: currentUser_Survey.rollNumber
        });
    }

    // Load departments from storage
    loadDepartmentsForClass();
}

function loadDepartmentsForClass() {
    const classSelect = document.getElementById('classSelect');
    
    try {
        // Get all departments from storage
        const departments = Storage.getDepartments();
        
        if (!departments || departments.length === 0) {
            console.warn('⚠️ No departments found in storage');
            classSelect.innerHTML = '<option value="">-- No departments available --</option>';
            return;
        }

        // Clear existing options except the first one
        classSelect.innerHTML = '<option value="">-- Select Class --</option>';

        // Add departments from storage
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.name;
            option.textContent = dept.name;
            classSelect.appendChild(option);
        });

        console.log(`✅ Loaded ${departments.length} departments from storage`);
    } catch (error) {
        console.error('❌ Error loading departments:', error);
        classSelect.innerHTML = '<option value="">-- Error loading departments --</option>';
    }
}

function showStep(stepNumber) {
    document.getElementById('step1').classList.toggle('hidden', stepNumber !== 1);
    document.getElementById('step2').classList.toggle('hidden', stepNumber !== 2);
    document.getElementById('step3').classList.toggle('hidden', stepNumber !== 3);
}

// ===== STEP 1: Student Information =====
function validateStudentInfo() {
    const rollNo = document.getElementById('rollNo').value.trim();
    const year = document.getElementById('yearSelect').value;
    const classSelect = document.getElementById('classSelect').value;
    const errorContainer = document.getElementById('step1Errors');
    const errors = [];

    // Clear previous errors
    errorContainer.innerHTML = '';
    errorContainer.classList.remove('show');
    document.getElementById('rollNo').classList.remove('error');
    document.getElementById('yearSelect').classList.remove('error');
    document.getElementById('classSelect').classList.remove('error');

    // Validation checks
    if (!rollNo) {
        errors.push('Roll number is missing. Please ensure you are logged in with valid credentials.');
        document.getElementById('rollNo').classList.add('error');
    }

    if (!classSelect) {
        errors.push('Please select your class/department');
        document.getElementById('classSelect').classList.add('error');
    }

    // Show errors if any
    if (errors.length > 0) {
        let errorHTML = '<h4>⚠️ Please fix the following errors:</h4><ul>';
        errors.forEach(error => {
            errorHTML += `<li>${error}</li>`;
        });
        errorHTML += '</ul>';
        errorContainer.innerHTML = errorHTML;
        errorContainer.classList.add('show');
        return;
    }

    // Store student info
    window.studentInfo = {
        rollNo: rollNo,
        year: year ? parseInt(year) : null,
        class: classSelect,
        classSection: rollNo.charAt(1) // Get second digit as class section
    };

    // Load teachers for selected class
    loadTeachersForClass();
    showStep(2);
}

function loadTeachersForClass() {
    const classSelect = document.getElementById('classSelect').value;
    const teacherList = document.getElementById('teacherList');
    teacherList.innerHTML = '';

    if (!classSelect) return;

    // Get faculties from storage (dynamically) instead of survey snapshot
    // This ensures newly added faculty appear in the survey
    let availableTeachers = [];
    
    try {
        const departments = Storage.getDepartments();
        if (departments && departments.length > 0) {
            // Find the department matching the selected class
            const selectedDept = departments.find(dept => dept.name === classSelect);
            if (selectedDept && selectedDept.faculties) {
                availableTeachers = selectedDept.faculties;
            }
        }
    } catch (error) {
        console.error('Error loading teachers from storage:', error);
        // Fallback to survey faculties if storage fails
        availableTeachers = currentSurvey.faculties || [];
    }

    if (availableTeachers.length === 0) {
        teacherList.innerHTML = '<p style="color: #999; padding: 20px; text-align: center; background: #f9f9f9; border-radius: 8px; border: 2px dashed #e0e0e0;">⚠️ No teachers available for ' + classSelect + ' department</p>';
        return;
    }

    // Display all available teachers
    availableTeachers.forEach(teacher => {
        const checkboxDiv = document.createElement('label');
        checkboxDiv.className = 'teacher-checkbox';
        checkboxDiv.innerHTML = `
            <input type="checkbox" value="${teacher.id}" data-name="${teacher.name}" data-subject="${teacher.subject || ''}" onchange="updateTeacherCounter()">
            <div class="teacher-info">
                <div class="teacher-name">${teacher.name}</div>
                <div class="teacher-subject">${teacher.subject || 'Faculty'}</div>
            </div>
        `;
        teacherList.appendChild(checkboxDiv);
    });

    // Reset counter and select all button
    updateTeacherCounter();
    console.log(`✅ Loaded ${availableTeachers.length} teachers for ${classSelect} department`);
}

function validateTeacherSelection() {
    const checkboxes = document.querySelectorAll('#teacherList input[type="checkbox"]:checked');
    const errorContainer = document.getElementById('step2Errors');
    const errors = [];

    // Clear previous errors
    errorContainer.innerHTML = '';
    errorContainer.classList.remove('show');

    // Validation checks
    if (checkboxes.length === 0) {
        errors.push('Please select at least one teacher to provide feedback');
    }

    // Show errors if any
    if (errors.length > 0) {
        let errorHTML = '<h4>⚠️ Please fix the following errors:</h4><ul>';
        errors.forEach(error => {
            errorHTML += `<li>${error}</li>`;
        });
        errorHTML += '</ul>';
        errorContainer.innerHTML = errorHTML;
        errorContainer.classList.add('show');
        return;
    }

    // Store selected teachers
    selectedTeachers = Array.from(checkboxes).map(checkbox => ({
        id: checkbox.value,
        name: checkbox.getAttribute('data-name'),
        subject: checkbox.getAttribute('data-subject')
    }));

    // Initialize ratings for selected teachers
    Object.keys(ratings).forEach(qId => {
        selectedTeachers.forEach(teacher => {
            ratings[qId][teacher.id] = 0;
        });
    });

    // Move to questions
    currentQuestionIndex = 0;
    showStep(3);
    displayProgressContainer();
    loadQuestion();
}

function displayProgressContainer() {
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('totalQuestionNum').textContent = currentSurvey.questions.length;
}

function toggleSelectAllTeachers() {
    const checkboxes = document.querySelectorAll('#teacherList input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
    
    updateTeacherCounter();
}

function updateTeacherCounter() {
    const checkboxes = document.querySelectorAll('#teacherList input[type="checkbox"]');
    const totalTeachers = checkboxes.length;
    const checkedTeachers = document.querySelectorAll('#teacherList input[type="checkbox"]:checked').length;
    
    // Update counter
    const counter = document.getElementById('teacherCounter');
    if (counter) {
        if (checkedTeachers === 0) {
            counter.textContent = '0 selected';
        } else if (checkedTeachers === totalTeachers) {
            counter.textContent = `All ${totalTeachers} selected`;
        } else {
            counter.textContent = `${checkedTeachers} of ${totalTeachers} selected`;
        }
    }
    
    // Update select all button text
    const selectAllText = document.getElementById('selectAllText');
    if (selectAllText) {
        if (checkedTeachers === totalTeachers && totalTeachers > 0) {
            selectAllText.textContent = '☐ Deselect All';
        } else {
            selectAllText.textContent = '☑️ Select All';
        }
    }
}

// ===== STEP 3: Questions with Star Ratings =====
function loadQuestion() {
    const question = currentSurvey.questions[currentQuestionIndex];
    
    document.getElementById('questionNumber').textContent = `Question ${currentQuestionIndex + 1}`;
    document.getElementById('questionText').textContent = question.text;
    document.getElementById('currentQuestionNum').textContent = currentQuestionIndex + 1;
    document.getElementById('progressInfo').textContent = `${currentQuestionIndex + 1} of ${currentSurvey.questions.length} questions`;

    // Update progress bar
    const progress = ((currentQuestionIndex + 1) / currentSurvey.questions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    // Load teacher ratings for this question
    loadTeacherRatings(question);

    // Update navigation buttons
    updateQuestionNavigation();
}

function loadTeacherRatings(question) {
    const container = document.getElementById('teacherRatingsContainer');
    container.innerHTML = '';

    selectedTeachers.forEach(teacher => {
        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'teacher-rating-item';
        
        const currentRating = ratings[question.id][teacher.id] || 0;
        
        ratingDiv.innerHTML = `
            <div class="teacher-rating-name">${teacher.name}</div>
            <div class="number-rating" id="numbers-${teacher.id}">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => `
                    <button type="button" class="rating-number ${currentRating === num ? 'active' : ''}" 
                            onclick="setRating('${question.id}', '${teacher.id}', ${num})">${num}</button>
                `).join('')}
            </div>
            <div class="rating-display">
                ${currentRating > 0 ? `Rating: ${currentRating}/10` : 'Not rated'}
            </div>
        `;
        
        container.appendChild(ratingDiv);
    });
}

function setRating(questionId, teacherId, rating) {
    ratings[questionId][teacherId] = rating;
    
    // Update number display
    const numbersContainer = document.getElementById(`numbers-${teacherId}`);
    const numbers = numbersContainer.querySelectorAll('.rating-number');
    numbers.forEach((btn, index) => {
        if (index + 1 === rating) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update the rating display
    const parent = numbersContainer.parentElement;
    const ratingDisplay = parent.querySelector('.rating-display');
    if (ratingDisplay) {
        ratingDisplay.textContent = `Rating: ${rating}/10`;
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

function nextQuestion() {
    // Validate current question - check if all teachers have ratings
    const question = currentSurvey.questions[currentQuestionIndex];
    const allRated = selectedTeachers.every(teacher => ratings[question.id][teacher.id] > 0);

    if (!allRated) {
        const unratedTeachers = selectedTeachers
            .filter(teacher => ratings[question.id][teacher.id] === 0)
            .map(t => t.name)
            .join(', ');
        
        alert(`⚠️ Please rate all teachers before proceeding.\n\nUnrated: ${unratedTeachers}`);
        return;
    }

    if (currentQuestionIndex < currentSurvey.questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    }
}

function updateQuestionNavigation() {
    const prevBtn = document.getElementById('prevQuestionBtn');
    const nextBtn = document.getElementById('nextQuestionBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.style.display = currentQuestionIndex > 0 ? 'block' : 'none';

    if (currentQuestionIndex === currentSurvey.questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

function submitSurvey() {
    // Validate last question
    const lastQuestion = currentSurvey.questions[currentQuestionIndex];
    const allRated = selectedTeachers.every(teacher => ratings[lastQuestion.id][teacher.id] > 0);

    if (!allRated) {
        const unratedTeachers = selectedTeachers
            .filter(teacher => ratings[lastQuestion.id][teacher.id] === 0)
            .map(t => t.name)
            .join(', ');
        
        alert(`⚠️ Please rate all teachers for this question before submitting.\n\nUnrated: ${unratedTeachers}`);
        return;
    }

    // Validate all questions are rated
    let allQuestionsRated = true;
    for (let i = 0; i < currentSurvey.questions.length; i++) {
        const q = currentSurvey.questions[i];
        const qRated = selectedTeachers.every(teacher => ratings[q.id][teacher.id] > 0);
        if (!qRated) {
            allQuestionsRated = false;
            break;
        }
    }

    if (!allQuestionsRated) {
        alert('⚠️ All questions must be rated before submission. Please go back and complete all ratings.');
        return;
    }

    if (!confirm('Are you sure you want to submit your feedback? You cannot edit it later.')) {
        return;
    }

    // VALIDATION: Verify survey still exists
    const surveyExists = Storage.getSurveyById(currentSurvey.id);
    if (!surveyExists) {
        alert('❌ Error: Survey no longer exists. Please contact administrator.');
        window.location.href = 'student-dashboard.html';
        return;
    }

    // VALIDATION: Verify all selected teachers still exist in department
    const department = Storage.getDepartmentByName(currentUser_Survey.department);
    if (!department) {
        alert('❌ Error: Your department no longer exists. Please contact administrator.');
        window.location.href = 'student-dashboard.html';
        return;
    }

    const departmentFacultyIds = (department.faculties || []).map(f => f.id);
    const invalidTeachers = selectedTeachers.filter(t => !departmentFacultyIds.includes(t.id));
    if (invalidTeachers.length > 0) {
        alert(`❌ Error: Some selected faculty members no longer exist in your department: ${invalidTeachers.map(t => t.name).join(', ')}`);
        window.location.href = 'student-dashboard.html';
        return;
    }

    // VALIDATION: Verify all questions still exist
    const questionIds = currentSurvey.questions.map(q => q.id);
    const invalidQuestions = Object.keys(ratings).filter(qId => !questionIds.includes(qId));
    if (invalidQuestions.length > 0) {
        alert('❌ Error: Survey questions have been modified. Please retake the survey.');
        window.location.href = 'student-dashboard.html';
        return;
    }

    // Create feedback responses
    const responses = [];
    
    currentSurvey.questions.forEach(question => {
        selectedTeachers.forEach(teacher => {
            responses.push({
                questionId: question.id,
                questionText: question.text,
                teacherId: teacher.id,
                teacherName: teacher.name,
                rating: ratings[question.id][teacher.id]
            });
        });
    });

    // Create feedback object with validation metadata
    const feedback = {
        id: Storage.generateId(),
        surveyId: currentSurvey.id,
        studentId: currentUser_Survey.id,
        studentName: currentUser_Survey.name,
        studentRollNo: currentUser_Survey.rollNumber,
        studentYear: currentUser_Survey.year,
        studentDepartment: currentUser_Survey.department,
        selectedTeachers: selectedTeachers,
        responses: responses,
        submittedAt: new Date().toISOString(),
        // Validation metadata for admin pages
        _validated: true,
        _surveyExists: true,
        _departmentExists: true,
        _facultiesExist: true
    };

    // Save feedback
    Storage.saveFeedback(feedback);

    alert('✅ Thank you! Your feedback has been submitted successfully.');
    window.location.href = 'student-dashboard.html';
}

function goBackDashboard() {
    if (confirm('Are you sure you want to leave? Your progress will not be saved.')) {
        window.location.href = 'student-dashboard.html';
    }
}