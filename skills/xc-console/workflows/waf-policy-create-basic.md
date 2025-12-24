---
title: Workflow - Create WAF Policy (Default Protection)
description: Create a Web Application Firewall policy with signature-based threat detection
version: 1.0.0
last_updated: 2025-12-24
category: Security
complexity: Intermediate
estimated_duration: 10-15 minutes
---

# Workflow: Create WAF Policy (Default Protection)

## Overview
Create a Web Application Firewall (WAF) policy with signature-based threat detection and automatic threat campaign updates.

## Prerequisites
- ✅ Namespace exists
- ✅ Understanding of WAF enforcement modes (Monitoring vs Blocking)
- ✅ At least one HTTP load balancer (to attach policy to)

## Input Parameters

```json
{
  "name": "basic-waf",
  "namespace": "production",
  "detection_mode": "signature_based",
  "enforcement_mode": "monitoring",
  "enable_threat_campaigns": true,
  "enable_sql_injection_detection": true,
  "enable_xss_detection": true,
  "enable_path_traversal_detection": true,
  "enable_command_injection_detection": true
}
```

## Step-by-Step Execution

### Step 1: Navigate to WAF Policies Page

**Console Path**: Security > App Protection > WAF Policies

**Details**:
- Click "Security" in left sidebar
- Click "App Protection" submenu
- Click "WAF Policies"
- Should see list of existing WAF policies (may be empty)

**Verify**: WAF Policies list page displayed

---

### Step 2: Click Add WAF Policy Button

**Details**:
- Click "Add WAF Policy" button (usually top right)
- Should open WAF policy creation form
- Form may have multiple sections/tabs

**Verify**: Blank WAF policy creation form displayed

---

### Step 3: Fill Metadata Section

**Details**:

1. **Name**: Enter "basic-waf"
   - Constraints: Unique per namespace, lowercase alphanumeric + dashes

2. **Namespace**: Select "production"
   - Dropdown select
   - Determines where policy is deployed

3. **Labels** (optional): Leave empty
   - Key-value format for organization

**Verify**:
- Name field shows "basic-waf"
- Namespace shows "production"

---

### Step 4: Select Detection Mode

**Details**:

1. Look for "Detection Mode" or "Detection Type" dropdown
2. Options:
   - **Signature-Based**: Pre-defined attack patterns (recommended for most)
   - **Anomaly Detection**: Machine learning-based
   - **Combined**: Both methods

3. Select: "Signature-Based"
   - Immediate protection against known attacks
   - Continuously updated threat signatures

**Verify**: "Signature-Based" selected

---

### Step 5: Select Enforcement Mode

**Details**:

1. Look for "Enforcement Mode" radio buttons or dropdown
2. Options:
   - **Monitoring**: Log attacks without blocking (recommended first)
   - **Blocking**: Block detected attacks
   - **Risk-Based**: Block high-risk, allow medium/low

3. Select: "Monitoring"
   - Recommended for initial deployment
   - Allows 1-7 days of tuning
   - Identifies false positives

**Important**: Always start with Monitoring for new policies

**Verify**: "Monitoring" is selected

---

### Step 6: Enable Threat Detection Categories

**Details**:

Look for toggles/checkboxes for attack types:

1. **SQL Injection Detection**: Toggle ON
   - Protects against SQLi attacks

2. **Cross-Site Scripting (XSS)**: Toggle ON
   - Protects against XSS attacks

3. **Path Traversal Detection**: Toggle ON
   - Prevents directory traversal attacks

4. **Command Injection Detection**: Toggle ON
   - Prevents OS command injection

5. **Threat Campaigns**: Toggle ON
   - Auto-update with latest threat signatures
   - Critical for staying protected

**Verify**:
- All detection toggles are enabled
- Threat Campaigns enabled (auto-update)

---

### Step 7: Review Optional Settings

**Details** (can be left default):

- **Custom Signatures**: None (leave empty for now)
- **Exclusion Rules**: None (will add later if false positives)
- **Advanced Settings**: Leave defaults

**For now**: Leave optional settings as-is

---

### Step 8: Submit Form

**Details**:
- Scroll to bottom
- Click "Save and Exit" or "Create"
- Form should close, redirect to WAF policies list

**Expected**: WAF policies list page displayed

---

### Step 9: Verify Policy Creation

**Details**:
1. Look for "basic-waf" in WAF policies list
2. Should show status and basic info
3. Click on policy name to view details

**Verify**:
- Policy appears in list ✓
- Status shows "ACTIVE" ✓
- Detection mode shows "Signature-Based" ✓
- Enforcement mode shows "Monitoring" ✓

---

## Validation with CLI

**Command**: Verify WAF policy creation

```bash
# List all WAF policies in namespace
xcsh security list app_firewall -n production

# Get specific WAF policy details
xcsh security get app_firewall basic-waf -n production

# Expected output includes:
# - Name: basic-waf
# - Namespace: production
# - Detection Mode: signature_based
# - Enforcement Mode: monitoring
# - Threat Campaigns: enabled
```

