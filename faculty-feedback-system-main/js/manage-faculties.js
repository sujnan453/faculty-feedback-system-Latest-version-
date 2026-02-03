// Manage Faculties Functionality

const currentUser = checkAuth('admin');
if (!currentUser) {
    // User will be redirected
} else {
    initializeManageFaculties();
}

function initializeManageFaculties() {
    loadDepartments();
    setupModalHandlers();
}

function setupModalHandlers() {
    // Close modal when clicking outside
    const modal = document.getElementById('createDeptModal');
    window.onclick = function (event) {
        if (event.target == modal) {
            closeCreateDeptModal();
        }
    };
}

function openCreateDeptModal() {
    document.getElementById('createDeptModal').style.display = 'block';
    document.getElementById('deptName').focus();
}

function closeCreateDeptModal() {
    document.getElementById('createDeptModal').style.display = 'none';
    document.getElementById('createDeptForm').reset();
}

function submitCreateDept(event) {
    event.preventDefault();

    const deptNameInput = document.getElementById('deptName');
    const deptFullNameInput = document.getElementById('deptFullName');
    const deptName = deptNameInput.value.trim();
    const deptFullName = deptFullNameInput.value.trim();
    const editingId = document.getElementById('createDeptForm').dataset.editingId;

    // Clear previous errors
    clearFieldErrors();

    // Validation
    const errors = {};

    if (!deptName) {
        errors.deptName = '❌ Department name is required';
    } else if (deptName.length < 2) {
        errors.deptName = '❌ Department name must be at least 2 characters';
    } else if (deptName.length > 50) {
        errors.deptName = '❌ Department name must not exceed 50 characters';
    } else if (!/^[a-zA-Z0-9\s\-]+$/.test(deptName)) {
        errors.deptName = '❌ Department name can only contain letters, numbers, spaces, and hyphens';
    }

    if (deptFullName && deptFullName.length > 100) {
        errors.deptFullName = '❌ Full name must not exceed 100 characters';
    }

    // Check if department already exists (only if not editing)
    if (!editingId) {
        const existingDept = Storage.getDepartmentByName(deptName);
        if (existingDept) {
            errors.deptName = '❌ Department already exists!';
        }
    }

    // Display errors if any
    if (Object.keys(errors).length > 0) {
        displayFieldErrors(errors);
        showAlert('Please fix the errors below', 'danger');
        return;
    }

    if (editingId) {
        // Update existing department
        const department = Storage.getDepartmentById(editingId);
        if (department) {
            department.name = deptName;
            department.fullName = deptFullName || deptName;
            Storage.saveDepartment(department);
            showAlert(`✅ Department "${deptName}" updated successfully!`, 'success');
        }
    } else {
        // Create new department
        const newDept = {
            id: Storage.generateId(),
            name: deptName,
            fullName: deptFullName || deptName,
            faculties: []
        };

        Storage.saveDepartment(newDept);
        showAlert(`✅ Department "${deptName}" created successfully!`, 'success');
    }

    // Close modal and reload
    closeCreateDeptModal();
    loadDepartments();
}

function clearFieldErrors() {
    document.querySelectorAll('.field-error-message').forEach(el => el.remove());
    document.querySelectorAll('.form-group input').forEach(el => el.style.borderColor = '');
}

function displayFieldErrors(errors) {
    Object.keys(errors).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '#dc3545';
            const errorMsg = document.createElement('div');
            errorMsg.className = 'field-error-message';
            errorMsg.textContent = errors[fieldId];
            errorMsg.style.color = '#dc3545';
            errorMsg.style.fontSize = '12px';
            errorMsg.style.marginTop = '5px';
            errorMsg.style.display = 'block';
            field.parentNode.appendChild(errorMsg);
        }
    });
}

function loadDepartments() {
    const departments = Storage.getDepartments();
    const container = document.getElementById('departmentsContainer');

    if (departments.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1; padding: 40px;">No departments available. Click "Create New Department" to add one.</p>';
        return;
    }

    container.innerHTML = '';

    departments.forEach(department => {
        const card = createDepartmentCard(department);
        container.appendChild(card);
    });
}

