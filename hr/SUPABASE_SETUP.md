# Supabase Schema and Security Setup

This document provides step-by-step instructions for setting up the Supabase database schema and security for the HR file management system.

## Prerequisites

- Supabase project created and accessible
- Supabase project URL and keys available
- Access to Supabase dashboard SQL Editor

## Step 1: Create Files Table with RLS

### 1.1 Execute SQL Migration

In your Supabase dashboard, go to **SQL Editor** and execute the following migration:

```sql
-- File: migrations/001_create_files_table.sql
-- Execute this in Supabase SQL Editor
```

Copy and paste the contents of `migrations/001_create_files_table.sql` into the SQL Editor and execute.

### 1.2 Verify Table Creation

After execution, verify the table was created:
- Go to **Table Editor** in Supabase dashboard
- Confirm the `files` table exists with all specified columns
- Verify RLS is enabled (lock icon should be visible)

### 1.3 Verify RLS Policies

In the **Authentication** > **Policies** section, confirm these policies exist:
- "Users can view their own files"
- "Users can insert their own files" 
- "Users can delete their own files"
- "Users can update their own files"

## Step 2: Create Storage Bucket

### 2.1 Create Bucket via Dashboard

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Set bucket name: `user-files`
4. Set **Public**: `false` (unchecked)
5. Click **Create bucket**

### 2.2 Set Storage Policies

In the **SQL Editor**, execute the storage policies from `migrations/002_create_storage_bucket.sql`:

```sql
-- Execute storage policies from migrations/002_create_storage_bucket.sql
```

### 2.3 Verify Storage Security

In **Storage** > **Policies**, confirm these policies exist:
- "Users can view their own files in user-files bucket"
- "Users can upload files to their own folder"
- "Users can update their own files in user-files bucket"
- "Users can delete their own files in user-files bucket"

## Step 3: Configure Backend Environment

### 3.1 Update Backend .env

Add/update the following environment variables in `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# JWT Configuration  
JWT_SECRET=your_jwt_secret_here
JWT_ALGORITHM=HS256
```

### 3.2 Service Role Key Security

**IMPORTANT**: The service role key should ONLY be used in the backend for:
- Server-side operations that need to bypass RLS
- Administrative tasks
- System-level operations

Never expose the service role key to:
- Frontend applications
- Client-side code  
- Public repositories
- Browser environments

## Step 4: Test Anonymous Access Blocking

### 4.1 Update Test Configuration

Before running tests, update the configuration in `test_anonymous_access.ps1`:

```powershell
$SUPABASE_URL = "https://your-actual-project-ref.supabase.co"
$ANON_KEY = "your_actual_supabase_anon_key_here"
```

### 4.2 Run Tests

Execute the test script:

```powershell
# Run the PowerShell test script
.\test_anonymous_access.ps1
```

### 4.3 Expected Results

All tests should either:
- Return empty arrays `[]` (no data accessible)
- Return HTTP 401/403 errors
- Show "Error (Expected)" messages

If any test returns actual data, RLS is not properly configured.

## Step 5: Verification Checklist

### Database Table
- [ ] `files` table created with correct schema
- [ ] RLS enabled on `files` table
- [ ] Four RLS policies created and active
- [ ] Indexes created for performance
- [ ] Triggers for `updated_at` working

### Storage Bucket
- [ ] `user-files` bucket created
- [ ] Bucket is private (public = false)
- [ ] Four storage policies created and active
- [ ] Anonymous access blocked

### Security Configuration
- [ ] Service role key stored securely in backend .env only
- [ ] Anonymous key can be used in frontend safely
- [ ] Test scripts confirm anonymous access is blocked
- [ ] File path structure enforces user isolation

### File Path Structure

Files should be organized in storage as:
```
user-files/
├── {user-id-1}/
│   ├── file1.pdf
│   └── file2.jpg
├── {user-id-2}/
│   ├── document.docx
│   └── image.png
└── ...
```

This structure ensures users can only access files in their own folder.

## Security Notes

1. **Row Level Security (RLS)**: Automatically filters data based on the authenticated user's ID
2. **Storage Policies**: Ensure users can only access files in their user-specific folder
3. **Service Role Key**: Should only be used server-side for admin operations
4. **Anonymous Key**: Safe for frontend use as RLS policies will still apply
5. **File Isolation**: Each user's files are stored in separate folders identified by their user ID

## Troubleshooting

### RLS Not Working
- Verify `auth.uid()` is not null in policies
- Check that JWT tokens are being passed correctly
- Ensure policies are enabled and not in permissive mode

### Storage Access Issues
- Verify bucket exists and is private
- Check storage policies are properly configured
- Ensure file paths follow the user-folder structure

### Test Script Failures
- Update URLs and keys in test scripts
- Verify Supabase project is accessible
- Check network connectivity and CORS settings

## Next Steps

After completing this setup:
1. Implement file upload functionality in your application
2. Create file management API endpoints
3. Add frontend file browsing interface
4. Implement file sharing features (if needed)
5. Set up file cleanup/archival processes
