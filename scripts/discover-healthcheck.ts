#!/usr/bin/env ts-node
/**
 * Healthcheck Form Structure Discovery
 *
 * Documents the form structure for F5 XC Healthcheck resource.
 * Based on browser automation exploration of F5 XC Console.
 *
 * Usage:
 *   npx ts-node scripts/discover-healthcheck.ts
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
// HEALTHCHECK FORM STRUCTURE
// ============================================================================

const healthcheckForm: DiscoveredForm = {
  resourceType: 'healthcheck',
  formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/load_balancers/health_checks',
  discoveryDate: '2026-01-23',
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
      name: 'health_check_parameters',
      label: 'Health Check Parameters',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'health_check',
          label: 'Health Check',
          type: 'dropdown',
          required: true,
          advanced: false,
          section: 'health_check_parameters',
          defaultValue: 'HTTP HealthCheck',
          options: ['HTTP HealthCheck', 'TCP HealthCheck', 'ICMP HealthCheck for UDP Loadbalancer'],
          optionDescriptions: {
            'HTTP HealthCheck': 'Specifies the following details for HTTP health check requests: 1. Host header 2. Path 3. Request headers to add 4. Request headers to remove',
            'TCP HealthCheck': 'Specifies send payload and expected response payload',
            'ICMP HealthCheck for UDP Loadbalancer': 'Specifies ICMP HealthCheck for UDP Loadbalancer',
          },
        },
        {
          name: 'timeout',
          label: 'Timeout',
          type: 'spinbutton',
          required: true,
          advanced: false,
          section: 'health_check_parameters',
          defaultValue: 3,
          unit: 'seconds',
        },
        {
          name: 'interval',
          label: 'Interval',
          type: 'spinbutton',
          required: true,
          advanced: false,
          section: 'health_check_parameters',
          defaultValue: 15,
          unit: 'seconds',
        },
        {
          name: 'unhealthy_threshold',
          label: 'Unhealthy Threshold',
          type: 'spinbutton',
          required: true,
          advanced: false,
          section: 'health_check_parameters',
          defaultValue: 1,
        },
        {
          name: 'healthy_threshold',
          label: 'Healthy Threshold',
          type: 'spinbutton',
          required: true,
          advanced: false,
          section: 'health_check_parameters',
          defaultValue: 3,
        },
        {
          name: 'jitter_percent',
          label: 'Jitter Percent',
          type: 'spinbutton',
          required: false,
          advanced: true,
          section: 'health_check_parameters',
          defaultValue: 30,
          unit: 'percent',
        },
      ],
    },
  ],
  nestedForms: {},
};

// ============================================================================
// HTTP HEALTHCHECK NESTED CONFIG
// ============================================================================

const httpHealthcheckConfig: DiscoveredForm = {
  resourceType: 'http_health_check_config',
  formUrl: 'Nested modal when health_check = "HTTP HealthCheck"',
  discoveryDate: '2026-01-23',
  sections: [
    {
      name: 'http_config',
      label: 'HTTP Health Check Configuration',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'specify_host_header',
          label: 'Specify Host Header',
          type: 'dropdown',
          required: true,
          advanced: false,
          section: 'http_config',
          defaultValue: 'Origin Server Name',
          options: ['Origin Server Name', 'Host Header Value'],
          optionDescriptions: {
            'Origin Server Name': 'Use the origin server name.',
            'Host Header Value': 'The value of the host header.',
          },
        },
        {
          name: 'host_header_value',
          label: 'Host Header Value',
          type: 'input',
          required: false,
          advanced: false,
          section: 'http_config',
          // Conditional: only when specify_host_header = 'Host Header Value'
        },
        {
          name: 'path',
          label: 'Path',
          type: 'input',
          required: true,
          advanced: false,
          section: 'http_config',
          defaultValue: '/',
        },
        {
          name: 'use_http2',
          label: 'Use HTTP2',
          type: 'checkbox',
          required: false,
          advanced: false,
          section: 'http_config',
          defaultValue: false,
        },
        {
          name: 'request_headers_to_add',
          label: 'Request Headers to Add',
          type: 'array',
          required: false,
          advanced: false,
          section: 'http_config',
        },
        {
          name: 'request_headers_to_remove',
          label: 'Request Headers to Remove',
          type: 'array',
          required: false,
          advanced: true,
          section: 'http_config',
        },
        {
          name: 'expected_status_codes',
          label: 'Expected Status Codes',
          type: 'array',
          required: false,
          advanced: false,
          section: 'http_config',
          defaultValue: ['200'],
        },
      ],
    },
  ],
};

// ============================================================================
// TCP HEALTHCHECK NESTED CONFIG
// ============================================================================

const tcpHealthcheckConfig: DiscoveredForm = {
  resourceType: 'tcp_health_check_config',
  formUrl: 'Nested modal when health_check = "TCP HealthCheck"',
  discoveryDate: '2026-01-23',
  sections: [
    {
      name: 'tcp_config',
      label: 'TCP Health Check Configuration',
      hasAdvancedToggle: false,
      fields: [
        {
          name: 'send_payload',
          label: 'Send Payload',
          type: 'input',
          required: false,
          advanced: false,
          section: 'tcp_config',
        },
        {
          name: 'expected_response',
          label: 'Expected Response',
          type: 'input',
          required: false,
          advanced: false,
          section: 'tcp_config',
        },
      ],
    },
  ],
};

healthcheckForm.nestedForms = {
  http_health_check: httpHealthcheckConfig,
  tcp_health_check: tcpHealthcheckConfig,
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

  if (form.nestedForms && Object.keys(form.nestedForms).length > 0) {
    console.log(`${prefix}   📁 Nested Forms:`);
    for (const nestedForm of Object.values(form.nestedForms)) {
      printFormSummary(nestedForm, indent + 2);
    }
  }
}

function main(): void {
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('🔍 Healthcheck Form Structure Discovery');
  console.log('   Documented from F5 XC Console browser automation');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  printFormSummary(healthcheckForm);

  const totalFields = countFields(healthcheckForm);
  console.log('\n───────────────────────────────────────────────────────────────────────────');
  console.log(`📊 Total Fields Discovered: ${totalFields}`);
  console.log('───────────────────────────────────────────────────────────────────────────');

  console.log('\n🔀 Discriminator Fields:');
  console.log('   1. health_check → HTTP/TCP/ICMP nested config');
  console.log('   2. specify_host_header → Shows host_header_value field');

  console.log('\n📝 Key Insights:');
  console.log('   • Health Check dropdown controls which nested config appears');
  console.log('   • HTTP config has 7 fields including headers arrays');
  console.log('   • TCP config has 2 fields for payload matching');
  console.log('   • ICMP config has no additional fields');
  console.log('   • Advanced fields: jitter_percent, request_headers_to_remove');

  console.log('\n✅ Discovery Complete!');
}

main();
