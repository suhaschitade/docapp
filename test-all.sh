#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to run backend tests
run_backend_tests() {
    print_status "Running backend tests..."
    cd backend.Tests
    
    if dotnet test --logger "html;LogFileName=backend-test-results.html" --results-directory ../test-results; then
        print_success "Backend tests completed"
        return 0
    else
        print_error "Backend tests failed"
        return 1
    fi
    cd ..
}

# Function to run frontend tests
run_frontend_tests() {
    print_status "Running frontend tests..."
    cd frontend
    
    if npm run test:report; then
        print_success "Frontend tests completed"
        return 0
    else
        print_error "Frontend tests failed"
        return 1
    fi
    cd ..
}

# Function to run unit tests only (fast tests)
run_unit_tests() {
    print_status "Running unit tests only..."
    
    cd backend.Tests
    print_status "Running backend unit tests..."
    if dotnet test --filter "Category!=Integration" --logger "html;LogFileName=backend-unit-test-results.html" --results-directory ../test-results; then
        print_success "Backend unit tests passed"
    else
        print_error "Backend unit tests failed"
    fi
    cd ..
}

# Function to generate test coverage report
generate_coverage_report() {
    print_status "Generating test coverage report..."
    cd backend.Tests
    
    if command -v dotnet-reportgenerator-globaltool &> /dev/null; then
        dotnet test --collect:"XPlat Code Coverage" --results-directory ../test-results/coverage
        reportgenerator -reports:"../test-results/coverage/**/coverage.cobertura.xml" -targetdir:"../test-results/coverage-report" -reporttypes:Html
        print_success "Coverage report generated at test-results/coverage-report/index.html"
    else
        print_warning "dotnet-reportgenerator-globaltool not installed. Install with: dotnet tool install -g dotnet-reportgenerator-globaltool"
    fi
    cd ..
}

# Main script
main() {
    echo "======================================"
    echo "  DocApp Test Suite Runner"
    echo "======================================"
    
    # Create test results directory
    mkdir -p test-results
    
    case "${1:-all}" in
        "all")
            print_status "Running all tests..."
            
            backend_success=0
            frontend_success=0
            
            if run_backend_tests; then
                backend_success=1
            fi
            
            if run_frontend_tests; then
                frontend_success=1
            fi
            
            if [ $backend_success -eq 1 ] && [ $frontend_success -eq 1 ]; then
                print_success "All tests completed successfully!"
                exit 0
            else
                print_error "Some tests failed. Check the reports for details."
                exit 1
            fi
            ;;
        "backend")
            run_backend_tests
            ;;
        "frontend")
            run_frontend_tests
            ;;
        "unit")
            run_unit_tests
            ;;
        "coverage")
            generate_coverage_report
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [all|backend|frontend|unit|coverage|help]"
            echo ""
            echo "Commands:"
            echo "  all       - Run all tests (default)"
            echo "  backend   - Run backend tests only"
            echo "  frontend  - Run frontend tests only"
            echo "  unit      - Run unit tests only (fast)"
            echo "  coverage  - Generate test coverage report"
            echo "  help      - Show this help message"
            ;;
        *)
            print_error "Unknown command: $1"
            echo "Use '$0 help' for available commands"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
