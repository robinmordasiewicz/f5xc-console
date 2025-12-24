---
title: Workflow - Add Bot Defense to HTTP Load Balancer
description: Attach bot defense policy to existing HTTP load balancer to protect against malicious bots
version: 1.0.0
last_updated: 2025-12-24
category: Security
complexity: Intermediate
estimated_duration: 15-20 minutes
---

# Workflow: Add Bot Defense to HTTP Load Balancer

## Overview
Attach bot defense policy to existing HTTP load balancer to identify and block malicious bots while allowing legitimate traffic. Bot defense uses behavioral analysis, fingerprinting, and threat intelligence to protect against DDoS, account takeover, and scraping attacks.

## Prerequisites
- ✅ HTTP load balancer already created and active
- ✅ Application is receiving traffic
- ✅ Load balancer has origin pool configured
- ✅ Understanding of legitimate vs malicious bot behavior
- ✅ Baseline traffic metrics established (optional but recommended)

## Input Parameters

```json
{
  "http_loadbalancer_name": "my-app-lb",
  "namespace": "production",
  "bot_defense_policy_name": "default-bot-defense",
  "bot_defense_mode": "monitoring",
  "protection_level": "standard",
  "blocking_rules": {
    "ddos_bots": true,
    "scrapers": true,
    "account_takeover": true,
    "api_abuse": true
  },
  "advanced_settings": {
    "javascript_fingerprinting": true,
    "mobile_bot_detection": true,
    "datacenter_ip_detection": true
  }
}
```

## Step-by-Step Execution

### Step 1: Navigate to HTTP Load Balancer

**Console Path**: Web App & API Protection > Manage > HTTP Load Balancers

**Details**:
- Click "Web App & API Protection" in left sidebar
- Click "Manage" submenu
- Click "HTTP Load Balancers"
- Find and click on "my-app-lb" in the list

**Verify**: HTTP load balancer details page displayed

---

### Step 2: Click Edit Button

**Details**:
- Should see "Edit" button (usually top right)
- Click "Edit"
- Should load HTTP LB edit form

**Verify**: Edit form loading and displayed

---

### Step 3: Navigate to Bot Defense Section

**Details**:

1. Look for **Security** section in the edit form
2. Expand or click on **Bot Defense** subsection
3. Should see options:
   - Enable Bot Defense (checkbox)
   - Bot Defense Policy (dropdown)
   - Enforcement Mode (Monitoring vs Blocking)

**Verify**: Bot Defense section visible and accessible

---

### Step 4: Enable Bot Defense

**Details**:

1. Check the **"Enable Bot Defense"** checkbox
2. Should become active and reveal additional options
3. Look for:
   - Bot Defense Policy selection
   - Enforcement mode dropdown
   - Advanced settings (optional)

**Verify**: Bot Defense enabled, additional options available

---

### Step 5: Select Bot Defense Policy

**Details**:

1. Click **"Bot Defense Policy"** dropdown
2. Options should include:
   - "default-bot-defense" (default policy, recommended)
   - Any custom bot defense policies created previously
   - "Create New Policy" option (if needed)

3. Select **"default-bot-defense"**
4. If not available, select "Create New Policy" and proceed with default settings

**Note**: Default policy includes:
- DDoS bot detection
- Scraper bot detection
- Account takeover protection
- API abuse detection
- Legitimate bot allowlist (Google, Bing, etc.)

**Verify**: Bot Defense Policy selected

---

### Step 6: Set Enforcement Mode

**Details**:

1. Look for **Enforcement Mode** or **Bot Defense Mode** dropdown
2. Options:
   - **Monitoring**: Log suspicious bots, don't block (recommended for initial deployment)
   - **Blocking**: Actively block detected malicious bots

3. For first deployment, select **"Monitoring"**
   - Allows observation of bot behavior without impacting users
   - Run for 1-3 days to establish baseline
   - Then escalate to Blocking if comfortable

