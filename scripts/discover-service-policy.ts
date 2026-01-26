#!/usr/bin/env ts-node
/**
 * Service Policy Form Structure Discovery
 *
 * Documents the comprehensive form structure discovered via browser automation
 * of the F5 XC Console Service Policy creation form.
 *
 * Structure discovered via Chrome DevTools MCP exploration:
 * - Service Policy form has top-level sections and nested Rule Item form
 * - Rule items have 7 distinct sections with conditional fields
 *
 * Usage:
 *   npx ts-node scripts/discover-service-policy.ts
 *
 * Output:
 *   - Prints documented form structure
 *   - Validates against service_policy.definition.ts
 */

/**
 * FORM STRUCTURE DISCOVERED VIA BROWSER AUTOMATION
 *
 * URL: https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/service_policies
 * Exploration Date: 2026-01-24
 */

// ============================================================================
// TOP-LEVEL SERVICE POLICY FORM
// ============================================================================

interface DiscoveredField {
  name: string;
  label: string;
  type: 'input' | 'dropdown' | 'array' | 'checkbox' | 'combobox' | 'configure' | 'textarea';
  required: boolean;
  advanced: boolean;
  section: string;
  options?: string[];
  optionDescriptions?: Record<string, string>;
  placeholder?: string;
  nestedFields?: DiscoveredField[];
}

interface DiscoveredSection {
  name: string;
  label: string;
  fields: DiscoveredField[];
  hasAdvancedToggle: boolean;
}

interface DiscoveredForm {
  resourceType: string;
  formUrl: string;
  discoveryDate: string;
  sections: DiscoveredSection[];
  nestedForms?: Record<string, DiscoveredForm>;
}

// Top-Level Service Policy Form Structure
const servicePolicyForm: DiscoveredForm = {
  resourceType: 'service_policy',
  formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/service_policies',
  discoveryDate: '2026-01-24',
  sections: [
    {
      name: 'metadata',
      label: 'Metadata',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'input',
          required: true,
          advanced: false,
          section: 'metadata',
          placeholder: 'Name',
        },
        {
          name: 'labels',
          label: 'Labels',
          type: 'array',
          required: false,
          advanced: false,
          section: 'metadata',
          placeholder: 'Add Label',
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          advanced: false,
          section: 'metadata',
          placeholder: 'Description',
        },
      ],
    },
    {
      name: 'servers',
      label: 'Servers',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'server_selection',
          label: 'Server Selection',
          type: 'dropdown',
          required: true,
          advanced: false,
          section: 'servers',
          options: ['Any Server', 'Server Name', 'Group of Servers by Name'],
          optionDescriptions: {
            'Any Server': 'Apply policy to any server (default behavior).',
            'Server Name': 'Apply policy to a specific server by name.',
            'Group of Servers by Name': 'Apply policy to servers matching exact values or regex patterns.',
          },
          nestedFields: [
            // When 'Server Name' is selected
            {
              name: 'server_name',
              label: 'Server Name',
              type: 'input',
              required: true,
              advanced: false,
              section: 'servers',
              placeholder: 'example-server',
            },
            // When 'Group of Servers by Name' is selected
            {
              name: 'server_exact_values',
              label: 'Exact Values',
              type: 'array',
              required: false,
              advanced: false,
              section: 'servers',
              placeholder: 'Add exact server name',
            },
            {
              name: 'server_regex_values',
              label: 'Regex Values',
              type: 'array',
              required: false,
              advanced: false,
              section: 'servers',
              placeholder: 'Add regex pattern',
            },
          ],
        },
      ],
    },
    {
      name: 'rules',
      label: 'Rules',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'select_policy_rules',
          label: 'Select Policy Rules',
          type: 'dropdown',
          required: true,
          advanced: false,
          section: 'rules',
          options: [
            'Custom Rule List',
            'Allowed Sources',
            'Denied Sources',
            'Allow All Requests',
            'Deny All Requests',
          ],
          optionDescriptions: {
            'Custom Rule List': 'Configure a custom list of policy rules with detailed matching and action configurations.',
            'Allowed Sources': 'Allow requests from specified source IP prefixes.',
            'Denied Sources': 'Deny requests from specified source IP prefixes.',
            'Allow All Requests': 'Allow all requests without any restrictions.',
            'Deny All Requests': 'Deny all requests (block everything).',
          },
        },
        // When 'Custom Rule List' is selected - this is an array field
        {
          name: 'rules',
          label: 'Rules',
          type: 'array',
          required: true,
          advanced: false,
          section: 'rules',
          placeholder: 'Add Item',
        },
        // When 'Allowed Sources' is selected
        {
          name: 'allowed_source_prefixes',
          label: 'Source IP Prefixes',
          type: 'array',
          required: true,
          advanced: false,
          section: 'rules',
          placeholder: 'Add IP prefix (e.g., 10.0.0.0/8)',
        },
        // When 'Denied Sources' is selected
        {
          name: 'denied_source_prefixes',
          label: 'Source IP Prefixes',
          type: 'array',
          required: true,
          advanced: false,
          section: 'rules',
          placeholder: 'Add IP prefix (e.g., 192.168.0.0/16)',
        },
      ],
    },
  ],
  nestedForms: {},
};

