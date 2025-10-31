// ========================================
// TASKMATE - DASHBOARD.JS
// Fixed Authentication and Task Management
// ========================================

const API_BASE_URL = 'https://taskmate-backends.onrender.com/api';

console.log('✅ Dashboard script loaded');
console.log('📡 API URL:', API_BASE_URL);

// ========================================
// AUTHENTICATION CHECK
// ========================================
let user = null;

function checkAuth() {
    console.log('🔐 Checking authentication...');
    
    try {
        const userStr = localStorage.getItem('user');
        console.log('📦 Raw user data from localStorage:', userStr);
        
        if (!userStr) {
            console.log('❌ No user data found in localStorage');
            redirectToLogin('No user session found');
            return false;
        }

        user = JSON.parse(userStr);
        console.log('✅ Parsed user data:', user);

        if (!user.token) {
            console.log('❌ No token found in user data');
            redirectToLogin('Invalid session - no token');
            return false;
        }

        console.log('✅ User authenticated:', user.name);
        console.log('🎫 Token present:', user.token.substring(0, 20) + '...');
        
        // Update UI with user info
        document.getElementById('userName').textContent = user.name;
        
        return true;

    } catch (error) {
        console.error('❌ Auth check error:', error);
        redirectToLogin('Session error');
        return false;
    }
}

function redirectToLogin(reason) {
    console.log('🔄 Redirecting to login:', reason);
    alert('Please login first!');
    localStorage.removeItem('user'); // Clear invalid session
    window.location.href = 'login.html';
}

// Run auth check immediately
if (!checkAuth()) {
    console.log('❌ Auth check failed, stopping script execution');
    throw new Error('Authentication required');
}

// ========================================
// GLOBAL VARIABLES
// ========================================
let tasks = [];
let automationRules = [];

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOM Content Loaded');
    
    // Load tasks and automation rules
    await loadTasks();
    loadAutomationRules();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for automated task creation
    checkAndCreateAutomatedTasks();
    
    console.log('✅ Dashboard initialized successfully');
});

// ========================================
// TASK LOADING
// ========================================
async function loadTasks() {
    console.log('📥 Loading tasks...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 Tasks response status:', response.status);

        if (!response.ok) {
            if (response.status === 401) {
                redirectToLogin('Session expired');
                return;
            }
            throw new Error('Failed to load tasks');
        }

        const data = await response.json();
        console.log('✅ Tasks loaded:', data);

        tasks = data.tasks || [];
        console.log('📦 Total tasks:', tasks.length);
        
        renderTasks();

    } catch (error) {
        console.error('❌ Error loading tasks:', error);
        showAlert('Failed to load tasks: ' + error.message, 'error');
    }
}

// ========================================
// TASK RENDERING
// ========================================
function renderTasks() {
    console.log('🎨 Rendering tasks...');
    
    const todoContainer = document.getElementById('todoTasks');
    const inProgressContainer = document.getElementById('inProgressTasks');
    const doneContainer = document.getElementById('doneTasks');

    // Clear existing tasks
    todoContainer.innerHTML = '';
    inProgressContainer.innerHTML = '';
    doneContainer.innerHTML = '';

    // Filter and render tasks by status
    const todoTasks = tasks.filter(t => t.status === 'To-Do');
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
    const doneTasks = tasks.filter(t => t.status === 'Done');

    console.log('📊 Task counts - To-Do:', todoTasks.length, 'In Progress:', inProgressTasks.length, 'Done:', doneTasks.length);

    todoTasks.forEach(task => todoContainer.appendChild(createTaskCard(task)));
    inProgressTasks.forEach(task => inProgressContainer.appendChild(createTaskCard(task)));
    doneTasks.forEach(task => doneContainer.appendChild(createTaskCard(task)));

    // Update counters
    updateTaskCounters();
}

function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.taskId = task._id;

    // Check if this is an automated task
    const isAutomated = task.title && task.title.includes('🔄');
    const automationBadge = isAutomated ? '<span class="automation-badge">🔄 Automated</span>' : '';

    card.innerHTML = `
        <div class="task-header">
            <h3>${task.title}</h3>
            ${automationBadge}
            <span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
        </div>
        <p class="task-description">${task.description}</p>
        <div class="task-footer">
            <span class="due-date">📅 ${formatDate(task.dueDate)}</span>
            <div class="task-actions">
                <button class="btn-edit" onclick="editTask('${task._id}')">✏️</button>
                <button class="btn-delete" onclick="deleteTask('${task._id}')">🗑️</button>
            </div>
        </div>
    `;

    return card;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function updateTaskCounters() {
    const todoCount = tasks.filter(t => t.status === 'To-Do').length;
    const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
    const doneCount = tasks.filter(t => t.status === 'Done').length;

    document.getElementById('todoCount').textContent = todoCount;
    document.getElementById('inProgressCount').textContent = inProgressCount;
    document.getElementById('doneCount').textContent = doneCount;
}

