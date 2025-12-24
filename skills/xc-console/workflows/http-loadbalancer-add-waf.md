---
title: Workflow - Add WAF Policy to HTTP Load Balancer
description: Attach Web Application Firewall protection to an existing HTTP load balancer
version: 1.0.0
last_updated: 2025-12-24
category: Security
complexity: Intermediate
estimated_duration: 5-10 minutes
---

# Workflow: Add WAF Policy to HTTP Load Balancer

## Overview
Attach a Web Application Firewall (WAF) policy to an existing HTTP load balancer to protect against web application attacks.

## Prerequisites
- ✅ HTTP load balancer already created and ACTIVE
- ✅ WAF policy already created in same namespace
- ✅ Understanding of WAF enforcement modes (Monitoring vs Blocking)

## Input Parameters

```json
{
  "http_loadbalancer_name": "my-app-lb",
  "namespace": "production",
  "waf_policy_name": "basic-waf",
  "enforcement_mode": "monitoring"
}
```

## Step-by-Step Execution

### Step 1: Navigate to HTTP Load Balancers List

**Console Path**: Web App & API Protection > Manage > HTTP Load Balancers

**Details**:
- Click "Web App & API Protection" in left sidebar
- Click "Manage" submenu
- Click "HTTP Load Balancers"
- Should see list of existing HTTP LBs

**Verify**: List page displayed with existing load balancers

---

### Step 2: Click on HTTP Load Balancer Name

**Details**:
- Find "my-app-lb" in the list
- Click on the name (not a button, just the name link)
- Should open LB details/edit page

**Alternative**: May have an "Edit" button next to LB name

**Verify**: HTTP Load Balancer details/edit page opens

---

### Step 3: Scroll to Security Policies Section

**Details**:
- Page may have tabs: "Overview", "Configuration", "JSON", "Security"
- Look for section titled "Security Policies" or similar
- May be in "Configuration" tab or separate tab

**Verify**: Security Policies section visible with dropdown/selection fields

---

### Step 4: Select WAF Policy

**Details**:
1. Look for field: "WAF Policy", "App Firewall", or "Web Application Firewall"
2. Click the dropdown
3. Select "basic-waf" from the list
4. If creating new policy first:
   - You may need to go to Security > App Protection > WAF Policies
   - Create policy there, then come back

**Verify**: "basic-waf" is selected in dropdown

---

### Step 5: Choose Enforcement Mode

**Details**:
1. Look for "Enforcement Mode" or "Mode" selector
2. Options:
   - **Monitoring**: Log attacks but don't block (recommended for tuning)
   - **Blocking**: Block detected attacks (recommended for production)
   - **Risk-Based**: Block high-risk, allow medium/low

3. For initial deployment: Select "Monitoring"
   - Allows 1-7 days of tuning
   - Identifies false positives
   - Then escalate to "Blocking"

**Important**: Always start with Monitoring for new policies

**Verify**: "Monitoring" is selected

---

### Step 6: Save Changes

**Details**:
- Scroll to bottom of form
- Click "Save" or "Save and Exit"
- Form should save and close
- Should redirect to LB list or details page

**Expected**: No error message, successful save

---

### Step 7: Verify WAF Attachment

**Details**:
1. Navigate back to LB details
2. Check Security Policies section
3. Should show "basic-waf" attached
4. Status should show enforcement mode selected

**Verify**:
- WAF policy visible in LB configuration
- Enforcement mode correctly shown

---

## Validation with CLI

**Command**: Verify WAF attachment

```bash
# Get HTTP load balancer details with WAF info
xcsh load_balancer get http_loadbalancer my-app-lb -n production

# Expected output should include:
# app_firewall: basic-waf
# enforcement_mode: monitoring (or blocking)
```

---

## Success Criteria

- [x] HTTP LB remains ACTIVE after changes
- [x] WAF policy shows attached in LB details
- [x] Enforcement mode correctly configured
- [x] CLI confirms WAF policy attachment
- [x] Security events start appearing in logs

---

## Monitoring WAF Activity

### View Security Events

