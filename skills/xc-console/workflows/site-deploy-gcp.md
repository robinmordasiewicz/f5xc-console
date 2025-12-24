---
title: Workflow - Deploy Cloud Site (GCP VPC)
description: Deploy F5 Distributed Cloud service to GCP VPC with automatic ingress/egress
version: 1.0.0
last_updated: 2025-12-24
category: Cloud Deployment
complexity: Intermediate
estimated_duration: 30-45 minutes
---

# Workflow: Deploy Cloud Site (GCP VPC)

## Overview
Deploy F5 Distributed Cloud services to your Google Cloud Platform (GCP) VPC as a cloud site, providing automatic ingress/egress, load balancing, and security services within your GCP infrastructure.

## Prerequisites
- ✅ GCP project with VPC network created
- ✅ GCP service account key JSON (with Compute and VPC permissions)
- ✅ Target VPC network and subnet information available
- ✅ GCP firewall rules configured (minimum port 443 for API)
- ✅ F5 XC namespace created for site deployment
- ✅ GCP quotas sufficient (CPU cores, disks, IPs)

## Input Parameters

```json
{
  "name": "gcp-site-us-central1",
  "namespace": "production",
  "cloud_provider": "gcp",
  "site_type": "ingress_egress",
  "gcp_configuration": {
    "project_id": "my-gcp-project",
    "region": "us-central1",
    "vpc_network": "default",
    "subnet": "default",
    "zone": "us-central1-a"
  },
  "machine_type": "n1-standard-4",
  "nodes": 3,
  "labels": {
    "region": "us-central1",
    "environment": "production",
    "cloud": "gcp"
  }
}
```

## Step-by-Step Execution

### Step 1: Navigate to Cloud Sites Page

**Console Path**: Distributed Apps > Cloud Sites > Sites

**Details**:
- Click "Distributed Apps" in left sidebar
- Click "Cloud Sites" submenu
- Click "Sites"
- Should see list of existing cloud sites

**Verify**: Cloud Sites list page displayed

---

### Step 2: Click Add Cloud Site Button

**Details**:
- Click "Add Cloud Site" button (top right)
- Should open cloud site creation form

**Verify**: Blank cloud site creation form displayed

---

### Step 3: Fill Metadata Section

**Details**:

1. **Name**: Enter "gcp-site-us-central1"
   - Unique identifier for the cloud site
   - Format: lowercase alphanumeric + dashes
   - Naming convention: `<provider>-site-<region>`

2. **Namespace**: Select "production"
   - Where site resources are managed
   - Determines billing and isolation

3. **Labels** (optional): Add labels
   - Key: "region" → Value: "us-central1"
   - Key: "environment" → Value: "production"
   - Key: "cloud" → Value: "gcp"

**Verify**:
- Name shows "gcp-site-us-central1"
- Namespace shows "production"
- Labels displayed

---

### Step 4: Select Site Type

**Details**:

1. Look for "Site Type" dropdown
2. Select: "Ingress/Egress"
   - Provides bidirectional traffic handling
   - Recommended for full functionality

**Verify**: "Ingress/Egress" is selected

---

### Step 5: Select Cloud Provider

**Details**:

1. Look for "Cloud Provider" dropdown
2. Select: "GCP"
3. This reveals GCP-specific configuration fields

**Verify**: "GCP" is selected, GCP fields visible

---

### Step 6: Configure GCP Credentials

**Details**:

1. **GCP Project ID**: Enter "my-gcp-project"
   - Your GCP project ID
   - Found in GCP Console → Settings

2. **Service Account Credentials**:
   - May already be configured in Cloud Provider settings
   - If needed:
     - Create service account in GCP IAM
     - Download JSON key
     - Upload to F5 XC console
   - Required permissions:
     - Compute Instance Admin
     - Security Admin (firewall rules)
     - Service Account User

**Verify**: Project ID populated, credentials active

---

### Step 7: Select Region and Zone

**Details**:

1. **Region**: Select "us-central1"
   - Dropdown with GCP regions
   - Deployment template goes to this region

2. **Zone**: Select "us-central1-a"
   - Specific zone within region
   - Instances deployed to this zone
   - For HA, F5 can spread across zones

