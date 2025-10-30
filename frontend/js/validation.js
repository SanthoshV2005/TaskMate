/**
 * Frontend Validation Functions
 * Provides client-side validation for all forms
 */

// Email validation using regex
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Name validation
const isValidName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
};

// Task title validation
const isValidTitle = (title) => {
  return title && title.trim().length >= 3 && title.trim().length <= 100;
};

// Due date validation (must be today or future)
const isValidDueDate = (dateString) => {
  if (!dateString) return false;
  
  const inputDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return inputDate >= today;
};

// Show error message
const showError = (elementId, message) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
};

// Hide error message
const hideError = (elementId) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = '';
    element.style.display = 'none';
  }
};

// Show success message
const showSuccessMessage = (message) => {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'toast-notification success';
  toast.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// Show error notification
const showErrorMessage = (message) => {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'toast-notification error';
  toast.innerHTML = `
    <i class="fas fa-exclamation-circle"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// Validate registration form
const validateRegisterForm = (name, email, password, confirmPassword) => {
  let isValid = true;
  
  // Reset all errors
  hideError('nameError');
  hideError('emailError');
  hideError('passwordError');
  hideError('confirmPasswordError');
  
  // Validate name
  if (!isValidName(name)) {
    showError('nameError', 'Name must be between 2-50 characters');
    isValid = false;
  }
  
  // Validate email
  if (!isValidEmail(email)) {
    showError('emailError', 'Please enter a valid email address');
    isValid = false;
  }
  
  // Validate password
  if (!isValidPassword(password)) {
    showError('passwordError', 'Password must be at least 6 characters');
    isValid = false;
  }
  
  // Validate confirm password
  if (password !== confirmPassword) {
    showError('confirmPasswordError', 'Passwords do not match');
    isValid = false;
  }
  
  return isValid;
};

// Validate login form
const validateLoginForm = (email, password) => {
  let isValid = true;
  
  // Reset all errors
  hideError('emailError');
  hideError('passwordError');
  
  // Validate email
  if (!isValidEmail(email)) {
    showError('emailError', 'Please enter a valid email address');
    isValid = false;
  }
  
  // Validate password
  if (!password || password.length === 0) {
    showError('passwordError', 'Please enter your password');
    isValid = false;
  }
  
  return isValid;
};

// Validate task form
const validateTaskForm = (title, dueDate) => {
  let isValid = true;
  
  // Reset all errors
  hideError('titleError');
  hideError('dueDateError');
  
  // Validate title
  if (!isValidTitle(title)) {
    showError('titleError', 'Title must be between 3-100 characters');
    isValid = false;
  }
  
  // Validate due date
  if (!isValidDueDate(dueDate)) {
    showError('dueDateError', 'Due date must be today or in the future');
    isValid = false;
  }
  
  return isValid;
};

// Format date for input field (YYYY-MM-DD)
const formatDateForInput = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format date for display
const formatDateForDisplay = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Get minimum date (today) for date inputs
const getMinDate = () => {
  return formatDateForInput(new Date());
};

// Sanitize HTML to prevent XSS
const sanitizeHTML = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// Export validation functions (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidEmail,
    isValidPassword,
    isValidName,
    isValidTitle,
    isValidDueDate,
    showError,
    hideError,
    showSuccessMessage,
    showErrorMessage,
    validateRegisterForm,
    validateLoginForm,
    validateTaskForm,
    formatDateForInput,
    formatDateForDisplay,
    getMinDate,
    sanitizeHTML
  };
}