#!/bin/bash
# Script to install git hooks for the project

echo "🔧 Installing git hooks..."

# Get the git directory
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
if [ $? -ne 0 ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$GIT_DIR/hooks"

# Copy pre-commit hook
if [ -f "scripts/pre-commit" ]; then
    cp scripts/pre-commit "$GIT_DIR/hooks/pre-commit"
    chmod +x "$GIT_DIR/hooks/pre-commit"
    echo "✅ Pre-commit hook installed"
else
    echo "⚠️  Warning: scripts/pre-commit not found"
fi

echo ""
echo "✨ Git hooks installation complete!"
echo ""
echo "The pre-commit hook will automatically run:"
echo "  • Prettier formatting check"
echo "  • ESLint code quality check"
echo "  • Test suite"
echo "  • Console.log detection"
echo ""
echo "You can bypass hooks with: git commit --no-verify"
echo "(Not recommended for production commits)"