3. **Alternative Zones** (if available):
   - Consider regional distribution
   - us-central1-b, us-central1-c for redundancy

**Verify**:
- Region: "us-central1"
- Zone: "us-central1-a"

---

### Step 8: Select VPC Network and Subnet

**Details**:

1. **VPC Network**: Select "default" or your VPC
   - Dropdown lists networks in project
   - Select your target VPC
   - Example: "default", "custom-vpc", etc.

2. **Subnet**: Select "default" or target subnet
   - Must be in selected VPC and region
   - Recommended: Private subnet for security
   - Will show CIDR range (e.g., 10.128.0.0/20)

3. **Secondary IP Ranges** (if needed):
   - For pod networking or advanced config
   - Usually not required

**Verify**:
- VPC Network: Selected
- Subnet: Selected with correct region

---

### Step 9: Configure GCP Networking

**Details**:

1. **Firewall Rules**:
   - Verify existing rules allow:
     - Inbound 443 (HTTPS API)
     - Inbound 22 (SSH, if needed)
     - Outbound to internet (F5 management)
   - May auto-create or require manual setup

2. **Network Tags**:
   - GCP uses tags for firewall rules
   - F5 may auto-create tags
   - Apply tags to control traffic

**For now**: Verify rules exist, adjust as needed

---

### Step 10: Configure VM Sizing

**Details**:

1. **Machine Type**: Select "n1-standard-4"
   - GCP machine type for compute appliance
   - Options: n1-standard-2, n1-standard-4, n1-standard-8, n2-standard-4, etc.
   - n1-standard-4 = 4 vCPUs, 15GB memory
   - Suitable for moderate workloads

2. **Number of Instances**: Enter "3"
   - Number of VMs to deploy
   - Minimum: 1 (testing only)
   - Recommended: 3 (for HA)
   - Higher = greater resilience, more cost

3. **Disk Configuration**:
   - Boot disk: Usually 100GB
   - Disk type: Standard or SSD (Premium)
   - Recommended: Standard for cost savings

**Verify**:
- Machine type: "n1-standard-4"
- Instance count: "3"
- Disk size and type acceptable

---

### Step 11: Advanced Configuration (Optional)

**Details** (can use defaults):

1. **Preemptible Instances** (if cost-sensitive):
   - Cheaper but can be interrupted
   - Not recommended for production
   - OK for non-critical sites

2. **Boot Image**:
   - Usually defaults to GCE-optimized Ubuntu
   - Pre-installed Volterra software (CE)

3. **Service Account**:
   - May use default or custom
   - Needs permissions to manage compute resources

**For now**: Use defaults

---

### Step 12: Review and Submit

**Details**:

1. Review configuration:
   - Name: gcp-site-us-central1 ✓
   - Cloud Provider: GCP ✓
   - Region: us-central1 ✓
   - Machine Type: n1-standard-4 ✓
   - Instance Count: 3 ✓

2. Click "Save and Exit" or "Create"
   - Deployment template generated
   - GCP deployment begins

3. Redirect to Cloud Sites list

**Expected**: GCP deployment starting

---

### Step 13: Monitor Cloud Site Provisioning

**Details**:

1. Look for "gcp-site-us-central1" in Cloud Sites list
   - Status: "Creating" or "Provisioning"
   - Typical duration: 15-25 minutes

2. Watch status progression:
   - "Creating" → GCP deploying instances
   - "Checking Health" → VMs starting
   - "ONLINE" → Site fully operational

3. Click on site name to view details:
   - GCP instances created
   - IP addresses assigned
   - Health check status

**Verify**: Status eventually shows "ONLINE"

---

### Step 14: Validate GCP Deployment (GCP Console)

**Details**:

1. Log into GCP Console
2. Navigate to Compute Engine > VM Instances
3. Look for instances matching site name:
   - "gcp-site-us-central1-1", "gcp-site-us-central1-2", "gcp-site-us-central1-3"
   - Region: "us-central1"
   - Zone: "us-central1-a"
   - Machine type: "n1-standard-4"
   - Status: "Running"

