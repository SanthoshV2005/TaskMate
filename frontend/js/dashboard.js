// API Configuration
const API_BASE_URL = 'https://taskmate-backends.onrender.com/api';

// Global variables
let allTasks = [];
let editingTaskId = null;
let currentFilter = 'all';

// ========================================
// PAGE INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    protectPage();
    loadUserInfo();
    loadTasks();
    setupEventListeners();
    
    // Run automation check on load
    setTimeout(() => {
        checkAutomatedTasks();
    }, 2000);
    
    // Check for automated tasks every 5 minutes
    setInterval(checkAutomatedTasks, 5 * 60 * 1000);
});

// ========================================
// EVENT LISTENERS SETUP
// ========================================
function setupEventListeners() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDueDate').setAttribute('min', today);
    
    // Recurring checkbox toggle
    const recurringCheckbox = document.getElementById('taskRecurring');
    if (recurringCheckbox) {
        recurringCheckbox.addEventListener('change', function() {
            const options = document.getElementById('recurringOptions');
            if (this.checked) {
                options.style.display = 'block';
            } else {
                options.style.display = 'none';
            }
        });
    }
}

// ========================================
// USER MANAGEMENT
// ========================================
function loadUserInfo() {
    const user = getCurrentUser();
    if (user && user.name) {
        document.getElementById('userName').textContent = user.name;
    }
}

// ========================================
// TASK MANAGEMENT
// ========================================
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            allTasks = data.tasks;
            updateStatistics(data.statistics);
            renderTasks();
        } else {
            showAlert('Failed to load tasks', 'danger');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showAlert('Error loading tasks. Please refresh the page.', 'danger');
    }
}

function updateStatistics(stats) {
    document.getElementById('totalTasks').textContent = stats.total;
    document.getElementById('completedTasks').textContent = stats.completed;
    document.getElementById('inProgressTasks').textContent = stats.inProgress;
    document.getElementById('pendingTasks').textContent = stats.pending;
}

function renderTasks() {
    const todoColumn = document.getElementById('todoColumn');
    const inProgressColumn = document.getElementById('inProgressColumn');
    const doneColumn = document.getElementById('doneColumn');
    
    // Clear columns
    todoColumn.innerHTML = '';
    inProgressColumn.innerHTML = '';
    doneColumn.innerHTML = '';
    
    // Filter tasks based on current filter
    let filteredTasks = allTasks;
    if (currentFilter !== 'all') {
        filteredTasks = allTasks.filter(task => task.status === currentFilter);
    }
    
    // Render tasks in appropriate columns
    filteredTasks.forEach(task => {
        const taskCard = createTaskCard(task);
        
        if (task.status === 'To-Do') {
            todoColumn.innerHTML += taskCard;
        } else if (task.status === 'In Progress') {
            inProgressColumn.innerHTML += taskCard;
        } else if (task.status === 'Done') {
            doneColumn.innerHTML += taskCard;
        }
    });
    
    // Show empty state if no tasks
    if (filteredTasks.length === 0) {
        const emptyMessage = '<p class="text-muted text-center mt-4">No tasks found</p>';
        todoColumn.innerHTML = emptyMessage;
        inProgressColumn.innerHTML = emptyMessage;
        doneColumn.innerHTML = emptyMessage;
    }
}

