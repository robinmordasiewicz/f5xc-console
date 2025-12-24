---
title: Workflow - Create and Manage Users
description: Create new users, assign roles, and manage RBAC in F5 XC tenant
version: 1.0.0
last_updated: 2025-12-24
category: Administration
complexity: Intermediate
estimated_duration: 15-20 minutes
---

# Workflow: Create and Manage Users

## Overview
Create new users in F5 Distributed Cloud tenant, assign roles for RBAC (Role-Based Access Control), and manage user permissions. Control who can access the console and what operations they can perform.

## Prerequisites
- ✅ Tenant administrator account with user management permissions
- ✅ New user email address
- ✅ Clear definition of required role/permissions
- ✅ Understanding of F5 XC role model (Admin, Developer, Operator, Viewer)

## Input Parameters

```json
{
  "user_email": "john.developer@example.com",
  "first_name": "John",
  "last_name": "Developer",
  "namespace": "production",
  "roles": [
    {
      "name": "developer",
      "scope": "namespace",
      "namespace": "production",
      "permissions": ["create", "modify", "delete"]
    }
  ],
  "mfa_enabled": true,
  "expiry_date": "2025-12-31"
}
```

## Step-by-Step Execution

### Step 1: Navigate to User Management

**Console Path**: Administration > Users OR System > User Management

**Details**:
- Click "Administration" in left sidebar (or "System")
- Click "Users" submenu
- Should see list of existing users

**Verify**: Users management page displayed

---

### Step 2: Click Add User Button

**Details**:
- Click "Add User" or "Create User" button
- Should open user creation form
- Form has sections: user info, roles, permissions

**Verify**: User creation form displayed

---

### Step 3: Fill User Information

**Details**:

1. **Email Address**: Enter "john.developer@example.com"
   - Primary identifier for user
   - Used for login and notifications
   - Must be unique in tenant

2. **First Name**: Enter "John"
3. **Last Name**: Enter "Developer"

4. **Full Name** (auto-filled): "John Developer"

**Verify**: User information filled

---

### Step 4: Select User Role

**Details**:

1. Look for **Role** or **Primary Role** dropdown
2. Options typically include:
   - **Admin**: Full tenant access, can manage users/settings
   - **DevOps**: Create/modify resources, limited admin functions
   - **Developer**: Create/modify resources in assigned namespaces
   - **Operator**: Modify existing resources, limited creation
   - **Viewer**: Read-only access to all resources
   - **Custom**: Custom permissions (if configured)

3. For developer user, select **"Developer"**

**Role Permissions**:
```
Admin:
  ✓ Create/modify/delete all resources
  ✓ Manage users and roles
  ✓ Modify tenant settings
  ✓ Access billing and quotas

DevOps:
  ✓ Create/modify/delete resources
  ✓ Limited user management
  ✓ Cannot modify billing

Developer:
  ✓ Create/modify/delete in assigned namespaces
  ✓ Cannot affect other namespaces
  ✓ Limited admin functions

Operator:
  ✓ Modify existing resources
  ✓ Limited creation capability
  ✓ Cannot delete resources

Viewer:
  ✗ Read-only
  ✗ Cannot modify anything
  ✓ See all resources
```

**Verify**: Appropriate role selected

---

### Step 5: Assign Namespace (If Applicable)

**Details**:

For **Developer** role, assign namespaces:

1. Look for **Namespaces** section
2. Select namespaces user can access:
   - Check "production" (for this developer)
   - Uncheck other namespaces
3. User access limited to selected namespaces only

**Access Control**:
- Developer in "production": Can create/modify resources in that namespace only
- Other namespaces: Cannot access (even to view)
- Supports multi-namespace assignment

**Verify**: Namespace "production" selected

---

### Step 6: Set Permission Level (If Applicable)

**Details** (if role offers granular permissions):

1. Look for **Permissions** section
2. May show checkboxes for:
   - Create resources
   - Modify resources
   - Delete resources
   - Manage policies
   - View metrics