**Verify**: Enforcement Mode set to "Monitoring"

---

### Step 7: Review Advanced Bot Detection Settings

**Details** (optional, recommended for mature deployments):

If available, review settings:

1. **JavaScript Fingerprinting**
   - Detects bots that don't execute JavaScript
   - Recommended: Enabled
   - Blocks: Headless browsers, basic scrapers

2. **Mobile Bot Detection**
   - Detects fake mobile app requests
   - Recommended: Enabled
   - Blocks: Spoofed mobile clients

3. **Datacenter IP Detection**
   - Detects requests from known datacenter IPs
   - Recommended: Enabled
   - Blocks: Bot farms, cloud-based scrapers
   - ⚠️ May block legitimate CDN/proxy traffic

4. **Browser Emulation Detection**
   - Detects Selenium, Puppeteer, Playwright
   - Recommended: Enabled
   - Blocks: Automated testing tools (may need exclusions)

**Decision**:
- For **High Security**: Enable all
- For **Standard**: Enable all except datacenter IP
- For **Permissive**: Enable only JavaScript + mobile detection

**Verify**: Advanced settings reviewed and set appropriately

---

### Step 8: Configure Bot Action Rules

**Details** (if available):

Look for **Bot Action Rules** or **Bot Detection Settings**:

```
If found:
1. Rule: "DDoS Bots" → Action: Block (or Monitor)
2. Rule: "Scrapers" → Action: Monitor (or Block for strict)
3. Rule: "Account Takeover Bots" → Action: Block
4. Rule: "API Abuse" → Action: Monitor (or Block)
```

**Recommended Starting Configuration**:
- DDoS Bots: Block
- Scrapers: Monitor (for visibility)
- Account Takeover: Block
- API Abuse: Monitor (for visibility)

This blocks obvious malicious bots while observing subtler attack patterns.

**Verify**: Bot action rules configured appropriately

---

### Step 9: Review and Save

**Details**:

1. Scroll through form to verify:
   - Bot Defense: Enabled ✓
   - Policy: "default-bot-defense" selected ✓
   - Mode: "Monitoring" selected ✓
   - Advanced settings reviewed ✓
   - Action rules configured ✓

2. Look for **"Save and Exit"** or **"Save"** button
3. Click to save changes
4. Should redirect to HTTP LB list page

**Expected**: HTTP LB updated with bot defense enabled

---

### Step 10: Verify Bot Defense Active

**Details**:

1. Back on HTTP LB list page, find "my-app-lb"
2. Click on it to view details
3. Look for **Bot Defense** section
4. Verify:
   - Status: "Enabled" ✓
   - Mode: "Monitoring" ✓
   - Policy: "default-bot-defense" ✓

**Verify**: Bot Defense settings confirmed

---

### Step 11: Monitor Bot Defense Events

**Console Path**: Security > Events

**Details**:

1. Navigate to Security > Events
2. Filter by:
   - **Type**: "Bot Defense" or "Bot"
   - **Policy**: "my-app-lb"
   - **Date**: Last 24 hours

3. Review events:
   - Detected bot count
   - Bot categories (scraper, DDoS, etc.)
   - Actions taken (monitored, blocked, etc.)
   - False positives (legitimate traffic flagged as bot)

4. In **Monitoring mode**:
   - Events show suspected bots
   - No requests actually blocked
   - Allows assessment of accuracy

**Analyze**:
- Are bot detections reasonable?
- False positive rate acceptable?
- Detecting actual threats?

**Verify**: Bot detection events visible and reasonable

---

### Step 12: Monitor Application Metrics

**Details** (1-3 days during Monitoring mode):

1. Check application metrics:
   - Request volume
   - Error rates
   - Response times
   - User complaints

2. If metrics look good:
   - No sudden degradation
   - No legitimate user impact
   - Ready for Blocking mode escalation

3. If issues found:
   - May need to adjust bot detection settings
   - May need to add legitimate bots to allowlist
   - Continue monitoring before escalation

