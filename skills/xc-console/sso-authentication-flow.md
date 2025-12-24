# SSO Authentication Flow for F5 Distributed Cloud

This document describes the step-by-step SSO authentication workflow using `mcp__claude-in-chrome` MCP tools.

## Overview

When navigating to an F5 XC tenant, the skill automatically detects session expiry and handles Azure SSO authentication.

## Detection Phase

### Step 1: Check Current URL and Page Content

After any navigation, check for login indicators:

```
Tool: mcp__claude-in-chrome__read_page
Parameters:
  tabId: [current tab ID]
  filter: "interactive"
```

**Login Page Indicators:**
- URL contains `login.volterra.us`
- URL contains `login.microsoftonline.com`
- URL contains `/auth/` or `/login`
- Page contains text: "Sign in", "Log in", "Session expired", "Go to login"
- SSO button visible with text like "Sign in with Microsoft"

### Step 2: Identify Login Type

**F5 XC Native Login Page:**
- Has email/password fields
- Has "Sign In" button
- May have "Back to SSO Options" link

**Azure SSO Page:**
- URL contains `login.microsoftonline.com`
- Has Microsoft branding
- May show "Pick an account" or "Enter password"

## SSO Initiation Phase

### Step 3: Find and Click SSO Button

For F5 XC login page with SSO option:

```
Tool: mcp__claude-in-chrome__find
Parameters:
  tabId: [tab ID]
  query: "Sign in with Microsoft OR SSO button OR Azure login"
```

Then click the SSO button:

```
Tool: mcp__claude-in-chrome__computer
Parameters:
  action: "left_click"
  tabId: [tab ID]
  ref: [element ref from find]
```

### Step 4: Handle "Go to login" Dialog

If session expired dialog appears:

```
Tool: mcp__claude-in-chrome__find
Parameters:
  tabId: [tab ID]
  query: "Go to login button"

Tool: mcp__claude-in-chrome__computer
Parameters:
  action: "left_click"
  tabId: [tab ID]
  ref: [button ref]
```

## Microsoft Login Phase

### Step 5: Wait for Microsoft Redirect

After clicking SSO, wait for redirect:

```
Tool: mcp__claude-in-chrome__computer
Parameters:
  action: "wait"
  tabId: [tab ID]
  duration: 3
```

### Step 6: Check Authentication State

Take screenshot to assess state:

```
Tool: mcp__claude-in-chrome__computer
Parameters:
  action: "screenshot"
  tabId: [tab ID]
```

**Possible States:**

1. **Auto-authenticated**: Browser has cached Azure credentials
   - Page automatically redirects back to F5 XC
   - No action needed, proceed to verification

2. **Account Selection**: Multiple Azure accounts available
   - Read page to find account list
   - Click the appropriate account

3. **Password Required**: Need to enter password
   - Inform user: "Please enter your Azure password in the browser"
   - Wait for user confirmation

4. **MFA Required**: Multi-factor authentication needed
   - Inform user: "Please complete MFA in the browser"
   - Wait for user confirmation

### Step 7: Handle Account Selection (if needed)

```
Tool: mcp__claude-in-chrome__read_page
Parameters:
  tabId: [tab ID]

# Look for account tiles, then click the desired one
Tool: mcp__claude-in-chrome__find
Parameters:
  tabId: [tab ID]
  query: "user account tile OR email address"
```

## Post-Authentication Phase

### Step 8: Wait for F5 XC Console

After authentication completes:

```
Tool: mcp__claude-in-chrome__computer
Parameters:
  action: "wait"
  tabId: [tab ID]
  duration: 5
```

### Step 9: Verify Successful Login

```
Tool: mcp__claude-in-chrome__read_page
Parameters:
  tabId: [tab ID]
```

**Success Indicators:**
- URL contains the tenant domain (e.g., `nferreira.staging.volterra.us`)
- URL does NOT contain `login`
- Page contains workspace cards or navigation menu
- Page has "Home" or tenant name in header

**Failure Indicators:**
- Still on login page
- Error message visible
- Session expired message reappears

### Step 10: Take Confirmation Screenshot

```
Tool: mcp__claude-in-chrome__computer
Parameters:
  action: "screenshot"
  tabId: [tab ID]
```

## Navigation to Target

### Step 11: Navigate to Requested Workspace

For "Web App and API Protection":

```
Tool: mcp__claude-in-chrome__find
Parameters:
  tabId: [tab ID]
  query: "Web App & API Protection card OR WAAP workspace"

Tool: mcp__claude-in-chrome__computer
Parameters:
  action: "left_click"
  tabId: [tab ID]
  ref: [workspace card ref]
```

Or navigate directly:

```
Tool: mcp__claude-in-chrome__navigate
Parameters:
  tabId: [tab ID]
  url: "https://[tenant].volterra.us/web/workspaces/web-app-and-api-protection"
```

## Error Handling

### Session Timeout During Navigation

If session expires mid-task:
1. Detect redirect to login page
2. Re-initiate SSO flow
3. Resume original task after authentication

### Authentication Failure

If SSO fails:
1. Take screenshot of error
2. Report error to user
3. Suggest manual login
4. Wait for user confirmation before retrying

### Manual Intervention Required

When manual login needed:
```
Claude response:
"I've detected that Azure SSO requires your credentials. Please:
1. Enter your password in the browser
2. Complete any MFA prompts
3. Tell me when you're logged in

I'll wait for your confirmation before continuing."
```

## Complete Flow Example

```
User: /f5xc-console login to https://nferreira.staging.volterra.us/ and navigate to Web App and API Protection

Claude actions:
1. tabs_context_mcp → Get available tabs
2. tabs_create_mcp → Create new tab (if needed)
3. navigate → Go to tenant URL
4. wait(3) → Let page load
5. read_page → Check for login indicators
6. [If login page detected]:
   a. find("Go to login") → Find button
   b. computer(left_click) → Click button
   c. wait(3) → Wait for SSO redirect
   d. read_page → Check authentication state
   e. [If auto-auth]: proceed
   f. [If manual needed]: inform user, wait
7. wait(5) → Wait for console to load
8. read_page → Verify logged in
9. find("Web App & API Protection") → Find workspace
10. computer(left_click) → Click workspace card
11. wait(3) → Let workspace load
12. computer(screenshot) → Capture final state
13. Report success to user
```

## Workspace Navigation Reference

| Workspace | URL Path | Card Text |
|-----------|----------|-----------|
| Web App & API Protection | `/web/workspaces/web-app-and-api-protection` | "Web App & API Protection" |
| Multi-Cloud Network Connect | `/web/workspaces/multi-cloud-network-connect` | "Multi-Cloud Network Connect" |
| DNS Management | `/web/workspaces/dns-management` | "DNS Management" |
| CDN | `/web/workspaces/cdn` | "CDN" |
| Distributed Apps | `/web/workspaces/distributed-apps` | "Distributed Apps" |
| Administration | `/web/workspaces/administration` | "Administration" |
