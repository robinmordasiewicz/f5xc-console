---
title: Workflow - Deploy Cloud Site (Azure VNet)
description: Deploy F5 Distributed Cloud service to Azure Virtual Network with automatic ingress/egress
version: 1.0.0
last_updated: 2025-12-24
category: Cloud Deployment
complexity: Intermediate
estimated_duration: 30-45 minutes
---

# Workflow: Deploy Cloud Site (Azure VNet)

## Overview
Deploy F5 Distributed Cloud services to your Azure Virtual Network (VNet) as a cloud site, providing automatic ingress/egress, load balancing, and security services within your Azure infrastructure.

## Prerequisites
- ✅ Azure subscription with VNet created
- ✅ Azure service principal credentials (App ID, Tenant ID, Secret)
- ✅ Target VNet and subnet information available
- ✅ Azure network security groups configured (minimum port 443 for API)
- ✅ F5 XC namespace created for site deployment
- ✅ Azure resource group for site deployment

## Input Parameters

```json
{
  "name": "azure-site-eastus",
  "namespace": "production",
  "cloud_provider": "azure",
  "site_type": "ingress_egress",
  "azure_configuration": {
    "subscription_id": "00000000-0000-0000-0000-000000000000",
    "resource_group": "volterra-prod-eastus",
    "region": "eastus",
    "vnet_id": "/subscriptions/00000000.../resourceGroups/my-rg/providers/Microsoft.Network/virtualNetworks/my-vnet",
    "subnet_id": "/subscriptions/00000000.../resourceGroups/my-rg/providers/Microsoft.Network/virtualNetworks/my-vnet/subnets/subnet-1",
    "network_security_group": "nsg-volterra"
  },
  "vm_instance_type": "Standard_D4s_v3",
  "nodes": 3,
  "labels": {
    "region": "eastus",
    "environment": "production",
    "cloud": "azure"
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
- Should open cloud site creation form with multiple sections/tabs

**Verify**: Blank cloud site creation form displayed

---

### Step 3: Fill Metadata Section

**Details**:

1. **Name**: Enter "azure-site-eastus"
   - Unique identifier for the cloud site
   - Format: lowercase alphanumeric + dashes
   - Naming convention: `<provider>-site-<region>`

2. **Namespace**: Select "production"
   - Where site resources are managed
   - Determines billing and isolation

3. **Labels** (optional): Add labels
   - Key: "region" → Value: "eastus"
   - Key: "environment" → Value: "production"
   - Key: "cloud" → Value: "azure"

**Verify**:
- Name shows "azure-site-eastus"
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
2. Select: "Azure"
3. This reveals Azure-specific configuration fields

**Verify**: "Azure" is selected, Azure fields visible

---

### Step 6: Configure Azure Credentials

**Details**:

1. **Azure Subscription ID**: Enter "00000000-0000-0000-0000-000000000000"
   - Your Azure subscription GUID
   - Find in Azure Portal: Subscriptions → Subscription ID

2. **Azure Tenant ID** (if required):
   - Typically auto-populated
   - Your Azure Active Directory tenant ID

3. **Service Principal Credentials** (may be stored already):
   - If not, may need to configure in Cloud Provider settings
   - Requires: App ID, Tenant ID, Client Secret

**Verify**: Subscription ID populated and confirmed

---

### Step 7: Select Region and Resource Group

**Details**:

1. **Region**: Select "eastus"
   - Dropdown with Azure regions
   - ARM templates deployed to this region

2. **Resource Group**: Select or create "volterra-prod-eastus"
   - Azure resource group for all site resources
   - Can use existing or create new
   - Recommended: Dedicated resource group per site

3. **Create Resource Group** (if needed):
   - May have option to auto-create
   - Simplifies management

**Verify**:
- Region: "eastus"
- Resource Group: "volterra-prod-eastus"

---

### Step 8: Select VNet and Subnet

**Details**:

1. **Virtual Network**: Select VNet
   - Dropdown lists VNets in selected region
   - Select your target VNet
   - Full resource ID shown: `/subscriptions/.../virtualNetworks/my-vnet`

2. **Subnet**: Select subnet
   - Dropdown lists subnets in selected VNet
   - Recommended: Private subnet for security
   - Full resource ID shown: `/subscriptions/.../subnets/subnet-1`

3. **Network Security Group**: Select "nsg-volterra"
   - Must allow inbound 443 (HTTPS API)
   - Verify rules before deployment

**Verify**:
- VNet: Your target VNet selected
- Subnet: Private subnet selected
- NSG: "nsg-volterra" selected

---

### Step 9: Configure Azure Networking

**Details**:

1. **Verify NSG Rules**:
   - Inbound Rule: Port 443 (HTTPS) from any
   - Outbound Rule: Allow to internet (for F5 management)
   - Verify in Azure Portal before proceeding

2. **Network Interface Configuration**:
   - F5 will create NICs and assign IPs
   - Can specify static or dynamic (DHCP)
   - Recommended: Dynamic (easier management)

**For now**: Use defaults

---

### Step 10: Configure VM Sizing

**Details**:

1. **VM Instance Type**: Select "Standard_D4s_v3"
   - VM size for Azure compute appliance
   - Options: D2s_v3, D4s_v3, D8s_v3, E4s_v3, E8s_v3
   - D4s_v3 suitable for moderate workloads
   - Higher tier = more throughput, higher cost

2. **Number of VMs**: Enter "3"
   - Number of virtual machines to deploy
   - Minimum: 1 (testing only)
   - Recommended: 3 (for HA)
   - Higher = greater resilience, more cost

3. **OS/Image Configuration**:
   - Image: Ubuntu 20.04 or newer (pre-selected)
   - Disk size: Usually 100GB allocated

**Verify**:
- VM type: "Standard_D4s_v3"
- VM count: "3"
- Image and storage acceptable

---

### Step 11: Advanced Configuration (Optional)

**Details** (can use defaults):

1. **Auto-Scaling** (if available):
   - Min nodes: 3
   - Max nodes: 5
   - Allows handling traffic spikes

2. **Availability Options**:
   - Availability Set: Recommended for HA
   - Spread across fault domains

**For now**: Use defaults

---

### Step 12: Review and Submit

**Details**:

1. Review all configuration:
   - Name: azure-site-eastus ✓
   - Cloud Provider: Azure ✓
   - Region: eastus ✓
   - VM Type: Standard_D4s_v3 ✓
   - VM Count: 3 ✓

2. Click "Save and Exit" or "Create"
   - Azure ARM template will be generated
   - Deployment will begin

3. Redirect to Cloud Sites list

**Expected**: ARM template deployment in Azure starting

---

### Step 13: Monitor Cloud Site Provisioning

**Details**:

1. Look for "azure-site-eastus" in Cloud Sites list
   - Status: "Creating" or "Provisioning"
   - Typical duration: 15-25 minutes

2. Watch status progression:
   - "Creating" → ARM template deploying
   - "Checking Health" → VMs starting
   - "ONLINE" → Site fully operational

3. Click on site name to view details:
   - VMs created in Azure
   - IP addresses assigned
   - Health check status

**Verify**: Status eventually shows "ONLINE"

---

### Step 14: Validate ARM Deployment (Azure Portal)

**Details**:

1. Log into Azure Portal
2. Navigate to Resource Groups
3. Open "volterra-prod-eastus" resource group
4. View "Deployments" tab:
   - Should show successful ARM deployment
   - Status: "Succeeded"
   - Lists all resources created

5. View resources created:
   - VMs (3x Standard_D4s_v3)
   - Network interfaces
   - Network security groups
   - Disks
   - Public/Private IPs

**Verify**: All resources created successfully

---

### Step 15: Verify Site Health (F5 XC Console)

**Details**:

1. Click on site name in Cloud Sites list
2. View "Health Status" section:
   - All 3 VMs should show "HEALTHY"
   - Each shows its IP address
   - Health checks "PASSED"

3. View "Details" tab:
   - Deployment status: "ONLINE"
   - Region: "eastus"
   - VM type: "Standard_D4s_v3"
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
xcsh configuration get cloud_site azure-site-eastus -n production

# Expected output includes:
# - Name: azure-site-eastus
# - Cloud: azure
# - Region: eastus
# - Status: ONLINE
# - Nodes: 3 (all healthy)
# - Type: INGRESS_EGRESS

# Verify ARM deployment
az deployment group list --resource-group volterra-prod-eastus
```