**Decision Point**:
- Metrics normal + bot detections reasonable → Ready to escalate
- Issues detected → Adjust settings, monitor longer

**Verify**: Application metrics stable

---

### Step 13: Escalate to Blocking Mode (Optional)

**Details** (only if Monitoring mode analysis is satisfactory):

1. Edit HTTP load balancer again
2. Find Bot Defense section
3. Change **Enforcement Mode** from "Monitoring" to "Blocking"
4. Review settings one more time:
   - All bot protection types enabled? ✓
   - Legitimate bots in allowlist? ✓
   - Application team notified? ✓

5. Save changes

**Warning**: This immediately starts blocking detected bots. Only do if confident in accuracy.

**Verify**: Mode changed to "Blocking" (if proceeding)

---

## Validation with CLI

**Command**: Verify bot defense configuration

```bash
# Get HTTP LB details with bot defense settings
xcsh configuration get http_loadbalancer my-app-lb -n production

# Expected output includes:
# - Name: my-app-lb
# - Bot Defense: Enabled
# - Mode: Monitoring (or Blocking)
# - Policy: default-bot-defense

# Get bot defense events
xcsh security events list --http-lb my-app-lb -n production --filter bot_defense

# Expected output:
# Bot detection events with timestamps, types, actions
```

---

## Success Criteria

- [x] Bot defense enabled on HTTP LB
- [x] Bot defense policy selected and configured
- [x] Enforcement mode set to "Monitoring" initially
- [x] Advanced detection settings reviewed and enabled
- [x] Bot detection events visible in Security > Events
- [x] Application metrics remain stable
- [x] No legitimate traffic blocked incorrectly
- [x] Mode escalated to Blocking (when ready)

---

## Common Issues & Troubleshooting

### Issue: Bot Defense Not Detecting Expected Bots

**Symptoms**:
- Known scrapers or bots not detected
- Event count lower than expected
- Specific attack types not triggering

**Solutions**:
1. **Verify bot defense is actually enabled**:
   - Edit HTTP LB
   - Check Bot Defense checkbox is checked
   - Verify policy is selected (not greyed out)

2. **Check bot characteristics**:
   - Advanced bots may spoof browsers perfectly
   - Some legitimate tools look like bots
   - Datacenter IP detection may need enabling

3. **Enable more aggressive detection**:
   - Enable JavaScript fingerprinting
   - Enable mobile detection
   - Enable datacenter IP detection
   - These catch more bots but increase false positives

4. **Check Enforcement Mode**:
   - If "Monitoring", bots are detected but not blocked
   - Check events to see if bots are actually detected

5. **Review allowlist**:
   - Legitimate bots may be on allowlist
   - Check if your bot is whitelisted

---

### Issue: Legitimate Traffic Blocked

**Symptoms** (in Blocking mode):
- User complaints about access denied
- Application errors for certain clients
- Legitimate tools (Postman, APM tools) blocked

**Solutions**:
1. **Switch back to Monitoring**:
   - Edit HTTP LB
   - Set Bot Defense Mode to "Monitoring"
   - No more blocks while investigating

2. **Identify false positive pattern**:
   - Which users/tools are blocked?
   - What makes them look like bots?
   - Check Bot Defense events for details

3. **Add to allowlist**:
   - If legitimate tool/user, add to bot defense allowlist
   - Options usually in bot defense policy settings
   - Examples:
     - Internal IP ranges
     - Specific user agents
     - Known good bots (Google, Bing)

4. **Adjust detection methods**:
   - Disable JavaScript fingerprinting if blocking valid clients
   - Disable mobile detection if blocking legitimate mobile apps
   - Lower detection sensitivity

5. **Re-enable Blocking**:
   - After adjusting settings
   - Set Mode back to "Blocking"

---

### Issue: High False Positive Rate

**Symptoms**:
- Many bot detections in Monitoring mode
- Most don't look like real bots
- Service degradation after escalating to Blocking

