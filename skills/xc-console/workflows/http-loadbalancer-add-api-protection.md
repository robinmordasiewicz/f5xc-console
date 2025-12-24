---
title: Workflow - Add API Protection to HTTP Load Balancer
description: Attach API protection policy to HTTP load balancer for API-specific threat detection
version: 1.0.0
last_updated: 2025-12-24
category: Security
complexity: Intermediate
estimated_duration: 15-20 minutes
---

# Workflow: Add API Protection to HTTP Load Balancer

## Overview
Attach API protection policy to HTTP load balancer to detect and block API-specific attacks: schema violations, authentication bypass attempts, suspicious patterns, and malicious payloads targeting APIs. Complements WAF with API-focused threat detection.

## Prerequisites
- ✅ HTTP load balancer already created and active
- ✅ API endpoints documented (paths, methods, expected payloads)
- ✅ API traffic analysis performed (request patterns understood)
- ✅ Access to API documentation or OpenAPI/Swagger spec (optional but recommended)
- ✅ Understanding of API threat vectors

## Input Parameters

```json
{
  "http_loadbalancer_name": "my-api-lb",
  "namespace": "production",
  "api_protection_policy_name": "default-api-protection",
  "api_protection_mode": "monitoring",
  "threat_types": {
    "schema_violation": true,
    "authentication_bypass": true,
    "injection_attacks": true,
    "malicious_payload": true,
    "suspicious_patterns": true
  },
  "api_endpoints": [
    {
      "path": "/api/v1/users/*",
      "methods": ["GET", "POST", "PUT", "DELETE"],
      "protection_level": "high"
    },
    {
      "path": "/api/v1/public/*",
      "methods": ["GET"],
      "protection_level": "standard"
    }
  ]
}
```

## Step-by-Step Execution

### Step 1: Navigate to HTTP Load Balancer

**Console Path**: Web App & API Protection > Manage > HTTP Load Balancers

**Details**:
- Click "Web App & API Protection" in left sidebar
- Click "Manage" submenu
- Click "HTTP Load Balancers"
- Find and click on "my-api-lb" in the list

**Verify**: HTTP load balancer details page displayed

---

### Step 2: Click Edit Button

**Details**:
- Look for "Edit" button (usually top right)
- Click to open edit form
- Form should load HTTP LB configuration

**Verify**: Edit form displayed and loading

---

### Step 3: Navigate to API Protection Section

**Details**:

1. Look for **Security** section in the edit form
2. Expand or click on **API Protection** subsection
3. Should see options:
   - Enable API Protection (checkbox)
   - API Protection Policy (dropdown)
   - Protection Mode (Monitoring vs Blocking)

**Verify**: API Protection section visible and accessible

---

### Step 4: Enable API Protection

**Details**:

1. Check the **"Enable API Protection"** checkbox
2. Should activate and reveal additional options:
   - API Protection Policy dropdown
   - Protection mode selection
   - Advanced settings (optional)

3. If API specification (OpenAPI/Swagger) available:
   - Look for **"Import API Specification"** option
   - Upload spec file if available
   - Enables schema-based protection (higher accuracy)

**Verify**: API Protection enabled, additional options available

---

### Step 5: Select API Protection Policy

**Details**:

1. Click **"API Protection Policy"** dropdown
2. Options:
   - "default-api-protection" (recommended, general APIs)
   - "rest-api-protection" (for REST APIs)
   - "graphql-api-protection" (for GraphQL APIs)
   - Any custom policies created previously
   - "Create New Policy" (if needed)

3. For REST APIs, select **"default-api-protection"**
4. For GraphQL APIs, select **"graphql-api-protection"**

**Policy includes**:
- Schema validation (if spec provided)
- Authentication bypass detection
- Injection attack detection (API-specific)
- Malicious payload detection
- Suspicious pattern detection

**Verify**: API Protection Policy selected appropriately

---

### Step 6: Set Protection Mode

**Details**:

1. Look for **Protection Mode** or **API Protection Mode** dropdown
2. Options:
   - **Monitoring**: Log suspicious API requests, don't block
   - **Blocking**: Actively block detected API threats

3. For initial deployment, select **"Monitoring"**
   - Allows observation without impacting legitimate API clients
   - Establish baseline of API usage patterns
   - Run for 1-3 days, then escalate if appropriate

