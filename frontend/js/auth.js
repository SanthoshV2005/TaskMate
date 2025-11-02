// ========================================
// TASKMATE - AUTH.JS
// Fixed - No Auto-Redirect on Login Page
// ========================================

// API Configuration
const API_BASE_URL = 'https://taskmate-backends.onrender.com/api';

console.log('✅ Auth script loaded');
console.log('📡 API URL:', API_BASE_URL);

// ========================================
// UTILITY FUNCTIONS
// ========================================

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
        if (type === 'error') {
            alert(message);
        }
    }
}

function saveUserData(userData) {
    try {
        console.log('💾 Attempting to save user data:', {
            hasToken: !!userData.token,
            email: userData.email,
            name: userData.name
        });
        
        if (!userData.token || !userData.email) {
            console.error('❌ Invalid user data - missing required fields');
            return false;
        }
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        const saved = localStorage.getItem('user');
        console.log('✅ User data saved successfully:', saved !== null);
        
        return saved !== null;
    } catch (error) {
        console.error('❌ Error saving user data:', error);
        return false;
    }
}

function getUserData() {
    try {
        const userData = localStorage.getItem('user');
        
        if (!userData || userData === 'undefined' || userData === 'null') {
            console.log('⚠️ No valid user data found in localStorage');
            return null;
        }
        
        const parsed = JSON.parse(userData);
        
        if (!parsed.token || !parsed.email) {
            console.log('⚠️ Invalid user data structure, clearing...');
            localStorage.removeItem('user');
            return null;
        }
        
        console.log('✅ Valid user data found:', {
            email: parsed.email,
            name: parsed.name,
            hasToken: !!parsed.token
        });
        
        return parsed;
    } catch (error) {
        console.error('❌ Error parsing user data:', error);
        localStorage.removeItem('user');
        return null;
    }
}

function clearUserData() {
    try {
        localStorage.removeItem('user');
        console.log('🗑️ User data cleared');
        return true;
    } catch (error) {
        console.error('❌ Error clearing user data:', error);
        return false;
    }
}

function isAuthenticated() {
    const userData = getUserData();
    const isAuth = userData !== null && !!userData.token;
    console.log('🔐 Authentication check:', isAuth);
    return isAuth;
}

// ========================================
// LOGIN HANDLER
// ========================================
async function handleLogin(event) {
    event.preventDefault();
    console.log('🔐 Login form submitted');
    
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    
    console.log('📧 Email:', email);
    
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (!submitButton) {
        console.error('❌ Submit button not found');
        return;
    }
    
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
    
    try {
        const loginUrl = `${API_BASE_URL}/auth/login`;
        console.log('📤 Making login request to:', loginUrl);
        
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        console.log('📦 Response data:', {
            success: data.success,
            hasToken: !!data.token,
            hasUser: !!data.user
        });
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        if (data.success && data.token) {
            console.log('✅ Login successful!');
            
            // Prepare user data with all required fields
            const userData = {
                token: data.token,
                email: data.user?.email || email,
                name: data.user?.name || 'User',
                id: data.user?._id || data.user?.id || 'unknown'
            };
            
            console.log('💾 Saving user data...');
            
            const saved = saveUserData(userData);
            
            if (saved) {
                console.log('✅ User data saved successfully');
                showMessage('Login successful! Redirecting...', 'success');
                
                event.target.reset();
                
                // Redirect after short delay
                setTimeout(() => {
                    console.log('🔄 Redirecting to dashboard...');
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                throw new Error('Failed to save user data to browser storage');
            }
        } else {
            throw new Error(data.message || 'Invalid response from server');
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        showMessage(error.message || 'Login failed. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// ========================================
// REGISTER HANDLER
// ========================================
async function handleRegister(event) {
    event.preventDefault();
    console.log('📝 Register form submitted');
    
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    console.log('👤 Name:', name);
    console.log('📧 Email:', email);
    
    if (!name || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (!submitButton) {
        console.error('❌ Submit button not found');
        return;
    }
    
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';
    
    try {
        const registerUrl = `${API_BASE_URL}/auth/register`;
        console.log('📤 Making register request to:', registerUrl);
        
        const response = await fetch(registerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });
        
        console.log('📥 Response status:', response.status);
        
        const data = await response.json();
        console.log('📦 Response data:', {
            success: data.success,
            hasToken: !!data.token
        });
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        if (data.success) {
            console.log('✅ Registration successful!');
            showMessage('Registration successful! Redirecting to login...', 'success');
            
            event.target.reset();
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            throw new Error(data.message || 'Registration failed');
        }
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        showMessage(error.message || 'Registration failed. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// ========================================
// LOGOUT FUNCTION
// ========================================
function logout() {
    console.log('🚪 Logging out...');
    clearUserData();
    window.location.href = 'login.html';
}

// ========================================
// AUTHENTICATION CHECK
// ONLY FOR DASHBOARD PAGE
// ========================================
function checkDashboardAuth() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // ONLY check auth on dashboard page
    if (currentPage === 'dashboard.html') {
        console.log('📄 On dashboard page - checking authentication...');
        
        if (!isAuthenticated()) {
            console.log('⚠️ Not authenticated, redirecting to login...');
            window.location.replace('login.html');
            return false;
        } else {
            console.log('✅ Authenticated, access granted');
            return true;
        }
    }
    
    // For other pages, just log
    console.log('📄 Current page:', currentPage);
    return true;
}

// ========================================
// DOM INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Content Loaded');
    
    const currentPage = window.location.pathname.split('/').pop();
    console.log('📄 Current page:', currentPage);
    
    // ONLY check auth on dashboard
    if (currentPage === 'dashboard.html') {
        checkDashboardAuth();
        // Exit early - dashboard.js will handle everything else
        return;
    }
    
    // For login page - attach form listener
    if (currentPage === 'login.html') {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('✅ Login form found, attaching listener');
            loginForm.addEventListener('submit', handleLogin);
        } else {
            console.error('❌ Login form not found!');
        }
    }
    
    // For register page - attach form listener
    if (currentPage === 'register.html') {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            console.log('✅ Register form found, attaching listener');
            registerForm.addEventListener('submit', handleRegister);
        } else {
            console.error('❌ Register form not found!');
        }
    }
    
    // Logout button (if exists on any page)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        console.log('✅ Logout button found, attaching listener');
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});

// ========================================
// MAKE LOGOUT GLOBALLY ACCESSIBLE
// ========================================
window.logout = logout;