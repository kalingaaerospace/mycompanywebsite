<?php

/**
 * Example API Endpoint
 * Demonstrates usage of the backend configuration and utilities
 */

require_once __DIR__ . '/../middleware.php';

try {
    // Setup API middleware with authentication required
    $user = setupApiMiddleware([
        'cors' => true,
        'logging' => true,
        'auth' => true, // Require authentication
        'rate_limit' => true,
        'rate_limit_options' => [
            'max_requests' => 50,
            'time_window' => 3600 // 1 hour
        ],
        'validation_rules' => [
            'name' => ['required', 'min:2', 'max:100'],
            'email' => ['required', 'email']
        ]
    ]);

    // Get database instance
    $db = getDatabase();
    
    // Handle different HTTP methods
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // Example: Get user profile
            $profile = $db->select('profiles', ['*'], ['user_id' => $user['id']]);
            
            sendSuccessResponse($profile, 'Profile retrieved successfully');
            break;
            
        case 'POST':
            // Example: Create or update profile
            $data = getRequestBody();
            
            // Sanitize input
            $data = sanitizeInput($data);
            
            // Add user ID and timestamp
            $data['user_id'] = $user['id'];
            $data['updated_at'] = date('Y-m-d H:i:s');
            
            // Insert or update profile
            $result = $db->insert('profiles', $data, true); // upsert
            
            sendSuccessResponse($result, 'Profile saved successfully');
            break;
            
        case 'PUT':
            // Example: Update profile
            $data = getRequestBody();
            $data = sanitizeInput($data);
            $data['updated_at'] = date('Y-m-d H:i:s');
            
            $result = $db->update('profiles', $data, ['user_id' => $user['id']]);
            
            sendSuccessResponse($result, 'Profile updated successfully');
            break;
            
        case 'DELETE':
            // Example: Delete profile
            $result = $db->delete('profiles', ['user_id' => $user['id']]);
            
            sendSuccessResponse($result, 'Profile deleted successfully');
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
