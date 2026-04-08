#!/bin/bash

echo "=== Yarn Count Monitor - Setup Verification ==="
echo ""

echo "1. Checking server files..."
for file in server/index.js server/machines.js server/broadcast.js server/mqtt.js server/routes/machines.js server/routes/dashboard.js server/routes/logs.js; do
  if [ -f "$file" ]; then
    echo "   ✓ $file"
  else
    echo "   ✗ $file MISSING"
    exit 1
  fi
done

echo ""
echo "2. Checking client files..."
for file in client/package.json client/vite.config.js client/index.html client/src/main.jsx client/src/App.jsx client/src/store/useStore.js client/src/services/socket.js; do
  if [ -f "$file" ]; then
    echo "   ✓ $file"
  else
    echo "   ✗ $file MISSING"
    exit 1
  fi
done

echo ""
echo "3. Checking client components..."
for component in Header KpiCards MachineGrid MachineCard AlertPanel RollPanel DowntimeForm QualityForm EventLog; do
  componentFile="client/src/components/${component}.jsx"
  if [ -f "$componentFile" ]; then
    echo "   ✓ ${component}.jsx"
  else
    echo "   ✗ ${component}.jsx MISSING"
    exit 1
  fi
done

echo ""
echo "4. Checking node dependencies..."
if [ -d "node_modules" ]; then
  echo "   ✓ Root node_modules installed"
else
  echo "   ✗ Root node_modules missing"
fi

if [ -d "client/node_modules" ]; then
  echo "   ✓ Client node_modules installed"
else
  echo "   ✗ Client node_modules missing"
fi

echo ""
echo "5. Verifying server syntax..."
node -c server/index.js > /dev/null 2>&1 && echo "   ✓ Server entry point syntax OK" || echo "   ✗ Server syntax error"

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "📝 To run the application:"
echo "   Terminal 1 (Backend):  cd $(pwd) && npm run dev"
echo "   Terminal 2 (Frontend): cd $(pwd)/client && npm run dev"
echo ""
echo "📡 To test with MQTT:"
echo "   mosquitto_pub -h localhost -t 'Device/M001/machine_status' -m '{\"Timestamp\":\"2026-04-08T10:00:00Z\",\"Status\":\"ON\",\"RT\":\"02:30\",\"DT\":\"00:15\"}'"
echo "   mosquitto_pub -h localhost -t 'Device/M001/machine_rawdata' -m '{\"Timestamp\":\"2026-04-08T10:00:01Z\",\"Rotation\":42,\"RT\":\"02:31\"}'"
echo ""
echo "🌐 Frontend will be available at: http://localhost:5173"
echo ""
