<?php

/**
 * File Management API
 * Handles file upload, download, and management operations
 */

require_once __DIR__ . '/../middleware.php';

try {
    // Setup API middleware with authentication required
    $user = setupApiMiddleware([
        'cors' => true,
        'logging' => true,
        'auth' => true,
        'rate_limit' => true
    ]);

    // Get database instance
    $db = getDatabase();
    
    // Handle different HTTP methods
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetFiles($db, $user);
            break;
            
        case 'POST':
            handleFileUpload($db, $user);
            break;
            
        case 'DELETE':
            handleDeleteFile($db, $user);
            break;
            
        default:
            throw new AppException('Method not allowed', 405);
    }
    
} catch (AuthException $e) {
    sendErrorResponse($e->getMessage(), 401);
} catch (ValidationException $e) {
    sendErrorResponse($e->getMessage(), 400);
} catch (AppException $e) {
    sendErrorResponse($e->getMessage(), $e->getCode());
} catch (Exception $e) {
    // This will be handled by the global exception handler
    throw $e;
}

function handleGetFiles($db, $user) {
    try {
        // Get all files for the current user
        $files = $db->select('files', ['*'], ['user_id' => $user['id']], ['order' => 'upload_date.desc']);
        
        sendSuccessResponse($files, 'Files retrieved successfully');
        
    } catch (Exception $e) {
        throw new AppException('Failed to retrieve files: ' . $e->getMessage(), 500);
    }
}

function handleFileUpload($db, $user) {
    try {
        // Check if file was uploaded
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            throw new ValidationException('No file uploaded or upload error');
        }
        
        $file = $_FILES['file'];
        
        // Validate file
        validateUploadedFile($file);
        
        // Generate unique filename
        $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $uniqueFilename = uniqid() . '_' . time() . '.' . $fileExtension;
        $userFolder = $user['id'];
        $relativePath = $userFolder . '/' . $uniqueFilename;
        
        // Upload to Supabase Storage using the database helper
        $uploadResult = $db->uploadFile('user-files', $relativePath, file_get_contents($file['tmp_name']), [
            'content_type' => $file['type'],
            'upsert' => false
        ]);
        
        // Create file record in database
        $fileData = [
            'user_id' => $user['id'],
            'filename' => $uniqueFilename,
            'original_name' => $file['name'],
            'file_size' => $file['size'],
            'file_type' => $file['type'],
            'file_path' => $relativePath,
            'upload_date' => date('Y-m-d H:i:s')
        ];
        
        $result = $db->insert('files', $fileData);
        
        sendSuccessResponse($result, 'File uploaded successfully');
        
    } catch (ValidationException $e) {
        throw $e;
    } catch (Exception $e) {
        throw new AppException('Failed to upload file: ' . $e->getMessage(), 500);
    }
}

function handleDeleteFile($db, $user) {
    try {
        $fileId = $_GET['id'] ?? null;
        
        if (empty($fileId)) {
            throw new ValidationException('File ID is required');
        }
        
        // Get file information first
        $files = $db->select('files', ['*'], ['id' => $fileId, 'user_id' => $user['id']]);
        
        if (empty($files)) {
            throw new AppException('File not found or access denied', 404);
        }
        
        $file = $files[0];
        
        // Delete from Supabase Storage
        try {
            $db->deleteFile('user-files', $file['file_path']);
        } catch (Exception $e) {
            // Log the error but continue with database cleanup
            error_log('Failed to delete file from storage: ' . $e->getMessage());
        }
        
        // Delete from database
        $result = $db->delete('files', ['id' => $fileId, 'user_id' => $user['id']]);
        
        sendSuccessResponse(['deleted' => !empty($result)], 'File deleted successfully');
        
    } catch (ValidationException $e) {
        throw $e;
    } catch (AppException $e) {
        throw $e;
    } catch (Exception $e) {
        throw new AppException('Failed to delete file: ' . $e->getMessage(), 500);
    }
}

function validateUploadedFile($file) {
    $maxFileSize = getConfig('app.max_file_size') ?: 10485760; // 10MB default
    $allowedTypes = explode(',', getConfig('app.allowed_file_types') ?: 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt,csv');
    
    // Check file size
    if ($file['size'] > $maxFileSize) {
        throw new ValidationException('File size exceeds maximum allowed size (' . formatBytes($maxFileSize) . ')');
    }
    
    // Check file type
    $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($fileExtension, $allowedTypes)) {
        throw new ValidationException('File type not allowed. Allowed types: ' . implode(', ', $allowedTypes));
    }
    
    // Check for malicious content (basic check)
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    $allowedMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
    ];
    
    if (!in_array($mimeType, $allowedMimeTypes)) {
        throw new ValidationException('Invalid file content type');
    }
}

function formatBytes($size, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB'];
    
    for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
        $size /= 1024;
    }
    
    return round($size, $precision) . ' ' . $units[$i];
}
