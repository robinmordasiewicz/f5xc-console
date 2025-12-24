---
title: F5 Distributed Cloud Documentation Index
description: Comprehensive indexed knowledge base of F5 XC documentation, workflows, and best practices
version: 1.0.0
last_updated: 2025-12-24
source: docs.cloud.f5.com + Perplexity Research Synthesis
---

# F5 Distributed Cloud Documentation Index

Master reference guide synthesizing official documentation, workflows, and best practices for all major F5 Distributed Cloud domains.

---

## 1. HTTP Load Balancing

### Overview
HTTP/HTTPS load balancing with advanced traffic management, SSL/TLS termination, routing rules, and security integration.

### Core Concepts

**HTTP Load Balancer** (Primary resource)
- Exposes applications to internet via fully qualified domain names (FQDNs)
- Manages HTTPS/TLS termination (manual certificates or automatic)
- Routes traffic to origin pools (backend servers)
- Supports regex-based routing, header-based routing, host-based routing
- Integrates with WAF policies, rate limiting, bot defense
- Reference: `docs.cloud.f5.com/docs-v2/platform/reference/http-loadbalancer`

**Common Configuration Areas**
1. **Metadata** (Name, Namespace, Labels)
2. **Basic Configuration** (Domains, Ports, HTTP/HTTPS Settings)
3. **TLS/SSL Certificates** (Manual or Automatic via ACME)
4. **Origin Pools** (Backend server routing)
5. **Routing Policies** (Path-based, header-based, host-based)
6. **Security Policies** (WAF, rate limiting, bot defense attachment)
7. **Performance** (Cache, compression, monitoring)

### Key Workflows

**Workflow 1: Create HTTP Load Balancer (Basic)**
```
Prerequisites:
- Namespace exists
- Origin pool with healthy backends configured
- (Optional) TLS certificate uploaded or ACME configured

Steps:
1. Navigate: Web App & API Protection > Manage > HTTP Load Balancers
2. Click: Add HTTP Load Balancer button
3. Fill Metadata: Name, Namespace, Labels
4. Configure: Domain list, Protocol (HTTP/HTTPS)
5. Select: Origin Pool for default routing
6. (Optional) Add: WAF policy, rate limiting, bot defense
7. Submit: Save and Exit

Success Criteria:
- LB appears in list with "ACTIVE" status
- vcli: f5xcctl load_balancer list http_loadbalancer -n [namespace]
  shows resource with correct domains
- DNS resolves domain to distributed IP addresses
- Origin pool health checks passing
```

**Workflow 2: Create HTTPS Load Balancer with Automatic Certificate**
```
Prerequisites:
- Domain registered and DNS controlled
- DNS CNAME pointing to Volterra edge
- Namespace and origin pool configured

Steps:
1. Create HTTP LB (basic steps above)
2. For TLS/SSL Protocol:
   - Select "HTTPS with Automatic Certificate"
   - F5 XC automatically provisions via Let's Encrypt
   - ACME challenge via DNS or HTTP
3. Configure other settings (security policies, routing)
4. Submit

Notes:
- Automatic certificates renew automatically
- No manual certificate management needed
- ACME validation happens transparently
- Valid for 90 days, auto-renewed 30 days before expiration
```

**Workflow 3: Add WAF Policy to Existing Load Balancer**
```
Prerequisites:
- HTTP LB already created
- WAF policy exists and is active

Steps:
1. Edit HTTP LB: Navigate to list > click LB name > Edit
2. Scroll to: Security Policies section
3. Select: WAF Policy from dropdown
4. Choose: Enforcement mode (blocking, monitoring, etc.)
5. Submit: Save changes

Immediate Effect:
- All traffic through LB now processed by WAF
- Attacks blocked/monitored per WAF policy rules
- Visible in security events logging
```

### Form Fields & Configuration Options

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | Yes | Unique per namespace, lowercase alphanumeric |
| Namespace | Select | Yes | Determines resource isolation and access control |
| Labels | Key-Value | No | For resource filtering and organization |
| Domains | List | Yes | One or more FQDNs (e.g., example.com, www.example.com) |
| Protocol | Radio | Yes | Options: HTTP, HTTPS (manual cert), HTTPS (automatic cert) |
| Certificate | Select | Conditional | Required if manual HTTPS; select from uploaded certificates |
| Origin Pool | Select | Yes | Default backend pool for routing |
| WAF Policy | Select | No | Attach security policy for threat protection |
| Rate Limiting | Config | No | Request rate limits and enforcement actions |
| Bot Defense | Select | No | Bot mitigation policy |
| Cache Settings | Config | No | Enable/disable caching, TTL configuration |
| Compression | Toggle | No | Enable gzip/brotli compression for responses |

### Tabs on Creation Form
- **Form**: Configuration fields (above)
- **Documentation**: Help text and field descriptions
- **JSON**: Raw resource definition (view/export)

### Prerequisites
- Namespace must exist
- At least one origin pool configured with healthy endpoints
- (HTTPS) Valid TLS certificate uploaded or ACME configured
- (Optional) WAF policy, rate limiting policy created

### Common Use Cases
- **Public API endpoint**: Route to API backend pool, add rate limiting/WAF
- **Website CDN**: Enable caching, add bot defense, geo-routing
- **Microservices frontend**: Use header-based routing to different origin pools
- **Multi-region failover**: Multiple origin pools with different regions

### Monitoring & Validation
- **HTTP LB Status**: Console shows ACTIVE/INACTIVE/ERROR
- **Origin Pool Health**: View health check status for backend endpoints
- **Traffic**: Real-time request metrics and latency
- **Security Events**: WAF, rate limiting, bot defense activity logs
- **CLI Validation**:
  ```bash
  xcsh load_balancer list http_loadbalancer -n [namespace]
  xcsh load_balancer get http_loadbalancer [name] -n [namespace]
  ```

### Related Resources
- Origin Pools (backend configuration)
- TLS Certificates (for HTTPS)
- WAF Policies (threat detection)
- Rate Limiting Policies
- Bot Defense Policies
- Namespaces (isolation/access control)

