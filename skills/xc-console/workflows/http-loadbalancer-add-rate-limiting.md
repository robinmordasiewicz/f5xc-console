---
title: Workflow - Add Rate Limiting to HTTP Load Balancer
description: Configure rate limiting on HTTP load balancer to prevent API abuse and resource exhaustion
version: 1.0.0
last_updated: 2025-12-24
category: Traffic Management
complexity: Intermediate
estimated_duration: 20-25 minutes
---

# Workflow: Add Rate Limiting to HTTP Load Balancer

## Overview
Configure rate limiting on HTTP load balancer to prevent API abuse, brute force attacks, and resource exhaustion. Rate limiting controls request volume per client/endpoint/global to ensure fair usage and application stability.

## Prerequisites
- ✅ HTTP load balancer already created and active
- ✅ Normal traffic patterns established (baseline metrics available)
- ✅ API endpoints documented with expected request rates
- ✅ Understanding of legitimate vs abusive traffic patterns
- ✅ Clear definition of rate limit thresholds

## Input Parameters

```json
{
  "http_loadbalancer_name": "my-app-lb",
  "namespace": "production",
  "rate_limiting_enabled": true,
  "rate_limits": [
    {
      "name": "global-limit",
      "scope": "global",
      "requests_per_second": 10000,
      "burst_size": 2000,
      "action": "block"
    },
    {
      "name": "per-client-api",
      "scope": "per_client",
      "requests_per_second": 100,
      "burst_size": 50,
      "action": "block",
      "applies_to": "/api/*"
    },
    {
      "name": "login-brute-force",
      "scope": "per_client",
      "requests_per_second": 5,
      "burst_size": 2,
      "action": "block",
      "applies_to": "/login"
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
- Find and click on "my-app-lb" in the list

**Verify**: HTTP load balancer details page displayed

---

### Step 2: Click Edit Button

**Details**:
- Look for "Edit" button (usually top right)
- Click to open HTTP LB edit form
- Should load configuration

**Verify**: Edit form displayed

---

### Step 3: Navigate to Rate Limiting Section

**Details**:

1. Look for **Traffic Management** or **Rate Limiting** section
2. May be under:
   - Advanced options
   - Traffic Management section
   - Rate Limiting tab
3. Should see options:
   - Enable Rate Limiting (checkbox)
   - Rate Limiting Policy (dropdown)
   - Custom rules editor

**Verify**: Rate Limiting section found and accessible

---

### Step 4: Enable Rate Limiting

**Details**:

1. Check **"Enable Rate Limiting"** checkbox
2. Should activate and reveal:
   - Rate limiting policy selection
   - Custom rules option
   - Advanced settings

**Verify**: Rate Limiting enabled, options available

---

### Step 5: Select or Create Rate Limiting Policy

**Details**:

1. Look for **Rate Limiting Policy** dropdown
2. Options:
   - "default-rate-limiting" (standard policy, recommended)
   - "api-rate-limiting" (for APIs)
   - "brute-force-protection" (for login endpoints)
   - Custom policies
   - "Create New Policy"

3. Select **"default-rate-limiting"** for general use
   - Includes sensible defaults:
     - Global limit: ~10,000 req/sec
     - Per-client limit: ~100 req/sec
     - Burst allowance: 20-50% of limit

**Verify**: Rate limiting policy selected

---

### Step 6: Configure Global Rate Limit

**Details** (if custom configuration available):

1. Look for **Global Rate Limit** setting
2. Set limits:
   - **Requests Per Second**: Total application capacity
     - Small app: 1,000 req/sec
     - Medium app: 10,000 req/sec
     - Large app: 50,000+ req/sec

   - **Burst Size**: Temporary spike allowance
     - Usually 10-50% of RPS limit
     - Example: 10,000 RPS → 1,000-2,000 burst

   - **Action on Limit**: What to do when limit exceeded
     - "Block": Return 429 Too Many Requests
     - "Queue": Hold requests, process in order
     - "Drop": Silently reject requests

3. Set **Action**: "Block" (returns 429, informative to client)

**Typical Configuration**:
- RPS: Current peak traffic × 1.2 (20% headroom)
- Burst: Peak × 0.2 (handle traffic spikes)
- Action: Block

**Verify**: Global rate limit configured

---

### Step 7: Configure Per-Client Rate Limit

**Details**:

1. Look for **Per-Client Rate Limit** setting
2. Per-client scope means "per IP address"
3. Set limits:
   - **Requests Per Second Per Client**: Fair-use limit
     - Public API: 50-100 req/sec per client
     - Private API: 100-1,000 req/sec per client
     - User-facing app: 10-50 req/sec per client

   - **Burst Size**: Brief spike allowance
     - Usually 20-50% of RPS limit

   - **Client Identifier**: How to identify clients
     - "IP Address" (default, simple)
     - "User ID" (if authenticated)
     - "API Key" (if API-based)

4. Set **Action**: "Block" (returns 429)

**Example Setup**:
- Standard clients: 100 req/sec, 20 burst
- Authenticated clients: 1,000 req/sec, 200 burst
- Public data endpoints: 50 req/sec, 10 burst

**Verify**: Per-client rate limit configured

---

### Step 8: Configure Endpoint-Specific Rate Limits

**Details** (optional, for sensitive endpoints):

If available, create specific limits for sensitive endpoints:

1. **Login/Authentication Endpoint** (`/login`, `/auth`)
   - RPS per client: 5 req/sec (prevent brute force)
   - Burst: 2
   - Action: Block
   - Rationale: Login shouldn't need rapid requests

2. **API Search Endpoint** (`/api/search`)
   - RPS per client: 50 req/sec
   - Burst: 10
   - Action: Block
   - Rationale: Searches are expensive, prevent scraping

3. **Report Generation** (`/api/reports`)
   - RPS per client: 5 req/sec
   - Burst: 2
   - Action: Block
   - Rationale: Reports are resource-intensive

4. **Public APIs** (`/api/public/data`)
   - RPS per client: 100 req/sec
   - Burst: 20
   - Action: Block
   - Rationale: Public endpoints can handle higher load

**Format**:
```
Endpoint Pattern: /login
Rate: 5 req/sec per client
Burst: 2
Action: Block
```

**Verify**: Endpoint-specific limits configured

---

### Step 9: Configure Whitelist (Optional)

**Details**:

1. Look for **Whitelist** or **Bypass Rules** option
2. Add exceptions for:
   - Internal monitoring systems
   - Legitimate bulk API consumers
   - Partner integrations

3. Whitelist entries:
   - **IP Address**: 10.0.0.0/8 (internal)
   - **User Agent**: Monitoring tool name
   - **API Key**: Trusted consumer key

**Important**: Whitelist sparingly to avoid abuse

**Verify**: Whitelist configured (or skipped if not needed)

---

### Step 10: Set Response Actions

**Details** (optional):

1. Look for **Rate Limit Response** settings
2. Configure what happens when limit exceeded:
   - **HTTP Status Code**: 429 (default, correct)
   - **Response Body**: Custom message (optional)
     - Example: `{"error": "Rate limit exceeded", "retry_after": 60}`
   - **Retry-After Header**: Include retry timing
     - Allows clients to know when to retry

3. Recommended:
   - Status: 429 Too Many Requests
   - Include: Retry-After header
   - Optional: Custom message body

**Verify**: Response actions configured

---

### Step 11: Review and Save

**Details**:

1. Scroll through to verify all settings:
   - Rate Limiting: Enabled ✓
   - Policy: Selected ✓
   - Global limit: Configured ✓
   - Per-client limit: Configured ✓
   - Endpoint limits: Configured (if applicable) ✓
   - Whitelist: Configured (if applicable) ✓
   - Response actions: Set ✓

2. Look for **"Save and Exit"** or **"Save"** button
3. Click to save changes
4. Should redirect to HTTP LB list page

**Expected**: HTTP LB updated with rate limiting enabled

---

### Step 12: Verify Rate Limiting Active

**Details**:

1. Back on HTTP LB list, find "my-app-lb"
2. Click on it to view details
3. Look for **Rate Limiting** section
4. Verify:
   - Status: "Enabled" ✓
   - Policy: Selected policy name ✓
   - Limits: Displayed ✓

**Verify**: Rate limiting settings confirmed

---

### Step 13: Monitor Rate Limiting Events

**Console Path**: Security > Events OR Traffic Management > Events

**Details**:

1. Navigate to Events dashboard
2. Filter by:
   - **Type**: "Rate Limit" or "Traffic"
   - **Policy**: "my-app-lb"
   - **Date**: Last 24 hours

3. Review events:
   - Rate limit hit count
   - Which clients triggered limits
   - Which endpoints most limited
   - Actions taken (blocks, etc.)

4. Assess:
   - Are legitimate clients being limited?
   - Are abusive clients being blocked?
   - Are limits appropriate?

**Verify**: Rate limiting events visible

---

### Step 14: Analyze and Adjust Limits

**Details** (after 24 hours of monitoring):

1. **Check rate limit hit rate**:
   - If legitimate clients hitting limits → RPS too low, increase
   - If no limits hit → Limits fine or too high
   - If abusive traffic hit limits → Limits working correctly

2. **Adjust global limit** (if needed):
   - Monitor: Peak traffic req/sec
   - If legitimate traffic > global limit → Increase global limit
   - If significant headroom → Limit is appropriate

3. **Adjust per-client limit** (if needed):
   - If legitimate client blocked → Increase per-client limit
   - If abusive client bypassing → Decrease limit
   - Target: Block abuse, allow legitimate use

4. **Adjust endpoint limits** (if needed):
   - Login endpoint: If legitimate logins blocked → Increase from 5 to 10 req/sec
   - Search endpoint: If search function blocked → Increase from 50 to 100 req/sec
   - Public API: If high-volume apps limited → Increase appropriately

**Example Adjustment**:
- Initial: 5 req/sec login limit
- Day 1: No blocks observed
- Assessment: Legitimate, increase to 10 req/sec (still protective)

**Verify**: Rate limits adjusted appropriately

---

## Validation with CLI

**Command**: Verify rate limiting configuration

```bash
# Get HTTP LB with rate limiting details
xcsh configuration get http_loadbalancer my-app-lb -n production

