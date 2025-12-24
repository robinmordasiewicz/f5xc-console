---
title: Workflow - Manage Resource Quotas
description: Monitor and manage tenant resource quotas (CPU, memory, storage, bandwidth, connections)
version: 1.0.0
last_updated: 2025-12-24
category: Administration
complexity: Beginner
estimated_duration: 10-15 minutes
---

# Workflow: Manage Resource Quotas

## Overview
Monitor tenant resource quotas and capacity utilization. View current quota limits for CPU, memory, storage, bandwidth, and concurrent connections. Request quota increases when approaching limits. Plan capacity based on growth projections and usage trends.

## Prerequisites
- ✅ Tenant administrator account with quota management permissions
- ✅ Understanding of resource types and usage patterns
- ✅ Capacity planning baseline (current vs projected usage)

## Input Parameters

```json
{
  "resource_type": "cpu",
  "current_usage": 75,
  "current_limit": 100,
  "requested_limit": 150,
  "justification": "Scaling for Q1 campaign, expected 40% traffic increase",
  "usage_trend": "increasing",
  "priority": "standard"
}
```

## Step-by-Step Execution

### Step 1: Navigate to Quota Management

**Console Path**: Administration > Quotas and Capacity OR System > Resource Quotas

**Details**:
- Click "Administration" in left sidebar (or "System")
- Click "Quotas and Capacity" submenu
- Should see overview of all resource quotas

**Verify**: Quotas and Capacity page displayed

---

### Step 2: View Quota Overview

**Details**:

1. Dashboard shows current resource utilization:
   - **CPU**: Usage vs Limit (e.g., 75 / 100 cores)
   - **Memory**: Usage vs Limit (e.g., 512 / 1000 GB)
   - **Storage**: Usage vs Limit (e.g., 450 / 500 GB)
   - **Bandwidth**: Usage vs Limit (e.g., 80 / 100 Gbps)
   - **Connections**: Current concurrent vs Limit

2. Color coding:
   - 🟢 Green: < 70% of quota (safe)
   - 🟡 Yellow: 70-85% of quota (review needed)
   - 🔴 Red: > 85% of quota (action required)

3. Click specific resource for detailed view

**Verify**: Current usage levels visible

---

### Step 3: Review Resource Usage Trends

**Details**:

1. Look for **Usage Trends** or **Historical View** section
2. View usage over time:
   - Last 7 days
   - Last 30 days
   - Last 90 days

3. Identify patterns:
   - **Steady increase**: Growing demand, plan ahead
   - **Seasonal spikes**: Peak periods requiring surge capacity
   - **Consistent usage**: Stable, unlikely to exceed soon
   - **Sharp increase**: Possible incident or unexpected growth

4. Example analysis:
   ```
   CPU Usage Trend:
   ├─ 30 days ago: 40% (40/100 cores)
   ├─ 14 days ago: 55% (55/100 cores)
   ├─ 7 days ago:  68% (68/100 cores)
   ├─ Today:       75% (75/100 cores)
   └─ Trend: Steady increase, 35 cores used in 30 days
              at current rate (1.17 cores/day)
              will hit limit in ~21 days
   ```

5. Document findings in spreadsheet or notes

**Verify**: Trend analysis complete

---

### Step 4: Assess Capacity Planning

**Details**:

1. **Compare with projections**:
   - What was forecasted vs actual usage?
   - Are growth assumptions correct?

2. **Calculate future needs**:
   - Current usage: 75 cores
   - Current limit: 100 cores
   - Available headroom: 25 cores
   - Weekly growth rate: 2 cores/week
   - Time to limit: ~12 weeks (3 months)

3. **Plan for growth**:
   - Q1 campaign impact: +40% traffic expected
   - Estimated new usage: 75 × 1.4 = 105 cores
   - Required headroom: +30 cores (safety buffer)
   - Recommended new limit: 135 cores minimum

4. **Document justification**:
   - Business drivers (campaigns, product launches)
   - Growth projections with confidence level
   - Risk of not increasing (service degradation, customer impact)
   - Timeline of increase (before or after peak period?)

**Verify**: Capacity planning completed

---

### Step 5: Request Quota Increase (If Needed)

**Details** (if usage approaching limit):

1. Click **"Request Quota Increase"** or **"Manage Quotas"** button

2. Fill in request form:
   - **Resource Type**: Select (CPU, Memory, Storage, Bandwidth, Connections)
   - **Current Limit**: Auto-populated (100 cores)
   - **Requested Limit**: Enter (150 cores)
   - **Justification**: Provide business reason
     ```
     "Scaling for Q1 campaign expecting 40% traffic increase.
      Current usage 75 cores, projected 105 cores needed.
      Added 30-core buffer for safety. Limit increase needed
      before campaign launch on 2025-01-15."
     ```
   - **Timeline**: Select (immediate, before [date], standard)
   - **Priority**: Select (standard, expedited, critical)

3. Review request summary
4. Click **"Submit Request"** or **"Save"**

**Expected**: Quota increase request submitted

---