---

## Success Criteria

- [x] Cloud site appears in console list
- [x] Status shows "ONLINE"
- [x] All 3 nodes show "HEALTHY"
- [x] ARM template deployment succeeded
- [x] VMs running in VNet
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
In "Origin Pool" step, select this Azure site as endpoint
```

### Monitor Site Traffic

```
Navigate to: Cloud Sites > azure-site-eastus > Metrics
View:
  - Bytes in/out
  - Requests per second
  - Active connections
  - Health check status
```

---

## Common Issues & Troubleshooting

### Issue: ARM Template Deployment Fails

**Symptoms**:
- Azure Portal shows deployment failed
- Site status shows "FAILED"
- Error in ARM deployment events

**Solutions**:
1. Check ARM deployment "Errors and warnings" for details
2. Common causes:
   - Service principal permissions insufficient
   - VNet/subnet doesn't exist
   - Resource group doesn't exist
   - Region mismatch
   - Quota exceeded (VM cores, etc.)
3. Delete failed deployment in Azure Portal
4. Verify permissions and retry

---

### Issue: Nodes Show UNHEALTHY

**Symptoms**:
- Site status shows "Provisioning" for >20 minutes
- Nodes show "UNHEALTHY"
- Health check failures

**Solutions**:
1. Wait 15-20 minutes (VMs starting)
2. Verify NSG rules allow:
   - Inbound 443 (HTTPS API)
   - Outbound to internet
3. Check Azure Portal → VMs:
   - All 3 VMs running?
   - Network interfaces attached?
   - IPs assigned?
4. Verify NSG:
   - Click each VM → Networking
   - Check inbound rules allow 443

---

### Issue: Service Principal Permissions Denied

**Symptoms**:
- Error: "Insufficient permissions" during deployment
- Site creation fails with authentication error

**Solutions**:
1. Verify service principal has roles:
   - Contributor role on subscription
   - Network Contributor on VNet resource
   - Virtual Machine Contributor
2. In Azure Portal:
   - Subscriptions → Access Control (IAM)
   - Check service principal assignments
3. May need to add/update credentials in F5 XC:
   - Cloud Sites > Cloud Provider Settings
   - Update Azure credentials

---

### Issue: Cannot Find VNet or Subnet

**Symptoms**:
- VNet dropdown empty
- Subnet not appearing
- "VNet not found" error

**Solutions**:
1. Verify VNet exists in selected region
   - Azure Portal → Virtual Networks
   - Confirm region matches (eastus)
2. Verify service principal can read VNet
   - May lack Network Contributor role
3. Check resource group:
   - VNet must be in accessible resource group
4. Try different region to test

---

## Next Steps

After successfully deploying Azure cloud site:

1. **Create Origin Pool**: Reference this site as backend
   - See workflow: `origin-pool-create-basic.md`

2. **Create HTTP Load Balancer**: Route traffic to site
   - See workflow: `http-loadbalancer-create-basic.md`

3. **Monitor Cloud Site**: Watch health and metrics
   - View traffic graphs
   - Check node health

4. **Deploy More Sites**: Add sites in other regions
   - See workflow: `site-deploy-gcp.md` (GCP)
   - See workflow: `site-deploy-aws.md` (AWS)

5. **Create DNS Load Balancer**: Enable multi-region failover
   - See workflow: `dns-loadbalancer-create-geolocation.md`

---

## Monitoring Cloud Site

### View Site Metrics

```
Navigate to: Cloud Sites > azure-site-eastus > Metrics
Metrics:
  - CPU utilization per VM
  - Memory usage
  - Network bytes in/out
  - Requests per second