### Official Documentation
- **Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/http-loadbalancer
- **How-To**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/http-load-balancer
- **Examples**: https://docs.cloud.f5.com/docs-v2/examples/http-loadbalancer-*
- **Troubleshooting**: https://docs.cloud.f5.com/docs-v2/troubleshooting/http-loadbalancer-*

---

## 2. Origin Pools & Load Balancing

### Overview
Backend server grouping with health monitoring, multiple load balancing algorithms, and automatic failover.

### Core Concepts

**Origin Pool** (Manages backend servers)
- Groups backend servers (on-premises or cloud VMs)
- Implements health checks (HTTP, HTTPS, TCP, UDP)
- Distributes traffic via load balancing algorithms
- Automatically removes unhealthy endpoints
- Supports endpoint weights and priorities
- Reference: `docs.cloud.f5.com/docs-v2/platform/reference/origin-pool`

**Health Checks** (Monitor endpoint health)
- **HTTP Health Check**: GET requests to health endpoint (e.g., /health)
  - Success criteria: HTTP 200-399 status codes
  - Default: every 10 seconds, 3 consecutive failures = unhealthy
- **HTTPS Health Check**: TLS + HTTP health checks
- **TCP Health Check**: Simple port connectivity
- **UDP Health Check**: Application-level UDP validation
- **Interval Configuration**: Check frequency, timeout, failures threshold

**Load Balancing Algorithms**
1. **Round Robin** (Default): Distributes equally across healthy endpoints
2. **Least Connections**: Routes to endpoint with fewest active connections
3. **Ring Hash**: Consistent hashing for session persistence
4. **Weighted**: Based on configured weights per endpoint
5. **Ratio-based**: Configurable distribution ratio per endpoint
6. **Random**: Random selection among healthy endpoints

### Key Workflows

**Workflow 1: Create Origin Pool (HTTP Backends)**
```
Prerequisites:
- Backend servers deployed and running
- Backend servers have health check endpoint (e.g., GET /health)
- Namespace exists

Steps:
1. Navigate: Web App & API Protection > Manage > Origin Pools
2. Click: Add Origin Pool button
3. Fill Metadata: Name, Namespace, Labels
4. Select: Health Check Type = HTTP
5. Configure Health Check:
   - Path: /health (or custom endpoint)
   - Port: 80 (default)
   - Interval: 10s (default)
   - Timeout: 3s (default)
   - Failure Threshold: 3 consecutive failures
6. Add Endpoints:
   - Click: Add Origin Endpoint
   - Enter: IP address or hostname of backend
   - Port: 80 (for HTTP)
   - Weight: 1 (equal distribution)
   - Repeat for each backend server
7. Submit: Save and Exit

Success Criteria:
- Pool appears in list
- Health checks show "HEALTHY" for endpoints (may take 10+ seconds)
- Load balancer can route to pool
```

**Workflow 2: Create Origin Pool with Automatic Failover**
```
Prerequisites:
- Primary and secondary backend pools identified
- Each with health check endpoints

Steps:
1. Create origin pool (steps above)
2. Configure Health Check:
   - Aggressive timing:
     - Interval: 5 seconds (faster detection)
     - Failure Threshold: 2 failures (quicker failover)
   - This enables rapid failover to secondary endpoints
3. Add Multiple Endpoints:
   - Primary endpoint (weight: 10)
   - Secondary endpoint (weight: 1)
   - Weighted distribution causes secondary used only if primary fails
4. Monitor: Health check status dashboard

Real-World Example:
- Endpoint 1 (Primary DC): weight=100, healthy
- Endpoint 2 (Secondary DC): weight=1, healthy
- Normal: ~99% traffic to primary
- Primary down: ~100% traffic to secondary (automatic)
```

**Workflow 3: Configure Advanced Load Balancing (Ring Hash for Sessions)**
```
Prerequisites:
- Multiple backend servers
- Session persistence required (e.g., shopping cart)

Steps:
1. Create origin pool (basic steps)
2. Configure Load Balancing Algorithm:
   - Select: "Ring Hash" (consistent hashing)
   - Hash Key: Cookie name (e.g., "session_id") or header
3. Add Endpoints with unique identifiers
4. Save and use in HTTP LB

Effect:
- Same session always routes to same backend
- Resilient to endpoint additions/removals
- Useful for stateful applications
```

### Form Fields & Configuration

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | Yes | Unique per namespace |
| Namespace | Select | Yes | Resource isolation |
| Labels | Key-Value | No | Resource filtering |
| Health Check | Select | Yes | HTTP, HTTPS, TCP, UDP |
| Health Check Path | Text | Conditional | Required for HTTP/HTTPS |
| Health Check Port | Number | Yes | Port health checks connect to |
| Health Check Interval | Number | Yes | Seconds between checks (default 10) |
| Health Check Timeout | Number | Yes | Seconds to wait for response (default 3) |
| Healthy Threshold | Number | Yes | Consecutive successes to mark healthy |
| Unhealthy Threshold | Number | Yes | Consecutive failures to mark unhealthy |
| Load Balancing Algorithm | Select | Yes | Round Robin, Least Conn, Ring Hash, etc. |
| Origin Endpoints | List | Yes | IP addresses, hostnames of backends |
| Endpoint Weight | Number | Optional | Weight for weighted algorithm |
| Endpoint Priority | Number | Optional | Lower = higher priority |

### Prerequisites
- Backend servers deployed and accessible
- Health check endpoint configured on backends
- Namespace exists

### Common Use Cases
- **Web server pool**: Multiple web servers with HTTP health checks, round robin LB
- **Database backend**: Single or few database endpoints with TCP health checks
- **Microservice routing**: Multiple instances of same service, least connections LB
- **Multi-region deployment**: Endpoints across regions with fast failover detection
- **Session-based apps**: Ring hash for consistent session routing

### Health Check Best Practices
- **Dedicated endpoint**: Use `/health` endpoint, not production traffic paths
- **Fast responses**: Health check endpoint should respond in <1s
- **Accurate status**: Return 200 only if backend fully operational
- **Independent**: Don't make health checks dependent on other backends
- **Monitoring**: Track health check failures in logs for debugging

