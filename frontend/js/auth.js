// ========================================
// TASKMATE - AUTH.JS
// Fixed Authentication with Better Error Handling
// ========================================

const API_BASE_URL = 'https://taskmate-backends.onrender.com/api';

console.log('✅ Auth script loaded');
console.log('📡 API URL:', API_BASE_URL);

// ========================================
// LOGIN FUNCTIONALITY
// ========================================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    console.log('✅ Login form found, attaching listener');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('🔐 Login form submitted');

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('errorMessage');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        console.log('📧 Email:', email);

        // Validation
        if (!email || !password) {
            showError('Please fill in all fields', errorDiv);
            return;
        }

        // Disable button during submission
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        try {
            console.log('📤 Making login request to:', `${API_BASE_URL}/auth/login`);

            const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
                
                // Save user data with token
                const userData = {
                    token: data.token,
                    email: data.user.email,
                    name: data.user.name,
                    id: data.user.id
                };

                console.log('💾 Saving user data:', userData);
                localStorage.setItem('user', JSON.stringify(userData));
                
                // Verify it was saved
                const saved = localStorage.getItem('user');
                console.log('✅ User data saved successfully:', !!saved);

                // Show success message
                showSuccess('Login successful! Redirecting...', errorDiv);

                // Redirect after short delay
                setTimeout(() => {
                    console.log('🔄 Redirecting to dashboard...');
                    window.location.href = 'dashboard.html';
                }, 1000);

            } else {
                throw new Error('Invalid response from server');
            }

        } catch (error) {
            console.error('❌ Login error:', error);
            showError(error.message || 'Login failed. Please try again.', errorDiv);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });
}

// ========================================
// REGISTRATION FUNCTIONALITY
// ========================================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    console.log('✅ Register form found, attaching listener');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Register form submitted');

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorDiv = document.getElementById('errorMessage');
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            showError('Please fill in all fields', errorDiv);
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match', errorDiv);
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters', errorDiv);
            return;
        }

        // Disable button during submission
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';

        try {
            console.log('📤 Making register request to:', `${API_BASE_URL}/auth/register`);

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
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

            if (data.success && data.token) {
                console.log('✅ Registration successful!');
                
                // Save user data
                const userData = {
                    token: data.token,
                    email: data.user.email,
                    name: data.user.name,
                    id: data.user.id
                };

                console.log('💾 Saving user data:', userData);
                localStorage.setItem('user', JSON.stringify(userData));

                // Show success message
                showSuccess('Account created! Redirecting to dashboard...', errorDiv);

                // Redirect after short delay
                setTimeout(() => {
                    console.log('🔄 Redirecting to dashboard...');
                    window.location.href = 'dashboard.html';
                }, 1000);

            } else {
                throw new Error('Invalid response from server');
            }

        } catch (error) {
            console.error('❌ Registration error:', error);
            showError(error.message || 'Registration failed. Please try again.', errorDiv);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });
}

// ========================================
// HELPER FUNCTIONS
// ========================================
function showError(message, errorDiv) {
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.className = 'alert alert-danger';
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message, errorDiv) {
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.className = 'alert alert-success';
        errorDiv.style.display = 'block';
    } else {
        alert(message);
    }
}

console.log('✅ Auth script fully initialized');