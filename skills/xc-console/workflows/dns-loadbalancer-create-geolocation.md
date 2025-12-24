---
title: Workflow - Create DNS Load Balancer (Geolocation Routing)
description: Create a DNS load balancer with geolocation-based traffic routing across regions
version: 1.0.0
last_updated: 2025-12-24
category: DNS & Global Routing
complexity: Intermediate
estimated_duration: 20-30 minutes
---

# Workflow: Create DNS Load Balancer (Geolocation Routing)

## Overview
Create a DNS load balancer that routes traffic to different regions based on client geolocation, enabling geographic traffic steering with automatic failover.

## Prerequisites
- ✅ DNS Zone created and delegated (domain nameservers pointing to Volterra)
- ✅ Multiple HTTP load balancers deployed (2+ regions)
- ✅ HTTP load balancers have health checks configured
- ✅ Understanding of geolocation regions

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
      "name": "us-pool",
      "priority": 1,
      "regions": ["North America"],
      "resource": "api-lb-us"
    },
    {
      "name": "eu-pool",
      "priority": 2,
      "regions": ["Europe"],
      "resource": "api-lb-eu"
    },
    {
      "name": "fallback-pool",
      "priority": 3,
      "regions": ["Rest of World"],
      "resource": "api-lb-us"
    }
  ],
  "health_check_enabled": true,
  "health_check_interval": 10,
  "failure_threshold": 2
}
```

## Step-by-Step Execution

### Step 1: Navigate to DNS Load Balancers Page

**Console Path**: Multi-Cloud Network Connect > DNS > Load Balancers

**Details**:
- Click "Multi-Cloud Network Connect" in left sidebar
- Click "DNS" submenu
- Click "Load Balancers"
- Should see list of DNS load balancers (may be empty)

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
   - Dropdown lists available zones

2. **Record Name**: Enter "api"
   - Combined with zone: api.example.com
   - Can use "*" for wildcard

3. **Record Type**: Select "A"
   - "A" for IPv4 addresses
   - "AAAA" for IPv6
   - "CNAME" for aliases

4. **TTL (Time To Live)**: Enter "60"
   - Seconds before DNS response expires
   - 60 seconds good for failover scenarios
   - 3600+ for stable records

**Verify**:
- Zone: "example.com"
- Record Name: "api"
- Record Type: "A"
- TTL: "60"

---

### Step 5: Add First Pool (US Region)

**Details**:

1. Click "Add Pool" or similar button
2. Fill pool details:
   - **Pool Name**: Enter "us-pool"
   - **Priority**: Enter "1" (primary)
   - **Resource/Endpoint**: Select "api-lb-us" (HTTP LB from US region)

3. Configure Geolocation Routing:
   - Look for "Geolocation" section in pool
   - Select "North America"
   - This pool serves North American traffic

**Verify**: Pool added to list with correct settings

---

### Step 6: Add Second Pool (EU Region)

**Details**:

1. Click "Add Pool" again
2. Fill pool details:
   - **Pool Name**: Enter "eu-pool"
   - **Priority**: Enter "2" (secondary)
   - **Resource**: Select "api-lb-eu" (HTTP LB from EU region)

3. Configure Geolocation:
   - Select "Europe"
   - This pool serves European traffic

**Verify**: Second pool added correctly

---

### Step 7: Add Fallback Pool (Rest of World)

**Details**:

1. Click "Add Pool" one more time
2. Fill pool details:
   - **Pool Name**: Enter "fallback-pool"
   - **Priority**: Enter "3" (lowest)
   - **Resource**: Select "api-lb-us" (default to US)

3. Configure Geolocation:
   - Select "Rest of World" or leave unmapped regions
   - This handles traffic from unmapped regions

**Verify**: Three pools configured with priorities

---

### Step 8: Enable Health Checks

**Details**:

1. Look for "Health Checks" toggle or section
2. Toggle ON to enable health checks
3. Configure health check settings:
   - **Interval**: "10" seconds
   - **Timeout**: "5" seconds
   - **Failure Threshold**: "2" consecutive failures
4. Health checks monitor HTTP LBs
   - If LB becomes unhealthy, DNS stops returning that IP

**Verify**: Health checks enabled with settings configured

---

### Step 9: Review and Submit

**Details**:

1. Review all configuration:
   - Record: api.example.com ✓
   - TTL: 60 seconds ✓
   - Three pools configured ✓
   - Geolocation routing set ✓
   - Health checks enabled ✓

2. Click "Save and Exit" or "Create"
3. Should redirect to DNS LB list page

**Expected**: DNS LB created successfully

---

### Step 10: Verify DNS LB Creation

**Details**:

1. Look for "api.example.com" in DNS Load Balancers list
2. Should show status and pool info
3. Click on name to view full details

**Verify**:
- DNS LB appears in list ✓
- Status shows "ACTIVE" ✓
- All pools show healthy ✓

---

## Validation with CLI

**Command**: Verify DNS load balancer creation

```bash
# List all DNS load balancers in namespace
xcsh load_balancer list dns_loadbalancer -n production