// ========================================
// EVENT LISTENERS
// ========================================
function setupEventListeners() {
    console.log('🎯 Setting up event listeners...');

    // Add Task button
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            console.log('➕ Add Task button clicked');
            openTaskModal();
        });
    }

    // Task Modal
    const taskModal = document.getElementById('taskModal');
    const closeModalBtn = document.querySelector('.close-modal');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            console.log('❌ Close modal clicked');
            closeTaskModal();
        });
    }

    // Close modal on outside click
    if (taskModal) {
        taskModal.addEventListener('click', (e) => {
            if (e.target === taskModal) {
                closeTaskModal();
            }
        });
    }

    // Task Form
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('💾 Task form submitted');
            await saveTask();
        });
    }

    // Recurring task checkbox
    const recurringCheckbox = document.getElementById('recurringTask');
    const frequencyGroup = document.getElementById('frequencyGroup');
    
    if (recurringCheckbox && frequencyGroup) {
        recurringCheckbox.addEventListener('change', () => {
            console.log('🔄 Recurring checkbox changed:', recurringCheckbox.checked);
            frequencyGroup.style.display = recurringCheckbox.checked ? 'block' : 'none';
        });
    }

    // View Automations button
    const viewAutomationsBtn = document.getElementById('viewAutomationsBtn');
    if (viewAutomationsBtn) {
        viewAutomationsBtn.addEventListener('click', () => {
            console.log('🤖 View Automations clicked');
            viewAutomations();
        });
    }

    // Clear Rules button
    const clearRulesBtn = document.getElementById('clearRulesBtn');
    if (clearRulesBtn) {
        clearRulesBtn.addEventListener('click', () => {
            console.log('🗑️ Clear Rules clicked');
            clearAutomationRules();
        });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('🔍 Filter clicked:', btn.dataset.filter);
            filterTasks(btn.dataset.filter);
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('👋 Logout clicked');
            logout();
        });
    }

    console.log('✅ Event listeners attached');
}

// ========================================
// TASK CRUD OPERATIONS
// ========================================
function openTaskModal(task = null) {
    const modal = document.getElementById('taskModal');
    const form = document.getElementById('taskForm');
    const title = document.getElementById('modalTitle');
    
    if (task) {
        // Edit mode
        title.textContent = 'Edit Task';
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        document.getElementById('taskPriority').value = task.priority;
        document.getElementById('taskStatus').value = task.status;
        document.getElementById('taskDueDate').value = task.dueDate.split('T')[0];
        form.dataset.taskId = task._id;
    } else {
        // Create mode
        title.textContent = 'Add New Task';
        form.reset();
        delete form.dataset.taskId;
        document.getElementById('frequencyGroup').style.display = 'none';
    }

    modal.style.display = 'flex';
}

function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    modal.style.display = 'none';
}

async function saveTask() {
    const form = document.getElementById('taskForm');
    const taskId = form.dataset.taskId;

    const taskData = {
        title: document.getElementById('taskTitle').value.trim(),
        description: document.getElementById('taskDescription').value.trim(),
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        dueDate: document.getElementById('taskDueDate').value
    };

    const isRecurring = document.getElementById('recurringTask').checked;
    const frequency = document.getElementById('taskFrequency').value;

    console.log('💾 Saving task:', taskData);
    console.log('🔄 Is recurring:', isRecurring, 'Frequency:', frequency);

    try {
        const url = taskId 
            ? `${API_BASE_URL}/tasks/${taskId}`
            : `${API_BASE_URL}/tasks`;

        const method = taskId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            throw new Error('Failed to save task');
        }

        const data = await response.json();
        console.log('✅ Task saved:', data);

        // If recurring, create automation rule
        if (isRecurring && !taskId) {
            createAutomationRule(data.task, frequency);
        }

        showAlert(
            taskId ? 'Task updated successfully!' : 
            isRecurring ? 'Task created successfully 🤖 Automation enabled!' : 
            'Task created successfully!',
            'success'
        );

        closeTaskModal();
        await loadTasks();

    } catch (error) {
        console.error('❌ Error saving task:', error);
        showAlert('Failed to save task: ' + error.message, 'error');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    console.log('🗑️ Deleting task:', taskId);

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete task');
        }

        console.log('✅ Task deleted');
        showAlert('Task deleted successfully!', 'success');
        await loadTasks();

    } catch (error) {
        console.error('❌ Error deleting task:', error);
        showAlert('Failed to delete task: ' + error.message, 'error');
    }
}

