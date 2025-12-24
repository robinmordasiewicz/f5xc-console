---
title: F5 Distributed Cloud Workflow Patterns
description: Common workflow patterns, decision trees, and automation sequences across all F5 XC resource types
version: 1.0.0
last_updated: 2025-12-24
source: documentation-index.md synthesis
---

# F5 Distributed Cloud Workflow Patterns

Master reference synthesizing recurring patterns across all F5 XC workflows, enabling intelligent workflow selection and execution.

---

## 1. Universal Workflow Patterns

### Pattern 1A: Create Resource (Standard)

**Applies To**: HTTP Load Balancer, Origin Pool, WAF Policy, DNS Load Balancer, Cloud Site

**Generic Sequence**:
```
1. Navigate to resource list page
2. Click "Add [Resource Type]" button
3. Fill Metadata section (Name, Namespace, Labels)
4. Fill Configuration section (resource-specific settings)
5. (Optional) Configure Advanced options
6. Submit form (Save and Exit or similar)
7. Verify resource appears in list
8. CLI validation (xcsh list command)
```

**Form Pattern**:
- **Always Required**:
  - Name (unique within namespace)
  - Namespace (isolation boundary)
  - Resource type defaults (e.g., HTTP protocol)
- **Common Optional**:
  - Labels (for filtering/organization)
  - Advanced settings
  - Custom configurations

**Success Criteria Pattern**:
- Resource appears in list with "ACTIVE" or "Ready" status
- CLI query returns resource with correct properties
- Dependent resources show correct associations

---

### Pattern 1B: Modify Resource (Edit/Update)

**Applies To**: All resource types

**Generic Sequence**:
```
1. Navigate to resource list
2. Click resource name or Edit button
3. Locate section to modify
4. Update field value
5. Submit form
6. Verify status remains ACTIVE
7. CLI validation for property change
```

**Common Modifications**:
- Add/remove security policies (WAF, Bot Defense)
- Change routing configuration
- Update health check settings
- Adjust load balancing algorithm
- Modify geolocation routing

**Safety Pattern**:
- Test in monitoring/non-blocking mode first
- Make incremental changes
- Verify no service disruption
- Review impact before production changes

---

### Pattern 1C: Delete Resource (Remove)

**Applies To**: All resource types

**Dependencies Before Delete**:
```
Before deleting, verify nothing references it:

HTTP Load Balancer:
  - DNS Load Balancers point to it? (remove reference first)
  - Cloud Sites route through it? (remove routes first)

Origin Pool:
  - HTTP Load Balancers reference it? (change to different pool first)

WAF Policy:
  - HTTP Load Balancers attach it? (detach first)

Cloud Site:
  - Routes configured through it? (remove routes first)
```

**Safe Delete Sequence**:
```
1. Find all references to resource (console search)
2. Remove or update references
3. Verify no dependencies remain
4. Delete resource from list
5. Confirm deletion dialog
6. Verify with CLI: xcsh list should not return resource
```

---

### Pattern 1D: Attach/Detach Policy

**Applies To**: WAF Policies, Bot Defense, Rate Limiting, Service Policies

**Applies To Which Resources**: HTTP Load Balancers (primary attachment point)

**Attach Sequence**:
```
1. Navigate to HTTP Load Balancer > Edit
2. Scroll to Security Policies section
3. Click policy dropdown
4. Select policy to attach
5. Choose enforcement mode (blocking/monitoring)
6. Save changes
7. Verify status remains ACTIVE
```

**Detach Sequence**:
```
1. Navigate to HTTP Load Balancer > Edit
2. Scroll to Security Policies section
3. Click policy dropdown
4. Select "None" or leave empty
5. Save changes
```

**Validation Pattern**:
- Policy attachment visible in LB details
- Events/logs show policy activity
- No errors in status

---

### Pattern 1E: Monitor/Verify Resource

**Applies To**: All resource types

**Monitor Pattern**:
```
1. Navigate to resource details page
2. View Status section (ACTIVE/INACTIVE/ERROR)
3. View Health section (if applicable)
   - Origin Pool: Endpoint health status
   - HTTP LB: Origin pool health, WAF attachment
   - DNS LB: Pool health and failover status
4. View Activity/Events (if available)
   - Security events (for WAF/Bot Defense)
   - Health check logs (for origin pools)
   - Query statistics (for DNS)
5. View Metrics (if available)
   - Traffic/QPS
   - Latency
   - Error rates
   - Security blocks/detections
```

