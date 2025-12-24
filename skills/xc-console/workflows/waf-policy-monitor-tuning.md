---
title: Workflow - Monitor and Tune WAF Policy
description: Monitor WAF policy in Monitoring mode and tune based on event analysis
version: 1.0.0
last_updated: 2025-12-24
category: Security
complexity: Intermediate
estimated_duration: 30-45 minutes (daily for 1-7 days)
---

# Workflow: Monitor and Tune WAF Policy

## Overview
Monitor WAF policy performance during Monitoring mode (1-7 days), analyze security events for false positives, and tune detection thresholds. This workflow runs after WAF policy is attached to HTTP load balancer and before switching to Blocking mode.

## Prerequisites
- ✅ WAF policy created and deployed in Monitoring mode
- ✅ WAF policy attached to HTTP load balancer
- ✅ Application traffic flowing through WAF (at least 1 day of data)
- ✅ Access to Security Events dashboard
- ✅ Understanding of expected vs unexpected traffic patterns

## Input Parameters

```json
{
  "waf_policy_name": "basic-waf",
  "namespace": "production",
  "monitoring_duration_days": 3,
  "false_positive_threshold": 0.05,
  "signature_tuning": {
    "sql_injection": {
      "enabled": true,
      "sensitivity": "medium"
    },
    "xss": {
      "enabled": true,
      "sensitivity": "medium"
    },
    "path_traversal": {
      "enabled": true,
      "sensitivity": "medium"
    }
  },
  "monitoring_checklist": {
    "daily_review": true,
    "event_analysis": true,
    "signature_tuning": true,
    "threshold_adjustment": true
  }
}
```

## Step-by-Step Execution

### Step 1: Access Security Events Dashboard

**Console Path**: Security > Events

**Details**:
- Click "Security" in left sidebar
- Click "Events" submenu
- Should show security event log with timestamps and signatures

**Verify**: Events dashboard displayed with event entries

---

### Step 2: Filter Events by WAF Policy

**Details**:
1. Look for filter controls (usually at top of events list)
2. Filter by:
   - **Policy Name**: Select "basic-waf"
   - **Date Range**: Last 24 hours (for daily review)
   - **Event Type**: "WAF" or "Security Events"

3. Should show only WAF events for this policy
4. Check event count for baseline

**Verify**:
- Filter applied: Policy = "basic-waf" ✓
- Date range correct ✓
- Event list updated ✓

---

### Step 3: Review Event Categories

**Details**:

Look at event distribution by signature type:

1. **SQL Injection Events**
   - Count: How many in last 24 hours?
   - Legitimate? Assess if SQL-like patterns in normal app usage
   - Action: Decide if sensitivity needs adjustment

2. **XSS (Cross-Site Scripting) Events**
   - Count: How many flagged?
   - Legitimate? Forms may have characters that look like scripts
   - Common false positives: code examples, markdown rendering

3. **Path Traversal Events**
   - Count: How many blocked?
   - Legitimate? Some apps use dot-slash paths normally
   - Check if API endpoints trigger these

4. **Command Injection Events**
   - Count: How many?
   - Legitimate? Less common unless app takes command-like input
   - Assess severity

**Analyze**:
- Total event count
- Distribution across signature types
- Ratio of events to HTTP requests (estimate traffic volume)

**Verify**: Event breakdown understood

---

### Step 4: Identify False Positives

**Details**:

1. **Analyze individual events**:
   - Click on high-volume events
   - Review:
     - Request path: Is this legitimate app endpoint?
     - Parameter: What parameter triggered signature?
     - Payload: Does it look like real attack or false positive?
     - User: Is this internal testing traffic?

2. **Pattern recognition**:
   - Same endpoint triggering same signature repeatedly → likely false positive
   - User agent: Is it a bot, crawler, or internal tool?
   - Time pattern: Happens during business hours? Likely false positive
   - Repeats from same source IP? May be development/testing

3. **False positive indicators**:
   - ✅ Same endpoint + same parameter + same payload pattern
   - ✅ Internal IP addresses (10.x.x.x, 192.168.x.x)
   - ✅ Known development/test tools (Postman, curl, internal scripts)
   - ✅ Legitimate business logic that looks like attack

