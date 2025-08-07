# HR System Backend - Configuration & Utilities

This directory contains the backend configuration and utilities for the HR Management System, built with PHP and Supabase.

## Structure

```
backend/
├── config/
│   ├── bootstrap.php          # Environment setup and Supabase clients
│   ├── database.php           # Supabase REST/Storage wrapper class
│   └── error_handler.php      # Global error handling and logging
├── utils/
│   └── auth.php              # JWT utilities and helper functions
├── storage/
│   ├── logs/                 # Application logs
│   └── cache/                # Cache files (rate limiting, etc.)
├── api/
│   └── example.php           # Example API endpoint
├── middleware.php            # Security and validation middleware
├── composer.json             # PHP dependencies
└── .env.example              # Environment variables template
```

## Features

### 🔧 Configuration (`config/`)

- **Bootstrap**: Environment loading, Supabase client initialization
- **Database**: Comprehensive Supabase REST API and Storage wrapper
- **Error Handler**: Global exception handling with JSON responses and structured logging

### 🔐 Authentication (`utils/auth.php`)

- JWT token generation wrapping Supabase user data
- Token validation with automatic 401 responses
- CORS setup and JSON response helpers
- Role-based access control
- Input sanitization and validation

### 🛡️ Security (`middleware.php`)

- JWT authentication middleware
- Comprehensive security headers (CSP, HSTS, X-Frame-Options, etc.)
- Rate limiting
- Input validation
- Request logging
- Content-Type validation

### 📊 Database Operations (`config/database.php`)

- **REST API Operations**: SELECT, INSERT, UPDATE, DELETE with Supabase
- **Storage Operations**: File upload, download, delete, list
- **Advanced Features**: Signed URLs, public URLs, upserts
- **Error Handling**: Automatic exception conversion with meaningful messages

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
JWT_SECRET=your_jwt_secret_here
```

### 2. Install Dependencies

```bash
composer install
```

### 3. Basic Usage

#### Simple API Endpoint

```php
<?php
require_once __DIR__ . '/middleware.php';

// Setup middleware
$user = setupApiMiddleware([
    'cors' => true,
    'auth' => true,
    'rate_limit' => true
]);

// Get database
$db = getDatabase();

// Query data
$results = $db->select('users', ['*'], ['active' => true]);

// Send response
sendSuccessResponse($results);
```

#### Database Operations

```php
// SELECT with filters and options
$users = $db->select('users', 
    ['id', 'name', 'email'], 
    ['status' => 'active', 'age' => ['gte', 18]],
    ['limit' => 10, 'order' => 'created_at.desc']
);

// INSERT
$newUser = $db->insert('users', [
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'status' => 'active'
]);

// UPDATE
$db->update('users', 
    ['status' => 'inactive'], 
    ['id' => 123]
);

// File Upload
$uploadResult = $db->uploadFile('avatars', 
    'user-123/profile.jpg', 
    $fileContent,
    ['content_type' => 'image/jpeg', 'upsert' => true]
);

// Get signed URL
$signedUrl = $db->getSignedUrl('avatars', 'user-123/profile.jpg', 3600);
```

#### JWT Authentication

```php
// Generate JWT (after Supabase auth)
$supabaseUser = ['id' => '123', 'email' => 'user@example.com'];
$token = generateJwt($supabaseUser, ['role' => 'admin']);

// Validate JWT
try {
    $payload = validateJwt();
    $user = $payload['user'];
} catch (Exception $e) {
    // Handle auth error
}

// Require specific role
$user = requireAuth('admin'); // Throws 401/403 on failure
```

## Security Features

### Content Security Policy
- Prevents XSS attacks
- Controls resource loading
- Configurable per endpoint

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- HSTS for HTTPS deployments

### Rate Limiting
- IP-based by default
- Configurable limits and time windows
- Automatic 429 responses with retry headers

### Input Validation
- Required field validation
- Type checking (email, numeric, array)
- Length constraints
- Whitelist validation

## Error Handling

All errors are converted to consistent JSON responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

In debug mode, additional details are included:
```json
{
  "success": false,
  "error": "Error message",
  "debug": {
    "file": "/path/to/file.php",
    "line": 42,
    "trace": "Stack trace...",
    "type": "Exception"
  }
}
```

## Logging

All errors and requests are logged to `storage/logs/app.log` in JSON format:

```json
{
  "timestamp": "2024-01-15 10:30:00",
  "level": "ERROR",
  "message": "Database connection failed",
  "file": "/path/to/file.php",
  "line": 42,
  "trace": "...",
  "request": {
    "method": "POST",
    "uri": "/api/users",
    "ip": "192.168.1.1"
  },
  "user": {
    "id": "user123",
    "email": "user@example.com"
  }
}
```

## Middleware Options

### Standard API Middleware

```php
setupApiMiddleware([
    'cors' => true,                          // Enable CORS
    'logging' => true,                       // Log requests
    'auth' => 'admin',                       // Require admin role
    'rate_limit' => true,                    // Enable rate limiting
    'content_type' => true,                  // Validate content type
    'validation_rules' => [                  // Input validation
        'name' => ['required', 'min:2'],
        'email' => ['required', 'email']
    ],
    'cors_options' => [
        'allowed_origins' => ['https://myapp.com']
    ],
    'rate_limit_options' => [
        'max_requests' => 100,
        'time_window' => 3600
    ]
]);
```

## File Structure Best Practices

- Keep API endpoints in `api/` directory
- Use meaningful file names and comments
- Handle exceptions at the endpoint level
- Leverage middleware for common functionality
- Log important operations
- Validate all inputs
- Use proper HTTP status codes

## Dependencies

- **vlucas/phpdotenv**: Environment variable management
- **firebase/php-jwt**: JWT token handling  
- **guzzlehttp/guzzle**: HTTP client for Supabase API calls

## Security Considerations

1. **JWT Secret**: Use a strong, unique JWT secret in production
2. **CORS Origins**: Restrict allowed origins in production
3. **Rate Limiting**: Adjust limits based on your usage patterns
4. **Input Validation**: Always validate and sanitize user inputs
5. **HTTPS**: Use HTTPS in production for security headers to work properly
6. **Error Messages**: Don't expose sensitive information in error messages
7. **Logging**: Ensure log files are not publicly accessible

## Development vs Production

### Development
- Debug mode enabled
- Detailed error messages
- More permissive CORS
- Verbose logging

### Production
- Debug mode disabled
- Generic error messages
- Strict CORS policy
- Error logging only
- Security headers enforced