**CLI Verification Pattern**:
```bash
# List resources
xcsh load_balancer list http_loadbalancer -n [namespace]

# Get resource details
xcsh load_balancer get http_loadbalancer [name] -n [namespace]

# View resource status and configuration
xcsh configuration get http_loadbalancer [name] -n [namespace]
```

---

## 2. Resource Creation Sequences

### Sequence 1: Single Region - Application Deployment

**Scenario**: Deploy web application in single region (US)

**Prerequisite Resources**:
- Namespace exists
- Backend servers deployed and running
- Backend has health check endpoint

**Execution Sequence**:
```
Step 1: Create Origin Pool
├─ Navigate to Web App & API Protection > Manage > Origin Pools
├─ Create pool named "backend-us"
├─ Add 3 backend server IPs
├─ Configure HTTP health check (/health endpoint)
├─ Verify: All endpoints show HEALTHY

Step 2: Create HTTP Load Balancer
├─ Navigate to Web App & API Protection > Manage > HTTP Load Balancers
├─ Create LB named "app-us"
├─ Add domain: app.example.com
├─ Select origin pool: backend-us
├─ Choose protocol: HTTPS with Automatic Certificate
├─ Verify: LB shows ACTIVE status
├─ CLI: xcsh load_balancer list http_loadbalancer -n production

Step 3: (Optional) Add WAF Protection
├─ Edit HTTP LB
├─ Scroll to Security Policies
├─ Attach: WAF policy (if created)
├─ Choose: Monitoring mode (for initial testing)
├─ Save and test

Step 4: (Optional) Add Bot Defense
├─ Edit HTTP LB
├─ Scroll to Security Policies
├─ Attach: Bot Defense policy
├─ Choose: Blocking mode
├─ Save

Step 5: Verify End-to-End
├─ Wait 30-60 seconds for DNS propagation
├─ Test: curl https://app.example.com/
├─ Verify: Healthy response from backend
├─ Check: Certificate valid (https)
```

**Typical Duration**: 5-10 minutes

**Success Criteria**:
- Origin pool shows all endpoints HEALTHY
- HTTP LB shows ACTIVE status
- DNS resolves to LB IP
- HTTPS connection works
- Traffic flows to origin pool
- WAF/Bot policies active (if attached)

---

### Sequence 2: Multi-Region - Global Application

**Scenario**: Deploy to US and EU with failover

**Prerequisite Resources**:
- 2 namespaces (production-us, production-eu)
- Backend servers in each region
- Domain registered with delegated nameservers

**Execution Sequence**:
```
Step 1: Region 1 (US) - Create Origin Pool
├─ Navigate to production-us namespace
├─ Create origin pool: backend-us
├─ Add 3 US-based server IPs
├─ Configure HTTP health check
├─ Verify: All endpoints HEALTHY

Step 2: Region 1 (US) - Create HTTP LB
├─ Create HTTP LB: api-lb-us
├─ Domain: api.example.com
├─ Origin pool: backend-us
├─ Protocol: HTTPS (Automatic Certificate)

Step 3: Region 2 (EU) - Create Origin Pool
├─ Switch to production-eu namespace
├─ Create origin pool: backend-eu
├─ Add 3 EU-based server IPs
├─ Configure HTTP health check
├─ Verify: All endpoints HEALTHY

Step 4: Region 2 (EU) - Create HTTP LB
├─ Create HTTP LB: api-lb-eu
├─ Domain: api.example.com
├─ Origin pool: backend-eu
├─ Protocol: HTTPS (Automatic Certificate)

Step 5: Create DNS Zone
├─ Navigate to Multi-Cloud Network Connect > DNS > Zones
├─ Create zone: example.com
├─ Switch domain registrar NS records to Volterra (24-48h)

Step 6: Create DNS Load Balancer with Geolocation Routing
├─ Navigate to DNS > Load Balancers
├─ Create DNS LB: api.example.com
├─ Add Pool 1: api-lb-us (Priority 1, North America)
├─ Add Pool 2: api-lb-eu (Priority 2, Europe)
├─ Add Pool 3: api-lb-us (Fallback for rest of world)
├─ Configure health checks (10s interval, 2 failures threshold)
├─ Save

Step 7: Verify End-to-End
├─ Wait for DNS propagation (24-48h)
├─ Test from US: nslookup api.example.com (should resolve to US IP)
├─ Test from EU: nslookup api.example.com (should resolve to EU IP)
├─ Simulate failover: Stop US region backend
├─ Verify DNS returns EU IP for all regions
├─ Restore US region
├─ Verify failback to US for North America
```

