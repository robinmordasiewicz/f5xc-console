---
title: Workflow - Create WAF Policy Exclusion Rule
description: Create exclusion rules to handle WAF false positives
version: 1.0.0
last_updated: 2025-12-24
category: Security
complexity: Intermediate
estimated_duration: 10-15 minutes
---

# Workflow: Create WAF Policy Exclusion Rule

## Overview
Create exclusion rules to prevent WAF policies from blocking legitimate traffic. After running a WAF policy in Monitoring mode (1-7 days), you'll identify false positives and create exclusions to allow legitimate requests while keeping attacks blocked.

## Prerequisites
- ✅ WAF policy already created (in Monitoring mode)
- ✅ WAF policy attached to HTTP load balancer
- ✅ WAF has been running for 1-3 days (minimum observation period)
- ✅ False positive identified in Security Events
- ✅ Attack signature name known (from event logs)

## Input Parameters

```json
{
  "waf_policy_name": "basic-waf",
  "namespace": "production",
  "exclusion_name": "exclude-api-json-payload",
  "exclusion_type": "uri_path|header|parameter|body",
  "match_criteria": {
    "uri_path": "/api/webhook",
    "method": "POST",
    "parameter": "payload"
  },
  "signature_names": [
    "SQL Injection - Generic",
    "Command Injection Detected"
  ],
  "reason": "Legitimate webhook payload triggers false positive"
}
```

## Step-by-Step Execution

### Step 1: Navigate to WAF Policy

**Console Path**: Security > App Protection > WAF Policies

**Details**:
- Click "Security" in left sidebar
- Click "App Protection" submenu
- Click "WAF Policies"
- Find and click on "basic-waf"

**Verify**: WAF Policy details page displayed

---

### Step 2: Click Edit Policy Button

**Details**:
- Click "Edit" button (usually top right)
- Should open WAF policy edit form
- Look for "Exclusions" or "Exceptions" section

**Verify**: WAF policy edit form displayed

---

### Step 3: Navigate to Exclusions Section

**Details**:

1. Look for "Exclusions", "Exceptions", or "Rules Exclusions" section
2. May be a tab or expandable section
3. Should show existing exclusions (if any)
4. Look for "Add Exclusion" or "Add Rule" button

**Verify**: Exclusions section visible with add button

---

### Step 4: Click Add Exclusion Button

**Details**:
- Click "Add Exclusion", "Add Exception", or similar button
- Should open exclusion creation form
- Form has fields for matching criteria and signatures

**Verify**: Exclusion form displayed

---

### Step 5: Name the Exclusion Rule

**Details**:

1. **Exclusion Name**: Enter "exclude-api-json-payload"
   - Descriptive name for the rule
   - Should indicate what's being excluded
   - Format: lowercase + hyphens

2. **Description** (if available):
   - "Allow webhook POST requests with JSON payload to /api/webhook"
   - Helpful for future reference

**Verify**:
- Exclusion Name: "exclude-api-json-payload"
- Description provided

---

### Step 6: Define Matching Criteria

**Details**:

These specify when the exclusion applies:

1. **URI Path** (optional):
   - Enter "/api/webhook"
   - Traffic to this path gets excluded
   - Can use wildcards: "/api/*"

2. **HTTP Method** (optional):
   - Select "POST"
   - "GET", "POST", "PUT", "DELETE", "PATCH"
   - Leave empty for all methods

3. **Headers** (optional):
   - Can specify header names (e.g., "Content-Type: application/json")
   - Helps narrow exclusion scope

4. **Parameters** (optional):
   - Parameter name: "payload"
   - Only exclude if this parameter present

5. **Body Content** (optional):
   - Pattern matching in request body
   - Leave empty unless very specific

**Important**: More specific = safer exclusion

**Verify**:
- URI Path: "/api/webhook" ✓
- Method: "POST" ✓
- Parameters: "payload" ✓

---

### Step 7: Select Signatures to Exclude

**Details**:

1. Look for "Signatures" or "Rules" selection area
2. Can be checkbox list or search
3. Select specific signatures causing false positives

Available options:
- **SQL Injection - Generic**
- **Command Injection Detected**
- **Cross-Site Scripting (XSS)**
- **Path Traversal**
- [Many more...]

For this example, select:
- ✓ SQL Injection - Generic
- ✓ Command Injection Detected

**Important**: Only exclude signatures causing false positives, not all signatures

**Alternative**: Can exclude "ALL RULES" if needed, but not recommended

**Verify**:
- Signatures selected: SQL Injection, Command Injection ✓
- Other signatures still protected ✓

---

### Step 8: Set Scope (Where Exclusion Applies)

**Details** (if available):

1. **Scope Options**:
   - "This endpoint only" (specific to /api/webhook)
   - "All endpoints" (global exclusion)
   - Recommended: Endpoint-specific (safer)

