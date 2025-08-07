#!/bin/bash

# HR Management System - Test Runner
# Runs unit, integration, and UI tests with proper setup

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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if servers are running
check_servers() {
    local backend_running=false
    local frontend_running=false
    
    # Check backend
    if curl -s http://localhost:8000/api/health.php >/dev/null 2>&1; then
        backend_running=true
        print_status "Backend server is running"
    else
        print_warning "Backend server is not running"
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        frontend_running=true
        print_status "Frontend server is running"
    else
        print_warning "Frontend server is not running"
    fi
    
    echo "$backend_running $frontend_running"
}

# Function to install test dependencies
install_test_deps() {
    print_info "Installing test dependencies..."
    
    if [ ! -d "tests/node_modules" ]; then
        cd tests
        npm install
        cd ..
        print_status "Test dependencies installed"
    else
        print_status "Test dependencies already installed"
    fi
}

# Function to run unit tests
run_unit_tests() {
    print_info "Running unit tests..."
    
    cd tests
    if npm run test:unit; then
        print_status "Unit tests passed"
        cd ..
        return 0
    else
        print_error "Unit tests failed"
        cd ..
        return 1
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_info "Running integration tests..."
    
    # Check if backend is running
    local servers=$(check_servers)
    local backend_running=$(echo $servers | cut -d' ' -f1)
    
    if [ "$backend_running" = "false" ]; then
        print_warning "Backend server not running. Starting backend..."
        cd backend
        php -S localhost:8000 > ../backend-test.log 2>&1 &
        local backend_pid=$!
        cd ..
        
        # Wait for backend to start
        sleep 5
        
        # Store PID for cleanup
        echo $backend_pid > .backend-test.pid
    fi
    
    cd tests
    if npm run test:integration; then
        print_status "Integration tests passed"
        cd ..
        return 0
    else
        print_error "Integration tests failed"
        cd ..
        return 1
    fi
}

# Function to run UI tests
run_ui_tests() {
    print_info "Running UI tests..."
    
    # Check if frontend is running
    local servers=$(check_servers)
    local frontend_running=$(echo $servers | cut -d' ' -f2)
    
    if [ "$frontend_running" = "false" ]; then
        print_warning "Frontend server not running. Starting frontend..."
        cd frontend
        npx live-server --port=3000 > ../frontend-test.log 2>&1 &
        local frontend_pid=$!
        cd ..
        
        # Wait for frontend to start
        sleep 3
        
        # Store PID for cleanup
        echo $frontend_pid > .frontend-test.pid
    fi
    
    cd tests
    if npm run test:ui; then
        print_status "UI tests passed"
        cd ..
        return 0
    else
        print_error "UI tests failed"
        cd ..
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    print_info "Running all tests..."
    
    local unit_passed=true
    local integration_passed=true
    local ui_passed=true
    
    # Run unit tests
    if ! run_unit_tests; then
        unit_passed=false
    fi
    
    # Run integration tests
    if ! run_integration_tests; then
        integration_passed=false
    fi
    
    # Run UI tests
    if ! run_ui_tests; then
        ui_passed=false
    fi
    
    # Print summary
    echo ""
    print_info "Test Results Summary:"
    echo "========================"
    
    if [ "$unit_passed" = "true" ]; then
        print_status "Unit Tests: PASSED"
    else
        print_error "Unit Tests: FAILED"
    fi
    
    if [ "$integration_passed" = "true" ]; then
        print_status "Integration Tests: PASSED"
    else
        print_error "Integration Tests: FAILED"
    fi
    
    if [ "$ui_passed" = "true" ]; then
        print_status "UI Tests: PASSED"
    else
        print_error "UI Tests: FAILED"
    fi
    
    if [ "$unit_passed" = "true" ] && [ "$integration_passed" = "true" ] && [ "$ui_passed" = "true" ]; then
        print_status "All tests passed! 🎉"
        return 0
    else
        print_error "Some tests failed! ❌"
        return 1
    fi
}

# Function to cleanup test servers
cleanup() {
    print_info "Cleaning up test servers..."
    
    # Stop backend test server
    if [ -f ".backend-test.pid" ]; then
        local backend_pid=$(cat .backend-test.pid)
        kill $backend_pid 2>/dev/null || true
        rm -f .backend-test.pid
        print_status "Backend test server stopped"
    fi
    
    # Stop frontend test server
    if [ -f ".frontend-test.pid" ]; then
        local frontend_pid=$(cat .frontend-test.pid)
        kill $frontend_pid 2>/dev/null || true
        rm -f .frontend-test.pid
        print_status "Frontend test server stopped"
    fi
    
    # Remove test logs
    rm -f backend-test.log frontend-test.log
}

# Function to show help
show_help() {
    echo "HR Management System - Test Runner"
    echo "=================================="
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  unit          Run unit tests only"
    echo "  integration   Run integration tests only"
    echo "  ui            Run UI tests only"
    echo "  all           Run all tests (default)"
    echo "  install       Install test dependencies"
    echo "  cleanup       Clean up test servers"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 unit       # Run only unit tests"
    echo "  $0 all        # Run all tests"
    echo "  $0 cleanup    # Clean up test servers"
}

# Main script
main() {
    local test_type=${1:-all}
    
    case $test_type in
        "unit")
            install_test_deps
            run_unit_tests
            ;;
        "integration")
            install_test_deps
            run_integration_tests
            ;;
        "ui")
            install_test_deps
            run_ui_tests
            ;;
        "all")
            install_test_deps
            run_all_tests
            ;;
        "install")
            install_test_deps
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown option: $test_type"
            show_help
            exit 1
            ;;
    esac
}

# Set up cleanup on script exit
trap cleanup EXIT

# Check if Node.js is available
if ! command_exists node; then
    print_error "Node.js is required to run tests. Please install Node.js first."
    exit 1
fi

# Check if npm is available
if ! command_exists npm; then
    print_error "npm is required to run tests. Please install npm first."
    exit 1
fi

# Run main function with arguments
main "$@" 