**Typical Duration**: 2-3 days (mostly waiting for DNS propagation)

**Success Criteria**:
- Both regions healthy and active
- DNS geolocation routing works (different IPs per region)
- Failover tested (DNS switches on region failure)
- Health checks detecting failures (<20 seconds)
- End-to-end HTTPS connectivity from both regions

---

### Sequence 3: Security-Hardened Deployment

**Scenario**: Deploy with comprehensive security (WAF, Bot Defense, Rate Limiting, API Protection)

**Prerequisite Resources**:
- Origin pool configured
- Security policies created
- API specification (for API protection)

**Execution Sequence**:
```
Step 1: Create HTTP Load Balancer (Base)
├─ Follow standard create HTTP LB sequence
├─ Use HTTPS with automatic certificate

Step 2: Create WAF Policy (if not pre-created)
├─ Navigate to Security > App Protection > WAF Policies
├─ Create policy with:
│  └─ Signature-based detection
│  └─ Threat campaigns enabled
│  └─ Enforcement: Monitoring (for tuning)

Step 3: Create Bot Defense Policy (if not pre-created)
├─ Navigate to Security > Bot Defense
├─ Create policy with:
│  └─ JavaScript challenge enabled
│  └─ Device fingerprinting enabled
│  └─ Enforcement: Blocking

Step 4: Create Rate Limiting Policy (if not pre-created)
├─ Navigate to Security > Rate Limiting
├─ Create policy with:
│  └─ Global limit: 1000 req/min
│  └─ Per-IP limit: 100 req/min
│  └─ Action: Block

Step 5: Attach Policies to HTTP LB
├─ Edit HTTP LB
├─ Attach WAF policy (Monitoring mode for tuning)
├─ Attach Bot Defense (Blocking mode)
├─ Attach Rate Limiting
├─ Save

Step 6: Test and Tune
├─ Normal traffic: Should pass through
├─ Attack patterns: Should be blocked/logged
├─ Review WAF events for false positives
├─ Adjust exclusion rules as needed
├─ Escalate WAF to Blocking after tuning period (1-7 days)

Step 7: Enable API Protection (if applicable)
├─ Upload OpenAPI specification
├─ Configure parameter validation
├─ Attach to HTTP LB
├─ Monitor for API validation events

Step 8: Final Verification
├─ Load testing (verify rate limiting works)
├─ Bot simulation (verify JS challenge works)
├─ WAF testing (verify attack signatures work)
├─ API testing (verify spec validation works)
├─ All legitimate traffic passes through
```

**Typical Duration**: 1-2 weeks (mostly tuning/testing phase)

**Success Criteria**:
- All policies attached and active
- Normal traffic unaffected
- Attack traffic blocked/logged
- No false positives on legitimate traffic
- Rate limiting functional
- Bot challenge prevents automated access
- API validation enforces schema

---

## 3. Decision Trees for Workflow Selection

### Decision Tree 1: Choose Load Balancing Algorithm

```
Question: What's the primary routing requirement?

├─ Equal distribution across backends?
│  └─ Answer: YES → Use Round Robin (default)
│
├─ Minimize latency from this request?
│  └─ Answer: YES → Use Least Connections
│
├─ Must route same session to same backend?
│  ├─ Stateful application (e.g., sessions)?
│  │  └─ Answer: YES → Use Ring Hash
│  └─ How to identify session?
│     ├─ By cookie?
│     │  └─ Use Hash Key: cookie name
│     └─ By header?
│        └─ Use Hash Key: header name
│
├─ Different backends different capacities?
│  └─ Answer: YES → Use Weighted or Ratio-Based
│     └─ Configure: Weight per endpoint (higher = more traffic)
│
└─ Simple random distribution acceptable?
   └─ Answer: YES → Use Random
```

---

### Decision Tree 2: Choose Enforcement Mode (WAF/Security)

