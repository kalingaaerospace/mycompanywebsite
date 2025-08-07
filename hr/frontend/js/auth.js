/**
 * Authentication Module
 * Handles user login, logout, and authentication state management
 */

class AuthManager {
    constructor() {
        this.supabaseUrl = window.APP_CONFIG.supabase.url;
        this.supabaseAnonKey = window.APP_CONFIG.supabase.anonKey;
        this.currentUser = null;
        this.authToken = null;
        
        this.init();
    }

    init() {
        // Immediately hide login modal if we have URL tokens
        const hash = window.location.hash;
        if (hash && hash.includes('access_token=')) {
            console.log('🔍 URL tokens detected on init, hiding login modal immediately');
            this.hideModal('loginModal');
            this.hideModal('registerModal');
        }
        
        // Check for existing session on page load
        this.checkExistingSession();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Show register modal
        const showRegister = document.getElementById('showRegister');
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('loginModal');
                this.showModal('registerModal');
            });
        }

        // Show login modal
        const showLogin = document.getElementById('showLogin');
        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('registerModal');
                this.showModal('loginModal');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            // Check for saved theme preference or default to light
            const savedTheme = localStorage.getItem('theme') || 'light';
            this.setTheme(savedTheme);
            themeToggle.checked = savedTheme === 'dark';
            
            themeToggle.addEventListener('change', (e) => {
                const theme = e.target.checked ? 'dark' : 'light';
                this.setTheme(theme);
                localStorage.setItem('theme', theme);
            });
        }

        // Password visibility toggles
        this.setupPasswordToggles();

        // Forgot password link
        const forgotPasswordLink = document.getElementById('forgotPassword');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }

        // Avatar upload
        this.setupAvatarUpload();
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    setupPasswordToggles() {
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const passwordInput = e.target.parentElement.querySelector('input[type="password"], input[type="text"]');
                if (passwordInput) {
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        e.target.classList.remove('fa-eye');
                        e.target.classList.add('fa-eye-slash');
                    } else {
                        passwordInput.type = 'password';
                        e.target.classList.remove('fa-eye-slash');
                        e.target.classList.add('fa-eye');
                    }
                }
            });
        });
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        this.showLoading();

        try {
            // Use our backend API for login (handles both admin and regular users)
            const response = await fetch('http://localhost:8000/api/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Store authentication data
            this.currentUser = data.user;
            this.authToken = data.token;
            
            // Store in localStorage for persistence
            localStorage.setItem('authToken', this.authToken);
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

            // Hide login modal and show success
            this.hideModal('loginModal');
            this.showToast('Login successful!', 'success');
            
            // Update UI and load user data
            this.onAuthStateChange();
            
        } catch (error) {
            console.error('Login error:', error);
            this.showToast(error.message || 'Login failed', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!email || !password || !confirmPassword) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        this.showLoading();

        try {
            // Use Supabase Auth API for registration
            const response = await fetch(`${this.supabaseUrl}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.supabaseAnonKey
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            const data = await response.json();
            
            this.hideModal('registerModal');
            this.showToast('Registration successful! Please check your email for verification.', 'success');
            
            // Show login modal
            setTimeout(() => {
                this.showModal('loginModal');
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showToast(error.message || 'Registration failed', 'error');
        } finally {
            this.hideLoading();
        }
    }

    checkExistingSession() {
        console.log('🔍 Checking existing session...');
        
        // First check for URL-based tokens (from password reset, email confirmation, etc.)
        const urlTokenProcessed = this.handleUrlTokens();
        console.log('URL token processed:', urlTokenProcessed);
        
        // If URL token was processed successfully, we're done
        if (urlTokenProcessed) {
            console.log('✅ URL token processed successfully, skipping localStorage check');
            // Explicitly hide login modal since we're authenticated
            this.hideModal('loginModal');
            this.hideModal('registerModal');
            return;
        }
        
        // Otherwise, check for existing session in localStorage
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        console.log('LocalStorage check - Token:', !!token, 'User:', !!user);

        if (token && user) {
            try {
                this.authToken = token;
                this.currentUser = JSON.parse(user);
                console.log('✅ Restored session from localStorage');
                this.onAuthStateChange();
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                this.logout();
            }
        } else {
            console.log('❌ No existing session found, showing login modal');
            // Only show login modal if no URL tokens were processed
            // and we're not in the middle of processing
            if (!urlTokenProcessed) {
                this.showModal('loginModal');
            }
        }
    }

    handleUrlTokens() {
        console.log('🔍 Checking URL tokens...');
        
        // Check for tokens in URL hash (from password reset, email confirmation, etc.)
        const hash = window.location.hash;
        console.log('URL hash:', hash);
        
        if (hash && hash.includes('access_token=')) {
            console.log('✅ Found access token in URL hash');
            try {
                // Parse the hash parameters
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');
                const expiresAt = params.get('expires_at');
                const tokenType = params.get('token_type');
                const type = params.get('type');
                
                console.log('Token parameters:', {
                    hasAccessToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    expiresAt,
                    tokenType,
                    type
                });
                
                // If this is a password recovery, redirect to password change page
                if (type === 'recovery') {
                    console.log('🔄 Password recovery detected, redirecting to password change page');
                    console.log('📍 Current URL:', window.location.href);
                    console.log('🎯 Redirecting to: password-change.html' + hash);
                    
                    // Use replace to avoid back button issues
                    window.location.replace('password-change.html' + hash);
                    return true;
                }
                
                if (accessToken) {
                    console.log('Processing access token...');
                    
                    // Store the tokens
                    localStorage.setItem('authToken', accessToken);
                    if (refreshToken) {
                        localStorage.setItem('refreshToken', refreshToken);
                    }
                    if (expiresAt) {
                        localStorage.setItem('tokenExpiresAt', expiresAt);
                    }
                    
                    // Decode the JWT to get user info
                    const userInfo = this.decodeJWT(accessToken);
                    console.log('Decoded user info:', userInfo);
                    
                    if (userInfo) {
                        this.currentUser = {
                            id: userInfo.sub,
                            email: userInfo.email,
                            user_metadata: userInfo.user_metadata || {},
                            app_metadata: userInfo.app_metadata || {}
                        };
                        
                        // Set the auth token
                        this.authToken = accessToken;
                        
                        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                        console.log('✅ User data stored in localStorage');
                        
                        // Clear the URL hash to remove sensitive tokens
                        window.history.replaceState({}, document.title, window.location.pathname);
                        console.log('✅ URL hash cleared');
                        
                        // Show success message
                        this.showToast('Password reset successful! You are now logged in.', 'success');
                        
                        // Update auth state immediately
                        this.onAuthStateChange();
                        
                        return true; // Indicate successful processing
                    } else {
                        console.error('❌ Failed to decode JWT token');
                    }
                }
            } catch (error) {
                console.error('Error processing URL tokens:', error);
                this.showToast('Error processing authentication. Please try logging in again.', 'error');
            }
        } else {
            console.log('ℹ️ No access token found in URL hash');
        }
        
        // Check for error parameters in URL
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error) {
            console.error('Authentication error from URL:', error, errorDescription);
            this.showToast(`Authentication error: ${errorDescription || error}`, 'error');
            
            // Clear error parameters from URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        return false; // No URL token processed
    }

    decodeJWT(token) {
        try {
            // JWT tokens have 3 parts separated by dots
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format');
            }
            
            // Decode the payload (second part)
            const payload = parts[1];
            const decodedPayload = JSON.parse(atob(payload));
            
            return decodedPayload;
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return null;
        }
    }

    logout() {
        // Clear stored data
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        this.currentUser = null;
        this.authToken = null;
        
        this.showToast('Logged out successfully', 'info');
        
        // Show login modal
        setTimeout(() => {
            this.showModal('loginModal');
        }, 1000);
        
        this.onAuthStateChange();
    }

    onAuthStateChange() {
        console.log('🔄 Auth state change - Current user:', !!this.currentUser, 'Auth token:', !!this.authToken);
        
        if (this.currentUser && this.authToken) {
            console.log('✅ User is authenticated, hiding modals and showing dashboard');
            // User is authenticated
            this.hideModal('loginModal');
            this.hideModal('registerModal');
            
            // Update profile info if available
            this.updateProfileInfo();
            
            // Initialize other modules that require authentication
            // Only load if modules are available and not already loaded
            if (window.dashboardManager) {
                console.log('📊 Loading dashboard data...');
                window.dashboardManager.loadDashboardData();
            }
            
            if (window.employeesManager) {
                console.log('👥 Loading employees...');
                window.employeesManager.loadEmployees();
            }
            
            if (window.filesManager) {
                console.log('📁 Loading files...');
                window.filesManager.loadFiles();
            }
            
        } else {
            console.log('❌ User is not authenticated, showing login modal');
            // User is not authenticated - only show login modal if not already processing URL tokens
            const hash = window.location.hash;
            if (!hash || !hash.includes('access_token=')) {
                this.showModal('loginModal');
            } else {
                console.log('⏳ URL tokens detected, skipping login modal display');
            }
        }
    }

    updateProfileInfo() {
        if (!this.currentUser) return;

        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');

        if (profileName && this.currentUser.user_metadata?.first_name) {
            profileName.textContent = `${this.currentUser.user_metadata.first_name} ${this.currentUser.user_metadata.last_name || ''}`.trim();
        } else if (profileName) {
            profileName.textContent = this.currentUser.email || 'User';
        }

        if (profileEmail) {
            profileEmail.textContent = this.currentUser.email || '';
        }
    }

    isAuthenticated() {
        return !!(this.currentUser && this.authToken);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getAuthToken() {
        return this.authToken;
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.authToken}`,
            'apikey': this.supabaseAnonKey,
            'Content-Type': 'application/json'
        };
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            // Clear form fields
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-title">${title}</span>
                <button class="toast-close">&times;</button>
            </div>
            <div class="toast-message">${message}</div>
        `;

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    async handleForgotPassword() {
        const email = prompt('Please enter your email address:');
        if (!email) return;

        if (!email.includes('@')) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`${this.supabaseUrl}/auth/v1/recover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.supabaseAnonKey
                },
                body: JSON.stringify({
                    email: email
                })
            });

            if (response.ok) {
                this.showToast('Password reset email sent! Please check your inbox.', 'success');
            } else {
                throw new Error('Failed to send reset email');
            }

        } catch (error) {
            console.error('Password reset error:', error);
            this.showToast('Failed to send password reset email. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    setupAvatarUpload() {
        const avatarContainer = document.getElementById('profileAvatarContainer');
        const avatarUpload = document.getElementById('avatarUpload');
        
        if (avatarContainer && avatarUpload) {
            // Click to upload
            avatarContainer.addEventListener('click', () => {
                avatarUpload.click();
            });

            // Handle file selection
            avatarUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleAvatarUpload(file);
                }
                e.target.value = ''; // Reset input
            });
        }
    }

    async handleAvatarUpload(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showToast('Image file must be smaller than 5MB', 'error');
            return;
        }

        this.showLoading();

        try {
            // Create a preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const avatarImg = document.getElementById('profileAvatarImg');
                const avatarIcon = document.getElementById('profileAvatarIcon');
                
                if (avatarImg && avatarIcon) {
                    avatarImg.src = e.target.result;
                    avatarImg.style.display = 'block';
                    avatarIcon.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);

            // TODO: Upload to storage and update profile
            // For now, just show success message
            this.showToast('Profile picture updated!', 'success');

        } catch (error) {
            console.error('Avatar upload error:', error);
            this.showToast('Failed to upload profile picture', 'error');
        } finally {
            this.hideLoading();
        }
    }
}

// Initialize auth manager when DOM is loaded
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
    window.authManager = authManager; // Make it globally accessible
});
