---
title: Workflow - Manage API Tokens
description: Create, rotate, and manage API tokens for programmatic tenant access
version: 1.0.0
last_updated: 2025-12-24
category: Administration
complexity: Beginner
estimated_duration: 10-15 minutes
---

# Workflow: Manage API Tokens

## Overview
Create and manage API tokens for programmatic access to F5 Distributed Cloud. API tokens authenticate CLI tools, Terraform providers, and custom applications accessing the tenant API.

## Prerequisites
- ✅ Tenant administrator account
- ✅ User account for token owner (if creating for other user)
- ✅ Understanding of token scope and permissions
- ✅ Secure token storage plan (e.g., HashiCorp Vault, AWS Secrets Manager)

## Input Parameters

```json
{
  "token_owner": "john.developer@example.com",
  "token_name": "terraform-automation",
  "expiry_days": 365,
  "permissions": "full_access",
  "description": "Token for Terraform CI/CD pipeline",
  "rotation_frequency": "quarterly"
}
```

## Step-by-Step Execution

### Step 1: Navigate to API Token Management

**Console Path**: Administration > API Tokens OR System > API Management

**Details**:
- Click "Administration" in left sidebar (or "System")
- Click "API Tokens" submenu
- Should see list of existing API tokens

**Verify**: API Tokens management page displayed

---

### Step 2: Click Add API Token Button

**Details**:
- Click "Add API Token" or "Create Token" button
- Should open token creation form
- Form has sections: token info, permissions, expiration

**Verify**: Token creation form displayed

---

### Step 3: Fill Token Information

**Details**:

1. **Token Name**: Enter "terraform-automation"
   - Descriptive name for token
   - Identifies purpose of token
   - Format: lowercase + hyphens

2. **Description** (optional): Enter "Token for Terraform CI/CD pipeline"
   - Helpful for documentation
   - Notes intended use

3. **Token Owner** (if applicable):
   - Select "john.developer@example.com"
   - Token assigned to specific user
   - User can revoke their own tokens

**Verify**: Token information filled

---

### Step 4: Select Token Permissions

**Details**:

1. Look for **Permissions** or **Scope** option
2. Options typically:
   - **Full Access**: Can do anything (use with caution)
   - **Restricted**: Limited to specific operations
   - **Read-Only**: Cannot modify resources
   - **Custom**: Granular permission selection

3. For Terraform automation, select **"Full Access"**
   - Terraform needs to create/modify/delete resources
   - Alternative: Configure custom permissions per resource type

**Security Note**:
```
❌ Bad: Full access tokens for everything
✅ Good: Restricted tokens for specific purpose
✅ Better: Minimal scope tokens, rotate frequently
```

**Verify**: Appropriate permissions selected

---

### Step 5: Set Token Expiration

**Details**:

1. Look for **Expiration** or **Token Lifetime** field
2. Options:
   - No expiration (not recommended)
   - Specific duration: 30, 60, 90, 180, 365 days
   - Custom date

3. For best security:
   - Select **"365 days"** (1 year)
   - Shorter for sensitive operations (90 days)
   - Longer for batch jobs (still not recommended)

**Expiration Strategy**:
```
Daily CI/CD: 90 days (rotate quarterly)
Batch jobs: 180 days (rotate bi-annually)
Integration APIs: 365 days (rotate annually)
Never: No expiration (security risk, not recommended)
```

4. **Token Rotation Reminder**:
   - Set calendar reminder 2 weeks before expiration
   - Create new token before old one expires
   - Ensure smooth transition (no API failures)

**Verify**: Expiration set to 365 days

---

### Step 6: Generate Token

**Details**:

1. Click **"Generate Token"** or **"Create"**
2. System displays:
   - **Token Value**: Long alphanumeric string (e.g., `2SiwIzdXcUTV9Kk/wURCJO+NPV8=`)
   - Copy to clipboard button
   - Warning: Token only shown once!

3. **Important**:
   - Copy token immediately
   - Store in secure location
   - Never commit to version control
   - Cannot retrieve later (must regenerate)

