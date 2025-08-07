<?php

/**
 * Middleware System
 * Handles JWT validation and sets security headers
 */

require_once __DIR__ . '/config/error_handler.php';
require_once __DIR__ . '/utils/auth.php';

/**
 * Auth middleware - validates JWT tokens
 * 
 * @param string|null $requiredRole Required role for access
 * @return array User data if authenticated
 * @throws AuthException On authentication failure
 */
function authMiddleware(?string $requiredRole = null): array
{
    try {
        return requireAuth($requiredRole);
    } catch (Exception $e) {
        throw new AuthException($e->getMessage());
    }
}

/**
 * Security headers middleware
 * Sets comprehensive security headers including CSP, HSTS, etc.
 * 
 * @param array $options Security header options
 */
function securityMiddleware(array $options = []): void
{
    $config = getConfig();
    $appUrl = $config['app']['url'] ?? 'http://localhost:8000';
    $isHttps = strpos($appUrl, 'https://') === 0;
    
    // Content Security Policy
    $cspDirectives = array_merge([
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
        "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' " . ($config['supabase']['url'] ?? ''),
        "media-src 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
    ], $options['csp_directives'] ?? []);
    
    header('Content-Security-Policy: ' . implode('; ', $cspDirectives));
    
    // X-Content-Type-Options: Prevent MIME type sniffing
    header('X-Content-Type-Options: nosniff');
    
    // X-Frame-Options: Prevent clickjacking
    header('X-Frame-Options: DENY');
    
    // X-XSS-Protection: Enable XSS filtering
    header('X-XSS-Protection: 1; mode=block');
    
    // Referrer-Policy: Control referrer information
    $referrerPolicy = $options['referrer_policy'] ?? 'strict-origin-when-cross-origin';
    header('Referrer-Policy: ' . $referrerPolicy);
    
    // Permissions-Policy: Control browser features
    $permissionsPolicy = $options['permissions_policy'] ?? [
        'camera=self',
        'microphone=self',
        'geolocation=self',
        'payment=self',
        'usb=self',
        'bluetooth=self'
    ];
    header('Permissions-Policy: ' . implode(', ', $permissionsPolicy));
    
    // HTTPS-only headers
    if ($isHttps) {
        // HTTP Strict Transport Security
        $hstsMaxAge = $options['hsts_max_age'] ?? 31536000; // 1 year
        header('Strict-Transport-Security: max-age=' . $hstsMaxAge . '; includeSubDomains; preload');
    }
    
    // Cache control for API responses
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Server header (optional - remove server fingerprinting)
    if ($options['hide_server_header'] ?? true) {
        header_remove('Server');
        header_remove('X-Powered-By');
    }
}

/**
 * CORS middleware with enhanced security
 * 
 * @param array $options CORS options
 */
function corsMiddleware(array $options = []): void
{
    $config = getConfig();
    $appUrl = $config['app']['url'] ?? 'http://localhost:8000';
    
    // Default allowed origins - should be configured per environment
    $defaultOrigins = [$appUrl];
    if ($config['app']['env'] === 'development') {
        $defaultOrigins = array_merge($defaultOrigins, [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:8080'
        ]);
    }
    
    $allowedOrigins = $options['allowed_origins'] ?? $defaultOrigins;
    $allowedMethods = $options['allowed_methods'] ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
    $allowedHeaders = $options['allowed_headers'] ?? [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ];
    $maxAge = $options['max_age'] ?? 86400; // 24 hours
    
    setupCors($allowedOrigins, $allowedMethods, $allowedHeaders, $maxAge);
}

/**
 * Rate limiting middleware (basic implementation)
 * 
 * @param int $maxRequests Maximum requests per time window
 * @param int $timeWindow Time window in seconds
 * @param string $identifier Rate limit identifier (IP, user ID, etc.)
 * @throws AppException If rate limit exceeded
 */