```
Current State: WAF policy created, need to decide enforcement

├─ First deployment of WAF?
│  ├─ Answer: YES → Start with MONITORING
│  │  ├─ Review false positives for 1-7 days
│  │  ├─ Create exclusion rules
│  │  └─ Then escalate to BLOCKING
│  └─ Answer: NO → Continue to next decision
│
├─ Production application (critical)?
│  ├─ Answer: YES → Use BLOCKING
│  │  └─ Pre-tuned from monitoring phase
│  └─ Answer: NO → Consider MONITORING
│
├─ Accept some attacks through?
│  ├─ Answer: YES → Use RISK-BASED
│  │  └─ Block high-risk, allow medium/low
│  └─ Answer: NO → Use BLOCKING
│
└─ Just monitoring/logging attacks?
   └─ Answer: YES → Use MONITORING
      └─ No blocking, just event collection
```

---

### Decision Tree 3: Choose Load Balancing Scope

```
Question: Where should traffic be routed?

├─ Single region, multiple backends?
│  └─ Use: Origin Pool
│     └─ Attach to: HTTP Load Balancer
│
├─ Multiple regions, need global routing?
│  └─ Use: DNS Load Balancer
│     ├─ Route by: Geolocation
│     ├─ Or by: Latency
│     └─ Or by: Priority (failover)
│
├─ Need local routing within cloud site?
│  └─ Use: Origin Pool (local backend)
│     └─ Created within: Cloud Site context
│
├─ Need multi-cloud deployment?
│  └─ Use: Cloud Sites (per cloud provider)
│     └─ With: DNS Load Balancer (global routing)
│
└─ Need edge site deployment?
   └─ Use: Cloud Sites
      └─ Configure: Edge location networking
```

---

### Decision Tree 4: Namespace Design

```
Question: How to organize resources?

├─ Single application, single team?
│  └─ Use: One namespace (e.g., "production")
│
├─ Multiple applications?
│  ├─ Per-application isolation needed?
│  │  ├─ YES: Create namespace per app
│  │  │   └─ Example: app1, app2, app3
│  │  └─ NO: Share one namespace
│  └─ Or by environment?
│     ├─ YES: Create per environment
│     │   └─ Example: dev, staging, production
│     └─ NO: Single namespace
│
├─ Multiple teams?
│  └─ Create namespace per team
│     └─ Attach roles per team to namespace
│
├─ Compliance/data residency?
│  └─ Create namespace per region
│     └─ Example: us-namespace, eu-namespace
│
└─ Cost tracking by business unit?
   └─ Create namespace per unit
      └─ Set quotas per namespace
```

---

## 4. Form Field Patterns

### Pattern: Metadata Section (All Resources)

**Fields**:
- **Name**: Text input
  - Constraints: Unique per namespace, lowercase alphanumeric + dashes
  - Validation: Required, pattern: `^[a-z0-9-]+$`
  - Regex: Cannot start/end with dash

- **Namespace**: Dropdown select
  - Options: List of created namespaces
  - Validation: Required, pre-filled with default
  - Effect: Determines resource isolation and access control

- **Labels**: Key-value input
  - Format: key1=value1, key2=value2
  - Validation: Optional
  - Use: Resource filtering, organization, automation tagging

**Pattern**: Metadata is always first section, required fields

---

### Pattern: Network/Routing Section

**Fields**:
- **Domains** / **Record Name**: List input
  - Format: FQDN (e.g., example.com, api.example.com)
  - Validation: Required, valid domain format
  - Duplicate check: Must be unique across LBs

- **Protocol** / **Record Type**: Select dropdown
  - Options: Fixed set (HTTP, HTTPS, HTTPS-Auto, A, AAAA, CNAME, etc.)
  - Validation: Required
  - Mutually exclusive options sometimes

- **Port**: Number input
  - Default: 80 (HTTP), 443 (HTTPS)
  - Validation: 1-65535
  - Note: Some ports restricted by provider

- **Endpoints** / **Pools**: Select or list input
  - Format: Select from existing pools/endpoints
  - Validation: Required, must exist
  - Dependency: Pool must be healthy if required

**Pattern**: Network/routing is primary configuration

---

### Pattern: Security Section

**Fields**:
- **Policy Selection**: Dropdown
  - Options: None, existing policies, pre-defined policies
  - Validation: Optional (policy attachment is optional)
  - Dependencies: Policy must exist