2. **Policy Application**:
   - "Monitoring" mode: Log the excluded signature (don't block)
   - "Blocking" mode: Skip these signatures entirely

**Verify**:
- Scope: Endpoint-specific ✓

---

### Step 9: Review and Save

**Details**:

1. Review exclusion:
   - Matches: URI /api/webhook, POST method, parameter "payload" ✓
   - Excludes: SQL Injection, Command Injection signatures ✓
   - Scope: This endpoint only ✓

2. Click "Save" or "Add Exclusion"
3. Should add to exclusion list
4. May automatically save policy, or requires "Save Policy" button

**Expected**: Exclusion added successfully

---

### Step 10: Test the Exclusion

**Details**:

1. **Generate test traffic matching exclusion criteria**:
   ```bash
   curl -X POST https://my-app.example.com/api/webhook \
     -H "Content-Type: application/json" \
     -d '{"payload":"<script>alert(1)</script>"}'
   ```

2. **Check Security Events**:
   - Navigate to Security > Events
   - Filter by WAF policy: "basic-waf"
   - Look for recent POST to /api/webhook
   - Should NOT show SQL Injection or Command Injection signatures
   - Other signatures still logged (if present)

3. **Expected Result**:
   - Request passes through (not blocked)
   - Excluded signatures not logged
   - Other signatures still logged
   - No impact on app functionality

**Verify**: Request succeeds, excluded signatures not triggered

---

### Step 11: Monitor for Regression

**Details**:

1. Continue monitoring Security Events for 1-3 days
2. Verify:
   - False positive gone ✓
   - Real attacks still detected ✓
   - No impact on security posture ✓

3. Check other endpoints:
   - Are other endpoints still protected?
   - Only /api/webhook affected

**Expected**: Exclusion works as intended

---

## Validation with CLI

**Command**: Verify exclusion rule creation

```bash
# Get WAF policy details with exclusions
xcsh security get app_firewall basic-waf -n production

# Expected output includes:
# - Name: basic-waf
# - Exclusions:
#   - Name: exclude-api-json-payload
#   - URI Path: /api/webhook
#   - Method: POST
#   - Signatures: SQL Injection, Command Injection
```

---

## Success Criteria

- [x] Exclusion rule appears in WAF policy
- [x] Matching criteria configured correctly
- [x] Signatures to exclude selected
- [x] Test traffic passes (not blocked)
- [x] Excluded signatures not logged
- [x] Other signatures still logged
- [x] CLI confirms exclusion exists

---

## Common Issues & Troubleshooting

### Issue: Exclusion Not Working (Still Blocking)

**Symptoms**:
- Request still blocked after adding exclusion
- Signature still appearing in logs

**Solutions**:
1. Verify exclusion criteria match request:
   - Check URI path: `/api/webhook` correct?
   - Check method: POST?
   - Check parameters present?

2. Verify signature name exact:
   - May need to copy exact name from logs
   - Case-sensitive?
   - Full name or partial?

3. Check policy saved:
   - Did you click "Save Policy" after adding exclusion?
   - Refresh browser to reload policy

4. Wait for policy to apply:
   - Policy changes take 10-30 seconds
   - Try request again after waiting

---

### Issue: Too Broad Exclusion (Reducing Security)

**Symptoms**:
- Real attacks now passing through
- Exclusion scope wider than intended

**Solutions**:
1. Make exclusion more specific:
   - Add URI path to limit scope
   - Add method (POST, not GET)
   - Add parameter matching
   - Remove if "ALL RULES" selected

2. Split into multiple exclusions:
   - One per endpoint
   - One per signature
   - One per parameter

3. Delete and recreate:
   - Edit WAF policy
   - Delete over-broad exclusion
   - Create narrower rule

---

### Issue: Cannot Find Signature Name

**Symptoms**:
- Don't know exact signature name causing false positive
- Can't find in signature list

**Solutions**:
1. Check Security Events:
   - Navigate to Security > Events
   - Find false positive event
   - Signature name should be displayed
   - Copy exact name

2. Search signature list:
   - Most signature selectors have search
   - Type "SQL" to find SQL injection signatures
   - Type "XSS" to find XSS signatures

3. If still unclear:
   - Exclude entire category ("SQL Injection*")
   - Monitor for impact
   - Refine later

---

## Best Practices

### 1. Be Specific
```
❌ Bad: Exclude ALL rules from /api/*
✅ Good: Exclude SQL Injection only from /api/webhook POST
```

### 2. Document Reasons
```
✅ Reason: Webhook payload uses curly braces {json}
           matches Command Injection pattern
```

### 3. Monitor After Exclusion
```
✅ Check: Security Events for 3 days
✅ Verify: No regression in attack detection
✅ Review: No new false positives
```

### 4. Regular Audit
```
✅ Monthly: Review all exclusion rules
✅ Verify: Still necessary
✅ Update: If business logic changes
```

### 5. Principle of Least Privilege
```
✅ Exclude: Specific signatures
✅ Exclude: Specific endpoints
❌ Don't Exclude: ALL signatures
❌ Don't Exclude: ALL endpoints
```

---

## Next Steps

After successfully creating exclusion:

1. **Monitor for 1-3 Days**: Watch Security Events
2. **Create More Exclusions**: If additional false positives found
3. **Escalate to Blocking**: Once false positives eliminated
   - Edit WAF policy
   - Change Enforcement Mode: Monitoring → Blocking
   - Save
4. **Continue Monitoring**: Watch for real attacks

---

## Removing Exclusions

If exclusion no longer needed:

1. Edit WAF policy
2. Find Exclusions section
3. Click delete/remove next to exclusion
4. Click "Save Policy"
5. Exclusion removed, signature protected again

---

## Related Documentation

- **WAF Policies Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/app-firewall
- **WAF Exclusion Rules**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-exclusions
- **Signature Management**: https://docs.cloud.f5.com/docs-v2/reference/waf-signatures
- **False Positive Handling**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-false-positives
- **Monitoring Mode**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-monitoring-mode

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24