```

### Monitor Node Health

```
Navigate to: Cloud Sites > azure-site-eastus > Nodes
View:
  - Each VM's status (HEALTHY/UNHEALTHY)
  - Last health check time
  - VM IP address
```

### View Deployment Logs

```
Navigate to: Cloud Sites > azure-site-eastus > Logs
View:
  - ARM deployment logs
  - CE boot logs
  - Connectivity logs
```

---

## Azure Resource Manager Integration

### Understanding the Generated Template

The F5 XC console generates an ARM template that:

1. **Creates VMs** (3x Standard_D4s_v3):
   - Ubuntu 20.04 LTS OS
   - Pre-installed Volterra software (CE)
   - Auto-configured for F5 management

2. **Configures Networking**:
   - Network interfaces in your subnet
   - NSG rules for API and traffic
   - Public IPs (if configured)

3. **Sets Up Managed Identity** (preferred):
   - Azure Managed Identity for auth
   - No credentials stored on VMs

### Cost Considerations

### Azure Charges

Resources created and associated costs:

1. **Virtual Machines**: Standard_D4s_v3 × 3
   - ~$0.20/hour each (~$0.60/hour total)
   - 24/7 ≈ $435/month

2. **Disks**: 100GB × 3 VMs
   - Premium or standard SSD
   - ~$15-30/month

3. **Data Transfer**:
   - Out of VNet: ~$0.02/GB
   - Into Volterra network: may be free

4. **IP Addresses**:
   - Public IPs (if assigned): ~$2.50/month each
   - Private IPs: Free

**Total Estimated**: ~$450-500/month for 3-node site

### Cost Optimization

1. Use D4s_v3 for moderate workloads
2. Use D2s_v3 for lighter loads (less cost)
3. Reduce to 1 VM for development/testing
4. No public IPs if not needed

---

## Cleanup/Rollback

To delete the cloud site:

1. Navigate to Cloud Sites list
2. Click menu next to site name
3. Select "Delete"
4. Confirm deletion
5. F5 XC deletes ARM deployment and all resources
6. Resource group remains (you can delete manually if desired)
7. Cleanup takes 10-15 minutes

**Caution**: Deletes all VMs and data. Ensure no active traffic/data.

---

## Related Documentation

- **Cloud Sites Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/cloud-site
- **Azure Deployment**: https://docs.cloud.f5.com/docs-v2/how-to/cloud-networking/azure-site-deployment
- **ARM Template Reference**: https://docs.cloud.f5.com/docs-v2/reference/azure-arm-template
- **Site Types**: https://docs.cloud.f5.com/docs-v2/how-to/cloud-networking/site-types
- **Networking Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/cloud-networking/site-networking

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24

