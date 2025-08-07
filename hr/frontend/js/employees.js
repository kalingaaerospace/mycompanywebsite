/**
 * Employees Module
 * Handles employee management functionality
 */

class EmployeesManager {
    constructor() {
        this.employees = [];
        this.filteredEmployees = [];
        this.currentFilter = '';
        this.currentSearch = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add employee button
        const addEmployeeBtn = document.getElementById('addEmployeeBtn');
        if (addEmployeeBtn) {
            addEmployeeBtn.addEventListener('click', () => this.showAddEmployeeModal());
        }

        // Search functionality
        const searchInput = document.getElementById('employeeSearch');
        if (searchInput) {
            searchInput.addEventListener('input', window.uiManager.debounce((e) => {
                this.currentSearch = e.target.value.toLowerCase();
                this.filterEmployees();
            }, 300));
        }

        // Filter functionality
        const filterSelect = document.getElementById('employeeFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.filterEmployees();
            });
        }
    }

    async loadEmployees() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            return;
        }

        try {
            window.uiManager.showLoading();
            this.employees = await window.apiManager.getEmployees() || [];
            this.filteredEmployees = [...this.employees];
            this.renderEmployees();
        } catch (error) {
            console.error('Error loading employees:', error);
            window.uiManager.showToast('Failed to load employees', 'error');
            this.renderErrorState();
        } finally {
            window.uiManager.hideLoading();
        }
    }

    filterEmployees() {
        this.filteredEmployees = this.employees.filter(employee => {
            const matchesSearch = !this.currentSearch || 
                (employee.first_name && employee.first_name.toLowerCase().includes(this.currentSearch)) ||
                (employee.last_name && employee.last_name.toLowerCase().includes(this.currentSearch)) ||
                (employee.email && employee.email.toLowerCase().includes(this.currentSearch)) ||
                (employee.department && employee.department.toLowerCase().includes(this.currentSearch)) ||
                (employee.position && employee.position.toLowerCase().includes(this.currentSearch));

            const matchesFilter = !this.currentFilter || 
                (employee.status && employee.status === this.currentFilter);

            return matchesSearch && matchesFilter;
        });

        this.renderEmployees();
    }

    renderEmployees() {
        const employeeGrid = document.getElementById('employeeGrid');
        if (!employeeGrid) return;

        if (this.filteredEmployees.length === 0) {
            employeeGrid.innerHTML = `
                <div class="employee-empty-state">
                    <i class="fas fa-users"></i>
                    <h3>${this.employees.length === 0 ? 'No Employees Yet' : 'No Matching Employees'}</h3>
                    <p>${this.employees.length === 0 ? 'Get started by adding your first employee to the system.' : 'Try adjusting your search criteria to find what you\'re looking for.'}</p>
                    ${this.employees.length === 0 ? '<button class="add-employee-btn" onclick="employeesManager.showAddEmployeeModal()"><i class="fas fa-plus"></i> Add First Employee</button>' : ''}
                </div>
            `;
            return;
        }

        employeeGrid.innerHTML = this.filteredEmployees.map(employee => `
            <div class="employee-card" data-employee-id="${employee.id}">
                <div class="employee-card-header">
                    <div class="employee-avatar">
                        ${this.getInitials(employee)}
                    </div>
                    <div class="employee-info">
                        <h3>${this.getDisplayName(employee)}</h3>
                        <p><i class="fas fa-envelope"></i> ${employee.email || 'No email'}</p>
                        <p><i class="fas fa-phone"></i> ${employee.phone || 'No phone'}</p>
                    </div>
                </div>
                
                <div class="employee-details">
                    <div class="employee-detail-item">
                        <span class="employee-detail-label">Department:</span>
                        <span class="employee-detail-value">${this.formatDepartment(employee.department)}</span>
                    </div>
                    <div class="employee-detail-item">
                        <span class="employee-detail-label">Position:</span>
                        <span class="employee-detail-value">${employee.position || 'Not specified'}</span>
                    </div>
                    <div class="employee-detail-item">
                        <span class="employee-detail-label">Status:</span>
                        <span class="employee-detail-value">
                            <span class="status-badge status-${employee.status || 'inactive'}">
                                ${this.formatStatus(employee.status)}
                            </span>
                        </span>
                    </div>
                </div>
                
                <div class="employee-actions">
                    <button class="employee-action-btn edit" onclick="employeesManager.editEmployee('${employee.id}')" title="Edit Employee">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="employee-action-btn delete" onclick="employeesManager.deleteEmployee('${employee.id}')" title="Delete Employee">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderErrorState() {
        const employeeGrid = document.getElementById('employeeGrid');
        if (employeeGrid) {
            employeeGrid.innerHTML = `
                <div class="employee-empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                    <h3>Failed to Load Employees</h3>
                    <p>There was an error loading the employee data. Please try refreshing the page.</p>
                    <button class="add-employee-btn" onclick="location.reload()">
                        <i class="fas fa-refresh"></i> Refresh Page
                    </button>
                </div>
            `;
        }
    }

    getDisplayName(employee) {
        if (employee.first_name || employee.last_name) {
            return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
        }
        return employee.email || 'Unknown';
    }

    formatDepartment(department) {
        if (!department) return 'N/A';
        
        const departmentMap = {
            'hr': 'Human Resources',
            'it': 'Information Technology',
            'finance': 'Finance',
            'marketing': 'Marketing',
            'operations': 'Operations',
            'sales': 'Sales',
            'engineering': 'Engineering'
        };
        
        return departmentMap[department] || department;
    }

    formatStatus(status) {
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Inactive';
    }

    showAddEmployeeModal() {
        const modal = this.createEmployeeModal();
        document.body.appendChild(modal);
    }

    async editEmployee(employeeId) {
        const employee = this.employees.find(emp => emp.id === employeeId);
        if (!employee) {
            window.uiManager.showToast('Employee not found', 'error');
            return;
        }

        const modal = this.createEmployeeModal(employee);
        document.body.appendChild(modal);
    }

    createEmployeeModal(employee = null) {
        const isEdit = !!employee;
        const modalId = 'employeeModal';
        
        const overlay = document.createElement('div');
        overlay.className = 'employee-modal';
        overlay.id = modalId;
        overlay.style.display = 'block';
        
        overlay.innerHTML = `
            <div class="employee-modal-content">
                <div class="employee-modal-header">
                    <h2>
                        <i class="fas fa-${isEdit ? 'edit' : 'user-plus'}"></i>
                        ${isEdit ? 'Edit Employee' : 'Add New Employee'}
                    </h2>
                    <span class="close">&times;</span>
                </div>
                <form class="employee-modal-form" id="employeeForm">
                    <div class="employee-form-row">
                        <div class="employee-form-group">
                            <label for="empFirstName" class="required">First Name</label>
                            <input type="text" id="empFirstName" name="first_name" required class="employee-form-input" 
                                   value="${employee?.first_name || ''}" placeholder="Enter first name">
                        </div>
                        <div class="employee-form-group">
                            <label for="empLastName" class="required">Last Name</label>
                            <input type="text" id="empLastName" name="last_name" required class="employee-form-input" 
                                   value="${employee?.last_name || ''}" placeholder="Enter last name">
                        </div>
                    </div>
                    
                    <div class="employee-form-group full-width">
                        <label for="empEmail" class="required">Email Address</label>
                        <input type="email" id="empEmail" name="email" required class="employee-form-input" 
                               value="${employee?.email || ''}" placeholder="Enter email address">
                    </div>
                    
                    <div class="employee-form-row">
                        <div class="employee-form-group">
                            <label for="empPhone">Phone Number</label>
                            <input type="tel" id="empPhone" name="phone" class="employee-form-input" 
                                   value="${employee?.phone || ''}" placeholder="Enter phone number">
                        </div>
                        <div class="employee-form-group">
                            <label for="empDepartment" class="required">Department</label>
                            <select id="empDepartment" name="department" required class="employee-form-select">
                                <option value="">Select Department</option>
                                <option value="hr" ${employee?.department === 'hr' ? 'selected' : ''}>Human Resources</option>
                                <option value="it" ${employee?.department === 'it' ? 'selected' : ''}>Information Technology</option>
                                <option value="finance" ${employee?.department === 'finance' ? 'selected' : ''}>Finance</option>
                                <option value="marketing" ${employee?.department === 'marketing' ? 'selected' : ''}>Marketing</option>
                                <option value="operations" ${employee?.department === 'operations' ? 'selected' : ''}>Operations</option>
                                <option value="sales" ${employee?.department === 'sales' ? 'selected' : ''}>Sales</option>
                                <option value="engineering" ${employee?.department === 'engineering' ? 'selected' : ''}>Engineering</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="employee-form-row">
                        <div class="employee-form-group">
                            <label for="empPosition" class="required">Job Position</label>
                            <input type="text" id="empPosition" name="position" required class="employee-form-input" 
                                   value="${employee?.position || ''}" placeholder="Enter job position">
                        </div>
                        <div class="employee-form-group">
                            <label for="empStatus">Employment Status</label>
                            <select id="empStatus" name="status" class="employee-form-select">
                                <option value="active" ${!employee || employee?.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="inactive" ${employee?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                <option value="on-leave" ${employee?.status === 'on-leave' ? 'selected' : ''}>On Leave</option>
                                <option value="terminated" ${employee?.status === 'terminated' ? 'selected' : ''}>Terminated</option>
                            </select>
                        </div>
                    </div>
                </form>
                <div class="employee-modal-actions">
                    <button type="button" class="employee-modal-btn cancel" id="cancelBtn">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                    <button type="submit" form="employeeForm" class="employee-modal-btn save">
                        <i class="fas fa-save"></i> ${isEdit ? 'Update' : 'Save'} Employee
                    </button>
                </div>
            </div>
        `;

        // Setup event listeners
        const form = overlay.querySelector('#employeeForm');
        const cancelBtn = overlay.querySelector('#cancelBtn');
        const closeBtn = overlay.querySelector('.close');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveEmployee(form, employee);
            document.body.removeChild(overlay);
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        closeBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        return overlay;
    }

    async saveEmployee(form, existingEmployee = null) {
        const formData = new FormData(form);
        const employeeData = Object.fromEntries(formData.entries());

        // Add current user ID and timestamps
        const currentUser = window.authManager.getCurrentUser();
        employeeData.user_id = currentUser.id;
        
        if (!existingEmployee) {
            employeeData.created_at = new Date().toISOString();
        }
        employeeData.updated_at = new Date().toISOString();

        try {
            window.uiManager.showLoading();

            let result;
            if (existingEmployee) {
                result = await window.apiManager.updateEmployee(existingEmployee.id, employeeData);
                window.uiManager.showToast('Employee updated successfully', 'success');
                
                // Add activity
                if (window.dashboardManager) {
                    window.dashboardManager.addActivity({
                        icon: 'fas fa-user-edit',
                        message: `Employee ${employeeData.first_name} ${employeeData.last_name} was updated`
                    });
                }
            } else {
                result = await window.apiManager.createEmployee(employeeData);
                window.uiManager.showToast('Employee added successfully', 'success');
                
                // Add activity
                if (window.dashboardManager) {
                    window.dashboardManager.addActivity({
                        icon: 'fas fa-user-plus',
                        message: `Employee ${employeeData.first_name} ${employeeData.last_name} was added`
                    });
                }
            }

            // Refresh the employees list
            await this.loadEmployees();

        } catch (error) {
            console.error('Error saving employee:', error);
            window.uiManager.showToast(
                existingEmployee ? 'Failed to update employee' : 'Failed to add employee', 
                'error'
            );
        } finally {
            window.uiManager.hideLoading();
        }
    }

    async deleteEmployee(employeeId) {
        const employee = this.employees.find(emp => emp.id === employeeId);
        if (!employee) {
            window.uiManager.showToast('Employee not found', 'error');
            return;
        }

        const employeeName = this.getDisplayName(employee);
        
        window.uiManager.showConfirmDialog(
            `Are you sure you want to delete employee "${employeeName}"? This action cannot be undone.`,
            async () => {
                try {
                    window.uiManager.showLoading();
                    await window.apiManager.deleteEmployee(employeeId);
                    
                    window.uiManager.showToast('Employee deleted successfully', 'success');
                    
                    // Add activity
                    if (window.dashboardManager) {
                        window.dashboardManager.addActivity({
                            icon: 'fas fa-user-minus',
                            message: `Employee ${employeeName} was removed`
                        });
                    }
                    
                    // Refresh the employees list
                    await this.loadEmployees();
                    
                } catch (error) {
                    console.error('Error deleting employee:', error);
                    window.uiManager.showToast('Failed to delete employee', 'error');
                } finally {
                    window.uiManager.hideLoading();
                }
            }
        );
    }

    // Export employees data as CSV
    exportEmployees() {
        if (this.employees.length === 0) {
            window.uiManager.showToast('No employees to export', 'warning');
            return;
        }

        const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Position', 'Status', 'Created'];
        const csvContent = [
            headers.join(','),
            ...this.employees.map(emp => [
                emp.first_name || '',
                emp.last_name || '',
                emp.email || '',
                emp.phone || '',
                this.formatDepartment(emp.department),
                emp.position || '',
                this.formatStatus(emp.status),
                emp.created_at ? new Date(emp.created_at).toLocaleDateString() : ''
            ].map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        window.uiManager.showToast('Employees exported successfully', 'success');
    }

    // Get employee statistics
    getEmployeeStats() {
        const total = this.employees.length;
        const active = this.employees.filter(emp => emp.status === 'active').length;
        const departments = {};
        
        this.employees.forEach(emp => {
            if (emp.department) {
                departments[emp.department] = (departments[emp.department] || 0) + 1;
            }
        });

        return {
            total,
            active,
            inactive: total - active,
            departments
        };
    }

    getInitials(employee) {
        const firstName = employee.first_name || '';
        const lastName = employee.last_name || '';
        
        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        } else if (firstName) {
            return firstName.charAt(0).toUpperCase();
        } else if (lastName) {
            return lastName.charAt(0).toUpperCase();
        } else if (employee.email) {
            return employee.email.charAt(0).toUpperCase();
        }
        
        return '?';
    }
}

// Initialize employees manager
let employeesManager;
document.addEventListener('DOMContentLoaded', () => {
    employeesManager = new EmployeesManager();
    window.employeesManager = employeesManager; // Make it globally accessible
});