### Step 6: Monitor Request Status

**Details**:

1. Return to Quotas page
2. Find "Pending Requests" or "Quota Requests" section
3. Look for submitted request:
   - **Status**: Submitted / Reviewing / Approved / Denied
   - **Requested Amount**: 150 cores
   - **Requested Date**: Shows when submitted
   - **Expected Decision**: 1-3 business days for standard

4. If approved:
   - New limit immediately available
   - Notification sent via email
   - Update capacity planning

5. If denied:
   - Review reason
   - Consider phased approach (smaller increase)
   - Contact F5 support if needed

**Verify**: Request status monitored

---

### Step 7: Monitor Usage Post-Increase

**Details** (after quota increase):

1. Return to Quotas page after approval
2. Verify new limit reflected:
   - CPU: 150 cores (from 100)
   - Status: 🟢 Green (50% available headroom)

3. Set up monitoring:
   - Weekly review of usage trends
   - Alert if approaching 85% of new limit (127.5 cores)
   - Review projections monthly

4. Plan next increase if needed:
   - If growth continues at 2 cores/week
   - Will hit 127.5 cores in ~28 weeks
   - Request increase proactively (at ~100 cores, 2-3 months early)

**Verify**: Usage monitoring configured

---

### Step 8: Analyze Quota Utilization by Resource

**Details** (for comprehensive planning):

1. Break down usage by resource type:

   | Resource | Usage | Limit | % Used | Trend | Action |
   |----------|-------|-------|--------|-------|--------|
   | CPU | 75 | 100 | 75% | ↑ Growing | Request increase |
   | Memory | 512 | 1000 | 51% | → Stable | Monitor |
   | Storage | 450 | 500 | 90% | ↑ Growing | Request increase URGENT |
   | Bandwidth | 80 | 100 | 80% | → Stable | Review peak times |
   | Connections | 8000 | 10000 | 80% | ↑ Increasing | Plan ahead |

2. Prioritize requests:
   - **URGENT**: Storage at 90%, Connections at 80%
   - **HIGH**: CPU at 75%, growing trend
   - **MONITOR**: Memory at 51%, bandwidth at 80%

3. Submit batch request if multiple resources approaching limits:
   - More efficient than individual requests
   - Better for capacity planning review

**Verify**: Resource utilization analyzed

---

### Step 9: Document Quota Changes and Decisions

**Details**:

1. Create capacity planning document:
   ```
   Quota Management Record
   ├─ Date: 2025-12-24
   ├─ Reviewed by: [admin name]
   ├─ Current State:
   │  ├─ CPU: 75/100 (75%)
   │  ├─ Memory: 512/1000 (51%)
   │  ├─ Storage: 450/500 (90%)
   │  └─ Bandwidth: 80/100 (80%)
   ├─ Trends:
   │  ├─ CPU: +2 cores/week (steady increase)
   │  └─ Storage: +5 GB/week (steady increase)
   ├─ Projections (90 days):
   │  ├─ CPU: 105 cores needed
   │  ├─ Storage: 525 GB needed
   │  └─ Timeline: All limits exceeded in <90 days
   ├─ Actions Taken:
   │  ├─ Submitted CPU increase: 100 → 150 cores
   │  └─ Submitted Storage increase: 500 → 600 GB
   ├─ Next Review: 2026-01-24 (30 days)
   └─ Notes: Plan for 40% growth in Q1, monitor closely
   ```

2. Share with team:
   - Capacity planning lead
   - DevOps team
   - Finance (cost implications)

3. Set calendar reminder: 30 days for next review

**Verify**: Documentation complete

---

### Step 10: Plan Quota Increase Schedule

**Details**:

1. **Establish quarterly review schedule**:
   - Q1 Review: January (done, new limits 150/600)
   - Q2 Review: April (if growth continues, plan summer campaign)
   - Q3 Review: July (post-summer peak, stabilize)
   - Q4 Review: October (plan for year-end peak)

2. **Proactive increase strategy**:
   - Request increases at ~80% utilization
   - Allow 1-2 weeks for approval
   - Don't wait until at limit (prevents service disruption)

3. **Communicate with stakeholders**:
   - Product team: expected growth from features
   - Sales: new customer commitments affecting capacity
   - Finance: quota increase = service cost increase

4. **Example timeline**:
   ```
   Jan 2025: CPU 100 → 150 cores (current)
   Apr 2025: If at 120 cores, request 180 cores
   Jul 2025: If stable at 150, maintain
   Oct 2025: Plan for Black Friday/Cyber Monday surge
   ```

**Verify**: Quota increase schedule planned

---

## Validation with CLI

**Command**: Verify quota status and usage

```bash
# Get quota overview
xcsh administration get quotas

# Expected output:
# Resource | Usage | Limit | %Used | Trend
# CPU      | 75    | 150   | 50%   | Stable
# Memory   | 512   | 1000  | 51%   | Stable
# Storage  | 450   | 600   | 75%   | Increasing

# Get detailed usage by resource type
xcsh health monitor resources --detailed

# Expected: Breakdown of usage by namespace and service

# Check pending quota requests
xcsh administration list quota_requests

# Expected: Any pending increase requests and status
```