- **Enforcement Mode**: Radio buttons
  - Options: Monitoring, Blocking, Risk-Based
  - Default: Blocking
  - Decision: Start Monitoring for new policies

- **Detection Method** (WAF specific): Checkboxes
  - Options: Signature-Based, Anomaly-Detection, Threat Campaigns
  - Validation: At least one required
  - Default: All enabled

**Pattern**: Security is optional but follows same structure

---

### Pattern: Advanced/Optional Section

**Fields**:
- **Health Check** (pools/DNS LBs):
  - Type: Dropdown (HTTP, HTTPS, TCP, UDP)
  - Path: Text (e.g., `/health`)
  - Port: Number
  - Interval: Number (seconds, usually 10)
  - Timeout: Number (seconds, usually 3)
  - Threshold: Number (consecutive failures)

- **Load Balancing Algorithm**: Dropdown
  - Options: Round Robin, Least Connections, Ring Hash, Weighted, Ratio, Random
  - Default: Round Robin
  - Decision: Choose based on use case

- **Geolocation/Regional**: Select multiple
  - Options: Regions/continents
  - Format: Map region → pool/endpoint
  - Example: North America → US-pool, Europe → EU-pool

**Pattern**: Advanced options follow standard control types

---

## 5. Error Patterns and Recovery

### Error: Origin Pool Unhealthy

**Symptoms**:
- HTTP LB shows warning (pool unhealthy)
- Traffic doesn't reach backends
- Health check failures in logs

**Causes**:
1. Backend servers down/not responding
2. Health check endpoint not configured
3. Firewall blocking health check port
4. Wrong port configured in health check
5. Wrong path in health check

**Recovery**:
```
Step 1: Verify backend is running
└─ SSH to backend server
└─ curl localhost:PORT/HEALTH_PATH
└─ Verify response is HTTP 200

Step 2: Verify port and path in health check
└─ Edit Origin Pool
└─ Check: Port matches backend listening port
└─ Check: Path exists on backend
└─ Check: Path returns 200 response

Step 3: Verify firewall allows health checks
└─ Backend security group/firewall allows port
└─ Network ACLs allow traffic
└─ No egress blocking

Step 4: Test connectivity
└─ From outside: telnet backend_ip PORT
└─ Should connect successfully
└─ From console: Click "Test Health Check" button (if available)

Step 5: Wait for health check grace period
└─ Health check interval: 10 seconds (default)
└─ Unhealthy threshold: 3 failures (default)
└─ Time to mark unhealthy: 30+ seconds

Step 6: Verify recovery
└─ Pool should show HEALTHY after fixes
└─ Traffic resumes to backends
```

---

### Error: HTTP LB Stuck Creating

**Symptoms**:
- LB status shows "Creating" for 5+ minutes
- DNS not resolving
- No traffic flowing

**Causes**:
1. Referenced origin pool doesn't exist
2. Referenced origin pool is unhealthy
3. TLS certificate issue (if manual)
4. Quota exceeded

**Recovery**:
```
Step 1: Verify origin pool exists
└─ Navigate to Origin Pools
└─ Confirm pool exists
└─ Confirm pool shows HEALTHY status

Step 2: Verify TLS certificate
└─ If manual HTTPS: Cert uploaded and valid
└─ If automatic: No action needed (ACME handles)

Step 3: Check quotas
└─ Navigate to Administration > Quotas
└─ Verify: Not at HTTP LB limit
└─ If at limit: Delete unused LBs or increase quota

Step 4: Delete and recreate
└─ Edit LB (if possible)
└─ Or: Delete stuck LB
└─ Wait 60 seconds
└─ Recreate with same configuration

Step 5: Check error logs
└─ Click on LB details
└─ Check "Status" section for error details
└─ Address specific error
```

---

### Error: WAF False Positives

**Symptoms**:
- Legitimate requests being blocked
- Legitimate users unable to access
- Security events show blocks of valid traffic

**Causes**:
1. Overly aggressive WAF rules
2. Application sending data matching attack patterns
3. User input containing special characters

