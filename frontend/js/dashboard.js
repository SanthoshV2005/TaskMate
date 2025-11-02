// ========================================
// TASKMATE - DASHBOARD.JS
// Complete Working Version with Fixed Auth & Modal
// ========================================

// API Configuration
const API_BASE_URL = 'https://taskmate-backends.onrender.com/api';

console.log('✅ Dashboard script loaded');
console.log('📡 API URL:', API_BASE_URL);

// CRITICAL: Check if user is logged in FIRST
function checkAuthentication() {
    const userStr = localStorage.getItem('user');
    console.log('Checking authentication...');
    console.log('Raw user data:', userStr);
    
    if (!userStr) {
        console.log('❌ No user data found - redirecting to login');
        window.location.href = 'login.html';
        return null;
    }
    
    try {
        const user = JSON.parse(userStr);
        console.log('Parsed user:', user);
        
        if (!user.token) {
            console.log('❌ No token found - redirecting to login');
            window.location.href = 'login.html';
            return null;
        }
        
        console.log('✅ User authenticated:', user.name);
        return user;
    } catch (error) {
        console.error('❌ Error parsing user data:', error);
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return null;
    }
}

// Check authentication immediately
let user = checkAuthentication();
if (!user) {
    throw new Error('Not authenticated');
}

console.log('✅ Dashboard Loaded');
console.log('👤 User:', user.name);

// Global variables
let tasks = [];
let taskModal;
let currentEditingTaskId = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM Content Loaded');
    
    // Double-check authentication after DOM loads
    user = checkAuthentication();
    if (!user) return;
    
    // Initialize Bootstrap Modal with proper settings
    const modalElement = document.getElementById('taskModal');
    if (modalElement) {
        taskModal = new bootstrap.Modal(modalElement, {
            backdrop: 'static', // Prevent closing by clicking outside
            keyboard: true,     // Allow ESC key to close
            focus: true         // Focus on modal when opened
        });
        console.log('✅ Modal initialized');
        
        // Fix modal focus issues
        modalElement.addEventListener('shown.bs.modal', function () {
            console.log('Modal shown event fired');
            // Small delay to ensure modal is fully rendered
            setTimeout(() => {
                const titleInput = document.getElementById('taskTitle');
                if (titleInput) {
                    titleInput.focus();
                    console.log('Focus set to title input');
                }
            }, 100);
        });
        
        // Handle modal backdrop issues
        modalElement.addEventListener('hidden.bs.modal', function () {
            console.log('Modal hidden');
            // Remove any lingering backdrops
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        });
    }
    
    // Set user name in navbar
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load tasks
    loadTasks();
    
    // Check for automated tasks on load
    checkAutomatedTasks();
});

// Setup all event listeners
function setupEventListeners() {
    console.log('🔌 Setting up event listeners...');
    
    // Add Task Button
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAddTaskModal();
        });
        console.log('✅ Add Task button listener attached');
    }
    
    // Save Task Button
    const saveTaskBtn = document.getElementById('saveTaskBtn');
    if (saveTaskBtn) {
        saveTaskBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveTask(e);
        });
        console.log('✅ Save Task button listener attached');
    }
    
    // Cancel Button (additional way to close modal)
    const cancelBtn = document.querySelector('[data-bs-dismiss="modal"]');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (taskModal) taskModal.hide();
        });
    }
    
    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
        console.log('✅ Logout button listener attached');
    }
    
    // View Automations Button
    const viewAutomationsBtn = document.getElementById('viewAutomationsBtn');
    if (viewAutomationsBtn) {
        viewAutomationsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAutomationRules();
        });
        console.log('✅ View Automations button listener attached');
    }
    
    // Clear Automations Button
    const clearAutomationsBtn = document.getElementById('clearAutomationsBtn');
    if (clearAutomationsBtn) {
        clearAutomationsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearAutomationRules();
        });
        console.log('✅ Clear Automations button listener attached');
    }
    
    // Recurring Task Checkbox
    const recurringCheckbox = document.getElementById('isRecurring');
    if (recurringCheckbox) {
        recurringCheckbox.addEventListener('change', function() {
            const frequencyGroup = document.getElementById('frequencyGroup');
            if (frequencyGroup) {
                if (this.checked) {
                    frequencyGroup.style.display = 'block';
                    console.log('Frequency group shown');
                } else {
                    frequencyGroup.style.display = 'none';
                    console.log('Frequency group hidden');
                }
            }
        });
        console.log('✅ Recurring checkbox listener attached');
    }
    
    // Filter Buttons
    const filterButtons = document.querySelectorAll('[data-filter]');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterTasks(filter);
            
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    console.log('✅ Filter buttons listener attached');
    
    // Search Input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchTasks(this.value);
        });
        console.log('✅ Search input listener attached');
    }
}

