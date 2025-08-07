/**
 * Main Application File
 * Initializes and coordinates all modules
 */

class HRApp {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        console.log('🚀 HR Management System - Starting...');
        
        // Initialize modules in proper order
        this.initializeModules();
        
        // Set up global event handlers
        this.setupGlobalHandlers();
        
        // Set up profile management
        this.setupProfileManagement();
        
        this.isInitialized = true;
        console.log('✅ HR Management System - Ready!');
    }

    initializeModules() {
        console.log('📦 Initializing modules...');
        
        // Store references to all managers
        this.modules = {
            ui: window.uiManager,
            auth: window.authManager,
            api: window.apiManager,
            dashboard: window.dashboardManager,
            employees: window.employeesManager,
            files: window.filesManager
        };
        
        // Validate all modules are loaded
        const missingModules = Object.entries(this.modules)
            .filter(([name, module]) => !module)
            .map(([name]) => name);
            
        if (missingModules.length > 0) {
            console.error('❌ Missing modules:', missingModules);
        } else {
            console.log('✅ All modules loaded successfully');
        }
    }

    setupGlobalHandlers() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.section) {
                this.modules.ui.showSection(e.state.section);
            }
        });

        // Handle page refresh/close
        window.addEventListener('beforeunload', (e) => {
            // Could add cleanup logic here if needed
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle clicks outside modals
        document.addEventListener('click', (e) => {
            this.handleOutsideClick(e);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });

        // Handle network status changes
        window.addEventListener('online', () => {
            this.modules.ui.showToast('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.modules.ui.showToast('Connection lost', 'warning');
        });
    }

    setupProfileManagement() {
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleProfileUpdate(e);
            });
        }
    }

    async handleProfileUpdate(event) {
        const formData = new FormData(event.target);
        const profileData = Object.fromEntries(formData.entries());

        try {
            this.modules.ui.showLoading();
            
            await this.modules.api.updateProfile(profileData);
            
            this.modules.ui.showToast('Profile updated successfully', 'success');
            
            // Update profile display
            this.updateProfileDisplay(profileData);
            
            // Add activity
            if (this.modules.dashboard) {
                this.modules.dashboard.addActivity({
                    icon: 'fas fa-user-edit',
                    message: 'Profile information was updated'
                });
            }
            
        } catch (error) {
            console.error('Error updating profile:', error);
            this.modules.ui.showToast('Failed to update profile', 'error');
        } finally {
            this.modules.ui.hideLoading();
        }
    }

    updateProfileDisplay(profileData) {
        const displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
        const profileNameEl = document.getElementById('profileName');
        
        if (profileNameEl && displayName) {
            profileNameEl.textContent = displayName;
        }
    }

    async loadProfileData() {
        if (!this.modules.auth.isAuthenticated()) return;

        try {
            const profile = await this.modules.api.getProfile();
            
            if (profile) {
                // Populate profile form
                const fields = ['firstName', 'lastName', 'phone', 'department', 'position'];
                fields.forEach(field => {
                    const element = document.getElementById(field);
                    if (element && profile[field]) {
                        element.value = profile[field];
                    }
                });
                
                // Update profile display
                this.updateProfileDisplay(profile);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    handleKeyboardShortcuts(event) {
        // Skip if user is typing in an input field
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
            return;
        }

        // Alt + key shortcuts
        if (event.altKey) {
            switch (event.key) {
                case '1':
                    event.preventDefault();
                    this.modules.ui.showSection('dashboard');
                    break;
                case '2':
                    event.preventDefault();
                    this.modules.ui.showSection('employees');
                    break;
                case '3':
                    event.preventDefault();
                    this.modules.ui.showSection('files');
                    break;
                case '4':
                    event.preventDefault();
                    this.modules.ui.showSection('profile');
                    break;
            }
        }

        // Other shortcuts
        switch (event.key) {
            case 'Escape':
                // Close any open modals
                this.modules.ui.closeAllModals();
                break;
        }
    }

    handleOutsideClick(event) {
        // Handle dropdown menus, tooltips, etc.
        const dropdowns = document.querySelectorAll('.dropdown.active');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    handleWindowResize() {
        // Handle responsive layout changes if needed
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile-layout', isMobile);
    }

    // Public methods for external modules
    showSection(sectionName) {
        if (this.modules.ui) {
            this.modules.ui.showSection(sectionName);
            
            // Update URL without page reload
            if (history.pushState) {
                history.pushState({ section: sectionName }, '', `#${sectionName}`);
            }
        }
    }

    showToast(message, type = 'info') {
        if (this.modules.ui) {
            this.modules.ui.showToast(message, type);
        }
    }

    async refreshCurrentSection() {
        const currentSection = this.modules.ui.currentSection;
        
        switch (currentSection) {
            case 'dashboard':
                if (this.modules.dashboard) {
                    await this.modules.dashboard.refreshDashboard();
                }
                break;
            case 'employees':
                if (this.modules.employees) {
                    await this.modules.employees.loadEmployees();
                }
                break;
            case 'files':
                if (this.modules.files) {
                    await this.modules.files.loadFiles();
                }
                break;
            case 'profile':
                await this.loadProfileData();
                break;
        }
    }

    // Error handling
    handleError(error, context = 'Application') {
        console.error(`[${context}] Error:`, error);
        
        let message = 'An unexpected error occurred';
        
        if (error.message) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }
        
        this.modules.ui.showToast(message, 'error');
    }

    // Utility methods
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    formatNumber(number, decimals = 0) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    formatPercentage(value, decimals = 1) {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value / 100);
    }

    // Debug methods
    getDebugInfo() {
        return {
            initialized: this.isInitialized,
            modules: Object.keys(this.modules).reduce((acc, key) => {
                acc[key] = !!this.modules[key];
                return acc;
            }, {}),
            currentUser: this.modules.auth?.getCurrentUser() || null,
            currentSection: this.modules.ui?.currentSection || null
        };
    }

    // Development helpers
    dev = {
        switchUser: (userData) => {
            if (this.modules.auth) {
                this.modules.auth.currentUser = userData;
                localStorage.setItem('currentUser', JSON.stringify(userData));
                this.modules.auth.onAuthStateChange();
            }
        },
        
        clearStorage: () => {
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
        },
        
        exportData: () => {
            const data = {
                employees: this.modules.employees?.employees || [],
                files: this.modules.files?.files || [],
                profile: this.modules.api?.getProfile() || null
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hr-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };
}

// Initialize the application
let hrApp;
document.addEventListener('DOMContentLoaded', () => {
    hrApp = new HRApp();
    window.hrApp = hrApp; // Make it globally accessible
    
    // Handle initial section from URL hash
    const hash = window.location.hash.substring(1);
    if (hash && ['dashboard', 'employees', 'files', 'profile'].includes(hash)) {
        setTimeout(() => {
            hrApp.showSection(hash);
        }, 100);
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.hrApp) {
        window.hrApp.handleError(event.error, 'Global');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.hrApp) {
        window.hrApp.handleError(event.reason, 'Promise');
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HRApp;
}
