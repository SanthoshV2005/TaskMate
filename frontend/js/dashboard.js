// ========================================
// TASKMATE - DASHBOARD.JS
// Complete Working Version with Automation
// ========================================

// API Configuration
const API_BASE_URL = 'https://taskmate-backends.onrender.com/api';

// Check if user is logged in
let user = JSON.parse(localStorage.getItem('user'));
if (!user || !user.token) {
    alert('Please login first!');
    window.location.href = 'login.html';
}

// Global Variables
let allTasks = [];
let editingTaskId = null;
let taskModal;

// Page Load Event
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Dashboard Loaded');
    console.log('User:', user.name);
    
    // Initialize modal
    taskModal = new bootstrap.Modal(document.getElementById('taskModal'));
    
    // Set user name
    document.getElementById('userName').textContent = user.name;
    
    // Setup buttons
    document.getElementById('logoutBtn').onclick = logout;
    document.getElementById('addTaskBtn').onclick = openAddTaskModal;
    document.getElementById('taskForm').onsubmit = saveTask;
    
    // Recurring checkbox toggle
    document.getElementById('recurringTask').onchange = function(e) {
        document.getElementById('recurringOptions').style.display = 
            e.target.checked ? 'block' : 'none';
    };
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.filter-btn').forEach(b => 
                b.classList.remove('active'));
            this.classList.add('active');
            filterTasks(this.dataset.filter);
        };
    });
    
    // Automation buttons
    const viewBtn = document.getElementById('viewAutomationsBtn');
    if (viewBtn) viewBtn.onclick = showAutomationRules;
    
    const clearBtn = document.getElementById('clearAutomationsBtn');
    if (clearBtn) clearBtn.onclick = clearAutomationRules;
    
    // Load tasks
    loadTasks();
    
    // Check automations
    checkAutomatedTasks();
    setInterval(checkAutomatedTasks, 5 * 60 * 1000);
});

// Open Add Task Modal
function openAddTaskModal() {
    console.log('Opening add task modal...');
    editingTaskId = null;
    document.getElementById('taskForm').reset();
    document.getElementById('modalTitle').textContent = 'Add New Task';
    document.getElementById('saveTaskBtn').textContent = 'Save Task';
    document.getElementById('recurringOptions').style.display = 'none';
    taskModal.show();
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

        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }

        const data = await response.json();
        allTasks = data.tasks || data || [];
        
        console.log(`✅ Loaded ${allTasks.length} tasks`);
        displayTasks(allTasks);
        updateStats();
    } catch (error) {
        console.error('❌ Error:', error);
        showAlert('Failed to load tasks. Check your connection.', 'danger');
    }
}

// Display Tasks
function displayTasks(tasks) {
    const todo = document.getElementById('todoColumn');
    const progress = document.getElementById('inProgressColumn');
    const completed = document.getElementById('completedColumn');
    
    todo.innerHTML = '';
    progress.innerHTML = '';
    completed.innerHTML = '';

    if (tasks.length === 0) {
        todo.innerHTML = '<p class="text-muted">No tasks yet!</p>';
        return;
    }

    tasks.forEach(task => {
        const card = createTaskCard(task);
        
        if (task.status === 'To-Do') todo.appendChild(card);
        else if (task.status === 'In Progress') progress.appendChild(card);
        else if (task.status === 'Completed') completed.appendChild(card);
    });
}