function rateLimitMiddleware(int $maxRequests = 100, int $timeWindow = 3600, ?string $identifier = null): void
{
    if ($identifier === null) {
        $identifier = getRealIpAddress();
    }
    
    $cacheDir = __DIR__ . '/storage/cache';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }
    
    $cacheFile = $cacheDir . '/ratelimit_' . md5($identifier) . '.json';
    $now = time();
    
    // Load existing rate limit data
    $rateLimitData = [];
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
        if ($data && $data['expires'] > $now) {
            $rateLimitData = $data;
        }
    }
    
    // Initialize or update rate limit data
    if (empty($rateLimitData)) {
        $rateLimitData = [
            'requests' => 1,
            'expires' => $now + $timeWindow,
            'reset_time' => $now + $timeWindow
        ];
    } else {
        $rateLimitData['requests']++;
    }
    
    // Check if rate limit exceeded
    if ($rateLimitData['requests'] > $maxRequests) {
        // Add rate limit headers
        header('X-RateLimit-Limit: ' . $maxRequests);
        header('X-RateLimit-Remaining: 0');
        header('X-RateLimit-Reset: ' . $rateLimitData['reset_time']);
        
        throw new AppException('Rate limit exceeded. Try again later.', 429);
    }
    
    // Save updated rate limit data
    file_put_contents($cacheFile, json_encode($rateLimitData), LOCK_EX);
    
    // Add rate limit headers
    header('X-RateLimit-Limit: ' . $maxRequests);
    header('X-RateLimit-Remaining: ' . ($maxRequests - $rateLimitData['requests']));
    header('X-RateLimit-Reset: ' . $rateLimitData['reset_time']);
}

/**
 * Input validation middleware
 * 
 * @param array $rules Validation rules
 * @throws ValidationException If validation fails
 */
function validationMiddleware(array $rules): void
{
    $data = getRequestBody();
    $errors = [];
    
    foreach ($rules as $field => $fieldRules) {
        $value = $data[$field] ?? null;
        
        foreach ($fieldRules as $rule) {
            $ruleParts = explode(':', $rule, 2);
            $ruleName = $ruleParts[0];
            $ruleValue = $ruleParts[1] ?? null;
            
            switch ($ruleName) {
                case 'required':
                    if ($value === null || $value === '') {
                        $errors[$field][] = "Field {$field} is required";
                    }
                    break;
                    
                case 'email':
                    if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                        $errors[$field][] = "Field {$field} must be a valid email";
                    }
                    break;
                    
                case 'min':
                    if ($value && (is_string($value) ? strlen($value) : $value) < (int)$ruleValue) {
                        $errors[$field][] = "Field {$field} must be at least {$ruleValue}";
                    }
                    break;
                    
                case 'max':
                    if ($value && (is_string($value) ? strlen($value) : $value) > (int)$ruleValue) {
                        $errors[$field][] = "Field {$field} must not exceed {$ruleValue}";
                    }
                    break;
                    
                case 'numeric':
                    if ($value && !is_numeric($value)) {
                        $errors[$field][] = "Field {$field} must be numeric";
                    }
                    break;
                    
                case 'array':
                    if ($value && !is_array($value)) {
                        $errors[$field][] = "Field {$field} must be an array";
                    }
                    break;
                    
                case 'in':
                    $allowedValues = explode(',', $ruleValue);
                    if ($value && !in_array($value, $allowedValues)) {
                        $errors[$field][] = "Field {$field} must be one of: " . implode(', ', $allowedValues);
                    }
                    break;
            }
        }
    }
    
    if (!empty($errors)) {
        throw new ValidationException('Validation failed', new Exception(json_encode($errors)));
    }
}

/**
 * Request logging middleware
 * 
 * @param array $options Logging options
 */
function requestLoggingMiddleware(array $options = []): void
{
    $logRequests = $options['log_requests'] ?? true;
    $logBodies = $options['log_bodies'] ?? false;
    $excludePaths = $options['exclude_paths'] ?? ['/health', '/status'];
    
    if (!$logRequests) {
        return;
    }
    
    $requestUri = $_SERVER['REQUEST_URI'] ?? '';
    $requestPath = parse_url($requestUri, PHP_URL_PATH);
    
    // Skip logging for excluded paths
    if (in_array($requestPath, $excludePaths)) {
        return;
    }
    
    $logData = [
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN',
        'uri' => $requestUri,
        'ip' => getRealIpAddress(),
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
        'headers' => getallheaders()
    ];
    
    // Log request body if enabled (be careful with sensitive data)
    if ($logBodies && in_array($_SERVER['REQUEST_METHOD'] ?? '', ['POST', 'PUT', 'PATCH'])) {
        $body = getRequestBody();
        
        // Remove sensitive fields
        $sensitiveFields = ['password', 'token', 'secret', 'key'];
        foreach ($sensitiveFields as $field) {
            if (isset($body[$field])) {
                $body[$field] = '[REDACTED]';
            }
        }
        
        $logData['body'] = $body;
    }
    
    logMessage('HTTP Request', 'INFO', $logData);
}

