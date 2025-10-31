// ========================================
// TASKMATE - AUTH.JS
// Complete Authentication System
// Handles Both Login and Registration
// ========================================

// API Configuration
const API_BASE_URL = 'https://taskmate-backends.onrender.com/api';

// Check if already logged in (only on login/register pages)
const currentPage = window.location.pathname;
if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
    const existingUser = localStorage.getItem('user');
    if (existingUser) {
        try {
            const userData = JSON.parse(existingUser);
            if (userData && userData.token) {
                console.log('✅ User already logged in:', userData.name);
                window.location.href = 'dashboard.html';
            }
        } catch (e) {
            console.error('Invalid user data, clearing...');
            localStorage.removeItem('user');
        }
    }
}

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Auth script loaded');
    console.log('Current page:', window.location.pathname);
    console.log('API URL:', API_BASE_URL);
    
    // Setup login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✅ Login form listener attached');
    }
    
    // Setup register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        console.log('✅ Register form listener attached');
    }
});

// ===================
// LOGIN FUNCTION
// ===================

async function handleLogin(e) {
    e.preventDefault();
    console.log('🔐 Login attempt started...');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('errorMessage');
    
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    // Validation
    if (!email || !password) {
        showError('Please enter both email and password', errorDiv);
        return;
    }
    
    if (!email.includes('@')) {
        showError('Please enter a valid email address', errorDiv);
        return;
    }
    
    // Disable button
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    try {
        const loginUrl = `${API_BASE_URL}/auth/login`;
        console.log('Making request to:', loginUrl);
        
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: email, 
                password: password 
            })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Login failed');
        }
        
        // Check if we have token
        if (!data.token) {
            console.error('❌ No token in response!');
            throw new Error('Invalid response from server');
        }
        
        // Prepare user data
        const userData = {
            token: data.token,
            name: data.user?.name || data.user?.username || data.name || 'User',
            email: data.user?.email || email,
            id: data.user?._id || data.user?.id || data.userId
        };
        
        console.log('Prepared user data:', userData);
        
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Verify it was saved
        const verification = localStorage.getItem('user');
        console.log('✅ User data saved:', verification !== null);
        
        if (!verification) {
            throw new Error('Failed to save login data');
        }
        
        // Show success
        showSuccess('Login successful! Redirecting...', errorDiv);
        
        // Redirect after short delay
        setTimeout(() => {
            console.log('Redirecting to dashboard...');
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('❌ Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (error.message.includes('Invalid credentials') || error.message.includes('Incorrect')) {
            errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError(errorMessage, errorDiv);
        
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

// ===================
// REGISTER FUNCTION
// ===================

async function handleRegister(e) {
    e.preventDefault();
    console.log('📝 Registration attempt started...');
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const registerBtn = document.getElementById('registerBtn');
    const errorDiv = document.getElementById('errorMessage');
    
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    // Validation
    if (!name || !email || !password) {
        showError('Please fill in all fields', errorDiv);
        return;
    }
    
    if (!email.includes('@')) {
        showError('Please enter a valid email address', errorDiv);
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long', errorDiv);
        return;
    }
    
    if (confirmPassword && password !== confirmPassword) {
        showError('Passwords do not match', errorDiv);
        return;
    }
    
    // Disable button
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating Account...';
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    try {
        const registerUrl = `${API_BASE_URL}/auth/register`;
        console.log('Making request to:', registerUrl);
        
        const response = await fetch(registerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name: name,
                email: email, 
                password: password 
            })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Registration failed');
        }
        
        // Check if we have token (auto-login after registration)
        if (data.token) {
            console.log('✅ Auto-login with token');
            
            const userData = {
                token: data.token,
                name: data.user?.name || name,
                email: data.user?.email || email,
                id: data.user?._id || data.user?.id
            };
            
            localStorage.setItem('user', JSON.stringify(userData));
            
            showSuccess('Account created successfully! Redirecting...', errorDiv);
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            // No auto-login, redirect to login page
            console.log('✅ Registration successful, redirecting to login');
            showSuccess('Account created successfully! Please login.', errorDiv);
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            errorMessage = 'An account with this email already exists. Please login instead.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError(errorMessage, errorDiv);
        
        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Account';
    }
}

// ===================
// UTILITY FUNCTIONS
// ===================

// Show Error Message
function showError(message, errorDiv) {
    console.error('Showing error:', message);
    
    if (!errorDiv) {
        errorDiv = document.getElementById('errorMessage');
    }
    
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'alert alert-danger';
    } else {
        alert('Error: ' + message);
    }
}

// Show Success Message
function showSuccess(message, errorDiv) {
    console.log('Showing success:', message);
    
    if (!errorDiv) {
        errorDiv = document.getElementById('errorMessage');
    }
    
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'alert alert-success';
    } else {
        alert(message);
    }
}

console.log('✅ Auth script loaded successfully!');