#!/usr/bin/env ts-node
/**
 * App Firewall Form Structure Discovery
 *
 * Documents the form structure for F5 XC App Firewall (WAF) resource.
 * Based on browser automation exploration of F5 XC Console.
 *
 * Updated: 2026-01-24 - Browser exploration revealed significant UI changes:
 * - "Security Policy" replaces "Detection Settings"
 * - New options: Default, Risk-Based Blocking (AI), Custom
 * - "Allowed Response Status Codes" dropdown (not checkbox)
 * - "Mask Sensitive Parameters in Logs" is new field
 * - Custom config has Attack Signatures section with tuning fields
 *
 * Usage:
 *   npx ts-node scripts/discover-app-firewall.ts
 */

interface DiscoveredField {
  name: string;
  label: string;
  type: 'input' | 'dropdown' | 'array' | 'checkbox' | 'spinbutton' | 'configure' | 'textarea';
  required: boolean;
  advanced: boolean;
  section: string;
  options?: string[];
  optionDescriptions?: Record<string, string>;
  defaultValue?: any;
  unit?: string;
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

// ============================================================================
// APP FIREWALL FORM STRUCTURE (Updated 2026-01-24)
// ============================================================================

const appFirewallForm: DiscoveredForm = {
  resourceType: 'app_firewall',
  formUrl:
    'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/app_firewall',
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
        },
        {
          name: 'labels',
          label: 'Labels',
          type: 'array',
          required: false,
          advanced: false,
          section: 'metadata',
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          required: false,
          advanced: false,
          section: 'metadata',
        },
      ],
    },
    {
      name: 'enforcement',
      label: 'Enforcement',
      hasAdvancedToggle: false,
      fields: [
        {
          name: 'enforcement_mode',
          label: 'Enforcement Mode',
          type: 'dropdown',
          required: true,
          advanced: false,
          section: 'enforcement',
          defaultValue: 'Blocking',
          options: ['Blocking', 'Monitoring'],
          optionDescriptions: {
            Blocking: 'Requests matching WAF rules will be blocked',
            Monitoring: 'Requests will be logged but not blocked (alert-only mode)',
          },
        },
      ],
    },
    {
      name: 'security_policy',
      label: 'Security Policy',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'security_policy',
          label: 'Security Policy',
          type: 'dropdown',
          required: true,
          advanced: false,
          section: 'security_policy',
          defaultValue: 'Default',
          options: ['Default', 'Risk-Based Blocking (Powered by AI) - Preview', 'Custom'],
          optionDescriptions: {
            Default: 'Use default WAF security policy with recommended signatures and thresholds',
            'Risk-Based Blocking (Powered by AI) - Preview':
              'AI-powered risk assessment for intelligent blocking decisions (Preview feature)',
            Custom: 'Configure custom security policy including signature selection and attack type settings',
          },
        },
      ],
    },
    {
      name: 'allowed_response_codes',
      label: 'Allowed Response Status Codes',
      hasAdvancedToggle: false,
      fields: [
        {
          name: 'allowed_response_status_codes',
          label: 'Allowed Response Status Codes',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'allowed_response_codes',
          defaultValue: 'Default Allowed Response Status Codes',
          options: [
            'Default Allowed Response Status Codes',
            'Allow All Response Status Codes',
            'Custom Allowed Response Status Codes',
          ],
          optionDescriptions: {
            'Default Allowed Response Status Codes':
              'Allow standard HTTP success and redirect status codes (1xx, 2xx, 3xx)',
            'Allow All Response Status Codes':
              'Allow all HTTP response codes from origin server without inspection',
            'Custom Allowed Response Status Codes':
              'Configure a custom list of allowed response status codes',
          },
        },
      ],
    },
    {
      name: 'masking',
      label: 'Sensitive Parameter Masking',
      hasAdvancedToggle: false,
      fields: [
        {
          name: 'mask_sensitive_parameters',
          label: 'Mask Sensitive Parameters in Logs',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'masking',
          defaultValue: 'Default Masked Parameters',
          options: ['Default Masked Parameters', 'Custom Masked Parameters', 'Disable Masking'],
          optionDescriptions: {
            'Default Masked Parameters':
              'Use default list of sensitive parameters to mask in logs (passwords, tokens, etc.)',
            'Custom Masked Parameters': 'Configure custom list of parameters to mask in logs',
            'Disable Masking': 'Disable masking of sensitive parameters (not recommended)',
          },
        },
      ],
    },
    {
      name: 'blocking',
      label: 'Blocking Response',
      hasAdvancedToggle: false,
      fields: [
        {
          name: 'blocking_response_page',
          label: 'Blocking Response Page',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'blocking',
          defaultValue: 'Default Blocking Page',
          options: ['Default Blocking Page', 'Custom Blocking Page'],
          optionDescriptions: {
            'Default Blocking Page': 'Use the default F5 XC blocking page',
            'Custom Blocking Page': 'Configure a custom blocking page with custom HTML body',
          },
        },
      ],
    },
    {
      name: 'bot_protection',
      label: 'Bot Protection',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'bot_protection_setting',
          label: 'Bot Protection Setting',
          type: 'dropdown',
          required: false,
          advanced: true,
          section: 'bot_protection',
          defaultValue: 'Default Bot Settings',
          options: ['Default Bot Settings', 'Custom Bot Settings'],
          optionDescriptions: {
            'Default Bot Settings': 'Use default bot protection settings',
            'Custom Bot Settings':
              'Configure custom bot protection with JavaScript insertion and grace period',
          },
        },
      ],
    },
    {
      name: 'advanced_settings',
      label: 'Advanced Settings',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'default_anonymization',
          label: 'Default Anonymization',
          type: 'checkbox',
          required: false,
          advanced: true,
          section: 'advanced_settings',
          defaultValue: true,
        },
      ],
    },
  ],
  nestedForms: {},
};