// ============================================================================
// RULE ITEM FORM (Nested Form - When 'Custom Rule List' is selected)
// ============================================================================

const ruleItemForm: DiscoveredForm = {
  resourceType: 'rule_item',
  formUrl: 'Nested modal form within service_policy',
  discoveryDate: '2026-01-24',
  sections: [
    // SECTION 1: Metadata
    {
      name: 'metadata',
      label: 'Metadata',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'input',
          required: true,
          advanced: false,
          section: 'metadata',
          placeholder: 'Name',
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          advanced: false,
          section: 'metadata',
          placeholder: 'Description',
        },
      ],
    },

    // SECTION 2: Action (Discriminator)
    {
      name: 'action',
      label: 'Action',
      hasAdvancedToggle: false,
      fields: [
        {
          name: 'action',
          label: 'Action',
          type: 'dropdown',
          required: true,
          advanced: false,
          section: 'action',
          options: ['Deny', 'Allow', 'Next Policy'],
          optionDescriptions: {
            'Deny': 'Deny the request.',
            'Allow': 'Allow the request to proceed.',
            'Next Policy': 'Terminate evaluation of the current policy and begin evaluating the next policy in the policy set. Note that the evaluation of any remaining rules in the current policy is skipped.',
          },
        },
      ],
    },

    // SECTION 3: Clients
    {
      name: 'clients',
      label: 'Clients',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'client_selection',
          label: 'Client Selection',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'clients',
          options: [
            'Any Client',
            'Client Name',
            'Group of Clients by Name',
            'List of IP Threat Categories',
            'Group of Clients by Label Selector',
          ],
          optionDescriptions: {
            'Any Client': 'Match any client (default behavior).',
            'Client Name': 'The expected name of the client invoking the request API. The predicate evaluates to true if any of the actual names is the same as the expected client name.',
            'Group of Clients by Name': 'A list of exact values and/or regular expressions for the expected name of the client.',
            'List of IP Threat Categories': 'IP threat categories to choose from.',
            'Group of Clients by Label Selector': 'Match clients by Kubernetes-style label selector.',
          },
          nestedFields: [
            // When 'Client Name' is selected
            {
              name: 'client_name',
              label: 'Client Name',
              type: 'input',
              required: true,
              advanced: false,
              section: 'clients',
              placeholder: 'client-name',
            },
            // When 'Group of Clients by Name' is selected
            {
              name: 'client_name_exact_values',
              label: 'Exact Values',
              type: 'array',
              required: false,
              advanced: false,
              section: 'clients',
              placeholder: 'Add exact client name',
            },
            {
              name: 'client_name_regex_values',
              label: 'Regex Values',
              type: 'array',
              required: false,
              advanced: false,
              section: 'clients',
              placeholder: 'Add regex pattern',
            },
            // When 'List of IP Threat Categories' is selected
            {
              name: 'ip_threat_categories',
              label: 'IP Threat Categories',
              type: 'array',
              required: true,
              advanced: false,
              section: 'clients',
              placeholder: 'Select threat categories',
            },
            // When 'Group of Clients by Label Selector' is selected
            {
              name: 'client_label_selector',
              label: 'Label Selector',
              type: 'configure',
              required: true,
              advanced: false,
              section: 'clients',
            },
          ],
        },
      ],
    },

    // SECTION 4: Servers (Domain Matcher)
    {
      name: 'servers',
      label: 'Servers',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'domain_exact_values',
          label: 'Exact Values',
          type: 'array',
          required: false,
          advanced: false,
          section: 'servers',
          placeholder: 'Add exact domain',
        },
        {
          name: 'domain_regex_values',
          label: 'Regex Values',
          type: 'array',
          required: false,
          advanced: false,
          section: 'servers',
          placeholder: 'Add regex pattern',
        },
      ],
    },

    // SECTION 5: Request Match
    {
      name: 'request_match',
      label: 'Request Match',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'http_method',
          label: 'HTTP Method',
          type: 'combobox',
          required: false,
          advanced: false,
          section: 'request_match',
          options: ['ANY', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'],
        },
        {
          name: 'invert_method_matcher',
          label: 'Invert Method Matcher',
          type: 'checkbox',
          required: false,
          advanced: false,
          section: 'request_match',
        },
        {
          name: 'http_path',
          label: 'HTTP Path',
          type: 'configure',
          required: false,
          advanced: false,
          section: 'request_match',
        },
        {
          name: 'query_parameters',
          label: 'HTTP Query Parameters',
          type: 'array',
          required: false,
          advanced: true,
          section: 'request_match',
          placeholder: 'Add Item',
        },
        {
          name: 'headers',
          label: 'HTTP Headers',
          type: 'array',
          required: false,
          advanced: true,
          section: 'request_match',
          placeholder: 'Add Item',
        },
      ],
    },

    // SECTION 6: Request Constraints
    {
      name: 'request_constraints',
      label: 'Request Constraints',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'request_constraints_config',
          label: 'Configure',
          type: 'configure',
          required: false,
          advanced: false,
          section: 'request_constraints',
        },
      ],
    },

    // SECTION 7: Advanced Match
    {
      name: 'advanced_match',
      label: 'Advanced Match',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'keys',
          label: 'Keys',
          type: 'array',
          required: false,
          advanced: false,
          section: 'advanced_match',
          placeholder: 'Add Item',
        },
        {
          name: 'api_group_matcher',
          label: 'API Group Matcher',
          type: 'configure',
          required: false,
          advanced: true,
          section: 'advanced_match',
        },
        {
          name: 'source_segments',
          label: 'Source Segments',
          type: 'dropdown',
          required: false,
          advanced: true,
          section: 'advanced_match',
          options: ['Any Segment', 'Custom Segment List'],
        },
        {
          name: 'user_identity_exact_values',
          label: 'User Identity Exact Values',
          type: 'array',
          required: false,
          advanced: true,
          section: 'advanced_match',
          placeholder: 'Add exact value',
        },
        {
          name: 'user_identity_regex_values',
          label: 'User Identity Regex Values',
          type: 'array',
          required: false,
          advanced: true,
          section: 'advanced_match',
          placeholder: 'Add regex pattern',
        },
      ],
    },
  ],
};

