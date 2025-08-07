#!/bin/bash

# SEI DLP AI Engine Installation Script
# This script sets up the Python environment and installs all dependencies

set -e  # Exit on any error

echo "🚀 Setting up SEI DLP AI Engine..."

# Check if Python 3.9+ is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.9"

if ! python3 -c "import sys; exit(0 if sys.version_info >= (3, 9) else 1)" 2>/dev/null; then
    echo "❌ Python ${PYTHON_VERSION} detected. Python 3.9 or higher is required."
    exit 1
fi

echo "✅ Python ${PYTHON_VERSION} detected"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Install the package in development mode
echo "🔧 Installing SEI DLP AI Engine in development mode..."
pip install -e .

# Run basic health check
echo "🩺 Running health check..."
python -c "
try:
    import sei_dlp_ai
    from sei_dlp_ai.core.engine import SEIDLPEngine
    print('✅ SEI DLP AI Engine installed successfully!')
    print('🎯 Package version: 0.1.0')
    print('📍 Location:', sei_dlp_ai.__file__)
except ImportError as e:
    print('❌ Installation verification failed:', e)
    exit(1)
"

echo ""
echo "🎉 Installation complete!"
echo ""
echo "To start the AI engine:"
echo "  1. Activate the virtual environment: source venv/bin/activate"
echo "  2. Start the server: python api_bridge.py"
echo "  3. The API will be available at: http://localhost:8000"
echo ""
echo "To run tests:"
echo "  pytest"
echo ""
echo "For development setup:"
echo "  pip install black isort mypy  # Code formatting and type checking"
echo ""