#!/bin/bash

# Deployment Monitoring Script
# Monitors application health and sends alerts on issues
# Usage: ./scripts/monitor-deployment.sh [URL] [WEBHOOK_URL]
# Example: ./scripts/monitor-deployment.sh https://json-viewer.io https://hooks.slack.com/...

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
URL="${1:-http://localhost:3456}"
WEBHOOK_URL="${2:-}"
CHECK_INTERVAL=60  # seconds
MAX_FAILURES=3
FAILURE_COUNT=0

# Function to log messages
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

success() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

warning() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Function to send alert
send_alert() {
  local title="$1"
  local message="$2"
  local severity="$3"  # success, warning, error
  
  # Determine color based on severity
  case "$severity" in
    success)
      color="#36a64f"  # Green
      emoji="✅"
      ;;
    warning)
      color="#ff9900"  # Orange
      emoji="⚠️"
      ;;
    error)
      color="#ff0000"  # Red
      emoji="❌"
      ;;
    *)
      color="#0099ff"  # Blue
      emoji="ℹ️"
      ;;
  esac
  
  # Send to Slack if webhook URL is provided
  if [ -n "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{
        \"attachments\": [{
          \"color\": \"$color\",
          \"title\": \"$emoji $title\",
          \"text\": \"$message\",
          \"footer\": \"JSON Viewer Monitoring\",
          \"ts\": $(date +%s)
        }]
      }" \
      --silent --output /dev/null || true
  fi
  
  # Always log to console
  case "$severity" in
    success) success "$title: $message" ;;
    warning) warning "$title: $message" ;;
    error) error "$title: $message" ;;
    *) log "$title: $message" ;;
  esac
}

# Function to check health
check_health() {
  local response=$(curl -s -w "\n%{http_code}" "$URL/api/health" 2>/dev/null || echo -e "\n000")
  local body=$(echo "$response" | head -n -1)
  local status=$(echo "$response" | tail -n 1)
  
  if [ "$status" = "200" ] && echo "$body" | grep -q '"status":"ok"'; then
    return 0
  else
    return 1
  fi
}

# Function to check page
check_page() {
  local path="$1"
  local status=$(curl -s -o /dev/null -w "%{http_code}" "$URL$path" 2>/dev/null || echo "000")
  
  if [ "$status" = "200" ]; then
    return 0
  else
    return 1
  fi
}

# Function to get response time
get_response_time() {
  local path="$1"
  local time=$(curl -s -o /dev/null -w "%{time_total}" "$URL$path" 2>/dev/null || echo "999")
  echo "$time"
}

# Function to check Docker containers
check_containers() {
  local containers=$(docker compose -f config/docker-compose.server.yml ps --format json 2>/dev/null || echo "[]")
  
  # Check if all containers are running
  if echo "$containers" | grep -q '"State":"running"'; then
    return 0
  else
    return 1
  fi
}

# Function to get container stats
get_container_stats() {
  docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "N/A"
}

# Main monitoring loop
log "Starting deployment monitoring for $URL"
log "Check interval: ${CHECK_INTERVAL}s"
log "Max failures before alert: $MAX_FAILURES"

if [ -n "$WEBHOOK_URL" ]; then
  log "Alerts will be sent to webhook"
  send_alert "Monitoring Started" "Monitoring $URL every ${CHECK_INTERVAL}s" "success"
else
  warning "No webhook URL provided - alerts will only be logged"
fi

echo ""

while true; do
  # Check health endpoint
  if check_health; then
    success "Health check passed"
    
    # Reset failure count on success
    if [ $FAILURE_COUNT -gt 0 ]; then
      send_alert "Service Recovered" "Application is healthy again after $FAILURE_COUNT failure(s)" "success"
      FAILURE_COUNT=0
    fi
    
    # Check critical pages
    PAGES=("/" "/library" "/edit" "/format" "/compare" "/convert")
    FAILED_PAGES=()
    
    for page in "${PAGES[@]}"; do
      if ! check_page "$page"; then
        FAILED_PAGES+=("$page")
      fi
    done
    
    if [ ${#FAILED_PAGES[@]} -gt 0 ]; then
      warning "Some pages are not accessible: ${FAILED_PAGES[*]}"
      send_alert "Page Access Warning" "Pages not accessible: ${FAILED_PAGES[*]}" "warning"
    fi
    
    # Check response times
    HOME_TIME=$(get_response_time "/")
    API_TIME=$(get_response_time "/api/health")
    
    log "Response times - Home: ${HOME_TIME}s, API: ${API_TIME}s"
    
    # Alert if response time is too high (> 5 seconds)
    if (( $(echo "$HOME_TIME > 5.0" | bc -l) )); then
      warning "Home page response time is high: ${HOME_TIME}s"
      send_alert "Slow Response Time" "Home page: ${HOME_TIME}s (threshold: 5s)" "warning"
    fi
    
    # Check Docker containers (if running on server)
    if [ -f "config/docker-compose.server.yml" ]; then
      if check_containers; then
        log "All Docker containers are running"
      else
        warning "Some Docker containers are not running"
        send_alert "Container Warning" "Some Docker containers are not running" "warning"
      fi
    fi
    
  else
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    error "Health check failed (attempt $FAILURE_COUNT/$MAX_FAILURES)"
    
    if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
      send_alert "Service Down" "Health check failed $FAILURE_COUNT times. Application may be down!" "error"
      
      # Get container stats for debugging
      if [ -f "config/docker-compose.server.yml" ]; then
        STATS=$(get_container_stats)
        log "Container stats:\n$STATS"
      fi
    fi
  fi
  
  # Wait before next check
  sleep $CHECK_INTERVAL
done

