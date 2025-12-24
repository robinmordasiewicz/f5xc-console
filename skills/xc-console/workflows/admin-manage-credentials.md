---
title: Workflow - Manage Cloud Provider Credentials
description: Store and manage cloud provider credentials (AWS, Azure, GCP) for site deployments
version: 1.0.0
last_updated: 2025-12-24
category: Administration
complexity: Intermediate
estimated_duration: 15-20 minutes
---

# Workflow: Manage Cloud Provider Credentials

## Overview
Store and manage cloud provider credentials for AWS, Azure, and GCP to enable F5 Distributed Cloud to deploy Kubernetes sites in customer cloud environments. Credentials are encrypted at rest and enable automated VPC/VNet deployments with minimal manual configuration.

## Prerequisites
- ✅ Tenant administrator account with credential management permissions
- ✅ Cloud provider account (AWS, Azure, or GCP)
- ✅ Required permissions in cloud provider:
  - **AWS**: IAM user with EC2/VPC/IAM permissions
  - **Azure**: Service Principal with Contributor role
  - **GCP**: Service Account with Compute/Network permissions
- ✅ Cloud credentials and access keys ready to input (keep secure, never share)

## Input Parameters

```json
{
  "credential_name": "production-aws-us-east-1",
  "cloud_provider": "aws",
  "region": "us-east-1",
  "aws_access_key": "AKIAIOSFODNN7EXAMPLE",
  "aws_secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "credential_type": "primary_credentials",
  "use_case": "production_deployment"
}
```

## Step-by-Step Execution

### Step 1: Navigate to Credential Management

**Console Path**: Administration > Cloud Credentials OR System > Cloud Provider Credentials

**Details**:
- Click "Administration" in left sidebar (or "System")
- Click "Cloud Credentials" or "Cloud Provider Credentials" submenu
- Should see list of existing cloud credentials

**Verify**: Cloud Credentials management page displayed

---

### Step 2: Click Add Cloud Credential Button

**Details**:
- Click "Add Cloud Credential" or "New Credential" button
- Should open credential creation form
- Form has sections: credential name, cloud provider, authentication details

**Verify**: Cloud credential creation form displayed

---

### Step 3: Fill Credential Metadata

**Details**:

1. **Credential Name**: Enter "production-aws-us-east-1"
   - Descriptive name identifying provider and region
   - Format: lowercase + hyphens
   - Example patterns:
     - `prod-aws-us-east-1`
     - `staging-azure-eastus`
     - `dev-gcp-us-central1`

2. **Cloud Provider**: Select from dropdown
   - AWS (Amazon Web Services)
   - Azure (Microsoft Azure)
   - GCP (Google Cloud Platform)

3. **Description** (optional): Enter use case
   - "Production Kubernetes site in us-east-1"
   - "Staging environment for Azure testing"
   - "Development GCP project for experimentation"

4. **Labels** (optional): Add metadata tags
   - `env:production`
   - `region:us-east-1`
   - `team:platform`

**Verify**: Credential metadata filled

---

### Step 4: Select Cloud Provider and Authentication Method

**Details** (provider-specific):

#### **For AWS**:

1. **Authentication Method**: Select "IAM Access Key"
   - Access Key ID: `AKIAIOSFODNN7EXAMPLE`
   - Secret Access Key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
   - Region: `us-east-1`

2. **Required IAM Permissions**:
   ```
   ✓ ec2:*
   ✓ vpc:*
   ✓ elasticloadbalancing:*
   ✓ iam:*
   ✓ s3:*
   ✓ cloudformation:*
   ✓ autoscaling:*
   ```

3. **Security best practices**:
   - Create IAM user specifically for F5 XC
   - Limit permissions to required services
   - Use access key rotation (annual)
   - Enable CloudTrail logging for auditing

#### **For Azure**:

1. **Authentication Method**: Select "Service Principal"
   - Subscription ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Tenant ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Client ID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - Client Secret: `client_secret_value`

2. **Required Azure Permissions**:
   - Role: Contributor (or custom with these permissions)
   ```
   ✓ Microsoft.Compute/*
   ✓ Microsoft.Network/*
   ✓ Microsoft.Storage/*
   ✓ Microsoft.Authorization/*
   ✓ Microsoft.Resources/*
   ```

3. **Security best practices**:
   - Create Service Principal specifically for F5 XC
   - Use certificate-based auth if possible (vs password)
   - Set credential expiration (2 years)
   - Use separate principal per environment

#### **For GCP**:

1. **Authentication Method**: Upload Service Account JSON
   - Download service account key from GCP Console
   - Key file contains all required authentication data