**Verify**: Token generated and copied

---

### Step 7: Store Token Securely

**Details**:

1. **Do NOT**:
   - Write in plaintext files
   - Commit to Git repository
   - Share via email
   - Store in application logs

2. **Do**:
   - Store in secrets manager (Vault, AWS Secrets Manager)
   - Use environment variables in CI/CD
   - Use credentials file with restricted permissions
   - Rotate regularly

3. **Example Secure Storage**:
   ```bash
   # Using environment variable in CI/CD
   export F5XC_API_TOKEN="2SiwIzdXcUTV9Kk/wURCJO+NPV8="

   # Using HashiCorp Vault
   vault kv put secret/f5xc api_token="2SiwIzdXcUTV9Kk/wURCJO+NPV8="

   # Using AWS Secrets Manager
   aws secretsmanager create-secret \
     --name f5xc-api-token \
     --secret-string "2SiwIzdXcUTV9Kk/wURCJO+NPV8="
   ```

**Verify**: Token stored securely (not shown in logs or files)

---

### Step 8: Test Token Functionality

**Details**:

1. **Test with CLI**:
   ```bash
   export F5XC_API_URL="https://nferreira.staging.volterra.us"
   export F5XC_API_TOKEN="2SiwIzdXcUTV9Kk/wURCJO+NPV8="

   # List resources to verify token works
   xcsh configuration list http_loadbalancer -n production
   ```

2. **Expected output**:
   - List of HTTP load balancers
   - No authentication errors
   - Token works correctly

3. **If error**:
   - Verify token copied correctly
   - Verify expiration not yet reached
   - Check API URL correct
   - Verify permissions sufficient

**Verify**: Token authentication successful

---

### Step 9: Monitor Token Usage

**Details** (optional, if available):

1. Go to API Tokens list
2. Find "terraform-automation" token
3. Click to view details:
   - Last used timestamp
   - Usage statistics
   - Associated user

4. Review periodically:
   - Ensure token still in use
   - Check for unexpected usage
   - Monitor for suspicious activity

**Verify**: Token usage visible and reasonable

---

### Step 10: Plan Token Rotation

**Details**:

1. **Set rotation schedule**:
   - Add to calendar: "Rotate terraform-automation token"
   - Due date: 365 days from creation
   - Reminder: 2 weeks before expiration

2. **Rotation process**:
   ```
   Step 1: Generate new token (this workflow)
   Step 2: Update CI/CD secrets with new token
   Step 3: Update application configuration
   Step 4: Test new token works
   Step 5: Delete old token
   Step 6: Verify no applications still using old token
   ```

3. **During rotation**:
   - Keep old and new tokens active briefly (overlap period)
   - Update all applications gradually
   - Verify no API failures
   - Delete old token after confirmation

**Verify**: Rotation plan documented

---

## Validation with CLI

**Command**: Verify API token creation

```bash
# List all API tokens
xcsh administration list api_tokens

# Expected output:
# terraform-automation | 2025-12-24 | john.developer@example.com | Full Access

# Test token functionality
export F5XC_API_TOKEN="2SiwIzdXcUTV9Kk/wURCJO+NPV8="
xcsh configuration list origin_pool -n production

# Expected: Returns list of origin pools (token works)
```

---

## Success Criteria

- [x] API token created with appropriate name
- [x] Permissions set correctly
- [x] Expiration set (365 days)
- [x] Token generated and copied
- [x] Token stored securely
- [x] Token tested and verified
- [x] Rotation plan documented

---

## Common Issues & Troubleshooting

### Issue: Authentication Failed with Token

**Symptoms**:
- "Invalid token" error when using token
- API calls return 401 Unauthorized
- Token not working

**Solutions**:
1. **Verify token value**:
   - Recheck copied token matches generated value
   - No extra spaces or characters
   - Entire token copied

2. **Check token expiration**:
   - Verify token not yet expired
   - Check expiration date in console
   - Generate new token if expired

