---
title: Workflow - Deploy Cloud Site (AWS VPC)
description: Deploy F5 Distributed Cloud service to AWS VPC with automatic ingress/egress
version: 1.0.0
last_updated: 2025-12-24
category: Cloud Deployment
complexity: Intermediate
estimated_duration: 30-45 minutes
---

# Workflow: Deploy Cloud Site (AWS VPC)

## Overview
Deploy F5 Distributed Cloud services to your AWS VPC as a cloud site, providing automatic ingress/egress, load balancing, and security services within your AWS infrastructure.

## Prerequisites
- ✅ AWS account with VPC created
- ✅ AWS IAM credentials with appropriate permissions (EC2, VPC, IAM)
- ✅ Target VPC ID and subnet information available
- ✅ AWS security groups configured (minimum port 443 for API)
- ✅ F5 XC namespace created for site deployment
- ✅ (Optional) AWS keypair for secure access

## Input Parameters

```json
{
  "name": "aws-site-us-east-1",
  "namespace": "production",
  "cloud_provider": "aws",
  "site_type": "ingress_egress",
  "aws_configuration": {
    "region": "us-east-1",
    "vpc_id": "vpc-12345678",
    "subnet_id": "subnet-87654321",
    "security_group_id": "sg-abcdef12",
    "keypair_name": "my-aws-keypair"
  },
  "ce_instance_type": "t3.xlarge",
  "nodes": 3,
  "labels": {
    "region": "us-east-1",
    "environment": "production"
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
- Should see list of existing cloud sites (may be empty)

**Verify**: Cloud Sites list page displayed

---

### Step 2: Click Add Cloud Site Button

**Details**:
- Click "Add Cloud Site" button (usually top right)
- Should open cloud site creation form
- Form has multiple sections/tabs

**Verify**: Blank cloud site creation form displayed

---

### Step 3: Fill Metadata Section

**Details**:

1. **Name**: Enter "aws-site-us-east-1"
   - Unique identifier for the cloud site
   - Format: lowercase alphanumeric + dashes
   - Naming convention: `<provider>-site-<region>`

2. **Namespace**: Select "production"
   - Where site resources are managed
   - Determines billing and isolation

3. **Labels** (optional): Add labels
   - Key: "region" → Value: "us-east-1"
   - Key: "environment" → Value: "production"

**Verify**:
- Name shows "aws-site-us-east-1"
- Namespace shows "production"
- Labels displayed (if added)

---

### Step 4: Select Site Type

**Details**:

1. Look for "Site Type" or "Deployment Mode" dropdown
2. Select: "Ingress/Egress"
   - Ingress: Accept traffic from internet
   - Egress: Route traffic to backends
   - Ingress/Egress: Both directions
   - Recommended: Ingress/Egress for full functionality

3. This determines what services the site provides

**Verify**: "Ingress/Egress" is selected

---

### Step 5: Select Cloud Provider

**Details**:

1. Look for "Cloud Provider" dropdown
2. Select: "AWS"
3. This will reveal AWS-specific configuration fields

**Verify**: "AWS" is selected, AWS fields visible

---

### Step 6: Configure AWS Credentials

**Details**:

1. **AWS Region**: Select "us-east-1" (or target region)
   - Dropdown with AWS regions
   - CloudFormation template will be deployed to this region

2. **VPC ID**: Enter or select "vpc-12345678"
   - Your existing VPC in the selected region
   - Can start typing to search/autocomplete

3. **Subnet ID**: Enter or select "subnet-87654321"
   - Must be in the selected VPC
   - Recommended: Private subnet for security

4. **Security Group ID**: Enter or select "sg-abcdef12"
   - Must allow inbound 443 (HTTPS)
   - Typically: Allow from application sources

5. **IAM Role** (if applicable):
   - May auto-create or require existing role
   - Needs EC2, VPC, IAM permissions

**Verify**:
- Region: "us-east-1"
- VPC ID populated: "vpc-12345678"
- Subnet ID populated: "subnet-87654321"
- Security Group ID populated: "sg-abcdef12"

---

### Step 7: Configure Site Resources

**Details**:

1. **CE Instance Type**: Select "t3.xlarge"
   - Instance type for cloud appliance
   - Options: t3.xlarge, t3.2xlarge, m5.2xlarge, c5.2xlarge
   - Larger = higher throughput, higher cost
   - t3.xlarge suitable for moderate workloads

2. **Number of Nodes**: Enter "3"
   - Number of CE instances to deploy
   - Minimum: 1 (for testing only)
   - Recommended: 3 (for HA)
   - Higher = greater resilience, more cost

3. **Instance Configuration**:
   - OS Image: Usually defaults to Ubuntu LTS
   - Storage: Typically 100GB allocated

**Verify**:
- Instance type: "t3.xlarge"
- Node count: "3"
- Image and storage acceptable

---

### Step 8: Configure AWS Networking (Advanced)

**Details** (can use defaults):

1. **Subnet Selection**: Already configured
   - Site will deploy instances to this subnet

2. **Security Group Rules**:
   - Verify allows 443 (HTTPS API)
   - Verify allows 22 (SSH, if needed)
   - Verify egress allows internet access

3. **Route Configuration** (optional):
   - May auto-configure routes
   - Review if custom routing needed

**For now**: Use defaults

---

### Step 9: Review and Submit

**Details**:

1. Review configuration:
   - Name: aws-site-us-east-1 ✓
   - Cloud Provider: AWS ✓
   - Region: us-east-1 ✓
   - Instance Type: t3.xlarge ✓
   - Nodes: 3 ✓

2. Click "Save and Exit" or "Create"
   - CloudFormation template will be generated
   - AWS deployment will begin

3. Should redirect to Cloud Sites list

**Expected**: CloudFormation stack creation in AWS starting

---

### Step 10: Monitor Cloud Site Provisioning

**Details**:

1. Look for "aws-site-us-east-1" in Cloud Sites list
   - Status will show "Creating" or "Provisioning"
   - Provisioning typically takes 10-20 minutes

2. Watch for status progression:
   - "Creating" → CloudFormation deploying
   - "Checking Health" → Instances starting
   - "ONLINE" → Site fully operational

3. Click on site name to view details:
   - EC2 instances created in AWS
   - IP addresses assigned
   - Health check status

**Verify**: Status eventually shows "ONLINE"

---

### Step 11: Validate CloudFormation Stack (AWS Console)

**Details**:

1. Log into AWS Console
2. Navigate to CloudFormation
3. Look for stack: "volterra-aws-site-us-east-1-<hash>"
   - Should show "CREATE_COMPLETE" status
   - Lists all resources created:
     - EC2 instances (3x t3.xlarge)
     - Network interfaces
     - Security groups
     - IAM roles

4. Click "Resources" tab to view:
   - Instance IDs
   - Subnet assignments
   - Elastic IPs (if assigned)

**Verify**: CloudFormation stack fully created

---

### Step 12: Verify Site Health (F5 XC Console)

**Details**:

1. Click on site name in Cloud Sites list
2. View "Health Status" section:
   - All 3 nodes should show "HEALTHY"
   - Each node should show its IP address
   - Health check status "PASSED"

3. View "Details" tab:
   - Deployment status: "ONLINE"
   - Region: "us-east-1"
   - Instance type: "t3.xlarge"
   - Node count: "3"

**Verify**:
- All nodes show HEALTHY ✓
- Overall status: ONLINE ✓
- Deployment succeeded ✓

---

## Validation with CLI

**Command**: Verify cloud site creation

```bash
# List all cloud sites in namespace
xcsh configuration list cloud_site -n production

