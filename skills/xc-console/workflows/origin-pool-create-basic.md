---
title: Workflow - Create Origin Pool (HTTP Backends)
description: Create an origin pool with multiple backend servers and health checks
version: 1.0.0
last_updated: 2025-12-24
category: Load Balancing
complexity: Beginner
estimated_duration: 10-15 minutes
---

# Workflow: Create Origin Pool (HTTP Backends)

## Overview
Create an origin pool that manages a group of backend servers with HTTP health checks and load balancing.

## Prerequisites
- ✅ Namespace exists
- ✅ Backend servers deployed and running (3+ recommended for HA)
- ✅ Backend servers have health check endpoint (e.g., GET /health)
- ✅ Backend servers return HTTP 200 on health check

## Input Parameters

```json
{
  "name": "backend-pool",
  "namespace": "production",
  "health_check_type": "http",
  "health_check_path": "/health",
  "health_check_port": 80,
  "load_balancing_algorithm": "round_robin",
  "endpoints": [
    {
      "ip_address": "10.0.1.10",
      "port": 80,
      "weight": 1
    },
    {
      "ip_address": "10.0.1.11",
      "port": 80,
      "weight": 1
    },
    {
      "ip_address": "10.0.1.12",
      "port": 80,
      "weight": 1
    }
  ]
}
```

## Step-by-Step Execution

### Step 1: Navigate to Origin Pools Page

**Console Path**: Web App & API Protection > Manage > Origin Pools

**Details**:
- Click "Web App & API Protection" in left sidebar
- Click "Manage" submenu
- Click "Origin Pools"
- Should see list of existing origin pools (may be empty)

**Verify**: Origin Pools list page displayed

---

### Step 2: Click Add Origin Pool Button

**Details**:
- Click "Add Origin Pool" button (usually top right)
- Should open origin pool creation form
- Form may have sections or tabs

**Verify**: Blank origin pool creation form displayed

---

### Step 3: Fill Metadata Section

**Details**:
1. **Name**: Enter "backend-pool"
   - Constraints: Unique per namespace, lowercase alphanumeric + dashes

2. **Namespace**: Select "production"
   - Dropdown select
   - Determines resource isolation

3. **Labels** (optional): Leave empty for now
   - Key-value format (optional)

**Verify**:
- Name field shows "backend-pool"
- Namespace shows "production"

---

### Step 4: Configure Health Check Type

**Details**:
1. Look for "Health Check" or "Health Check Type" dropdown
2. Select: "HTTP"
3. This will reveal additional health check fields

**Verify**: "HTTP" is selected

---

### Step 5: Configure Health Check Settings

**Details**:

1. **Health Check Path**:
   - Enter: "/health"
   - Field type: Text input
   - This is the endpoint on backend servers
   - Server must respond with HTTP 200

2. **Health Check Port**:
   - Enter: "80"
   - Field type: Number input
   - Port where health checks connect

3. **Health Check Interval**:
   - Enter: "10" (seconds)
   - How often to perform health check
   - Default is usually 10 seconds

4. **Health Check Timeout**:
   - Enter: "3" (seconds)
   - How long to wait for response
   - Should be less than interval

5. **Unhealthy Threshold**:
   - Enter: "3"
   - Consecutive failures before marking unhealthy
   - Default is usually 3

6. **Healthy Threshold**:
   - Enter: "1"
   - Consecutive successes before marking healthy
   - Default is usually 1

**Verify**:
- All health check fields populated correctly
- Values make sense (timeout < interval)

---

### Step 6: Configure Load Balancing Algorithm

**Details**:
1. Look for "Load Balancing Algorithm" dropdown
2. Select: "Round Robin"
   - Distributes equally across healthy endpoints
   - Default and simplest option
   - Can be changed later if needed

**Verify**: "Round Robin" is selected

---

### Step 7: Add Origin Endpoints

**Details**:

For each backend server (3+ recommended):

1. Click "Add Origin Endpoint" button
2. Enter endpoint details:
   - **IP Address**: "10.0.1.10" (first backend)
   - **Port**: "80"
   - **Weight**: "1" (equal distribution)
   - **Labels** (optional): Leave empty

3. Repeat for each backend:
   - Second endpoint: "10.0.1.11", port 80, weight 1
   - Third endpoint: "10.0.1.12", port 80, weight 1

4. After adding each endpoint:
   - Should appear in list below
   - Can click endpoint to edit or remove

**Verify**:
- All 3 endpoints added to list
- Each shows IP, port, weight correctly

---

### Step 8: Review and Submit

**Details**:
1. Review all fields:
   - Name: backend-pool ✓
   - Namespace: production ✓
   - Health Check: HTTP, /health, port 80 ✓
   - Endpoints: 3 servers listed ✓

2. Click "Save and Exit" or "Create"
3. Form should close, redirect to origin pools list

**Expected**: Origin pools list page displayed

---

### Step 9: Verify Pool Creation and Health Status

