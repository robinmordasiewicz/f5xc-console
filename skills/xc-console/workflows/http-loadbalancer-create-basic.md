---
title: Workflow - Create HTTP Load Balancer (Basic)
description: Create a basic HTTP/HTTPS load balancer with origin pool routing
version: 1.0.0
last_updated: 2025-12-24
category: Load Balancing
complexity: Beginner
estimated_duration: 5-10 minutes
---

# Workflow: Create HTTP Load Balancer (Basic)

## Overview
Create a basic HTTP load balancer that routes traffic from a domain to backend servers via an origin pool.

## Prerequisites
- ✅ Namespace exists (where LB will be created)
- ✅ Origin pool configured with healthy backend servers
- ✅ Domain name ready to use
- ✅ (Optional) TLS certificate uploaded if using manual HTTPS

## Input Parameters

```json
{
  "name": "my-app-lb",
  "namespace": "production",
  "domain": "app.example.com",
  "origin_pool": "backend-pool",
  "protocol": "https_auto_cert",
  "enable_caching": false,
  "enable_compression": false
}
```

## Step-by-Step Execution

### Step 1: Navigate to HTTP Load Balancers Page

**Console Path**: Web App & API Protection > Manage > HTTP Load Balancers

**Details**:
- Click "Web App & API Protection" in left sidebar
- Click "Manage" submenu
- Click "HTTP Load Balancers" link
- Should see list of existing HTTP LBs (may be empty)

**Verify**: Page title shows "HTTP Load Balancers"

---

### Step 2: Click Add HTTP Load Balancer Button

**Details**:
- Click "Add HTTP Load Balancer" button (usually top right)
- Should see creation form appear
- Form should have multiple tabs/sections

**Verify**: Blank HTTP LB creation form displayed

---

### Step 3: Fill Metadata Section

**Details**:
1. **Name field**: Enter "my-app-lb"
   - Field type: Text input
   - Constraints: lowercase alphanumeric + dashes only
   - Validation: Must be unique in namespace

2. **Namespace dropdown**: Select "production"
   - Field type: Select dropdown
   - Default: May pre-select your current namespace
   - Effect: Determines resource isolation

3. **Labels** (optional): Leave empty for now
   - Field type: Key-value input (optional)
   - Format: key1=value1, key2=value2

**Verify**:
- Name field populated with "my-app-lb"
- Namespace shows "production"

---

### Step 4: Fill Basic Configuration Section

**Details**:

1. **Domains field**:
   - Click "Add Domain" or similar
   - Enter: "app.example.com"
   - Field type: Text input (FQDN format)
   - Can add multiple domains