---

## Success Criteria

- [x] Quota overview reviewed
- [x] Usage trends analyzed
- [x] Capacity planning completed
- [x] Quota increase requests submitted (if needed)
- [x] Request status monitored
- [x] Usage monitoring configured
- [x] All resources assessed for capacity
- [x] Planning documented and scheduled

---

## Common Issues & Troubleshooting

### Issue: Approaching Quota Limit Too Quickly

**Symptoms**:
- Usage growing faster than expected
- May hit limit before quota increase approved
- Approaching 90%+ utilization

**Solutions**:

1. **Immediate actions**:
   - Submit expedited quota increase request
   - Mark as "critical" priority
   - Contact F5 support for acceleration
   - Contact account manager

2. **Capacity reduction** (temporary):
   - Disable non-essential services
   - Stop non-critical deployments
   - Archive old logs/metrics

3. **Short-term measures**:
   - Optimize resource usage (e.g., container right-sizing)
   - Cache frequently accessed data
   - Load balance across resources

4. **Prevent future issues**:
   - Use larger increase when requesting (+50% vs +20%)
   - Review projections quarterly, not annually
   - Set alerts at 70% utilization threshold

---

### Issue: Quota Increase Request Denied

**Symptoms**:
- Request rejected or pending indefinitely
- Reason not clearly provided
- Need urgent increase

**Solutions**:

1. **Review denial reason**:
   - Account limitations
   - Service availability (regional constraints)
   - Billing issues
   - Contract restrictions

2. **Escalate appropriately**:
   - Contact account manager
   - F5 Support ticket with business justification
   - Executive sponsorship if critical

3. **Phased approach**:
   - Request smaller increase first
   - Demonstrate proper usage of current quota
   - Request larger increase once approved

4. **Address root cause**:
   - Optimize usage (reduce quota need)
   - Adjust growth projections if unrealistic
   - Align with contract terms

---

### Issue: Unused Quota / Overprovisioned

**Symptoms**:
- Reserved quota but not using it
- Paying for capacity not needed
- Storage quota at 20% utilization

**Solutions**:

1. **Analyze usage patterns**:
   - Are projections too conservative?
   - Is feature adoption slower than expected?
   - Seasonal variation (low in off-season)?

2. **Right-size quotas** (if possible):
   - Some quotas can be reduced (check terms)
   - May trigger contract renegotiation
   - Cost savings may offset administrative effort

3. **Future planning**:
   - Use actual data for next projections
   - Adjust growth rate assumptions
   - Plan increases more granularly

4. **Monitor for cost optimization**:
   - Review quota costs quarterly
   - Consider tiered pricing if available
   - Evaluate reserved capacity vs on-demand

---

## Best Practices

### 1. Proactive Quota Management
```
❌ Bad: Wait until quota limit reached
✅ Good: Request increase at 80% utilization
✅ Better: Request increase 1-2 months early based on trend
```

### 2. Accurate Projections
```
❌ Bad: Guess future growth
✅ Good: Base projections on historical trends
✅ Better: Account for seasonal variation + business initiatives
```

### 3. Safety Buffers
```
❌ Bad: Request exactly what you need
✅ Good: Add 20% buffer for growth
✅ Better: Add 30% + seasonal peak consideration
```

### 4. Documentation
```
✅ Good: Record quota history
✅ Better: Document justification for each increase
✅ Excellent: Link to business drivers (campaigns, launches)
```

---

## Quota Increase Recommendations by Scenario

| Scenario | Current Usage | Request Amount | Rationale |
|----------|---------------|-----------------|-----------|
| Steady Growth | 75/100 (75%) | +50 to 150 | Growth trend continues 3+ months |
| Seasonal Peak | 65/100 (65%) | +25 to 125 | Peak season approaching in 2 months |
| New Feature | 50/100 (50%) | +30 to 80 | Feature launch expected in 1 month |
| Campaign | 60/100 (60%) | +50 to 110 | Marketing campaign +40% traffic |
| Scaling Event | 85/100 (85%) | +100 to 185 | Urgent, approaching limit, expedite |

---

## Next Steps

After managing quotas:

1. **Set calendar reminder**: 30 days for next quarterly review
2. **Configure monitoring**: Alerts at 70% and 85% utilization
3. **Update projections**: Incorporate latest trends and business plans
4. **Communicate**: Share capacity plan with stakeholders
5. **Optimize**: If over-provisioned, analyze usage patterns

---

## Related Documentation

- **Quota Limits Overview**: https://docs.cloud.f5.com/docs-v2/platform/quotas-limits
- **Capacity Planning Guide**: https://docs.cloud.f5.com/docs-v2/how-to/administration/capacity-planning
- **Resource Monitoring**: https://docs.cloud.f5.com/docs-v2/how-to/administration/resource-monitoring
- **Tenant Limits and Constraints**: https://docs.cloud.f5.com/docs-v2/platform/tenant-limits

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24
