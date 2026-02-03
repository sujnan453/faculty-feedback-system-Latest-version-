// Manage Questions Functionality

let editingQuestionId = null; // Track which question is being edited
let currentPage = 1;
let allQuestions = [];
let filteredQuestions = [];

const currentUser = checkAuth('admin');
if (!currentUser) {
    // User will be redirected by checkAuth function
} else {
    initializeManageQuestions();
}

function initializeManageQuestions() {
    // Load existing questions
    loadQuestions();

    // Form submission
    document.getElementById('addQuestionForm').addEventListener('submit', handleAddQuestion);
    
    // Cancel edit button
    document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);
    
    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadQuestions();
        }
    });
}

function loadQuestions() {
    allQuestions = Storage.getQuestions();
    
    // If no search term, show all questions
    const searchTerm = document.getElementById('searchQuestions').value.toLowerCase().trim();
    if (searchTerm === '') {
        filteredQuestions = [...allQuestions];
    }
    
    const container = document.getElementById('questionsGrid');
    const countBadge = document.getElementById('questionCountBadge');
    
    // Update count badge
    countBadge.textContent = allQuestions.length;

    if (allQuestions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <path d="M9 11l3 3L22 4"></path>
                        <path d="M20 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h11"></path>
                    </svg>
                </div>
                <h3>No Questions Created Yet</h3>
                <p>Start building your question library by creating your first question or loading sample questions.</p>
                <div class="empty-actions">
                    <button type="button" class="btn-primary" onclick="document.getElementById('questionText').focus(); document.querySelector('.form-section').scrollIntoView({behavior: 'smooth'});">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Create First Question
                    </button>
                    <button type="button" class="btn-secondary" onclick="loadSpecific10Questions()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 5v14M5 12h14"></path>
                        </svg>
                        Load Sample Questions
                    </button>
                </div>
            </div>
        `;
        document.getElementById('paginationControls').style.display = 'none';
        return;
    }

    // Show all questions without pagination
    const paginatedQuestions = filteredQuestions;

    // Handle no search results
    if (searchTerm !== '' && paginatedQuestions.length === 0) {
        container.innerHTML = `
            <div class="no-search-results">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h3>No Questions Found</h3>
                <p>No questions match your search term "<strong>${searchTerm}</strong>". Try searching with different keywords.</p>
            </div>
        `;
        return;
    }

    // Render questions
    container.innerHTML = '';
    paginatedQuestions.forEach((question, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.style.animationDelay = `${index * 0.1}s`;

        const createdDate = new Date(question.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        questionCard.innerHTML = `
            <div class="question-header">
                <div class="question-number">${index + 1}</div>
                <div class="question-content">
                    <p class="question-text">${question.text}</p>
                    <div class="question-meta">
                        <div class="meta-item">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Created ${createdDate}
                        </div>
                    </div>
                </div>
            </div>
            <div class="question-actions">
                <button type="button" class="btn-action btn-edit" onclick="editQuestion('${question.id}')" title="Edit this question">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Edit
                </button>
                <button type="button" class="btn-action btn-delete" onclick="deleteQuestion('${question.id}')" title="Delete this question">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Delete
                </button>
            </div>
        `;

        container.appendChild(questionCard);
    });

    // Hide pagination controls since we're showing all questions
    const paginationControls = document.getElementById('paginationControls');
    if (paginationControls) {
        paginationControls.style.display = 'none';
    }
}

function handleAddQuestion(e) {
    e.preventDefault();

    const questionInput = document.getElementById('questionText');
    const questionText = questionInput.value.trim();

    // Clear previous error
    questionInput.style.borderColor = '';

    // Validation
    if (!questionText) {
        showAlert('❌ Please enter a question', 'danger');
        questionInput.style.borderColor = '#dc3545';
        return;
    }

    if (questionText.length < 5) {
        showAlert('❌ Question must be at least 5 characters long', 'danger');
        questionInput.style.borderColor = '#dc3545';
        return;
    }

    if (questionText.length > 500) {
        showAlert('❌ Question must not exceed 500 characters', 'danger');
        questionInput.style.borderColor = '#dc3545';
        return;
    }

    if (!questionText.endsWith('?')) {
        showAlert('⚠️ Question should end with a question mark (?)', 'warning');
    }

    // Check for duplicate question (excluding the one being edited)
    const existingQuestions = Storage.getQuestions();
    const isDuplicate = existingQuestions.some(q => 
        q.text.toLowerCase() === questionText.toLowerCase() && q.id !== editingQuestionId
    );
    if (isDuplicate) {
        showAlert('❌ This question already exists', 'danger');
        questionInput.style.borderColor = '#dc3545';
        return;
    }

    if (editingQuestionId) {
        // Update existing question
        const questions = Storage.getQuestions();
        const questionIndex = questions.findIndex(q => q.id === editingQuestionId);
        
        if (questionIndex !== -1) {
            questions[questionIndex].text = questionText;
            questions[questionIndex].updatedAt = new Date().toISOString();
            localStorage.setItem('questions', JSON.stringify(questions));
            
            showAlert('✅ Question updated successfully!', 'success');
            
            // Clear form and reset style
            questionInput.value = '';
            questionInput.style.borderColor = '';
            
            // Cancel edit mode
            cancelEdit();
            
            // Reload questions to show updated list
            loadQuestions();
            return;
        }
    } else {
        // Create new question
        const question = {
            id: Storage.generateId(),
            text: questionText,
            allowComments: true,
            createdAt: new Date().toISOString()
        };

        // Save question
        Storage.saveQuestion(question);
        showAlert('✅ Question added successfully!', 'success');
    }

    // Clear form and reset style
    questionInput.value = '';
    questionInput.style.borderColor = '';

    // Reload questions
    loadQuestions();
}

function editQuestion(questionId) {
    const questions = Storage.getQuestions();
    const question = questions.find(q => q.id === questionId);
    
    if (!question) {
        showAlert('❌ Question not found', 'danger');
        return;
    }
    
    // Set editing state
    editingQuestionId = questionId;
    
    // Update form
    const questionInput = document.getElementById('questionText');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    
    questionInput.value = question.text;
    formTitle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 8px; vertical-align: middle;">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Edit Question
    `;
    submitBtn.textContent = 'Update Question';
    cancelBtn.style.display = 'inline-block';
    
    // Focus on input
    questionInput.focus();
    questionInput.select();
    
    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function cancelEdit() {
    editingQuestionId = null;
    
    const questionInput = document.getElementById('questionText');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    
    questionInput.value = '';
    formTitle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 8px; vertical-align: middle;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add New Question
    `;
    submitBtn.textContent = 'Add Question';
    cancelBtn.style.display = 'none';
    questionInput.style.borderColor = '';
}

function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question? Any surveys using this question will not be affected.')) {
        Storage.deleteQuestion(questionId);
        showAlert('Question deleted successfully!', 'success');
        loadQuestions();
    }
}

function filterQuestions() {
    const searchTerm = document.getElementById('searchQuestions').value.toLowerCase().trim();
    const clearBtn = document.getElementById('clearSearchBtn');
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    const searchResultsCount = document.getElementById('searchResultsCount');
    
    // Show/hide clear button
    clearBtn.style.display = searchTerm ? 'block' : 'none';
    
    // Filter questions
    if (searchTerm === '') {
        filteredQuestions = [...allQuestions];
        searchResultsInfo.style.display = 'none';
    } else {
        filteredQuestions = allQuestions.filter(question =>
            question.text.toLowerCase().includes(searchTerm)
        );
        
        // Show search results info
        searchResultsInfo.style.display = 'flex';
        const count = filteredQuestions.length;
        searchResultsCount.textContent = `${count} ${count === 1 ? 'result' : 'results'} found`;
    }
    
    // Reload questions with filtered results
    loadQuestions();
}

function clearSearch() {
    document.getElementById('searchQuestions').value = '';
    filterQuestions();
    document.getElementById('searchQuestions').focus();
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

// Load specific 10 questions function
function loadSpecific10Questions() {
    console.log('🔍 loadSpecific10Questions function called');
    
    // Check if SampleData is available
    if (typeof SampleData === 'undefined') {
        console.error('❌ SampleData not available');
        showAlert('Error: SampleData system not loaded. Please refresh the page.', 'danger');
        return;
    }
    
    // Check if the specific function exists
    if (typeof SampleData.initializeSpecific10Questions !== 'function') {
        console.error('❌ initializeSpecific10Questions function not found');
        showAlert('Error: Question loading function not available. Please check the system.', 'danger');
        return;
    }
    
    if (confirm('This will add the 10 specific questions from the faculty feedback form. Continue?')) {
        try {
            console.log('🚀 Starting to load specific questions...');
            
            const questionsAdded = SampleData.initializeSpecific10Questions();
            console.log(`✅ Questions added: ${questionsAdded}`);
            
            showAlert(`Successfully added ${questionsAdded} specific questions!`, 'success');
            loadQuestions(); // Reload the questions list
            
        } catch (error) {
            console.error('❌ Error loading specific questions:', error);
            showAlert(`Error loading specific questions: ${error.message}`, 'danger');
        }
    } else {
        console.log('ℹ️ User cancelled question loading');
    }
}

// Debug function to check system status
function debugSystemStatus() {
    console.log('🔍 System Debug Information:');
    console.log('Storage available:', typeof Storage !== 'undefined');
    console.log('SampleData available:', typeof SampleData !== 'undefined');
    
    if (typeof SampleData !== 'undefined') {
        console.log('SampleData functions:', Object.keys(SampleData));
        console.log('initializeSpecific10Questions available:', typeof SampleData.initializeSpecific10Questions === 'function');
    }
    
    const questions = Storage.getQuestions();
    console.log('Current questions count:', questions.length);
    
    return {
        storage: typeof Storage !== 'undefined',
        sampleData: typeof SampleData !== 'undefined',
        specificFunction: typeof SampleData !== 'undefined' && typeof SampleData.initializeSpecific10Questions === 'function',
        questionsCount: questions.length
    };
}

// Add debug info on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const status = debugSystemStatus();
        console.log('📊 System Status:', status);
        
        if (!status.storage) {
            console.error('❌ Storage system not loaded');
        }
        if (!status.sampleData) {
            console.error('❌ SampleData system not loaded');
        }
        if (!status.specificFunction) {
            console.error('❌ Specific questions function not available');
        }
        
        if (status.storage && status.sampleData && status.specificFunction) {
            console.log('✅ All systems ready for question loading');
        }
    }, 1000);
});