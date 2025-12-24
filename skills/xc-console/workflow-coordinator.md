---
title: Workflow Coordinator - Practical Implementation Guide
description: Hands-on guide for coordinating and executing F5 XC workflow sequences
version: 1.0.0
last_updated: 2025-12-24
---

# Workflow Coordinator Implementation

## Quick Start

The workflow coordinator enables executing complex multi-step deployments as simple, high-level commands:

```bash
# Instead of manually running 6 separate workflows:
f5xc-coord execute "Create a global load balancer with security and failover"

# The coordinator:
# 1. Parses your intent
# 2. Selects appropriate workflows
# 3. Validates prerequisites
# 4. Builds execution sequence
# 5. Executes workflows in order
# 6. Reports progress and results
```

---

## Common Orchestration Scenarios

### Scenario 1: Single Region App with Security

```bash
f5xc-coord execute "Create HTTP load balancer for my-app with WAF"

Execution Plan:
  1. Create origin pool (backend servers)
  2. Create HTTP load balancer
  3. Create WAF policy
  4. Attach WAF to load balancer
  5. Monitor WAF in Monitoring mode

Result: Protected application ready for traffic
```

### Scenario 2: Multi-Region Global Deployment

```bash
f5xc-coord execute "Deploy my-app globally with multi-region failover"

Execution Plan:
  1. Create origin pool in US region
  2. Create origin pool in EU region
  3. Create HTTP LB for US region
  4. Create HTTP LB for EU region
  5. Create DNS zone
  6. Create DNS LB with geolocation routing
  7. Create DNS LB with failover (backup)

Result: Global app with geographic routing and automatic failover
```

### Scenario 3: Secure API Gateway

```bash
f5xc-coord execute "Create secure API gateway with rate limiting and bot protection"

Execution Plan:
  1. Create origin pool (API backends)
  2. Create HTTP load balancer
  3. Create WAF policy
  4. Attach WAF to LB
  5. Create rate limiting policy
  6. Attach rate limiting
  7. Create bot defense policy
  8. Attach bot defense

Result: Enterprise API gateway with multiple security layers
```

---

## Coordinator Commands

### Execute Orchestration

```bash
# Execute with intent
f5xc-coord execute "your intent here"

# Execute with options
f5xc-coord execute "intent" \
  --namespace production \
  --dry-run              # Plan only, don't execute
  --parallel             # Run independent workflows in parallel
  --auto-confirm         # Don't ask for confirmations
  --verbose              # Detailed progress output
  --timeout 3600         # Maximum execution time (seconds)

# Execute existing plan
f5xc-coord execute plan.json \
  --parameters params.json
```

### Plan Only

```bash
# View execution plan without executing
f5xc-coord plan "Create HTTP LB with WAF"

Output:
  Workflow Sequence:
    1. origin-pool-create-basic.md
    2. http-loadbalancer-create-basic.md
    3. waf-policy-create-basic.md
    4. http-loadbalancer-add-waf.md

  Prerequisites:
    ✓ Namespace exists
    ✗ Origin pool (need to create)

  Estimated Duration: 15-20 minutes
  Estimated Cost: $5-10
```

### Validate Prerequisites

```bash
# Check if you can execute without creating prerequisites
f5xc-coord validate "Create DNS LB for existing app"

Output:
  Validation Results:
    ✓ Namespace: production (exists)
    ✓ HTTP LB: my-app-lb (exists)
    ✓ DNS Zone: example.com (exists)
    ✓ All prerequisites met

  Status: READY TO EXECUTE
```

### List Available Workflows

```bash
# Find workflows matching criteria
f5xc-coord list --resource http_loadbalancer
f5xc-coord list --operation create
f5xc-coord list --complexity 1-2  # Beginner level

# View workflow details
f5xc-coord show http-loadbalancer-create-basic.md
```

---

## Configuration

### Coordinator Config File

