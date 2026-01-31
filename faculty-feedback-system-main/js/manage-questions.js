// Manage Questions Functionality

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
    
    // Refresh data when page becomes visible (user returns to tab)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            loadQuestions();
        }
    });
}

function loadQuestions() {
    const questions = Storage.getQuestions();
    const container = document.getElementById('questionsListContainer');

    if (questions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>📭</span>
                <h3>No Questions Yet</h3>
                <p>Create your first question to get started.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    questions.forEach((question, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        questionCard.style.padding = '15px';
        questionCard.style.marginBottom = '10px';
        questionCard.style.background = '#f8f9fa';
        questionCard.style.borderRadius = '6px';
        questionCard.style.borderLeft = '4px solid #667eea';
        questionCard.style.display = 'flex';
        questionCard.style.justifyContent = 'space-between';
        questionCard.style.alignItems = 'center';

        questionCard.innerHTML = `
            <div style="flex: 1;">
                <p style="margin: 0; font-weight: 500; color: #333;">${index + 1}. ${question.text}</p>
                <small style="color: #999; display: block; margin-top: 5px;">Added on ${new Date(question.createdAt).toLocaleDateString()}</small>
            </div>
            <button type="button" class="btn btn-remove btn-icon" onclick="deleteQuestion('${question.id}')" title="Delete Question" style="margin-left: 10px;">
                🗑️
            </button>
        `;

        container.appendChild(questionCard);
    });
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

    // Check for duplicate question
    const existingQuestions = Storage.getQuestions();
    const isDuplicate = existingQuestions.some(q => q.text.toLowerCase() === questionText.toLowerCase());
    if (isDuplicate) {
        showAlert('❌ This question already exists', 'danger');
        questionInput.style.borderColor = '#dc3545';
        return;
    }

    // Create question object
    const question = {
        id: Storage.generateId(),
        text: questionText,
        allowComments: true,
        createdAt: new Date().toISOString()
    };

    // Save question
    Storage.saveQuestion(question);

    showAlert('✅ Question added successfully!', 'success');

    // Clear form and reset style
    questionInput.value = '';
    questionInput.style.borderColor = '';

    // Reload questions
    loadQuestions();
}

function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question? Any surveys using this question will not be affected.')) {
        Storage.deleteQuestion(questionId);
        showAlert('Question deleted successfully!', 'success');
        loadQuestions();
    }
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