### Monitoring & Validation
- **Health Status**: Per-endpoint status (healthy/unhealthy)
- **Check History**: Track health check activity
- **Load Distribution**: Real-time traffic distribution across endpoints
- **Latency**: Per-endpoint response times
- **CLI Validation**:
  ```bash
  xcsh load_balancer list origin_pool -n [namespace]
  xcsh load_balancer get origin_pool [name] -n [namespace]
  ```

### Official Documentation
- **Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/origin-pool
- **Health Checks**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/origin-pool-health-checks
- **Load Balancing**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/load-balancing-algorithms
- **Troubleshooting**: https://docs.cloud.f5.com/docs-v2/troubleshooting/origin-pool-*

---

## 3. Web Application Firewall (WAF)

### Overview
Signature-based threat detection, automatic attack signature tuning, enforcement modes, and per-route policy application.

### Core Concepts

**WAF Policy** (Threat detection and blocking)
- Detects and blocks web application attacks
- Signature database continuously updated by F5 threat research
- Machine learning-based attack signature tuning
- Multiple enforcement modes: monitoring, blocking, risk-based
- Per-route policies for granular control
- Reference: `docs.cloud.f5.com/docs-v2/platform/reference/app-firewall`

**Attack Detection Methods**
1. **Signature-Based**: Pre-defined attack patterns (SQLi, XSS, path traversal, etc.)
2. **Anomaly Detection**: ML-based detection of unusual patterns
3. **Threat Campaigns**: Real-time protection against known campaigns
4. **Automatic Tuning**: ML learns false positives and adjusts signatures

**Enforcement Modes**
- **Monitoring**: Log attacks without blocking (detection only)
- **Blocking**: Block detected attacks (default enforcement)
- **Risk-Based**: Block high-risk, allow medium/low (configurable)

**Exclusion Rules** (Reduce false positives)
- Exclude specific attack signatures
- Exclude based on URL path, parameter, header
- Exclude based on value patterns
- Reference: `docs.cloud.f5.com/docs-v2/how-to/security/waf-exclusions`

### Key Workflows

**Workflow 1: Create WAF Policy (Default Protection)**
```
Prerequisites:
- HTTP load balancer exists
- Threat coverage requirements defined

Steps:
1. Navigate: Security > App Protection > WAF Policies
2. Click: Add WAF Policy button
3. Fill Metadata: Name, Namespace, Labels
4. Select: Detection Mode
   - Signature-Based (immediate protection)
   - Anomaly-Based (ML-powered)
   - Combined (both methods)
5. Select: Enforcement Mode
   - Blocking (default, attacks blocked)
   - Monitoring (attacks logged only)
6. Configure: Threat Campaigns
   - Enable automatic threat campaign signatures
   - Auto-update as new campaigns discovered
7. Submit: Save and Exit

Success Criteria:
- WAF policy appears in list
- Attach to HTTP LB to activate
- Security events start logging
```

**Workflow 2: Attach WAF Policy to HTTP Load Balancer**
```
Prerequisites:
- WAF policy created
- HTTP LB exists

Steps:
1. Edit HTTP Load Balancer
2. Navigate to: Security Policies section
3. Select: WAF Policy from dropdown
4. Choose: Enforcement Mode
   - Blocking: Production mode
   - Monitoring: Testing/tuning mode
5. Save changes

Immediate Effect:
- All traffic through LB now filtered by WAF
- Attacks blocked per policy rules
- Events logged to security dashboard
```

**Workflow 3: Create Exclusion Rule (Reduce False Positives)**
```
Prerequisites:
- WAF policy attached to LB
- False positive identified (legitimate request blocked)
- Know attack signature causing false positive

Steps:
1. Navigate to: WAF Policy > Exclusions tab
2. Click: Add Exclusion Rule
3. Configure:
   - Attack Signature: Select the specific signature
   - Condition: URL path, parameter, header name, or value
   - Scope: Single path, entire domain, all endpoints
4. Example:
   - Block: SQLi signature on /api/search
   - But exclude for: /api/search?q=<special_chars>
     when q parameter contains legitimate patterns
5. Submit: Apply exclusion

Validation:
- Same request no longer blocked
- Legitimate traffic passes through
- Attack signatures still catch actual attacks
```

**Workflow 4: Monitor & Tune WAF Policy**
```
Ongoing Process:

1. **Review Security Events**:
   - Navigate: Security > Events
   - Filter: By WAF policy, date range
   - Identify: False positives vs real attacks

2. **Analyze False Positives**:
   - Find: Attack signature causing false positive
   - Understand: Legitimate request pattern
   - Create: Exclusion rule (Workflow 3)

3. **Adjust Enforcement**:
   - Start: Monitoring mode (zero blocking)
   - Observe: False positive rate
   - Tune: Create exclusions for patterns
   - Graduate: Move to Blocking mode

4. **Review Attack Statistics**:
   - Most common attack types
   - Sources (geographic, IP ranges)
   - Targeted paths/parameters
   - Patterns to adjust protection

Ongoing Tuning:
- Quarterly review of false positives
- Update exclusion rules as application changes
- Monitor threat campaigns for new protection needed
```

### Form Fields & Configuration

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | Yes | Unique policy name |
| Namespace | Select | Yes | Resource isolation |
| Labels | Key-Value | No | Resource organization |
| Detection Mode | Select | Yes | Signature, Anomaly, Combined |
| Enforcement Mode | Radio | Yes | Monitoring, Blocking, Risk-Based |
| Threat Campaigns | Toggle | Yes | Enable auto-updating threat signatures |
| SQL Injection | Toggle | Yes | Detect SQLi attack signatures |
| XSS (Cross-Site Scripting) | Toggle | Yes | Detect XSS attack signatures |
| Path Traversal | Toggle | Yes | Detect directory traversal attempts |
| Command Injection | Toggle | Yes | Detect OS command injection |
| Custom Signatures | List | No | Add custom attack patterns |
| Exclusions | List | No | Exclude specific signatures, paths, headers |

