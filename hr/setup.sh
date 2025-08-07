#!/bin/bash

# HR Management System Setup Script
# Cross-platform setup for easier onboarding

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "🚀 HR Management System Setup"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the HR project root directory"
    exit 1
fi

print_status "Project structure verified"

# Check for required tools
echo ""
echo "🔧 Checking required tools..."

# Check PHP
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -v | head -n1 | cut -d' ' -f2 | cut -d'.' -f1,2)
    print_status "PHP found (version: $PHP_VERSION)"
    
    # Check if PHP version is 8.0 or higher
    if [ "$(echo "$PHP_VERSION >= 8.0" | bc -l 2>/dev/null || echo "0")" -eq 1 ]; then
        print_status "PHP version is compatible (8.0+)"
    else
        print_warning "PHP version might be too old. Recommended: 8.0+"
    fi
else
    print_error "PHP not found. Please install PHP 8.0+ or XAMPP"
    echo "Installation options:"
    echo "  - XAMPP: https://www.apachefriends.org/"
    echo "  - PHP: https://www.php.net/downloads"
    exit 1
fi

# Check Composer
if command -v composer &> /dev/null; then
    print_status "Composer found"
else
    print_error "Composer not found. Please install Composer"
    echo "Installation: https://getcomposer.org/download/"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_status "Node.js found ($NODE_VERSION)"
else
    print_error "Node.js not found. Please install Node.js"
    echo "Installation: https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    print_status "npm found"
else
    print_error "npm not found. Please install npm"
    exit 1
fi

echo ""
print_status "All required tools are available"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."

if [ ! -f "backend/composer.lock" ]; then
    cd backend
    composer install --no-interaction
    cd ..
    print_status "Backend dependencies installed"
else
    print_status "Backend dependencies already installed"
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."

if [ ! -d "frontend/node_modules" ]; then
    cd frontend
    npm install
    cd ..
    print_status "Frontend dependencies installed"
else
    print_status "Frontend dependencies already installed"
fi

# Setup environment files
echo ""
echo "⚙️  Setting up environment configuration..."

# Backend .env setup
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_warning "Created backend/.env from .env.example"
        print_warning "Please update backend/.env with your Supabase credentials"
    else
        print_warning "backend/.env not found and no .env.example available"
        print_warning "Please create backend/.env with your Supabase configuration"
    fi
else
    print_status "backend/.env already exists"
fi

# Frontend .env setup (if needed)
if [ ! -f "frontend/.env" ] && [ -f "frontend/.env.example" ]; then
    cp frontend/.env.example frontend/.env
    print_warning "Created frontend/.env from .env.example"
    print_warning "Please update frontend/.env with your Supabase URL and anon key"
fi

echo ""
print_status "Setup completed successfully!"
echo ""

# Display next steps
echo "🎯 Next Steps:"
echo "=============="
echo ""
echo "1. Configure Supabase:"
echo "   - Update backend/.env with your Supabase credentials"
echo "   - Run SQL migrations in your Supabase dashboard"
echo "   - Create storage bucket 'user-files'"
echo ""
echo "2. Start the application:"
echo "   - Run: ./start-hr-system.sh (Linux/Mac)"
echo "   - Run: .\\start-hr-system.ps1 (Windows)"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo ""

# Check if Supabase CLI is available for automated migrations
if command -v supabase &> /dev/null; then
    print_info "Supabase CLI found - you can automate database setup"
    echo "Run: supabase db push (if you have a Supabase project linked)"
else
    print_warning "Supabase CLI not found"
    echo "Install: https://supabase.com/docs/guides/cli"
    echo "Or run SQL migrations manually in Supabase dashboard"
fi

echo ""
print_status "Setup script completed!" 