2. **Required GCP Permissions**:
   - Role: Editor (or custom with these permissions)
   ```
   ✓ compute.*
   ✓ container.*
   ✓ servicenetworking.*
   ✓ iam.*
   ✓ cloudresourcemanager.*
   ```

3. **Security best practices**:
   - Create Service Account specifically for F5 XC
   - Rotate keys annually
   - Use separate service account per environment
   - Monitor service account activity in audit logs

**Verify**: Cloud provider selected and credentials filled

---

### Step 5: Test Connectivity

**Details**:

1. After entering credentials, look for **"Test Connection"** or **"Verify Credentials"** button

2. Click to validate:
   - AWS: Verifies access key validity and permissions
   - Azure: Verifies service principal authentication
   - GCP: Verifies service account JSON validity

3. Expected results:
   - ✅ **Success**: Credentials valid, permissions confirmed
   - ❌ **Failure**: Invalid credentials, check and retry
   - ⚠️ **Warning**: Credentials work but some permissions missing

4. If failure:
   ```
   Error: "Invalid AWS Access Key"
   → Solution: Verify access key format, no spaces/typos

   Error: "Access Denied: Missing ec2:* permissions"
   → Solution: Update IAM policy to include required permissions

   Error: "Authentication failed: Client secret invalid"
   → Solution: Verify Azure client secret is correct and not expired
   ```

5. If success:
   - Proceed to save credential
   - Connection details confirmed

**Verify**: Connectivity test passed

---

### Step 6: Configure Credential Scope

**Details** (if available):

1. **Credential Visibility**: Select scope
   - **Tenant-wide**: Available to all users (shared)
   - **Namespace-specific**: Available only in selected namespace
   - **User-scoped**: Only you can use (personal credentials)

2. **Recommendation**: Use namespace-specific for multi-team tenants
   - Team A gets credentials for Team A's AWS account
   - Team B gets credentials for Team B's Azure account
   - Prevents accidental cross-team deployments

3. **Select namespace** (if applicable):
   - `production` (prod-aws-us-east-1 credential)
   - `staging` (staging-azure-eastus credential)
   - `development` (dev-gcp-us-central1 credential)

**Verify**: Credential scope configured

---

### Step 7: Set Credential Expiration (Optional)

**Details**:

1. Look for **"Expiration"** or **"Credential Lifetime"** option
2. Options:
   - No expiration (not recommended)
   - Automatic rotation (every N days)
   - Manual rotation with reminder

3. For security best practice:
   - AWS Access Keys: Rotate every 90 days
   - Azure Service Principal: Rotate every 2 years
   - GCP Service Account: Rotate keys every 1 year

4. Set reminder:
   - 2 weeks before expiration
   - Automatic alert when approaching expiration

**Verify**: Expiration configured

---

### Step 8: Save Cloud Credential

**Details**:

1. Review all information:
   - Name: `production-aws-us-east-1` ✓
   - Provider: AWS ✓
   - Region: us-east-1 ✓
   - Connectivity: Verified ✓

2. Click **"Save and Exit"** or **"Create Credential"**

3. Should redirect to credentials list page

**Expected**: Cloud credential saved successfully

---

### Step 9: Verify Credential Creation

**Details**:

1. Find credential in list: `production-aws-us-east-1`
2. Click to view details:
   - Credential name ✓
   - Cloud provider: AWS ✓
   - Region: us-east-1 ✓
   - Last verified: [timestamp] ✓
   - Status: Active ✓

3. Note any relevant metadata:
   - Associated VPC/VNet
   - Deployments using this credential
   - Last used timestamp

**Verify**: Credential appears in list with correct details

---

### Step 10: Use Credential for Site Deployment

**Details**:

1. Navigate to Cloud Sites (or equivalent)
2. Create new cloud site deployment
3. Select deployment target:
   - **Cloud Provider**: AWS / Azure / GCP
   - **Credential**: Select "production-aws-us-east-1"

4. F5 XC will use these credentials to:
   - Authenticate to cloud provider
   - Create VPC/VNet resources
   - Deploy Kubernetes cluster
   - Configure networking and security

5. Monitor deployment progress:
   - Provisioning network
   - Creating compute resources
   - Deploying Kubernetes
   - Initializing networking

**Verify**: Cloud credential used for deployment

---

### Step 11: Monitor Credential Health and Usage

**Details**:

1. Return to Cloud Credentials page
2. Review credential statistics:
   - Last used: [date/time]
   - Active deployments: [count]
   - Failures (if any): [count]

3. Troubleshoot if failures:
   - Check cloud provider for API changes
   - Verify credential hasn't been revoked
   - Test connectivity again
   - Check permission changes

4. Audit credential access:
   - Who used this credential?
   - When was it last used?
   - Any suspicious activity?

