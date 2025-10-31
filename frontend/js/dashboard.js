// API Configuration
const API_BASE_URL = 'https://taskmate-backends.onrender.com/api';

console.log('✅ Dashboard script loaded');
console.log('📡 API URL:', API_BASE_URL);

// Get user data from localStorage
function getUserData() {
    try {
        const userData = localStorage.getItem('user');
        console.log('📦 Raw user data from localStorage:', userData);
        
        if (!userData) {
            console.log('⚠️ No user data found');
            return null;
        }
        
        const parsed = JSON.parse(userData);
        console.log('✅ Parsed user data:', parsed);
        
        return parsed;
    } catch (error) {
        console.error('❌ Error parsing user data:', error);
        return null;
    }
}

// Check authentication
function checkAuth() {
    console.log('🔐 Checking authentication...');
    
    const userData = getUserData();
    
    if (!userData || !userData.token) {
        console.log('❌ No valid authentication found');
        alert('Please login first!');
        window.location.href = '/login.html';
        return null;
    }
    
    console.log('✅ User authenticated:', userData.name);
    return userData;
}

// Logout function
function logout() {
    console.log('👋 Logging out...');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Show message to user
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// Load tasks from API
async function loadTasks() {
    console.log('📥 Loading tasks...');
    
    const userData = getUserData();
    if (!userData || !userData.token) {
        console.log('❌ No auth token found');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Tasks response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                console.log('❌ Unauthorized - redirecting to login');
                logout();
                return;
            }
            throw new Error('Failed to load tasks');
        }
        
        const data = await response.json();
        console.log('✅ Tasks loaded:', data);
        
        if (data.success && Array.isArray(data.tasks)) {
            displayTasks(data.tasks);
        } else {
            console.log('⚠️ No tasks found or invalid response');
            displayTasks([]);
        }
        
    } catch (error) {
        console.error('❌ Error loading tasks:', error);
        showMessage('Failed to load tasks', 'error');
    }
}

// Display tasks in the UI
function displayTasks(tasks) {
    console.log('🎨 Displaying tasks:', tasks.length);
    
    const taskList = document.getElementById('taskList');
    if (!taskList) {
        console.log('❌ Task list element not found');
        return;
    }
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<p class="no-tasks">No tasks yet. Create your first task!</p>';
        return;
    }
    
    taskList.innerHTML = tasks.map(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        const priorityClass = task.priority ? task.priority.toLowerCase() : 'low';
        const statusClass = task.status === 'completed' ? 'completed' : '';
        const recurringBadge = task.isRecurring ? '<span class="recurring-badge">🔁 Recurring</span>' : '';
        
        return `
            <div class="task-card ${statusClass}" data-task-id="${task._id}">
                <div class="task-header">
                    <h3>${escapeHtml(task.title)}</h3>
                    <span class="priority-badge ${priorityClass}">${task.priority || 'Low'}</span>
                </div>
                <p class="task-description">${escapeHtml(task.description || 'No description')}</p>
                <div class="task-meta">
                    <span>📅 ${dueDate}</span>
                    <span>📊 ${task.status || 'pending'}</span>
                    ${recurringBadge}
                </div>
                <div class="task-actions">
                    <button onclick="toggleTaskStatus('${task._id}')" class="btn-complete">
                        ${task.status === 'completed' ? '↩️ Undo' : '✓ Complete'}
                    </button>
                    <button onclick="deleteTask('${task._id}')" class="btn-delete">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Create new task
async function createTask(event) {
    event.preventDefault();
    console.log('➕ Creating new task...');
    
    const userData = getUserData();
    if (!userData || !userData.token) {
        console.log('❌ No auth token');
        return;
    }
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;
    const isRecurring = document.getElementById('taskRecurring').checked;
    
    if (!title) {
        showMessage('Please enter a task title', 'error');
        return;
    }
    
    const taskData = {
        title,
        description,
        dueDate: dueDate || null,
        priority,
        isRecurring,
        status: 'pending'
    };
    
    console.log('📤 Task data:', taskData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userData.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        console.log('📊 Create response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error('Failed to create task');
        }
        
        const data = await response.json();
        console.log('✅ Task created:', data);
        
        showMessage('Task created successfully!', 'success');
        
        // Reset form
        event.target.reset();
        
        // Reload tasks
        await loadTasks();
        
        // Close modal if exists
        const modal = document.getElementById('taskModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ Error creating task:', error);
        showMessage('Failed to create task', 'error');
    }
}

// Toggle task status (complete/pending)
async function toggleTaskStatus(taskId) {
    console.log('🔄 Toggling task status:', taskId);
    
    const userData = getUserData();
    if (!userData || !userData.token) {
        return;
    }
    
    try {
        // First get the current task to know its status
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${userData.token}`
            }
        });
        
        const data = await response.json();
        const task = data.tasks.find(t => t._id === taskId);
        
        if (!task) {
            throw new Error('Task not found');
        }
        
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        
        const updateResponse = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${userData.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!updateResponse.ok) {
            throw new Error('Failed to update task');
        }
        
        console.log('✅ Task status updated');
        showMessage('Task updated successfully!', 'success');
        await loadTasks();
        
    } catch (error) {
        console.error('❌ Error updating task:', error);
        showMessage('Failed to update task', 'error');
    }
}

// Delete task
async function deleteTask(taskId) {
    console.log('🗑️ Deleting task:', taskId);
    
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    const userData = getUserData();
    if (!userData || !userData.token) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${userData.token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete task');
        }
        
        console.log('✅ Task deleted');
        showMessage('Task deleted successfully!', 'success');
        await loadTasks();
        
    } catch (error) {
        console.error('❌ Error deleting task:', error);
        showMessage('Failed to delete task', 'error');
    }
}

// Modal functions
function openTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) {
        modal.style.display = 'none';
        const form = document.getElementById('taskForm');
        if (form) {
            form.reset();
        }
    }
}

// Make functions globally available
window.logout = logout;
window.toggleTaskStatus = toggleTaskStatus;
window.deleteTask = deleteTask;
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Content Loaded');
    
    // Check authentication
    const userData = checkAuth();
    if (!userData) {
        return;
    }
    
    // Display user name
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = userData.name;
    }
    
    // Load tasks
    loadTasks();
    
    // Attach event listeners
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', createTask);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('taskModal');
    if (modal) {
        window.onclick = function(event) {
            if (event.target === modal) {
                closeTaskModal();
            }
        };
    }
});