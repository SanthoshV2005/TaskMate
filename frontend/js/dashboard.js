// ========================================
// TASKMATE - DASHBOARD.JS
// FINAL FIX - Handles both response formats
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

// Open Edit Task Modal
function openEditTaskModal(taskId) {
    console.log('✏️ Opening edit modal for:', taskId);
    currentEditingTaskId = taskId;
    
    const task = tasks.find(t => t._id === taskId);
    if (!task) {
        alert('❌ Task not found');
        return;
    }
    
    console.log('📝 Editing task:', task);
    console.log('🔄 isRecurring:', task.isRecurring, typeof task.isRecurring);
    
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
    
    // 🔧 FIX: Handle recurring - check both boolean and string
    const isRecurring = task.isRecurring === true || task.isRecurring === 'true';
    document.getElementById('isRecurring').checked = isRecurring;
    document.getElementById('recurringFrequency').value = task.recurringFrequency || 'daily';
    document.getElementById('frequencyGroup').style.display = isRecurring ? 'block' : 'none';
    
    console.log('✅ Set recurring checkbox to:', isRecurring);
    
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
    const isRecurringCheckbox = document.getElementById('isRecurring');
    const isRecurring = isRecurringCheckbox ? isRecurringCheckbox.checked : false;
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
        isRecurring: isRecurring,  // 🔧 Boolean value
        recurringFrequency: isRecurring ? frequency : null
    };
    
    console.log('📤 Task data to save:', taskData);
    console.log('🔄 isRecurring type:', typeof taskData.isRecurring, 'value:', taskData.isRecurring);
    
    try {
        let response;
        
        if (currentEditingTaskId) {
            console.log('🔄 Updating task:', currentEditingTaskId);
            response = await fetch(`${API_BASE_URL}/tasks/${currentEditingTaskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(taskData)
            });
        } else {
            console.log('➕ Creating new task');
            response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(taskData)
            });
        }
        
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Task saved:', result);
            console.log('🔄 Saved isRecurring:', result.isRecurring, typeof result.isRecurring);
            
            const message = currentEditingTaskId 
                ? '✅ Task updated successfully!' 
                : `✅ Task created successfully! ${isRecurring ? '🤖 Automation enabled!' : ''}`;
            alert(message);
            
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

// 🔧 FIX: Load Tasks - Handle both response formats
async function loadTasks() {
    console.log('📥 Loading tasks from API...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('📦 Raw API response:', data);
            
            // 🔧 FIX: Handle both formats - array or object with tasks property
            if (Array.isArray(data)) {
                tasks = data;
                console.log('✅ Response is direct array');
            } else if (data.tasks && Array.isArray(data.tasks)) {
                tasks = data.tasks;
                console.log('✅ Response has tasks property');
            } else {
                console.error('❌ Unexpected response format:', data);
                tasks = [];
            }
            
            console.log(`✅ Loaded ${tasks.length} tasks`);
            
            // Debug: Log all tasks with their isRecurring status
            tasks.forEach((task, index) => {
                console.log(`Task ${index + 1}: "${task.title}" - isRecurring:`, 
                    task.isRecurring, 
                    `(type: ${typeof task.isRecurring})`);
            });
            
            // Count automated tasks (check both boolean and string)
            const automatedCount = tasks.filter(t => 
                t.isRecurring === true || t.isRecurring === 'true'
            ).length;
            console.log(`🤖 Found ${automatedCount} automated tasks`);
            
            displayTasks(tasks);
        } else {
            console.error('❌ Failed to load tasks, status:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
        }
    } catch (error) {
        console.error('❌ Error loading tasks:', error);
    }
}

// Display Tasks
function displayTasks(tasksToDisplay) {
    console.log('🎨 Displaying', tasksToDisplay.length, 'tasks');
    
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
    
    // 🔧 FIX: Check both boolean and string for automation
    const isAutomated = task.isRecurring === true || task.isRecurring === 'true';
    
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
        card.style.background = 'linear-gradient(to right, rgba(13, 202, 240, 0.05), white)';
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

// 🔧 FIX: Show Automation Rules - Check both formats
function showAutomationRules() {
    console.log('🤖 Showing automation rules from database...');
    console.log('📊 Total tasks:', tasks.length);
    
    // Debug all tasks
    tasks.forEach((task, i) => {
        console.log(`Task ${i + 1}: "${task.title}" - isRecurring:`, task.isRecurring, typeof task.isRecurring);
    });
    
    // 🔧 FIX: Filter tasks checking both boolean and string
    const automatedTasks = tasks.filter(task => 
        task.isRecurring === true || task.isRecurring === 'true'
    );
    
    console.log('🤖 Found automated tasks in database:', automatedTasks.length);
    
    if (automatedTasks.length === 0) {
        alert('❌ No automated tasks found!\n\n' +
              'To create an automated task:\n' +
              '1. Click "Add New Task"\n' +
              '2. Fill in task details\n' +
              '3. ✅ Check "🔄 Make this a recurring task"\n' +
              '4. Select frequency (daily/weekly/monthly)\n' +
              '5. Click "Save Task"\n\n' +
              'The task will show a blue 🤖 badge when automated.');
        return;
    }
    
    // Build detailed message
    let message = '🤖 AUTOMATED TASKS FROM DATABASE\n';
    message += '═'.repeat(60) + '\n\n';
    
    automatedTasks.forEach((task, index) => {
        const dueDate = new Date(task.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        const statusDisplay = task.status.replace('-', ' ').toUpperCase();
        
        message += `${index + 1}. ${task.title}\n`;
        message += `   📊 Status: ${statusDisplay}\n`;
        message += `   🔄 Frequency: ${(task.recurringFrequency || 'daily').toUpperCase()}\n`;
        message += `   📅 Due Date: ${dueDate}\n`;
        message += `   🎯 Priority: ${task.priority.toUpperCase()}\n`;
        
        if (task.description) {
            const shortDesc = task.description.length > 50 
                ? task.description.substring(0, 50) + '...' 
                : task.description;
            message += `   📝 Description: ${shortDesc}\n`;
        }
        
        message += '\n';
    });
    
    message += '═'.repeat(60) + '\n';
    message += `Total automated tasks: ${automatedTasks.length}\n\n`;
    message += '💡 TIP: These tasks persist across logins!\n';
    message += 'Look for the blue 🤖 badge on your dashboard.';
    
    alert(message);
}

// Clear Automation Rules
async function clearAutomationRules() {
    console.log('🧹 Clearing automation rules...');
    
    const automatedTasks = tasks.filter(task => 
        task.isRecurring === true || task.isRecurring === 'true'
    );
    
    if (automatedTasks.length === 0) {
        alert('ℹ️ No automated tasks to clear!');
        return;
    }
    
    const confirmMessage = `⚠️ WARNING: Remove automation from ${automatedTasks.length} task(s)?\n\n` +
                          `Tasks will remain, but won't be recurring.\n\n` +
                          `Tasks to be affected:\n` +
                          automatedTasks.map((t, i) => `${i + 1}. ${t.title}`).join('\n') +
                          `\n\nContinue?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Update all automated tasks
    try {
        const updatePromises = automatedTasks.map(task =>
            fetch(`${API_BASE_URL}/tasks/${task._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    ...task,
                    isRecurring: false,
                    recurringFrequency: null
                })
            })
        );
        
        const results = await Promise.all(updatePromises);
        const successCount = results.filter(r => r.ok).length;
        
        console.log(`✅ Removed automation from ${successCount}/${automatedTasks.length} tasks`);
        
        await loadTasks();
        alert(`✅ Removed automation from ${successCount} task(s)!`);
        
    } catch (error) {
        console.error('❌ Error clearing automations:', error);
        alert('❌ Error updating tasks');
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