**Verify**: Credential health monitored

---

### Step 12: Rotate Credential Before Expiration

**Details**:

1. **Plan rotation** (before expiration):
   - AWS: 90-day rotation cycle
   - Azure: 2-year rotation cycle
   - GCP: Annual rotation

2. **Create new credential**:
   - Generate new access key/secret in cloud provider
   - Add new credential to F5 XC (steps 1-9)
   - Test connectivity on new credential

3. **Update deployments**:
   - Existing deployments continue using old credential
   - New deployments use new credential
   - Plan migration during maintenance window

4. **Deactivate old credential**:
   - After all deployments migrated
   - Delete old access key in cloud provider
   - Remove credential from F5 XC

5. **Document rotation**:
   - Date of rotation
   - Old credential deactivated
   - New credential activation date

**Verify**: Credential rotation plan documented

---

## Validation with CLI

**Command**: Verify cloud credential creation and connectivity

```bash
# List all cloud credentials
xcsh administration list cloud_credentials

# Expected output:
# production-aws-us-east-1 | AWS | us-east-1 | Active | Last used: 2025-12-24

# Get credential details
xcsh administration get cloud_credential production-aws-us-east-1

# Expected output:
# Name: production-aws-us-east-1
# Provider: AWS
# Region: us-east-1
# Status: Active
# Connectivity: Verified
# Deployments: 2 active

# Test credential connectivity
xcsh health check cloud_credential production-aws-us-east-1

# Expected output:
# Status: ✅ Connected
# Permissions: ✅ Valid
# Last verified: 2025-12-24 14:30:00
```

---

## Success Criteria

- [x] Cloud credential created with proper naming
- [x] Cloud provider selected (AWS/Azure/GCP)
- [x] Authentication details filled correctly
- [x] Connectivity test passed
- [x] Credential scope configured
- [x] Credential saved successfully
- [x] Credential verified in list
- [x] Can be used for deployments
- [x] Usage monitored
- [x] Rotation plan documented

---

## Common Issues & Troubleshooting

### Issue: Credential Connectivity Test Fails

**Symptoms**:
- "Invalid AWS Access Key" error
- "Authentication failed" message
- Can't verify credentials

**Solutions**:

1. **Verify credential format**:
   - AWS: Access Key ID starts with "AKIA", Secret is 40 characters
   - Azure: All UUIDs properly formatted
   - GCP: Valid JSON service account file

2. **Check for special characters**:
   - No extra spaces or newlines
   - Paste carefully to avoid truncation
   - If copied from file, verify encoding

3. **Verify credentials not revoked**:
   - AWS: Check if access key is active in IAM console
   - Azure: Check if service principal hasn't been deleted
   - GCP: Check if service account key is valid

4. **Confirm permissions**:
   - AWS: User has required IAM policies
   - Azure: Service Principal has Contributor role
   - GCP: Service Account has Editor role

5. **Retry with fresh copy**:
   - Generate new credentials from cloud provider
   - Copy and paste carefully
   - Test immediately

---

### Issue: Deployment Fails with Credential Error

**Symptoms**:
- Deployment stops with "Credential validation failed"
- "Insufficient permissions" during deployment
- "Access denied" when creating VPC/VNet

**Solutions**:

1. **Check credential still valid**:
   - Test connectivity again
   - Verify in cloud provider (not deleted/rotated)
   - Check if permissions were reduced

2. **Verify required permissions**:
   - AWS: Ensure all ec2/vpc/iam policies attached
   - Azure: Service Principal has Contributor role
   - GCP: Service Account has Editor role

3. **Check for credential rotation**:
   - If credential was recently rotated in cloud provider
   - Old credential may no longer work
   - Create new credential with new keys

4. **Review deployment logs**:
   - Check exact error message
   - Error may indicate specific missing permission
   - Add that permission and retry

5. **Test with new credential**:
   - Create temporary test credential
   - Try simple deployment (minimal resources)
   - If works, old credential has issue

---

### Issue: Multiple Cloud Environments Need Separate Credentials

**Symptoms**:
- Have AWS prod, AWS staging, Azure prod accounts
- Need separate credentials for each
- Risk of deploying to wrong environment

**Solutions**:

1. **Create separate credentials**:
   - `prod-aws-us-east-1` (Production AWS)
   - `staging-aws-us-east-1` (Staging AWS)
   - `prod-azure-eastus` (Production Azure)
   - `staging-azure-eastus` (Staging Azure)

2. **Use namespace scoping**:
   - Production namespace → prod-aws credential
   - Staging namespace → staging-aws credential
   - Prevents cross-environment deployments

