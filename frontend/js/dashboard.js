const API_URL = 'https://taskmate-backends.onrender.com/api';

// Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Get user info from localStorage
function getUserInfo() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Check if user is authenticated
function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Get priority badge class
function getPriorityClass(priority) {
    const classes = {
        high: 'priority-high',
        medium: 'priority-medium',
        low: 'priority-low'
    };
    return classes[priority] || 'priority-medium';
}

// Get status badge class
function getStatusClass(status) {
    const classes = {
        pending: 'status-pending',
        'in-progress': 'status-in-progress',
        completed: 'status-completed'
    };
    return classes[status] || 'status-pending';
}

// Show/hide loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

// Show/hide empty state
function showEmptyState(show) {
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = show ? 'block' : 'none';
    }
}

// Fetch all tasks
async function fetchTasks() {
    try {
        console.log('Fetching tasks...');
        showLoading(true);
        showEmptyState(false);
        
        const token = getToken();
        
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Tasks response status:', response.status);
        showLoading(false);

        if (!response.ok) {
            throw new Error(`Failed to fetch tasks: ${response.status}`);
        }

        const data = await response.json();
        console.log('Tasks data received:', data);

        if (data.success && data.tasks) {
            displayTasks(data.tasks);
            updateStats(data.tasks);
        } else {
            console.error('Invalid response format:', data);
            displayTasks([]);
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        showLoading(false);
        showAlert('Failed to load tasks', 'error');
        displayTasks([]);
    }
}

// Display tasks in the UI
function displayTasks(tasks) {
    console.log('Displaying tasks:', tasks);
    const tasksContainer = document.getElementById('tasksContainer');
    
    if (!tasksContainer) {
        console.error('Tasks container element not found!');
        return;
    }

    if (tasks.length === 0) {
        tasksContainer.innerHTML = '';
        showEmptyState(true);
        return;
    }

    showEmptyState(false);
    tasksContainer.innerHTML = tasks.map(task => `
        <div class="task-card ${task.status}" data-task-id="${task._id}">
            <div class="task-header">
                <div class="task-title-section">
                    <h3 class="task-title">${escapeHtml(task.title)}</h3>
                    <div class="task-badges">
                        <span class="badge priority-badge ${getPriorityClass(task.priority)}">
                            ${task.priority.toUpperCase()}
                        </span>
                        <span class="badge status-badge ${getStatusClass(task.status)}">
                            ${task.status.replace('-', ' ').toUpperCase()}
                        </span>
                    </div>
                </div>
                <div class="task-actions">
                    <button onclick="editTask('${task._id}')" class="btn-icon btn-edit" title="Edit Task">
                        ✏️
                    </button>
                    <button onclick="showDeleteConfirm('${task._id}')" class="btn-icon btn-delete" title="Delete Task">
                        🗑️
                    </button>
                </div>
            </div>
            
            ${task.description ? `
                <p class="task-description">${escapeHtml(task.description)}</p>
            ` : ''}
            
            <div class="task-footer">
                <div class="task-date">
                    <span class="date-icon">📅</span>
                    <span>${formatDate(task.dueDate)}</span>
                </div>
                <div class="task-meta">
                    <span class="task-created">Created: ${formatDate(task.createdAt)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update statistics
function updateStats(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;

    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('highPriorityTasks').textContent = highPriorityTasks;
}

// Show alert notification
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    alertContainer.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.classList.add('alert-show');
    }, 100);

    setTimeout(() => {
        alertDiv.classList.remove('alert-show');
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// Show modal
function showModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('taskForm').reset();
        document.getElementById('taskId').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Task';
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('taskForm').reset();
    }
}

// Show delete confirmation modal
let taskToDelete = null;

function showDeleteConfirm(taskId) {
    taskToDelete = taskId;
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.style.display = 'flex';
    }
}

function closeDeleteModal() {
    taskToDelete = null;
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        deleteModal.style.display = 'none';
    }
}

// Create/Update task
async function saveTask(event) {
    event.preventDefault();
    console.log('Save task called');

    const saveBtn = document.getElementById('saveTaskBtn');
    const btnText = saveBtn.querySelector('.btn-text');
    const btnLoader = saveBtn.querySelector('.btn-loader');
    
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';
    saveBtn.disabled = true;

    const taskId = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const dueDate = document.getElementById('taskDueDate').value;

    if (!title) {
        showAlert('Please enter a task title', 'error');
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        saveBtn.disabled = false;
        return;
    }

    const taskData = {
        title,
        description,
        priority,
        status,
        dueDate: dueDate || null
    };

    try {
        const token = getToken();
        const url = taskId ? `${API_URL}/tasks/${taskId}` : `${API_URL}/tasks`;
        const method = taskId ? 'PUT' : 'POST';

        console.log(`${method} request to:`, url);
        console.log('Task data:', taskData);

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            showAlert(taskId ? 'Task updated successfully! ✅' : 'Task created successfully! ✅', 'success');
            closeModal();
            await fetchTasks(); // Reload tasks
        } else {
            showAlert(data.message || 'Failed to save task', 'error');
        }
    } catch (error) {
        console.error('Error saving task:', error);
        showAlert('Error saving task. Please try again.', 'error');
    } finally {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        saveBtn.disabled = false;
    }
}

// Edit task
async function editTask(taskId) {
    try {
        showLoading(true);
        const token = getToken();
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        showLoading(false);
        const data = await response.json();
        
        if (data.success && data.task) {
            const task = data.task;
            document.getElementById('taskId').value = task._id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
            
            if (task.dueDate) {
                const date = new Date(task.dueDate);
                document.getElementById('taskDueDate').value = date.toISOString().split('T')[0];
            }

            document.getElementById('modalTitle').textContent = 'Edit Task';
            document.getElementById('taskModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error fetching task:', error);
        showLoading(false);
        showAlert('Failed to load task details', 'error');
    }
}

// Delete task
async function deleteTask() {
    if (!taskToDelete) return;

    const confirmBtn = document.getElementById('confirmDeleteBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting...';

    try {
        const token = getToken();
        const response = await fetch(`${API_URL}/tasks/${taskToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            showAlert('Task deleted successfully! 🗑️', 'success');
            closeDeleteModal();
            await fetchTasks(); // Reload tasks
        } else {
            showAlert(data.message || 'Failed to delete task', 'error');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showAlert('Error deleting task. Please try again.', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Delete Task';
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard loading...');
    
    // Check authentication
    if (!checkAuth()) {
        return;
    }

    // Display user info
    const user = getUserInfo();
    if (user) {
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting) {
            userGreeting.textContent = `Welcome, ${user.name || user.email}!`;
        }
    }

    // Load tasks
    fetchTasks();

    // Add Task Button
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', showModal);
    }

    // Task Form Submit
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', saveTask);
    }

    // Close Modal Buttons
    const closeModalBtn = document.getElementById('closeModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    // Delete Modal Buttons
    const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    }

    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }

    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteTask);
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const taskModal = document.getElementById('taskModal');
        const deleteModal = document.getElementById('deleteModal');
        
        if (event.target === taskModal) {
            closeModal();
        }
        if (event.target === deleteModal) {
            closeDeleteModal();
        }
    });

    console.log('Dashboard initialized successfully');
});

// Make functions globally accessible
window.showModal = showModal;
window.closeModal = closeModal;
window.editTask = editTask;
window.showDeleteConfirm = showDeleteConfirm;
window.closeDeleteModal = closeDeleteModal;
window.logout = logout;