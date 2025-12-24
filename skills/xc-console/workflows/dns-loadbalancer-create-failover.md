---
title: Workflow - Create DNS Load Balancer (Active-Passive Failover)
description: Create a DNS load balancer with active-passive failover for high availability
version: 1.0.0
last_updated: 2025-12-24
category: DNS & Global Routing
complexity: Intermediate
estimated_duration: 20-30 minutes
---

# Workflow: Create DNS Load Balancer (Active-Passive Failover)

## Overview
Create a DNS load balancer with active-passive failover configuration. This enables automatic failover from primary to secondary resource, ensuring service continuity during primary failures.

## Prerequisites
- ✅ DNS Zone created and delegated (domain nameservers pointing to Volterra)
- ✅ Two HTTP load balancers deployed (primary and secondary)
- ✅ Both HTTP load balancers have health checks configured
- ✅ Secondary resource is ready to serve traffic if primary fails
- ✅ Understanding of failover behavior and failback policies

## Input Parameters

```json
{
  "name": "api.example.com",
  "namespace": "production",
  "record_name": "api",
  "domain": "example.com",
  "record_type": "A",
  "ttl": 60,
  "pools": [
    {
      "name": "primary-pool",
      "priority": 1,
      "resource": "api-lb-us-primary",
      "health_check_enabled": true,
      "health_check_interval": 10,
      "failure_threshold": 2
    },
    {
      "name": "secondary-pool",
      "priority": 2,
      "resource": "api-lb-us-secondary",
      "health_check_enabled": true,
      "health_check_interval": 10,
      "failure_threshold": 2
    }
  ],
  "failback_policy": "automatic",
  "failback_delay": 300
}
```

## Step-by-Step Execution

### Step 1: Navigate to DNS Load Balancers Page

**Console Path**: Multi-Cloud Network Connect > DNS > Load Balancers

**Details**:
- Click "Multi-Cloud Network Connect" in left sidebar
- Click "DNS" submenu
- Click "Load Balancers"
- Should see list of existing DNS load balancers

**Verify**: DNS Load Balancers list page displayed

---

### Step 2: Click Add DNS Load Balancer Button

**Details**:
- Click "Add DNS Load Balancer" button
- Should open DNS LB creation form
- Form has metadata and pool configuration sections

**Verify**: Blank DNS LB creation form displayed

---

### Step 3: Fill Metadata Section

**Details**:

1. **Name**: Enter "api.example.com"
   - Usually same as DNS record name
   - Unique per namespace

2. **Namespace**: Select "production"
   - Where DNS LB is deployed

3. **Labels** (optional): Leave empty

**Verify**:
- Name shows "api.example.com"
- Namespace shows "production"

---

### Step 4: Configure DNS Record Details

**Details**:

1. **DNS Zone**: Select "example.com"
   - Must have zone created first

2. **Record Name**: Enter "api"
   - Combined with zone: api.example.com

3. **Record Type**: Select "A"
   - "A" for IPv4 addresses
   - "AAAA" for IPv6
   - "CNAME" for aliases

4. **TTL (Time To Live)**: Enter "60"
   - Seconds before DNS response expires
   - 60 seconds good for failover scenarios
   - Lower TTL = faster failover, more DNS load
   - Higher TTL = less DNS load, slower failover

**Verify**:
- Zone: "example.com"
- Record Name: "api"
- Record Type: "A"
- TTL: "60"

---

### Step 5: Add Primary Pool

**Details**:

1. Click "Add Pool" button
2. Fill pool details:
   - **Pool Name**: Enter "primary-pool"
   - **Priority**: Enter "1" (primary, highest priority)
   - **Resource/Endpoint**: Select "api-lb-us-primary"

3. This is the active resource:
   - Receives all traffic while healthy
   - Monitored continuously for health

**Verify**: Primary pool added with priority 1

---

### Step 6: Configure Primary Pool Health Checks

**Details**:

1. **Health Check Type**: Select "HTTP" (usually)
   - Or "HTTPS" if using TLS health checks

2. **Health Check Path**:
   - Enter "/health" or endpoint from primary LB

3. **Health Check Port**:
   - Usually 443 for HTTPS, 80 for HTTP
   - Must match primary LB configuration

4. **Health Check Interval**: Enter "10" seconds
   - How often to check primary

5. **Health Check Timeout**: Enter "5" seconds
   - How long to wait for response

6. **Failure Threshold**: Enter "2"
   - Consecutive failures before marking unhealthy
   - 2 failures × 10 second interval = 20 seconds failover time

**Verify**: Health checks configured for primary

---

### Step 7: Add Secondary Pool

**Details**:

1. Click "Add Pool" again
2. Fill pool details:
   - **Pool Name**: Enter "secondary-pool"
   - **Priority**: Enter "2" (secondary, lower priority)
   - **Resource**: Select "api-lb-us-secondary"

3. This is the passive resource:
   - Standby, only receives traffic if primary fails
   - Also health-checked for readiness

