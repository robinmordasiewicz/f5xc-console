---
title: Workflow - Create DNS Zone
description: Create and delegate a DNS zone to F5 Distributed Cloud DNS service
version: 1.0.0
last_updated: 2025-12-24
category: DNS & Global Routing
complexity: Beginner
estimated_duration: 10-20 minutes
---

# Workflow: Create DNS Zone

## Overview
Create a DNS zone in F5 Distributed Cloud and configure your domain to use Volterra nameservers. This enables DNS load balancing, traffic management, and global distribution through the Volterra platform.

## Prerequisites
- ✅ Domain registered (e.g., example.com)
- ✅ Access to domain registrar (for nameserver changes)
- ✅ F5 XC namespace created
- ✅ Understanding of DNS delegation

## Input Parameters

```json
{
  "domain": "example.com",
  "namespace": "production",
  "soa_config": {
    "primary_nameserver": "ns1.volterraedge.net",
    "admin_email": "admin@example.com",
    "ttl": 3600
  },
  "dnssec": false,
  "labels": {
    "environment": "production",
    "team": "platform"
  }
}
```

## Step-by-Step Execution

### Step 1: Navigate to DNS Zones Page

**Console Path**: Multi-Cloud Network Connect > DNS > Zones

**Details**:
- Click "Multi-Cloud Network Connect" in left sidebar
- Click "DNS" submenu
- Click "Zones"
- Should see list of existing DNS zones (may be empty)

**Verify**: DNS Zones list page displayed

---

### Step 2: Click Add DNS Zone Button

**Details**:
- Click "Add DNS Zone" button (usually top right)
- Should open DNS zone creation form
- Form has metadata and zone configuration sections

**Verify**: Blank DNS zone creation form displayed

---

### Step 3: Fill Metadata Section

**Details**:

1. **Domain Name**: Enter "example.com"
   - The domain you're creating a zone for
   - Must match registered domain
   - Format: lowercase, no trailing dot (Volterra adds it)

2. **Namespace**: Select "production"
   - Where the zone is managed
   - Determines access and billing

3. **Labels** (optional): Leave empty or add
   - Key: "environment" → Value: "production"
   - Key: "team" → Value: "platform"

**Verify**:
- Domain Name: "example.com"
- Namespace: "production"
- Labels displayed

---

### Step 4: Configure Zone Settings

**Details**:

1. **Zone Type**: Select "Zone"
   - Usually "Zone" for standalone domain
   - "Delegation" if delegating subdomain (advanced)

2. **SOA Configuration** (if visible):
   - Primary Nameserver: Usually auto-filled
   - Admin Email: "admin@example.com"
   - TTL: 3600 (1 hour, standard)

3. **DNSSEC** (optional):
   - Toggle OFF for now
   - Can enable later if needed
   - Adds complexity; skip unless required

**Verify**:
- Zone Type: "Zone"
- SOA configuration reviewed
- DNSSEC: OFF (unless specifically needed)

---

### Step 5: Review Nameservers

**Details**:

The console will show the Volterra nameservers you need to configure:

**Volterra Nameservers** (examples, yours will be specific):
- ns1.volterraedge.net
- ns2.volterraedge.net
- ns3.volterraedge.net
- ns4.volterraedge.net

**Important**: Write down these 4 nameservers - you'll need them at your domain registrar.

**Verify**: All 4 nameservers visible and noted

---

### Step 6: Submit Form

**Details**:
- Scroll to bottom of form
- Click "Save and Exit" or "Create"
- Form should close, redirect to DNS Zones list

**Expected**: Zone created successfully

---

### Step 7: Verify Zone Creation

**Details**:

1. Look for "example.com" in DNS Zones list
2. Should show status "ACTIVE"
3. Click on zone name to view details
4. Details page shows:
   - Domain: example.com
   - Status: ACTIVE
   - Nameservers: 4 Volterra nameservers listed

**Verify**:
- Zone appears in list ✓
- Status shows "ACTIVE" ✓
- Nameservers displayed ✓

---

### Step 8: Update Domain Registrar (Critical Step)

**Details**:

This step is REQUIRED for DNS to work. You must update your domain registrar:

