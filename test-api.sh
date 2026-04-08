#!/bin/bash

# Yarn Count Monitor - Demo & Test Script
# Tests all API endpoints and simulates MQTT messages

API_BASE="http://localhost:3000/api"
MACHINES=("M001" "M002" "M003")

echo "================================"
echo "Yarn Count Monitor - Test Suite"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4

  echo -n "Testing: $description ... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$API_BASE$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$API_BASE$endpoint")
  fi

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [[ $http_code =~ ^[2][0-9]{2}$ ]]; then
    echo -e "${GREEN}✓ ($http_code)${NC}"
    if [ "$5" = "verbose" ]; then
      echo "  Response: $body" | head -c 100
      echo ""
    fi
  else
    echo -e "${RED}✗ ($http_code)${NC}"
    echo "  Error: $body"
  fi
}

# 1. Health Check
echo "1. System Health"
echo "================"
test_endpoint "GET" "/health" "" "Health check"
echo ""

# 2. Get Machines
echo "2. Machine Endpoints"
echo "===================="
test_endpoint "GET" "/machines" "" "Get all machines"
for machine in "${MACHINES[@]}"; do
  test_endpoint "GET" "/machines/$machine" "" "Get $machine"
done
echo ""

# 3. Dashboard
echo "3. Dashboard"
echo "============"
test_endpoint "GET" "/dashboard" "" "Get KPIs"
echo ""

# 4. Log Roll Weight
echo "4. Production Logging"
echo "====================="
for machine in "${MACHINES[@]}"; do
  weight=$(echo "scale=2; $(($RANDOM % 300 + 100)) / 100" | bc)
  test_endpoint "POST" "/roll-weight" "{\"machineId\":\"$machine\",\"weight\":$weight}" "Log weight ($weight KG) for $machine"
done
echo ""

# 5. Log Downtime
echo "5. Downtime Logging"
echo "==================="
test_endpoint "POST" "/downtime" \
  "{\"machineId\":\"M001\",\"reason\":\"Maintenance\",\"remarks\":\"Scheduled oil change\"}" \
  "Log downtime for M001"

test_endpoint "POST" "/downtime" \
  "{\"machineId\":\"M002\",\"reason\":\"Thread breakage\",\"remarks\":\"Rethread required\"}" \
  "Log downtime for M002"
echo ""

# 6. Log Quality Issues
echo "6. Quality Logging"
echo "=================="
test_endpoint "POST" "/quality" \
  "{\"machineId\":\"M001\",\"faultType\":\"Yarn tension\",\"severity\":\"critical\",\"description\":\"Tension too high\"}" \
  "Log quality issue for M001"

test_endpoint "POST" "/quality" \
  "{\"machineId\":\"M003\",\"faultType\":\"Contamination\",\"severity\":\"warning\",\"description\":\"Lint detected\"}" \
  "Log quality issue for M003"
echo ""

# 7. Alert Acknowledgment
echo "7. Alert Management"
echo "==================="
test_endpoint "GET" "/machines" "" "Check alerts in machine state" "verbose"
test_endpoint "POST" "/alerts/ack" \
  "{\"machineId\":\"M001\",\"alertId\":\"test-alert-001\"}" \
  "Acknowledge alert"
echo ""

echo "================================"
echo "Test suite completed!"
echo "================================"
echo ""
echo "📊 To view results in the dashboard:"
echo "   Open http://localhost:5173 in your browser"
echo ""
echo "📡 To simulate MQTT data:"
echo "   Source: MQTT Simulation"
echo "   Run MQTT test commands (see README.md)"
echo ""