/**
 * Content-Type validation middleware
 * 
 * @param array $allowedTypes Allowed content types
 * @throws AppException If content type not allowed
 */
function contentTypeMiddleware(array $allowedTypes = ['application/json']): void
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    // Remove charset and other parameters
    $contentType = explode(';', $contentType)[0];
    $contentType = trim($contentType);
    
    // Skip validation for GET requests and empty content
    if ($_SERVER['REQUEST_METHOD'] === 'GET' || empty($contentType)) {
        return;
    }
    
    if (!in_array($contentType, $allowedTypes)) {
        throw new AppException(
            'Unsupported content type. Allowed types: ' . implode(', ', $allowedTypes),
            415
        );
    }
}

/**
 * Apply multiple middleware in sequence
 * 
 * @param array $middlewares Array of middleware functions with their parameters
 */
function applyMiddleware(array $middlewares): void
{
    foreach ($middlewares as $middleware) {
        if (is_callable($middleware)) {
            call_user_func($middleware);
        } elseif (is_array($middleware) && is_callable($middleware[0])) {
            $func = array_shift($middleware);
            call_user_func_array($func, $middleware);
        }
    }
}

/**
 * Create a middleware stack for API endpoints
 * 
 * @param array $options Middleware options
 * @return array Middleware stack
 */
function createApiMiddlewareStack(array $options = []): array
{
    $stack = [];
    
    // Always apply security headers first
    $stack[] = ['securityMiddleware', $options['security'] ?? []];
    
    // CORS handling
    if ($options['cors'] ?? true) {
        $stack[] = ['corsMiddleware', $options['cors_options'] ?? []];
    }
    
    // Request logging
    if ($options['logging'] ?? true) {
        $stack[] = ['requestLoggingMiddleware', $options['logging_options'] ?? []];
    }
    
    // Content-Type validation
    if ($options['content_type'] ?? true) {
        $stack[] = ['contentTypeMiddleware', $options['allowed_content_types'] ?? ['application/json']];
    }
    
    // Rate limiting
    if ($options['rate_limit'] ?? false) {
        $rateLimitOptions = $options['rate_limit_options'] ?? [];
        $stack[] = [
            'rateLimitMiddleware',
            $rateLimitOptions['max_requests'] ?? 100,
            $rateLimitOptions['time_window'] ?? 3600,
            $rateLimitOptions['identifier'] ?? null
        ];
    }
    
    // Input validation
    if (isset($options['validation_rules'])) {
        $stack[] = ['validationMiddleware', $options['validation_rules']];
    }
    
    // Authentication (if required)
    if (isset($options['auth'])) {
        $requiredRole = is_string($options['auth']) ? $options['auth'] : null;
        $stack[] = ['authMiddleware', $requiredRole];
    }
    
    return $stack;
}

/**
 * Convenience function to set up standard API middleware
 * 
 * @param array $options Middleware options
 * @return array User data if authenticated, null otherwise
 */
function setupApiMiddleware(array $options = []): ?array
{
    $middlewareStack = createApiMiddlewareStack($options);
    
    $user = null;
    foreach ($middlewareStack as $middleware) {
        if (is_callable($middleware)) {
            $result = call_user_func($middleware);
        } elseif (is_array($middleware) && is_callable($middleware[0])) {
            $func = array_shift($middleware);
            $result = call_user_func_array($func, $middleware);
        }
        
        // If this was auth middleware, capture the user data
        if (isset($func) && $func === 'authMiddleware' && $result) {
            $user = $result;
        }
    }
    
    return $user;
}
