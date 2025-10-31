
// Configuration

const API_URL = 'https://taskmate-backends.onrender.com/api';


// Registration Handler

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // CRITICAL: Prevent default form submission
            
            console.log('Registration form submitted'); // Debug log

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Clear previous errors
            clearErrors();

            // Validate inputs
            if (!name || !email || !password || !confirmPassword) {
                showError('All fields are required');
                return;
            }

            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }

            if (password.length < 6) {
                showError('Password must be at least 6 characters');
                return;
            }

            // Show loading state
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';

            try {
                console.log('Sending registration request to:', `${API_URL}/auth/register`);
                
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();
                console.log('Registration response:', data);

                if (response.ok) {
                    // Store token
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Show success message
                    showSuccess('Account created successfully! Redirecting...');

                    // Redirect to dashboard after 1 second
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    showError(data.message || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showError('Unable to connect to server. Please check if the backend is running.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // CRITICAL: Prevent default form submission
            
            console.log('Login form submitted'); // Debug log

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            // Clear previous errors
            clearErrors();

            // Validate inputs
            if (!email || !password) {
                showError('Email and password are required');
                return;
            }

            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing In...';

            try {
                console.log('Sending login request to:', `${API_URL}/auth/login`);
                
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log('Login response:', data);

                if (response.ok) {
                    // Store token
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Show success message
                    showSuccess('Login successful! Redirecting...');

                    // Redirect to dashboard after 1 second
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                } else {
                    showError(data.message || 'Invalid credentials');
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Unable to connect to server. Please check if the backend is running.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});


// Utility Functions

function showError(message) {
    const existingAlert = document.querySelector('.alert-danger');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const form = document.querySelector('form');
    form.insertBefore(alertDiv, form.firstChild);
}

function showSuccess(message) {
    const existingAlert = document.querySelector('.alert-success');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const form = document.querySelector('form');
    form.insertBefore(alertDiv, form.firstChild);
}

function clearErrors() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => alert.remove());
}


// Check Authentication Status

function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Protect dashboard page
if (window.location.pathname.includes('dashboard.html') && !isAuthenticated()) {
    window.location.href = 'login.html';
}