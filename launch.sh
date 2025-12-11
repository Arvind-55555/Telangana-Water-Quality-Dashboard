#!/bin/bash

# Telangana SWOT Dashboard Launcher
# Starts local web server and opens dashboard in default browser

echo "=================================================="
echo "Telangana Water Quality SWOT Dashboard"
echo "=================================================="
echo ""

# Get the directory of this script
DIR="/home/arvind/Downloads/projects/Working/SWOT"
cd "$DIR"

# Check if server is already running
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✓ Server already running on port 8080"
else
    echo "Starting web server on port 8080..."
    python3 -m http.server 8080 &> /tmp/swot-dashboard.log &
    SERVER_PID=$!
    echo "✓ Server started (PID: $SERVER_PID)"
    sleep 2
fi

echo ""
echo "Dashboard URLs:"
echo "  - Main Dashboard:  http://localhost:8080/"
echo "  - How to Use:      http://localhost:8080/howtouse.html"
echo "  - About:           http://localhost:8080/about.html"
echo "  - Contact:         http://localhost:8080/contact.html"
echo ""
echo "Opening dashboard in default browser..."

# Open in default browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080/ &
elif command -v firefox &> /dev/null; then
    firefox http://localhost:8080/ &
elif command -v google-chrome &> /dev/null; then
    google-chrome http://localhost:8080/ &
else
    echo "Please open http://localhost:8080/ in your browser"
fi

echo ""
echo "✓ Dashboard launched!"
echo ""
echo "To stop the server:"
echo "  pkill -f 'python3 -m http.server 8080'"
echo ""
echo "Press Ctrl+C to exit this script (server will continue running)"
echo "=================================================="

# Keep script running
wait