# Get specific DNS LB details
xcsh load_balancer get dns_loadbalancer api.example.com -n production

# Expected output includes:
# - Name: api.example.com
# - Zone: example.com
# - Pools: us-pool, eu-pool, fallback-pool
# - Health Status: All pools healthy
```

---

## Testing Geolocation Routing

### Test from North America

```bash
# From US machine
nslookup api.example.com

# Expected: Should resolve to US HTTP LB IP address
```

### Test from Europe

```bash
# From EU machine
nslookup api.example.com

# Expected: Should resolve to EU HTTP LB IP address
```

### Test Failover

```bash
# Stop US region HTTP LB
# (Simulate failure)

# From North America, test again
nslookup api.example.com

# Expected: After 20-30 seconds, should return EU IP
# (North America traffic fails over to EU)
```

---

## Success Criteria

- [x] DNS LB appears in console list
- [x] Status shows "ACTIVE"
- [x] All pools show HEALTHY status
- [x] Geolocation routing configured correctly
- [x] Health checks enabled
- [x] CLI confirms DNS LB creation
- [x] DNS queries return different IPs per region

---

## Monitoring DNS Load Balancer

### View Pool Health

```
Navigate to: DNS > Load Balancers > api.example.com
View:
  - Pool status (HEALTHY/UNHEALTHY)
  - Last health check time
  - Failed checks count
```

### View Query Statistics

```
Navigate to: DNS > Load Balancers > api.example.com > Metrics
View:
  - Queries Per Second (QPS)
  - Geographic distribution
  - Response times per region
  - Failover events
```

### Monitor for Failovers

```
Check:
  - Failover events log
  - Pool health changes
  - Failback to primary
Alerting:
  - Set up alerts if primary region fails
  - Monitor failover frequency
```

---

## Adjusting Geolocation Routing

### Add New Region

1. Edit DNS LB
2. Find pool configuration
3. Add region to pool (e.g., add "South America" to US pool)
4. Save

### Change Pool for Region

1. Edit DNS LB
2. Change resource for a region
3. Example: Route Europe to different HTTP LB
4. Save

### Weighted Distribution

If available:
1. Use pool weights to distribute traffic
2. Example: 80% to primary, 20% to secondary per region
3. Allows gradual traffic shifting

---

## Common Issues & Troubleshooting

### Issue: One Region Shows UNHEALTHY

**Symptoms**:
- DNS LB created but one pool unhealthy
- All regions getting failover traffic

**Solutions**:
1. Navigate to HTTP LB in that region
2. Check health check status
3. Verify HTTP LB is running
4. Check origin pool health
5. If issue persists, failover will automatically occur

---

### Issue: Wrong Region Getting Traffic

**Symptoms**:
- North America getting EU IP
- Geolocation routing not working

**Solutions**:
1. Verify geolocation assignments correct
2. Check pool resources are correct HTTP LBs
3. Review DNS LB configuration
4. Test from multiple locations to identify pattern

---

### Issue: DNS Not Resolving

**Symptoms**:
- nslookup returns "NXDOMAIN"
- DNS zone not found

**Solutions**:
1. Verify DNS Zone created and delegated
2. Verify nameservers updated at registrar
3. Wait 24-48 hours for propagation
4. Check DNS Zone status is "ACTIVE"

---

## Performance Tuning

### TTL Adjustment

**Lower TTL (30-60 seconds)**:
- Faster failover (queries updated sooner)
- More DNS load
- Use when failover critical

**Higher TTL (3600+ seconds)**:
- Less DNS load
- Slower failover (1+ hour)
- Use for stable, rarely changing records

### Health Check Tuning

**Aggressive**:
- Interval: 5 seconds
- Threshold: 1 failure
- Fast failover (5-10 seconds)
- More health check traffic

**Conservative**:
- Interval: 30 seconds
- Threshold: 3 failures
- Slower failover (90+ seconds)
- Less health check traffic

---

## Next Steps

After successfully creating DNS LB:

1. **Test Geolocation Routing**: From different regions
2. **Test Failover**: Disable region and verify failover
3. **Monitor Dashboard**: Review Query Statistics daily
4. **Adjust TTL**: If failover timing not optimal
5. **Add More Regions**: As you expand globally

---

## Related Documentation

- **DNS LB Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/dns-loadbalancer
- **DNS Zone**: https://docs.cloud.f5.com/docs-v2/platform/reference/dns-zone
- **Geolocation Routing**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/dns-geolocation-routing
- **Failover Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/dns-failover
- **Health Checks**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/dns-health-checks

---

## Rollback

To delete DNS LB:

1. Navigate to DNS > Load Balancers
2. Click menu next to DNS LB name
3. Select "Delete"
4. Confirm deletion
5. DNS record removed from zone

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24

