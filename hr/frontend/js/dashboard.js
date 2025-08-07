/**
 * Dashboard Module
 * Handles dashboard data loading and display
 */

class DashboardManager {
    constructor() {
        this.isLoaded = false;
        this.init();
    }

    init() {
        // Dashboard will be loaded when user authenticates
    }

    async loadDashboardData() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            return;
        }

        try {
            window.uiManager.showLoading();

            // Load dashboard statistics
            await this.loadStats();
            
            // Load recent activities
            await this.loadRecentActivities();

            this.isLoaded = true;
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            window.uiManager.showToast('Failed to load dashboard data', 'error');
        } finally {
            window.uiManager.hideLoading();
        }
    }

    async loadStats() {
        try {
            const stats = await window.apiManager.getDashboardStats();
            
            // Update stat cards
            this.updateStatCard('totalEmployees', stats.totalEmployees);
            this.updateStatCard('totalFiles', stats.totalFiles);
            this.updateStatCard('activeEmployees', stats.activeEmployees);
            this.updateStatCard('recentUploads', stats.recentUploads);

        } catch (error) {
            console.error('Error loading stats:', error);
            // Set default values
            this.updateStatCard('totalEmployees', 0);
            this.updateStatCard('totalFiles', 0);
            this.updateStatCard('activeEmployees', 0);
            this.updateStatCard('recentUploads', 0);
        }
    }

    updateStatCard(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // Animate the number change
            this.animateNumber(element, parseInt(element.textContent) || 0, value);
        }
    }

    animateNumber(element, start, end) {
        const duration = 1000; // 1 second
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.round(start + (end - start) * easeOutQuart);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        requestAnimationFrame(updateNumber);
    }

    async loadRecentActivities() {
        try {
            const activities = await window.apiManager.getRecentActivities();
            const container = document.getElementById('recentActivities');
            
            if (!container) return;

            if (activities.length === 0) {
                container.innerHTML = `
                    <div class="activity-item">
                        <i class="fas fa-info-circle"></i>
                        <span>No recent activities</span>
                    </div>
                `;
                return;
            }

            container.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <i class="${activity.icon}"></i>
                    <div class="activity-content">
                        <span class="activity-message">${activity.message}</span>
                        <small class="activity-time">${window.uiManager.formatDate(activity.date)}</small>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading recent activities:', error);
            const container = document.getElementById('recentActivities');
            if (container) {
                container.innerHTML = `
                    <div class="activity-item">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Failed to load activities</span>
                    </div>
                `;
            }
        }
    }

    async refreshDashboard() {
        await this.loadDashboardData();
        window.uiManager.showToast('Dashboard refreshed', 'success');
    }

    // Method to add new activity (called from other modules)
    addActivity(activity) {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        // Create new activity element
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item';
        activityElement.innerHTML = `
            <i class="${activity.icon}"></i>
            <div class="activity-content">
                <span class="activity-message">${activity.message}</span>
                <small class="activity-time">Just now</small>
            </div>
        `;

        // Add to top of list
        const firstChild = container.firstChild;
        if (firstChild) {
            container.insertBefore(activityElement, firstChild);
        } else {
            container.appendChild(activityElement);
        }

        // Remove "No recent activities" message if it exists
        const noActivityMessage = container.querySelector('.activity-item:only-child');
        if (noActivityMessage && noActivityMessage.textContent.includes('No recent activities')) {
            container.removeChild(noActivityMessage);
        }

        // Limit to 10 activities
        const activities = container.querySelectorAll('.activity-item');
        if (activities.length > 10) {
            container.removeChild(activities[activities.length - 1]);
        }

        // Highlight new activity
        activityElement.style.backgroundColor = '#e3f2fd';
        setTimeout(() => {
            activityElement.style.backgroundColor = '';
        }, 3000);
    }

    // Get dashboard summary for other modules
    getCurrentStats() {
        return {
            totalEmployees: parseInt(document.getElementById('totalEmployees')?.textContent) || 0,
            totalFiles: parseInt(document.getElementById('totalFiles')?.textContent) || 0,
            activeEmployees: parseInt(document.getElementById('activeEmployees')?.textContent) || 0,
            recentUploads: parseInt(document.getElementById('recentUploads')?.textContent) || 0
        };
    }
}

// Initialize dashboard manager
let dashboardManager;
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
    window.dashboardManager = dashboardManager; // Make it globally accessible
});