### Prerequisites
- HTTP load balancer where WAF will attach
- Understanding of application legitimate traffic patterns
- Access to security events for monitoring/tuning

### Common Use Cases
- **Production website**: Blocking mode, regular signature updates
- **API endpoint**: Strict detection, parameter validation exclusions
- **New application**: Monitoring mode for tuning, then graduate to blocking
- **Sensitive data**: Combined detection modes for maximum protection
- **Multi-tenant**: Per-route policies for different security levels

### WAF Best Practices
- **Start in Monitoring**: Deploy in monitoring mode first
- **Review False Positives**: Tune exclusions before blocking
- **Automate Signatures**: Enable threat campaigns for latest protection
- **Test Changes**: Test exclusion rules before production
- **Monitor Regularly**: Review security events weekly minimum
- **Document Rules**: Keep exclusion reasons documented
- **Threat Intelligence**: Subscribe to threat feeds for awareness

### Monitoring & Validation
- **Security Events**: Real-time attack logging and statistics
- **False Positive Rate**: Monitor for legitimate traffic blocking
- **Block Rate**: Percentage of traffic blocked by WAF
- **Top Attack Types**: Most common threats detected
- **Geographic Trends**: Attack sources and patterns
- **CLI Validation**:
  ```bash
  xcsh security list app_firewall -n [namespace]
  xcsh security get app_firewall [name] -n [namespace]
  ```

### Official Documentation
- **Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/app-firewall
- **Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-configuration
- **Exclusions**: https://docs.cloud.f5.com/docs-v2/how-to/security/waf-exclusions
- **Threat Campaigns**: https://docs.cloud.f5.com/docs-v2/reference/threat-campaigns
- **Troubleshooting**: https://docs.cloud.f5.com/docs-v2/troubleshooting/waf-*

---

## 4. Cloud Sites & Distributed Deployment

### Overview
Deploy distributed edge sites across AWS, Azure, and GCP with orchestrated networking and automatic failover.

### Core Concepts

**Cloud Site** (Distributed edge deployment)
- Deploys F5 XC compute resources in customer cloud accounts
- Runs on AWS VPC, Azure VNet, or GCP VPC
- Provides local ingress, egress, and service routing
- Enables hybrid cloud and multi-cloud deployments
- Reference: `docs.cloud.f5.com/docs-v2/platform/reference/cloud-site`

**Cloud Site Types**
1. **AWS VPC Site**: Deployed in AWS VPC with EC2 instances
2. **Azure VNet Site**: Deployed in Azure VNet with VMs
3. **GCP VPC Site**: Deployed in GCP VPC with Compute Engine instances
4. **AWS Transit Gateway**: Advanced networking with transit gateway
5. **Kubernetes**: K8s cluster integration (EKS, AKS, GKE)

**Networking Architecture**
- **Inside Network**: Connects to customer workloads (private)
- **Outside Network**: Connects to internet or corporate network (public)
- **Network Interface**: Separate NIC for inside/outside
- **Firewall Integration**: Network ACLs, security groups, route tables
- **Auto-scaling**: Horizontal pod autoscaling based on metrics

### Key Workflows

**Workflow 1: Deploy AWS VPC Site**
```
Prerequisites:
- AWS account and VPC set up
- Cloud credentials (AWS access key/secret) configured
- Subnet identified for site deployment
- Security groups configured for F5 XC communication

Steps:
1. Navigate: Multi-Cloud Network Connect > Cloud Sites
2. Click: Add Cloud Site button
3. Select: Cloud Provider = AWS
4. Fill Metadata: Name, Namespace, Labels
5. Configure AWS Details:
   - Cloud Credentials: Select AWS credentials
   - Region: us-east-1 (or target region)
   - Availability Zone: us-east-1a (or preferred AZ)
6. Configure Networking:
   - VPC: Select target VPC
   - Inside Subnet: Private subnet for workload access
   - Outside Subnet: Public subnet for internet access
7. Configure Networking Interfaces:
   - Number of instances: 3 (default for HA)
   - Inside NIC: Primary network interface
   - Outside NIC: Secondary network interface
8. Advanced Options:
   - Security groups (auto-created or custom)
   - Route table management
   - Auto-scaling parameters
9. Submit: Deploy Site

Deployment Process:
- F5 XC provisions EC2 instances in VPC
- Configures network interfaces
- Installs F5 XC software
- Establishes connection to control plane
- Status: Deploying → Ready (may take 5-10 minutes)

Success Criteria:
- Site status shows "READY" in console
- Inside/Outside networks healthy
- Pod count shows running instances
```

**Workflow 2: Deploy Azure VNet Site**
```
Prerequisites:
- Azure subscription and resource group
- VNet with subnets created
- Azure credentials configured in F5 XC
- Service principal with necessary permissions

Steps:
1. Navigate: Multi-Cloud Network Connect > Cloud Sites
2. Click: Add Cloud Site button
3. Select: Cloud Provider = Azure
4. Fill Metadata: Name, Namespace, Labels
5. Configure Azure Details:
   - Cloud Credentials: Select Azure service principal
   - Subscription: Target subscription
   - Resource Group: Target resource group
   - Region: East US (or target region)
6. Configure Networking:
   - VNet: Select target VNet
   - Inside Subnet: Private subnet
   - Outside Subnet: Public subnet
7. Configure VM Details:
   - VM Size: Standard_D2s_v3 (or appropriate size)
   - Number of instances: 3 (for HA)
   - OS: Linux (default)
8. Advanced Options:
   - Network security groups
   - Route tables
   - Public IPs (if needed)
9. Submit: Deploy Site

Deployment:
- F5 XC provisions VMs in Azure
- Configures network interfaces
- Establishes hybrid connectivity
- Status: Deploying → Ready (5-10 minutes)

Cost Optimization:
- Use reserved instances for committed use
- Auto-scale based on load
- Monitor and right-size VM types
```

