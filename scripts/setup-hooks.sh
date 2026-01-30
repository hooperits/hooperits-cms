#!/bin/bash
# HOOPERITS Git Hooks Setup Script
# Installs constitution compliance hooks for local development

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_SOURCE="$SCRIPT_DIR/hooks"
HOOKS_TARGET="$(git rev-parse --git-dir)/hooks"

echo "Installing HOOPERITS Constitution compliance hooks..."

# Install commit-msg hook
if [ -f "$HOOKS_SOURCE/commit-msg" ]; then
    cp "$HOOKS_SOURCE/commit-msg" "$HOOKS_TARGET/commit-msg"
    chmod +x "$HOOKS_TARGET/commit-msg"
    echo "✓ commit-msg hook installed"
else
    echo "✗ commit-msg hook not found in $HOOKS_SOURCE"
    exit 1
fi

echo ""
echo "Git hooks installed successfully!"
echo "These hooks enforce HOOPERITS Constitution Section VI (Attribution & Branding)."
