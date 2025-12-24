---
title: Workflow - Create Service Policy
description: Create service policies for advanced traffic management, routing rules, and traffic control
version: 1.0.0
last_updated: 2025-12-24
category: Traffic Management
complexity: Advanced
estimated_duration: 25-30 minutes
---

# Workflow: Create Service Policy

## Overview
Create service policies to define advanced traffic management rules, routing decisions, and traffic control. Service policies enable conditional routing, request rewriting, header manipulation, and complex traffic steering beyond basic load balancing.

## Prerequisites
- ✅ Namespaces created
- ✅ Origin pools configured (for routing destinations)
- ✅ HTTP load balancers created (if attaching policy)
- ✅ Understanding of routing requirements
- ✅ Clear definition of traffic control rules needed

## Input Parameters

```json
{
  "service_policy_name": "advanced-routing",
  "namespace": "production",
  "rules": [
    {
      "name": "route-api-v2",
      "priority": 100,
      "condition": {
        "type": "path",
        "match": "/api/v2/*",
        "operator": "prefix"
      },
      "action": {
        "type": "route",
        "target_pool": "api-v2-pool",
        "rewrite_path": "/api/*"
      }
    },
    {
      "name": "route-admin",
      "priority": 90,
      "condition": {
        "type": "header",
        "header_name": "X-Admin-Token",
        "operator": "exists"
      },
      "action": {
        "type": "route",
        "target_pool": "admin-pool"
      }
    },
    {
      "name": "redirect-http-to-https",
      "priority": 10,
      "condition": {
        "type": "protocol",
        "value": "http"
      },
      "action": {
        "type": "redirect",
        "location": "https://${host}${path}"
      }
    }
  ]
}
```

## Step-by-Step Execution

### Step 1: Navigate to Service Policies

**Console Path**: Distributed Apps > Service Policies OR Network > Service Policies

**Details**:
- Click "Distributed Apps" in left sidebar (or "Network")
- Click "Service Policies" submenu
- Should see list of existing service policies

**Verify**: Service Policies page displayed

---

### Step 2: Click Add Service Policy Button

**Details**:
- Click "Add Service Policy" button (usually top right)
- Should open service policy creation form
- Form has multiple sections: metadata, rules, conditions, actions

**Verify**: Service policy creation form displayed

---

### Step 3: Fill Metadata Section

**Details**:

1. **Name**: Enter "advanced-routing"
   - Descriptive policy name
   - Format: lowercase + hyphens

2. **Namespace**: Select "production"
   - Where policy is deployed

3. **Description** (optional):
   - "Route API v2 requests to specific pool, admin requests to admin pool"
   - Helpful for documentation

**Verify**: Metadata filled

---

### Step 4: Add First Rule - Path-Based Routing

**Details**:

1. Look for **Rules** section
2. Click **"Add Rule"** button
3. Fill in rule details:

   **Rule Name**: "route-api-v2"
   **Priority**: "100" (higher = evaluated first)

4. **Condition**:
   - **Condition Type**: "Path" or "URI Path"
   - **Path Pattern**: "/api/v2/*"
   - **Operator**: "Prefix Match" (matches /api/v2/anything)
   - Purpose: Match requests to /api/v2/

5. **Action**:
   - **Action Type**: "Route"
   - **Target Pool**: Select "api-v2-pool"
   - This pool handles API v2 requests

6. **Optional: Path Rewrite**:
   - **Rewrite Path**: "/api/*"
   - Removes /api/v2 prefix before sending to backend
   - Backend receives /api/xxxx instead of /api/v2/xxxx

**Example**:
```
Client request: GET /api/v2/users
Matched rule: route-api-v2
Path rewrite: /api/v2/* → /api/*
Backend receives: GET /api/users
Backend pool: api-v2-pool
```

**Verify**: Path-based routing rule added

---

### Step 5: Add Second Rule - Header-Based Routing

**Details** (demonstrates conditional routing):

1. Click **"Add Rule"** again
2. Fill in rule details:

   **Rule Name**: "route-admin"
   **Priority**: "90" (lower priority than v2 routing)

