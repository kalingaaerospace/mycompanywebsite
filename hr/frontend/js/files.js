/**
 * Files Module
 * Handles file upload, download, and management functionality
 */

class FilesManager {
    constructor() {
        this.files = [];
        this.currentUpload = null;
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'text/csv'
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.setupFileFiltering();
    }

    setupEventListeners() {
        // Upload file button
        const uploadBtn = document.getElementById('uploadFileBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.triggerFileInput());
        }

        // File input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        }

        // Upload area click
        const uploadArea = document.getElementById('fileUploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('click', () => this.triggerFileInput());
        }
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('fileUploadArea');
        if (!uploadArea) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.highlight(uploadArea), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.unhighlight(uploadArea), false);
        });

        uploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(element) {
        element.classList.add('drag-over');
    }

    unhighlight(element) {
        element.classList.remove('drag-over');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        this.handleFiles(Array.from(files));
    }

    triggerFileInput() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    handleFileSelection(e) {
        const files = Array.from(e.target.files);
        this.handleFiles(files);
        // Reset input so same file can be selected again
        e.target.value = '';
    }

    handleFiles(files) {
        if (files.length === 0) return;

        // Validate files
        const validFiles = [];
        const errors = [];

        files.forEach(file => {
            const validation = this.validateFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                errors.push(`${file.name}: ${validation.error}`);
            }
        });

        // Show validation errors
        if (errors.length > 0) {
            window.uiManager.showToast(
                `Some files were rejected:\n${errors.join('\n')}`, 
                'warning'
            );
        }

        // Upload valid files
        if (validFiles.length > 0) {
            this.uploadFiles(validFiles);
        }
    }

    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `File too large (max ${window.uiManager.formatFileSize(this.maxFileSize)})`
            };
        }

        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'File type not allowed'
            };
        }

        return { valid: true };
    }

    async uploadFiles(files) {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            window.uiManager.showToast('Please log in to upload files', 'error');
            return;
        }

        const progressContainer = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressContainer) {
            progressContainer.style.display = 'block';
        }

        let completedFiles = 0;
        const totalFiles = files.length;

        for (const file of files) {
            try {
                await this.uploadSingleFile(file, (progress) => {
                    const overallProgress = ((completedFiles / totalFiles) + (progress / totalFiles)) * 100;
                    this.updateProgress(overallProgress, progressFill, progressText);
                });

                completedFiles++;
                window.uiManager.showToast(`${file.name} uploaded successfully`, 'success');

                // Add activity to dashboard
                if (window.dashboardManager) {
                    window.dashboardManager.addActivity({
                        icon: 'fas fa-file-upload',
                        message: `File "${file.name}" was uploaded`
                    });
                }

            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                window.uiManager.showToast(`Failed to upload ${file.name}`, 'error');
                completedFiles++;
            }
        }

        // Hide progress and refresh files
        if (progressContainer) {
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 1000);
        }

        await this.loadFiles();
    }

    async uploadSingleFile(file, onProgress) {
        const currentUser = window.authManager.getCurrentUser();
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${currentUser.id}/${fileName}`;

        // Upload to Supabase Storage
        await window.apiManager.uploadFile('user-files', filePath, file);

        // Create file record in database
        const fileData = {
            filename: fileName,
            original_name: file.name,
            file_size: file.size,
            file_type: file.type,
            file_path: filePath,
            upload_date: new Date().toISOString()
        };

        await window.apiManager.createFileRecord(fileData);

        // Simulate progress for better UX
        if (onProgress) {
            for (let progress = 0; progress <= 100; progress += 20) {
                onProgress(progress);
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    }

    updateProgress(percentage, fillElement, textElement) {
        if (fillElement) {
            fillElement.style.width = `${percentage}%`;
        }
        if (textElement) {
            textElement.textContent = `${Math.round(percentage)}%`;
        }
    }

    async loadFiles() {
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            return;
        }

        try {
            this.files = await window.apiManager.getFiles() || [];
            this.renderFilesGrid();
        } catch (error) {
            console.error('Error loading files:', error);
            window.uiManager.showToast('Failed to load files', 'error');
            this.renderErrorState();
        }
    }

    renderFilesGrid() {
        const grid = document.getElementById('filesGrid');
        if (!grid) return;

        if (this.files.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <h3>No files uploaded yet</h3>
                    <p>Upload your first file to get started</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.files.map(file => `
            <div class="file-card" data-file-id="${file.id}">
                <div class="file-header">
                    <div class="file-icon">
                        <i class="${window.uiManager.getFileIcon(file.original_name)}"></i>
                    </div>
                    <div class="file-info">
                        <h3 title="${file.original_name}">${this.truncateFileName(file.original_name)}</h3>
                        <p>${window.uiManager.formatFileSize(file.file_size)} • ${window.uiManager.formatDate(file.upload_date)}</p>
                    </div>
                </div>
                <div class="file-meta">
                    <span class="file-type">${this.getFileTypeLabel(file.file_type)}</span>
                </div>
                <div class="file-actions">
                    <button class="btn btn-info btn-sm" onclick="filesManager.downloadFile('${file.id}')" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="filesManager.copyFileLink('${file.id}')" title="Copy Link">
                        <i class="fas fa-link"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="filesManager.deleteFile('${file.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderErrorState() {
        const grid = document.getElementById('filesGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load files</h3>
                    <p>Please try refreshing the page</p>
                </div>
            `;
        }
    }

    truncateFileName(fileName, maxLength = 25) {
        if (fileName.length <= maxLength) return fileName;
        
        const extension = fileName.split('.').pop();
        const name = fileName.substring(0, fileName.lastIndexOf('.'));
        const truncatedName = name.substring(0, maxLength - extension.length - 4) + '...';
        
        return `${truncatedName}.${extension}`;
    }

    getFileTypeLabel(mimeType) {
        const typeMap = {
            'image/jpeg': 'JPEG Image',
            'image/png': 'PNG Image',
            'image/gif': 'GIF Image',
            'application/pdf': 'PDF Document',
            'application/msword': 'Word Document',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
            'application/vnd.ms-excel': 'Excel Spreadsheet',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
            'text/plain': 'Text File',
            'text/csv': 'CSV File'
        };

        return typeMap[mimeType] || 'Unknown';
    }

    async downloadFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file) {
            window.uiManager.showToast('File not found', 'error');
            return;
        }

        try {
            window.uiManager.showLoading();
            
            // Get signed URL for download
            const signedUrl = await window.apiManager.getFileUrl('user-files', file.file_path);
            
            if (signedUrl) {
                // Create temporary link and trigger download
                const link = document.createElement('a');
                link.href = signedUrl;
                link.download = file.original_name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                window.uiManager.showToast('Download started', 'success');
            } else {
                throw new Error('Failed to generate download URL');
            }
            
        } catch (error) {
            console.error('Error downloading file:', error);
            window.uiManager.showToast('Failed to download file', 'error');
        } finally {
            window.uiManager.hideLoading();
        }
    }

    async copyFileLink(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file) {
            window.uiManager.showToast('File not found', 'error');
            return;
        }

        try {
            // Get signed URL (valid for 1 hour)
            const signedUrl = await window.apiManager.getFileUrl('user-files', file.file_path, 3600);
            
            if (signedUrl) {
                window.uiManager.copyToClipboard(signedUrl);
            } else {
                throw new Error('Failed to generate file URL');
            }
            
        } catch (error) {
            console.error('Error getting file link:', error);
            window.uiManager.showToast('Failed to copy file link', 'error');
        }
    }

    async deleteFile(fileId) {
        const file = this.files.find(f => f.id === fileId);
        if (!file) {
            window.uiManager.showToast('File not found', 'error');
            return;
        }

        window.uiManager.showConfirmDialog(
            `Are you sure you want to delete "${file.original_name}"? This action cannot be undone.`,
            async () => {
                try {
                    window.uiManager.showLoading();
                    
                    // Delete from storage
                    await window.apiManager.deleteFile('user-files', file.file_path);
                    
                    // Delete from database
                    await window.apiManager.deleteFileRecord(fileId);
                    
                    window.uiManager.showToast('File deleted successfully', 'success');
                    
                    // Add activity to dashboard
                    if (window.dashboardManager) {
                        window.dashboardManager.addActivity({
                            icon: 'fas fa-file-minus',
                            message: `File "${file.original_name}" was deleted`
                        });
                    }
                    
                    // Refresh files
                    await this.loadFiles();
                    
                } catch (error) {
                    console.error('Error deleting file:', error);
                    window.uiManager.showToast('Failed to delete file', 'error');
                } finally {
                    window.uiManager.hideLoading();
                }
            }
        );
    }

    // Get file statistics
    getFileStats() {
        const totalFiles = this.files.length;
        const totalSize = this.files.reduce((sum, file) => sum + (file.file_size || 0), 0);
        
        const typeStats = {};
        this.files.forEach(file => {
            const type = this.getFileTypeLabel(file.file_type);
            typeStats[type] = (typeStats[type] || 0) + 1;
        });

        return {
            totalFiles,
            totalSize,
            averageSize: totalFiles > 0 ? totalSize / totalFiles : 0,
            typeStats
        };
    }

    setupFileFiltering() {
        const fileSearch = document.getElementById('fileSearch');
        const fileTypeFilter = document.getElementById('fileTypeFilter');
        const fileDateFilter = document.getElementById('fileDateFilter');

        if (fileSearch) {
            fileSearch.addEventListener('input', () => this.filterFiles());
        }

        if (fileTypeFilter) {
            fileTypeFilter.addEventListener('change', () => this.filterFiles());
        }

        if (fileDateFilter) {
            fileDateFilter.addEventListener('change', () => this.filterFiles());
        }
    }

    filterFiles() {
        const searchTerm = document.getElementById('fileSearch')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('fileTypeFilter')?.value || '';
        const dateFilter = document.getElementById('fileDateFilter')?.value || '';

        let filteredFiles = this.files;

        // Filter by search term
        if (searchTerm) {
            filteredFiles = filteredFiles.filter(file => 
                file.original_name.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by file type
        if (typeFilter) {
            filteredFiles = filteredFiles.filter(file => {
                switch (typeFilter) {
                    case 'pdf':
                        return file.file_type === 'application/pdf';
                    case 'doc':
                        return file.file_type.includes('word') || file.file_type.includes('document');
                    case 'image':
                        return file.file_type.startsWith('image/');
                    case 'text':
                        return file.file_type.startsWith('text/');
                    case 'other':
                        return !file.file_type.startsWith('image/') && 
                               !file.file_type.includes('pdf') && 
                               !file.file_type.includes('word') && 
                               !file.file_type.includes('document') && 
                               !file.file_type.startsWith('text/');
                    default:
                        return true;
                }
            });
        }

        // Filter by date
        if (dateFilter) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            filteredFiles = filteredFiles.filter(file => {
                const fileDate = new Date(file.upload_date);
                switch (dateFilter) {
                    case 'today':
                        return fileDate >= today;
                    case 'week':
                        return fileDate >= thisWeek;
                    case 'month':
                        return fileDate >= thisMonth;
                    case 'older':
                        return fileDate < thisMonth;
                    default:
                        return true;
                }
            });
        }

        this.renderFilteredFiles(filteredFiles);
    }

    renderFilteredFiles(filteredFiles) {
        const grid = document.getElementById('filesGrid');
        if (!grid) return;

        if (filteredFiles.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No files found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredFiles.map(file => `
            <div class="file-card" data-file-id="${file.id}">
                <div class="file-header">
                    <div class="file-icon">
                        <i class="${window.uiManager.getFileIcon(file.original_name)}"></i>
                    </div>
                    <div class="file-info">
                        <h3 title="${file.original_name}">${this.truncateFileName(file.original_name)}</h3>
                        <p>${window.uiManager.formatFileSize(file.file_size)} • ${window.uiManager.formatDate(file.upload_date)}</p>
                    </div>
                </div>
                <div class="file-meta">
                    <span class="file-type">${this.getFileTypeLabel(file.file_type)}</span>
                </div>
                <div class="file-actions">
                    <button class="btn btn-info btn-sm" onclick="filesManager.downloadFile('${file.id}')" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="filesManager.copyFileLink('${file.id}')" title="Copy Link">
                        <i class="fas fa-link"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="filesManager.deleteFile('${file.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Export file list as CSV
    exportFilesList() {
        if (this.files.length === 0) {
            window.uiManager.showToast('No files to export', 'warning');
            return;
        }

        const headers = ['File Name', 'Size', 'Type', 'Upload Date'];
        const csvContent = [
            headers.join(','),
            ...this.files.map(file => [
                file.original_name || '',
                window.uiManager.formatFileSize(file.file_size),
                this.getFileTypeLabel(file.file_type),
                file.upload_date ? new Date(file.upload_date).toLocaleDateString() : ''
            ].map(field => `"${field}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `files_list_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        window.uiManager.showToast('Files list exported successfully', 'success');
    }
}

// Initialize files manager
let filesManager;
document.addEventListener('DOMContentLoaded', () => {
    filesManager = new FilesManager();
    window.filesManager = filesManager; // Make it globally accessible
});
