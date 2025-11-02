// ========================================
// TASKMATE - DASHBOARD.JS
// Fully Corrected Version - All Issues Fixed
// ========================================

// API Configuration
const API_BASE_URL = 'https://taskmate-backends.onrender.com/api';

console.log('✅ Dashboard script loaded');

// Global variables
let tasks = [];
let taskModal;
let currentEditingTaskId = null;
let user = null;

// Get user data
function getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch (error) {
        return null;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Dashboard DOM loaded');
    
    // Get user
    user = getUser();
    if (!user || !user.token) {
        console.log('❌ No valid user - auth.js should redirect');
        return;
    }
    
    console.log('✅ User found:', user.name);
    
    // Set user name
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = user.name;
    }
    
    // Initialize modal
    const modalEl = document.getElementById('taskModal');
    if (modalEl) {
        taskModal = new bootstrap.Modal(modalEl, {
            backdrop: 'static',
            keyboard: true
        });
        console.log('✅ Modal initialized');
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load tasks
    loadTasks();
});

// Setup Event Listeners
function setupEventListeners() {
    console.log('🔌 Setting up listeners...');
    
    // Add Task Button
    const addBtn = document.getElementById('addTaskBtn');
    if (addBtn) {
        addBtn.onclick = () => openAddTaskModal();
    }
    
    // Save Task Button
    const saveBtn = document.getElementById('saveTaskBtn');
    if (saveBtn) {
        saveBtn.onclick = (e) => {
            e.preventDefault();
            saveTask();
        };
    }
    
    // Recurring checkbox
    const recurringCb = document.getElementById('isRecurring');
    if (recurringCb) {
        recurringCb.onchange = function() {
            const freqGroup = document.getElementById('frequencyGroup');
            if (freqGroup) {
                freqGroup.style.display = this.checked ? 'block' : 'none';
            }
        };
    }
    
    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.onclick = function() {
            const filter = this.getAttribute('data-filter');
            filterTasks(filter);
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        };
    });
    
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.oninput = function() {
            searchTasks(this.value);
        };
    }
    
    // View Automations
    const viewAutoBtn = document.getElementById('viewAutomationsBtn');
    if (viewAutoBtn) {
        viewAutoBtn.onclick = () => showAutomationRules();
    }
    
    // Clear Automations
    const clearAutoBtn = document.getElementById('clearAutomationsBtn');
    if (clearAutoBtn) {
        clearAutoBtn.onclick = () => clearAutomationRules();
    }
    
    console.log('✅ Listeners attached');
}

// Open Add Task Modal
function openAddTaskModal() {
    console.log('➕ Opening add modal');
    currentEditingTaskId = null;
    
    // Clear form
    document.getElementById('taskForm').reset();
    document.getElementById('frequencyGroup').style.display = 'none';
    document.getElementById('modalTitle').textContent = 'Add New Task';
    
    // Show modal
    if (taskModal) taskModal.show();
}

// Open Edit Task Modal - FIXED VERSION
function openEditTaskModal(taskId) {
    console.log('✏️ Opening edit modal for:', taskId);
    currentEditingTaskId = taskId;
    
    const task = tasks.find(t => t._id === taskId);
    if (!task) {
        alert('❌ Task not found');
        return;
    }
    
    // Fill form
    document.getElementById('taskTitle').value = task.title || '';
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskPriority').value = task.priority || 'medium';
    document.getElementById('taskStatus').value = task.status || 'todo';
    
    // Handle due date
    if (task.dueDate) {
        const date = new Date(task.dueDate);
        const dateStr = date.toISOString().split('T')[0];
        document.getElementById('taskDueDate').value = dateStr;
    }
    
    // Handle recurring
    const isRecurring = task.isRecurring || false;
    document.getElementById('isRecurring').checked = isRecurring;
    document.getElementById('recurringFrequency').value = task.recurringFrequency || 'daily';
    document.getElementById('frequencyGroup').style.display = isRecurring ? 'block' : 'none';
    
    // Update modal title
    document.getElementById('modalTitle').textContent = 'Edit Task';
    
    // Show modal
    if (taskModal) taskModal.show();
}

