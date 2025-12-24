---
title: Workflow - Create Origin Pool with Failover
description: Create origin pool with health-based automatic failover to backup servers
version: 1.0.0
last_updated: 2025-12-24
category: Load Balancing
complexity: Intermediate
estimated_duration: 20-25 minutes
---

# Workflow: Create Origin Pool with Failover

## Overview
Create origin pool with automatic health-based failover configuration. Primary origin servers fail over to secondary servers if health checks fail, ensuring service continuity and high availability.

## Prerequisites
- ✅ Namespace created
- ✅ Primary backend servers running and reachable
- ✅ Secondary/backup backend servers configured
- ✅ Health check endpoint available on all servers
- ✅ Network connectivity verified to all backends

## Input Parameters

```json
{
  "pool_name": "backend-pool-ha",
  "namespace": "production",
  "endpoints": [
    {
      "type": "primary",
      "address": "10.0.1.10",
      "port": 8080,
      "weight": 10,
      "priority": 1,
      "health_check": true
    },
    {
      "type": "primary",
      "address": "10.0.1.11",
      "port": 8080,
      "weight": 10,
      "priority": 1,
      "health_check": true
    },
    {
      "type": "secondary",
      "address": "10.0.2.10",
      "port": 8080,
      "weight": 5,
      "priority": 2,
      "health_check": true
    }
  ],
  "health_check": {
    "protocol": "http",
    "path": "/health",
    "port": 8080,
    "interval": 10,
    "timeout": 5,
    "threshold": 2
  },
  "failover_config": {
    "automatic": true,
    "failover_delay": 0,
    "failback_automatic": true,
    "failback_delay": 300
  }
}
```

## Step-by-Step Execution

### Step 1: Navigate to Origin Pools Page

**Console Path**: Web App & API Protection > Manage > Origin Pools

**Details**:
- Click "Web App & API Protection" in left sidebar
- Click "Manage" submenu
- Click "Origin Pools"
- Should see list of existing pools (or empty)

**Verify**: Origin Pools list page displayed

---

### Step 2: Click Add Origin Pool Button

**Details**:
- Click "Add Origin Pool" button (usually top right)
- Should open origin pool creation form
- Form has multiple sections: metadata, endpoints, health checks

**Verify**: Blank origin pool creation form displayed

---

### Step 3: Fill Metadata Section

**Details**:

1. **Name**: Enter "backend-pool-ha"
   - Descriptive name for pool
   - Used by HTTP load balancers
   - Format: lowercase + hyphens

2. **Namespace**: Select "production"
   - Where pool is deployed

3. **Labels** (optional): Leave empty
   - Can add for organization

**Verify**: Name and namespace filled

---

### Step 4: Add Primary Endpoint #1

**Details**:

1. Look for **Endpoints** section
2. Click **"Add Endpoint"** button
3. Fill in endpoint details:
   - **Address**: Enter "10.0.1.10" (primary server 1)
   - **Port**: Enter "8080" (backend port)
   - **Weight**: Enter "10" (equal distribution)
   - **Priority**: Enter "1" (primary priority)

4. Important options:
   - **Health Checks Enabled**: Check this box
   - Allows automatic failover if unhealthy

**Details on fields**:
- **Address**: IP address of backend server
- **Port**: Port backend listens on
- **Weight**: Higher weight = more traffic (10 for primary, 5 for secondary)
- **Priority**: Lower number = higher priority (1 = primary, 2 = secondary)

**Verify**: Primary endpoint #1 added

---

### Step 5: Add Primary Endpoint #2

**Details**:

1. Click **"Add Endpoint"** again
2. Fill in:
   - **Address**: "10.0.1.11" (primary server 2)
   - **Port**: "8080"
   - **Weight**: "10" (equal to server 1)
   - **Priority**: "1" (same priority level)
3. Check **Health Checks Enabled**

**Note**: Multiple primary endpoints with same priority distribute traffic equally

**Verify**: Primary endpoint #2 added

---

### Step 6: Add Secondary (Backup) Endpoint

**Details**:

1. Click **"Add Endpoint"** again
2. Fill in:
   - **Address**: "10.0.2.10" (secondary/backup server)
   - **Port**: "8080"
   - **Weight**: "5" (less traffic during primary failure)
   - **Priority**: "2" (secondary priority, only active if primaries fail)
3. Check **Health Checks Enabled**