3. **Condition**:
   - **Condition Type**: "Header"
   - **Header Name**: "X-Admin-Token"
   - **Operator**: "Exists" (header must be present)
   - Purpose: Route if admin header present

4. **Action**:
   - **Action Type**: "Route"
   - **Target Pool**: Select "admin-pool"
   - Admin requests go to special pool

**Example**:
```
Client request: GET /api/users
Header: X-Admin-Token: secret123
Matched rule: route-admin (has admin header)
Backend receives: Same request
Backend pool: admin-pool (special admin handling)
```

**Verify**: Header-based routing rule added

---

### Step 6: Add Third Rule - Protocol Redirect (HTTP → HTTPS)

**Details**:

1. Click **"Add Rule"** again
2. Fill in rule details:

   **Rule Name**: "redirect-http-to-https"
   **Priority**: "10" (lowest priority, evaluated last)

3. **Condition**:
   - **Condition Type**: "Protocol"
   - **Protocol Value**: "HTTP"
   - **Operator**: "Equals"
   - Purpose: Match HTTP (not HTTPS) requests

4. **Action**:
   - **Action Type**: "Redirect"
   - **Location**: "https://${host}${path}"
   - Redirects to same domain/path but HTTPS

**Variables**:
- `${host}`: Original domain (example.com)
- `${path}`: Original path (/api/users)
- `${port}`: Original port (usually omitted for HTTPS)

**Example**:
```
Client request: GET http://example.com/api/users
Matched rule: redirect-http-to-https
Response: 301 Moved Permanently
Location: https://example.com/api/users
Client follows redirect
```

**Verify**: HTTP→HTTPS redirect rule added

---

### Step 7: Verify Rule Priority

**Details** (critical for correct evaluation):

Rules are evaluated in **priority order** (highest priority first):

```
Priority 100: route-api-v2        ← Checked first
Priority 90:  route-admin         ← Checked second
Priority 10:  redirect-http-to-https ← Checked last
```