1. **Log into Domain Registrar** (GoDaddy, Namecheap, etc.)
2. **Find DNS Settings** for example.com
3. **Change Nameservers** to Volterra nameservers:
   - Remove current nameservers (usually your registrar's)
   - Add 4 Volterra nameservers:
     - ns1.volterraedge.net
     - ns2.volterraedge.net
     - ns3.volterraedge.net
     - ns4.volterraedge.net
4. **Save Changes** in registrar
5. **Wait for Propagation** (typically 24-48 hours)
   - During propagation, queries go to Volterra nameservers
   - You can verify with `dig` or `nslookup`

**Critical**: Without this step, domain will NOT use Volterra DNS

---

### Step 9: Verify DNS Propagation

**Details**:

Wait 24-48 hours, then verify DNS is working:

```bash
# Check nameservers for your domain
dig example.com NS

# Expected output shows Volterra nameservers:
# example.com.       3600    IN  NS  ns1.volterraedge.net.
# example.com.       3600    IN  NS  ns2.volterraedge.net.
# example.com.       3600    IN  NS  ns3.volterraedge.net.
# example.com.       3600    IN  NS  ns4.volterraedge.net.

# Or use nslookup
nslookup example.com

# May initially show old nameservers, eventually shows Volterra
```

---

### Step 10: Validate with CLI

**Details**:

```bash
# List all DNS zones
xcsh configuration list dns_zone -n production

# Get specific DNS zone details
xcsh configuration get dns_zone example.com -n production

# Expected output includes:
# - Domain: example.com
# - Status: ACTIVE
# - Nameservers: 4 Volterra nameservers
# - Zone type: Zone
```

---

## Success Criteria

- [x] DNS zone appears in console list
- [x] Status shows "ACTIVE"
- [x] Nameservers are Volterra nameservers
- [x] Domain registrar updated with Volterra nameservers
- [x] DNS propagation complete (24-48 hours)
- [x] `dig example.com NS` shows Volterra nameservers
- [x] CLI confirms zone creation
- [x] Zone ready for DNS records and load balancers

---

## Testing DNS Zone

### Test Zone Authority

```bash
# Query specific Volterra nameserver
dig @ns1.volterraedge.net example.com

# Should respond (even if no records yet)
# Status: NOERROR or NXDOMAIN (if no records yet)
```

### Test DNS Propagation

```bash
# Check propagation at multiple services
# https://www.whatsmydns.net/
# Search: example.com NS
# Shows which nameservers different locations see
```

### Create DNS Records

Once zone is active:

```
See workflow: dns-zone-add-records.md (future workflow)
Add A, AAAA, CNAME, MX records as needed
```

---

## Common Issues & Troubleshooting

### Issue: Zone Status Stays "Pending"

**Symptoms**:
- Zone status shows "Pending" for hours/days
- Not transitioning to "ACTIVE"

**Solutions**:
1. Wait up to 1 hour for initial activation
2. Refresh the console page
3. Check zone details for any error messages
4. If still pending after 1 hour:
   - Delete zone and retry
   - Verify domain name is correct (no typos)
   - Check namespace exists

---

### Issue: DNS Queries Fail (SERVFAIL)

**Symptoms**:
- `dig example.com` returns SERVFAIL
- Queries to Volterra nameservers fail
- Zone shows ACTIVE but not responding

**Solutions**:
1. Wait 24-48 hours for full propagation
2. Verify registrar actually changed nameservers:
   - Check registrar control panel
   - Run `dig example.com NS` from your ISP
   - May show old nameservers if not fully propagated
3. Check F5 XC console:
   - Zone status should be ACTIVE
   - Try querying the specific nameserver:
     ```bash
     dig @ns1.volterraedge.net example.com
     ```
4. If still failing:
   - Delete and recreate zone
   - Ensure domain name exactly matches registrar

---

### Issue: Old Nameservers Still Showing

**Symptoms**:
- `dig example.com NS` shows old nameservers
- Registrar control panel shows Volterra nameservers
- But propagation hasn't reached local DNS

**Solutions**:
1. This is normal during propagation (24-48 hours)
2. Wait longer for complete propagation
3. Check different locations:
   ```bash
   # From different network/ISP
   dig example.com NS
   # Or use online checker: whatsmydns.net
   ```
4. Clear local DNS cache (if needed):
   - macOS: `sudo dscacheutil -flushcache`
   - Linux: `sudo systemctl restart systemd-resolved`
   - Windows: `ipconfig /flushdns`

---

### Issue: Cannot Create Zone (Domain Error)

**Symptoms**:
- Error: "Domain already exists"
- Error: "Invalid domain format"
- Cannot submit form

**Solutions**:
1. Verify domain name:
   - Must be registered domain
   - No trailing dot (Volterra adds it)
   - Lowercase alphanumeric + hyphens
   - Examples: "example.com" ✓, "my-domain.co.uk" ✓

2. Check for typos:
   - "exemple.com" vs "example.com" (common typo)
   - Verify with registrar

3. If "already exists":
   - Zone may already be in console
   - Check DNS Zones list
   - Delete if mistaken, recreate

4. Try with different namespace:
   - Each namespace can have each domain
   - Use correct namespace for your setup

---

### Issue: Registrar Won't Accept Nameservers

**Symptoms**:
- Registrar control panel rejects nameservers
- Error: "Invalid nameserver"
- "Nameserver not responding"

**Solutions**:
1. Verify Volterra nameservers exactly:
   - From F5 XC console zone details
   - Copy-paste to avoid typos
   - Check for trailing dot (usually not needed at registrar)

2. Some registrars require validation:
   - May do initial check on nameservers
   - Volterra nameservers will be reachable once zone exists
   - Try again if initial rejection

3. Contact registrar support if problem persists:
   - Provide exact Volterra nameserver names
   - May need whitelist update

---

## Next Steps

After successfully creating DNS zone:

1. **Update Domain Registrar**: Configure nameservers (completed in Step 8)
2. **Wait for Propagation**: 24-48 hours (Step 9)
3. **Create DNS Records**: Add A, AAAA, CNAME records
4. **Create DNS Load Balancer**: Enable multi-region routing
   - See workflow: `dns-loadbalancer-create-geolocation.md`
5. **Monitor DNS**: Watch query statistics and health

---

## Monitoring DNS Zone

### View Zone Status

```
Navigate to: Multi-Cloud Network Connect > DNS > Zones > example.com
View:
  - Status: ACTIVE
  - Nameservers: 4 Volterra nameservers
  - Zone SOA record
  - Last updated timestamp
```

### Monitor DNS Queries

```
Navigate to: Multi-Cloud Network Connect > DNS > Zones > example.com > Metrics
View:
  - Queries per second (QPS)
  - Geographic distribution
  - Query types (A, AAAA, MX, CNAME, etc.)
  - Response times
  - DNSSEC stats (if enabled)
```

### View DNS Records

```
Navigate to: Multi-Cloud Network Connect > DNS > Zones > example.com > Records
View:
  - All DNS records in zone
  - Record type, name, value, TTL
  - Last modified
```

---

## Understanding DNS Delegation

### How DNS Works with Volterra

1. **Domain Registrar**: Stores 4 Volterra nameserver IPs
2. **Recursive Resolver**: User's ISP/browser queries registrar
3. **Registrar Response**: "Go ask Volterra nameservers"
4. **Volterra Nameserver**: Responds with zone records
5. **End Result**: Browser gets IP from Volterra DNS

### What Happens If Zone Deleted

- If zone is deleted in F5 XC console:
  - But registrar still points to Volterra nameservers
  - Queries will fail (SERVFAIL)
  - Must recreate zone or change registrar nameservers

### Multiple Zones (Subdomains)

- Each zone is independent
- Can have example.com and api.example.com as separate zones
- Or api.example.com can be CNAME in example.com zone
- Choose based on management needs

---

## Cost Considerations

### DNS Zone Charges

F5 Distributed Cloud DNS pricing:

1. **Zone Hosting**: Per zone per month
   - Standard: ~$5-10/month per zone
   - May be included with other services

2. **Query Volume**: Based on monthly queries
   - Standard: Included up to certain volume
   - Overage: ~$0.02-0.05 per million queries

3. **DNSSEC** (if enabled):
   - Additional fee for DNSSEC signing
   - ~$2-3/month

**Total Estimated**: ~$5-10/month for basic zone

### Cost Optimization

1. Use standard TTL (3600)
   - Higher TTL = fewer queries, lower cost
   - Lower TTL = more queries, higher cost
   - Balance based on update frequency

2. Consolidate zones:
   - Fewer zones = lower hosting costs
   - Can use subdomains within zone

3. Monitor query volume:
   - May indicate misconfiguration
   - Excessive queries increase costs

---

## Rollback

To delete the DNS zone:

1. Navigate to DNS Zones list
2. Click menu next to zone name
3. Select "Delete"
4. Confirm deletion
5. Zone is removed from Volterra
6. **Important**: Change registrar nameservers back
   - Otherwise queries to domain will fail
   - DNS will be unavailable

---

## Related Documentation

- **DNS Zone Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/dns-zone
- **DNS Delegation**: https://docs.cloud.f5.com/docs-v2/how-to/dns-management/dns-delegation
- **Nameserver Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/dns-management/nameserver-setup
- **DNS Records**: https://docs.cloud.f5.com/docs-v2/how-to/dns-management/dns-records
- **DNSSEC**: https://docs.cloud.f5.com/docs-v2/how-to/dns-management/dnssec-configuration

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24