**Failover logic**:
- Priority 1 endpoints: Used if healthy
- Priority 2 endpoints: Used if all priority 1 fail
- Weight: Distributes traffic among same-priority endpoints

**Verify**: Secondary endpoint added

---

### Step 7: Configure Health Checks

**Details**:

1. Look for **Health Checks** section
2. Set health check parameters:

   **Health Check Protocol**:
   - Select "HTTP" (most common)
   - Options: HTTP, HTTPS, TCP, ICMP

   **Health Check Path**:
   - Enter "/health"
   - The endpoint that returns health status
   - Server should respond with 200 OK

   **Health Check Port**:
   - Enter "8080"
   - Usually same as endpoint port
   - Can be different if health service on different port

   **Health Check Interval**:
   - Enter "10" seconds
   - How often to check health
   - Lower = faster failover, more overhead

   **Health Check Timeout**:
   - Enter "5" seconds
   - How long to wait for response
   - Should be < interval

   **Failure Threshold**:
   - Enter "2"
   - Consecutive failures before marking unhealthy
   - 2 failures × 10 seconds = 20 seconds to failover

**Example health check**:
```
GET http://10.0.1.10:8080/health
Expected: HTTP 200 OK
Body: {"status": "healthy"}
```

**Verify**: Health check configured

---

### Step 8: Configure Failover Behavior

**Details** (look for Advanced or Failover section):

1. **Automatic Failover**:
   - Enable checkbox
   - Automatic: Switch to secondary if primary fails
   - Manual: Requires admin action

2. **Failover Delay**:
   - Enter "0"
   - Immediate failover (no delay)
   - Can add delay if needed (rare)

3. **Automatic Failback**:
   - Enable checkbox
   - Automatically return to primary if recovered
   - Recommended: Enabled

4. **Failback Delay**:
   - Enter "300" seconds (5 minutes)
   - Wait time after primary recovers before failback
   - Prevents thrashing (rapid switching)

**Configuration Summary**:
```
Primary endpoints: 10.0.1.10:8080, 10.0.1.11:8080 (priority 1)
Secondary endpoint: 10.0.2.10:8080 (priority 2)
Health check: HTTP /health every 10 seconds, 2 failures = failover
Failover: Automatic, immediate
Failback: Automatic after 300 seconds
```

**Verify**: Failover behavior configured

---

### Step 9: Review and Save

**Details**:

1. Review configuration:
   - Endpoints: 2 primary + 1 secondary ✓
   - Health checks: Enabled on all ✓
   - Protocol: HTTP /health ✓
   - Interval: 10 seconds ✓
   - Threshold: 2 failures ✓
   - Failover: Automatic ✓
   - Failback: Automatic after 300 seconds ✓

2. Click **"Save and Exit"** or **"Create"**
3. Should redirect to origin pool list page

**Expected**: Origin pool created successfully

---

### Step 10: Verify Pool Creation

**Details**:

1. Look for "backend-pool-ha" in origin pool list
2. Should show status and endpoint count
3. Click on it to view details:
   - Endpoints: 3 total
   - Health status: Should show health state of each
   - Primary: 10.0.1.10, 10.0.1.11 → HEALTHY
   - Secondary: 10.0.2.10 → HEALTHY

**Verify**:
- Pool appears in list ✓
- All endpoints HEALTHY ✓
- Status shows active ✓

---

### Step 11: Test Health Check

**Details**:

1. SSH to primary server (10.0.1.10):
   ```bash
   curl http://localhost:8080/health
   ```
   Expected: HTTP 200 OK

2. Check origin pool health in console:
   - Endpoint should show HEALTHY
   - No error messages

**Verify**: Health checks working

---

### Step 12: Test Failover (Simulate Primary Failure)

**Details**:

1. **Simulate failure** of primary #1 (10.0.1.10):
   - SSH to 10.0.1.10
   - Stop backend service: `systemctl stop myapp`
   - OR disable health endpoint: Block /health requests

2. **Monitor health transition** (wait 20-30 seconds):
   - Health check fails 2 times (20 seconds)
   - Endpoint transitions to UNHEALTHY
   - Check console: 10.0.1.10 should show UNHEALTHY

3. **Verify traffic failover**:
   - After primary 1 fails, traffic should route to:
     - Primary 2 (10.0.1.11) - preferred
     - Secondary (10.0.2.10) - if both primaries fail