// Create Task Card
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    
    const priorityColor = task.priority === 'High' ? 'danger' : 
                         task.priority === 'Medium' ? 'warning' : 'success';
    
    const dueDate = task.dueDate ? 
        new Date(task.dueDate).toLocaleDateString() : 'No due date';
    
    const isAuto = task.title.includes('🔄') || task.isRecurring;
    const autoBadge = isAuto ? '<span class="badge bg-primary ms-1">🔄</span>' : '';
    
    card.innerHTML = `
        <div class="task-card-header">
            <h5 class="task-title">${task.title} ${autoBadge}</h5>
            <span class="badge bg-${priorityColor}">${task.priority}</span>
        </div>
        <p class="task-description">${task.description}</p>
        <div class="task-meta">
            <small><i class="fas fa-calendar"></i> ${dueDate}</small>
        </div>
        <div class="task-actions">
            <button class="btn btn-sm btn-outline-primary" onclick="editTask('${task._id}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteTask('${task._id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    return card;
}

// Save Task
async function saveTask(e) {
    e.preventDefault();
    console.log('💾 Saving task...');
    
    const btn = document.getElementById('saveTaskBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    
    const taskData = {
        title: document.getElementById('taskTitle').value.trim(),
        description: document.getElementById('taskDescription').value.trim(),
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        dueDate: document.getElementById('taskDueDate').value || null,
        isRecurring: document.getElementById('recurringTask').checked,
        recurringFrequency: document.getElementById('recurringTask').checked ? 
            document.getElementById('recurringFrequency').value : null
    };
    
    if (!taskData.title) {
        showAlert('Please enter a task title', 'warning');
        btn.disabled = false;
        btn.textContent = 'Save Task';
        return;
    }
    
    try {
        const url = editingTaskId ? 
            `${API_BASE_URL}/tasks/${editingTaskId}` : 
            `${API_BASE_URL}/tasks`;
        
        const method = editingTaskId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to save task');
        }
        
        const data = await response.json();
        console.log('✅ Task saved!');
        
        // Save automation rule
        if (taskData.isRecurring) {
            saveAutomationRule(data.task || data);
        }
        
        showAlert(
            `Task ${editingTaskId ? 'updated' : 'created'} successfully! ${
                taskData.isRecurring ? '🤖 Automation enabled!' : ''
            }`, 
            'success'
        );
        
        taskModal.hide();
        document.getElementById('taskForm').reset();
        document.getElementById('recurringOptions').style.display = 'none';
        loadTasks();
        
    } catch (error) {
        console.error('❌ Error:', error);
        showAlert('Failed to save task', 'danger');
    } finally {
        btn.disabled = false;
        btn.textContent = editingTaskId ? 'Update Task' : 'Save Task';
    }
}

// Edit Task
function editTask(taskId) {
    const task = allTasks.find(t => t._id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    
    document.getElementById('taskTitle').value = task.title.replace(' 🔄', '');
    document.getElementById('taskDescription').value = task.description;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskDueDate').value = task.dueDate ? 
        task.dueDate.split('T')[0] : '';
    
    const recurring = document.getElementById('recurringTask');
    const options = document.getElementById('recurringOptions');
    
    if (task.isRecurring) {
        recurring.checked = true;
        options.style.display = 'block';
        document.getElementById('recurringFrequency').value = 
            task.recurringFrequency || 'daily';
    } else {
        recurring.checked = false;
        options.style.display = 'none';
    }
    
    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('saveTaskBtn').textContent = 'Update Task';
    taskModal.show();
}

// Delete Task
async function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        removeAutomationRule(taskId);
        showAlert('Task deleted!', 'success');
        loadTasks();
    } catch (error) {
        showAlert('Failed to delete task', 'danger');
    }
}

// Filter Tasks
function filterTasks(filter) {
    const filtered = filter === 'all' ? allTasks : 
        allTasks.filter(t => t.priority === filter);
    displayTasks(filtered);
}

// Update Stats
function updateStats() {
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === 'Completed').length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
    document.getElementById('completionRate').textContent = rate + '%';
}

// ===================
// AUTOMATION FEATURES
// ===================

// Save Automation Rule
function saveAutomationRule(task) {
    const rules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    
    const rule = {
        taskId: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        frequency: task.recurringFrequency,
        lastCreated: new Date().toISOString()
    };
    
    // Remove old rule if exists
    const filtered = rules.filter(r => r.taskId !== task._id);
    filtered.push(rule);
    
    localStorage.setItem('automationRules', JSON.stringify(filtered));
    console.log('✅ Automation rule saved');
}

// Check Automated Tasks
async function checkAutomatedTasks() {
    const rules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    if (rules.length === 0) return;
    
    console.log('🤖 Checking automations...');
    
    for (const rule of rules) {
        const lastCreated = new Date(rule.lastCreated);
        const now = new Date();
        const hoursDiff = (now - lastCreated) / (1000 * 60 * 60);
        
        let shouldCreate = false;
        
        if (rule.frequency === 'daily' && hoursDiff >= 24) shouldCreate = true;
        else if (rule.frequency === 'weekly' && hoursDiff >= 168) shouldCreate = true;
        else if (rule.frequency === 'monthly' && hoursDiff >= 720) shouldCreate = true;
        
        if (shouldCreate) {
            await createAutomatedTask(rule);
        }
    }
}

// Create Automated Task
async function createAutomatedTask(rule) {
    const newTask = {
        title: `🔄 ${rule.title}`,
        description: rule.description,
        priority: rule.priority,
        status: 'To-Do',
        dueDate: null,
        isRecurring: true,
        recurringFrequency: rule.frequency
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(newTask)
        });
        
        if (response.ok) {
            console.log('✅ Auto-created:', rule.title);
            
            // Update last created time
            const rules = JSON.parse(localStorage.getItem('automationRules'));
            const updated = rules.map(r => 
                r.taskId === rule.taskId ? 
                {...r, lastCreated: new Date().toISOString()} : r
            );
            localStorage.setItem('automationRules', JSON.stringify(updated));
            
            showAlert(`🤖 Automated task created: ${rule.title}`, 'success');
            loadTasks();
        }
    } catch (error) {
        console.error('❌ Auto-create error:', error);
    }
}

// Show Automation Rules
function showAutomationRules() {
    const rules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    
    if (rules.length === 0) {
        alert('No automation rules active yet.\n\nCreate a recurring task to set up automation!');
        return;
    }
    
    let message = '🤖 Active Automation Rules:\n\n';
    rules.forEach((rule, i) => {
        const lastDate = new Date(rule.lastCreated).toLocaleDateString();
        message += `${i + 1}. ${rule.title} 🔄\n`;
        message += `   Frequency: ${rule.frequency}\n`;
        message += `   Priority: ${rule.priority}\n`;
        message += `   Last created: ${lastDate}\n\n`;
    });
    message += '💡 Tasks are checked every 5 minutes and on page load.';
    
    alert(message);
}

// Clear Automation Rules
function clearAutomationRules() {
    if (!confirm('Clear all automation rules?')) return;
    
    localStorage.removeItem('automationRules');
    showAlert('All automation rules cleared!', 'info');
}

// Remove Automation Rule
function removeAutomationRule(taskId) {
    const rules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    const filtered = rules.filter(r => r.taskId !== taskId);
    localStorage.setItem('automationRules', JSON.stringify(filtered));
}

// ===================
// UTILITY FUNCTIONS
// ===================

// Show Alert
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.minWidth = '300px';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

console.log('✅ Dashboard script loaded successfully!');