**Workflow 3: Deploy GCP VPC Site**
```
Prerequisites:
- GCP project set up
- VPC network with subnets
- GCP service account credentials
- Appropriate IAM roles configured

Steps:
1. Navigate: Multi-Cloud Network Connect > Cloud Sites
2. Click: Add Cloud Site button
3. Select: Cloud Provider = GCP
4. Fill Metadata: Name, Namespace, Labels
5. Configure GCP Details:
   - Cloud Credentials: Select GCP service account
   - Project: Target project
   - Region: us-central1 (or target)
   - Zone: us-central1-a (or preferred zone)
6. Configure Networking:
   - VPC Network: Select VPC
   - Inside Subnet: Private subnet
   - Outside Subnet: Public subnet
7. Configure Instance Details:
   - Machine Type: e2-standard-2 (or appropriate)
   - Number of instances: 3
   - Boot disk: SSD (recommended)
8. Advanced:
   - Firewall rules
   - Service accounts
   - Metadata and labels
9. Submit: Deploy Site

Success Criteria:
- Instances created in Compute Engine
- Network interfaces configured
- Communication established with control plane
- Status: Ready
```

### Form Fields & Configuration

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Name | Text | Yes | Unique site name |
| Namespace | Select | Yes | Resource isolation |
| Cloud Provider | Select | Yes | AWS, Azure, GCP, K8s |
| Cloud Credentials | Select | Yes | Pre-configured cloud creds |
| Region | Select | Yes | Target cloud region |
| Availability Zone | Select | Conditional | For single-AZ deployments |
| VPC/VNet/Network | Select | Yes | Target network |
| Inside Subnet | Select | Yes | Private workload access |
| Outside Subnet | Select | Yes | Internet/external access |
| Instance Count | Number | Yes | Usually 3 for HA |
| Instance Type/Size | Select | Yes | Compute resource sizing |
| Security Groups/NSGs | Select | No | Custom network security |
| Route Tables | Select | No | Custom routing |
| Auto-scaling | Config | No | Min/max instances, metrics |

### Prerequisites
- Cloud provider account with appropriate permissions
- VPC/VNet/Network pre-created
- Subnets with adequate IP ranges
- Cloud credentials configured in F5 XC
- Network connectivity to F5 XC control plane

### Common Use Cases
- **Hybrid deployment**: On-premises with cloud edge sites
- **Multi-cloud**: Apps across AWS, Azure, GCP
- **Edge acceleration**: Local site ingress for faster traffic processing
- **Disaster recovery**: Geo-redundant sites for failover
- **Compliance**: Data residency requirements met by site location

### Deployment Best Practices
- **High Availability**: Deploy 3+ instances minimum
- **Network Sizing**: Plan for workload traffic and scaling
- **Security Groups**: Restrict to required protocols/ports
- **Monitoring**: Enable cloud provider metrics integration
- **Testing**: Deploy to dev environment first
- **Documentation**: Map site to workloads and purposes

### Monitoring & Validation
- **Site Status**: Healthy/Unhealthy per site
- **Node Status**: Per-instance health and metrics
- **Network Health**: Inside/Outside connectivity
- **Latency**: Edge site to control plane and workloads
- **Resource Usage**: CPU, memory, network utilization
- **CLI Validation**:
  ```bash
  xcsh infrastructure list cloud_site -n [namespace]
  xcsh infrastructure get cloud_site [name] -n [namespace]
  ```

### Official Documentation
- **Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/cloud-site
- **AWS**: https://docs.cloud.f5.com/docs-v2/how-to/infrastructure/aws-vpc-site
- **Azure**: https://docs.cloud.f5.com/docs-v2/how-to/infrastructure/azure-vnet-site
- **GCP**: https://docs.cloud.f5.com/docs-v2/how-to/infrastructure/gcp-vpc-site
- **Troubleshooting**: https://docs.cloud.f5.com/docs-v2/troubleshooting/cloud-site-*

---

## 5. DNS Management & Global Load Balancing

### Overview
Global DNS service with distributed load balancers, geolocation routing, health checks, and automatic failover.

### Core Concepts

**DNS Load Balancer** (Global traffic steering)
- Returns different IPs based on geolocation, latency, or routing policies
- Supports multiple backend resources (HTTP LBs, origin pools, Kubernetes services)
- Geographic traffic steering (e.g., route US traffic to US edge, EU to EU)
- Latency-based routing (route to lowest latency endpoint)
- Failover routing (active-passive redundancy)
- Reference: `docs.cloud.f5.com/docs-v2/platform/reference/dns-loadbalancer`

**DNS Zone** (Domain management)
- Delegates domain authority to Volterra DNS servers
- Hosts DNS records (A, AAAA, CNAME, MX, TXT, etc.)
- Supports DNSSEC for security
- TTL configuration for caching
- Reference: `docs.cloud.f5.com/docs-v2/platform/reference/dns-zone`

**Geolocation Routing** (Location-based traffic steering)
- North America, South America, Europe, Asia, Africa, Oceania
- Country-level routing (e.g., route FR traffic to Paris datacenter)
- Fallback routing for unmapped regions
- Weight distribution across regions

**Health Checks for DNS** (Endpoint monitoring)
- Monitor HTTP/HTTPS/TCP endpoints
- Remove unhealthy endpoints from DNS responses
- Automatic failover to healthy backups
- Distributed health check agents (global)

### Key Workflows

**Workflow 1: Create DNS Zone**
```
Prerequisites:
- Domain registered and DNS managed by registrar
- Volterra tenant with DNS services enabled

Steps:
1. Navigate: Multi-Cloud Network Connect > DNS > Zones
2. Click: Add DNS Zone button
3. Fill: Zone Details
   - Domain Name: example.com
   - Namespace: production
   - Labels: zone-type=main
4. Configure SOA/NS Records:
   - SOA (Start of Authority) settings
   - Name servers (provided by Volterra)
5. Submit: Create Zone

Update Domain Registrar:
- Get Volterra name servers (e.g., ns1.volterra.net, ns2.volterra.net)
- Update domain registrar NS records to point to Volterra
- Propagation: 24-48 hours for full propagation

Success Criteria:
- Zone status shows "ACTIVE"
- NS records updated at registrar
- nslookup example.com returns Volterra name servers
```