// Open Add Task Modal
function openAddTaskModal() {
    console.log('Opening add task modal...');
    currentEditingTaskId = null;
    
    // Clear form
    const form = document.getElementById('taskForm');
    if (form) form.reset();
    
    // Hide frequency group
    const frequencyGroup = document.getElementById('frequencyGroup');
    if (frequencyGroup) frequencyGroup.style.display = 'none';
    
    // Update modal title
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Add New Task';
    
    // Show modal
    if (taskModal) {
        taskModal.show();
        console.log('Modal show() called');
    } else {
        console.error('❌ Modal not initialized!');
    }
}

// Save Task (Create or Update)
async function saveTask(e) {
    if (e) e.preventDefault();
    
    console.log('💾 Saving task...');
    
    // Get form values
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const status = document.getElementById('taskStatus').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const isRecurring = document.getElementById('isRecurring').checked;
    const frequency = document.getElementById('recurringFrequency').value;
    
    // Validation
    if (!title) {
        alert('❌ Please enter a task title');
        document.getElementById('taskTitle').focus();
        return;
    }
    
    // Prepare task data
    const taskData = {
        title,
        description,
        priority,
        status,
        dueDate: dueDate || null,
        isRecurring,
        frequency: isRecurring ? frequency : null
    };
    
    console.log('Task data:', taskData);
    
    try {
        let response;
        
        if (currentEditingTaskId) {
            // Update existing task
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
            // Create new task
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
            const result = await response.json();
            console.log('✅ Task saved:', result);
            
            // If recurring, save automation rule
            if (isRecurring && !currentEditingTaskId) {
                saveAutomationRule(result.task);
            }
            
            // Close modal
            if (taskModal) taskModal.hide();
            
            // Show success message
            const message = currentEditingTaskId 
                ? '✅ Task updated successfully!' 
                : `✅ Task created successfully! ${isRecurring ? '🤖 Automation enabled!' : ''}`;
            alert(message);
            
            // Reload tasks
            await loadTasks();
        } else {
            const error = await response.json();
            console.error('❌ Error saving task:', error);
            alert(`❌ Failed to save task: ${error.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Failed to save task. Please check your connection and try again.');
    }
}

// Load Tasks from API
async function loadTasks() {
    console.log('📥 Loading tasks...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            tasks = data.tasks || [];
            console.log(`✅ Loaded ${tasks.length} tasks`);
            displayTasks(tasks);
        } else if (response.status === 401) {
            console.error('❌ Unauthorized - redirecting to login');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        } else {
            console.error('❌ Failed to load tasks');
            alert('❌ Failed to load tasks');
        }
    } catch (error) {
        console.error('❌ Error loading tasks:', error);
        alert('❌ Failed to load tasks. Please refresh the page.');
    }
}

// Display Tasks in Kanban Board
function displayTasks(tasksToDisplay) {
    console.log('🎨 Displaying tasks:', tasksToDisplay.length);
    
    // Clear all columns
    const todoColumn = document.getElementById('todoColumn');
    const inProgressColumn = document.getElementById('inProgressColumn');
    const completedColumn = document.getElementById('completedColumn');
    
    if (todoColumn) todoColumn.innerHTML = '';
    if (inProgressColumn) inProgressColumn.innerHTML = '';
    if (completedColumn) completedColumn.innerHTML = '';
    
    // Distribute tasks to columns
    tasksToDisplay.forEach(task => {
        const taskCard = createTaskCard(task);
        
        if (task.status === 'todo' && todoColumn) {
            todoColumn.appendChild(taskCard);
        } else if (task.status === 'in-progress' && inProgressColumn) {
            inProgressColumn.appendChild(taskCard);
        } else if (task.status === 'completed' && completedColumn) {
            completedColumn.appendChild(taskCard);
        }
    });
    
    // Show message if no tasks
    if (tasksToDisplay.length === 0) {
        if (todoColumn) {
            todoColumn.innerHTML = '<p class="text-muted text-center">No tasks yet. Create your first task!</p>';
        }
    }
}

// Create Task Card Element
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('data-task-id', task._id);
    
    // Priority badge color
    const priorityColors = {
        'low': 'success',
        'medium': 'warning',
        'high': 'danger'
    };
    
    // Format due date
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
    
    // Automation badge
    const automationBadge = task.isRecurring 
        ? '<span class="badge bg-info ms-2" title="Automated Task">🔄</span>' 
        : '';
    
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="mb-0">${task.title} ${automationBadge}</h6>
            <span class="badge bg-${priorityColors[task.priority]}">${task.priority}</span>
        </div>
        <p class="task-description text-muted small mb-2">${task.description || 'No description'}</p>
        <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">📅 ${dueDate}</small>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary btn-sm" onclick="editTask('${task._id}')" title="Edit">
                    ✏️
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="deleteTask('${task._id}')" title="Delete">
                    🗑️
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Edit Task
async function editTask(taskId) {
    console.log('✏️ Editing task:', taskId);
    currentEditingTaskId = taskId;
    
    const task = tasks.find(t => t._id === taskId);
    if (!task) {
        alert('❌ Task not found');
        return;
    }
    
    // Fill form with task data
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskDueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
    document.getElementById('isRecurring').checked = task.isRecurring || false;
    document.getElementById('recurringFrequency').value = task.frequency || 'daily';
    
    // Show/hide frequency group
    const frequencyGroup = document.getElementById('frequencyGroup');
    if (frequencyGroup) {
        frequencyGroup.style.display = task.isRecurring ? 'block' : 'none';
    }
    
    // Update modal title
    document.getElementById('modalTitle').textContent = 'Edit Task';
    
    // Show modal
    if (taskModal) taskModal.show();
}

// Delete Task
async function deleteTask(taskId) {
    console.log('🗑️ Deleting task:', taskId);
    
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Task deleted');
            alert('✅ Task deleted successfully');
            await loadTasks();
        } else {
            console.error('❌ Failed to delete task');
            alert('❌ Failed to delete task');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ Failed to delete task');
    }
}

// Filter Tasks
function filterTasks(filter) {
    console.log('🔍 Filtering tasks:', filter);
    
    if (filter === 'all') {
        displayTasks(tasks);
    } else {
        const filtered = tasks.filter(task => {
            if (filter === 'today') {
                const today = new Date().toDateString();
                const taskDate = task.dueDate ? new Date(task.dueDate).toDateString() : null;
                return taskDate === today;
            } else if (filter === 'overdue') {
                const now = new Date();
                const taskDate = task.dueDate ? new Date(task.dueDate) : null;
                return taskDate && taskDate < now && task.status !== 'completed';
            } else {
                return task.priority === filter;
            }
        });
        displayTasks(filtered);
    }
}

// Search Tasks
function searchTasks(query) {
    console.log('🔎 Searching tasks:', query);
    
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

// ========================================
// AUTOMATION FEATURES
// ========================================

// Save Automation Rule
function saveAutomationRule(task) {
    console.log('🤖 Saving automation rule for task:', task.title);
    
    const rules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    
    const rule = {
        id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        frequency: task.frequency,
        lastCreated: new Date().toISOString()
    };
    
    rules.push(rule);
    localStorage.setItem('automationRules', JSON.stringify(rules));
    
    console.log('✅ Automation rule saved');
}

// Check and Create Automated Tasks
async function checkAutomatedTasks() {
    console.log('🤖 Checking for automated tasks...');
    
    const rules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    
    if (rules.length === 0) {
        console.log('No automation rules found');
        return;
    }
    
    const now = new Date();
    
    for (const rule of rules) {
        const lastCreated = new Date(rule.lastCreated);
        const daysSinceCreated = (now - lastCreated) / (1000 * 60 * 60 * 24);
        
        let shouldCreate = false;
        
        // Check frequency
        if (rule.frequency === 'daily' && daysSinceCreated >= 1) {
            shouldCreate = true;
        } else if (rule.frequency === 'weekly' && daysSinceCreated >= 7) {
            shouldCreate = true;
        } else if (rule.frequency === 'monthly' && daysSinceCreated >= 30) {
            shouldCreate = true;
        }
        
        if (shouldCreate) {
            console.log('🤖 Creating automated task:', rule.title);
            
            // Create new task
            const taskData = {
                title: `${rule.title} 🔄`,
                description: rule.description,
                priority: rule.priority,
                status: 'todo',
                dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                isRecurring: true,
                frequency: rule.frequency
            };
            
            try {
                const response = await fetch(`${API_BASE_URL}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify(taskData)
                });
                
                if (response.ok) {
                    console.log('✅ Automated task created');
                    
                    // Update last created time
                    rule.lastCreated = now.toISOString();
                    localStorage.setItem('automationRules', JSON.stringify(rules));
                    
                    // Show notification
                    alert(`🤖 Automated task created: ${rule.title} 🔄`);
                    
                    // Reload tasks
                    await loadTasks();
                }
            } catch (error) {
                console.error('❌ Error creating automated task:', error);
            }
        }
    }
}