3. For developer, typically:
   - ✓ Create resources
   - ✓ Modify resources
   - ✓ Delete resources
   - ✓ View metrics
   - ✗ Manage users
   - ✗ Change settings

**Verify**: Appropriate permissions selected

---

### Step 7: Enable MFA (Optional But Recommended)

**Details**:

1. Look for **Multi-Factor Authentication** or **MFA** checkbox
2. Options:
   - Disable MFA (less secure)
   - Enable MFA (required for login)
   - Optional MFA (user choice)

3. For security best practice:
   - Check **"Require MFA"**
   - User must set up MFA on first login
   - Uses authenticator app or SMS

**Verify**: MFA enabled (checked)

---

### Step 8: Set Expiration Date (Optional)

**Details**:

1. Look for **Expiration Date** or **Account Expires** field
2. Options:
   - No expiration (permanent account)
   - Set expiration date (temporary access)

3. For contractor/temporary staff:
   - Set expiration date: "2025-12-31"
   - Account automatically disabled after date
   - No manual cleanup needed

4. For permanent staff:
   - Leave empty (no expiration)

**Verify**: Expiration set (or left empty for permanent)

---

### Step 9: Review and Create User

**Details**:

1. Review all information:
   - Email: john.developer@example.com ✓
   - Name: John Developer ✓
   - Role: Developer ✓
   - Namespace: production ✓
   - MFA: Enabled ✓
   - Expiration: 2025-12-31 ✓

2. Click **"Create User"** or **"Save"**
3. Should show confirmation message

**Expected**: User created successfully

---

### Step 10: Verify User Creation

**Details**:

1. Back on Users list page
2. Look for "john.developer@example.com" in list
3. Click on user to view details:
   - Email, name, role correct ✓
   - Namespace assigned ✓
   - MFA enabled ✓
   - Active status ✓

**Verify**: User appears in list with correct details

---

### Step 11: Send Activation Email

**Details** (usually automatic):

1. System sends activation email to new user
2. Email contains:
   - Tenant login URL
   - Setup instructions
   - MFA setup link (if enabled)

3. User opens email and:
   - Clicks activation link
   - Sets password
   - Configures MFA (if required)
   - Completes first login

**Verify**: Activation email delivered

---

### Step 12: Monitor First Login

**Details**:

1. Return to Users page
2. Look for new user status:
   - "Invited" → Email sent, awaiting activation
   - "Active" → User logged in successfully
   - "Inactive" → User hasn't completed setup

3. If user doesn't activate:
   - Resend invitation email (after 24 hours)
   - Check spam folder
   - Verify email address correct

**Verify**: User status changes to "Active" after first login

---

## User Role Comparison

| Feature | Admin | DevOps | Developer | Operator | Viewer |
|---------|-------|--------|-----------|----------|--------|
| Create resources | ✓ | ✓ | ✓ (namespace) | ✗ | ✗ |
| Modify resources | ✓ | ✓ | ✓ (namespace) | ✓ | ✗ |
| Delete resources | ✓ | ✓ | ✓ (namespace) | ✗ | ✗ |
| Manage users | ✓ | Limited | ✗ | ✗ | ✗ |
| Modify settings | ✓ | Limited | ✗ | ✗ | ✗ |
| View all resources | ✓ | ✓ | Namespace only | ✓ | ✓ |
| Access billing | ✓ | Limited | ✗ | ✗ | ✗ |

---

## Validation with CLI

**Command**: Verify user creation

```bash
# List all users
xcsh administration list users

# Expected output:
# john.developer@example.com | Developer | Active | production

# Get specific user details
xcsh administration get user john.developer@example.com

# Expected output:
# Email: john.developer@example.com
# Name: John Developer
# Role: Developer
# Namespaces: production
# MFA: Enabled
# Status: Active
```

---

## Success Criteria

- [x] User created with correct email and name
- [x] Role assigned appropriately (Developer)
- [x] Namespace assigned (production)
- [x] MFA enabled
- [x] Expiration set (if temporary)
- [x] User appears in list
- [x] Activation email sent
- [x] User completes first login

---