**Workflow 2: Create DNS Load Balancer (Geolocation Routing)**
```
Prerequisites:
- DNS Zone created
- Multiple HTTP LBs deployed (e.g., US and EU edges)

Steps:
1. Navigate: Multi-Cloud Network Connect > DNS > Load Balancers
2. Click: Add DNS Load Balancer button
3. Fill Metadata: Name, Namespace, Labels
4. Configure: DNS Record Details
   - Record Name: api.example.com
   - Record Type: A (IPv4)
   - TTL: 60 seconds
5. Configure Pools:
   - Add Pool 1:
     - Name: US-pool
     - Resources: HTTP LB in us-east region
     - Priority: 1 (primary)
   - Add Pool 2:
     - Name: EU-pool
     - Resources: HTTP LB in eu-west region
     - Priority: 2 (secondary)
6. Configure Geolocation Routing:
   - North America → US-pool
   - Europe → EU-pool
   - Rest of World → Failover to US-pool
7. Configure Health Checks:
   - Enable health checks
   - Check interval: 10 seconds
   - Failure threshold: 2
8. Submit: Create DNS LB

Result:
- api.example.com resolves to:
  - North America: IP of us-east HTTP LB
  - Europe: IP of eu-west HTTP LB
  - Other regions: Fallback to US

Validation:
- Test from different geo regions:
  nslookup api.example.com (from US)
  nslookup api.example.com (from EU)
  - Should return different IPs per region
```

**Workflow 3: Configure DNS Failover (Active-Passive)**
```
Prerequisites:
- Primary and secondary resources configured
- Health checks set up for failover detection

Steps:
1. Create DNS Load Balancer (Workflow 2)
2. Configure Pools with Priorities:
   - Pool 1 (Primary): Priority 1, HTTP LB in primary region
   - Pool 2 (Secondary): Priority 2, HTTP LB in secondary region
3. Configure Health Checks:
   - Aggressive timing: 5-second interval, 1-2 failure threshold
   - Enables fast failover (5-10 seconds)
4. Save and Monitor

Failover Behavior:
- Normal: All traffic to Pool 1 (primary)
- Primary unhealthy: Automatic failover to Pool 2 (secondary)
- Primary recovers: Automatic failback to Pool 1

RTO (Recovery Time Objective): 10-20 seconds typically
```

**Workflow 4: Monitor DNS Load Balancer**
```
Ongoing Monitoring:

1. **Health Status**:
   - Navigate: DNS > Load Balancers > [LB Name]
   - View: Pool health per endpoint
   - Check: Last health check time

2. **Query Statistics**:
   - Queries per second (QPS)
   - Top queried domains
   - Query response times
   - DNSSEC validation stats

3. **Geolocation Distribution**:
   - Traffic by region
   - Queries per geolocation pool
   - Latency per region

4. **Failover Events**:
   - History of failovers
   - Failover reasons
   - Failover duration
   - Failback events

5. **Performance Metrics**:
   - DNS response time
   - Pool health status
   - Query success rate
   - Cache hit ratio (if enabled)
```

### Form Fields & Configuration

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Domain Name | Text | Yes | e.g., example.com |
| Record Name | Text | Yes | e.g., api, www, * (for subdomain) |
| Record Type | Select | Yes | A, AAAA, CNAME, MX, TXT |
| TTL | Number | Yes | Seconds (60-86400 typical) |
| Pool Name | Text | Yes | Logical grouping of resources |
| Pool Priority | Number | Yes | 1=highest, 10=lowest |
| Geolocation | Select | No | Geographic routing regions |
| Health Check | Select | Yes | HTTP, HTTPS, TCP |
| Health Check Interval | Number | Yes | Seconds between checks |
| Health Check Timeout | Number | Yes | Seconds to wait for response |
| Failure Threshold | Number | Yes | Failures before marking unhealthy |

### Prerequisites
- DNS Zone created and delegated
- Target resources (HTTP LBs, origin pools) deployed
- Health check endpoints configured on targets
- Geolocation routing policy defined

### Common Use Cases
- **Global API**: Geolocation routing to nearest datacenter
- **Disaster recovery**: Active-passive failover across regions
- **Load distribution**: Latency-based routing to closest edge
- **Multi-region**: Route traffic based on geographic location
- **Compliance**: Keep traffic within specific regions

### DNS Best Practices
- **TTL Strategy**:
  - 60-300 seconds for active failover scenarios
  - 3600+ for stable, infrequently changing records
- **Health Checks**: 10-second interval, 1-2 failure threshold for fast failover
- **Monitoring**: Weekly review of failover events and latency
- **Documentation**: Map DNS records to resources and purposes
- **Testing**: Test geolocation routing from multiple regions

### Monitoring & Validation
- **DNS Query Rate**: QPS per record and region
- **Response Time**: Milliseconds per query
- **Pool Health**: Status and history of endpoints
- **Failover Events**: Automatic detection and response
- **Geographic Distribution**: Traffic by region
- **CLI Validation**:
  ```bash
  xcsh load_balancer list dns_loadbalancer -n [namespace]
  xcsh load_balancer get dns_loadbalancer [name] -n [namespace]
  ```

### Official Documentation
- **DNS Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/dns-loadbalancer
- **DNS Zone**: https://docs.cloud.f5.com/docs-v2/platform/reference/dns-zone
- **Geolocation**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/dns-geolocation-routing
- **Failover**: https://docs.cloud.f5.com/docs-v2/how-to/app-networking/dns-failover
- **Troubleshooting**: https://docs.cloud.f5.com/docs-v2/troubleshooting/dns-*

---

## 6. Advanced Security Features

### Overview
Bot Defense, API Protection, DDoS mitigation, service policies, network firewalls, and compliance frameworks.

### Bot Defense

**Bot Defense** (Malicious bot mitigation)
- JavaScript challenge: Legitimate browsers solve challenge, bots blocked
- Device fingerprinting: Detect anomalous patterns
- Threat intelligence: Signatures of known malicious bots
- Behavioral analysis: ML-based bot detection
- Reference: `docs.cloud.f5.com/docs-v2/platform/reference/bot-defense`

**Bot Defense Modes**
- **Monitoring**: Log bot activity without blocking
- **Blocking**: Challenge/block detected bots
- **Mitigation**: Block with customizable response