```
Navigate to: Security > Events
Filter:
  - Time: Last 24 hours
  - Source: WAF policy or HTTP LB name
View:
  - Attack signatures triggered
  - Blocked vs Monitored events
  - False positives (legitimate traffic blocked)
  - Geographic distribution of attacks
```

### Check Block Rate
```
In HTTP LB details:
- View metrics showing requests blocked by WAF
- Calculate false positive rate
- Adjust exclusions if needed
```

---

## Tuning WAF Policy (First 1-7 Days)

### Review False Positives

1. Check Security Events page
2. Identify requests marked as attacks but legitimate
3. Get attack signature name from event
4. Get URL/parameter causing false positive

### Create Exclusion Rule

See workflow: `waf-policy-create-exclusion.md`

### Monitor for Regression

- Continue monitoring for additional false positives
- Document all exclusions created
- After tuning period (1-7 days), move to Blocking mode

---

## Escalating to Blocking Mode (After Tuning)

**Steps**:
1. Edit HTTP LB
2. Find WAF policy attachment
3. Change enforcement mode: Monitoring → Blocking
4. Save changes
5. Continue monitoring

**Recommendation**: Escalate during low-traffic period for safety

---

## Testing WAF Protection

### Simulate Attack (to verify WAF is working)

```bash
# SQL Injection attempt
curl "https://my-app-lb/search?q='; DROP TABLE users--"

# Expected: WAF blocks or logs (depending on mode)
# Check Security Events page for entry
```

### Verify Legitimate Traffic Passes

```bash
# Normal request
curl "https://my-app-lb/search?q=example"

# Expected: Request passes through
# Should reach backend and return response
```

---

## Common Issues & Troubleshooting

### Issue: WAF Dropdown Empty

**Symptoms**:
- WAF Policy dropdown empty or no policies listed

**Solutions**:
1. Create WAF policy first:
   - Navigate to Security > App Protection > WAF Policies
   - Create policy with default settings
   - Return to HTTP LB and try again
2. Verify policy is in same namespace

---

### Issue: High False Positive Rate

**Symptoms**:
- Many legitimate requests being blocked in Monitoring mode
- Legitimate users complain about access issues

**Solutions**:
1. Identify attack signatures causing false positives
2. Create exclusion rules for those signatures
3. See workflow: `waf-policy-create-exclusion.md`
4. Monitor exclusion impact on security

---

### Issue: WAF Not Blocking Attacks

**Symptoms**:
- Set to Blocking mode but attacks still passing through
- Security events show attacks but traffic not blocked

**Solutions**:
1. Verify enforcement mode is "Blocking" (not "Monitoring")
2. Check attack signature is enabled in WAF policy
3. Verify WAF policy is correctly attached
4. Review exclusion rules (may be excluding attack signatures)

---

## Removing WAF Policy (If Needed)

1. Edit HTTP LB
2. Find WAF Policy field
3. Select "None" or leave empty
4. Save changes
5. WAF protection is disabled

**Note**: HTTP LB remains ACTIVE, just no WAF protection

---

## Next Steps

After successfully attaching WAF:

1. **Monitor Events**: Review security dashboard daily
2. **Tune Exclusions**: Create rules for false positives
3. **Escalate to Blocking**: After 1-7 days of tuning
4. **Add Bot Defense**: See workflow `http-loadbalancer-add-bot-defense.md`
5. **Add Rate Limiting**: Configure rate limits per endpoint

---

## Related Documentation

- **WAF Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/app-firewall
- **WAF Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-configuration
- **WAF Exclusions**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-exclusions
- **Security Events**: https://docs.cloud.f5.com/docs-v2/how-to/security/security-events
- **Threat Campaigns**: https://docs.cloud.f5.com/docs-v2/reference/threat-campaigns

---

## Rollback

If you need to remove WAF:

1. Edit HTTP LB
2. Set WAF Policy to "None"
3. Save
4. WAF protection disabled (LB still routes traffic)

To delete WAF policy entirely:
- Navigate to Security > App Protection > WAF Policies
- Click policy name
- Click "Delete"
- Confirm

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24