// Save Task
async function saveTask() {
    console.log('💾 Saving task...');
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const isRecurring = document.getElementById('isRecurring').checked;
    const frequency = document.getElementById('recurringFrequency').value;
    
    if (!title) {
        alert('❌ Please enter a title');
        return;
    }
    
    const taskData = {
        title,
        description,
        priority: priority.toLowerCase(),
        status: status.toLowerCase().replace(/\s+/g, '-'),
        dueDate,
        isRecurring,
        recurringFrequency: isRecurring ? frequency : null
    };
    
    console.log('Task data:', taskData);
    
    try {
        let response;
        
        if (currentEditingTaskId) {
            console.log('Updating task:', currentEditingTaskId);
            response = await fetch(`${API_BASE_URL}/tasks/${currentEditingTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(taskData)
            });
        } else {
            console.log('Creating new task');
            response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(taskData)
            });
        }
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            console.log('✅ Task saved');
            alert(currentEditingTaskId ? '✅ Task updated!' : '✅ Task created!');
            
            if (taskModal) taskModal.hide();
            await loadTasks();
        } else {
            const error = await response.json();
            console.error('❌ Error:', error);
            alert(`❌ Failed: ${error.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Connection error');
    }
}

// Load Tasks
async function loadTasks() {
    console.log('📥 Loading tasks...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            tasks = data.tasks || [];
            console.log(`✅ Loaded ${tasks.length} tasks`);
            displayTasks(tasks);
        } else {
            console.error('❌ Failed to load tasks');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Display Tasks
function displayTasks(tasksToDisplay) {
    console.log('🎨 Displaying tasks:', tasksToDisplay.length);
    
    const todoCol = document.getElementById('todoColumn');
    const progressCol = document.getElementById('inProgressColumn');
    const doneCol = document.getElementById('completedColumn');
    
    if (todoCol) todoCol.innerHTML = '';
    if (progressCol) progressCol.innerHTML = '';
    if (doneCol) doneCol.innerHTML = '';
    
    tasksToDisplay.forEach(task => {
        const card = createTaskCard(task);
        
        if (task.status === 'todo' && todoCol) {
            todoCol.appendChild(card);
        } else if (task.status === 'in-progress' && progressCol) {
            progressCol.appendChild(card);
        } else if (task.status === 'completed' && doneCol) {
            doneCol.appendChild(card);
        }
    });
    
    if (tasksToDisplay.length === 0 && todoCol) {
        todoCol.innerHTML = '<p class="text-muted text-center">No tasks yet!</p>';
    }
}

// Create Task Card
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.taskId = task._id;
    
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date';
    const isAutomated = task.isRecurring === true;
    
    const automationBadge = isAutomated ? 
        `<span class="badge bg-info text-white ms-2">🤖 ${task.recurringFrequency || 'daily'}</span>` : '';
    
    const priorityClass = task.priority === 'high' ? 'bg-danger' : 
                         task.priority === 'medium' ? 'bg-warning' : 'bg-info';
    
    card.innerHTML = `
        <div class="mb-2">
            <h6 class="mb-0 d-inline">${escapeHtml(task.title)}</h6>
            ${automationBadge}
        </div>
        <p class="task-description mb-2">${escapeHtml(task.description || 'No description')}</p>
        <div class="mb-2">
            <span class="badge ${priorityClass} text-white me-1">
                ${task.priority.toUpperCase()}
            </span>
            <span class="badge bg-light text-dark">
                📅 ${dueDate}
            </span>
        </div>
        <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" onclick="openEditTaskModal('${task._id}')">
                ✏️ Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${task._id}')">
                🗑️ Delete
            </button>
        </div>
    `;
    
    if (isAutomated) {
        card.style.borderLeft = '4px solid #0dcaf0';
    }
    
    return card;
}

// Delete Task
async function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    
    console.log('🗑️ Deleting:', taskId);
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Deleted');
            alert('✅ Task deleted');
            await loadTasks();
        } else {
            alert('❌ Failed to delete');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Connection error');
    }
}

// Filter Tasks
function filterTasks(filter) {
    console.log('🔍 Filter:', filter);
    
    if (filter === 'all') {
        displayTasks(tasks);
        return;
    }
    
    const filtered = tasks.filter(task => {
        if (filter === 'today') {
            const today = new Date().toDateString();
            const taskDate = task.dueDate ? new Date(task.dueDate).toDateString() : '';
            return taskDate === today;
        }
        if (filter === 'overdue') {
            const now = new Date();
            const taskDate = task.dueDate ? new Date(task.dueDate) : null;
            return taskDate && taskDate < now && task.status !== 'completed';
        }
        return task.priority === filter;
    });
    
    displayTasks(filtered);
}

// Search Tasks
function searchTasks(query) {
    if (!query.trim()) {
        displayTasks(tasks);
        return;
    }
    
    const filtered = tasks.filter(task => 
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(query.toLowerCase()))
    );
    
    displayTasks(filtered);
}

// Show Automation Rules - FIXED VERSION (was using allTasks, now uses tasks)
function showAutomationRules() {
    console.log('🤖 Showing automation rules');
    
    // FIXED: Changed from allTasks to tasks
    const automatedTasks = tasks.filter(task => task.isRecurring === true);
    
    console.log('Found automated tasks:', automatedTasks.length);
    
    if (automatedTasks.length === 0) {
        alert('❌ No automated tasks found!\n\n' +
              'To create an automated task:\n' +
              '1. Click "Add New Task"\n' +
              '2. Fill in task details\n' +
              '3. Check "🔄 Make this a recurring task"\n' +
              '4. Select frequency (daily/weekly/monthly)\n' +
              '5. Save the task');
        return;
    }
    
    let message = '🤖 AUTOMATED TASKS\n';
    message += '═'.repeat(60) + '\n\n';
    
    automatedTasks.forEach((task, index) => {
        const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        message += `${index + 1}. ${task.title}\n`;
        message += `   📊 Status: ${task.status.replace('-', ' ')}\n`;
        message += `   🔄 Frequency: ${task.recurringFrequency || 'daily'}\n`;
        message += `   📅 Due: ${dueDate}\n`;
        message += `   🎯 Priority: ${task.priority}\n`;
        message += `   📝 ${task.description ? task.description.substring(0, 50) + '...' : 'No description'}\n`;
        message += '\n';
    });
    
    message += '═'.repeat(60) + '\n';
    message += `Total automated tasks: ${automatedTasks.length}\n\n`;
    message += '💡 TIP: Automated tasks have a blue border and 🤖 badge';
    
    alert(message);
}

// Clear Automation Rules
function clearAutomationRules() {
    if (confirm('⚠️ Clear all automation rules?\n\nThis will not delete existing tasks.')) {
        localStorage.removeItem('automationRules');
        alert('✅ Automation rules cleared!');
    }
}

// Helper: Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Make functions globally accessible
window.openEditTaskModal = openEditTaskModal;
window.deleteTask = deleteTask;
window.logout = logout;