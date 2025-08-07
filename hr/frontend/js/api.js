/**
 * API Module
 * Handles all backend API communications
 */

class APIManager {
    constructor() {
        this.baseUrl = window.APP_CONFIG.api.baseUrl;
        this.supabaseUrl = window.APP_CONFIG.supabase.url;
        this.supabaseAnonKey = window.APP_CONFIG.supabase.anonKey;
    }

    getAuthHeaders() {
        if (window.authManager && window.authManager.isAuthenticated()) {
            return window.authManager.getAuthHeaders();
        }
        return {
            'apikey': this.supabaseAnonKey,
            'Content-Type': 'application/json'
        };
    }

    async handleResponse(response) {
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
        }
        
        const text = await response.text();
        if (!text) {
            return null;
        }
        
        try {
            return JSON.parse(text);
        } catch (e) {
            return text;
        }
    }

    // Generic Supabase REST API methods
    async select(table, columns = '*', filters = {}, options = {}) {
        try {
            const url = new URL(`${this.supabaseUrl}/rest/v1/${table}`);
            
            // Add select parameter
            url.searchParams.append('select', columns);
            
            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    // Handle operators like ['gte', 18]
                    url.searchParams.append(key, `${value[0]}.${value[1]}`);
                } else {
                    url.searchParams.append(key, `eq.${value}`);
                }
            });
            
            // Add options (limit, order, etc.)
            Object.entries(options).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Error selecting from ${table}:`, error);
            throw error;
        }
    }

    async insert(table, data, returnData = true) {
        try {
            const headers = this.getAuthHeaders();
            if (returnData) {
                headers['Prefer'] = 'return=representation';
            }

            const response = await fetch(`${this.supabaseUrl}/rest/v1/${table}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Error inserting into ${table}:`, error);
            throw error;
        }
    }

    async update(table, data, filters, returnData = true) {
        try {
            const url = new URL(`${this.supabaseUrl}/rest/v1/${table}`);
            
            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
                url.searchParams.append(key, `eq.${value}`);
            });

            const headers = this.getAuthHeaders();
            if (returnData) {
                headers['Prefer'] = 'return=representation';
            }

            const response = await fetch(url.toString(), {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify(data)
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Error updating ${table}:`, error);
            throw error;
        }
    }

    async delete(table, filters, returnData = false) {
        try {
            const url = new URL(`${this.supabaseUrl}/rest/v1/${table}`);
            
            // Add filters
            Object.entries(filters).forEach(([key, value]) => {
                url.searchParams.append(key, `eq.${value}`);
            });

            const headers = this.getAuthHeaders();
            if (returnData) {
                headers['Prefer'] = 'return=representation';
            }

            const response = await fetch(url.toString(), {
                method: 'DELETE',
                headers: headers
            });

            return await this.handleResponse(response);
        } catch (error) {
            console.error(`Error deleting from ${table}:`, error);
            throw error;
        }
    }

    // File operations
    async uploadFile(bucket, filePath, file, options = {}) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const headers = {
                'Authorization': `Bearer ${window.authManager.getAuthToken()}`,
                'apikey': this.supabaseAnonKey
            };

            if (options.contentType) {
                headers['Content-Type'] = options.contentType;
            }

            const response = await fetch(
                `${this.supabaseUrl}/storage/v1/object/${bucket}/${filePath}`,
                {
                    method: 'POST',
                    headers: headers,
                    body: formData
                }
            );

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    async deleteFile(bucket, filePath) {
        try {
            const response = await fetch(
                `${this.supabaseUrl}/storage/v1/object/${bucket}/${filePath}`,
                {
                    method: 'DELETE',
                    headers: this.getAuthHeaders()
                }
            );

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    async getFileUrl(bucket, filePath, expiresIn = 3600) {
        try {
            const response = await fetch(
                `${this.supabaseUrl}/storage/v1/object/sign/${bucket}/${filePath}`,
                {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({ expiresIn })
                }
            );

            const data = await this.handleResponse(response);
            return data?.signedURL || null;
        } catch (error) {
            console.error('Error getting file URL:', error);
            throw error;
        }
    }

    async listFiles(bucket, path = '') {
        try {
            const response = await fetch(
                `${this.supabaseUrl}/storage/v1/object/list/${bucket}`,
                {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify({
                        limit: 100,
                        prefix: path
                    })
                }
            );

            return await this.handleResponse(response);
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    }

    // Employee-specific API methods
    async getEmployees(filters = {}) {
        return await this.select('profiles', '*', filters, { order: 'created_at.desc' });
    }

    async createEmployee(employeeData) {
        return await this.insert('profiles', employeeData);
    }

    async updateEmployee(employeeId, employeeData) {
        return await this.update('profiles', employeeData, { id: employeeId });
    }

    async deleteEmployee(employeeId) {
        return await this.delete('profiles', { id: employeeId });
    }

    // File-specific API methods
    async getFiles(userId = null) {
        const currentUser = window.authManager.getCurrentUser();
        const filters = userId ? { user_id: userId } : { user_id: currentUser.id };
        return await this.select('files', '*', filters, { order: 'upload_date.desc' });
    }

    async createFileRecord(fileData) {
        const currentUser = window.authManager.getCurrentUser();
        return await this.insert('files', {
            ...fileData,
            user_id: currentUser.id
        });
    }

    async deleteFileRecord(fileId) {
        return await this.delete('files', { id: fileId });
    }

    // Dashboard API methods
    async getDashboardStats() {
        try {
            const [employees, files] = await Promise.all([
                this.select('profiles', 'id,status'),
                this.select('files', 'id,upload_date')
            ]);

            const totalEmployees = employees?.length || 0;
            const activeEmployees = employees?.filter(emp => emp.status === 'active').length || 0;
            const totalFiles = files?.length || 0;
            
            // Count recent uploads (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const recentUploads = files?.filter(file => 
                new Date(file.upload_date) > weekAgo
            ).length || 0;

            return {
                totalEmployees,
                activeEmployees,
                totalFiles,
                recentUploads
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return {
                totalEmployees: 0,
                activeEmployees: 0,
                totalFiles: 0,
                recentUploads: 0
            };
        }
    }

    async getRecentActivities() {
        try {
            // Get recent file uploads and employee updates
            const [recentFiles, recentEmployees] = await Promise.all([
                this.select('files', 'filename,upload_date', {}, { 
                    order: 'upload_date.desc', 
                    limit: 5 
                }),
                this.select('profiles', 'first_name,last_name,created_at', {}, { 
                    order: 'created_at.desc', 
                    limit: 5 
                })
            ]);

            const activities = [];

            // Add file activities
            recentFiles?.forEach(file => {
                activities.push({
                    type: 'file_upload',
                    message: `File "${file.filename}" was uploaded`,
                    date: file.upload_date,
                    icon: 'fas fa-file-upload'
                });
            });

            // Add employee activities
            recentEmployees?.forEach(employee => {
                const name = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'New Employee';
                activities.push({
                    type: 'employee_added',
                    message: `${name} was added to the system`,
                    date: employee.created_at,
                    icon: 'fas fa-user-plus'
                });
            });

            // Sort by date and return top 10
            return activities
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10);

        } catch (error) {
            console.error('Error getting recent activities:', error);
            return [];
        }
    }

    // Profile API methods
    async getProfile(userId = null) {
        const currentUser = window.authManager.getCurrentUser();
        const id = userId || currentUser.id;
        const profiles = await this.select('profiles', '*', { user_id: id });
        return profiles?.[0] || null;
    }

    async updateProfile(profileData) {
        const currentUser = window.authManager.getCurrentUser();
        const existingProfile = await this.getProfile();
        
        if (existingProfile) {
            return await this.update('profiles', profileData, { user_id: currentUser.id });
        } else {
            return await this.insert('profiles', {
                ...profileData,
                user_id: currentUser.id
            });
        }
    }
}

// Initialize API manager
let apiManager;
document.addEventListener('DOMContentLoaded', () => {
    apiManager = new APIManager(); 
    window.apiManager = apiManager; // Make it globally accessible
});
