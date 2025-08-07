<?php

/**
 * User Registration API Endpoint
 * Handles user registration with email/password validation,
 * Supabase signup, and JWT token generation
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/auth_rate_limiter.php';
require_once __DIR__ . '/../middleware.php';

use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ServerException;
use GuzzleHttp\Exception\RequestException;

try {
    // Set security headers and CORS
    securityMiddleware();
    corsMiddleware();
    
    // Only allow POST method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new AppException('Method not allowed', 405);
    }
    
    // Apply enhanced rate limiting (5 registration attempts per hour per IP)
    applyAuthRateLimit(getRealIpAddress(), 'register', 5, 3600);
    
    // Get and validate request data
    $data = getRequestBody();
    $data = sanitizeInput($data);
    
    // Validate required fields
    validateRequiredFields($data, ['email', 'password']);
    
    // Additional validation
    $email = trim($data['email']);
    $password = $data['password'];
    
    // Email validation
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new ValidationException('Invalid email format');
    }
    
    // Password validation
    if (strlen($password) < 8) {
        throw new ValidationException('Password must be at least 8 characters long');
    }
    
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/', $password)) {
        throw new ValidationException('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
    
    // Optional fields with defaults
    $fullName = trim($data['full_name'] ?? '');
    $phone = trim($data['phone'] ?? '');
    
    // Prepare Supabase signup data
    $signupData = [
        'email' => $email,
        'password' => $password,
        'options' => [
            'data' => [
                'full_name' => $fullName,
                'phone' => $phone,
                'role' => 'authenticated', // Default role
                'created_via' => 'api_registration'
            ]
        ]
    ];
    
    // Register user with Supabase
    $authClient = getSupabaseAuthClient();
    
    try {
        $response = $authClient->post('signup', [
            'json' => $signupData,
            'headers' => [
                'Content-Type' => 'application/json'
            ]
        ]);
        
        $responseData = json_decode($response->getBody()->getContents(), true);
        
        if (!$responseData || !isset($responseData['user'])) {
            throw new AppException('Registration failed: Invalid response from authentication service', 500);
        }
        
        $supabaseUser = $responseData['user'];
        
        // Check if user needs email confirmation
        if (!$supabaseUser['email_confirmed_at'] && !isset($responseData['session'])) {
            // User registered but needs email confirmation
            sendSuccessResponse([
                'user_id' => $supabaseUser['id'],
                'email' => $supabaseUser['email'],
                'email_confirmation_required' => true
            ], 'Registration successful. Please check your email to confirm your account.', 201);
        }
        
        // Generate our own JWT token wrapping Supabase user data
        $customClaims = [
            'registration_time' => time(),
            'registration_ip' => getRealIpAddress()
        ];
        
        $jwtToken = generateJwt($supabaseUser, $customClaims);
        
        // Prepare user profile for response
        $userProfile = [
            'id' => $supabaseUser['id'],
            'email' => $supabaseUser['email'],
            'full_name' => $supabaseUser['user_metadata']['full_name'] ?? null,
            'phone' => $supabaseUser['user_metadata']['phone'] ?? null,
            'role' => $supabaseUser['role'] ?? 'authenticated',
            'email_confirmed' => !empty($supabaseUser['email_confirmed_at']),
            'created_at' => $supabaseUser['created_at']
        ];
        
        // Log successful registration and record success for rate limiting
        logMessage('User registered successfully', 'INFO', [
            'user_id' => $supabaseUser['id'],
            'email' => $email,
            'ip' => getRealIpAddress()
        ]);
        
        // Record successful registration for rate limiting
        recordAuthSuccess(getRealIpAddress(), 'register');
        
        // Return success response with JWT and user profile
        sendSuccessResponse([
            'token' => $jwtToken,
            'user' => $userProfile,
            'token_type' => 'Bearer',
            'expires_in' => 86400 // 24 hours
        ], 'Registration successful', 201);
        
    } catch (ClientException $e) {
        $statusCode = $e->getResponse()->getStatusCode();
        $responseBody = $e->getResponse()->getBody()->getContents();
        $errorData = json_decode($responseBody, true);
        
        // Handle specific Supabase errors
        if ($statusCode === 422) {
            $errorMessage = $errorData['msg'] ?? $errorData['message'] ?? 'Validation error';
            
            if (strpos($errorMessage, 'already registered') !== false || 
                strpos($errorMessage, 'email') !== false) {
                throw new ValidationException('An account with this email already exists');
            }
            
            throw new ValidationException($errorMessage);
        }
        
        if ($statusCode === 400) {
            $errorMessage = $errorData['error_description'] ?? $errorData['message'] ?? 'Invalid registration data';
            throw new ValidationException($errorMessage);
        }
        
        // Log the error for debugging and record failure
        logMessage('Supabase registration error', 'ERROR', [
            'status_code' => $statusCode,
            'response_body' => $responseBody,
            'email' => $email
        ]);
        
        // Record failure for rate limiting
        recordAuthFailure(getRealIpAddress(), 'register');
        
        throw new AppException('Registration failed. Please try again later.', 500);
        
    } catch (ServerException $e) {
        logMessage('Supabase server error during registration', 'ERROR', [
            'status_code' => $e->getResponse()->getStatusCode(),
            'response_body' => $e->getResponse()->getBody()->getContents(),
            'email' => $email
        ]);
        
        throw new AppException('Registration service temporarily unavailable. Please try again later.', 503);
        
    } catch (RequestException $e) {
        logMessage('Network error during registration', 'ERROR', [
            'error_message' => $e->getMessage(),
            'email' => $email
        ]);
        
        throw new AppException('Registration failed due to network error. Please try again later.', 503);
    }
    
} catch (ValidationException $e) {
    // Return 400 for validation errors
    sendErrorResponse($e->getMessage(), 400);
    
} catch (AppException $e) {
    // Return the specific error code from AppException
    sendErrorResponse($e->getMessage(), $e->getCode());
    
} catch (Exception $e) {
    // Log unexpected errors
    logMessage('Unexpected error during registration', 'ERROR', [
        'error_message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    
    sendErrorResponse('An unexpected error occurred during registration', 500);
}
