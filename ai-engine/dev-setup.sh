#!/bin/bash

# Development Environment Setup for SEI DLP AI Engine
# Installs additional development tools and sets up pre-commit hooks

set -e

echo "🛠️  Setting up development environment..."

# Ensure virtual environment is activated
if [[ "$VIRTUAL_ENV" == "" ]]; then
    echo "⚠️  Please activate the virtual environment first:"
    echo "   source venv/bin/activate"
    exit 1
fi

echo "✅ Virtual environment detected: $VIRTUAL_ENV"

# Install development dependencies
echo "📥 Installing development dependencies..."
pip install \
    black>=23.9.0 \
    isort>=5.12.0 \
    mypy>=1.6.0 \
    flake8>=6.1.0 \
    pre-commit>=3.4.0 \
    pytest-cov>=4.1.0 \
    pytest-xdist>=3.3.0

# Set up pre-commit hooks
echo "🔗 Setting up pre-commit hooks..."
pre-commit install

# Create development configuration files
echo "📝 Creating development configuration..."

# Create .flake8 configuration
cat > .flake8 << EOF
[flake8]
max-line-length = 88
extend-ignore = E203, E501, W503
exclude = 
    .git,
    __pycache__,
    venv,
    .venv,
    build,
    dist,
    .eggs,
    *.egg-info
EOF

# Create pyproject.toml configuration for black and isort
if [ ! -f "pyproject.toml" ] || ! grep -q "\[tool.black\]" pyproject.toml; then
    cat >> pyproject.toml << EOF

[tool.black]
line-length = 88
target-version = ['py39']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.mypy_cache
  | \.tox
  | \.venv
  | build
  | dist
)/
'''

[tool.isort]
profile = "black"
multi_line_output = 3
line_length = 88

[tool.mypy]
python_version = "3.9"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
ignore_missing_imports = true
EOF
fi

# Create pre-commit configuration
cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: 23.9.0
    hooks:
      - id: black

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 6.1.0
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.6.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
EOF

# Run initial formatting
echo "🎨 Running initial code formatting..."
black .
isort .

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Available development commands:"
echo "  black .                 # Format code"
echo "  isort .                 # Sort imports"
echo "  mypy sei_dlp_ai/       # Type checking"
echo "  flake8                  # Lint code"
echo "  pytest --cov           # Run tests with coverage"
echo "  pre-commit run --all   # Run all pre-commit hooks"
echo ""
echo "Code will be automatically formatted on commit via pre-commit hooks."
echo ""