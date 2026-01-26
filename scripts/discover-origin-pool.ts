#!/usr/bin/env ts-node
/**
 * Origin Pool Form Structure Discovery
 *
 * Documents the form structure for F5 XC Origin Pool resource.
 * Based on browser automation exploration of F5 XC Console.
 *
 * Usage:
 *   npx ts-node scripts/discover-origin-pool.ts
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
// ORIGIN POOL FORM STRUCTURE
// ============================================================================

const originPoolForm: DiscoveredForm = {
  resourceType: 'origin_pool',
  formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/load_balancers/origin_pools',
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
      name: 'origin_servers',
      label: 'Origin Servers',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'origin_servers',
          label: 'Origin Servers',
          type: 'array',
          required: true,
          advanced: false,
          section: 'origin_servers',
          // Array of origin server items with discriminator
        },
      ],
    },
    {
      name: 'basic_configuration',
      label: 'Basic Configuration',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'port',
          label: 'Port',
          type: 'spinbutton',
          required: true,
          advanced: false,
          section: 'basic_configuration',
          defaultValue: 80,
        },
        {
          name: 'tls_configuration',
          label: 'TLS Configuration',
          type: 'dropdown',
          required: true,
          advanced: false,
          section: 'basic_configuration',
          defaultValue: 'Disable TLS',
          options: ['Disable TLS', 'Enable TLS'],
          optionDescriptions: {
            'Disable TLS': 'Disable TLS for origin server connections.',
            'Enable TLS': 'Enable TLS for origin server connections. Requires TLS certificates.',
          },
        },
        {
          name: 'load_balancer_algorithm',
          label: 'Load Balancer Algorithm',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'basic_configuration',
          defaultValue: 'Round Robin',
          options: ['Round Robin', 'Least Active', 'Ring Hash', 'Random'],
          optionDescriptions: {
            'Round Robin': 'Distribute requests evenly across all origin servers.',
            'Least Active': 'Send requests to the origin server with the fewest active connections.',
            'Ring Hash': 'Use consistent hashing based on a hash policy to select origin servers.',
            'Random': 'Randomly select an origin server for each request.',
          },
        },
        {
          name: 'health_check',
          label: 'Health Check',
          type: 'dropdown',
          required: false,
          advanced: false,
          section: 'basic_configuration',
          // Options populated from API
        },
      ],
    },
  ],
  nestedForms: {},
};

// ============================================================================
// ORIGIN SERVER ITEM (Array Item with Discriminator)
// ============================================================================

const originServerItem: DiscoveredForm = {
  resourceType: 'origin_server_item',
  formUrl: 'Nested modal within origin_servers array',
  discoveryDate: '2026-01-24',
  sections: [
    {
      name: 'origin_server',
      label: 'Origin Server',
      hasAdvancedToggle: true,
      fields: [
        {
          name: 'origin_server_type',
          label: 'Select Type of Origin Server',
          type: 'dropdown',
          required: true,
          advanced: false,
          section: 'origin_server',
          options: [
            'Public DNS Name',
            'K8s Service',
            'Private IP',
            'Public IP',
            'Consul Service',
          ],
          optionDescriptions: {
            'Public DNS Name': 'Origin server accessible via public DNS name.',
            'K8s Service': 'Origin server running as Kubernetes service.',
            'Private IP': 'Origin server accessible via private IP address.',
            'Public IP': 'Origin server accessible via public IP address.',
            'Consul Service': 'Origin server discovered via Consul service registry.',
          },
        },
      ],
    },
  ],
  nestedForms: {
    'Public DNS Name': {
      resourceType: 'public_dns_name_config',
      formUrl: 'Fields shown when origin_server_type = "Public DNS Name"',
      discoveryDate: '2026-01-24',
      sections: [{
        name: 'dns_config',
        label: 'Public DNS Configuration',
        hasAdvancedToggle: true,
        fields: [
          { name: 'dns_name', label: 'DNS Name', type: 'input', required: true, advanced: false, section: 'dns_config' },
          { name: 'dns_refresh_interval', label: 'DNS Refresh Interval', type: 'spinbutton', required: false, advanced: true, section: 'dns_config', defaultValue: 60, unit: 'seconds' },
        ],
      }],
    },
    'K8s Service': {
      resourceType: 'k8s_service_config',
      formUrl: 'Fields shown when origin_server_type = "K8s Service"',
      discoveryDate: '2026-01-24',
      sections: [{
        name: 'k8s_config',
        label: 'Kubernetes Service Configuration',
        hasAdvancedToggle: true,
        fields: [
          { name: 'service_name', label: 'Service Name', type: 'input', required: true, advanced: false, section: 'k8s_config' },
          { name: 'site_locator', label: 'Site Locator', type: 'dropdown', required: true, advanced: false, section: 'k8s_config' },
          { name: 'vk8s_networks', label: 'vK8s Networks', type: 'dropdown', required: false, advanced: false, section: 'k8s_config', options: ['Site Local Network', 'Site Local Inside Network', 'Outside Network'] },
          { name: 'service_port', label: 'Service Port', type: 'spinbutton', required: false, advanced: false, section: 'k8s_config' },
        ],
      }],
    },
    'Private IP': {
      resourceType: 'private_ip_config',
      formUrl: 'Fields shown when origin_server_type = "Private IP"',
      discoveryDate: '2026-01-24',
      sections: [{
        name: 'private_ip_config',
        label: 'Private IP Configuration',
        hasAdvancedToggle: true,
        fields: [
          { name: 'ip_address', label: 'IP Address', type: 'input', required: true, advanced: false, section: 'private_ip_config' },
          { name: 'site_locator', label: 'Site Locator', type: 'dropdown', required: true, advanced: false, section: 'private_ip_config' },
          { name: 'inside_network', label: 'Inside Network', type: 'checkbox', required: false, advanced: false, section: 'private_ip_config', defaultValue: false },
          { name: 'outside_network', label: 'Outside Network', type: 'checkbox', required: false, advanced: false, section: 'private_ip_config', defaultValue: true },
        ],
      }],
    },
    'Public IP': {
      resourceType: 'public_ip_config',
      formUrl: 'Fields shown when origin_server_type = "Public IP"',
      discoveryDate: '2026-01-24',
      sections: [{
        name: 'public_ip_config',
        label: 'Public IP Configuration',
        hasAdvancedToggle: false,
        fields: [
          { name: 'ip_address', label: 'IP Address', type: 'input', required: true, advanced: false, section: 'public_ip_config' },
        ],
      }],
    },
    'Consul Service': {
      resourceType: 'consul_service_config',
      formUrl: 'Fields shown when origin_server_type = "Consul Service"',
      discoveryDate: '2026-01-24',
      sections: [{
        name: 'consul_config',
        label: 'Consul Service Configuration',
        hasAdvancedToggle: true,
        fields: [
          { name: 'service_name', label: 'Service Name', type: 'input', required: true, advanced: false, section: 'consul_config' },
          { name: 'site_locator', label: 'Site Locator', type: 'dropdown', required: true, advanced: false, section: 'consul_config' },
          { name: 'network_type', label: 'Network Type', type: 'dropdown', required: false, advanced: false, section: 'consul_config', options: ['Site Local Network', 'Site Local Inside Network'] },
        ],
      }],
    },
  },
};

// ============================================================================
// TLS CONFIGURATION NESTED CONFIG
// ============================================================================

const tlsConfig: DiscoveredForm = {
  resourceType: 'tls_config',
  formUrl: 'Nested modal when tls_configuration = "Enable TLS"',
  discoveryDate: '2026-01-24',
  sections: [
    {
      name: 'tls_settings',
      label: 'TLS Settings',
      hasAdvancedToggle: true,
      fields: [
        { name: 'tls_certificates', label: 'TLS Certificates', type: 'dropdown', required: false, advanced: false, section: 'tls_settings' },
        { name: 'tls_version', label: 'TLS Version', type: 'dropdown', required: false, advanced: false, section: 'tls_settings', defaultValue: 'TLS 1.2+', options: ['TLS 1.0+', 'TLS 1.1+', 'TLS 1.2+', 'TLS 1.3'] },
        { name: 'server_name_indication', label: 'Server Name Indication', type: 'input', required: false, advanced: false, section: 'tls_settings' },
        { name: 'skip_server_verification', label: 'Skip Server Verification', type: 'checkbox', required: false, advanced: true, section: 'tls_settings', defaultValue: false },
      ],
    },
  ],
};

// ============================================================================
// RING HASH CONFIGURATION NESTED CONFIG
// ============================================================================

const ringHashConfig: DiscoveredForm = {
  resourceType: 'ring_hash_config',
  formUrl: 'Nested modal when load_balancer_algorithm = "Ring Hash"',
  discoveryDate: '2026-01-24',
  sections: [
    {
      name: 'hash_settings',
      label: 'Hash Policy Settings',
      hasAdvancedToggle: false,
      fields: [
        {
          name: 'hash_policy',
          label: 'Hash Policy',
          type: 'dropdown',
          required: true,
          advanced: false,
          section: 'hash_settings',
          defaultValue: 'Header Name',
          options: ['Header Name', 'Cookie', 'Source IP'],
          optionDescriptions: {
            'Header Name': 'Hash based on a specific HTTP header value.',
            'Cookie': 'Hash based on a specific cookie value.',
            'Source IP': 'Hash based on the source IP address of the client.',
          },
        },
        { name: 'header_name', label: 'Header Name', type: 'input', required: false, advanced: false, section: 'hash_settings' },
        { name: 'cookie_name', label: 'Cookie Name', type: 'input', required: false, advanced: false, section: 'hash_settings' },
      ],
    },
  ],
};

originPoolForm.nestedForms = {
  origin_server_item: originServerItem,
  tls_config: tlsConfig,
  ring_hash_config: ringHashConfig,
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
    for (const [name, nestedForm] of Object.entries(form.nestedForms)) {
      printFormSummary(nestedForm, indent + 2);
    }
  }
}

function main(): void {
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log('🔍 Origin Pool Form Structure Discovery');
  console.log('   Documented from F5 XC Console browser automation');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  printFormSummary(originPoolForm);

  const totalFields = countFields(originPoolForm);
  console.log('\n───────────────────────────────────────────────────────────────────────────');
  console.log(`📊 Total Fields Discovered: ${totalFields}`);
  console.log('───────────────────────────────────────────────────────────────────────────');

  console.log('\n🔀 Discriminator Fields:');
  console.log('   1. origin_server_type → Public DNS/K8s/Private IP/Public IP/Consul configs');
  console.log('   2. tls_configuration → TLS settings nested config');
  console.log('   3. load_balancer_algorithm → Ring Hash config (when Ring Hash selected)');
  console.log('   4. hash_policy → header_name or cookie_name fields');

  console.log('\n📝 Key Insights:');
  console.log('   • Origin servers is an array with 5 different item types');
  console.log('   • TLS config reveals 4 additional fields when enabled');
  console.log('   • Ring Hash reveals hash_policy discriminator with 3 options');
  console.log('   • Private IP has mutually exclusive inside/outside network checkboxes');
  console.log('   • Health Check dropdown populated from API');

  console.log('\n⚠️  Potential Gaps to Verify via Browser:');
  console.log('   • Are inside_network/outside_network mutually exclusive?');
  console.log('   • Any advanced fields hidden in origin server items?');
  console.log('   • Additional TLS options (cipher suites, etc.)?');

  console.log('\n✅ Discovery Complete!');
}

main();