**Details**:
1. Look for "backend-pool" in origin pools list
2. Should show status (may say "Creating", "Checking", etc.)
3. Wait 10-30 seconds for health checks to complete
4. Status should change to "Healthy" (or show endpoint health)

**Verification steps**:
- Pool appears in list ✓
- Pool name shows "backend-pool" ✓
- Status shows healthy/ready ✓
- All 3 endpoints show HEALTHY ✓

---

### Step 10: Click on Pool to View Details

**Details**:
1. Click on "backend-pool" name
2. Should show pool details page
3. View section should show:
   - Pool metadata (name, namespace)
   - Health check configuration
   - Endpoints with status (HEALTHY/UNHEALTHY)
   - Health check results

**Verify**:
- All endpoints show HEALTHY status
- Health checks running successfully
- No error messages

---

## Validation with CLI

**Command**: Verify origin pool creation

```bash
# List all origin pools in namespace
xcsh load_balancer list origin_pool -n production

# Get specific origin pool details
xcsh load_balancer get origin_pool backend-pool -n production

# Expected output includes:
# - Name: backend-pool
# - Namespace: production
# - Health Check: HTTP /health port 80
# - Endpoints: 3 entries with IP addresses
# - Status: HEALTHY for all endpoints
```

---

## Success Criteria

- [x] Origin pool appears in console list
- [x] All endpoints show HEALTHY status
- [x] Health checks running at 10-second interval
- [x] No error messages in pool details
- [x] CLI confirms pool creation and health status
- [x] Pool can be referenced by HTTP load balancers

---

## Testing Pool Connectivity

### Manual Health Check Test

```bash
# Test from your local machine
curl -I http://10.0.1.10:80/health
curl -I http://10.0.1.11:80/health
curl -I http://10.0.1.12:80/health

# Expected: HTTP 200 OK response
```

### Verify Health Check Works

```bash
# If health checks failing:
# 1. SSH to backend server
# 2. Verify endpoint is running
ssh ubuntu@10.0.1.10
curl localhost:80/health

# Should return: HTTP 200 OK
```

---

## Common Issues & Troubleshooting

### Issue: Endpoints Show UNHEALTHY

**Symptoms**:
- Pool created but endpoints show UNHEALTHY
- Health check failures in logs

**Diagnosis**:
1. Verify backend servers are running
2. SSH to backend and test health check:
   ```bash
   curl http://localhost:80/health
   ```
3. Verify port is correct (80 for HTTP)
4. Check firewall allows traffic from F5 XC to backend

**Solutions**:
1. Fix backend health check endpoint
2. Verify port in pool matches backend listening port
3. Check firewall/security groups allow traffic
4. Wait 30+ seconds for health status to update

---

### Issue: Cannot Add Endpoints

**Symptoms**:
- "Add Origin Endpoint" button doesn't work
- Error when saving endpoint

**Solutions**:
1. Verify IP address is valid format
2. Verify port is number 1-65535
3. Verify weight is number > 0
4. Try entering IP as hostname instead (if resolvable)

---

### Issue: Wrong Health Check Endpoint

**Symptoms**:
- Endpoints show UNHEALTHY
- But servers are running
- Manual curl test shows 200 OK

**Solutions**:
1. Edit origin pool
2. Change health check path to correct endpoint
3. Save changes
4. Wait for endpoints to become HEALTHY again

---

## Modifying the Pool (After Creation)

### Add New Endpoint
1. Edit origin pool
2. Scroll to endpoints section
3. Click "Add Origin Endpoint"
4. Enter new server details
5. Save
6. Wait for health check

### Remove Endpoint
1. Edit origin pool
2. Click "X" or "Delete" next to endpoint
3. Save
4. Traffic redistributes to remaining endpoints

### Change Load Balancing Algorithm
1. Edit origin pool
2. Change "Load Balancing Algorithm"
3. Save
4. Changes apply immediately

---

## Next Steps

After successfully creating origin pool:

1. **Create HTTP Load Balancer**: See workflow `http-loadbalancer-create-basic.md`
2. **Add More Endpoints**: If scaling out
3. **Configure Failover**: See workflow `origin-pool-create-failover.md`
4. **Enable Advanced Load Balancing**: For session persistence, see `origin-pool-create-ring-hash.md`

---

## Related Documentation

- **Origin Pool Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/origin-pool
- **Health Checks**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/origin-pool-health-checks
- **Load Balancing Algorithms**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/load-balancing-algorithms
- **Failover Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/origin-pool-failover

---

## Rollback

If you need to delete the origin pool:

1. **Important**: First remove all HTTP load balancers referencing this pool
   - Find LBs that use this pool
   - Delete those LBs or change their origin pool
2. Navigate to Origin Pools list
3. Click menu next to pool name
4. Select "Delete"
5. Confirm deletion
6. Verify with CLI: `xcsh load_balancer list origin_pool -n production` should not return the pool

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24

