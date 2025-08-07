<?php

/**
 * Employee Management API
 * Handles CRUD operations for employee data
 */

require_once __DIR__ . '/../middleware.php';

try {
    // Setup API middleware with authentication required
    $user = setupApiMiddleware([
        'cors' => true,
        'logging' => true,
        'auth' => true,
        'rate_limit' => true,
        'content_type' => true
    ]);

    // Get database instance
    $db = getDatabase();
    
    // Handle different HTTP methods
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGetEmployees($db, $user);
            break;
            
        case 'POST':
            handleCreateEmployee($db, $user);
            break;
            
        case 'PUT':
            handleUpdateEmployee($db, $user);
            break;
            
        case 'DELETE':
            handleDeleteEmployee($db, $user);
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

function handleGetEmployees($db, $user) {
    try {
        // Get all employees for the current user
        $employees = $db->select('profiles', ['*'], ['user_id' => $user['id']], ['order' => 'created_at.desc']);
        
        sendSuccessResponse($employees, 'Employees retrieved successfully');
        
    } catch (Exception $e) {
        throw new AppException('Failed to retrieve employees: ' . $e->getMessage(), 500);
    }
}

function handleCreateEmployee($db, $user) {
    try {
        $data = getRequestBody();
        
        // Validate required fields
        $requiredFields = ['first_name', 'last_name', 'email', 'department', 'position'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                throw new ValidationException("Field '{$field}' is required");
            }
        }
        
        // Validate email format
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException('Invalid email format');
        }
        
        // Sanitize input
        $data = sanitizeInput($data);
        
        // Add metadata
        $data['user_id'] = $user['id'];
        $data['status'] = $data['status'] ?? 'active';
        $data['created_at'] = date('Y-m-d H:i:s');
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        // Insert employee
        $result = $db->insert('profiles', $data);
        
        sendSuccessResponse($result, 'Employee created successfully');
        
    } catch (ValidationException $e) {
        throw $e;
    } catch (Exception $e) {
        throw new AppException('Failed to create employee: ' . $e->getMessage(), 500);
    }
}

function handleUpdateEmployee($db, $user) {
    try {
        $data = getRequestBody();
        
        if (empty($data['id'])) {
            throw new ValidationException('Employee ID is required');
        }
        
        $employeeId = $data['id'];
        unset($data['id']);
        
        // Sanitize input
        $data = sanitizeInput($data);
        
        // Add metadata
        $data['updated_at'] = date('Y-m-d H:i:s');
        
        // Update employee (RLS will ensure user can only update their own employees)
        $result = $db->update('profiles', $data, ['id' => $employeeId, 'user_id' => $user['id']]);
        
        if (empty($result)) {
            throw new AppException('Employee not found or access denied', 404);
        }
        
        sendSuccessResponse($result, 'Employee updated successfully');
        
    } catch (ValidationException $e) {
        throw $e;
    } catch (Exception $e) {
        throw new AppException('Failed to update employee: ' . $e->getMessage(), 500);
    }
}

function handleDeleteEmployee($db, $user) {
    try {
        $employeeId = $_GET['id'] ?? null;
        
        if (empty($employeeId)) {
            throw new ValidationException('Employee ID is required');
        }
        
        // Delete employee (RLS will ensure user can only delete their own employees)
        $result = $db->delete('profiles', ['id' => $employeeId, 'user_id' => $user['id']]);
        
        sendSuccessResponse(['deleted' => !empty($result)], 'Employee deleted successfully');
        
    } catch (ValidationException $e) {
        throw $e;
    } catch (Exception $e) {
        throw new AppException('Failed to delete employee: ' . $e->getMessage(), 500);
    }
}