**Recovery**:
```
Step 1: Verify false positive
└─ Review security events
└─ Identify blocked request
└─ Analyze: Is this legitimate traffic?
└─ Get: Attack signature name from event

Step 2: Create exclusion rule
└─ Navigate to WAF Policy > Exclusions
└─ Click: Add Exclusion
└─ Select: Attack signature (from step 1)
└─ Specify: Scope (URL path, parameter, header)
└─ Example:
   - Signature: SQL-Injection
   - Scope: /api/search?q=*
   - Effect: Exclude SQL-Injection check on q parameter

Step 3: Test exclusion
└─ Same request should now pass through
└─ Attack signatures still block actual attacks

Step 4: Monitor for regression
└─ Continue monitoring security events
└─ Verify: Exclusion rule working as expected
└─ Verify: Other attack signatures still blocking
```

---

## 6. Monitoring and Verification Patterns

### Pattern: Daily Verification Checklist

```
Daily Checks (5-10 minutes):

1. Resource Status
   ├─ Navigate to each namespace
   ├─ Verify: All resources show ACTIVE status
   ├─ Watch for: ERROR or UNHEALTHY status
   └─ Action if error: Investigate immediately

2. Origin Pool Health
   ├─ View: Origin Pools list
   ├─ Verify: All endpoints show HEALTHY
   ├─ Watch for: Any UNHEALTHY endpoints
   └─ Action if unhealthy: Verify backend/firewall

3. Traffic Metrics
   ├─ View: HTTP LB details > Metrics/Analytics
   ├─ Verify: Normal traffic levels
   ├─ Check: Error rate (should be <1%)
   └─ Watch for: Spike in errors

4. Security Events (if applicable)
   ├─ View: Security > Events
   ├─ Filter: Last 24 hours
   ├─ Review: Any suspicious patterns
   └─ Action if needed: Adjust WAF exclusions

5. DNS Health (if using DNS LB)
   ├─ View: DNS > Load Balancers
   ├─ Verify: All pools healthy
   ├─ Check: Failover events (should be rare)
   └─ Action if repeated failovers: Investigate
```

---

### Pattern: Weekly Review Checklist

```
Weekly Review (30-60 minutes):

1. Capacity and Quotas
   ├─ Check: Current resource usage
   ├─ Review: Quotas vs usage
   ├─ Action: Plan for scaling if >70% quota used
   └─ Update: Quotas if needed

2. Security Events Trend
   ├─ Review: WAF blocks by signature
   ├─ Identify: Most common attacks
   ├─ Analyze: False positive trends
   └─ Action: Adjust exclusion rules

3. Performance Metrics
   ├─ Review: Latency trends
   ├─ Check: Peak traffic times
   ├─ Analyze: Cache hit ratio (if enabled)
   └─ Action: Optimize if needed

4. Cost Analysis
   ├─ Review: Resource usage
   ├─ Identify: Highest cost components
   ├─ Action: Right-size if over-provisioned
   └─ Plan: Budget for next month

5. Failover Events (if applicable)
   ├─ Review: Any failovers occurred
   ├─ Analyze: Cause of failovers
   ├─ Action: Address root cause
   └─ Verify: Failover timing acceptable

6. Log and Audit Review
   ├─ Check: Access logs for anomalies
   ├─ Review: Configuration changes
   ├─ Verify: Authorized changes only
   └─ Document: Any anomalies found
```

---

## 7. Workflow State Transitions

### State Diagram: HTTP Load Balancer Lifecycle

```
Creating
    ↓
Active ←→ Editing
    ↓
Deleting
    ↓
Deleted


Active States:
├─ ACTIVE: Resource fully operational
├─ INACTIVE: Resource exists but disabled
├─ ERROR: Configuration or deployment error
├─ UPDATING: Configuration change in progress
└─ WARNING: Non-critical issue (e.g., health warning)


Transitions:
Create Flow:        Creating → Active (success) or Error (failure)
Update Flow:        Active → Updating → Active (success) or Error
Failover Flow:      Active (status warning) → INACTIVE (optional)
Delete Flow:        Active → Deleting → Deleted
Error Recovery:     Error → Fixed → Active
```

---

### State Diagram: Origin Pool Health Status

