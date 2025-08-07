<?php

/**
 * User Login API Endpoint
 * Handles user authentication with email/password,
 * Supabase token generation, and JWT token creation
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../utils/auth_rate_limiter.php';
require_once __DIR__ . '/../middleware.php';
require_once __DIR__ . '/../config/admin_config.php';

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
    
    // Apply enhanced rate limiting (10 login attempts per hour per IP)
    applyAuthRateLimit(getRealIpAddress(), 'login', 10, 3600);
    
    // Get and validate request data
    $data = getRequestBody();
    $data = sanitizeInput($data);
    
    // Validate required fields
    validateRequiredFields($data, ['email', 'password']);
    
    // Additional validation
    $email = trim($data['email']);
    $password = $data['password'];
    
    // Apply email-specific rate limiting (stricter limit per email)
    applyAuthRateLimit($email, 'login', 5, 3600);
    
    // Check for admin login first (before email validation)
    if ($email === 'AdminCEO' || (strpos($email, 'admin') !== false && !filter_var($email, FILTER_VALIDATE_EMAIL))) {
        handleAdminLogin($email, $password);
        return;
    }
    
    // Email validation for regular users
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new ValidationException('Invalid email format');
    }
    
    // Password validation (basic check)
    if (empty($password)) {
        throw new ValidationException('Password is required');
    }
    
    // Prepare Supabase login data
    $loginData = [
        'email' => $email,
        'password' => $password
    ];
    
    // Authenticate with Supabase
    $authClient = getSupabaseAuthClient();
    
    try {
        $response = $authClient->post('token?grant_type=password', [
            'json' => $loginData,
            'headers' => [
                'Content-Type' => 'application/json'
            ]
        ]);
        
        $responseData = json_decode($response->getBody()->getContents(), true);
        
        if (!$responseData || !isset($responseData['user']) || !isset($responseData['access_token'])) {
            throw new AppException('Login failed: Invalid response from authentication service', 500);
        }
        
        $supabaseUser = $responseData['user'];
        $supabaseAccessToken = $responseData['access_token'];
        $supabaseRefreshToken = $responseData['refresh_token'] ?? null;
        
        // Check if user's email is confirmed
        if (!$supabaseUser['email_confirmed_at']) {
            throw new AuthException('Please confirm your email address before logging in');
        }
        
        // Generate our own JWT token wrapping Supabase user data
        $customClaims = [
            'login_time' => time(),
            'login_ip' => getRealIpAddress(),
            'supabase_access_token' => $supabaseAccessToken,
            'supabase_refresh_token' => $supabaseRefreshToken
        ];
        
        $jwtToken = generateJwt($supabaseUser, $customClaims);
        
        // Prepare minimal user profile for response
        $userProfile = [
            'id' => $supabaseUser['id'],
            'email' => $supabaseUser['email'],
            'full_name' => $supabaseUser['user_metadata']['full_name'] ?? null,
            'phone' => $supabaseUser['user_metadata']['phone'] ?? null,
            'role' => $supabaseUser['role'] ?? 'authenticated',
            'email_confirmed' => !empty($supabaseUser['email_confirmed_at']),
            'phone_confirmed' => !empty($supabaseUser['phone_confirmed_at']),
            'last_sign_in_at' => $supabaseUser['last_sign_in_at'] ?? null,
            'created_at' => $supabaseUser['created_at']
        ];
        
        // Update last login time and IP (optional - you can store this in your own database)
        // For now, we'll just log it
        logMessage('User logged in successfully', 'INFO', [
            'user_id' => $supabaseUser['id'],
            'email' => $email,
            'ip' => getRealIpAddress(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        ]);
        
        // Record successful login for rate limiting (both IP and email)
        recordAuthSuccess(getRealIpAddress(), 'login');
        recordAuthSuccess($email, 'login');
        
        // Return success response with JWT and user profile
        sendSuccessResponse([
            'token' => $jwtToken,
            'user' => $userProfile,
            'token_type' => 'Bearer',
            'expires_in' => 86400, // 24 hours (our JWT expiration)
            'supabase_expires_in' => $responseData['expires_in'] ?? 3600
        ], 'Login successful');
        
    } catch (ClientException $e) {
        $statusCode = $e->getResponse()->getStatusCode();
        $responseBody = $e->getResponse()->getBody()->getContents();
        $errorData = json_decode($responseBody, true);
        
        // Handle specific Supabase authentication errors
        if ($statusCode === 400) {
            $errorMessage = $errorData['error_description'] ?? $errorData['message'] ?? 'Invalid credentials';
            
            // Log failed login attempt and record failure
            logMessage('Failed login attempt', 'WARNING', [
                'email' => $email,
                'ip' => getRealIpAddress(),
                'error' => $errorMessage,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
            ]);
            
            // Record failed authentication for rate limiting (both IP and email)
            recordAuthFailure(getRealIpAddress(), 'login');
            recordAuthFailure($email, 'login');
            
            // Return generic error message to prevent user enumeration
            throw new AuthException('Invalid email or password');
        }
        
        if ($statusCode === 422) {
            $errorMessage = $errorData['error_description'] ?? $errorData['message'] ?? 'Invalid login data';
            
            // Specific handling for unconfirmed emails
            if (strpos($errorMessage, 'email') !== false && strpos($errorMessage, 'not confirmed') !== false) {
                throw new AuthException('Please confirm your email address before logging in');
            }
            
            throw new ValidationException($errorMessage);
        }
        
        if ($statusCode === 429) {
            throw new AppException('Too many login attempts. Please try again later.', 429);
        }
        
        // Log the error for debugging
        logMessage('Supabase authentication error', 'ERROR', [
            'status_code' => $statusCode,
            'response_body' => $responseBody,
            'email' => $email,
            'ip' => getRealIpAddress()
        ]);
        
        throw new AppException('Authentication failed. Please try again later.', 500);
        
    } catch (ServerException $e) {
        logMessage('Supabase server error during login', 'ERROR', [
            'status_code' => $e->getResponse()->getStatusCode(),
            'response_body' => $e->getResponse()->getBody()->getContents(),
            'email' => $email,
            'ip' => getRealIpAddress()
        ]);
        
        throw new AppException('Authentication service temporarily unavailable. Please try again later.', 503);
        
    } catch (RequestException $e) {
        logMessage('Network error during login', 'ERROR', [
            'error_message' => $e->getMessage(),
            'email' => $email,
            'ip' => getRealIpAddress()
        ]);
        
        throw new AppException('Login failed due to network error. Please try again later.', 503);
    }
    
} catch (ValidationException $e) {
    // Return 400 for validation errors
    sendErrorResponse($e->getMessage(), 400);
    
} catch (AuthException $e) {
    // Return 401 for authentication errors
    sendErrorResponse($e->getMessage(), 401);
    
} catch (AppException $e) {
    // Return the specific error code from AppException
    sendErrorResponse($e->getMessage(), $e->getCode());
    
} catch (Exception $e) {
    // Log unexpected errors
    logMessage('Unexpected error during login', 'ERROR', [
        'error_message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'ip' => getRealIpAddress()
    ]);
    
    sendErrorResponse('An unexpected error occurred during login', 500);
}