3. **Naming convention**:
   - Always include environment in credential name
   - Always include cloud provider
   - Always include region
   - Example: `{env}-{provider}-{region}`

4. **Enforce in team process**:
   - Code review to verify correct credential used
   - Namespace restrictions to prevent override
   - Monitoring alerts for cross-environment usage

---

### Issue: Credential Expiration and Rotation

**Symptoms**:
- Warning: "Credential expires in 30 days"
- Deployment fails with "Credential expired"
- Can't create new deployments with old credential

**Solutions**:

1. **Proactive rotation** (before expiration):
   - Generate new credentials in cloud provider
   - Add new credential to F5 XC
   - Test connectivity on new credential
   - Update documentation/runbooks

2. **Plan migration**:
   - Existing deployments can continue with old credential
   - New deployments use new credential
   - Schedule maintenance window for migration
   - Update deployments one by one

3. **Automated alerts** (if available):
   - 30 days before expiration: Review warning
   - 14 days before expiration: Start rotation process
   - 7 days before expiration: Complete rotation
   - On expiration: Remove old credential

4. **Document rotation history**:
   - Date credential created
   - Date credential expires
   - Date new credential created
   - Date old credential deactivated
   - Maintain for audit trail (minimum 1 year)

---

## Credential Management Best Practices

### 1. Separate Credentials per Environment
```
❌ Bad: Single AWS credential for prod and staging
✅ Good: Separate credentials for prod and staging
✅ Better: Different AWS accounts for prod and staging
```

### 2. Principle of Least Privilege
```
❌ Bad: IAM user with admin permissions
✅ Good: IAM user with only required permissions
✅ Better: Custom IAM policy with minimal required permissions
```

### 3. Credential Storage
```
❌ Bad: Credentials in documents, emails, or shared drives
✅ Good: Credentials in F5 XC encrypted storage only
✅ Better: Credentials never written down, generated fresh for rotation
```

### 4. Rotation Schedule
```
❌ Bad: Keep same credentials indefinitely
✅ Good: Rotate credentials annually
✅ Better: Rotate quarterly or after personnel changes
```

### 5. Access Control
```
❌ Bad: All team members can see/use any credential
✅ Good: Namespace-scoped credentials by team
✅ Better: Role-based access with audit logging per deployment
```

---

## Cloud Provider Credential Requirements

### AWS
| Item | Requirement | Notes |
|------|-------------|-------|
| **Credential Type** | IAM Access Key | Access Key ID + Secret Access Key |
| **User Type** | Programmatic Access | Not console access |
| **Required Permissions** | EC2, VPC, IAM, ELB, CloudFormation | See terraform provider docs |
| **Rotation Period** | 90 days | AWS best practice |
| **MFA** | Optional but recommended | For extra security |
| **Scope** | Single region or global | Region specified in credential |

### Azure
| Item | Requirement | Notes |
|------|-------------|-------|
| **Credential Type** | Service Principal | App Registration in Azure AD |
| **Authentication** | Password or Certificate | Certificate preferred for prod |
| **Required Role** | Contributor | Or custom role with equivalent permissions |
| **Rotation Period** | 2 years (certificate) / 1 year (password) | Azure best practice |
| **Scope** | Subscription level | Can limit to specific resource groups |
| **Multi-Tenant** | Single tenant | One Azure AD tenant per credential |

### GCP
| Item | Requirement | Notes |
|------|-------------|-------|
| **Credential Type** | Service Account | Not personal Google account |
| **Key Type** | JSON key file | Download from GCP Console |
| **Required Role** | Editor | Or custom role with equivalent permissions |
| **Rotation Period** | 1 year | Annual key rotation recommended |
| **Scope** | Project level | Service account confined to single project |
| **Key Limit** | 10 keys per service account | Manage key lifecycle carefully |

---

## Next Steps

After managing cloud credentials:

1. **Create cloud site deployments** using configured credentials
2. **Monitor deployment progress** and health
3. **Test site connectivity** to deployed infrastructure
4. **Set up credential rotation schedule** (calendar reminders)
5. **Document credential usage** for audit purposes

---

## Related Documentation

- **AWS Credential Setup**: https://docs.cloud.f5.com/docs-v2/how-to/sites/cloud-sites-aws-setup
- **Azure Credential Setup**: https://docs.cloud.f5.com/docs-v2/how-to/sites/cloud-sites-azure-setup
- **GCP Credential Setup**: https://docs.cloud.f5.com/docs-v2/how-to/sites/cloud-sites-gcp-setup
- **Cloud Site Deployment**: https://docs.cloud.f5.com/docs-v2/how-to/sites/deploy-cloud-site
- **Credential Security**: https://docs.cloud.f5.com/docs-v2/platform/security/credential-management

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24
