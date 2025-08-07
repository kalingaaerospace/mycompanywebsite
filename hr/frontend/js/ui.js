/**
 * UI Module
 * Handles user interface interactions and navigation
 */

class UIManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupModalHandlers();
        this.setupResponsiveMenu();
    }

    setupNavigation() {
        // Handle navigation clicks
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });
    }

    setupModalHandlers() {
        // Close modals when clicking outside
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Handle escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    setupResponsiveMenu() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                this.animateHamburger(navToggle);
            });

            // Close menu when clicking on a nav link (mobile)
            const navLinks = navMenu.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    this.resetHamburger(navToggle);
                });
            });
        }
    }

    animateHamburger(toggle) {
        const bars = toggle.querySelectorAll('.bar');
        bars.forEach((bar, index) => {
            if (index === 0) {
                bar.style.transform = toggle.classList.contains('active') ? 
                    'rotate(-45deg) translate(-5px, 6px)' : 'none';
            } else if (index === 1) {
                bar.style.opacity = toggle.classList.contains('active') ? '0' : '1';
            } else if (index === 2) {
                bar.style.transform = toggle.classList.contains('active') ? 
                    'rotate(45deg) translate(-5px, -6px)' : 'none';
            }
        });
        toggle.classList.toggle('active');
    }

    resetHamburger(toggle) {
        const bars = toggle.querySelectorAll('.bar');
        bars.forEach(bar => {
            bar.style.transform = 'none';
            bar.style.opacity = '1';
        });
        toggle.classList.remove('active');
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        this.updateNavigation(sectionName);
        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    updateNavigation(activeSection) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === activeSection) {
                link.classList.add('active');
            }
        });
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                if (window.dashboardManager) {
                    window.dashboardManager.loadDashboardData();
                }
                break;
            case 'employees':
                if (window.employeesManager) {
                    window.employeesManager.loadEmployees();
                }
                break;
            case 'files':
                if (window.filesManager) {
                    window.filesManager.loadFiles();
                }
                break;
            case 'profile':
                if (window.profileManager) {
                    window.profileManager.loadProfile();
                }
                break;
        }
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            // Focus on first input
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
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

    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const title = type.charAt(0).toUpperCase() + type.slice(1);
        
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-title">${title}</span>
                <button class="toast-close" type="button">&times;</button>
            </div>
            <div class="toast-message">${message}</div>
        `;

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        container.appendChild(toast);

        // Auto remove after specified duration
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        return toast;
    }

    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    showConfirmDialog(message, onConfirm, onCancel = null) {
        const overlay = document.createElement('div');
        overlay.className = 'modal';
        overlay.style.display = 'block';
        
        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2>Confirm Action</h2>
                </div>
                <div class="modal-form">
                    <p style="margin-bottom: 2rem; line-height: 1.5;">${message}</p>
                    <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                        <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirmBtn">Confirm</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const confirmBtn = overlay.querySelector('#confirmBtn');
        const cancelBtn = overlay.querySelector('#cancelBtn');

        const cleanup = () => {
            document.body.removeChild(overlay);
        };

        confirmBtn.addEventListener('click', () => {
            cleanup();
            if (onConfirm) onConfirm();
        });

        cancelBtn.addEventListener('click', () => {
            cleanup();
            if (onCancel) onCancel();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cleanup();
                if (onCancel) onCancel();
            }
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileIcon(filename) {
        if (!filename) return 'fas fa-file';
        
        const extension = filename.split('.').pop().toLowerCase();
        
        const iconMap = {
            // Documents
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'txt': 'fas fa-file-alt',
            'rtf': 'fas fa-file-alt',
            
            // Spreadsheets
            'xls': 'fas fa-file-excel',
            'xlsx': 'fas fa-file-excel',
            'csv': 'fas fa-file-csv',
            
            // Presentations
            'ppt': 'fas fa-file-powerpoint',
            'pptx': 'fas fa-file-powerpoint',
            
            // Images
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'bmp': 'fas fa-file-image',
            'svg': 'fas fa-file-image',
            
            // Videos
            'mp4': 'fas fa-file-video',
            'avi': 'fas fa-file-video',
            'mov': 'fas fa-file-video',
            'wmv': 'fas fa-file-video',
            
            // Audio
            'mp3': 'fas fa-file-audio',
            'wav': 'fas fa-file-audio',
            'ogg': 'fas fa-file-audio',
            
            // Archives
            'zip': 'fas fa-file-archive',
            'rar': 'fas fa-file-archive',
            '7z': 'fas fa-file-archive',
            'tar': 'fas fa-file-archive',
            
            // Code
            'html': 'fas fa-file-code',
            'css': 'fas fa-file-code',
            'js': 'fas fa-file-code',
            'php': 'fas fa-file-code',
            'py': 'fas fa-file-code',
            'java': 'fas fa-file-code',
            'cpp': 'fas fa-file-code',
            'c': 'fas fa-file-code'
        };
        
        return iconMap[extension] || 'fas fa-file';
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Copied to clipboard!', 'success');
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('Copied to clipboard!', 'success');
        } catch (err) {
            this.showToast('Failed to copy to clipboard', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

// Make showSection globally available
function showSection(sectionName) {
    if (window.uiManager) {
        window.uiManager.showSection(sectionName);
    }
}

// Initialize UI manager
let uiManager;
document.addEventListener('DOMContentLoaded', () => {
    uiManager = new UIManager();
    window.uiManager = uiManager; // Make it globally accessible
});