**Verify**: Protection Mode set to "Monitoring"

---

### Step 7: Configure API Endpoints (Optional)

**Details** (if policy supports endpoint-specific settings):

1. Look for **API Endpoints** or **Protected Paths** section
2. May show:
   - List of detected API endpoints
   - Option to add/remove endpoints
   - Protection levels per endpoint

3. Review detected endpoints:
   - `/api/v1/users/*` - Should be high protection (user data)
   - `/api/v1/products/*` - Medium/Standard protection
   - `/api/v1/public/*` - Standard protection (public API)

4. Adjust protection levels:
   - **High**: User auth, payment, admin endpoints
   - **Standard**: Public data, read-only endpoints
   - **Permissive**: Webhooks, batch operations (if needed)

**Verify**: Endpoints reviewed and protection levels set

---

### Step 8: Review Threat Detection Settings

**Details** (optional, recommended):

Verify threat types being detected:

1. **Schema Violation**
   - Detects requests not matching API spec
   - Recommended: Enabled
   - Blocks: Malformed requests, unexpected fields

2. **Authentication Bypass**
   - Detects attempts to bypass auth (missing tokens, fake tokens)
   - Recommended: Enabled
   - Blocks: Unauthenticated API access attempts

3. **Injection Attacks**
   - API-specific SQL, command, template injection
   - Recommended: Enabled
   - Blocks: Malicious code in API parameters

4. **Malicious Payload**
   - Large payloads, suspicious content in requests
   - Recommended: Enabled
   - Blocks: Buffer overflow, zip bomb style attacks

5. **Suspicious Patterns**
   - Unusual request patterns (rapid requests, probing, etc.)
   - Recommended: Enabled (in Monitoring for initial)
   - Blocks: Automated attacks, reconnaissance

**Verify**: Threat detection types reviewed and enabled

---

### Step 9: Review and Save

**Details**:

1. Scroll through form to verify:
   - API Protection: Enabled ✓
   - Policy: Selected (default-api-protection or appropriate) ✓
   - Mode: "Monitoring" selected ✓
   - Endpoints configured (if applicable) ✓
   - Threat types enabled ✓

2. Look for **"Save and Exit"** or **"Save"** button
3. Click to save changes
4. Should redirect to HTTP LB list page

**Expected**: HTTP LB updated with API protection enabled

---

### Step 10: Verify API Protection Active

**Details**:

1. Back on HTTP LB list, find "my-api-lb"
2. Click on it to view details
3. Look for **API Protection** section
4. Verify:
   - Status: "Enabled" ✓
   - Mode: "Monitoring" ✓
   - Policy: Selected policy name ✓

**Verify**: API Protection settings confirmed

---

### Step 11: Monitor API Protection Events

**Console Path**: Security > Events

**Details**:

1. Navigate to Security > Events
2. Filter by:
   - **Type**: "API Protection" or "API Threat"
   - **Policy**: "my-api-lb"
   - **Date**: Last 24 hours

3. Review events:
   - Detected threat count
   - Threat types (injection, auth bypass, schema violation, etc.)
   - API endpoints affected
   - Actions taken (monitored, would have blocked, etc.)

4. In **Monitoring mode**:
   - Events show detected threats
   - No requests actually blocked
   - Allows assessment without impact

**Analyze**:
- Are threat detections reasonable?
- False positive rate acceptable? (< 5%)
- Detecting real API threats?
- Which endpoints have most events?

**Verify**: API threat events visible and reasonable

---

### Step 12: Test API with Benign and Malicious Requests

**Details**:

Test to verify API protection is working:

```bash
# Legitimate API request (should not trigger threat)
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://my-api.example.com/api/v1/users/123"

# Expected: Returns 200 OK with user data
# Should NOT appear in API Protection events


# Test 1: Missing Authentication (should trigger)
curl -X GET \
  -H "Content-Type: application/json" \
  "https://my-api.example.com/api/v1/users/123"

# Expected: Returns 401 Unauthorized (or blocked)
# SHOULD appear in API Protection events as "auth bypass attempt"


# Test 2: SQL Injection in parameter (should trigger)
curl -X GET \
  -H "Authorization: Bearer $TOKEN" \
  "https://my-api.example.com/api/v1/users/123'%20OR%20'1'%3D'1"

# Expected: Returns error or blocked
# SHOULD appear in API Protection events as "injection attack"


# Test 3: Oversized payload (should trigger)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(python -c 'print(\"a\" * 10000000)')" \
  "https://my-api.example.com/api/v1/data"

# Expected: Request rejected or blocked
# SHOULD appear in API Protection events as "malicious payload"
```