```yaml
# ~/.f5xc-orchestration/coordinator.yaml

# Default parameters
defaults:
  namespace: "production"
  region: "us-east-1"
  protocol: "https"

# Execution preferences
execution:
  # Sequential (safer) or parallel (faster)
  parallel: false

  # Auto-retry failed steps
  auto_retry: 2
  retry_delay_seconds: 10

  # Rollback on failure
  rollback_on_error: true

  # Save execution logs
  save_logs: true
  logs_directory: "~/.f5xc-orchestration/logs"

# Workflow preferences
workflows:
  # Prefer simpler or full-featured variants
  complexity_preference: "minimal"  # minimal|moderate|advanced

  # Auto-include security features
  auto_security: true

  # Auto-include monitoring
  auto_monitoring: true

# Validation settings
validation:
  # Validate with CLI before proceeding
  pre_execution: true

  # Validate with CLI after execution
  post_execution: true

  # CLI timeout (seconds)
  cli_timeout: 30

# Reporting
reporting:
  # Report style: minimal|standard|verbose
  style: "standard"

  # Include cost estimates
  show_costs: true

  # Include timing estimates
  show_timing: true

# Integration
integration:
  # Use native Chrome for browser automation
  browser: "native-chrome"

  # CLI command (xcsh vs xcctlnot)
  cli_command: "xcsh"

  # Save state between executions
  persist_state: true
```

### Per-Execution Overrides

```bash
# Override defaults for specific execution
f5xc-coord execute "Create LB" \
  --namespace staging \
  --region eu-west-1 \
  --protocol http \
  --auto-security false \
  --parallel true \
  --dry-run

# Or use parameters file
f5xc-coord execute "Create LB" \
  --parameters-file params.json
```

---

## Execution Examples

### Interactive Execution

```bash
$ f5xc-coord execute "Create HTTP LB with WAF"

[Intent Interpreter]
Intent: Create HTTP load balancer
Resource: HTTP Load Balancer
Operation: create_with_security
Parameters:
  - namespace: production
  - security: waf
  - name: [not specified]

[Prerequisites]
Please provide:
  1. Load balancer name [my-app]:
  2. Domain [example.com]:
  3. Origin pool name [backend-pool]:
  4. WAF policy name [basic-waf]:

[Workflow Selection]
Selected 4 workflows:
  1. http-loadbalancer-create-basic
  2. waf-policy-create-basic
  3. http-loadbalancer-add-waf
  4. (origin pool creation skipped - prerequisite exists)

[Execution Plan]
Estimated Duration: 12 minutes
Estimated Cost: ~$0.10

Execute? [yes/no]: yes

[Execution Progress]
[1/4] http-loadbalancer-create-basic.md
  └─ Step 1: Navigate to HTTP LBs page... ✓
  └─ Step 2: Click Add HTTP LB... ✓
  └─ Step 3: Fill metadata... ✓
  └─ Step 4: Configure basic settings... ✓
  └─ Step 5: Configure origin pools... ✓
  └─ Step 6: Submit form... ✓
  └─ Step 7: Verify creation... ✓
  └─ CLI Validation: my-app-lb created ✓
  Duration: 3 minutes 45 seconds
  Status: SUCCESS ✓

[2/4] waf-policy-create-basic.md
  ... [similar progress]
  Duration: 2 minutes 12 seconds
  Status: SUCCESS ✓

[3/4] http-loadbalancer-add-waf.md
  ... [similar progress]
  Duration: 1 minute 30 seconds
  Status: SUCCESS ✓

[Execution Summary]
Status: SUCCESS ✓
Duration: 7 minutes 27 seconds
Resources Created:
  - HTTP LB: my-app-lb (ACTIVE)
  - WAF Policy: basic-waf (ACTIVE)

Next Steps:
  1. Test WAF in Monitoring mode
  2. Monitor false positives for 1-7 days
  3. Escalate to Blocking mode when ready

View full report: ~/.f5xc-orchestration/logs/exec-20251224-143215.log
```

### Non-Interactive Execution

```bash
# Create parameters file
cat > params.json << 'EOF'
{
  "namespace": "production",
  "name": "my-app-lb",
  "domain": "example.com",
  "origin_pool": "backend-pool",
  "waf_enabled": true,
  "waf_policy": "basic-waf",
  "auto_confirm": true
}
EOF

# Execute without prompts
f5xc-coord execute "Create HTTP LB with WAF" \
  --parameters-file params.json \
  --auto-confirm \
  --verbose

# Monitor output
tail -f ~/.f5xc-orchestration/logs/current.log
```

### Error Handling & Recovery

```bash
# Execution fails at step 2
[2/4] http-loadbalancer-create-basic.md
  └─ Step 5: Configure origin pools... ✗
  Error: Origin pool "backend-pool" not found

[Recovery Options]
  1. Create origin pool now and retry
  2. Use different origin pool
  3. Rollback and cancel
  4. Continue to next workflow (skip this one)

Choice [1-4]: 1

[Creating Origin Pool]
Running: origin-pool-create-basic.md
  ... [execution]
  Status: SUCCESS ✓

[Retrying HTTP LB Creation]
Running: http-loadbalancer-create-basic.md (attempt 2)
  ... [execution]
  Status: SUCCESS ✓

[Continuing Execution]
[3/4] waf-policy-create-basic.md
  ... [execution continues]
```

