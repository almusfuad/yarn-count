# Yarn Count Monitor - Real-Time Factory Production Dashboard

A full-stack monitoring system for textile/knitting machine production. Features live MQTT data streaming through a Node.js backend to a React frontend via native WebSocket.

## 📋 Project Structure

```
yarn-count/
├── package.json                    # Server dependencies
├── server/
│   ├── index.js                   # Express + WebSocket + MQTT setup
│   ├── machines.js                # Core machine state & business logic
│   ├── broadcast.js               # WebSocket broadcast utilities
│   ├── mqtt.js                    # MQTT client configuration
│   └── routes/
│       ├── machines.js            # Machine API endpoints
│       ├── dashboard.js           # Dashboard KPI endpoint
│       └── logs.js                # Downtime & quality logging
└── client/                        # Vite React application
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx & App.css
        ├── services/
        │   └── socket.js          # WebSocket singleton client
        ├── store/
        │   └── useStore.js        # Zustand state management
        └── components/
            ├── Header.jsx         # Connection status indicator
            ├── KpiCards.jsx       # Dashboard metrics
            ├── MachineGrid.jsx    # Machine list with filtering
            ├── MachineCard.jsx    # Individual machine details
            ├── AlertPanel.jsx     # Active alerts display
            ├── RollPanel.jsx      # Roll weight logging
            ├── DowntimeForm.jsx   # Downtime event logging
            ├── QualityForm.jsx    # Quality issue logging
            └── EventLog.jsx       # Historical event stream
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MQTT broker (optional for testing, e.g., mosquitto)

### Installation

```bash
# Install server dependencies
cd yarn-count
npm install

# Install client dependencies
cd client
npm install
```

### Running the Application

**Terminal 1 - Backend Server (port 3000):**
```bash
cd yarn-count
npm run dev
```

**Terminal 2 - Frontend (port 5173):**
```bash
cd yarn-count/client
npm run dev
```

Open browser to: `http://localhost:5173`

## 🏗️ Architecture

### Backend (Node.js)

**Core Engine (`server/machines.js`)**
- Maintains in-memory state for all connected machines
- Each machine tracks: status, counts, rolls, runtime/downtime, problems, alerts
- Supports 500-unit roll completion logic with automatic tracking
- 4-second stop detection for idle machines

**Real-Time Communication**
- **WebSocket**: Native WS protocol for live updates (no Socket.IO)
- **MQTT**: Subscribe to `Device/+/+` topics for incoming sensor data
- **Broadcast**: Push updates to all connected clients instantly

**REST API Endpoints**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/machines` | GET | List all machine summaries |
| `/api/machines/:id` | GET | Get single machine details |
| `/api/dashboard` | GET | Get aggregated KPIs |
| `/api/roll-weight` | POST | Log roll weight (KG) |
| `/api/downtime` | POST | Log downtime event |
| `/api/quality` | POST | Log quality issue |
| `/api/machines/:id/alerts/ack` | POST | Acknowledge alert |

### Frontend (React + Zustand)

**State Management (`useStore.js`)**
- Centralized store with Zustand
- Derives KPIs client-side from machine state for real-time updates
- Events and alerts managed in store with max-length limits

**Socket Integration (`services/socket.js`)**
- Singleton WebSocket connection
- Auto-reconnect on disconnect (3s delay)
- Message routing to store actions
- Vanilla Zustand (not hooks, for better lifecycle management)

**UI Components**
- **Header**: Shows WebSocket connection status (live indicator)
- **KpiCards**: 6 key metrics with color coding
- **MachineGrid**: Filterable list (All/ON/OFF/STOPPED)
- **AlertPanel**: Unacknowledged alerts with acknowledgment buttons
- **Forms**: Roll weight, downtime, and quality issue logging
- **EventLog**: Time-series view of all events, filterable by machine

## 📊 Data Models

### Machine State
```javascript
{
  machineId,
  status: "ON|OFF|STOPPED",
  lastPulseAt: Date,
  stopTimer: TimeoutID,
  totalCount: 0,
  currentRollCount: 0,
  rollsCompleted: 0,
  ROLL_TARGET: 500,
  runtimeMinutes: 0,
  downtimeMinutes: 0,
  activeProblems: [],
  alerts: [],
  events: [],
  rollWeightLog: [],
  downtimeLogs: [],
  qualityLogs: []
}
```

### Derived KPIs
```javascript
{
  totalMachines,
  activeMachines,
  totalCount,
  totalRolls,
  totalDowntime,
  totalRuntime,
  utilization: (runtime / (runtime + downtime)) * 100,
  estimatedOutput: count * 0.95,
  faultRate: (faults / count) * 1000
}
```

## 📡 MQTT Message Format

**Machine Status Topic:** `Device/{machineId}/machine_status`
```json
{
  "Timestamp": "2026-04-08T10:00:00Z",
  "Status": "ON|OFF|STOPPED",
  "RT": "HH:MM",
  "DT": "HH:MM"
}
```

**Raw Data Topic:** `Device/{machineId}/machine_rawdata`
```json
{
  "Timestamp": "2026-04-08T10:00:01Z",
  "Rotation": 42,
  "RT": "HH:MM"
}
```

**Problem Topic:** `Device/{machineId}/problem`
```json
{
  "Timestamp": "2026-04-08T10:00:02Z",
  "Problem": "Thread breakage",
  "Downtime": "HH:MM"
}
```

## 🧪 Testing with MQTT

### Simulate Machine Status
```bash
mosquitto_pub -h localhost -t "Device/M001/machine_status" \
  -m '{"Timestamp":"2026-04-08T10:00:00Z","Status":"ON","RT":"02:30","DT":"00:15"}'