**Solutions**:
1. **Analyze false positive patterns**:
   - Review events in detail
   - What characteristics trigger false positives?
   - Are legitimate tools flagged?

2. **Disable overly aggressive detection**:
   - Datacenter IP detection may be too broad
   - Mobile detection may flag legitimate mobile apps
   - JavaScript fingerprinting may block older browsers

3. **Use Monitoring mode longer**:
   - 1-3 days may not be enough to understand traffic
   - Try 5-7 days to see full traffic patterns
   - More data = better tuning

4. **Adjust bot action rules**:
   - Instead of blocking, set to "Monitor" for less critical rules
   - Block only DDoS + account takeover (high confidence)
   - Monitor scrapers + API abuse (lower confidence)

5. **Contact F5 Support**:
   - If unable to tune, F5 can help optimize policy
   - May have industry-specific recommendations

---

### Issue: Performance Impact

**Symptoms**:
- Response time increases after enabling bot defense
- Higher CPU/memory usage
- Application latency noticeable

**Solutions**:
1. **Verify it's bot defense causing impact**:
   - Disable bot defense temporarily
   - Check if latency returns to normal
   - If yes, bot defense is the cause

2. **Reduce detection overhead**:
   - Disable JavaScript fingerprinting (CPU intensive)
   - Disable datacenter IP detection
   - Simplify detection rules

3. **Monitor vs Blocking trade-off**:
   - Monitoring mode requires analysis of all requests
   - Blocking mode may actually be faster (stops requests early)
   - Consider escalating to Blocking if confident

4. **Scale bot defense infrastructure**:
   - May need more resources for bot detection
   - Contact F5 about capacity scaling
   - Enterprise deployments may need dedicated bot defense nodes

---

## Best Practices

### 1. Start with Monitoring
```
❌ Bad: Enable Blocking immediately
✅ Good: Monitoring for 1-3 days first
✅ Better: Monitoring for 5-7 days, include weekend traffic
```

### 2. Use Legitimate Bot Allowlist
```
❌ Bad: Block all bots indiscriminately
✅ Good: Allowlist Google, Bing, CloudFlare, etc.
✅ Better: Allowlist internal tools + public bots
```

### 3. Analyze Before Escalating
```
❌ Bad: Switch to Blocking without review
✅ Good: Review events, identify false positives first
✅ Better: Run security team review before escalation
```

### 4. Coordinate with Application Team
```
✅ Good: Notify before enabling
✅ Better: Daily syncs during Monitoring period
✅ Excellent: Joint decision with application owner
```

---

## Next Steps

After successfully deploying bot defense:

1. **Continue Monitoring**: Daily reviews for first week
2. **Adjust as Needed**: Fine-tune false positives
3. **Layer Additional Security**:
   - Rate Limiting (for API abuse)
   - WAF (for attack payloads)
   - API Protection (for API-specific threats)
4. **Set Up Alerts**: For unusual bot patterns
5. **Regular Reviews**: Monthly tuning of bot detection

---

## Escalation Path

```
Bot Defense Deployment Timeline:

Day 1: Enable in Monitoring mode
Day 1-3: Analyze bot detection events
Day 3: Adjust settings if needed
Day 3-5: Fine-tune allowlist + settings
Day 5-7: Escalate to Blocking (if ready)
Day 7+: Ongoing monitoring and tuning
```

---

## Related Documentation

- **Bot Defense Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/bot-defense
- **Bot Defense Policies**: https://docs.cloud.f5.com/docs-v2/how-to/security/bot-defense-policy
- **Bot Detection Methods**: https://docs.cloud.f5.com/docs-v2/how-to/security/bot-detection-methods
- **Allowed Bots List**: https://docs.cloud.f5.com/docs-v2/how-to/security/bot-allowlist
- **Event Analysis**: https://docs.cloud.f5.com/docs-v2/how-to/security/bot-defense-events
- **Advanced Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/security/bot-defense-advanced

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24