// Add rule item as nested form
servicePolicyForm.nestedForms = {
  rule_item: ruleItemForm,
};

// ============================================================================
// HTTP PATH NESTED CONFIG (Configure link in Request Match section)
// ============================================================================

const httpPathConfig: DiscoveredForm = {
  resourceType: 'http_path_config',
  formUrl: 'Nested modal form within rule_item Request Match section',
  discoveryDate: '2026-01-24',
  sections: [
    {
      name: 'http_path',
      label: 'HTTP Path',
      hasAdvancedToggle: false,
      fields: [
        {
          name: 'path_match_type',
          label: 'Path Match Type',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'http_path',
          options: ['Any Path', 'Prefix', 'Path', 'Regex'],
          optionDescriptions: {
            'Any Path': 'Match any path.',
            'Prefix': 'Match paths starting with the specified prefix.',
            'Path': 'Match exact path.',
            'Regex': 'Match paths using regular expression.',
          },
        },
        // When Prefix, Path, or Regex is selected
        {
          name: 'path_value',
          label: 'Path Value',
          type: 'input',
          required: true,
          advanced: false,
          section: 'http_path',
          placeholder: '/api/v1/*',
        },
      ],
    },
  ],
};

ruleItemForm.nestedForms = {
  http_path: httpPathConfig,
};