// Show Automation Rules
function showAutomationRules() {
    console.log('Showing automation rules...');
    
    const rules = JSON.parse(localStorage.getItem('automationRules') || '[]');
    
    if (rules.length === 0) {
        alert('🤖 No Automation Rules Active\n\nCreate a recurring task to set up automation!');
        return;
    }
    
    let message = '🤖 Active Automation Rules:\n\n';
    
    rules.forEach((rule, index) => {
        const lastCreated = new Date(rule.lastCreated).toLocaleDateString();
        message += `${index + 1}. ${rule.title}\n`;
        message += `   Frequency: ${rule.frequency}\n`;
        message += `   Last Created: ${lastCreated}\n\n`;
    });
    
    alert(message);
}

// Clear Automation Rules
function clearAutomationRules() {
    console.log('Clearing automation rules...');
    
    if (confirm('⚠️ Are you sure you want to clear all automation rules?\n\nThis will not delete existing tasks, but will stop creating new automated tasks.')) {
        localStorage.removeItem('automationRules');
        alert('✅ Automation rules cleared!');
        console.log('✅ Automation rules cleared');
    }
}

// Logout
function logout() {
    console.log('👋 Logging out...');
    
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Make functions globally accessible
window.editTask = editTask;
window.deleteTask = deleteTask;