// ============================================================================
// CUSTOM SECURITY POLICY NESTED CONFIG (Updated 2026-01-24)
// ============================================================================

const customSecurityPolicyConfig: DiscoveredForm = {
  resourceType: 'custom_security_policy',
  formUrl: 'Nested modal when security_policy = "Custom"',
  discoveryDate: '2026-01-24',
  sections: [
    {
      name: 'attack_signatures',
      label: 'Attack Signatures',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'attack_types',
          label: 'Attack Types',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'attack_signatures',
          defaultValue: 'Default',
          options: ['Default', 'Custom'],
          optionDescriptions: {
            Default: 'Use default attack type detection covering all common attack categories',
            Custom: 'Configure custom list of attack types to detect or exclude',
          },
        },
        {
          name: 'signature_selection_by_accuracy',
          label: 'Signature Selection by Accuracy',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'attack_signatures',
          defaultValue: 'High and Medium',
          options: ['High Accuracy Only', 'High and Medium', 'High, Medium, and Low'],
          optionDescriptions: {
            'High Accuracy Only': 'Only use high accuracy signatures (fewer false positives)',
            'High and Medium': 'Use high and medium accuracy signatures (balanced)',
            'High, Medium, and Low':
              'Use all signatures including low accuracy (maximum coverage, more false positives)',
          },
        },
        {
          name: 'automatic_attack_signatures_tuning',
          label: 'Automatic Attack Signatures Tuning',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'attack_signatures',
          defaultValue: 'Enable',
          options: ['Enable', 'Disable'],
          optionDescriptions: {
            Enable:
              'Automatically tune attack signatures based on traffic patterns and false positive analysis',
            Disable: 'Use static signature configuration without automatic tuning',
          },
        },
        {
          name: 'attack_signatures_staging',
          label: 'Attack Signatures Staging',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'attack_signatures',
          defaultValue: 'Enable',
          options: ['Enable', 'Disable'],
          optionDescriptions: {
            Enable: 'Stage new attack signatures before enforcement to reduce false positives',
            Disable: 'Enforce new attack signatures immediately without staging period',
          },
        },
      ],
    },
    {
      name: 'advanced_detection',
      label: 'Advanced Detection Settings',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'enable_suppression',
          label: 'Enable Suppression',
          type: 'checkbox',
          required: false,
          advanced: true,
          section: 'advanced_detection',
          defaultValue: true,
        },
        {
          name: 'enable_threat_campaigns',
          label: 'Enable Threat Campaigns',
          type: 'checkbox',
          required: false,
          advanced: true,
          section: 'advanced_detection',
          defaultValue: true,
        },
        {
          name: 'violation_settings',
          label: 'Violation Settings',
          type: 'dropdown',
          required: false,
          advanced: true,
          section: 'advanced_detection',
          defaultValue: 'Default Violation Settings',
          options: ['Default Violation Settings', 'Custom Violation Settings'],
          optionDescriptions: {
            'Default Violation Settings': 'Use default violation handling settings',
            'Custom Violation Settings': 'Configure custom violation thresholds and handling',
          },
        },
        {
          name: 'disabled_attack_types',
          label: 'Disabled Attack Types',
          type: 'array',
          required: false,
          advanced: true,
          section: 'advanced_detection',
        },
        {
          name: 'disabled_violation_types',
          label: 'Disabled Violation Types',
          type: 'array',
          required: false,
          advanced: true,
          section: 'advanced_detection',
        },
      ],
    },
  ],
};

// ============================================================================
// CUSTOM BLOCKING PAGE NESTED CONFIG
// ============================================================================