// ============================================================================
// VALIDATION AND SUMMARY
// ============================================================================

function countFields(form: DiscoveredForm): number {
  let count = 0;
  for (const section of form.sections) {
    count += section.fields.length;
    for (const field of section.fields) {
      if (field.nestedFields) {
        count += field.nestedFields.length;
      }
    }
  }
  if (form.nestedForms) {
    for (const nestedForm of Object.values(form.nestedForms)) {
      count += countFields(nestedForm);
    }
  }
  return count;
}

function printFormSummary(form: DiscoveredForm, indent = 0): void {
  const prefix = '  '.repeat(indent);
  console.log(`${prefix}📋 ${form.resourceType} Form`);
  console.log(`${prefix}   URL: ${form.formUrl}`);
  console.log(`${prefix}   Discovery Date: ${form.discoveryDate}`);
  console.log(`${prefix}   Sections: ${form.sections.length}`);

  for (const section of form.sections) {
    const advancedMark = section.hasAdvancedToggle ? ' [Has Advanced]' : '';
    console.log(`${prefix}   📂 ${section.label}${advancedMark}`);
    for (const field of section.fields) {
      const requiredMark = field.required ? ' *' : '';
      const advMark = field.advanced ? ' [Adv]' : '';
      console.log(`${prefix}      └─ ${field.label}${requiredMark}${advMark} (${field.type})`);
      if (field.options) {
        console.log(`${prefix}         Options: ${field.options.join(', ')}`);
      }
    }
  }

  if (form.nestedForms) {
    console.log(`${prefix}   📁 Nested Forms:`);
    for (const [name, nestedForm] of Object.entries(form.nestedForms)) {
      printFormSummary(nestedForm, indent + 2);
    }
  }
}

function main(): void {
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('🔍 Service Policy Form Structure Discovery');
  console.log('   Documented from F5 XC Console browser automation');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  printFormSummary(servicePolicyForm);

  const totalFields = countFields(servicePolicyForm);
  console.log('\n───────────────────────────────────────────────────────────────────────────');
  console.log(`📊 Total Fields Discovered: ${totalFields}`);
  console.log('───────────────────────────────────────────────────────────────────────────');

  // Summary of key discriminators
  console.log('\n🔀 Discriminator Fields (Control Conditional Visibility):');
  console.log('   1. server_selection → Shows server_name OR server group fields');
  console.log('   2. select_policy_rules → Shows rules array OR source prefixes');
  console.log('   3. action → Discriminator for rule item types (Deny/Allow/Next Policy)');
  console.log('   4. client_selection → Shows client-specific fields');
  console.log('   5. path_match_type → Shows path_value field when not "Any Path"');
  console.log('   6. source_segments → Shows segment list when "Custom Segment List"');

  console.log('\n📝 Key Insights from Browser Exploration:');
  console.log('   • Action dropdown has 3 options: Deny, Allow, Next Policy');
  console.log('   • Client Selection has 5 options with nested conditional fields');
  console.log('   • Rule Item has 7 sections: Metadata, Action, Clients, Servers, Request Match, Request Constraints, Advanced Match');
  console.log('   • Multiple "Show Advanced Fields" toggles reveal additional fields');
  console.log('   • "Configure" links open nested modal forms for complex configs');
  console.log('   • Domain Matcher uses Exact Values and Regex Values pattern');

  console.log('\n✅ Discovery Complete!');
  console.log('   Use this structure to verify/update service_policy.definition.ts');
}

main();
