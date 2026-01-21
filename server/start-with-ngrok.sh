#!/bin/bash

# Script to start the server and ngrok together

echo "Starting API server..."
cd "$(dirname "$0")"
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 2

echo "Starting ngrok tunnel..."
ngrok http 3001 &
NGROK_PID=$!

echo ""
echo "Server is running on http://localhost:3001"
echo "ngrok tunnel is starting..."
echo ""
echo "Press Ctrl+C to stop both"
echo ""

# Wait for user interrupt
trap "kill $SERVER_PID $NGROK_PID 2>/dev/null; exit" INT TERM

# Wait for processes
wait
