#!/bin/bash

# Everything Converter - Quick Start Script
# Usage: bash quickstart.sh

echo "🚀 Everything Converter - Quick Start"
echo "======================================="
echo ""

# Check if files exist
echo "📁 Checking files..."
files=("index.html" "style.css" "script.js" "sw.js" "manifest.json")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (MISSING)"
    fi
done

echo ""
echo "🔍 Validating JavaScript..."
if node -c script.js 2>/dev/null; then
    echo "✅ script.js syntax OK"
else
    echo "❌ script.js has syntax errors"
fi

if node -c sw.js 2>/dev/null; then
    echo "✅ sw.js syntax OK"
else
    echo "❌ sw.js has syntax errors"
fi

echo ""
echo "📝 Validating JSON..."
if node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8'));" 2>/dev/null; then
    echo "✅ manifest.json is valid"
else
    echo "❌ manifest.json has invalid JSON"
fi

echo ""
echo "🌐 Starting local development server..."
echo ""
echo "Available commands:"
echo "  • Python:    python3 -m http.server 8000"
echo "  • Node.js:   npx http-server"
echo "  • PHP:       php -S localhost:8000"
echo ""
echo "Starting with Python..."
python3 -m http.server 8000 &
SERVER_PID=$!

sleep 2

echo ""
echo "✅ Server started! Open your browser:"
echo "   👉 http://localhost:8000"
echo ""
echo "📱 Mobile testing:"
echo "   👉 Find your computer's IP: ifconfig | grep inet"
echo "   👉 Visit: http://YOUR_IP:8000 on phone"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

wait $SERVER_PID