function editTask(taskId) {
    console.log('✏️ Editing task:', taskId);
    const task = tasks.find(t => t._id === taskId);
    if (task) {
        openTaskModal(task);
    }
}

// ========================================
// AUTOMATION SYSTEM
// ========================================
function loadAutomationRules() {
    const rulesStr = localStorage.getItem('automationRules');
    automationRules = rulesStr ? JSON.parse(rulesStr) : [];
    console.log('🤖 Loaded automation rules:', automationRules.length);
}

function createAutomationRule(task, frequency) {
    const rule = {
        id: Date.now().toString(),
        taskTemplate: {
            title: task.title + ' 🔄',
            description: task.description,
            priority: task.priority,
            status: 'To-Do'
        },
        frequency: frequency,
        lastCreated: new Date().toISOString(),
        active: true
    };

    automationRules.push(rule);
    localStorage.setItem('automationRules', JSON.stringify(automationRules));
    console.log('✅ Automation rule created:', rule);
}

async function checkAndCreateAutomatedTasks() {
    console.log('🤖 Checking for automated tasks...');
    
    const now = new Date();

    for (const rule of automationRules) {
        if (!rule.active) continue;

        const lastCreated = new Date(rule.lastCreated);
        const daysSinceCreation = (now - lastCreated) / (1000 * 60 * 60 * 24);

        console.log(`📊 Rule "${rule.taskTemplate.title}" - Days since last: ${daysSinceCreation.toFixed(2)}`);

        let shouldCreate = false;

        switch(rule.frequency) {
            case 'daily':
                shouldCreate = daysSinceCreation >= 1;
                break;
            case 'weekly':
                shouldCreate = daysSinceCreation >= 7;
                break;
            case 'monthly':
                shouldCreate = daysSinceCreation >= 30;
                break;
        }

        if (shouldCreate) {
            console.log('✅ Creating automated task:', rule.taskTemplate.title);
            await createAutomatedTask(rule);
            rule.lastCreated = now.toISOString();
            localStorage.setItem('automationRules', JSON.stringify(automationRules));
        }
    }
}

async function createAutomatedTask(rule) {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const taskData = {
            ...rule.taskTemplate,
            dueDate: tomorrow.toISOString().split('T')[0]
        };

        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            showAlert(`🤖 Automated task created: ${rule.taskTemplate.title}`, 'success');
            await loadTasks();
        }

    } catch (error) {
        console.error('❌ Error creating automated task:', error);
    }
}

function viewAutomations() {
    if (automationRules.length === 0) {
        showAlert('No automation rules found. Create a recurring task to enable automation!', 'info');
        return;
    }

    const rulesList = automationRules.map((rule, index) => 
        `${index + 1}. ${rule.taskTemplate.title} - ${rule.frequency}`
    ).join('\n');

    alert(`Active Automation Rules:\n\n${rulesList}`);
}

function clearAutomationRules() {
    if (confirm('Are you sure you want to clear all automation rules?')) {
        localStorage.removeItem('automationRules');
        automationRules = [];
        showAlert('All automation rules cleared!', 'success');
        console.log('🗑️ Automation rules cleared');
    }
}

// ========================================
// FILTER FUNCTIONALITY
// ========================================
function filterTasks(filter) {
    console.log('🔍 Filtering tasks by:', filter);
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter task cards
    const allCards = document.querySelectorAll('.task-card');
    
    allCards.forEach(card => {
        if (filter === 'all') {
            card.style.display = 'block';
        } else {
            const taskId = card.dataset.taskId;
            const task = tasks.find(t => t._id === taskId);
            
            if (task && task.status === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(alert);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

function logout() {
    console.log('👋 Logging out...');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

console.log('✅ Dashboard script fully loaded');