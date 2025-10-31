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
    }
}

function saveUserData(userData) {
    try {
        console.log('💾 Attempting to save user data:', userData);
        
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
        console.log('📦 Raw user data from localStorage:', userData);
        
        if (!userData) {
            console.log('⚠️ No user data found in localStorage');
            return null;
        }
        
        const parsed = JSON.parse(userData);
        console.log('✅ Parsed user data:', parsed);
        
        return parsed;
    } catch (error) {
        console.error('❌ Error getting user data:', error);
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

// Login Handler
async function handleLogin(event) {
    event.preventDefault();
    console.log('🔐 Login form submitted');
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    console.log('📧 Email:', email);
    
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';
    
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
        console.log('📦 Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        if (data.success && data.token) {
            console.log('✅ Login successful!');
            
            // Prepare user data
            const userData = {
                token: data.token,
                email: data.user?.email || email,
                name: data.user?.name || 'User',
                id: data.user?._id || data.user?.id
            };
            
            console.log('💾 Saving user data:', userData);
            
            // Save to localStorage
            const saved = saveUserData(userData);
            
            if (saved) {
                console.log('✅ User data saved successfully');
                showMessage('Login successful! Redirecting...', 'success');
                
                // Small delay to ensure localStorage is written
                setTimeout(() => {
                    console.log('🔄 Redirecting to dashboard...');
                    window.location.href = '/dashboard.html';
                }, 500);
            } else {
                throw new Error('Failed to save user data');
            }
        } else {
            throw new Error(data.message || 'Invalid response from server');
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        showMessage(error.message || 'Login failed. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Register Handler
async function handleRegister(event) {
    event.preventDefault();
    console.log('📝 Register form submitted');
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
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
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';
    
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
        console.log('📦 Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        if (data.success) {
            console.log('✅ Registration successful!');
            showMessage('Registration successful! Redirecting to login...', 'success');
            
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
        } else {
            throw new Error(data.message || 'Registration failed');
        }
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        showMessage(error.message || 'Registration failed. Please try again.', 'error');
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
}

// Initialize forms when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM Content Loaded');
    
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
    
    // Check if user is already logged in
    const currentPage = window.location.pathname;
    if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
        const userData = getUserData();
        if (userData && userData.token) {
            console.log('✅ User already logged in, redirecting to dashboard');
            window.location.href = '/dashboard.html';
        }
    }
});