```

### Simulate Raw Production Data
```bash
mosquitto_pub -h localhost -t "Device/M001/machine_rawdata" \
  -m '{"Timestamp":"2026-04-08T10:00:01Z","Rotation":42,"RT":"02:31"}'
```

### Simulate Problem Event
```bash
mosquitto_pub -h localhost -t "Device/M001/problem" \
  -m '{"Timestamp":"2026-04-08T10:00:02Z","Problem":"Thread breakage","Downtime":"00:05"}'
```

### Test Stop Detection
```bash
# Send one raw data message, then wait 5+ seconds
# Machine should show "STOPPED" status in UI
mosquitto_pub -h localhost -t "Device/M001/machine_rawdata" \
  -m '{"Timestamp":"2026-04-08T10:00:01Z","Rotation":42,"RT":"02:31"}'
```

## 🔍 Testing with REST API

```bash
# Get all machines
curl http://localhost:3000/api/machines

# Get dashboard KPIs
curl http://localhost:3000/api/dashboard

# Log roll weight
curl -X POST http://localhost:3000/api/roll-weight \
  -H "Content-Type: application/json" \
  -d '{"machineId":"M001","weight":2.5}'

# Log downtime
curl -X POST http://localhost:3000/api/downtime \
  -H "Content-Type: application/json" \
  -d '{"machineId":"M001","reason":"Maintenance","remarks":"Scheduled maintenance"}'

# Log quality issue
curl -X POST http://localhost:3000/api/quality \
  -H "Content-Type: application/json" \
  -d '{"machineId":"M001","faultType":"Yarn tension","severity":"critical","description":"Excessive tension detected"}'

# Acknowledge alert
curl -X POST http://localhost:3000/api/alerts/ack \
  -H "Content-Type: application/json" \
  -d '{"machineId":"M001","alertId":"M001-1712577602000"}'
```

## 🌐 WebSocket Messages

Client receives real-time updates via WebSocket:

**Initialization**
```json
{
  "type": "init",
  "payload": {
    "machines": [...],
    "kpis": {...}
  }
}
```

**Machine Update**
```json
{
  "type": "machine_update",
  "payload": {
    "machineId": "M001",
    "status": "ON",
    "totalCount": 1234,
    ...
  }
}
```

**Alert**
```json
{
  "type": "alert",
  "payload": {
    "id": "M001-1712577602000",
    "machineId": "M001",
    "type": "Thread breakage",
    "severity": "warning",
    "timestamp": "2026-04-08T10:00:02Z"
  }
}
```

**Event**
```json
{
  "type": "event",
  "payload": {
    "machineId": "M001",
    "type": "ROLL_COMPLETE",
    "message": "Roll 25 completed",
    "timestamp": "2026-04-08T10:00:01Z"
  }
}
```

## ⚙️ Configuration

Set environment variables:

```bash
# Server
export MQTT_BROKER=mqtt://broker-host:1883  # Default: mqtt://localhost:1883
export PORT=3000                               # Default: 3000

# Client (configured in vite.config.js)
# WebSocket connects to ws://localhost:3000
# API proxy maps /api to http://localhost:3000
```

## 📈 Key Features

✅ **Bi-directional Communication**: WebSocket for real-time updates, REST API for on-demand queries
✅ **Live MQTT Integration**: Subscribe to factory sensor data streams
✅ **Automatic Stop Detection**: 4-second timeout for idle machines
✅ **Roll Tracking**: Automatic roll completion at 500-unit target
✅ **Multi-Source Logging**: Downtime, quality issues, roll weights
✅ **Real-Time KPI Derivation**: Client-side calculations for instant updates
✅ **Alert Management**: Acknowledge and track active problems
✅ **Responsive UI**: Grid-based layout, filterable machine list
✅ **Production Ready**: No simulated data, only real MQTT feeds

## 🛠️ Development

**Format & Syntax Check**
```bash
npm run dev          # Run with nodemon for auto-reload
```

**Build Client**
```bash
cd client && npm run build
```

**View Build Output**
```bash
cd client && npm run preview
```

## 📦 Dependencies

**Server**
- `express` - HTTP server framework
- `ws` - Native WebSocket implementation
- `mqtt` - MQTT client for sensor data
- `cors` - Cross-origin resource sharing
- `nodemon` (dev) - Auto-restart on file changes

**Client**
- `react` - UI library
- `react-dom` - DOM rendering
- `zustand` - State management
- `vite` - Build tool
- `@vitejs/plugin-react` - React support

## 📝 License

Built for CSI Smart Tech textile production monitoring.

---

**Support**: Run `bash verify.sh` to check installation integrity at any time.