**Example**:
- Endpoint: `/api/search?q=select%20data`
- Signature: "SQL Injection - Generic"
- Assessment: User is searching for SQL documentation, not attacking
- Action: Create exclusion for /api/search with SQL injection signatures

**Verify**: False positives identified and documented

---

### Step 5: Calculate False Positive Rate

**Details**:

1. **Count total events** (last 24 hours): X events
2. **Count identified false positives**: Y events
3. **Calculate false positive rate**: Y/X = FP%

Example:
- Total events: 50
- Identified false positives: 2
- False positive rate: 2/50 = 4%

**Assessment**:
- **< 2%**: Excellent, ready to escalate to Blocking
- **2-5%**: Good, but consider some tuning before Blocking
- **5-10%**: Moderate, should create exclusions before Blocking
- **> 10%**: High, need significant tuning before Blocking

**Decision**:
- FP% < 2% → Can escalate to Blocking mode
- 2-5% → Create exclusions for identified FPs, continue monitoring
- > 5% → Adjust detection sensitivities, create exclusions, monitor 1-2 more days

**Verify**: False positive rate calculated and assessment made

---

### Step 6: Navigate to WAF Policy Edit

**Console Path**: Security > App Protection > WAF Policies > [policy name] > Edit

**Details**:
1. Click "Security" in sidebar
2. Click "App Protection"
3. Click "WAF Policies"
4. Find "basic-waf" in list
5. Click on it to open details
6. Click "Edit" button

**Verify**: WAF policy edit form displayed

---

### Step 7: Adjust Signature Sensitivity (If Needed)

**Details** (if false positive rate > 5%):

1. Look for **Signature Settings** or **Detection** section
2. For each signature type causing false positives:

   **SQL Injection**:
   - Current setting: Medium/Aggressive?
   - Options: Low, Medium, High (lower = fewer detections, fewer FPs)
   - Change if: FP rate is high
   - To: "Low" (detects obvious SQL injection, ignores edge cases)

   **XSS (Cross-Site Scripting)**:
   - Current setting: Medium?
   - Options: Low, Medium, High
   - Change if: Forms are triggering XSS signatures
   - To: "Low" (detects obvious script tags, ignores variations)

   **Path Traversal**:
   - Current setting: Medium?
   - Options: Low, Medium, High
   - Change if: APIs using path-like parameters trigger it
   - To: "Low"

3. **Save changes** (if made)
4. **Note**: Sensitivity changes apply immediately to Monitoring mode logs

**Important**: Don't lower sensitivity globally - instead create specific exclusions (previous workflow) for known false positives

**Verify**: Sensitivities adjusted (if needed)

---

### Step 8: Create Exclusions for Identified False Positives

**Details**:

For each identified false positive pattern from Step 4:

1. Navigate to **Exclusions** section (see waf-policy-create-exclusion workflow)
2. Add exclusion with:
   - **URI Path**: The endpoint that triggers false positive
   - **Method**: POST/GET/etc as appropriate
   - **Signatures**: Specific signature causing false positive
   - **Condition**: Parameter name or body pattern (if applicable)

Example sequence:
- FP #1: `/api/search?q=select` triggers SQL Injection
  → Create: Exclude SQL Injection from /api/search GET
- FP #2: Form submission with `<script>` in template field
  → Create: Exclude XSS from /api/forms POST parameter "template"

**Save**: Each exclusion as added

**Verify**: All false positive exclusions created

---

### Step 9: Monitor Next 24 Hours

**Details**:

1. **Wait 24 hours** with exclusions in place
2. **Return to Step 2**: Filter events again by WAF policy
3. **Verify**:
   - Event count decreased? ✓
   - False positives gone? ✓
   - Still detecting real attacks? ✓

4. **Recalculate false positive rate**:
   - (FPs identified today) / (total events) = new FP%
   - Target: < 2%

5. **If FP% still high**:
   - Add more exclusions (return to Step 4-8)
   - OR adjust signature sensitivities more (Step 7)
   - OR continue monitoring (some apps have weekly patterns)

6. **If FP% < 2%**:
   - Ready to escalate to Blocking mode (Step 10)

**Verify**: Monitoring cycle complete, FP% assessed

---

### Step 10: Decide: Continue Monitoring or Escalate to Blocking

**Decision Point**:

