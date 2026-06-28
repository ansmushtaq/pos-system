#!/bin/bash
echo "Starting POS System..."
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""

cd "$(dirname "$0")/backend" && npm run dev &
cd "$(dirname "$0")/frontend" && npm run dev &

echo "Both servers started."
echo "Press Ctrl+C to stop both."
wait
