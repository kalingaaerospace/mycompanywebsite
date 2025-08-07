# HR Management System

A modern web-based HR management system built with PHP backend and vanilla JavaScript frontend, integrated with Supabase for data storage and authentication.

## Features

- Employee management
- Authentication and authorization
- RESTful API backend
- Responsive frontend interface
- Supabase integration for database and file storage
- Automated setup and deployment scripts

## Project Structure

```
├── backend/           # PHP backend application
│   ├── config/        # Configuration files
│   ├── api/           # API endpoints
│   ├── src/           # Source code
│   └── env.example    # Environment configuration template
├── frontend/          # Frontend application
│   ├── js/            # JavaScript modules
│   ├── css/           # Stylesheets
│   └── env.example    # Frontend environment template
├── migrations/        # Database setup scripts
├── setup.sh          # Cross-platform setup script
├── start-hr-system.sh # Cross-platform startup script
├── start-hr-system.ps1 # Windows startup script
├── supabase-setup.ps1 # Supabase automation script
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites

- PHP 8.0 or higher
- Composer
- Node.js and npm
- Supabase account

### Automated Setup

#### Option 1: Cross-platform (Linux/Mac/Windows with WSL)
```bash
# Make scripts executable
chmod +x setup.sh start-hr-system.sh

# Run setup
./setup.sh

# Start the application
./start-hr-system.sh
```

#### Option 2: Windows PowerShell
```powershell
# Run setup
.\setup.sh

# Start the application
.\start-hr-system.ps1
```

### Manual Setup

1. **Install dependencies:**
   ```bash
   # Backend
   cd backend && composer install
   
   # Frontend
   cd frontend && npm install
   ```

2. **Configure environment:**
   ```bash
   # Copy environment templates
   cp backend/env.example backend/.env
   cp frontend/env.example frontend/.env
   
   # Update with your Supabase credentials
   ```

3. **Setup Supabase:**
   ```powershell
   # Run automated Supabase setup
   .\supabase-setup.ps1
   ```

4. **Start servers:**
   ```bash
   # Backend (PHP)
   cd backend && php -S localhost:8000
   
   # Frontend (in another terminal)
   cd frontend && npx live-server --port=3000
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

#### Frontend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
API_BASE_URL=http://localhost:8000
```

## 🧪 Testing

### Security Testing
```powershell
# Test anonymous access blocking
.\test_anonymous_access.ps1
```

### Manual Testing
1. Register a new account
2. Login and test authentication
3. Add/edit employees
4. Upload and manage files
5. Test responsive design

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/login.php` - User login
- `POST /api/register.php` - User registration
- `POST /api/logout.php` - User logout

### Employee Management
- `GET /api/employees.php` - List employees
- `POST /api/employees.php` - Create employee
- `PUT /api/employees.php` - Update employee
- `DELETE /api/employees.php` - Delete employee

### File Management
- `POST /api/files.php` - Upload file
- `GET /api/files.php` - List files
- `DELETE /api/files.php` - Delete file

## 🛠️ Development

### Adding New Features
1. Create API endpoint in `backend/api/`
2. Add frontend JavaScript module in `frontend/js/`
3. Update UI components as needed
4. Test thoroughly

### Database Changes
1. Create migration in `migrations/`
2. Update Supabase schema
3. Test with `supabase-setup.ps1`

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication
- File upload validation
- CORS protection
- Rate limiting

## 📦 Deployment

### Local Development
```bash
./start-hr-system.sh
```

### Production
1. Configure production environment variables
2. Set up web server (Apache/Nginx)
3. Configure SSL certificates
4. Set up CI/CD pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Common Issues
- **CORS errors**: Check `CORS_ALLOWED_ORIGINS` in backend `.env`
- **Database connection**: Verify Supabase credentials
- **File uploads**: Check storage bucket permissions

### Getting Help
1. Check the troubleshooting section in `COMPLETE_SETUP.md`
2. Review error logs in `backend.log` and `frontend.log`
3. Test with provided scripts

---

**Happy managing! 🚀**
