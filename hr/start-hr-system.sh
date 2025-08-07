#!/bin/bash

# HR Management System Startup Script (Bash version)
# Cross-platform script to start both frontend and backend servers

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

# Function to cleanup background processes
cleanup() {
    echo ""
    print_warning "Stopping servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    print_status "Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🚀 Starting HR Management System..."
echo ""

# Check if required tools are available
PHP_AVAILABLE=false
NODE_AVAILABLE=false

if command -v php &> /dev/null; then
    PHP_AVAILABLE=true
    print_status "PHP is available"
else
    print_error "PHP not found. Please install PHP 8.0+ or XAMPP"
fi

if command -v node &> /dev/null; then
    NODE_AVAILABLE=true
    print_status "Node.js is available"
else
    print_error "Node.js not found. Please install Node.js"
fi

echo ""

if [ "$PHP_AVAILABLE" = false ] || [ "$NODE_AVAILABLE" = false ]; then
    print_error "Missing required tools. Please install PHP and Node.js first."
    echo ""
    echo "Installation options:"
    echo "1. XAMPP (includes PHP): https://www.apachefriends.org/"
    echo "2. Node.js: https://nodejs.org/"
    echo ""
    read -p "Press Enter to exit"
    exit 1
fi

# Check if dependencies are installed
if [ ! -f "backend/composer.lock" ]; then
    print_warning "PHP dependencies not found. Installing..."
    cd backend
    composer install --no-interaction
    cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    print_warning "Node.js dependencies not found. Installing..."
    cd frontend
    npm install
    cd ..
fi

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    print_warning "Warning: backend/.env file not found!"
    print_warning "Please ensure your Supabase credentials are configured."
    echo ""
fi

print_status "Starting servers..."
echo ""

# Start backend server
print_info "Starting backend server on http://localhost:8000"
cd backend
php -S localhost:8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Failed to start backend server"
    echo "Check backend.log for details"
    exit 1
fi

print_status "Backend server started successfully"

# Start frontend server
print_info "Starting frontend server on http://localhost:3000"
cd frontend

# Check if live-server is available
if npx live-server --version &> /dev/null; then
    npx live-server --port=3000 --open > ../frontend.log 2>&1 &
else
    print_warning "live-server not found, installing..."
    npm install -g live-server
    npx live-server --port=3000 --open > ../frontend.log 2>&1 &
fi

FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 2

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "Failed to start frontend server"
    echo "Check frontend.log for details"
    cleanup
    exit 1
fi

print_status "Frontend server started successfully"

echo ""
print_status "HR Management System is running!"
echo ""
print_info "Access your application at: http://localhost:3000"
print_info "Backend API at: http://localhost:8000"
echo ""
print_warning "To stop the servers, press Ctrl+C"
echo ""

# Wait for user input or signal
while true; do
    sleep 1
done 