/**
 * Shared validation utilities for authentication forms.
 */

// Email regex to ensure a valid structure such as abc@gmail.com
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Validate password against existing requirements:
// - At least 6 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character (@$!%*?&)
export const validatePassword = (password) => {
  const errors = [];
  if (!password) {
    errors.push("Please enter this field first.");
    return errors;
  }
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push("Password must contain at least one special character.");
  }
  return errors;
};

// Validate login form
export const validateLoginForm = (email, password) => {
  const errors = [];

  if (!email || !email.trim()) {
    errors.push("Please enter this field first.");
  } else if (!isValidEmail(email)) {
    errors.push("Please enter a valid email address.");
  }

  if (!password) {
    errors.push("Please enter this field first.");
  } else {
    const pwdErrors = validatePassword(password);
    errors.push(...pwdErrors);
  }

  // Deduplicate identical error messages (e.g. if multiple mandatory fields are empty)
  return Array.from(new Set(errors));
};

// Validate registration form
export const validateRegisterForm = (fullName, email, password, role) => {
  const errors = [];

  if (!fullName || !fullName.trim()) {
    errors.push("Please enter this field first.");
  }

  if (!email || !email.trim()) {
    errors.push("Please enter this field first.");
  } else if (!isValidEmail(email)) {
    errors.push("Please enter a valid email address.");
  }

  if (!password) {
    errors.push("Please enter this field first.");
  } else {
    const pwdErrors = validatePassword(password);
    errors.push(...pwdErrors);
  }

  if (!role || !role.trim()) {
    errors.push("Please enter this field first.");
  }

  // Deduplicate identical error messages (e.g. if multiple mandatory fields are empty)
  return Array.from(new Set(errors));
};
