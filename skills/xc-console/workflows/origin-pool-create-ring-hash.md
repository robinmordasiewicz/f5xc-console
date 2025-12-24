---
title: Workflow - Create Origin Pool with Ring Hash Load Balancing
description: Configure ring hash (consistent hashing) load balancing for session persistence
version: 1.0.0
last_updated: 2025-12-24
category: Load Balancing
complexity: Intermediate
estimated_duration: 15-20 minutes
---

# Workflow: Create Origin Pool with Ring Hash Load Balancing

## Overview
Configure origin pool with ring hash (consistent hashing) load balancing algorithm. Ring hash ensures that requests from the same client consistently route to the same backend server, providing session persistence without sticky session cookies.

## Prerequisites
- ✅ Namespace created
- ✅ Backend servers running and reachable
- ✅ Session persistence required (application cannot share sessions)
- ✅ Health check endpoint available
- ✅ Understanding of ring hash vs round-robin trade-offs

## Input Parameters

```json
{
  "pool_name": "session-persistent-pool",
  "namespace": "production",
  "load_balancing_algorithm": "ring_hash",
  "hash_algorithm": "client_ip",
  "endpoints": [
    {
      "address": "10.0.1.20",
      "port": 8080,
      "weight": 1
    },
    {
      "address": "10.0.1.21",
      "port": 8080,
      "weight": 1
    },
    {
      "address": "10.0.1.22",
      "port": 8080,
      "weight": 1
    }
  ],
  "health_check": {
    "protocol": "http",
    "path": "/health",
    "interval": 10,
    "timeout": 5,
    "threshold": 2
  },
  "options": {
    "minimum_ring_size": 100,
    "hash_key": "client_ip"
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
- Should see list of existing pools

**Verify**: Origin Pools list page displayed

---

### Step 2: Click Add Origin Pool Button

**Details**:
- Click "Add Origin Pool" button
- Should open origin pool creation form

**Verify**: Blank origin pool creation form displayed

---

### Step 3: Fill Metadata Section

**Details**:

1. **Name**: Enter "session-persistent-pool"
   - Descriptive name
   - Format: lowercase + hyphens

2. **Namespace**: Select "production"

3. **Labels** (optional): Leave empty

**Verify**: Name and namespace filled

---

### Step 4: Add Endpoints

**Details**:

1. Click "Add Endpoint" button
2. Add first server:
   - **Address**: 10.0.1.20
   - **Port**: 8080
   - **Weight**: 1 (equal weight for all servers)

3. Repeat for second server:
   - **Address**: 10.0.1.21
   - **Port**: 8080
   - **Weight**: 1

4. Repeat for third server:
   - **Address**: 10.0.1.22
   - **Port**: 8080
   - **Weight**: 1

**Important**:
- Ring hash works best with 3+ servers
- Equal weights recommended (weight 1 for all)
- Unequal weights supported but less common

**Verify**: All 3 endpoints added

---

### Step 5: Configure Health Checks

**Details**:

1. Look for **Health Checks** section
2. Set parameters:

   **Health Check Protocol**: HTTP
   **Health Check Path**: /health
   **Health Check Port**: 8080
   **Health Check Interval**: 10 seconds
   **Health Check Timeout**: 5 seconds
   **Failure Threshold**: 2

3. This configuration:
   - Checks /health endpoint every 10 seconds
   - Marks unhealthy after 2 consecutive failures
   - Removes unhealthy servers from ring

**Verify**: Health checks configured

---

### Step 6: Select Load Balancing Algorithm

**Details** (critical step):

1. Look for **Load Balancing Algorithm** or **Balancing Method** dropdown
2. Options:
   - "Round Robin" (default, distributes equally)
   - "Least Connections" (fewest active connections)
   - "Ring Hash" (consistent hashing - THIS ONE)
   - "Random" (random distribution)

3. Select **"Ring Hash"**
   - Enables session persistence
   - Consistent routing based on hash

**Verify**: Ring Hash selected

---

### Step 7: Configure Hash Key

**Details** (important for ring hash):

1. Look for **Hash Key** or **Hash Algorithm** option
2. Options:
   - "Client IP" (hash based on source IP - RECOMMENDED)
   - "Cookie" (hash based on specific cookie value)
   - "Header" (hash based on HTTP header value)

3. For session persistence without cookies, select **"Client IP"**
   - Same client IP always goes to same server
   - Persists sessions locally on server

**Alternative: Cookie-Based**:
If you prefer cookie-based persistence:
1. Select "Cookie"
2. Enter cookie name: "JSESSIONID" (or your session cookie)
3. Sessions follow client's cookie value

**Alternative: Header-Based**:
If using header-based routing:
1. Select "Header"
2. Enter header name: "X-User-ID" (or your identifier)
3. Sessions follow header value

**For this workflow**: Use Client IP

**Verify**: Hash key set to "Client IP"

---

### Step 8: Configure Ring Hash Advanced Settings (Optional)

**Details** (if available):

1. Look for **Ring Hash Settings** or **Advanced Options**
2. Possible settings:
   - **Minimum Ring Size**: Number of virtual nodes
     - Default: 100
     - Higher = better distribution
     - Lower = faster hashing

   - **Consistent Hash**: Enabled (should be default)
     - Ensures consistency when servers added/removed

3. Leave defaults if unsure (usually optimal)

**Verify**: Advanced settings reviewed (or left at defaults)

---

### Step 9: Review and Save

**Details**:

1. Review entire configuration:
   - Pool name: "session-persistent-pool" ✓
   - Endpoints: 3 servers (10.0.1.20, 21, 22) ✓
   - Health checks: HTTP /health every 10s ✓
   - Load balancing: Ring Hash ✓
   - Hash key: Client IP ✓

2. Click **"Save and Exit"** or **"Create"**
3. Should redirect to origin pool list

**Expected**: Ring hash pool created successfully

---

### Step 10: Verify Pool Creation

**Details**:

1. Find "session-persistent-pool" in list
2. Click to view details
3. Verify:
   - All 3 endpoints showing HEALTHY
   - Load balancing algorithm shows "Ring Hash"
   - Hash key shows "Client IP"

**Verify**: Pool details correct

---

### Step 11: Test Session Persistence

**Details** (test that same client routes to same server):

**Setup**: Three backend servers with session tracking

1. **Request 1 - Initial Connection**:
   ```bash
   curl -v http://my-app.example.com/session
   -H "User-Agent: Client-A"
   # Response: Session created on server 10.0.1.20
   # Response header: Set-Cookie: SESSIONID=xyz
   ```

2. **Request 2 - Same Client** (same source IP):
   ```bash
   curl -v http://my-app.example.com/session \
   -H "User-Agent: Client-A"
   # Expected: Routes to SAME server (10.0.1.20)
   # Session found: xyz
   # Expected: Existing session retrieved
   ```

3. **Request 3 - Different Client** (different IP):
   ```bash
   # From different machine or IP
   curl -v http://my-app.example.com/session \
   -H "User-Agent: Client-B"
   # Expected: Routes to DIFFERENT server (10.0.1.21 or 22)
   # Different session created
   ```

4. **Verify Persistence**:
   - Client A → Always server 1
   - Client B → Always server 2 (or 3)
   - Each client routes consistently

**Verify**: Ring hash providing session persistence ✓

---

### Step 12: Monitor Hash Distribution

**Details** (verify balanced distribution):

1. Monitor traffic to all servers
   - Each server should receive ~1/3 of traffic
   - Monitor dashboards or server logs

2. If imbalanced:
   - May need more clients to see balanced distribution
   - Ring hash balances with many clients (3+ recommended)
   - With few clients, may see uneven distribution

3. Check connection count:
   - Each server should have similar connection counts
   - Uneven connections = possible hash key issue

**Verify**: Traffic distributed across servers

---

### Step 13: Test Failure and Recovery

**Details**:

1. **Stop one server** (simulate failure):
   - SSH to 10.0.1.20
   - `systemctl stop myapp`

2. **Observe failover**:
   - Health check fails (20-30 seconds)
   - Server marked UNHEALTHY
   - Clients routing to that server → get routed to another

3. **Test persistence still works**:
   - Existing client still goes to their assigned server
   - If original server fails, rehash assigns new server
   - Sessions may be lost (expected in failure)

4. **Restart server**:
   - `systemctl start myapp`
   - Wait for health check to pass
   - Server returns to pool

**Verify**: Failure handling works ✓

---

## Validation with CLI

**Command**: Verify ring hash pool creation

```bash
# Get origin pool with ring hash config
xcsh configuration get origin_pool session-persistent-pool -n production