2. **Protocol selection**:
   - Look for radio buttons or dropdown
   - Select: "HTTPS with Automatic Certificate"
   - This uses ACME (Let's Encrypt) automatically
   - Alternative: "HTTP" for non-HTTPS (not recommended for production)

3. **Origin Pool selection**:
   - Click dropdown labeled "Default Origin Pool" or similar
   - Select: "backend-pool"
   - Field type: Dropdown select
   - Pool must exist and be healthy

4. **Port** (usually auto-filled):
   - HTTP: 80
   - HTTPS: 443
   - Usually pre-filled, no action needed

**Verify**:
- Domain shows "app.example.com"
- Protocol shows "HTTPS with Automatic Certificate"
- Origin Pool shows "backend-pool"

---

### Step 5: Review Optional Settings

**Details** (these can be left default):

1. **Caching**: Leave unchecked (default)
2. **Compression**: Leave unchecked (default)
3. **Security Policies**: None selected (default)
4. **Rate Limiting**: Not configured (optional)

**For now**: Leave all optional settings as default

---

### Step 6: Submit Form

**Details**:
- Scroll to bottom of form
- Click "Save and Exit" or "Create" button
- Form should close and redirect to list page

**Expected**: Page redirects to HTTP Load Balancers list

---

### Step 7: Verify Creation Success

**Details**:
1. Check list page for new LB
   - Look for "my-app-lb" in the list
   - Status should show "ACTIVE" or "Ready"
   - Timestamp should be recent (just now)

2. Click on the LB name to view details
   - Verify name, domain, origin pool correct
   - Check status indicator

3. Look for any error messages
   - If ERROR status: See "Error Details" section below

**Verify**:
- LB appears in list with "ACTIVE" status
- All configured details are correct

---

## Validation with CLI

**Command**: Verify resource creation with xcsh CLI

```bash
# List all HTTP load balancers in namespace
xcsh load_balancer list http_loadbalancer -n production

# Get specific HTTP load balancer details
xcsh load_balancer get http_loadbalancer my-app-lb -n production

# Expected output includes:
# - Name: my-app-lb
# - Namespace: production
# - Domain: app.example.com
# - Origin Pool: backend-pool
# - Protocol: HTTPS
# - Status: ACTIVE
```

---

## Success Criteria

- [x] HTTP LB appears in console list
- [x] Status shows "ACTIVE" or "Ready"
- [x] Domain correctly configured
- [x] Origin pool correctly referenced
- [x] CLI query returns resource with correct properties
- [x] Certificate provisioning started (may take 2-5 minutes)

---

## Testing the Load Balancer

### DNS Resolution Test
```bash
# Wait 1-2 minutes for DNS propagation
nslookup app.example.com

# Should return IP addresses pointing to Volterra edge
```

### HTTPS Connectivity Test
```bash
# Test HTTPS connection
curl -I https://app.example.com/

# Expected: HTTP 200 or application response
# Certificate should be valid (issued by Let's Encrypt)
```

### Origin Pool Routing Test
```bash
# Make actual request to application
curl https://app.example.com/health

# Should route to origin pool and return response from backend
```

---

## Common Issues & Troubleshooting

### Issue: LB Stuck in "Creating" Status

**Symptoms**:
- Status shows "Creating" for more than 5 minutes
- DNS not resolving

**Solutions**:
1. Verify origin pool exists: `xcsh load_balancer list origin_pool -n production`
2. Verify origin pool is HEALTHY: Check console details
3. Wait up to 10 minutes for creation to complete
4. If still stuck: Delete and recreate

---

### Issue: Certificate Provisioning Failed

**Symptoms**:
- Status shows ERROR
- Certificate still not provisioned after 10 minutes

**Solutions**:
1. Verify domain is valid and publicly resolvable
2. Verify DNS is not blocking ACME validation
3. Try manual certificate instead:
   - Delete current LB
   - Create new LB with "HTTPS with Manual Certificate"
   - Upload your own certificate

---

### Issue: Origin Pool Shows Unhealthy

**Symptoms**:
- LB created but origin pool shows unhealthy
- Traffic doesn't reach backends

**Solutions**:
1. SSH to backend server and verify health check endpoint:
   ```bash
   curl http://localhost:80/health
   # Should return HTTP 200
   ```
2. Verify health check configuration in origin pool
3. Check firewall allows traffic from F5 XC to backend
4. Review origin pool details for error messages

---

## Next Steps

After successful creation, you can:

1. **Add WAF Protection**: See workflow `http-loadbalancer-add-waf.md`
2. **Add Bot Defense**: Edit LB > Security Policies > Select Bot Defense policy
3. **Monitor Traffic**: View metrics and logs in LB details page
4. **Create DNS Load Balancer**: For multi-region routing (if deploying across regions)

---

## Related Documentation

- **Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/http-loadbalancer
- **How-To**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/http-load-balancer
- **HTTPS Setup**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/http-lb-https
- **ACME Certificates**: https://docs.cloud.f5.com/docs-v2/how-to/certificates/acme

---

## Rollback

If you need to delete the LB:

1. Navigate to HTTP Load Balancers list
2. Click three-dot menu next to LB name
3. Select "Delete"
4. Confirm deletion
5. Verify with CLI: `xcsh load_balancer list http_loadbalancer -n production` should not return the LB

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24