```
IF false_positive_rate < 2% AND monitoring_days >= 1:
  → Ready for BLOCKING MODE (proceed to Step 11)
ELSE IF monitoring_days < 3:
  → Continue monitoring (return to Step 2, repeat daily)
ELSE IF false_positive_rate < 5% AND monitoring_days >= 3:
  → Can escalate with caution (proceed to Step 11)
ELSE:
  → More tuning needed (return to Step 7-8)
```

**Assessment factors**:
- **Days elapsed**: 1-3 days typical, up to 7 days acceptable
- **False positive rate**: < 2% is ideal, < 5% is acceptable
- **Event diversity**: Have you seen various traffic patterns (peak, off-peak)?
- **Business confidence**: Are stakeholders comfortable with current tuning?

**Verify**: Decision made (continue or escalate)

---

### Step 11: Escalate to Blocking Mode (If Ready)

**Details** (only if FP% < 2% and monitoring_days ≥ 1):

1. In WAF policy edit form, look for **Enforcement Mode** or **Mode** section
2. Change from "Monitoring" to "Blocking"
   - Monitoring: Log events, don't block requests
   - Blocking: Block requests matching signatures (respecting exclusions)

3. **Review before changing**:
   - False positive rate: < 2%? ✓
   - Exclusions in place for known FPs? ✓
   - Signature sensitivities tuned? ✓
   - Team aware of change? ✓

4. **Save and confirm**
5. **Deployment**: Changes take 10-30 seconds to apply

**Important**: This is irreversible until next change, so ensure false positive rate is low

**Verify**: Mode changed to "Blocking"

---

### Step 12: Initial Monitoring in Blocking Mode

**Details** (after escalation to Blocking):

1. **First hour**: Monitor closely
   - Check if legitimate traffic is being blocked
   - Monitor application error rates
   - Check user complaints (if any)

2. **Review events** (in Blocking mode events show blocks)
   - Navigate to Security > Events
   - Filter: WAF policy = "basic-waf", Event type = "Blocked"
   - Assess: Any unexpected blocks?

3. **If blocks look suspicious**:
   - Add exclusions immediately
   - Don't need to switch back to Monitoring

4. **After 24 hours**: Assess stability
   - Blocked event count reasonable?
   - No false positive explosion?
   - Application working normally?

**Verify**: Blocking mode stable and not over-blocking

---

## Validation with CLI

**Command**: Monitor WAF policy events

```bash
# Get WAF policy status
xcsh security get app_firewall basic-waf -n production

# Expected output includes:
# - Name: basic-waf
# - Mode: Monitoring (during tuning) or Blocking (after escalation)
# - Exclusions: Count of active exclusions
# - Last Updated: Timestamp of recent changes

# Get recent events
xcsh security events list --policy basic-waf -n production --duration 24h

# Expected output:
# Event count, distribution by signature, block counts (if Blocking mode)
```

---

## Success Criteria

- [x] WAF policy monitored for minimum 1 day
- [x] Security events reviewed and analyzed
- [x] False positives identified (< 5%)
- [x] Exclusions created for false positives
- [x] Signature sensitivities adjusted (if needed)
- [x] False positive rate < 2% achieved
- [x] Mode escalated to Blocking (when ready)
- [x] No increase in application errors

---

## Monitoring Checklist (Daily During 1-7 Days)

### Daily Tasks
- [ ] Check Security Events dashboard
- [ ] Count events by signature type
- [ ] Identify new false positive patterns
- [ ] Review any anomalies or spikes
- [ ] Assess false positive rate
- [ ] Create exclusions for new FPs
- [ ] Document findings in runbook

### Decision Point (Each Day)
- [ ] FP rate < 2%? → Ready for Blocking mode
- [ ] FP rate 2-5%? → Continue monitoring, create more exclusions
- [ ] FP rate > 5%? → Adjust sensitivities, more tuning needed

### Escalation to Blocking
- [ ] FP rate < 2% confirmed
- [ ] Monitoring period: 1-3 days minimum
- [ ] Stakeholders notified
- [ ] Exclusions documented
- [ ] Change request approved (if required)
- [ ] Mode switched to "Blocking"
- [ ] Post-escalation monitoring 24+ hours

---

## Common Issues & Troubleshooting

### Issue: False Positive Rate Not Decreasing