**Results Assessment**:
- Legitimate requests: ✓ Allowed without false positives
- Attack attempts: ✓ Detected in monitoring mode (not blocked yet)
- Accuracy: Acceptable for escalation?

**Verify**: API protection detecting threats appropriately

---

### Step 13: Analyze False Positive Rate

**Details**:

1. Review API events from step 11
2. Count total threats detected: X
3. Count which are likely false positives: Y
4. Calculate: FP% = Y/X

**Assessment**:
- **< 2%**: Excellent, ready to escalate to Blocking
- **2-5%**: Good, but consider more monitoring
- **5-10%**: Moderate, create exclusions before Blocking
- **> 10%**: High, need tuning before Blocking

**Common False Positives**:
- Large but legitimate requests (batch operations)
- Valid requests that don't match schema perfectly
- Legitimate tools (Postman, API testing frameworks)
- Bulk operations with many parameters

**Decision**:
- FP% < 2% → Ready for Blocking
- 2-5% → Create exclusions, monitor longer
- > 5% → Adjust settings, more monitoring needed

**Verify**: False positive rate acceptable

---

### Step 14: Escalate to Blocking Mode (Optional)

**Details** (only if FP% < 2% and monitoring_days ≥ 1):

1. Edit HTTP load balancer again
2. Find API Protection section
3. Change **Protection Mode** from "Monitoring" to "Blocking"
4. Verify:
   - Policy appropriate ✓
   - Endpoints configured correctly ✓
   - API team notified ✓
   - Rollback plan ready ✓

5. Save changes
6. Deployment takes 10-30 seconds

**Warning**: Starts blocking detected API threats. Only do if confident.

**Verify**: Mode changed to "Blocking" (if proceeding)

---

## Validation with CLI

**Command**: Verify API protection configuration

```bash
# Get HTTP LB with API protection details
xcsh configuration get http_loadbalancer my-api-lb -n production

# Expected output:
# - Name: my-api-lb
# - API Protection: Enabled
# - Mode: Monitoring (or Blocking)
# - Policy: api-protection-policy-name

# Get API protection events
xcsh security events list --http-lb my-api-lb -n production --filter api_protection

# Expected output:
# API threat events with timestamps, types, endpoint, actions
```

---

## Success Criteria

- [x] API protection enabled on HTTP LB
- [x] API protection policy selected and configured
- [x] Protection mode set to "Monitoring" initially
- [x] API endpoints configured (if needed)
- [x] Threat detection types enabled
- [x] API threat detection events visible
- [x] False positive rate < 5% (ideally < 2%)
- [x] Mode escalated to Blocking (when ready)

---

## Common Issues & Troubleshooting

### Issue: No API Threats Detected (False Negatives)

**Symptoms**:
- Event count very low or zero
- Not detecting obvious API attacks
- API protection seems inactive

**Solutions**:
1. **Verify protection is enabled**:
   - Edit HTTP LB
   - Check API Protection checkbox is checked
   - Verify policy is selected (not greyed out)

2. **Check threat detection is active**:
   - Verify all threat types are enabled
   - Test with obvious attack (see Step 12)
   - Check that test attacks are creating events

3. **Verify API traffic is flowing through**:
   - Check HTTP LB is receiving traffic
   - Review HTTP LB metrics
   - Ensure API endpoints are being hit

4. **Check policy configuration**:
   - If custom policy, verify it has rules defined
   - Default policies should be pre-configured
   - May need to import API spec for schema-based detection

5. **Review protection mode**:
   - If "Monitoring", threats should appear in events
   - If "Blocking", fewer events as requests blocked earlier

---

### Issue: High False Positive Rate

**Symptoms**:
- Many legitimate API requests triggering threats
- Legitimate clients blocked after escalation
- Cannot escalate to Blocking mode safely

**Solutions**:
1. **Analyze false positive patterns**:
   - Review events in detail
   - Which endpoints have most FP?
   - What characteristics trigger them?
   - Legitimate tools or clients affected?