## Common Issues & Troubleshooting

### Issue: User Doesn't Receive Activation Email

**Symptoms**:
- User doesn't receive activation email
- Email not in inbox or spam
- Cannot complete setup

**Solutions**:
1. **Verify email address**:
   - Check for typos in email
   - Correct email and resend

2. **Check spam folder**:
   - Email may be in spam
   - User should add sender to contacts

3. **Resend invitation**:
   - Go to Users page
   - Find user, click "Resend Invitation"
   - New email sent

4. **Verify email delivery**:
   - Check tenant email settings
   - May be misconfigured
   - Contact support if persistent

---

### Issue: User Can't Login After Activation

**Symptoms**:
- User activated but cannot log in
- Invalid credentials or forbidden error
- Account appears locked

**Solutions**:
1. **Password reset**:
   - Go to Users page
   - Find user, click "Reset Password"
   - Send password reset email to user

2. **Check role/permissions**:
   - Verify user has appropriate role
   - Verify role has required permissions
   - Add/modify permissions if needed

3. **Check MFA setup**:
   - User must complete MFA setup
   - If MFA required but not set up, cannot login
   - Verify MFA email sent

4. **Check namespace access**:
   - Verify user assigned to namespace
   - Developer can't login without namespace assignment

---

### Issue: Too Many Permissions Assigned

**Symptoms**:
- User has more access than needed
- Security risk: overprivileged
- Should follow least privilege principle

**Solutions**:
1. **Review user role**:
   - Go to Users page
   - Find user, click "Edit"
   - Review current role and permissions

2. **Reduce permissions**:
   - Change role to more restrictive
   - Remove unnecessary namespace assignments
   - Disable unnecessary permissions

3. **Apply least privilege**:
   - Assign minimum role needed
   - Assign minimum namespaces needed
   - Add specific permissions only as needed

4. **Regular audits**:
   - Review user permissions monthly
   - Remove when no longer needed
   - Document access for compliance

---

## Best Practices

### 1. Follow Least Privilege
```
❌ Bad: Make all users Admin
✅ Good: Assign Developer role with specific namespace
✅ Better: Developer in 1 namespace + Operator elsewhere
```

### 2. Use MFA Always
```
❌ Bad: Disable MFA for convenience
✅ Good: Enable MFA for all users
✅ Better: Enforce MFA system-wide
```

### 3. Set Expiration for Contractors
```
✅ Good: Set expiration date for temporary staff
✅ Better: Set shorter expiration for contractors
✅ Excellent: Require renewal for access continuation
```

### 4. Document Role Changes
```
✅ Good: Keep record of permission changes
✅ Better: Include business reason in records
✅ Excellent: Automated audit logging
```

---

## Namespace-Based Access Control

### Example: Multi-Tenant Isolation

```
User: alice@company.com
- Role: Developer
- Namespaces: production, staging
- Can create/modify resources in both namespaces
- Cannot access development namespace
- Cannot see other users' resources

User: bob@company.com
- Role: Developer
- Namespace: development
- Can only access development namespace
- Separated from production
- Isolation enforced automatically
```

---

## Next Steps

After creating user:

1. **Send welcome email**: Brief orientation
2. **Schedule onboarding**: Training on console
3. **Monitor activity**: Verify appropriate access
4. **Review after 30 days**: Confirm role still appropriate
5. **Disable if unused**: Clean up inactive accounts

---

## Related Documentation

- **User Management Overview**: https://docs.cloud.f5.com/docs-v2/platform/user-management
- **Role-Based Access Control**: https://docs.cloud.f5.com/docs-v2/platform/rbac
- **Namespace Management**: https://docs.cloud.f5.com/docs-v2/how-to/administration/namespaces
- **Multi-Factor Authentication**: https://docs.cloud.f5.com/docs-v2/how-to/administration/mfa
- **User Permissions**: https://docs.cloud.f5.com/docs-v2/how-to/administration/user-permissions

---

**Workflow Version**: 1.0.0
**Status**: Ready for production use
**Last Tested**: 2025-12-24