3. **Verify environment setup**:
   - Environment variables set correctly
   - F5XC_API_TOKEN variable contains full token
   - F5XC_API_URL points to correct tenant

4. **Check permissions**:
   - Verify token has required permissions
   - May have "Read-Only" instead of "Full Access"
   - Insufficient permissions → "Forbidden" error

---

### Issue: Token Expired

**Symptoms**:
- Token was working, now returns authentication error
- Terraform/CLI suddenly failing
- Applications can't access API

**Solutions**:
1. **Verify expiration**:
   - Go to API Tokens list
   - Check token status (Expired/Active)
   - Confirm expiration date passed

2. **Generate new token** (this workflow):
   - Create replacement token
   - Update applications with new token
   - Delete expired token

3. **Implement rotation**:
   - Set up calendar reminders
   - Rotate before expiration
   - Update infrastructure gradually

4. **Prevent future expiration**:
   - Create new token 2 weeks before expiration
   - Update applications gradually
   - Delete old token after verified

---

### Issue: Lost or Exposed Token

**Symptoms**:
- Token accidentally committed to Git
- Token visible in logs or emails
- Token compromised/exposed

**Solutions**:
1. **Immediate**: **Revoke token immediately**
   - Go to API Tokens list
   - Find compromised token
   - Click "Revoke" or "Delete"
   - Token disabled instantly

2. **Create new token** (this workflow):
   - Generate replacement token
   - Update all applications
   - Verify no applications still using old token

3. **Audit access**:
   - Review API audit logs for token usage
   - Check for suspicious activity
   - Look for unauthorized resource creation

4. **Prevent future exposure**:
   - Add *.pem, *.key, .env to .gitignore
   - Use pre-commit hooks to detect secrets
   - Use secrets scanning tools (git-secrets, TruffleHog)

5. **Strengthen storage**:
   - Use secrets manager (Vault, AWS Secrets Manager)
   - Never hardcode tokens
   - Use environment variables

---

## Token Management Best Practices

### 1. Token Naming
```
❌ Bad: "token123", "api_key", "secret"
✅ Good: "terraform-prod", "ci-cd-automation"
✅ Better: "terraform-prod-ci-cd-2025"
```

### 2. Token Scope
```
❌ Bad: Single token for all purposes
✅ Good: Separate tokens for Terraform, CLI, Apps
✅ Better: One token per service + rotation schedule
```

### 3. Token Storage
```
❌ Bad: Hardcoded in scripts, committed to Git
✅ Good: Environment variables in CI/CD
✅ Better: HashiCorp Vault or AWS Secrets Manager
```

### 4. Token Rotation
```
❌ Bad: Never rotate (same token forever)
✅ Good: Rotate annually
✅ Better: Rotate quarterly with automated process
```

---

## Token Lifetime Recommendations

| Use Case | Lifetime | Rotation | Storage |
|----------|----------|----------|---------|
| CI/CD Automation | 90 days | Quarterly | Secrets Manager |
| Terraform Backend | 180 days | Bi-annually | Encrypted File |
| Development | 365 days | Annually | .env (untracked) |
| Batch Jobs | 365 days | Annually | Secure Config |
| Service Integration | 365 days | Annually | Secrets Manager |

---

## Next Steps

After creating API token:

1. **Update applications**: Use token in Terraform, CLI, scripts
2. **Test thoroughly**: Verify all applications work with token
3. **Monitor usage**: Check for unusual activity
4. **Plan rotation**: Set calendar reminders quarterly
5. **Document**: Record token purpose and rotation schedule

---

## Related Documentation

- **API Token Management**: https://docs.cloud.f5.com/docs-v2/platform/api-tokens
- **API Authentication**: https://docs.cloud.f5.com/docs-v2/api/authentication
- **Terraform Provider**: https://docs.cloud.f5.com/docs-v2/api/terraform-provider
- **CLI Authentication**: https://docs.cloud.f5.com/docs-v2/cli/authentication
- **Security Best Practices**: https://docs.cloud.f5.com/docs-v2/platform/security-best-practices

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24
