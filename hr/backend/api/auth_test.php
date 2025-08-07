<?php

/**
 * Authentication Test & Documentation Endpoint
 * Provides testing utilities and API documentation for auth endpoints
 */

require_once __DIR__ . '/../config/bootstrap.php';
require_once __DIR__ . '/../utils/auth.php';
require_once __DIR__ . '/../middleware.php';

try {
    // Set security headers and CORS
    securityMiddleware();
    corsMiddleware();
    
    // Handle different HTTP methods
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // Return API documentation and test endpoints
            $documentation = [
                'authentication_endpoints' => [
                    'register' => [
                        'url' => '/api/register.php',
                        'method' => 'POST',
                        'description' => 'Register a new user account',
                        'required_fields' => ['email', 'password'],
                        'optional_fields' => ['full_name', 'phone'],
                        'rate_limit' => '5 attempts per hour per IP',
                        'password_requirements' => [
                            'minimum_length' => 8,
                            'must_contain' => 'uppercase, lowercase, number, special character'
                        ],
                        'example_request' => [
                            'email' => 'user@example.com',
                            'password' => 'SecurePass123!',
                            'full_name' => 'John Doe',
                            'phone' => '+1234567890'
                        ],
                        'success_response' => [
                            'success' => true,
                            'message' => 'Registration successful',
                            'data' => [
                                'token' => 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                                'user' => [
                                    'id' => 'uuid',
                                    'email' => 'user@example.com',
                                    'full_name' => 'John Doe',
                                    'role' => 'authenticated',
                                    'email_confirmed' => false
                                ],
                                'token_type' => 'Bearer',
                                'expires_in' => 86400
                            ]
                        ]
                    ],
                    'login' => [
                        'url' => '/api/login.php',
                        'method' => 'POST',
                        'description' => 'Authenticate user and get JWT token',
                        'required_fields' => ['email', 'password'],
                        'rate_limit' => '10 attempts per hour per IP, 5 per email',
                        'example_request' => [
                            'email' => 'user@example.com',
                            'password' => 'SecurePass123!'
                        ],
                        'success_response' => [
                            'success' => true,
                            'message' => 'Login successful',
                            'data' => [
                                'token' => 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
                                'user' => [
                                    'id' => 'uuid',
                                    'email' => 'user@example.com',
                                    'full_name' => 'John Doe',
                                    'role' => 'authenticated',
                                    'email_confirmed' => true,
                                    'last_sign_in_at' => '2024-01-01T12:00:00Z'
                                ],
                                'token_type' => 'Bearer',
                                'expires_in' => 86400
                            ]
                        ]
                    ]
                ],
                'error_responses' => [
                    'validation_error' => [
                        'status_code' => 400,
                        'response' => [
                            'success' => false,
                            'error' => 'Validation error message'
                        ]
                    ],
                    'authentication_error' => [
                        'status_code' => 401,
                        'response' => [
                            'success' => false,
                            'error' => 'Invalid email or password'
                        ]
                    ],
                    'rate_limit_error' => [
                        'status_code' => 429,
                        'response' => [
                            'success' => false,
                            'error' => 'Too many login attempts. Please try again in 30 minutes.'
                        ]
                    ]
                ],
                'security_features' => [
                    'rate_limiting' => 'Progressive backoff with IP and email-based limits',
                    'password_validation' => 'Strong password requirements enforced',
                    'brute_force_protection' => 'Automatic temporary blocking after failed attempts',
                    'cors_protection' => 'Configured CORS headers for secure cross-origin requests',
                    'input_sanitization' => 'All inputs are sanitized and validated',
                    'error_logging' => 'Comprehensive logging for security monitoring'
                ],
                'jwt_token_info' => [
                    'algorithm' => 'HS256',
                    'expiration' => '24 hours',
                    'contains' => 'User data, custom claims, Supabase tokens'
                ]
            ];
            
            sendSuccessResponse($documentation, 'Authentication API Documentation');
            break;
            
        case 'POST':
            // Test JWT validation
            $user = requireAuth();
            
            sendSuccessResponse([
                'authenticated_user' => $user,
                'ip_address' => getRealIpAddress(),
                'server_time' => date('Y-m-d H:i:s'),
                'jwt_valid' => true
            ], 'JWT token validation successful');
            break;
            
        default:
            throw new AppException('Method not allowed', 405);
    }
    
} catch (ValidationException $e) {
    sendErrorResponse($e->getMessage(), 400);
    
} catch (AuthException $e) {
    sendErrorResponse($e->getMessage(), 401);
    
} catch (AppException $e) {
    sendErrorResponse($e->getMessage(), $e->getCode());
    
} catch (Exception $e) {
    logMessage('Unexpected error in auth test endpoint', 'ERROR', [
        'error_message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    
    sendErrorResponse('An unexpected error occurred', 500);
}