---

## Success Criteria

- [x] WAF policy appears in console list
- [x] Status shows "ACTIVE"
- [x] Enforcement mode is "Monitoring"
- [x] Detection mode is "Signature-Based"
- [x] Threat campaigns enabled
- [x] CLI confirms policy creation

---

## Next: Attach Policy to HTTP Load Balancer

**See workflow**: `http-loadbalancer-add-waf.md`

Steps:
1. Navigate to HTTP Load Balancer
2. Edit the load balancer
3. Attach "basic-waf" policy
4. Set enforcement mode to "Monitoring"
5. Save

---

## Monitoring WAF Activity (After Attachment)

### View Security Events

```
Navigate to: Security > Events
Filters:
  - WAF Policy: basic-waf
  - Time Range: Last 24 hours

Review:
  - Attack signatures triggered
  - Blocked vs Monitored counts
  - False positives (legitimate traffic blocked)
  - Top attack types detected
```

### Review Monitored Events

In Monitoring mode:
- All attacks are logged but not blocked
- Review patterns for false positives
- Identify legitimate traffic marked as attacks
- Create exclusion rules as needed

---

## Tuning Phase (First 1-7 Days)

### Day 1-2: Initial Monitoring
1. Let policy run in Monitoring mode
2. Check Security Events page
3. Look for attack patterns

### Day 3-5: False Positive Review
1. Identify legitimate requests marked as attacks
2. Review attack signature names
3. Create exclusion rules for false positives
   - See workflow: `waf-policy-create-exclusion.md`

### Day 6-7: Verify Tuning
1. Confirm false positives reduced
2. Verify real attacks still detected
3. Check exclusion rules working correctly

### After Tuning: Escalate to Blocking
1. Edit WAF policy
2. Change enforcement mode: Monitoring → Blocking
3. Save
4. All detected attacks now blocked

---

## Common Issues & Troubleshooting

### Issue: Too Many False Positives

**Symptoms**:
- Legitimate requests being logged as attacks
- Users can't access certain features
- False positive rate >5%

**Solutions**:
1. Identify specific attack signatures causing issues
2. Review Security Events to find pattern
3. Create exclusion rules for those signatures
   - See workflow: `waf-policy-create-exclusion.md`
4. Test exclusion and verify legitimate traffic passes
5. Continue monitoring

---

### Issue: Real Attacks Not Detected

**Symptoms**:
- Known attack attempts not appearing in logs
- Expected attack signature not triggered
- Security events don't show certain attacks

**Solutions**:
1. Verify threat campaigns enabled
2. Verify detection toggles enabled (SQLi, XSS, etc.)
3. Check if custom exclusion rules are too broad
4. Review attack signature documentation
5. Consider increasing detection sensitivity

---

### Issue: Policy Won't Attach to HTTP LB

**Symptoms**:
- Policy not appearing in HTTP LB attachment dropdown
- Error when trying to attach

**Solutions**:
1. Verify policy created successfully
2. Verify policy is in same namespace as HTTP LB
3. Try creating policy first, then HTTP LB
4. Check for any policy status errors

---

## Removing WAF Policy (If Needed)

**To detach from HTTP LB**:
1. Edit HTTP Load Balancer
2. Set WAF Policy dropdown to "None"
3. Save

**To delete policy entirely**:
1. Make sure no HTTP LBs attached
2. Navigate to Security > App Protection > WAF Policies
3. Click policy name
4. Click "Delete"
5. Confirm deletion

---

## Best Practices

1. **Always start with Monitoring**
   - Never jump directly to Blocking
   - Tune for 1-7 days first

2. **Enable Threat Campaigns**
   - Automatic signature updates
   - Protection against new attacks

3. **Review Exclusions Regularly**
   - Document reasons for each exclusion
   - Quarterly review for over-broad rules

4. **Monitor Daily**
   - Check Security Events dashboard
   - Look for attack trends
   - Adjust signatures as needed

5. **Escalate Incrementally**
   - Start Monitoring
   - Create exclusions
   - Test exclusions
   - Then escalate to Blocking

---

## Next Steps

After successfully creating WAF policy:

1. **Attach to HTTP LB**: See `http-loadbalancer-add-waf.md`
2. **Create Exclusions**: See `waf-policy-create-exclusion.md`
3. **Add Bot Defense**: See `http-loadbalancer-add-bot-defense.md`
4. **Monitor Events**: Use Security > Events dashboard

---

## Related Documentation

- **WAF Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/app-firewall
- **WAF Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-configuration
- **Threat Campaigns**: https://docs.cloud.f5.com/docs-v2/reference/threat-campaigns
- **Security Events**: https://docs.cloud.f5.com/docs-v2/how-to/security/security-events
- **Best Practices**: https://docs.cloud.f5.com/docs-v2/best-practices/waf-tuning

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24