---

## Workflow Sequencing Algorithm

### Dependency Resolution

The coordinator automatically determines execution order:

```
User Request: "Create global app with security"

1. Intent Parsing:
   - Resource: http_loadbalancer
   - Operations: create, add_waf, create_dns_lb
   - Parameters: namespace=production, security=waf

2. Workflow Selection:
   - origin-pool-create-basic (prerequisite)
   - http-loadbalancer-create-basic
   - waf-policy-create-basic (prerequisite for attach)
   - http-loadbalancer-add-waf
   - dns-zone-create (prerequisite for DNS LB)
   - dns-loadbalancer-create-geolocation (optional)

3. Dependency Analysis:
   origin-pool-create-basic
       ↓ (creates resource needed by)
   http-loadbalancer-create-basic
       ↓ (creates resource needed by)
   http-loadbalancer-add-waf ← (also needs)
   waf-policy-create-basic
       ↓ (creates resource needed by)
   http-loadbalancer-add-waf

   dns-zone-create
       ↓ (creates resource needed by)
   dns-loadbalancer-create-geolocation

4. Execution Sequence (respecting dependencies):
   1. origin-pool-create-basic (no dependencies)
   2. http-loadbalancer-create-basic (needs origin pool)
   3. waf-policy-create-basic (no dependencies)
   4. http-loadbalancer-add-waf (needs HTTP LB + WAF policy)
   5. dns-zone-create (no dependencies)
   6. dns-loadbalancer-create-geolocation (needs DNS zone + HTTP LB)
```

### Parallel Execution

When `--parallel` flag is used:

```
Sequential (--parallel false):
1. origin-pool-create-basic      [████████] 2m
2. http-loadbalancer-create-basic [████████] 3m
3. waf-policy-create-basic        [████████] 1m
4. http-loadbalancer-add-waf      [████████] 1m
5. dns-zone-create                [████████] 2m
6. dns-loadbalancer-create-geo    [████████] 3m
Total: 12 minutes

Parallel (--parallel true):
1. origin-pool-create-basic       [████████] 2m
   + dns-zone-create              [████████] 2m (independent)
2. http-loadbalancer-create-basic [████████] 3m
   + waf-policy-create-basic      [████████] 1m (independent)
3. http-loadbalancer-add-waf      [████████] 1m
4. dns-loadbalancer-create-geo    [████████] 3m
Total: 7 minutes (40% faster)
```

---

## Validation & Safety

### Pre-Execution Validation

The coordinator checks before executing:

```bash
f5xc-coord validate "Create DNS LB"

[Validation Checks]
✓ Namespace exists: production
✓ HTTP LB exists: my-app-lb
✓ HTTP LB is ACTIVE
✓ DNS Zone exists: example.com
✓ DNS Zone delegated (nameservers set)
✓ All prerequisites satisfied

[Safety Checks]
✓ Console connectivity OK
✓ CLI connectivity OK
✓ No resource conflicts detected
✓ Sufficient quota available (CPU, disk, IPs)
⚠ Low free tier budget remaining (~$100)

[Readiness]
Status: READY TO EXECUTE
Recommendation: Proceed

Alternative: Add --dry-run to see full plan without executing
```

### Dry-Run Mode

```bash
f5xc-coord execute "Create LB with WAF" --dry-run

[DRY-RUN MODE - No actual changes will be made]

[Workflow Sequence]
1. http-loadbalancer-create-basic.md
   Would navigate to HTTP LBs page
   Would fill form with:
     - Name: my-app-lb
     - Domain: example.com
     - Origin Pool: backend-pool
     - Protocol: https
   Would click Save button

2. waf-policy-create-basic.md
   Would navigate to WAF Policies page
   Would create policy: basic-waf
   Would enable threat campaigns

3. http-loadbalancer-add-waf.md
   Would attach basic-waf to my-app-lb
   Would set Enforcement Mode: Monitoring

[Expected Results]
✓ HTTP LB: my-app-lb (ACTIVE)
✓ WAF Policy: basic-waf (ACTIVE)
✓ Attachment: my-app-lb + basic-waf

[Estimated Timing]
Duration: 7 minutes
Cost: ~$0.05/hour

Ready to execute? (Remove --dry-run to proceed)
```