4. Verify network configuration:
   - Network Interfaces: Attached to correct VPC
   - Internal IP: Within subnet CIDR range
   - External IP: Assigned (for API access)

5. Check firewall rules:
   - VPC Network > Firewall Rules
   - Rules for port 443 exist and allow traffic

**Verify**: All 3 instances running, network configured

---

### Step 15: Verify Site Health (F5 XC Console)

**Details**:

1. Click on site name in Cloud Sites list
2. View "Health Status" section:
   - All 3 instances should show "HEALTHY"
   - Each shows its internal/external IP
   - Health checks "PASSED"

3. View "Details" tab:
   - Deployment status: "ONLINE"
   - Region: "us-central1"
   - Machine type: "n1-standard-4"
   - Node count: "3"

**Verify**:
- All nodes show HEALTHY ✓
- Overall status: ONLINE ✓
- Deployment succeeded ✓

---

## Validation with CLI

**Command**: Verify cloud site creation

```bash
# List all cloud sites
xcsh configuration list cloud_site -n production

# Get specific cloud site details
xcsh configuration get cloud_site gcp-site-us-central1 -n production

# Expected output includes:
# - Name: gcp-site-us-central1
# - Cloud: gcp
# - Region: us-central1
# - Status: ONLINE
# - Nodes: 3 (all healthy)
# - Type: INGRESS_EGRESS

# Verify GCP instances
gcloud compute instances list --filter="name:gcp-site-us-central1"
```

---

## Success Criteria

- [x] Cloud site appears in console list
- [x] Status shows "ONLINE"
- [x] All 3 nodes show "HEALTHY"
- [x] GCP instances running in VPC
- [x] Firewall rules configured
- [x] CLI confirms site creation
- [x] Site ready to accept traffic

---

## Testing Site Connectivity

### Test API Connectivity

```bash
# Get site IP from console, then:
curl -k https://<site-ip>/api/ping

# Expected: 200 OK response
```

### Create HTTP Load Balancer Using This Site

```
See workflow: http-loadbalancer-create-basic.md
In "Origin Pool" step, select this GCP site as endpoint
```

### Monitor Site Traffic

```
Navigate to: Cloud Sites > gcp-site-us-central1 > Metrics
View:
  - Bytes in/out
  - Requests per second
  - Active connections
  - Health check status
```

---

## Common Issues & Troubleshooting

### Issue: GCP Deployment Fails

**Symptoms**:
- Site status shows "FAILED"
- GCP console shows errors
- Instances not created

**Solutions**:
1. Check GCP Cloud Deployment Manager or direct logs
2. Common causes:
   - Service account permissions insufficient
   - VPC network doesn't exist
   - Quota exceeded (vCPU, disk, IPs)
   - Region/zone mismatch
3. Verify quotas:
   - GCP Console → Quotas
   - Check vCPU, persistent disk, IP quotas
4. Increase quotas if needed
5. Retry cloud site creation

---

### Issue: Nodes Show UNHEALTHY

**Symptoms**:
- Site status shows "Provisioning" for >20 minutes
- Nodes show "UNHEALTHY"
- Health check failures

**Solutions**:
1. Wait 15-20 minutes (instances starting)
2. Check GCP Compute Engine console:
   - All 3 instances running?
   - Network interfaces attached?
   - IPs assigned?
3. Verify firewall rules allow:
   - Inbound 443 (HTTPS)
   - Outbound to internet
4. Check security tags:
   - Instances have correct network tags?
   - Tags match firewall rule targets?

---

### Issue: Cannot Access API (No External IP)

**Symptoms**:
- Cannot reach site IP for API access
- External IP not showing for instances
- Firewall rules exist but traffic blocked

**Solutions**:
1. Verify instances have external IPs:
   - GCP Console → VM Instances
   - Click instance → Check external IP
   - May need to assign if not auto-created

2. Check firewall rules:
   - Source IP: Ensure allowing your IP
   - Destination: Must include instance network tags
   - Protocol/Port: Must allow 443/TCP

3. Check security context:
   - Service account has compute.instances.get permission
   - IAM roles correctly assigned

---

### Issue: Service Account Permissions Denied

**Symptoms**:
- Error: "Permission denied" during deployment
- "Insufficient permissions" message