**Verify**:
- 10.0.1.10 shows UNHEALTHY ✓
- Traffic still flowing (to other endpoints) ✓
- No service disruption ✓

---

### Step 13: Test Automatic Failback

**Details**:

1. **Restore primary #1**:
   - SSH to 10.0.1.10
   - Start service: `systemctl start myapp`
   - Verify health endpoint responds

2. **Monitor recovery** (wait 5 minutes):
   - Health check succeeds
   - Endpoint shows HEALTHY again (10-20 seconds)
   - Wait for failback delay (300 seconds = 5 minutes)
   - After delay, traffic returns to primary

3. **Verify failback**:
   - 10.0.1.10 transitions: UNHEALTHY → HEALTHY
   - After failback delay: Traffic returns to primary

**Verify**:
- Primary recovers: UNHEALTHY → HEALTHY ✓
- Failback delay observed (300 seconds) ✓
- Traffic returns to primary ✓

---

## Validation with CLI

**Command**: Verify origin pool creation with failover

```bash
# Get origin pool details
xcsh configuration get origin_pool backend-pool-ha -n production

# Expected output:
# - Name: backend-pool-ha
# - Endpoints: 3 (2 primary, 1 secondary)
# - Endpoint 1: 10.0.1.10:8080 (priority 1) HEALTHY
# - Endpoint 2: 10.0.1.11:8080 (priority 1) HEALTHY
# - Endpoint 3: 10.0.2.10:8080 (priority 2) HEALTHY
# - Health Check: HTTP /health interval=10s threshold=2
# - Failover: Automatic
# - Failback: Automatic after 300s

# Get pool health status
xcsh health check origin_pool backend-pool-ha -n production
```

---

## Success Criteria

- [x] Origin pool created with failover configuration
- [x] 2 primary endpoints configured (same priority)
- [x] 1 secondary endpoint configured (lower priority)
- [x] Health checks enabled and running
- [x] All endpoints showing HEALTHY status
- [x] Automatic failover works (tested)
- [x] Automatic failback works (tested)
- [x] CLI confirms pool creation

---

## Common Issues & Troubleshooting

### Issue: Endpoints Show UNHEALTHY Initially

**Symptoms**:
- Newly created pool shows UNHEALTHY on endpoints
- Health check appears to be failing
- Traffic not routing to backends

**Solutions**:
1. **Verify health endpoint exists**:
   - SSH to backend: `curl http://localhost:8080/health`
   - Should return 200 OK
   - If not, service may not be running

2. **Check backend service**:
   - SSH to backend
   - `systemctl status myapp` (check if running)
   - `systemctl start myapp` (start if stopped)

3. **Verify port correct**:
   - Pool configured port 8080?
   - `netstat -tlnp | grep 8080` (check listening ports)
   - Verify application listens on correct port

4. **Check firewall**:
   - Verify firewall allows health check traffic
   - `sudo iptables -L` (view rules)
   - May need to allow health check port

5. **Wait for health transition**:
   - Health checks take time to fail/succeed
   - Wait 10-20 seconds after creating pool
   - Endpoints should transition from UNKNOWN → HEALTHY

---

### Issue: Failover Not Occurring

**Symptoms**:
- Primary endpoint fails but traffic still going there
- Failover not automatically happening
- Manual intervention required

**Solutions**:
1. **Verify automatic failover enabled**:
   - Edit origin pool
   - Check "Automatic Failover" is enabled
   - Verify failover saved

2. **Check health check failures**:
   - Endpoint may not actually be UNHEALTHY
   - Health check may be succeeding despite service issue
   - Verify health endpoint actually reflects service health

3. **Verify threshold**:
   - Threshold = 2 (requires 2 failures)
   - Failure takes: 2 × 10 seconds interval = 20 seconds
   - Wait 20-30 seconds for failover

4. **Check secondary endpoint health**:
   - Secondary must be HEALTHY to receive traffic
   - If secondary is UNHEALTHY, can't failover
   - Fix secondary health before relying on failover

5. **Review failover logs**:
   - Check console events for failover records
   - May show why failover didn't occur
   - Possible: Secondary not HEALTHY, network issue, etc.

---

### Issue: Rapid Failover/Failback (Thrashing)

**Symptoms**:
- Endpoints rapidly switching between HEALTHY/UNHEALTHY
- Traffic alternating between primary and secondary
- Service instability from rapid changes