---

## Troubleshooting

### Common Issues

#### Issue: Workflow Fails at Step N

```bash
[Workflow Failure]
Workflow: http-loadbalancer-create-basic.md
Step: 5 (Configure origin pools)
Error: Origin pool "backend-pool" not found

[Diagnosis]
1. Check if origin pool exists:
   f5xc-coord validate http_loadbalancer_create_basic

2. Check resource details:
   xcsh configuration get origin_pool backend-pool -n production

3. Options:
   a) Create origin pool: f5xc-coord execute "Create origin pool"
   b) Use different pool: Re-run with --parameters params.json
   c) Check prerequisites: f5xc-coord plan "create LB"
```

#### Issue: Execution Hangs

```bash
# If coordinator appears frozen:
# 1. Check browser automation status
# 2. Verify console is responsive
# 3. Check for dialogs/alerts in Chrome
# 4. Use Ctrl+C to interrupt and review logs

# Debug mode for detailed output
f5xc-coord execute "Create LB" --debug

# View live logs
tail -f ~/.f5xc-orchestration/logs/current.log
```

#### Issue: Prerequisite Not Found

```bash
# Coordinator claims resource doesn't exist
# But you know it exists

# Solution 1: Verify with CLI
xcsh configuration list http_loadbalancer -n production | grep my-app-lb

# Solution 2: Check namespace
xcsh configuration get http_loadbalancer my-app-lb -n staging
# (vs production - different namespace?)

# Solution 3: Force re-query
f5xc-coord validate --refresh
# (Refresh cached resource list)
```

---

## Integration with Skills

### Using with f5xc-cli Skill

```bash
# Validate orchestration results
f5xc-cli list http_loadbalancer -n production

# Detailed resource info
f5xc-cli get http_loadbalancer my-app-lb -n production
```

### Using with f5xc-terraform Skill

```bash
# After orchestration, generate Terraform
f5xc-terraform generate-from-console my-app-lb

# Result: Terraform files matching orchestrated infrastructure
```

---

## Best Practices

### 1. Start with Dry-Run

```bash
# Always dry-run first
f5xc-coord execute "Create LB" --dry-run

# Review planned actions
# Then execute for real
f5xc-coord execute "Create LB"
```

### 2. Use Meaningful Names

```bash
# Good names (descriptive, consistent)
my-app-prod-us-east-1
api-gateway-v2
internal-service

# Poor names (vague, hard to identify)
lb-1
test-app
temp-pool
```

### 3. Validate Prerequisites

```bash
# Before running complex orchestration
f5xc-coord validate "Create DNS LB"

# Verify all prerequisites exist
# Fix missing resources first
```

### 4. Monitor First Execution

```bash
# Run with verbose output
f5xc-coord execute "Create LB" --verbose

# Watch for any warnings or issues
# Review logs after completion
```

### 5. Keep Logs for Audit

```bash
# Logs automatically saved
# Location: ~/.f5xc-orchestration/logs/

# Review for troubleshooting
cat ~/.f5xc-orchestration/logs/exec-20251224-143215.log

# Archive for compliance
cp logs/ ~/backups/f5xc-audit-2025-12/
```

---

## Advanced Features

### Custom Orchestrations

Create reusable orchestration definitions:

```yaml
# ~/.f5xc-orchestration/my-orchestrations.yaml

orchestrations:
  "secure-global-app":
    description: "Enterprise app with security, global routing, HA"
    workflows:
      - origin-pool-create-basic
      - http-loadbalancer-create-basic
      - waf-policy-create-basic
      - http-loadbalancer-add-waf
      - dns-zone-create
      - dns-loadbalancer-create-geolocation
      - dns-loadbalancer-create-failover
    parameters:
      default_namespace: production
      auto_security: true
      auto_monitoring: true

  "api-gateway":
    description: "Secure API gateway with rate limiting"
    workflows:
      - origin-pool-create-basic
      - http-loadbalancer-create-basic
      - waf-policy-create-basic
      - http-loadbalancer-add-waf
      - http-loadbalancer-add-rate-limiting
      - http-loadbalancer-add-bot-defense
```

Usage:

```bash
# Execute custom orchestration
f5xc-coord execute --orchestration secure-global-app \
  --parameters-file my-params.json

# List custom orchestrations
f5xc-coord list --custom
```

---

**Document Version**: 1.0.0
**Status**: Implementation Ready
**Last Updated**: 2025-12-24