const customBlockingPageConfig: DiscoveredForm = {
  resourceType: 'custom_blocking_page',
  formUrl: 'Nested modal when blocking_response_page = "Custom Blocking Page"',
  discoveryDate: '2026-01-24',
  sections: [
    {
      name: 'blocking_page_config',
      label: 'Custom Blocking Page Configuration',
      hasAdvancedToggle: false,
      fields: [
        {
          name: 'blocking_page_body',
          label: 'Blocking Page Body',
          type: 'textarea',
          required: true,
          advanced: false,
          section: 'blocking_page_config',
        },
        {
          name: 'response_code',
          label: 'Response Code',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'blocking_page_config',
          defaultValue: 'Forbidden',
          options: ['Forbidden', 'Not Found', 'Unauthorized', 'Service Unavailable', 'OK'],
          optionDescriptions: {
            Forbidden: 'HTTP 403 Forbidden',
            'Not Found': 'HTTP 404 Not Found',
            Unauthorized: 'HTTP 401 Unauthorized',
            'Service Unavailable': 'HTTP 503 Service Unavailable',
            OK: 'HTTP 200 OK',
          },
        },
      ],
    },
  ],
};

// ============================================================================
// CUSTOM BOT SETTINGS NESTED CONFIG
// ============================================================================

const customBotSettingsConfig: DiscoveredForm = {
  resourceType: 'custom_bot_settings',
  formUrl: 'Nested modal when bot_protection_setting = "Custom Bot Settings"',
  discoveryDate: '2026-01-24',
  sections: [
    {
      name: 'bot_config',
      label: 'Custom Bot Protection Configuration',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'javascript_mode',
          label: 'JavaScript Mode',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'bot_config',
          defaultValue: 'Async JavaScript with No Caching',
          options: [
            'None',
            'Async JavaScript with No Caching',
            'Async JavaScript with Caching',
            'Sync JavaScript with No Caching',
            'Sync JavaScript with Caching',
          ],
          optionDescriptions: {
            None: 'Do not inject JavaScript',
            'Async JavaScript with No Caching':
              'Inject JavaScript asynchronously without browser caching',
            'Async JavaScript with Caching': 'Inject JavaScript asynchronously with browser caching',
            'Sync JavaScript with No Caching':
              'Inject JavaScript synchronously without browser caching',
            'Sync JavaScript with Caching': 'Inject JavaScript synchronously with browser caching',
          },
        },
        {
          name: 'grace_period',
          label: 'Grace Period',
          type: 'spinbutton',
          required: false,
          advanced: false,
          section: 'bot_config',
          defaultValue: 300,
          unit: 'seconds',
        },
        {
          name: 'timeout',
          label: 'Timeout',
          type: 'spinbutton',
          required: false,
          advanced: true,
          section: 'bot_config',
          defaultValue: 1000,
          unit: 'milliseconds',
        },
      ],
    },
  ],
};

appFirewallForm.nestedForms = {
  custom_security_policy: customSecurityPolicyConfig,
  custom_blocking_page: customBlockingPageConfig,
  custom_bot_settings: customBotSettingsConfig,
};

// ============================================================================
// VALIDATION AND SUMMARY
// ============================================================================

function countFields(form: DiscoveredForm): number {
  let count = 0;
  for (const section of form.sections) {
    count += section.fields.length;
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

  if (form.nestedForms && Object.keys(form.nestedForms).length > 0) {
    console.log(`${prefix}   📁 Nested Forms:`);
    for (const nestedForm of Object.values(form.nestedForms)) {
      printFormSummary(nestedForm, indent + 2);
    }
  }
}

function main(): void {
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('🔍 App Firewall Form Structure Discovery (Updated 2026-01-24)');
  console.log('   Documented from F5 XC Console browser automation');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  printFormSummary(appFirewallForm);

  const totalFields = countFields(appFirewallForm);
  console.log('\n───────────────────────────────────────────────────────────────────────────');
  console.log(`📊 Total Fields Discovered: ${totalFields}`);
  console.log('───────────────────────────────────────────────────────────────────────────');

  console.log('\n🔀 Discriminator Fields:');
  console.log('   1. security_policy → Custom Security Policy config');
  console.log('   2. blocking_response_page → Custom Blocking Page config');
  console.log('   3. bot_protection_setting → Custom Bot Settings config');
  console.log('   4. allowed_response_status_codes → Custom codes (potential nested config)');
  console.log('   5. mask_sensitive_parameters → Custom params (potential nested config)');

  console.log('\n📝 Key Changes from Previous Version:');
  console.log('   • "Detection Settings" → "Security Policy"');
  console.log('   • New option: "Risk-Based Blocking (Powered by AI) - Preview"');
  console.log('   • "Allow All Response Codes" checkbox → dropdown with 3 options');
  console.log('   • NEW: "Mask Sensitive Parameters in Logs" dropdown');
  console.log('   • "Blocking Page" → "Blocking Response Page"');
  console.log('   • Custom config now includes Attack Signatures section');
  console.log('   • New fields: Automatic Attack Signatures Tuning, Attack Signatures Staging');

  console.log('\n⚠️  Potential Gaps to Verify via Browser:');
  console.log('   • Custom Allowed Response Status Codes nested config');
  console.log('   • Custom Masked Parameters nested config');
  console.log('   • Attack Types → Custom nested config');
  console.log('   • violation_settings → Custom may have nested config');

  console.log('\n✅ Discovery Complete!');
}

main();
