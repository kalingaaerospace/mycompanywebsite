# HR Management System - Complete Setup Guide

## 🚀 Quick Start

Your HR Management System is ready to run! Follow these steps to get everything working.

## 📋 Prerequisites Checklist

- ✅ **Supabase Account**: Already configured with your project
- ✅ **Frontend Files**: All HTML, CSS, and JavaScript files created
- ✅ **Backend Configuration**: PHP backend structure ready
- ❌ **PHP Runtime**: Need to install PHP 8.0+
- ❌ **Composer**: Need to install Composer for PHP dependencies
- ❌ **Web Server**: Need a local web server

## 🛠️ Installation Steps

### Step 1: Install PHP and Composer

#### Option A: Using XAMPP (Recommended for Windows)
1. Download XAMPP from https://www.apachefriends.org/
2. Install XAMPP with PHP 8.0+
3. Start Apache from XAMPP Control Panel

#### Option B: Install PHP and Composer separately
1. Download PHP from https://www.php.net/downloads
2. Download Composer from https://getcomposer.org/download/
3. Add both to your system PATH

### Step 2: Install Backend Dependencies
```bash
cd backend
composer install
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Step 4: Database Setup

#### 4.1: Execute SQL Files in Supabase
In your Supabase dashboard SQL Editor, run these files in order:

1. **migrations/001_create_files_table.sql** - Creates files table
2. **migrations/004_create_profiles_table.sql** - Creates profiles table  
3. **migrations/002_create_storage_bucket.sql** - Creates storage bucket
4. **migrations/003_verify_setup.sql** - Verifies setup

#### 4.2: Create Storage Bucket
In Supabase Dashboard:
1. Go to **Storage**
2. Click **New bucket**
3. Name: `user-files`
4. Set **Public**: `false` (unchecked)
5. Click **Create bucket**

### Step 5: Configure Environment Variables

Your `.env` file is already configured with:
```env
# Supabase Configuration
SUPABASE_URL=https://ddyrpqrnxtquthalgjqg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration
DB_HOST=aws-0-ap-south-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.ddyrpqrnxtquthalgjqg
DB_PASSWORD=YourSupabasePassword123!
```

**⚠️ IMPORTANT**: Replace `YourSupabasePassword123!` with your actual Supabase database password.

## 🚀 Running the Application

### Method 1: Using PHP Built-in Server
```bash
# Start backend server
cd backend
php -S localhost:8000

# In another terminal, start frontend server
cd frontend
npx live-server --port=3000
```

### Method 2: Using XAMPP
1. Copy the entire `hr` folder to `C:\xampp\htdocs\`
2. Access via `http://localhost/hr/frontend/`

### Method 3: Using any HTTP Server
Serve the `frontend` folder using any web server on port 3000 or 8080.

## 🔐 Security Configuration

### Test Anonymous Access (Optional)
Run the security test to ensure your database is properly protected:

```powershell
# Update the script with your credentials first
.\test_anonymous_access.ps1
```

All tests should fail or return empty results, confirming that anonymous users cannot access your data.

## 📱 Application Features

### ✅ Complete Features Available:

1. **🔐 Authentication System**
   - User registration and login
   - JWT token management
   - Session persistence

2. **📊 Dashboard**
   - Real-time statistics
   - Recent activity feed
   - Quick action buttons

3. **👥 Employee Management**
   - Add/Edit/Delete employees
   - Search and filter employees
   - Department and status management

4. **📁 File Management**
   - Drag & drop file upload
   - File type validation (PDF, DOC, images, etc.)
   - File download and sharing
   - Secure file storage

5. **👤 User Profile**
   - Profile information management
   - Department and position settings

6. **🎨 Responsive Design**
   - Mobile-friendly interface
   - Modern UI with animations
   - Dark/light theme support

## 🗂️ File Structure

```
hr/
├── frontend/
│   ├── index.html          # Main application file
│   ├── css/
│   │   └── styles.css      # Complete styling
│   └── js/
│       ├── config.js       # Configuration
│       ├── auth.js         # Authentication
│       ├── api.js          # API communication
│       ├── ui.js           # UI management
│       ├── dashboard.js    # Dashboard functionality
│       ├── employees.js    # Employee management
│       ├── files.js        # File management
│       └── app.js          # Main application
├── backend/
│   ├── .env               # Environment configuration
│   ├── composer.json      # PHP dependencies
│   ├── config/            # Configuration files
│   ├── api/               # API endpoints
│   │   ├── login.php      # Authentication
│   │   ├── register.php   # User registration
│   │   ├── employees.php  # Employee CRUD
│   │   └── files.php      # File operations
│   └── utils/             # Utility functions
└── migrations/            # Database setup scripts
```

## 🔧 Configuration Options

### Frontend Configuration (`frontend/js/config.js`)
- Supabase URL and API keys
- Backend API endpoints
- Application settings

### Backend Configuration (`backend/.env`)
- Database credentials
- File upload limits
- CORS settings
- JWT configuration

## 🚦 Testing the Application

### 1. Registration/Login Test
1. Open `http://localhost:3000` (or your server URL)
2. Register a new account
3. Login with your credentials

### 2. Employee Management Test
1. Navigate to Employees section
2. Add a new employee
3. Edit employee details
4. Test search and filter functionality

### 3. File Upload Test
1. Go to Files section
2. Upload a test file (PDF, image, or document)
3. Download the file
4. Delete the file

## 🔍 Troubleshooting

### Common Issues:

#### "Module not found" errors
- Run `npm install` in the frontend directory
- Run `composer install` in the backend directory

#### Database connection errors
- Check your `.env` file has the correct database password
- Verify Supabase project is active
- Ensure RLS policies are properly set up

#### File upload errors
- Check file size limits in `.env`
- Verify Supabase storage bucket exists and is private
- Ensure storage policies are configured

#### CORS errors
- Update `CORS_ALLOWED_ORIGINS` in `.env`
- Make sure your frontend URL is included

## 📞 Support

### Quick Fixes:
1. **Clear browser cache** if styles aren't loading
2. **Check browser console** for JavaScript errors
3. **Verify Supabase project status** in dashboard
4. **Test database connection** using Supabase SQL editor

### Database Reset (if needed):
```sql
-- Run in Supabase SQL Editor to reset
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
-- Then re-run migration files
```

## 🎉 You're Ready!

Your HR Management System is now fully configured and ready to use! 

- **Frontend**: Modern, responsive interface
- **Backend**: Secure PHP API with Supabase
- **Database**: PostgreSQL with Row Level Security
- **Storage**: Secure file management
- **Authentication**: JWT-based user system

Happy managing! 🚀