**Symptoms**:
- Creating exclusions but FP rate remains high
- Same or different endpoints keep triggering signatures
- Exclusions don't seem to apply

**Solutions**:
1. **Verify exclusions applied**:
   - Edit WAF policy
   - Check Exclusions section shows your created rules
   - May need to wait 10-30 seconds for policy deployment

2. **Check exclusion matching criteria**:
   - Is URI path exact? (e.g., `/api/search` vs `/api/search/`)
   - Is method correct? (GET vs POST)
   - Are parameter names exact?

3. **Identify different FP patterns**:
   - Different endpoint triggering same signature?
   - Different parameter values causing FPs?
   - Create specific exclusions for each pattern

4. **Consider sensitivity adjustment**:
   - If widespread FPs across many endpoints
   - Lower signature sensitivity globally (Step 7)
   - Then re-enable for specific high-risk endpoints

---

### Issue: Real Attacks Not Being Detected (After Escalation)

**Symptoms**:
- Blocking mode enabled but obvious attacks not detected
- Signature seems disabled or ineffective
- No blocks for expected attack patterns

**Solutions**:
1. **Verify mode is actually Blocking**:
   - Check WAF policy edit form
   - Mode should show "Blocking", not "Monitoring"
   - May need to refresh page

2. **Check signature is enabled**:
   - Review signature settings
   - Verify signature is active (not disabled)
   - Sensitivity not set too low?

3. **Verify test attack matches signature**:
   - SQL injection test: `select' or '1'='1`
   - XSS test: `<script>alert('test')</script>`
   - Path traversal: `../../../../etc/passwd`
   - Ensure attack format matches what signature detects

4. **Review exclusions aren't too broad**:
   - Are exclusions excluding attack signatures?
   - Check if endpoint-specific exclusion is blocking all requests
   - Disable over-broad exclusions temporarily

---

### Issue: Performance Impact After Escalation

**Symptoms**:
- Application slower after switching to Blocking mode
- Higher latency on requests
- WAF processing taking too long

**Solutions**:
1. **Check event volume**:
   - High block count = high processing load
   - If > 1000 blocks/minute, may need tuning

2. **Reduce detection breadth**:
   - Lower signature sensitivities
   - This reduces processing overhead
   - May need to add endpoint-specific exclusions

3. **Optimize exclusions**:
   - Specific exclusions are more efficient than broad ones
   - Exclude entire endpoints if many FPs there
   - Review exclusion list for efficiency

4. **Monitor WAF metrics**:
   - Check WAF CPU/memory usage
   - May need to scale WAF infrastructure
   - Contact F5 support if persistence performance issues

---

## Best Practices

### 1. Time the Monitoring Period
```
❌ Bad: Switch to Blocking after 1 hour
✅ Good: Monitor for 1-3 days, include peak and off-peak traffic
✅ Better: Monitor full week to see all traffic patterns
```

### 2. Document Everything
```
✅ Good: Keep notes on each false positive found
✅ Better: Create shared spreadsheet/runbook for team
✅ Excellent: Each exclusion links to business justification
```

### 3. Coordinate with Application Team
```
✅ Good: Notify team before Blocking mode
✅ Better: Daily syncs during monitoring period
✅ Excellent: Joint decision on readiness to escalate
```

### 4. Monitor Post-Escalation
```
✅ Good: Check WAF events daily for first week
✅ Better: Set up alerts for unusual block patterns
✅ Excellent: Monthly reviews for signature tuning
```

---

## Next Steps

After successfully tuning and escalating WAF to Blocking mode:

1. **Continue Monitoring**: Daily reviews for first week, then weekly
2. **Adjust as Needed**: Add exclusions for any new false positives
3. **Security Hardening**: Consider additional protections:
   - Bot Defense
   - API Protection
   - Rate Limiting
4. **Regular Audits**: Monthly review of exclusions (still necessary?)
5. **Update Runbooks**: Document final tuning configuration for operations

---

## Related Documentation

- **WAF Policies Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/app-firewall
- **Monitoring Mode Guide**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-monitoring-mode
- **Event Analysis**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-event-analysis
- **Signature Tuning**: https://docs.cloud.f5.com/docs-v2/reference/waf-signature-tuning
- **Exclusion Management**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-exclusions
- **Escalation to Blocking**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-blocking-mode

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24
