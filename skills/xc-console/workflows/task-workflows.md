---
title: Task Workflows Master Index
description: Master index and decision guide for all F5 Distributed Cloud console automation workflows
version: 1.0.0
last_updated: 2025-12-24
---

# Task Workflows Master Index

Master reference guide for selecting and executing F5 Distributed Cloud workflows.

---

## Quick Navigation

### By Resource Type

| Resource Type | Workflows | Complexity |
|---------------|-----------|-----------|
| **HTTP Load Balancer** | [Create Basic](#http-load-balancer-workflows) • Add WAF • Add Bot Defense • Add Rate Limiting | Beginner → Advanced |
| **Origin Pool** | [Create Basic](#origin-pool-workflows) • Configure Failover • Configure Ring Hash | Beginner → Intermediate |
| **WAF Policy** | [Create Basic](#waf-policy-workflows) • Create Exclusion • Monitor & Tune | Intermediate |
| **Cloud Sites** | [Deploy AWS](#cloud-site-workflows) • Deploy Azure • Deploy GCP | Intermediate |
| **DNS Management** | [Create Zone](#dns-workflows) • Create LB (Geolocation) • Configure Failover | Intermediate → Advanced |
| **Security Policies** | Bot Defense • API Protection • Rate Limiting • Service Policies | Advanced |
| **Administration** | Create Users • API Tokens • Quotas • Cloud Credentials | Beginner → Intermediate |

### By Complexity Level

**Beginner** (5-15 min):
- Create HTTP Load Balancer (Basic)
- Create Origin Pool (HTTP Backends)
- Create User Account
- Create API Token

**Intermediate** (15-30 min):
- Add WAF Policy to HTTP LB
- Configure Origin Pool Failover
- Create DNS Zone
- Deploy Cloud Site (AWS)
- Create WAF Policy

**Advanced** (30+ min):
- Create DNS LB with Geolocation Routing
- Configure Multi-Region Deployment
- Tune WAF with Exclusions
- Set Resource Quotas
- Advanced Load Balancing (Ring Hash)

### By Use Case

**Get Started Fast**:
1. Create namespace
2. Deploy backend servers
3. Create origin pool → Create HTTP LB → Test

**Secure Application**:
1. Create HTTP LB (basic)
2. Create WAF policy
3. Attach WAF to LB
4. Monitor and tune WAF
5. Escalate to blocking

**Global Deployment**:
1. Deploy region 1: Origin pool → HTTP LB
2. Deploy region 2: Origin pool → HTTP LB
3. Create DNS zone
4. Create DNS LB with geolocation routing
5. Test failover

**Comply with Standards**:
1. Create API token for automation
2. Set resource quotas
3. Create user accounts with roles
4. Enable audit logging
5. Monitor compliance

---

## HTTP Load Balancer Workflows

### 1. Create HTTP Load Balancer (Basic)
- **File**: `http-loadbalancer-create-basic.md`
- **Duration**: 5-10 minutes
- **Complexity**: Beginner
- **Prerequisites**: Namespace, Origin Pool
- **Steps**: Navigate → Fill metadata → Select origin pool → Choose protocol → Submit
- **Success**: LB shows ACTIVE status, DNS resolves domain

**Use When**: You need a basic HTTP/HTTPS load balancer with simple origin pool routing

---

### 2. Add WAF Policy to HTTP Load Balancer
- **File**: `http-loadbalancer-add-waf.md`
- **Duration**: 5-10 minutes
- **Complexity**: Intermediate
- **Prerequisites**: HTTP LB exists, WAF policy exists
- **Steps**: Edit LB → Scroll to Security Policies → Select WAF policy → Choose Monitoring mode → Save
- **Success**: WAF policy attached, events logged

**Use When**: You want to protect an existing HTTP LB with WAF security

---

### 3. Create HTTPS LB with Automatic Certificate (Coming)
- **Duration**: 5-10 minutes
- **Complexity**: Beginner
- **Key Feature**: ACME automatic certificate provisioning
- **Difference from Basic**: Select "HTTPS with Automatic Certificate" protocol
- **Success**: HTTPS working, certificate valid

**Use When**: You need HTTPS without manual certificate management

---

### 4. Create Security-Hardened HTTP LB (Coming)
- **Duration**: 15-30 minutes
- **Complexity**: Advanced
- **Includes**: WAF + Bot Defense + Rate Limiting + API Protection
- **Steps**: Create LB → Create/attach 4 security policies → Configure each → Test
- **Success**: All policies attached and active

**Use When**: You need comprehensive security for a critical application

---

## Origin Pool Workflows

### 1. Create Origin Pool (HTTP Backends)
- **File**: `origin-pool-create-basic.md`
- **Duration**: 10-15 minutes
- **Complexity**: Beginner
- **Prerequisites**: Namespace, backend servers deployed
- **Steps**: Navigate → Fill metadata → Configure health check → Add endpoints → Submit
- **Success**: All endpoints show HEALTHY, pool ready for HTTP LBs

**Use When**: You need to manage a group of backend servers with health checks

---

### 2. Create Origin Pool with Automatic Failover (Coming)
- **Duration**: 15-20 minutes
- **Complexity**: Intermediate
- **Key Feature**: Aggressive health checks for fast failover
- **Configuration**: Primary endpoint with weight 10, Secondary with weight 1
- **Success**: Health check detects failures in <10 seconds

**Use When**: You need automatic failover between primary and secondary backends

---

### 3. Configure Advanced Load Balancing (Ring Hash) (Coming)
- **Duration**: 10-15 minutes
- **Complexity**: Intermediate
- **Key Feature**: Consistent hashing for session persistence
- **Use Case**: Stateful applications (shopping carts, sessions)
- **Configuration**: Select "Ring Hash" algorithm, specify session key

**Use When**: You need session persistence across multiple backends

---

## WAF Policy Workflows

### 1. Create WAF Policy (Default Protection)
- **File**: `waf-policy-create-basic.md`
- **Duration**: 10-15 minutes
- **Complexity**: Intermediate
- **Prerequisites**: Namespace
- **Steps**: Navigate → Fill metadata → Select detection mode → Choose Monitoring → Enable threat categories → Submit
- **Success**: WAF policy created and can be attached to HTTP LBs

**Use When**: You need to create a reusable WAF policy for multiple HTTP LBs

---

### 2. Create WAF Exclusion Rule (Coming)
- **Duration**: 10-15 minutes
- **Complexity**: Intermediate
- **Prerequisites**: WAF policy attached to HTTP LB, false positive identified
- **Steps**: Review security events → Find attack signature → Create exclusion rule → Test
- **Success**: False positive no longer blocked, real attacks still detected

**Use When**: You have legitimate traffic being incorrectly blocked by WAF

---

### 3. Monitor & Tune WAF Policy (Coming)
- **Duration**: Ongoing (1-7 days for tuning)
- **Complexity**: Intermediate
- **Process**: Monitor events → Identify false positives → Create exclusions → Escalate to Blocking
- **Typical Flow**: Monitoring mode (days 1-5) → Create exclusions (days 3-7) → Blocking mode (day 7+)

**Use When**: You've deployed a WAF and need to tune it for your application

---

## DNS & Global Routing Workflows

### 1. Create DNS Zone
- **Duration**: 5-10 minutes
- **Complexity**: Beginner
- **Prerequisites**: Domain registered
- **Steps**: Navigate → Enter domain name → Submit → Update registrar nameservers
- **Success**: Zone created, nameservers propagated (24-48 hours)

**Use When**: You want to host domain DNS with F5 XC

---

### 2. Create DNS Load Balancer (Geolocation Routing)
- **File**: `dns-loadbalancer-create-geolocation.md`
- **Duration**: 20-30 minutes
- **Complexity**: Intermediate
- **Prerequisites**: DNS Zone, multiple HTTP LBs in different regions
- **Steps**: Navigate → Create pools → Assign regions to pools → Enable health checks → Submit
- **Success**: Geographic routing working, different IPs per region

**Use When**: You need global traffic distribution based on client location

---

### 3. Configure DNS Failover (Coming)
- **Duration**: 20-30 minutes
- **Complexity**: Intermediate
- **Key Feature**: Active-passive failover across regions
- **Configuration**: Primary pool (priority 1), Secondary pool (priority 2)
- **Health Checks**: Aggressive timing for fast failover (5-10 seconds)

**Use When**: You need automatic failover between regions

---

## Cloud Site Workflows

### 1. Deploy AWS VPC Site (Coming)
- **Duration**: 15-25 minutes
- **Complexity**: Intermediate
- **Prerequisites**: AWS account, VPC with subnets, AWS credentials configured
- **Steps**: Navigate → Select AWS → Configure credentials → Select VPC/subnets → Deploy
- **Success**: Site shows READY status, inside/outside networks healthy

**Use When**: You want to deploy F5 XC edge sites in AWS VPCs

---

### 2. Deploy Azure VNet Site (Coming)
- **Duration**: 15-25 minutes
- **Complexity**: Intermediate
- **Prerequisites**: Azure subscription, VNet, service principal credentials
- **Steps**: Navigate → Select Azure → Configure credentials → Select VNet → Deploy
- **Success**: VMs created, hybrid connectivity established

**Use When**: You want to deploy F5 XC edge sites in Azure VNets

---

### 3. Deploy GCP VPC Site (Coming)
- **Duration**: 15-25 minutes
- **Complexity**: Intermediate
- **Prerequisites**: GCP project, VPC network, service account credentials
- **Steps**: Navigate → Select GCP → Configure credentials → Select VPC → Deploy
- **Success**: Instances created in Compute Engine, control plane connection established

**Use When**: You want to deploy F5 XC edge sites in GCP VPCs

---

## Administration Workflows

### 1. Create User Account (Coming)
- **Duration**: 5-10 minutes
- **Complexity**: Beginner
- **Prerequisites**: Admin access
- **Steps**: Navigate → Enter user details → Select role → Send invite
- **Success**: User receives invite email, can log in

**Use When**: You need to add new users to the tenant

---

### 2. Create API Token (Coming)
- **Duration**: 5-10 minutes
- **Complexity**: Beginner
- **Prerequisites**: User account or service principal
- **Steps**: Navigate → Generate token → Copy token → Store securely
- **Success**: Token works with xcsh and Terraform

**Use When**: You need API access for automation or CLI tools

---

### 3. Set Resource Quotas (Coming)
- **Duration**: 10-15 minutes
- **Complexity**: Beginner
- **Prerequisites**: Admin access, quota policy defined
- **Steps**: Navigate → Select namespace → Set limits per resource type → Submit
- **Success**: Quotas enforced, users cannot exceed limits

**Use When**: You need to control resource consumption per team/namespace

---

## Common Workflow Sequences

### Sequence 1: Single Region Application (Beginner)

```
Duration: 20-30 minutes

1. Create namespace
   └─ Skip if exists

2. Create origin pool
   └─ http-loadbalancer-create-basic.md (prerequisites)
   └─ Add 3 backend servers
   └─ Verify health checks pass

3. Create HTTP load balancer
   └─ http-loadbalancer-create-basic.md
   └─ Reference the origin pool
   └─ Select HTTPS with Automatic Certificate

4. Test connectivity
   └─ DNS resolves domain
   └─ HTTPS connection works
   └─ Traffic reaches backends

Success: Application accessible via https://app.example.com/
```

---

### Sequence 2: Secure Application Deployment (Intermediate)

```
Duration: 2-3 days (mostly tuning phase)

Day 1: Initial Setup (30-40 minutes)
1. Create origin pool (http-loadbalancer-create-basic.md prerequisites)
2. Create HTTP LB (http-loadbalancer-create-basic.md)
3. Create WAF policy (waf-policy-create-basic.md)
4. Attach WAF to LB in MONITORING mode (http-loadbalancer-add-waf.md)
5. Create Bot Defense policy (coming)
6. Attach Bot Defense to LB (coming)

Day 2-3: Tuning Phase (30-60 minutes/day)
1. Review Security Events dashboard
2. Identify false positives in WAF
3. Create exclusion rules for false positives
4. Verify legitimate traffic passes through
5. Monitor attack trends

Day 4: Escalate to Production
1. Edit WAF policy
2. Change enforcement: Monitoring → Blocking
3. Continue monitoring for 1 week
4. Archive access logs for compliance

Success: Application protected with tuned WAF in blocking mode
```

---

### Sequence 3: Global Multi-Region Deployment (Advanced)

```
Duration: 2-4 weeks (mostly DNS propagation)

Week 1: Region 1 Setup (45-60 minutes)
1. Create origin pool (backend-us)
2. Create HTTP LB (api-lb-us)
3. Create WAF policy
4. Attach WAF in monitoring mode
5. Monitor and tune for 2-3 days

Week 2: Region 2 Setup (45-60 minutes)
1. Create origin pool (backend-eu)
2. Create HTTP LB (api-lb-eu)
3. Attach same WAF policy
4. Monitor and tune for 2-3 days

Week 2-3: Global Setup (30-45 minutes)
1. Create DNS Zone for example.com
2. Create DNS LB (dns-loadbalancer-create-geolocation.md)
3. Configure geolocation routing:
   └─ North America → US HTTP LB
   └─ Europe → EU HTTP LB
   └─ Rest of World → Fallback to US
4. Enable health checks

Week 3-4: Testing & Monitoring (30+ minutes)
1. Test from different regions
2. Verify correct IPs per region
3. Simulate region failure
4. Verify automatic failover works
5. Test failback to primary
6. Monitor for 1 week

Success: Global application with automatic failover
```

---

## Decision Trees for Workflow Selection

### Q: How should I protect my application?

```
Does it need HTTPS?
├─ YES → Use "Create HTTP LB" with "HTTPS Auto Certificate"
└─ NO → Use "Create HTTP LB" with "HTTP" protocol

Do I have web application attacks?
├─ YES → Create WAF policy and attach to LB
└─ NO → Skip WAF for now

Do I have bot traffic?
├─ YES → Create Bot Defense policy and attach to LB
└─ NO → Skip Bot Defense

Do I need rate limiting?
├─ YES → Create Rate Limiting policy
└─ NO → Skip for now

Result: Use "Create HTTP LB" + attach security policies as needed
```

---

### Q: What's my backend architecture?

```
Single server?
├─ YES → Create origin pool with 1 endpoint
└─ NO → Continue

Multiple servers, same location?
├─ YES → Create origin pool with 3+ endpoints, health checks
└─ NO → Continue

Multiple servers, different locations?
├─ YES → Create multiple origin pools (one per location)
└─ NO → Continue

Multiple regions globally?
├─ YES → Create multiple HTTP LBs (one per region)
├─ Then create DNS LB for geolocation routing
└─ NO → Single origin pool with HTTP LB

Need session persistence?
├─ YES → Use "Configure Ring Hash" in origin pool
└─ NO → Use default "Round Robin" algorithm
```

---

### Q: What's my deployment scope?

```
Single region, single team?
├─ YES → Create namespace, resources for that team
└─ NO → Continue

Multiple teams, different regions?
├─ YES → Create namespace per team/region
└─ NO → Continue

Multiple regions, need global routing?
├─ YES → Create DNS Zone + DNS Load Balancer (geolocation)
└─ NO → Use HTTP LB only for single region

Need edge site deployment?
├─ YES → Deploy Cloud Site (AWS/Azure/GCP)
└─ NO → Use central HTTP LB

Result: Plan namespace structure based on isolation needs
```

---

## Success Metrics by Workflow Type

### HTTP Load Balancer
- ✅ Status shows ACTIVE
- ✅ DNS resolves domain correctly
- ✅ HTTPS certificate valid
- ✅ Traffic reaches origin pool
- ✅ Origin pool shows healthy

### Origin Pool
- ✅ All endpoints show HEALTHY
- ✅ Health checks running at configured interval
- ✅ Traffic distributed per algorithm
- ✅ Can be referenced by HTTP LBs

### WAF Policy
- ✅ Policy created and ACTIVE
- ✅ When attached to LB, security events appear
- ✅ Legitimate traffic passes in monitoring mode
- ✅ Attack signatures trigger on malicious traffic
- ✅ False positives identifiable and excludable

### DNS Load Balancer
- ✅ DNS queries resolve to different IPs per region
- ✅ Health checks monitor pools
- ✅ Failover occurs when pool unhealthy
- ✅ TTL behavior correct
- ✅ Query statistics show traffic distribution

### Cloud Site
- ✅ Site status shows READY
- ✅ Inside/outside networks healthy
- ✅ Pod count shows running instances
- ✅ Connectivity to control plane established
- ✅ Can route traffic through site

---

## Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Origin pool unhealthy | See `origin-pool-create-basic.md` → Troubleshooting |
| HTTP LB stuck creating | Check origin pool exists and is healthy |
| WAF blocking legitimate traffic | Create exclusion rule (coming workflow) |
| DNS not resolving | Verify zone delegated, nameservers propagated |
| Cloud site not ready | Check network configuration, security groups |

---

## Workflow File Locations

```
~/.claude/skills/f5xc-console/workflows/

HTTP Load Balancer:
├── http-loadbalancer-create-basic.md ✅
├── http-loadbalancer-add-waf.md ✅
├── http-loadbalancer-add-bot-defense.md (coming)
└── http-loadbalancer-security-hardened.md (coming)

Origin Pool:
├── origin-pool-create-basic.md ✅
├── origin-pool-create-failover.md (coming)
└── origin-pool-create-ring-hash.md (coming)

WAF Policy:
├── waf-policy-create-basic.md ✅
├── waf-policy-create-exclusion.md (coming)
└── waf-policy-monitor-tune.md (coming)

DNS:
├── dns-zone-create.md (coming)
└── dns-loadbalancer-create-geolocation.md ✅

Cloud Sites:
├── cloud-site-deploy-aws.md (coming)
├── cloud-site-deploy-azure.md (coming)
└── cloud-site-deploy-gcp.md (coming)

Administration:
├── admin-create-user.md (coming)
├── admin-create-api-token.md (coming)
└── admin-set-quotas.md (coming)

Master Index:
└── task-workflows.md (this file)
```

---

## Getting Help

### For Specific Workflow Issues
1. Find your workflow file in the list above
2. Read "Troubleshooting" section
3. Follow diagnosis and solutions

### For Decision Making
1. Use appropriate Decision Tree above
2. Identify which workflow applies
3. Follow step-by-step instructions

### For Understanding Patterns
1. See `workflow-patterns.md` for common patterns
2. Understand form fields and validation
3. Learn state transitions and error recovery

---

## Related Documentation

- **Workflow Patterns**: `workflow-patterns.md`
- **Documentation Index**: `documentation-index.md`
- **Console Metadata**: `console-navigation-metadata.json`
- **Official Docs**: https://docs.cloud.f5.com/docs-v2

---

**Task Workflows Index Version**: 1.0.0
**Last Updated**: 2025-12-24
**Status**: Ready for Phase 3 workflow execution
**Completed Workflows**: 5 ✅
**Planned Workflows**: 25+ (coming)

