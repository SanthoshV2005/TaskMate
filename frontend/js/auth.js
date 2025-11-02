// API Configuration
const API_BASE_URL = 'https://taskmate-backends.onrender.com/api';

console.log('✅ Auth script loaded');
console.log('📡 API URL:', API_BASE_URL);

// Utility Functions
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
        // Also show alert if no message div
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
        
        // Validate required fields
        if (!userData.token || !userData.email) {
            console.error('❌ Invalid user data - missing required fields');
            return false;
        }
        
        // Save as JSON string
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Verify it was saved
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
        
        // Validate parsed data has required fields
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
        localStorage.removeItem('user'); // Clear corrupted data
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

// Login Handler
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
            
            // Save to localStorage
            const saved = saveUserData(userData);
            
            if (saved) {
                console.log('✅ User data saved successfully');
                showMessage('Login successful! Redirecting...', 'success');
                
                // Clear form
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

// Register Handler
async function handleRegister(event) {
    event.preventDefault();
    console.log('📝 Register form submitted');
    
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    console.log('👤 Name:', name);
    console.log('📧 Email:', email);
    
    // Validation
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
            
            // Clear form
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

// Logout function
function logout() {
    console.log('🚪 Logging out...');
    clearUserData();
    window.location.href = 'login.html';
}

// Check authentication and redirect if needed
function checkAuthAndRedirect() {
    const currentPage = window.location.pathname.split('/').pop();
    
    console.log('📄 Current page:', currentPage);
    
    // If on login or register page, check if already logged in
    if (currentPage === 'login.html' || currentPage === 'register.html') {
        if (isAuthenticated()) {
            console.log('ℹ️ User already logged in on auth page, redirecting to dashboard...');
            window.location.replace('dashboard.html');
        } else {
            console.log('✅ No active session, staying on', currentPage);
        }
    }
    
    // If on dashboard, check if logged in
    if (currentPage === 'dashboard.html') {
        if (!isAuthenticated()) {
            console.log('⚠️ Not authenticated on dashboard, redirecting to login...');
            window.location.replace('login.html');
        } else {
            console.log('✅ Authenticated, can access dashboard');
        }
    }
}

// Initialize forms when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Content Loaded');
    
    // Check authentication status immediately
    checkAuthAndRedirect();
    
    // Check for login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('✅ Login form found, attaching listener');
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check for register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        console.log('✅ Register form found, attaching listener');
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Add logout functionality if logout button exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        console.log('✅ Logout button found, attaching listener');
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});

// Also run check immediately (before DOM load)
checkAuthAndRedirect();