# Expected output:
# - Name: session-persistent-pool
# - Load Balancing: Ring Hash
# - Hash Key: Client IP
# - Endpoints: 3 healthy servers
# - Health Check: HTTP /health interval=10s

# Monitor pool load distribution
xcsh health monitor origin_pool session-persistent-pool -n production
# Expected: Shows traffic distribution across servers
```

---

## Success Criteria

- [x] Ring hash pool created successfully
- [x] 3+ endpoints configured with equal weights
- [x] Health checks configured
- [x] Load balancing set to Ring Hash
- [x] Hash key set to Client IP
- [x] All endpoints showing HEALTHY
- [x] Session persistence verified (same client → same server)
- [x] Traffic distributed across servers

---

## Common Issues & Troubleshooting

### Issue: Uneven Load Distribution

**Symptoms**:
- One server gets much more traffic than others
- Unbalanced connection counts
- Some servers under-utilized

**Solutions**:
1. **Need minimum clients**:
   - Ring hash needs multiple clients for even distribution
   - Test with 10+ simultaneous clients
   - With 1-2 clients, distribution may be uneven

2. **Check endpoint weights**:
   - All weights should be equal (weight 1)
   - If weights differ, distribution matches weights
   - Verify weights are same for all endpoints

3. **Verify hash key**:
   - If using "Client IP", all tests from same IP see same server
   - To test distribution, use multiple IPs:
     ```bash
     # From IP1
     curl http://app.example.com
     # Hits server A

     # From IP2
     curl http://app.example.com
     # Hits server B
     ```

4. **Check ring size**:
   - Minimum ring size too small?
   - Increase from 100 to 200-500
   - Larger ring size = better distribution

---

### Issue: Sessions Lost After Server Failure

**Symptoms**:
- User connected to server A
- Server A fails
- User routed to server B
- Session lost, user logged out

**Solutions**:
1. **This is expected behavior**:
   - Ring hash provides persistence
   - Failure breaks persistence
   - Sessions not shared between servers

2. **To prevent session loss**:
   - Option 1: Use shared session store (Redis)
   - Option 2: Use sticky sessions with timeout
   - Option 3: Accept session loss on failure

3. **Share sessions externally**:
   - Configure application to use Redis/Memcached
   - Servers store sessions in shared cache
   - Session survives server failure

4. **Use sticky sessions instead**:
   - If session loss unacceptable
   - Switch to sticky session (cookie-based)
   - But more complex than ring hash

---

### Issue: Hash Key Not Working (Wrong Server Routing)

**Symptoms**:
- Clients not routing to expected server
- Session persistence not working
- Different requests from same client going to different servers

**Solutions**:
1. **Verify hash key configured**:
   - Check if hash key is actually set
   - Confirm "Client IP" is selected

2. **If using Client IP**:
   - All requests must come from same IP
   - Different IPs get different servers (expected)
   - For testing, use single machine

3. **If using Cookie**:
   - Verify cookie name is correct
   - Application must set cookie
   - Cookie persists across requests

4. **If using Header**:
   - Verify header is sent with requests
   - Header name must match exactly
   - Case-sensitive

5. **Clear any cached configuration**:
   - May need to restart pool
   - Or wait for cache to expire

---

### Issue: Ring Hash Not Balancing After Adding Server

**Symptoms**:
- Added new server to pool
- Existing clients don't route to new server
- Load not redistributed

**Solutions**:
1. **This is expected with ring hash**:
   - Ring hash consistent = minimal rebalancing
   - Existing clients stick to original servers
   - Only new clients use new server

2. **To force rebalancing**:
   - Restart pool configuration
   - All clients get rehashed
   - WARNING: Sessions lost during rehash

3. **Accept gradual rebalancing**:
   - New clients use new server
   - Eventually old clients cycle out
   - Traffic gradually balances

4. **Use other algorithm for frequent scaling**:
   - If adding/removing servers frequently
   - Consider Round Robin instead
   - Less session persistence but easier scaling

---

## Comparison: Ring Hash vs Other Algorithms

```
Algorithm         | Session Persistence | Load Balance | Scaling
Ring Hash         | ✅ Excellent        | ✅ Good      | ⚠️ Complex
Sticky Session    | ✅ Excellent        | ⚠️ Fair      | ✅ Simple
Round Robin       | ❌ None             | ✅ Excellent | ✅ Simple
Least Connections | ❌ None             | ✅ Excellent | ✅ Simple
```

---

## Best Practices

### 1. Use Ring Hash When
```
✅ Session state stored locally on servers
✅ No shared session store (Redis/Memcached)
✅ Session loss on failure acceptable
✅ Minimal server changes in pool
```

### 2. Don't Use Ring Hash When
```
❌ Sessions shared in Redis/Memcached (use Round Robin)
❌ Frequent server additions/removals
❌ Session loss unacceptable on failure
❌ Need even distribution with few clients
```

### 3. Configuration Best Practices
```
✅ Equal weights for all servers
✅ Minimum 3 servers for good distribution
✅ Client IP hash for web apps
✅ Cookie hash for APIs if possible
```

---

## Next Steps

After creating ring hash pool:

1. **Attach to Load Balancer**: Use in HTTP LB configuration
2. **Configure Failover**: Add secondary servers for HA
3. **Add Security**: Attach WAF, bot defense
4. **Monitor Sessions**: Track persistence metrics
5. **Test at Scale**: Verify distribution with realistic load

---

## Ring Hash Algorithm Explanation

**Concept**:
1. Create virtual ring with hash values (0-2^32)
2. Place each server on ring at hash(server_address)
3. For each request, hash the key (client_ip)
4. Find server clockwise from hash value on ring
5. Route request to that server

**Advantages**:
- Client always routes to same server (if healthy)
- Adding/removing server minimally affects existing mappings
- Good distribution with many clients

**Disadvantages**:
- Uneven distribution with few clients
- Session loss on server failure
- Requires stateless or external session storage

---

## Related Documentation

- **Origin Pool Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/origin-pool
- **Ring Hash Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/ring-hash-lb
- **Consistent Hashing**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/consistent-hashing
- **Session Persistence**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/session-persistence
- **Load Balancing Algorithms**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/load-balancing-methods

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24