# Get specific cloud site details
xcsh configuration get cloud_site aws-site-us-east-1 -n production

# Expected output includes:
# - Name: aws-site-us-east-1
# - Cloud: aws
# - Region: us-east-1
# - Status: ONLINE
# - Nodes: 3 (all healthy)
# - Type: INGRESS_EGRESS

# Verify CloudFormation stack
aws cloudformation list-stacks --region us-east-1 --query 'StackSummaries[?StackStatus==`CREATE_COMPLETE`]' | grep volterra
```

---

## Success Criteria

- [x] Cloud site appears in console list
- [x] Status shows "ONLINE"
- [x] All 3 nodes show "HEALTHY"
- [x] CloudFormation stack fully created in AWS
- [x] EC2 instances running in VPC
- [x] CLI confirms site creation
- [x] Site ready to accept traffic

---

## Testing Site Connectivity

### Test API Connectivity

```bash
# Get site IP address from console, then:
curl -k https://<site-ip>/api/ping

# Expected: 200 OK response
```

### Create HTTP Load Balancer Using This Site

```
See workflow: http-loadbalancer-create-basic.md
In "Origin Pool" step, can now select this AWS site as endpoint
```

### Monitor Site Traffic

```
Navigate to: Cloud Sites > aws-site-us-east-1 > Metrics
View:
  - Bytes in/out
  - Requests per second
  - Active connections
  - Health check status