# Expected output:
# - Name: my-app-lb
# - Rate Limiting: Enabled
# - Global Limit: X req/sec
# - Per-Client Limit: Y req/sec
# - Policies: List of rate limiting rules

# Get rate limiting events
xcsh security events list --http-lb my-app-lb --filter rate_limit --duration 24h

# Expected output:
# Rate limiting events, hit counts, actions taken
```

---

## Success Criteria

- [x] Rate limiting enabled on HTTP LB
- [x] Rate limiting policy selected and configured
- [x] Global rate limit set appropriately
- [x] Per-client rate limit configured
- [x] Endpoint-specific limits configured (optional)
- [x] Whitelist configured (if applicable)
- [x] Rate limiting events visible
- [x] Limits adjusted based on monitoring

---

## Common Issues & Troubleshooting

### Issue: Legitimate Clients Getting Rate Limited

**Symptoms**:
- Legitimate users seeing 429 Too Many Requests
- Legitimate API clients unable to function
- Business impact from blocked requests

**Solutions**:
1. **Identify legitimate high-volume clients**:
   - Review rate limit events
   - Identify which clients hitting limits
   - Are they legitimate or malicious?

2. **Increase rate limits** (if legitimate):
   - Edit HTTP LB
   - Increase per-client limit
   - Example: 100 → 500 req/sec

3. **Add to whitelist** (if special client):
   - Add legitimate client IP to whitelist
   - Add legitimate API key to whitelist
   - Bypass rate limiting for trusted sources

4. **Create endpoint-specific lower limit**:
   - Don't increase global limit for one client
   - Instead, create specific high limit for known client
   - Keep global limits for protection

5. **Adjust burst size**:
   - If client has legitimate traffic bursts
   - Increase burst allowance
   - Example: burst 50 → 200 (allows bigger spikes)

---

### Issue: Rate Limiting Not Stopping Abusive Traffic

**Symptoms**:
- Obvious attack traffic not being blocked
- Rate limits seem ineffective
- High-volume abuse continuing

**Solutions**:
1. **Verify rate limiting is enabled**:
   - Edit HTTP LB
   - Check "Enable Rate Limiting" is checked
   - Verify policy is selected

2. **Check action is "Block"**:
   - If action is "Queue" or "Drop", limits enforced but not obvious
   - Change to "Block" for clear 429 responses
   - Verify change saved

3. **Verify limit thresholds**:
   - Review configured limits
   - May be set too high for actual attack
   - Attack RPS > limit? If so, increase limit... wait, no
   - Instead: Verify limit is appropriate, may need lower limit

4. **Check if attacker is bypassing**:
   - Using different IPs (distributed attack)
   - Using legitimate-looking patterns
   - Rate limiting alone may not be sufficient
   - Add WAF or bot defense for additional protection

5. **Review logs**:
   - Are blocks actually happening?
   - Check HTTP logs for 429 responses
   - Verify blocking is recorded in events

---

### Issue: Performance Impact from Rate Limiting

**Symptoms**:
- Latency increased after enabling rate limiting
- Slower response times
- Rate limiting processing overhead noticeable

**Solutions**:
1. **Verify rate limiting is cause**:
   - Disable rate limiting temporarily
   - Check if latency returns to normal
   - If yes, rate limiting is the cause

2. **Optimize rate limiting configuration**:
   - Reduce number of rules/limits
   - Simplify per-client identification
   - Disable advanced features if not needed

3. **Adjust limit thresholds**:
   - Higher limits = less processing overhead
   - Lower limits = more tracking overhead
   - Find balance: Security vs performance

4. **Use simple limits**:
   - Global + per-client (2 rules)
   - Avoid many endpoint-specific limits
   - More rules = more processing

5. **Scale infrastructure**:
   - May need more resources
   - Contact F5 about rate limiting node scaling
   - Dedicated rate limiting appliances available

---

### Issue: Users Getting False Positives (429 Errors)

**Symptoms**:
- Normal users randomly getting 429 errors
- Application experiencing intermittent failures
- Legitimate traffic blocked unexpectedly

**Solutions**:
1. **Check burst size**:
   - Burst too small for legitimate spikes
   - Increase burst allowance
   - Example: 20 → 50 (40% → 100% of limit)

2. **Review traffic patterns**:
   - Peak traffic times exceeding limit?
   - Batch operations causing bursts?
   - Legitimate patterns being blocked?

3. **Increase limit temporarily**:
   - If unsure, increase global and per-client limits
   - Monitor for 24 hours
   - Gradually decrease to find appropriate level

4. **Identify traffic type**:
   - Web browser traffic (bursty): Higher burst size
   - API traffic (steady): Higher RPS limit
   - Batch operations: Much higher burst size

5. **Test with realistic traffic**:
   - Generate test load matching expected traffic
   - Monitor 429 rate
   - Adjust until 429 rate acceptable (< 0.1%)

---

## Best Practices

### 1. Start Conservative
```
❌ Bad: Very low limits that block legitimate traffic immediately
✅ Good: Limits set at 120% of current peak traffic
✅ Better: Limits set at 150% of peak, progressively lower over time
```

### 2. Monitor Before Deciding
```
❌ Bad: Set limits without knowing traffic patterns
✅ Good: Establish baseline traffic metrics first
✅ Better: 1-week baseline including all traffic types
```

### 3. Endpoint-Specific is Better
```
❌ Bad: Single global rate limit for entire application
✅ Good: Global + per-client limits
✅ Better: Endpoint-specific limits for sensitive operations
```

### 4. Whitelist Carefully
```
❌ Bad: Whitelist everything, defeating protection
✅ Good: Whitelist only truly trusted sources
✅ Better: Whitelist and log, monitor for abuse
```

---

## Next Steps

After successfully configuring rate limiting:

1. **Continue Monitoring**: Daily reviews for first week
2. **Adjust Thresholds**: Fine-tune based on traffic patterns
3. **Add Complementary Security**:
   - Bot Defense (stop automated abuse)
   - API Protection (prevent API-specific abuse)
   - WAF (block attack payloads)
4. **Set Up Alerts**: For unusual rate limit events
5. **Document Limits**: For operations team and API consumers

---

## Rate Limiting Best Practices by Use Case

### Public API
```
Global: 100,000 req/sec
Per-Client: 100-500 req/sec (depending on API)
Burst: 20-50%
Whitelist: CDNs, monitoring
```

### Internal API
```
Global: 50,000 req/sec
Per-Client: 1,000-5,000 req/sec
Burst: 30-100%
Whitelist: Internal services
```

### E-Commerce Site
```
Global: 50,000 req/sec
Per-Client: 50-200 req/sec
Burst: 50-100% (handle checkout spikes)
Endpoint-Specific: /checkout (higher limit)
```

### User Authentication
```
Global: 10,000 req/sec
Per-Client: 5-10 req/sec (prevent brute force)
Burst: 2-5
Endpoint-Specific: /login (5 req/sec)
```

---

## Related Documentation

- **Rate Limiting Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/rate-limiting
- **Rate Limiting Policy**: https://docs.cloud.f5.com/docs-v2/how-to/traffic-management/rate-limiting-policy
- **Per-Client Limiting**: https://docs.cloud.f5.com/docs-v2/how-to/traffic-management/per-client-rate-limiting
- **Endpoint Rate Limits**: https://docs.cloud.f5.com/docs-v2/how-to/traffic-management/endpoint-rate-limiting
- **Rate Limit Events**: https://docs.cloud.f5.com/docs-v2/how-to/traffic-management/rate-limit-monitoring
- **Advanced Rate Limiting**: https://docs.cloud.f5.com/docs-v2/how-to/traffic-management/rate-limiting-advanced

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24