**Evaluation logic**:
1. Check priority 100: Is path /api/v2/*? → YES → Use api-v2-pool
2. If not matched, check priority 90: Has X-Admin-Token? → Maybe → Use admin-pool
3. If not matched, check priority 10: Is protocol HTTP? → Maybe → Redirect to HTTPS
4. If no rule matched: Use default behavior (usually load balancer default)

**Important**:
- First matching rule wins (others ignored)
- Priority matters!
- Set priorities carefully

**Verify**: Priorities correct (100, 90, 10)

---

### Step 8: Add Default Action (Optional)

**Details** (optional, for unmatched requests):

1. Look for **Default Action** or **Catch-All Rule**
2. Options:
   - Route to default pool
   - Return 404 error
   - Continue to load balancer defaults

3. Recommended: Leave empty (use load balancer defaults)
   - Simpler to manage
   - Explicit rules handle cases you care about

**Verify**: Default action set (or left empty)

---

### Step 9: Review All Rules

**Details**:

Review the complete rule set:

```
Rule 1: route-api-v2
├─ Condition: Path = /api/v2/*
├─ Action: Route to api-v2-pool
└─ Rewrite: /api/v2/* → /api/*

Rule 2: route-admin
├─ Condition: Header X-Admin-Token exists
├─ Action: Route to admin-pool
└─ No rewrite

Rule 3: redirect-http-to-https
├─ Condition: Protocol = HTTP
├─ Action: Redirect to https://${host}${path}
└─ No target pool

Default: (Use load balancer defaults)
```

**Verify**: All rules visible and correct

---

### Step 10: Save Service Policy

**Details**:

1. Look for **"Save and Exit"** or **"Create"** button
2. Click to save policy
3. Should redirect to service policy list

**Expected**: Service policy created successfully

---

### Step 11: Verify Policy Creation

**Details**:

1. Find "advanced-routing" in service policy list
2. Click to view details
3. Verify all 3 rules visible:
   - route-api-v2 ✓
   - route-admin ✓
   - redirect-http-to-https ✓

**Verify**: Policy details correct

---

### Step 12: Attach Policy to HTTP Load Balancer

**Details** (to apply service policy):

1. Navigate to HTTP Load Balancers
2. Edit target HTTP LB
3. Look for **Service Policy** section
4. Select **"advanced-routing"**
5. Save changes

**After attachment**:
- Requests to HTTP LB follow service policy rules
- Routing decisions made based on rule conditions
- Rules evaluated in priority order

**Verify**: Service policy attached

---

### Step 13: Test Service Policy Rules

**Details**:

**Test 1: Path-based routing to /api/v2/**
```bash
curl -v http://example.com/api/v2/users

Expected:
- Matches rule: route-api-v2 (priority 100)
- Routes to: api-v2-pool
- Path rewritten: /api/v2/users → /api/users
- Backend pool handles request
```

**Test 2: Admin header-based routing**
```bash
curl -v http://example.com/api/users \
  -H "X-Admin-Token: secret123"

Expected:
- Matches rule: route-admin (priority 90)
- Routes to: admin-pool
- No path rewrite
- Admin pool handles request
```

**Test 3: HTTP redirect to HTTPS**
```bash
curl -v http://example.com/api/users

Expected:
- Matches rule: redirect-http-to-https (priority 10)
- HTTP response: 301 Moved Permanently
- Location header: https://example.com/api/users
- Client redirects to HTTPS
```

**Test 4: Default routing** (no rule match)
```bash
curl -v https://example.com/other/path

Expected:
- No rule match (path not /api/v2/*, no admin header, protocol HTTPS)
- No rule matched
- Uses default load balancer behavior
- Routes to default pool
```

**Verify**: All rules working correctly

---

## Validation with CLI

**Command**: Verify service policy creation

```bash
# Get service policy details
xcsh configuration get service_policy advanced-routing -n production

# Expected output:
# - Name: advanced-routing
# - Rules: 3
#   - route-api-v2: path match → route to api-v2-pool
#   - route-admin: header match → route to admin-pool
#   - redirect-http-to-https: protocol match → redirect

# Verify policy attached to HTTP LB
xcsh configuration get http_loadbalancer my-app-lb -n production
# Should show: Service Policy: advanced-routing
```

---

## Success Criteria

- [x] Service policy created with multiple rules
- [x] Path-based routing rule configured
- [x] Header-based routing rule configured
- [x] Protocol redirect rule configured
- [x] Rules prioritized correctly (100, 90, 10)
- [x] Policy attached to HTTP load balancer
- [x] All rules tested and working
- [x] Default behavior defined

---

## Common Issues & Troubleshooting

### Issue: Rules Not Matching Expected Requests

**Symptoms**:
- Request not matched by any rule
- Uses default behavior instead
- Traffic routing wrong

**Solutions**:
1. **Verify condition syntax**:
   - Path: Is wildcard correct? (/api/v2/* vs /api/v2)
   - Header: Is header name exact? (case-sensitive)
   - Protocol: Is protocol value correct? (HTTP vs HTTPS)

2. **Check condition type**:
   - "Prefix Match" vs "Exact Match"
   - "Exists" vs "Equals" for headers
   - May be using wrong operator

3. **Test condition separately**:
   - Use curl to send test requests
   - Add logging to see if condition matches

4. **Review rule priority**:
   - Earlier rules may match first
   - If earlier rule matches, later rules not evaluated

---

### Issue: Wrong Pool Receiving Traffic

**Symptoms**:
- Traffic goes to wrong backend pool
- Requests end up in unexpected pool

**Solutions**:
1. **Verify target pool**:
   - Edit policy rule
   - Confirm target pool name correct
   - Pool must exist and be healthy

2. **Check rule priority**:
   - Multiple rules may match
   - First matching rule wins
   - Higher priority evaluated first

3. **Review conditions**:
   - May be matching different rule than expected
   - Test with curl to see which rule matches

4. **Add debug rule**:
   - Create test rule with high priority
   - Routes to known pool
   - Verify test rule matches if lower rule doesn't

---

### Issue: Redirect Not Working

**Symptoms**:
- HTTP requests not redirecting to HTTPS
- Still getting 200 OK instead of 301 redirect
- Requests staying on HTTP

**Solutions**:
1. **Verify redirect rule priority**:
   - HTTP→HTTPS rule should have lower priority
   - May be overridden by earlier rule
   - Check priority order

2. **Check redirect target**:
   - Location header should be HTTPS URL
   - Verify format: https://${host}${path}

3. **Verify condition matches HTTP**:
   - Protocol must equal "HTTP"
   - Not "http" (case sensitivity?)
   - Test with curl to confirm match

4. **Check for conflicting rules**:
   - Earlier rule may route HTTP requests
   - Preventing redirect rule evaluation
   - Reorder priorities if needed

---

### Issue: Header-Based Routing Not Working

**Symptoms**:
- Requests with specific header not routing correctly
- Always routes to default pool
- Header condition not matching

**Solutions**:
1. **Verify header name exact**:
   - Case-sensitive: X-Admin-Token vs x-admin-token
   - Must match exactly
   - Common mistake: Capitalization

2. **Check header operator**:
   - "Exists" for presence check
   - "Equals" for value match
   - "Contains" for substring match

3. **Verify header sent in request**:
   ```bash
   curl -H "X-Admin-Token: value" \
        -H "X-Other: value" \
        http://example.com/api
   ```
   - Use curl -v to see request headers
   - Confirm header actually sent

4. **Check if header removed**:
   - Earlier policies may remove headers
   - Check load balancer config
   - Verify header reaches service policy

---

## Advanced Service Policy Patterns

### Pattern 1: Canary Deployment
```
Rule 1: 5% of traffic to new-pool (priority 100)
  Condition: Random(0, 100) < 5
  Action: Route to new-pool

Rule 2: Default (priority 10)
  Condition: Always matches
  Action: Route to old-pool

Result: 5% canary, 95% stable
```

### Pattern 2: Geographic Routing
```
Rule 1: EU requests to EU pool (priority 100)
  Condition: GeoIP = Europe
  Action: Route to eu-pool

Rule 2: US requests to US pool (priority 90)
  Condition: GeoIP = US
  Action: Route to us-pool

Result: Geo-distributed routing
```

### Pattern 3: User-Based Routing
```
Rule 1: Premium users to fast pool (priority 100)
  Condition: Cookie premium_user=true
  Action: Route to premium-pool

Rule 2: Default pool (priority 10)
  Condition: Always matches
  Action: Route to standard-pool

Result: Different SLA for premium users
```

---

## Best Practices

### 1. Priority Management
```
❌ Bad: All rules same priority
✅ Good: Specific rules high priority, generic rules low
✅ Better: Clear priority scheme (100, 90, 80, etc.)
```

### 2. Condition Specificity
```
❌ Bad: Too broad conditions (match too much)
✅ Good: Specific conditions for each use case
✅ Better: Layered conditions (path AND header)
```

### 3. Action Clarity
```
✅ Good: Each rule routes to specific pool
✅ Better: Clear naming of pools and rules
✅ Excellent: Documented purpose of each rule
```

### 4. Testing
```
✅ Good: Test each rule individually
✅ Better: Test rule interactions
✅ Excellent: Test with realistic traffic patterns
```

---

## Next Steps

After creating service policy:

1. **Monitor Traffic**: Track routing decisions
2. **Fine-tune Rules**: Adjust conditions based on actual traffic
3. **Add More Rules**: Expand for additional routing needs
4. **Set Up Alerts**: Alert on unusual routing patterns
5. **Document Rules**: Create runbook for ops team

---

## Related Documentation

- **Service Policy Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/service-policy
- **Routing Rules**: https://docs.cloud.f5.com/docs-v2/how-to/network/service-policy-rules
- **Condition Types**: https://docs.cloud.f5.com/docs-v2/how-to/network/policy-conditions
- **Action Types**: https://docs.cloud.f5.com/docs-v2/how-to/network/policy-actions
- **Advanced Routing**: https://docs.cloud.f5.com/docs-v2/how-to/network/advanced-routing

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24