**Common Bot Threats**
- Credential stuffing (password testing)
- Web scraping (content theft)
- Denial of Service (attack traffic)
- Malicious proxies and botnets
- Automated vulnerability scanning

### API Protection

**API Protection** (Application API security)
- OpenAPI specification validation
- Request/response enforcement
- API key management and validation
- Rate limiting per API endpoint
- Parameter validation and type checking
- Reference: `docs.cloud.f5.com/docs-v2/platform/reference/api-protection`

**Key Features**
- **Schema Validation**: Enforce OpenAPI/Swagger specs
- **Request Validation**: Verify headers, methods, content-type
- **Parameter Validation**: Type, format, value constraints
- **API Key Management**: Generate, rotate, revoke API keys
- **Rate Limiting**: Per-endpoint rate limits
- **Endpoint Discovery**: Automatically discover undocumented APIs

### Service Policies

**Service Policy** (Request/response processing)
- Apply policies at service (virtual IP) level
- Traffic management rules
- Request routing and rewriting
- Header manipulation
- Cookie policies
- Reference: `docs.cloud.f5.com/docs-v2/platform/reference/service-policy`

### Network Firewall

**Network Firewall** (Layer 3-4 protection)
- TCP/UDP port filtering
- IP-based access control
- DDoS attack detection
- SYN/UDP flood protection
- Rate limiting
- Reference: `docs.cloud.f5.com/docs-v2/platform/reference/network-firewall`

### Key Workflows

**Workflow 1: Enable Bot Defense on HTTP Load Balancer**
```
Prerequisites:
- HTTP LB created
- Bot Defense policy created (or use predefined)

Steps:
1. Edit HTTP Load Balancer
2. Navigate to: Security Policies section
3. Select: Bot Defense Policy from dropdown
4. Choose: Enforcement Mode
   - Monitoring: Log bot activity
   - Blocking: Challenge/block bots
5. Configure: Challenge Type
   - JavaScript challenge (for browsers)
   - CAPTCHA (additional validation)
6. Save and Exit

Effect:
- Browsers accessing endpoint solve challenge
- Bot traffic blocked or logged
- Legitimate human traffic passes through
```

**Workflow 2: Enable API Protection**
```
Prerequisites:
- API endpoint (HTTP LB) created
- OpenAPI specification available
- API documentation

Steps:
1. Create API Protection Policy
2. Upload OpenAPI Specification
3. Configure Validation Rules:
   - Enforce request format
   - Validate parameters
   - Check authentication
4. Attach to HTTP LB
5. Enable Rate Limiting per endpoint
6. Monitor: API Protection events

Result:
- Invalid API requests rejected
- Undocumented APIs detected
- Rate limiting enforced per endpoint
```

### Prerequisites
- HTTP load balancer deployed
- Threat policies created or selected
- Enforcement mode defined

### Common Use Cases
- **Public APIs**: Bot Defense + API Protection + Rate Limiting
- **E-commerce**: Bot Defense + WAF + DDoS protection
- **Financial services**: Multiple security layers + compliance logging
- **SaaS applications**: API Protection + service policies

### Official Documentation
- **Bot Defense**: https://docs.cloud.f5.com/docs-v2/platform/reference/bot-defense
- **API Protection**: https://docs.cloud.f5.com/docs-v2/platform/reference/api-protection
- **Service Policy**: https://docs.cloud.f5.com/docs-v2/platform/reference/service-policy
- **Network Firewall**: https://docs.cloud.f5.com/docs-v2/platform/reference/network-firewall
- **Compliance**: https://docs.cloud.f5.com/docs-v2/reference/compliance-frameworks

---

## 7. Administration & Tenant Management

### Overview
User management, access control, credentials, API tokens, quotas, and billing.

### Core Administration Resources

**Users** (User accounts)
- Create/manage user accounts
- Assign roles and permissions
- Multi-factor authentication (MFA)
- Login methods (password, SSO)
- Reference: `docs.cloud.f5.com/docs-v2/administration/users`

**Groups** (User grouping)
- Organize users into logical groups
- Group-based access control
- Role assignment per group
- Reference: `docs.cloud.f5.com/docs-v2/administration/groups`

**Roles** (Access control)
- Built-in roles: Admin, Editor, Viewer
- Custom role creation
- Fine-grained permissions
- Reference: `docs.cloud.f5.com/docs-v2/administration/roles`

**Credentials** (Cloud credentials)
- AWS access keys, Azure service principals, GCP service accounts
- Terraform provider credentials
- Sensitive data management
- Reference: `docs.cloud.f5.com/docs-v2/administration/credentials`

**API Credentials** (Programmatic access)
- API tokens for automation
- Token rotation and expiration
- Scoped access control
- Reference: `docs.cloud.f5.com/docs-v2/administration/api-credentials`

**Quotas** (Resource limits)
- Control maximum resources per namespace
- Resource type quotas (HTTP LBs, origin pools, etc.)
- Billing and cost management
- Reference: `docs.cloud.f5.com/docs-v2/administration/quotas`

**My Namespaces** (Namespace management)
- Create/delete namespaces
- Set default namespace
- View namespace details
- Reference: `docs.cloud.f5.com/docs-v2/administration/namespaces`

### Key Workflows

**Workflow 1: Create User Account**
```
Prerequisites:
- Admin access to tenant
- User email address
- Role assignment defined

Steps:
1. Navigate: Administration > Users
2. Click: Add User button
3. Fill: User Details
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@company.com
   - Role: Editor (or appropriate role)
4. Submit: Create User
5. User receives email with login link
6. User sets password on first login

Access Control:
- Based on assigned role (Admin, Editor, Viewer)
- Namespace-level access if scoped
- Default: Can access all namespaces
```