```

---

## Common Issues & Troubleshooting

### Issue: CloudFormation Stack Creation Fails

**Symptoms**:
- AWS console shows "CREATE_FAILED" status
- Site status shows "FAILED"
- Error in CloudFormation events

**Solutions**:
1. Check CloudFormation "Events" tab for specific error
2. Common causes:
   - IAM permissions insufficient (need EC2, VPC, IAM)
   - VPC/subnet doesn't exist
   - Security group doesn't exist
   - Region mismatch
3. Delete failed stack in AWS console
4. Retry cloud site creation

---

### Issue: Nodes Show UNHEALTHY

**Symptoms**:
- Site status shows "Provisioning" for >20 minutes
- Nodes show "UNHEALTHY" status
- Health check failures in logs

**Solutions**:
1. Wait 15-20 minutes (instances starting)
2. Verify security group allows:
   - Inbound 443 (HTTPS)
   - Inbound 22 (SSH, if needed)
   - Outbound to internet (for F5 management)
3. Check AWS EC2 console:
   - Instances running?
   - Network interfaces attached?
   - Public/private IPs assigned?
4. Check security group rules:
   - Click on instance → Security tab
   - Verify inbound rules allow API traffic

---

### Issue: Site Stuck in "Creating" Status

**Symptoms**:
- Status shows "Creating" after 30+ minutes
- CloudFormation shows "CREATE_IN_PROGRESS"
- No error message visible

**Solutions**:
1. Wait up to 30 minutes total (instances may be slow to start)
2. Check CloudFormation events for stalled operations
3. Check AWS account limits:
   - EC2 instance quota (3x t3.xlarge requested)
   - EBS volume quota
   - VPC quota
4. If stuck >30min:
   - Cancel in F5 console
   - Delete CloudFormation stack in AWS
   - Retry

---

### Issue: Cannot Select VPC/Subnet

**Symptoms**:
- VPC ID field empty/greyed out
- Cannot find VPC in dropdown
- "VPC not found" error

**Solutions**:
1. Verify AWS credentials configured in F5 XC
   - Check: Cloud Sites > AWS Settings or similar
   - May need to add/update AWS account credentials
2. Verify VPC exists in selected region
   - AWS Console → VPC Dashboard
   - Confirm VPC ID correct
   - Confirm VPC in us-east-1
3. Verify IAM role has EC2/VPC read permissions
4. Try different region first to test

---

## Next Steps

After successfully deploying AWS cloud site:

1. **Create Origin Pool**: Reference this site as backend
   - See workflow: `origin-pool-create-basic.md`
   - Create pool with site as endpoint

2. **Create HTTP Load Balancer**: Route traffic to site
   - See workflow: `http-loadbalancer-create-basic.md`
   - Select origin pool from step 1

3. **Monitor Cloud Site**: Watch health and metrics
   - View traffic graphs
   - Check node health
   - Monitor alerts

4. **Deploy More Sites**: Add sites in other regions
   - See workflow: `site-deploy-azure.md` (Azure VNet)
   - See workflow: `site-deploy-gcp.md` (GCP VPC)

5. **Create DNS Load Balancer**: Enable multi-region failover
   - See workflow: `dns-loadbalancer-create-geolocation.md`

---

## Monitoring Cloud Site

### View Site Metrics

```
Navigate to: Cloud Sites > aws-site-us-east-1 > Metrics
Metrics:
  - CPU utilization per node
  - Memory usage
  - Network bytes in/out
  - Requests per second
  - Active connections