**Verify**: Secondary pool added with priority 2

---

### Step 8: Configure Secondary Pool Health Checks

**Details**:

Same as primary:

1. **Health Check Type**: Select "HTTP" or "HTTPS"
2. **Health Check Path**: "/health" or equivalent
3. **Health Check Port**: Matching port
4. **Health Check Interval**: "10" seconds
5. **Health Check Timeout**: "5" seconds
6. **Failure Threshold**: "2"

**Verify**: Health checks configured for secondary

---

### Step 9: Configure Failover Behavior (Important)

**Details** (look for Advanced or Failover section):

1. **Failback Policy**: Select "Automatic"
   - "Automatic": Return to primary if it recovers
   - "Manual": Requires admin action to failback
   - Recommended: Automatic for self-healing

2. **Failback Delay**: Enter "300" seconds (5 minutes)
   - Wait time after primary recovers before failback
   - Prevents thrashing (rapid switching)
   - Recommended: 300 seconds (5 minutes)

3. **Failover Threshold**:
   - Usually auto-calculated from health check settings
   - 2 failures × 10 second interval ≈ 20 seconds to failover

**Verify**:
- Failback Policy: "Automatic"
- Failback Delay: "300" seconds

---

### Step 10: Review and Submit

**Details**:

1. Review all configuration:
   - Record: api.example.com ✓
   - TTL: 60 seconds ✓
   - Primary pool: api-lb-us-primary (priority 1) ✓
   - Secondary pool: api-lb-us-secondary (priority 2) ✓
   - Health checks: Enabled on both ✓
   - Failback: Automatic after 300 seconds ✓

2. Click "Save and Exit" or "Create"
3. Should redirect to DNS LB list page

**Expected**: DNS LB created successfully

---

### Step 11: Verify DNS LB Creation

**Details**:

1. Look for "api.example.com" in DNS Load Balancers list
2. Should show status and pool info
3. Click on name to view full details

**Verify**:
- DNS LB appears in list ✓
- Status shows "ACTIVE" ✓
- Both pools show healthy ✓
- Failover configuration visible ✓

---

## Validation with CLI

**Command**: Verify DNS load balancer creation

```bash
# List all DNS load balancers
xcsh configuration list dns_loadbalancer -n production

# Get specific DNS LB details
xcsh configuration get dns_loadbalancer api.example.com -n production

# Expected output includes:
# - Name: api.example.com
# - Zone: example.com
# - Pools: primary-pool, secondary-pool
# - Priorities: 1, 2
# - Health Status: Primary HEALTHY, Secondary HEALTHY
# - Failover Policy: Automatic
```

---

## Success Criteria

- [x] DNS LB appears in console list
- [x] Status shows "ACTIVE"
- [x] Primary pool shows HEALTHY status
- [x] Secondary pool shows HEALTHY status
- [x] Health checks enabled and passing
- [x] Failback policy set to automatic
- [x] CLI confirms DNS LB creation
- [x] Ready for failover testing

---

## Testing Failover

### Test Primary Health Check

```bash
# Verify primary is healthy
dig api.example.com

# Expected: Returns primary pool's IP address
# Verify primary LB health check endpoint
curl https://<primary-lb-ip>/health

# Expected: HTTP 200 OK
```

### Simulate Primary Failure (Test Failover)

```bash
# Stop or disable primary HTTP LB
# (In HTTP LB console: Edit → Disable or Stop)

# Wait 20-30 seconds (2 failures × 10 second interval)

# Query DNS again
dig api.example.com

# Expected: Now returns secondary pool's IP address
# Failover occurred automatically
```

### Test Failback (Automatic Recovery)

```bash
# Re-enable primary HTTP LB
# (In HTTP LB console: Edit → Enable or Start)

# Wait 300 seconds (failback delay)

# Query DNS again
dig api.example.com

# Expected: Returns primary pool's IP address again
# Automatic failback occurred
```

### Monitor DNS Load Balancer

```
Navigate to: DNS > Load Balancers > api.example.com > Metrics
View:
  - Queries per second (QPS)
  - Pool responses (primary vs secondary)
  - Failover events log
  - Response times per pool
```

---

## Common Issues & Troubleshooting

### Issue: Secondary Pool Never Receives Traffic

**Symptoms**:
- Primary pool always HEALTHY
- Secondary never becomes active
- Even when primary fails, queries still go to primary

**Solutions**:
1. Verify primary pool actually unhealthy:
   - Navigate to primary pool
   - Check health check status
   - Manual test: `curl https://<primary-ip>/health`

2. Check health check configuration:
   - Path correct on primary LB?
   - Port correct?
   - Timeout too short?

3. Check failover threshold:
   - 2 failures × 10 seconds = 20 seconds min
   - May be longer if timeout is high

4. Verify secondary is healthy:
   - Secondary should also show HEALTHY
   - If UNHEALTHY, won't receive traffic

---

### Issue: Rapid Failover/Failback (Thrashing)