**Solutions**:
1. **Increase health check interval**:
   - Current: 10 seconds
   - Increase to: 20-30 seconds
   - Reduces false failures from timing issues

2. **Increase failure threshold**:
   - Current: 2 failures
   - Increase to: 3-5 failures
   - Requires more consistent failures before failover

3. **Fix underlying cause**:
   - Why is endpoint flapping between healthy/unhealthy?
   - Backend service issue?
   - Transient network glitches?
   - Application causing spikes?

4. **Increase failback delay**:
   - Current: 300 seconds (5 minutes)
   - Increase to: 600-900 seconds (10-15 minutes)
   - Wait longer before returning to primary

5. **Investigate backend stability**:
   - Run health diagnostics on backend
   - Monitor backend resources (CPU, memory, disk)
   - Fix root cause of instability

---

### Issue: All Endpoints Unhealthy (Complete Outage)

**Symptoms**:
- All endpoints show UNHEALTHY
- No traffic routing to any backend
- Service completely down

**Solutions**:
1. **Check network connectivity**:
   - SSH to origin pool server
   - `ping 10.0.1.10` (verify reachability)
   - `curl http://10.0.1.10:8080/health` (test health)

2. **Verify all backends running**:
   - SSH to each endpoint
   - `systemctl status myapp`
   - Start all services if stopped

3. **Check health endpoint**:
   - Verify /health endpoint works
   - Returns 200 OK
   - Returns expected health status

4. **Check firewall rules**:
   - Verify firewall allows traffic to port 8080
   - Check security groups (if cloud)
   - Verify health check traffic permitted

5. **Temporary disable health checks** (emergency):
   - Edit origin pool
   - Disable health checks temporarily
   - Restore service, fix health checks, re-enable

---

## Best Practices

### 1. Health Check Configuration
```
❌ Bad: Very frequent checks (every 1 second) or too infrequent (every 60s)
✅ Good: Every 10 seconds with 2-3 failure threshold
✅ Better: Every 15-20 seconds with 3 failure threshold (balanced)
```

### 2. Primary vs Secondary
```
❌ Bad: Equal weight for primary and secondary
✅ Good: Primary 10, Secondary 5 (2:1 ratio)
✅ Better: Primary 10, Secondary 5, with clear priority levels
```

### 3. Failback Configuration
```
❌ Bad: Immediate failback (0 second delay) → causes thrashing
✅ Good: 300 second failback delay (5 minutes)
✅ Better: 600-900 second delay (10-15 minutes) for stability
```

### 4. Endpoint Selection
```
✅ Good: 2 primary + 1 secondary for most applications
✅ Better: 3 primary + 1-2 secondary for high-availability apps
✅ Excellent: Multi-region primaries + local secondary
```

---

## Advanced Failover Scenarios

### Scenario 1: Data Center Failover
```
Primary Endpoints:
- 10.0.1.10:8080 (DC1, primary)
- 10.0.1.11:8080 (DC1, primary)

Secondary Endpoints:
- 10.0.2.10:8080 (DC2, backup)
- 10.0.2.11:8080 (DC2, backup - optional)

Result: If DC1 completely fails, traffic goes to DC2
```

### Scenario 2: Graceful Degradation
```
Primary: 3 powerful servers (weight 10 each)
Secondary: 1 smaller server (weight 5)

Behavior:
- Normal: All primary servers share traffic
- Primary down: Secondary handles reduced load
- Good enough for temporary backup
```

### Scenario 3: Multiple Tiers
```
Priority 1: High-performance servers
Priority 2: Standard servers (emergency)
Priority 3: Minimal servers (disaster fallback)

Escalating failover levels for extended outages
```

---

## Next Steps

After successfully creating origin pool with failover:

1. **Attach to HTTP Load Balancer**: Use pool in LB configuration
2. **Add Security**: Attach WAF, bot defense, API protection
3. **Monitor Performance**: Track health status, failover events
4. **Fine-tune Health Checks**: Adjust interval/threshold based on behavior
5. **Create Alerts**: Alert on endpoint failures, failover events

---

## Related Documentation

- **Origin Pool Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/origin-pool
- **Health Check Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/health-checks
- **Failover Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/origin-pool-failover
- **Priority-Based Routing**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/priority-routing
- **Health Status Monitoring**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/health-monitoring

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24