```

### Monitor Node Health

```
Navigate to: Cloud Sites > aws-site-us-east-1 > Nodes
View:
  - Each node's status (HEALTHY/UNHEALTHY)
  - Last health check time
  - Health check type
  - Node IP address
```

### View Deployment Logs

```
Navigate to: Cloud Sites > aws-site-us-east-1 > Logs
View:
  - CloudFormation deployment logs
  - CE boot logs
  - API connectivity logs
  - Any startup errors
```

---

## AWS CloudFormation Integration

### Understanding the Generated Stack

The F5 XC console generates a CloudFormation template that:

1. **Creates EC2 Instances** (3x t3.xlarge):
   - Ubuntu LTS operating system
   - Pre-installed F5 Volterra software (CE)
   - Auto-configured for F5 management

2. **Configures Networking**:
   - Network interfaces attached to your subnet
   - Security groups for API and traffic
   - Elastic IPs (if configured)

3. **Sets Up IAM**:
   - IAM role for EC2 instances
   - Policies for F5 management access
   - CloudWatch integration for monitoring

4. **Enables Auto-Scaling** (optional):
   - Can set min/max instance count
   - Auto-recovery of failed instances

### Stack Outputs

CloudFormation outputs (visible in AWS console):
- Stack name
- Instance IDs
- Private IP addresses
- Security group IDs
- IAM role ARN

---

## Cost Considerations

### AWS Charges

The deployment creates resources with associated costs:

1. **EC2 Instances**: t3.xlarge × 3
   - On-demand: ~$0.13/hour each (~$0.40/hour total)
   - Running 24/7 ≈ $290/month

2. **Elastic IPs** (if assigned):
   - ~$3.65/month per IP

3. **Data Transfer**:
   - Out of VPC: ~$0.02/GB
   - Into F5: usually free (VPC-to-VPC)

4. **EBS Volumes**:
   - 100GB × 3 nodes
   - ~$10/month

**Total Estimated**: ~$300-350/month for 3-node site

### Cost Optimization

1. Use t3.xlarge only for moderate workloads
2. Reduce nodes to 1 for development/testing
3. Use Spot instances for non-production (requires different deployment)
4. Enable auto-scaling to handle variable load

---

## Cleanup/Rollback

To delete the cloud site:

1. Navigate to Cloud Sites list
2. Click menu next to site name
3. Select "Delete"
4. Confirm deletion
5. F5 XC will delete CloudFormation stack in AWS
6. AWS will terminate EC2 instances and remove resources
7. Cleanup typically takes 10-15 minutes

**Caution**: This deletes all instances and data in the site. Ensure no active traffic/data.

---

## Related Documentation

- **Cloud Sites Overview**: https://docs.cloud.f5.com/docs-v2/platform/reference/cloud-site
- **AWS Deployment**: https://docs.cloud.f5.com/docs-v2/how-to/cloud-networking/aws-site-deployment
- **CloudFormation Template**: https://docs.cloud.f5.com/docs-v2/reference/aws-cloudformation-template
- **Site Types**: https://docs.cloud.f5.com/docs-v2/how-to/cloud-networking/site-types
- **Networking Configuration**: https://docs.cloud.f5.com/docs-v2/how-to/cloud-networking/site-networking

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24