**Symptoms**:
- DNS returns different IPs rapidly
- Primary fails → Secondary gets traffic → Primary recovers → Primary gets traffic again
- Users see connection drops frequently

**Solutions**:
1. Increase failback delay:
   - Edit DNS LB
   - Increase Failback Delay to 600+ seconds (10+ minutes)
   - Prevents rapid switching

2. Investigate primary instability:
   - Why is primary failing and recovering?
   - Check primary HTTP LB health
   - May have resource issues
   - May need to fix primary, not just configure failback

3. Increase failure threshold:
   - Currently: 2 failures = failover
   - Try: 3 failures (longer before failover)
   - Prevents failover on momentary glitches

---

### Issue: Failover Never Occurs (Primary Always Used)

**Symptoms**:
- Primary pool unhealthy
- Secondary shows HEALTHY
- DNS still returns primary IP
- Traffic to primary fails

**Solutions**:
1. Verify primary is actually UNHEALTHY:
   - Check DNS LB details page
   - Primary pool section should show UNHEALTHY

2. Check failure threshold:
   - Health check may not have failed enough times yet
   - Wait: (Threshold) × (Interval) seconds
   - 2 × 10 = 20 seconds minimum

3. Check TTL propagation:
   - DNS responses cached
   - TTL = 60 seconds
   - Clients may still use old IP for up to 60 seconds
   - After 60 seconds, new query gets secondary

4. Verify secondary is HEALTHY:
   - Secondary must be healthy to receive traffic
   - If UNHEALTHY, primary still used (only healthy pools get traffic)

---

### Issue: Secondary Pool Unhealthy

**Symptoms**:
- Secondary pool shows UNHEALTHY status
- Cannot failover if primary fails
- Health check failures on secondary

**Solutions**:
1. Verify secondary HTTP LB running:
   - SSH to secondary LB
   - Check LB service status
   - Restart if needed

2. Verify health check endpoint:
   - Same path as primary?
   - Responding with 200 OK?
   - Check firewall allows health checks

3. Verify secondary configuration:
   - Security groups allow health check traffic?
   - Port correct?
   - Path correct?

4. Review secondary LB logs:
   - May show health check failures
   - Investigate why responding fails

---

## Manual Failover (Alternative)

If you prefer manual control over failover:

1. Edit DNS LB
2. Change Failback Policy to "Manual"
3. During failure:
   - Manually disable primary pool
   - Manually enable secondary pool
4. During recovery:
   - Manually disable secondary pool
   - Manually enable primary pool

**Not recommended** for production - use automatic.

---

## Geolocation Failover vs Active-Passive

### Active-Passive (This Workflow)
- Primary active, secondary standby
- Failover on primary failure
- All traffic normally through primary
- Good for: Primary/backup scenario

### Geolocation-Based (Different Workflow)
- Multiple active pools
- Failover per-region
- Traffic distributed by geography
- Good for: Multi-region active-active

See workflow: `dns-loadbalancer-create-geolocation.md` for multi-region setup.

---

## Next Steps

After successfully creating failover DNS LB:

1. **Test Failover**: Simulate primary failure and verify secondary activates
2. **Test Failback**: Verify automatic recovery to primary
3. **Monitor Metrics**: Watch DNS metrics dashboard
4. **Set Up Alerts**: Create alerts for failover events
5. **Update Runbooks**: Document your failover behavior for ops team
6. **Consider Additional Pools**: Add tertiary for extra resilience

---

## Monitoring Failover

### View Failover Events

```
Navigate to: DNS > Load Balancers > api.example.com > Events
View:
  - Failover events with timestamp
  - Which pool failed
  - When failback occurred
  - Health check failure reasons
```

### Alert Configuration (Future)

```
Set up alerts for:
  - Primary pool becomes UNHEALTHY
  - Failover occurs
  - Failback occurs
  - Secondary pool becomes UNHEALTHY
```

### Traffic Analysis

```
Navigate to: DNS > Load Balancers > api.example.com > Metrics
Analyze:
  - Requests to primary pool
  - Requests to secondary pool
  - Timeline of failover events
  - Recovery patterns
```

---

## Cost Considerations

### DNS LB Failover Charges

No additional cost for failover functionality:

1. **Base DNS LB Fee**: Same as geolocation-based
2. **Health Checks**: Included
3. **Failover**: No surcharge
4. **Query Volume**: Billed per query (standard DNS)

**Total**: Same as any DNS LB, ~$5-20/month depending on volume

---

## Rollback

To delete the failover DNS LB:

1. Navigate to DNS Load Balancers list
2. Click menu next to DNS LB name
3. Select "Delete"
4. Confirm deletion
5. DNS LB removed, domain returns to static zone records
6. Failover functionality disabled

---

## Related Documentation

- **DNS LB Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/dns-loadbalancer
- **Failover Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/dns-failover
- **Health Checks**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/dns-health-checks
- **Active-Passive Design**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/dns-active-passive
- **Traffic Management**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/dns-traffic-management

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24