function createTaskCard(task) {
    const priorityColors = {
        'High': 'danger',
        'Medium': 'warning',
        'Low': 'info'
    };
    
    const dueDate = new Date(task.dueDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
    const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Done';
    const overdueClass = isOverdue ? 'border-danger' : '';
    
    // Check if task is recurring
    const recurringBadge = task.isRecurring ? 
        '<span class="badge bg-primary ms-1"><i class="fas fa-sync-alt"></i> Auto</span>' : '';
    
    return `
        <div class="task-card ${overdueClass}">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="mb-0">${escapeHtml(task.title)} ${recurringBadge}</h6>
                <span class="badge bg-${priorityColors[task.priority]}">${task.priority}</span>
            </div>
            <p class="text-muted small mb-2">${escapeHtml(task.description)}</p>
            <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                    <i class="fas fa-calendar"></i> ${dueDate}
                    ${isOverdue ? '<span class="text-danger ms-1">(Overdue)</span>' : ''}
                </small>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditTaskModal('${task._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${task._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function filterTasks(status) {
    currentFilter = status;
    
    // Update active button
    document.querySelectorAll('.btn-group button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTasks();
}

// ========================================
// MODAL MANAGEMENT
// ========================================
function openAddTaskModal() {
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'Add New Task';
    document.getElementById('taskForm').reset();
    
    // Reset recurring options
    document.getElementById('taskRecurring').checked = false;
    document.getElementById('recurringOptions').style.display = 'none';
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('taskDueDate').value = tomorrow.toISOString().split('T')[0];
}

function openEditTaskModal(taskId) {
    editingTaskId = taskId;
    document.getElementById('modalTitle').textContent = 'Edit Task';
    
    const task = allTasks.find(t => t._id === taskId);
    if (task) {
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskDueDate').value = task.dueDate.split('T')[0];
        
        // Set recurring options
        document.getElementById('taskRecurring').checked = task.isRecurring || false;
        if (task.isRecurring) {
            document.getElementById('recurringOptions').style.display = 'block';
            document.getElementById('recurringFrequency').value = task.recurringFrequency || 'daily';
        }
        
        const modal = new bootstrap.Modal(document.getElementById('taskModal'));
        modal.show();
    }
}

// ========================================
// SAVE TASK (WITH AUTOMATION)
// ========================================
async function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const dueDate = document.getElementById('taskDueDate').value;
    
    // Get automation settings
    const isRecurring = document.getElementById('taskRecurring').checked;
    const recurringFrequency = document.getElementById('recurringFrequency').value;
    
    if (!validateTaskForm(title, description, priority, status, dueDate)) {
        return;
    }
    
    const taskData = {
        title,
        description,
        priority,
        status,
        dueDate,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : null
    };
    
    try {
        let response;
        if (editingTaskId) {
            response = await fetch(`${API_BASE_URL}/tasks/${editingTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(taskData)
            });
        } else {
            response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getAuthToken()}`
                },
                body: JSON.stringify(taskData)
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('taskModal'));
            modal.hide();
            
            // Save automation rule if recurring
            if (isRecurring) {
                saveAutomationRule({
                    ...taskData,
                    _id: data.task._id
                });
                showAlert(data.message + ' 🤖 Automation enabled!', 'success');
            } else {
                showAlert(data.message, 'success');
            }
            
            await loadTasks();
        } else {
            showAlert(data.message, 'danger');
        }
    } catch (error) {
        console.error('Error saving task:', error);
        showAlert('Failed to save task. Please try again.', 'danger');
    }
}

function validateTaskForm(title, description, priority, status, dueDate) {
    if (!title || title.length < 3) {
        showAlert('Title must be at least 3 characters long', 'warning');
        return false;
    }
    
    if (!description || description.length < 10) {
        showAlert('Description must be at least 10 characters long', 'warning');
        return false;
    }
    
    if (!dueDate) {
        showAlert('Please select a due date', 'warning');
        return false;
    }
    
    const selectedDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showAlert('Due date cannot be in the past', 'warning');
        return false;
    }
    
    return true;
}

// ========================================
// DELETE TASK
// ========================================
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remove automation rule if exists
            removeAutomationRule(taskId);
            showAlert(data.message, 'success');
            await loadTasks();
        } else {
            showAlert(data.message, 'danger');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showAlert('Failed to delete task. Please try again.', 'danger');
    }
}

// ========================================
// TASK AUTOMATION FUNCTIONS
// ========================================

// Save automation rule to localStorage
function saveAutomationRule(task) {
    let automationRules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    
    const rule = {
        id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: 'To-Do', // Always create as To-Do
        frequency: task.recurringFrequency,
        lastCreated: new Date().toISOString()
    };
    
    // Remove old rule if updating
    automationRules = automationRules.filter(r => r.id !== task._id);
    
    // Add new rule
    automationRules.push(rule);
    
    localStorage.setItem('automationRules', JSON.stringify(automationRules));
    
    console.log('✅ Automation rule saved:', rule);
}

// Remove automation rule
function removeAutomationRule(taskId) {
    let automationRules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    automationRules = automationRules.filter(r => r.id !== taskId);
    localStorage.setItem('automationRules', JSON.stringify(automationRules));
}

// Check and create automated tasks
async function checkAutomatedTasks() {
    const rules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    
    if (rules.length === 0) {
        console.log('ℹ️ No automation rules found');
        return;
    }
    
    console.log('🔄 Checking automation rules...');
    
    for (const rule of rules) {
        const lastCreated = new Date(rule.lastCreated);
        const now = new Date();
        
        let shouldCreate = false;
        let newDueDate = new Date();
        
        // Check if task should be created based on frequency
        if (rule.frequency === 'daily') {
            const daysDiff = Math.floor((now - lastCreated) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 1) {
                shouldCreate = true;
                newDueDate.setDate(newDueDate.getDate() + 1);
            }
        } else if (rule.frequency === 'weekly') {
            const daysDiff = Math.floor((now - lastCreated) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 7) {
                shouldCreate = true;
                newDueDate.setDate(newDueDate.getDate() + 7);
            }
        } else if (rule.frequency === 'monthly') {
            const daysDiff = Math.floor((now - lastCreated) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 30) {
                shouldCreate = true;
                newDueDate.setDate(newDueDate.getDate() + 30);
            }
        }
        
        if (shouldCreate) {
            console.log('✨ Creating automated task:', rule.title);
            
            const newTask = {
                title: rule.title + ' 🔄',
                description: rule.description,
                priority: rule.priority,
                status: 'To-Do',
                dueDate: newDueDate.toISOString().split('T')[0],
                isRecurring: false // Don't make the auto-created task recurring
            };
            
            try {
                const response = await fetch(`${API_BASE_URL}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getAuthToken()}`
                    },
                    body: JSON.stringify(newTask)
                });
                
                if (response.ok) {
                    // Update last created time
                    rule.lastCreated = now.toISOString();
                    
                    let allRules = JSON.parse(localStorage.getItem('automationRules') || '[]');
                    const index = allRules.findIndex(r => r.id === rule.id);
                    if (index !== -1) {
                        allRules[index] = rule;
                        localStorage.setItem('automationRules', JSON.stringify(allRules));
                    }
                    
                    console.log('✅ Automated task created successfully');
                    showAlert(`🤖 Automated task created: ${rule.title}`, 'info');
                    
                    // Reload tasks to show the new one
                    await loadTasks();
                }
            } catch (error) {
                console.error('❌ Failed to create automated task:', error);
            }
        }
    }
}

// Show automation rules
function showAutomationRules() {
    const rules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    
    if (rules.length === 0) {
        showAlert('No automation rules set. Create a task and check "Make this a recurring task".', 'info');
        return;
    }
    
    let message = '🤖 Active Automation Rules:\n\n';
    rules.forEach((rule, index) => {
        const lastCreated = new Date(rule.lastCreated).toLocaleDateString('en-IN');
        message += `${index + 1}. ${rule.title}\n`;
        message += `   Frequency: ${rule.frequency}\n`;
        message += `   Priority: ${rule.priority}\n`;
        message += `   Last created: ${lastCreated}\n\n`;
    });
    
    message += '\n💡 Tip: Tasks are checked every 5 minutes and when you refresh the page.';
    
    alert(message);
}

// Clear all automation rules
function clearAutomationRules() {
    const rules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    
    if (rules.length === 0) {
        showAlert('No automation rules to clear.', 'info');
        return;
    }
    
    if (confirm(`Are you sure you want to clear all ${rules.length} automation rule(s)? This cannot be undone.`)) {
        localStorage.removeItem('automationRules');
        showAlert('✅ All automation rules cleared successfully', 'success');
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}