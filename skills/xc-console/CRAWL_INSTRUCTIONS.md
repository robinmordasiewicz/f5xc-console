# Phase 1 Console Crawl Instructions

## Objective
Systematically crawl the F5 Distributed Cloud console at `https://nferreira.staging.volterra.us` and document all navigation pages, form fields, and action buttons.

## Prerequisites ✅
- ✅ Claude in Chrome extension installed
- ✅ F5 XC API credentials configured
- ✅ Skill directory structure created: `~/.claude/skills/f5xc-console/`
- ✅ SKILL.md and initial metadata JSON created

## Crawl Strategy

### Step 1: Test Azure SSO Login (5 minutes)
**Goal**: Verify that Azure SSO is working and Claude can navigate to the console

**Command**:
```bash
claude --chrome
```

**Instruction to Claude**:
```
Navigate to https://nferreira.staging.volterra.us

Describe what you see:
1. Are you already logged in? (Look for a user menu or profile icon)
2. What is the title of the page?
3. What are the main navigation items visible in the left sidebar?
4. Take a screenshot so I can see the console home page

Don't navigate anywhere else yet - just describe the home page state.
```

**Expected Result**: Claude should see the authenticated console home page without needing to log in again (because Azure SSO is already cached in the browser).

---

### Step 2: Map Main Navigation Menu (10 minutes)
**Goal**: Extract all top-level and second-level navigation items

**Instruction to Claude**:
```
Now that you're on the console home page, I need you to map the navigation structure.

For each item in the left sidebar navigation menu:
1. Tell me the name of the menu item
2. Note if it has sub-items (nested menu)
3. Tell me the URL if visible
4. Take a screenshot of each expanded menu section

Organize the results as a hierarchical list like:
- Main Menu Item 1
  - Sub-item 1.1 (URL: /path/to/page)
  - Sub-item 1.2 (URL: /path/to/page)
- Main Menu Item 2
  - Sub-item 2.1 (URL: /path/to/page)

Start with the top menu item and work your way down.
```

**Expected Output**: Hierarchical list of all navigation items with URLs

---

### Step 3: Crawl Key Resource Pages (20 minutes)
**Goal**: For each main resource type, document the list and creation pages

**Key Pages to Crawl**:
1. HTTP Load Balancers (list and create)
2. Origin Pools (list and create)
3. WAF Policies (list and create)
4. Cloud Sites - AWS/Azure/GCP (list and create)
5. Namespaces (list and create)
6. Health Checks (list and create)
7. Certificates (list and create)

**Instruction to Claude**:
```
For each of the following resource pages, I need you to:
1. Navigate to the page
2. Take a screenshot of the list view
3. Click the "Create/Add" button
4. Take a screenshot of the creation form
5. For each form field, tell me:
   - Field name/label
   - Field type (text, select, checkbox, etc.)
   - Whether it's required
   - Any validation hints visible

Start with "HTTP Load Balancers" page.

Do NOT submit any forms - just explore and document.

Pages to explore:
1. HTTP Load Balancers
2. Origin Pools
3. WAF Policies
4. Cloud Sites
5. Namespaces
6. Health Checks
7. Certificates

For each page, document:
- List page URL
- List page structure (table columns, action buttons)
- Create page URL
- Create form fields (name, label, type, required, validation)
```

**Expected Output**: Detailed form field documentation for each resource type

---

### Step 4: Document Special Pages (10 minutes)
**Goal**: Identify and document any special configuration pages

**Instruction to Claude**:
```
Now look for and document any special pages:
1. Settings or configuration pages
2. Monitoring or status pages
3. Organization/team management pages
4. API credential management pages
5. Any other unique pages

For each, tell me:
- Page name
- URL
- What it's used for
- Any important actions available
```

---

### Step 5: Extract Navigation Selectors (5 minutes)
**Goal**: Get CSS selectors for navigating to each page

**Instruction to Claude**:
```
Now I need CSS selectors to navigate to each page deterministically.

For key pages, provide:
1. The menu item text (e.g., "Web App & API Protection")
2. The selector to click it (e.g., "a:has-text('Web App & API Protection')")
3. The URL it leads to
4. Any submenus that appear
5. The selector for submenus

Focus on these paths:
1. Home → Web App & API Protection → Manage → HTTP Load Balancers
2. Home → Web App & API Protection → Manage → Origin Pools
3. Home → Security → Namespaces

For each navigation path, provide all the selectors needed to get there.
```

---

## Execution Timeline

| Phase | Duration | Task |
|-------|----------|------|
| **1. Test Login** | 5 min | Verify Azure SSO and home page |
| **2. Map Navigation** | 10 min | Extract all menu items and URLs |
| **3. Crawl Resources** | 20 min | Document form fields for 7 resource types |
| **4. Special Pages** | 10 min | Find and document special configuration pages |
| **5. Selectors** | 5 min | Extract CSS selectors for navigation |
| **TOTAL** | ~50 minutes | |

## Output Files to Create

After each step, save results to:
1. **console-navigation-metadata.json** - Update with discovered pages
2. **navigation-tree.md** - Hierarchical list of all menu items
3. **form-fields-documentation.md** - All form fields with metadata
4. **page-selectors.md** - CSS selectors for navigating to key pages
5. **screenshots/** - Directory with page screenshots

## Success Criteria

✅ Crawl is complete when:
- [ ] Navigation tree mapped (all top-level and second-level items)
- [ ] At least 20 unique pages documented
- [ ] Form fields documented for 7+ resource types
- [ ] CSS selectors available for key navigation paths
- [ ] Screenshots captured for each major page type
- [ ] console-navigation-metadata.json updated with discoveries

## Notes

- **Don't submit forms** - We're only exploring and documenting
- **Take plenty of screenshots** - Visual reference helps later
- **Document exact field names** - We need these for deterministic form filling
- **Note any quirks** - UI patterns that might be tricky to automate
- **Test navigation multiple times** - Ensure selectors work consistently

## After Crawl Complete

Once all pages are crawled and documented:
1. Update console-navigation-metadata.json with complete inventory
2. Validate discoveries with f5xcctl CLI:
   ```bash
   f5xcctl configuration list http_loadbalancer --all-namespaces
   f5xcctl configuration list origin_pool --all-namespaces
   f5xcctl configuration list app_firewall --all-namespaces
   ```
3. Document any discrepancies between console UI and API
4. Plan Phase 2: Documentation Integration