**Workflow 2: Create API Token**
```
Prerequisites:
- User account or service principal
- Purpose of API token defined

Steps:
1. Navigate: Administration > API Credentials
2. Click: Generate Token button
3. Configure: Token Details
   - Token Name: terraform-automation
   - Expiration: 90 days
   - Scope: (Optional) Namespace restrictions
4. Copy: API token value (shown once only)
5. Store: Securely in password manager or CI/CD secrets

Usage:
```bash
export F5XC_API_URL="https://nferreira.staging.volterra.us"
export F5XC_API_TOKEN="copied-token-value"
xcsh configuration list http_loadbalancer
```

Token Management:
- Rotate tokens every 90 days
- Revoke if compromised
- Use minimal-scope tokens
- Monitor token usage
```

**Workflow 3: Set Resource Quotas**
```
Prerequisites:
- Namespace management access
- Resource limits defined

Steps:
1. Navigate: Administration > Quotas
2. Click: Set Quota button
3. Select: Namespace (e.g., production)
4. Configure: Resource Limits
   - HTTP Load Balancers: 50
   - Origin Pools: 100
   - WAF Policies: 20
   - Cloud Sites: 10
   - DNS Zones: 5
5. Submit: Apply Quotas

Effect:
- Users in namespace cannot exceed limits
- Creation attempts fail with quota exceeded
- Monitoring: View current usage vs quotas
```

### Form Fields & Configuration

| Resource | Key Fields | Management |
|----------|-----------|------------|
| User | Email, Name, Role, MFA | Create, edit roles, reset password, disable |
| Group | Name, Description, Members | Create, add/remove users, assign roles |
| Role | Name, Permissions, Scope | View built-in, create custom, modify permissions |
| Credentials | Type, Provider, Credentials | Add, rotate, delete, test connectivity |
| API Token | Name, Expiration, Scope | Generate, rotate, revoke, view usage |
| Quota | Resource Type, Limit | Set per namespace, monitor usage |
| Namespace | Name, Description, Tenant | Create, delete, set default |

### Prerequisites
- Admin access to tenant
- User management policies defined
- Access control strategy determined

### Common Use Cases
- **Multi-team**: Separate namespaces per team, role-based access
- **Automation**: Dedicated API tokens for Terraform, scripts
- **Contractors**: Limited role (Viewer), time-limited access
- **Compliance**: Audit logging, access reviews, quota enforcement

### Security Best Practices
- **API Tokens**: Store securely, rotate regularly, revoke unused
- **Access Control**: Principle of least privilege (minimal roles)
- **MFA**: Enable for all users, especially admins
- **Audit Logging**: Review access logs regularly
- **Credential Rotation**: Rotate cloud credentials quarterly
- **Quota Enforcement**: Prevent runaway resource creation

### Official Documentation
- **Users**: https://docs.cloud.f5.com/docs-v2/administration/users
- **Groups**: https://docs.cloud.f5.com/docs-v2/administration/groups
- **Roles**: https://docs.cloud.f5.com/docs-v2/administration/roles
- **API Credentials**: https://docs.cloud.f5.com/docs-v2/administration/api-credentials
- **Quotas**: https://docs.cloud.f5.com/docs-v2/administration/quotas

---

## Cross-Resource Dependencies

### Resource Creation Order (Typical Workflow)

1. **Namespace** (foundation)
   - Created first for isolation

2. **Origin Pools** (backend servers)
   - Created before HTTP LBs that reference them
   - Requires backend servers deployed

3. **TLS Certificates** (if manual HTTPS)
   - Created before HTTP LBs using them
   - Usually auto-provisioned via ACME

4. **HTTP Load Balancers** (frontend)
   - Depend on Origin Pools
   - Reference WAF policies, rate limiting (optional)

5. **WAF Policies** (security)
   - Can be created independently
   - Attached to HTTP LBs after creation

6. **Cloud Sites** (edge deployment)
   - Created to extend architecture
   - Used with local ingress/egress routing

7. **DNS Load Balancers** (global routing)
   - Created after HTTP LBs deployed
   - Direct traffic across regions/providers

### Typical Multi-Region Deployment

```
Region 1 (US-East):
- Namespace: production-us
- Origin Pool: backend-us (3 servers)
- HTTP LB: api-lb-us
- Cloud Site: aws-us-east (optional)

Region 2 (EU-West):
- Namespace: production-eu
- Origin Pool: backend-eu (3 servers)
- HTTP LB: api-lb-eu
- Cloud Site: aws-eu-west (optional)

Global:
- DNS Zone: example.com
- DNS Load Balancer: api.example.com
  - Routes North America → api-lb-us
  - Routes Europe → api-lb-eu
  - Failover: If region down, use other region
```

---

## Quick Reference: Common Error Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Origin pool unhealthy | Health check failing | Verify backend health check endpoint, check firewall, test connectivity |
| HTTP LB stuck in "Creating" | Backend resource missing | Verify origin pool exists and is healthy |
| Certificate expired | Manual cert not renewed | Use automatic certificate (ACME) instead |
| DNS not resolving | Zone not delegated | Verify NS records updated at domain registrar |
| WAF false positives | Legitimate traffic blocked | Create exclusion rule for the signature/path |
| Bot challenge not appearing | JS challenge not served | Check cache settings, browser JS enabled |
| Cloud site not ready | Network misconfiguration | Verify subnets, security groups, route tables |
| Quota exceeded | Resource limit reached | Delete unused resources or increase quota |

---

## Learning Resources

### Getting Started
- **Onboarding**: https://docs.cloud.f5.com/docs-v2/getting-started
- **Quick Start**: https://docs.cloud.f5.com/docs-v2/getting-started/quick-start
- **Architecture**: https://docs.cloud.f5.com/docs-v2/concepts/architecture

### Advanced Topics
- **Best Practices**: https://docs.cloud.f5.com/docs-v2/best-practices
- **Troubleshooting**: https://docs.cloud.f5.com/docs-v2/troubleshooting
- **API Reference**: https://docs.cloud.f5.com/docs-v2/api

### Community & Support
- **Slack Community**: https://f5.com/slack
- **GitHub Examples**: https://github.com/f5
- **Support Portal**: https://support.f5.com

---

**Documentation Index Version**: 1.0.0
**Last Updated**: 2025-12-24
**Status**: Ready for Phase 2 Step 8 (linking to console pages) and Phase 3 (workflow development)