2. **Create endpoint-specific policies**:
   - Public APIs may need lower protection
   - Batch operations may need payload size exclusions
   - Internal tools may need to be allowlisted

3. **Adjust threat sensitivity**:
   - Reduce "suspicious patterns" sensitivity
   - If malicious payload is too aggressive, adjust payload rules
   - Keep authentication bypass and injection at high

4. **Add to allowlist** (if available):
   - Legitimate tools that look suspicious
   - Internal IP ranges
   - Known good bot traffic

5. **Use Monitoring longer**:
   - 1-3 days may be insufficient
   - Try 5-7 days to understand full traffic
   - Include weekend patterns for complete picture

---

### Issue: API Clients Broken After Blocking Escalation

**Symptoms**:
- Legitimate API client requests start failing
- 403 Forbidden or blocked responses
- Applications using API start erroring

**Solutions**:
1. **Switch back to Monitoring immediately**:
   - Edit HTTP LB
   - Set API Protection Mode back to "Monitoring"
   - No more blocks while investigating

2. **Identify broken client pattern**:
   - Check API events for blocks
   - What characteristics trigger blocks?
   - Is it user agent, request pattern, payload format?

3. **Create exclusion for legitimate client**:
   - If possible, identify client type
   - Create allowlist entry for that client
   - Example: Postman user agent, internal tools

4. **Adjust threat rules**:
   - May need to disable overly aggressive threat type
   - Example: "Malicious payload" blocking legitimate large requests
   - Example: "Schema violation" being too strict

5. **Re-enable Blocking**:
   - After adjusting rules
   - Test with broken client again
   - Escalate to Blocking once confirmed working

---

### Issue: Performance Impact

**Symptoms**:
- Higher latency after enabling API protection
- Slower response times for API calls
- Increased CPU/memory usage

**Solutions**:
1. **Verify API protection is causing impact**:
   - Disable API protection temporarily
   - Check if latency returns to normal
   - If yes, API protection is the cause

2. **Review event volume**:
   - High threat event rate = high processing
   - Review if events are legitimate detections
   - May need to fine-tune threat detection

3. **Optimize protection settings**:
   - Disable less critical threat types
   - Disable schema validation (if using spec)
   - Use simpler, faster policies

4. **Scale infrastructure**:
   - May need more resources for API protection
   - Consider dedicated protection nodes
   - Contact F5 about capacity planning

---

## Best Practices

### 1. Start with Monitoring
```
❌ Bad: Enable Blocking immediately
✅ Good: Monitoring for 1-3 days
✅ Better: Monitoring for 5-7 days, include full traffic patterns
```

### 2. Use API Specifications
```
❌ Bad: No specification, generic protection only
✅ Good: Optional OpenAPI/Swagger spec improves detection
✅ Better: Keep spec up-to-date with actual API
```

### 3. Document API Endpoints
```
✅ Good: Maintain list of API endpoints
✅ Better: Document expected payloads and formats
✅ Excellent: Use OpenAPI/Swagger for documentation + protection
```

### 4. Coordinate with API Team
```
✅ Good: Notify before enabling
✅ Better: Daily syncs during Monitoring period
✅ Excellent: Joint decision before escalating
```

---

## Next Steps

After successfully deploying API protection:

1. **Continue Monitoring**: Daily reviews for first week
2. **Analyze Patterns**: Understand legitimate vs attack traffic
3. **Create Exclusions**: For false positive patterns
4. **Layer Additional Security**:
   - Bot Defense (detect API scrapers)
   - Rate Limiting (prevent API abuse)
   - WAF (for general web attacks)
5. **Set Up Monitoring**: Alerts for unusual API patterns
6. **Regular Audits**: Monthly review of API threats

---

## Related Documentation

- **API Protection Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/api-protection
- **API Protection Policies**: https://docs.cloud.f5.com/docs-v2/how-to/security/api-protection-policy
- **API Threat Detection**: https://docs.cloud.f5.com/docs-v2/how-to/security/api-threat-detection
- **OpenAPI Integration**: https://docs.cloud.f5.com/docs-v2/how-to/security/api-openapi-integration
- **API Event Analysis**: https://docs.cloud.f5.com/docs-v2/how-to/security/api-event-analysis
- **Advanced API Protection**: https://docs.cloud.f5.com/docs-v2/how-to/security/api-protection-advanced

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24