```
Unknown (new pool)
    ↓
Checking (health checks starting)
    ↓
Healthy (all endpoints healthy) ←→ Partial (some endpoints unhealthy)
    ↓
Unhealthy (all endpoints unhealthy)
    ↓
Deleted


Endpoint-Level States:
├─ HEALTHY: Passing health checks
├─ UNHEALTHY: Failed health check threshold
├─ CHECKING: Initial health check phase
└─ DISABLED: Manually disabled


Transition Timing:
├─ Healthy → Unhealthy: Unhealthy threshold × interval (usually 30+ seconds)
├─ Unhealthy → Healthy: Healthy threshold × interval (usually 10+ seconds)
└─ Manual disable: Immediate (takes effect on next request)
```

---

### State Diagram: WAF Enforcement Evolution

```
Creation
    ↓
Monitoring (recommended initial state)
    ├─ Policy attached but not blocking
    ├─ All events logged
    ├─ Review false positives
    ├─ Create exclusions
    ├─ Monitor for 1-7 days
    ↓
Blocking (after tuning)
    ├─ Policy blocks actual attacks
    ├─ False positives should be minimal
    ├─ Continue monitoring events
    ├─ Adjust exclusions as needed
    ↓
Risk-Based (optional advanced mode)
    ├─ Block high-risk attacks
    ├─ Allow medium/low-risk
    ├─ More granular control
    └─ For advanced WAF operators


Important: Always start with Monitoring for new policies
Never jump directly to Blocking
```

---

## 8. Template: Multi-Step Workflow Documentation

For any new workflow, document using this template:

```markdown
# Workflow: [Name]

## Prerequisites
- [Prerequisite 1]
- [Prerequisite 2]
- [Prerequisite 3]

## Input Parameters
```json
{
  "parameter_1": "description",
  "parameter_2": "description"
}
```

## Step-by-Step Execution

### Step 1: [Action]
- Navigate to: [Path in console]
- Action: [What to do]
- Verify: [How to confirm success]

### Step 2: [Action]
- [Same structure as Step 1]

## Success Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Validation (CLI)
```bash
# Verify the resource was created correctly
xcsh [command] get [resource-type] [name] -n [namespace]
```

## Rollback (if needed)
- Steps to undo if something goes wrong

## Monitoring
- What to watch after completion
- Typical timing for full propagation
```

---

## 9. Common Workflow Combinations

### Combination 1: Complete Application Deployment (No Security)

```
1. Create namespace (if needed)
2. Deploy backend servers
3. Create origin pool (reference backend servers)
4. Create HTTP load balancer (reference origin pool)
5. Add DNS (if needed)
6. Test and verify
```

**Duration**: 15-30 minutes

---

### Combination 2: Secure Application Deployment

```
1. Create namespace (if needed)
2. Deploy backend servers
3. Create origin pool
4. Create WAF policy (set to monitoring)
5. Create Bot Defense policy
6. Create HTTP load balancer (attach security policies)
7. Monitor and tune for 1-7 days
8. Escalate WAF to blocking
9. Enable additional policies as needed
10. Final verification
```

**Duration**: 1-2 weeks

---

### Combination 3: Global Multi-Region Deployment

```
1. Create 2+ regional namespaces
2. Deploy backend servers per region
3. Per region:
   ├─ Create origin pool
   ├─ Create HTTP load balancer
   └─ Configure regional security policies
4. Create DNS zone
5. Create DNS load balancer (geolocation routing)
6. Configure failover health checks
7. Test failover scenarios
8. Final global verification
```

**Duration**: 2-4 weeks

---

## 10. Integration Points for Phase 3

This workflow-patterns.md document serves as the foundation for Phase 3 (Workflow Automation Patterns), where:

1. **Specific Workflows** will be created (20+ files)
   - Each workflow file will follow these patterns
   - Each will include detailed form field mappings
   - Each will reference console-navigation-metadata.json

2. **Automation Scripts** will use these patterns to:
   - Navigate to correct pages (using metadata)
   - Fill forms with correct field values
   - Verify success with criteria above
   - Implement error handling using patterns here

3. **Intelligent Decision Making** will leverage:
   - Decision trees (Section 3)
   - State transitions (Section 7)
   - Workflow combinations (Section 9)
   - Prerequisite validation

4. **Testing & Validation** will use:
   - Success criteria (each workflow section)
   - CLI verification commands (Section 6)
   - Monitoring checklists (Section 6)

---

**Workflow Patterns Version**: 1.0.0
**Last Updated**: 2025-12-24
**Status**: Ready for Phase 3 implementation
**Next Phase**: Create 20+ specific workflow markdown files based on these patterns