**Solutions**:
1. Verify service account has roles:
   - Compute Instance Admin (v1)
   - Security Admin
   - Service Account User
   - Network Admin (for VPC/firewall)

2. Check GCP Console:
   - IAM & Admin > IAM
   - Verify service account assignments
   - Add missing roles if needed

3. Update credentials in F5 XC if changed:
   - Cloud Sites > Cloud Provider Settings
   - Re-upload service account key

---

## Next Steps

After successfully deploying GCP cloud site:

1. **Create Origin Pool**: Reference this site as backend
   - See workflow: `origin-pool-create-basic.md`

2. **Create HTTP Load Balancer**: Route traffic to site
   - See workflow: `http-loadbalancer-create-basic.md`

3. **Monitor Cloud Site**: Watch health and metrics
   - View traffic graphs
   - Check node health

4. **Deploy More Sites**: Add sites in other regions
   - See workflow: `site-deploy-aws.md` (AWS)
   - See workflow: `site-deploy-azure.md` (Azure)

5. **Create DNS Load Balancer**: Enable multi-region failover
   - See workflow: `dns-loadbalancer-create-geolocation.md`

---

## Monitoring Cloud Site

### View Site Metrics

```
Navigate to: Cloud Sites > gcp-site-us-central1 > Metrics
Metrics:
  - CPU utilization per instance
  - Memory usage
  - Network bytes in/out
  - Requests per second
```

### Monitor Node Health

```
Navigate to: Cloud Sites > gcp-site-us-central1 > Nodes
View:
  - Each instance's status (HEALTHY/UNHEALTHY)
  - Last health check time
  - Instance IP address
```

### View Deployment Logs

```
Navigate to: Cloud Sites > gcp-site-us-central1 > Logs
View:
  - Deployment logs
  - CE boot logs
  - Connectivity logs
```

---

## GCP Deployment Integration

### Understanding the Generated Deployment

F5 XC generates a GCP Deployment Manager template that:

1. **Creates Compute Instances** (3x n1-standard-4):
   - GCE-optimized Ubuntu OS
   - Pre-installed Volterra software (CE)
   - Auto-configured for F5 management

2. **Configures Networking**:
   - Network interfaces in your VPC
   - Internal and external IPs
   - Firewall rules for API and traffic

3. **Sets Up IAM**:
   - Service account for instances
   - IAM policies for management access

### Cost Considerations

### GCP Charges

Resources created with associated costs:

1. **Compute Instances**: n1-standard-4 × 3
   - ~$0.15/hour each (~$0.45/hour total)
   - 24/7 ≈ $330/month

2. **Persistent Disks**: 100GB × 3
   - Standard or SSD option
   - Standard: ~$15-20/month
   - SSD: ~$50-60/month

3. **External IPs** (if assigned):
   - ~$0.01-4/hour per IP (depends on usage)
   - Free if actively used

4. **Network Traffic**:
   - Ingress to VPC: Free
   - Egress within region: Free
   - Egress out of region/internet: ~$0.02/GB

**Total Estimated**: ~$350-400/month for 3-node site

### Cost Optimization

1. Use n1-standard-2 for light workloads
2. Use preemptible instances for non-critical (40% cheaper)
3. Reduce to 1 instance for development/testing
4. Use standard disks instead of SSD

---

## Cleanup/Rollback

To delete the cloud site:

1. Navigate to Cloud Sites list
2. Click menu next to site name
3. Select "Delete"
4. Confirm deletion
5. F5 XC deletes Deployment Manager template
6. GCP automatically removes all instances and resources
7. Cleanup takes 10-15 minutes

**Caution**: Deletes all instances and data. Ensure no active traffic/data.

---

## Related Documentation

- **Cloud Sites Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/cloud-site
- **GCP Deployment**: https://docs.cloud.f5.com/docs-v2/how-to/cloud-networking/gcp-site-deployment
- **Deployment Manager Template**: https://docs.cloud.f5.com/docs-v2/reference/gcp-deployment-manager
- **Site Types**: https://docs.cloud.f5.com/docs-v2/how-to/cloud-networking/site-types
- **Networking Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/cloud-networking/site-networking

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24