function createDepartmentCard(department) {
    const card = document.createElement('div');
    card.className = 'department-card';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', `${department.name} department with ${department.faculties ? department.faculties.length : 0} faculties`);

    const header = document.createElement('div');
    header.className = 'department-header';
    header.innerHTML = `
        <div class="department-info">
            <h2 class="department-name">${department.name}</h2>
            <p>${department.fullName}</p>
        </div>
        <div style="display: flex; gap: 8px;">
            <button class="btn-edit" onclick="editDepartment('${department.id}', '${department.name}', '${department.fullName}')" title="Edit Department" aria-label="Edit ${department.name} department">✏️</button>
            <button class="btn-remove" onclick="deleteDepartment('${department.id}', '${department.name}')" title="Delete Department" aria-label="Delete ${department.name} department">🗑️</button>
        </div>
    `;

    card.appendChild(header);

    // Faculty list
    const facultyList = document.createElement('div');
    facultyList.className = 'faculty-list';
    facultyList.setAttribute('role', 'list');
    facultyList.setAttribute('aria-label', `Faculties in ${department.name} department`);

    if (!department.faculties || department.faculties.length === 0) {
        facultyList.innerHTML = '<div class="empty-faculty" role="status" aria-live="polite">📭 No faculties added yet</div>';
    } else {
        department.faculties.forEach((faculty, index) => {
            const item = document.createElement('div');
            item.className = 'faculty-item';
            item.setAttribute('role', 'listitem');
            item.setAttribute('aria-label', `Faculty ${index + 1}: ${faculty.name}`);
            item.innerHTML = `
                <div class="faculty-info">
                    <div class="faculty-name">👨‍🏫 ${faculty.name}</div>
                </div>
                <div class="faculty-actions">
                    <button class="btn-remove" onclick="removeFaculty('${department.id}', '${faculty.id}')" aria-label="Remove ${faculty.name} from ${department.name}">Delete</button>
                </div>
            `;
            facultyList.appendChild(item);
        });
    }

    card.appendChild(facultyList);

    // Add faculty form
    const form = document.createElement('div');
    form.className = 'add-faculty-form';
    form.setAttribute('role', 'region');
    form.setAttribute('aria-label', `Add faculty to ${department.name} department`);
    form.innerHTML = `
        <div class="form-row">
            <input type="text" id="facultyName-${department.id}" placeholder="👨‍🏫 Faculty Name" aria-label="Faculty name input for ${department.name}" aria-describedby="facultyNameHelp-${department.id}" />
            <span id="facultyNameHelp-${department.id}" class="sr-only">Enter the name of the faculty member to add to this department</span>
            <button class="btn-add-faculty" onclick="addFacultyToDept('${department.id}')" aria-label="Add faculty to ${department.name} department">Add Faculty</button>
        </div>
    `;

    card.appendChild(form);

    return card;
}

function addFacultyToDept(departmentId) {
    const nameInput = document.getElementById(`facultyName-${departmentId}`);
    const name = nameInput.value.trim();

    // Validation
    if (!name) {
        showAlert('❌ Please enter faculty name', 'danger');
        nameInput.style.borderColor = '#dc3545';
        return;
    }

    if (name.length < 2) {
        showAlert('❌ Faculty name must be at least 2 characters', 'danger');
        nameInput.style.borderColor = '#dc3545';
        return;
    }

    if (name.length > 100) {
        showAlert('❌ Faculty name must not exceed 100 characters', 'danger');
        nameInput.style.borderColor = '#dc3545';
        return;
    }

    if (!/^[a-zA-Z\s\.\-']+$/.test(name)) {
        showAlert('❌ Faculty name can only contain letters, spaces, dots, hyphens, and apostrophes', 'danger');
        nameInput.style.borderColor = '#dc3545';
        return;
    }

    // Check for duplicate faculty in this department
    const department = Storage.getDepartmentById(departmentId);
    if (department && department.faculties) {
        const isDuplicate = department.faculties.some(f => f.name.toLowerCase() === name.toLowerCase());
        if (isDuplicate) {
            showAlert('❌ This faculty already exists in this department', 'danger');
            nameInput.style.borderColor = '#dc3545';
            return;
        }
    }

    const faculty = {
        id: Storage.generateId(),
        name: name
    };

    Storage.addFacultyToDepartment(departmentId, faculty);

    // Clear inputs and reset style
    nameInput.value = '';
    nameInput.style.borderColor = '';

    // Reload departments
    loadDepartments();

    showAlert(`✅ Faculty "${name}" added successfully!`, 'success');
}

function removeFaculty(departmentId, facultyId) {
    if (confirm('Are you sure you want to remove this faculty?')) {
        Storage.removeFacultyFromDepartment(departmentId, facultyId);
        loadDepartments();
        showAlert('Faculty removed successfully!', 'success');
    }
}

function deleteDepartment(departmentId, deptName) {
    if (confirm(`Are you sure you want to delete the "${deptName}" department? All faculties in this department will also be deleted.`)) {
        Storage.deleteDepartment(departmentId);
        loadDepartments();
        showAlert(`Department "${deptName}" deleted successfully!`, 'success');
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


// Edit Department Function
function editDepartment(departmentId, deptName, deptFullName) {
    // Pre-fill the form with current values
    document.getElementById('deptName').value = deptName;
    document.getElementById('deptFullName').value = deptFullName;
    
    // Store the department ID for update
    document.getElementById('createDeptForm').dataset.editingId = departmentId;
    
    // Change button text and form title
    const formTitle = document.querySelector('#createDeptModal .modal-header h2');
    formTitle.textContent = '✏️ Edit Department';
    
    const submitBtn = document.querySelector('#createDeptForm .btn-submit');
    submitBtn.textContent = 'Update Department';
    
    // Open modal
    openCreateDeptModal();
}

// Override closeCreateDeptModal to reset form state
const originalCloseCreateDeptModal = closeCreateDeptModal;
closeCreateDeptModal = function() {
    // Reset form title and button
    const formTitle = document.querySelector('#createDeptModal .modal-header h2');
    formTitle.textContent = '➕ Create New Department';
    
    const submitBtn = document.querySelector('#createDeptForm .btn-submit');
    submitBtn.textContent = 'Create Department';
    
    // Clear editing ID
    delete document.getElementById('createDeptForm').dataset.editingId;
    
    // Call original function
    originalCloseCreateDeptModal();
};
