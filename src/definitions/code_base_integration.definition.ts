// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Code Base Integration Resource Definition
 *
 * Declarative definition for F5 XC Code Base Integration resource.
 * Used by PropertyBuilder to generate JSON Schema with tooltips,
 * defaults, and nested configurations.
 *
 * Data captured from live F5 XC Console via Chrome DevTools MCP (2026-01-25)
 */

import { ResourceDefinition } from '../extractors/resource-definition';
import {
  API_SECURITY_METADATA_FIELDS,
  API_SECURITY_METADATA_TOOLTIPS,
} from './shared/api-security-common';

/**
 * Code Base Integration types available in F5 XC
 */
export const CODE_BASE_INTEGRATION_TYPES = [
  'GitHub Integration',
  'GitHub Enterprise Integration',
  'GitLab Cloud Integration',
  'GitLab Enterprise Integration',
  'BitBucket Cloud Integration',
  'BitBucket Server Integration',
  'Azure Repos Integration',
] as const;

/**
 * Secret types for credential configuration
 */
export const SECRET_TYPES = ['Blindfolded Secret', 'Clear Secret'] as const;

/**
 * Code Base Integration resource definition
 */
export const codeBaseIntegrationDefinition: ResourceDefinition = {
  resourceType: 'code_base_integration',
  title: 'F5 XC Code Base Integration Configuration',
  description:
    'JSON Schema for F5 Distributed Cloud Code Base Integration resource with UI tooltips, defaults, and nested configurations',
  version: '1.0.0',
  formUrl:
    'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/api_security/code_base_integration',

  // Top-level fields
  fields: [
    ...API_SECURITY_METADATA_FIELDS,
    {
      name: 'code_base',
      label: 'Code Base',
      infoIconSelector: 'label:has(generic:text("Code Base")) button',
      inputSelector: 'listbox[name="Code Base"]',
      type: 'string',
      required: true,
      advanced: false,
      defaultValue: 'GitHub Integration',
      enum: [...CODE_BASE_INTEGRATION_TYPES],
      apiProperty: 'spec.code_base_type',
      apiNote:
        'Discriminator field that determines which integration-specific fields are required',
      enumDescriptions: {
        'GitHub Integration': 'Connect to GitHub.com repositories',
        'GitHub Enterprise Integration':
          'Connect to GitHub Enterprise Server on-premises',
        'GitLab Cloud Integration': 'Connect to GitLab.com repositories',
        'GitLab Enterprise Integration':
          'Connect to self-hosted GitLab Enterprise',
        'BitBucket Cloud Integration':
          'Connect to Atlassian BitBucket Cloud repositories',
        'BitBucket Server Integration':
          'Connect to self-hosted BitBucket Server (formerly Stash)',
        'Azure Repos Integration':
          'Connect to Azure DevOps Repos (formerly VSTS)',
      },
    },
    // GitHub Integration fields
    {
      name: 'github_username',
      label: 'GitHub Username',
      infoIconSelector: 'label:has(generic:text("GitHub Username")) button',
      inputSelector: 'textbox[name="GitHub Username"]',
      type: 'string',
      required: true,
      advanced: false,
      apiProperty: 'spec.github.username',
      apiNote: 'GitHub account username for authentication',
      conditionalOn: { field: 'code_base', value: 'GitHub Integration' },
    },
    {
      name: 'github_verify_ssl',
      label: 'GitHub Verify SSL',
      infoIconSelector: 'label:has(generic:text("GitHub Verify SSL")) button',
      inputSelector: 'checkbox[name="GitHub Verify SSL"]',
      type: 'boolean',
      required: false,
      advanced: false,
      defaultValue: true,
      apiProperty: 'spec.github.verify_ssl',
      apiNote: 'Enable SSL certificate verification for GitHub API connections',
      conditionalOn: { field: 'code_base', value: 'GitHub Integration' },
    },
    // GitHub Enterprise Integration fields
    {
      name: 'github_enterprise_hostname',
      label: 'GitHub Hostname',
      infoIconSelector: 'label:has(generic:text("GitHub Hostname")) button',
      inputSelector: 'textbox[name="GitHub Hostname"]',
      type: 'string',
      required: true,
      advanced: false,
      apiProperty: 'spec.github_enterprise.hostname',
      apiNote:
        'Hostname of GitHub Enterprise Server (e.g., github.mycompany.com)',
      conditionalOn: {
        field: 'code_base',
        value: 'GitHub Enterprise Integration',
      },
    },
    {
      name: 'github_enterprise_username',
      label: 'GitHub Username',
      infoIconSelector: 'label:has(generic:text("GitHub Username")) button',
      inputSelector: 'textbox[name="GitHub Username"]',
      type: 'string',
      required: true,
      advanced: false,
      apiProperty: 'spec.github_enterprise.username',
      apiNote: 'GitHub Enterprise account username for authentication',
      conditionalOn: {
        field: 'code_base',
        value: 'GitHub Enterprise Integration',
      },
    },
    // GitLab Enterprise Integration fields
    {
      name: 'gitlab_enterprise_url',
      label: 'GitLab URL',
      infoIconSelector: 'label:has(generic:text("GitLab URL")) button',
      inputSelector: 'textbox[name="GitLab URL"]',
      type: 'string',
      required: true,
      advanced: false,
      apiProperty: 'spec.gitlab_enterprise.url',
      apiNote:
        'Full URL to GitLab Enterprise instance (e.g., https://gitlab.mycompany.com)',
      conditionalOn: {
        field: 'code_base',
        value: 'GitLab Enterprise Integration',
      },
    },
    // BitBucket Cloud Integration fields
    {
      name: 'bitbucket_username',
      label: 'BitBucket Username',
      infoIconSelector: 'label:has(generic:text("BitBucket Username")) button',
      inputSelector: 'textbox[name="BitBucket Username"]',
      type: 'string',
      required: true,
      advanced: false,
      apiProperty: 'spec.bitbucket_cloud.username',
      apiNote: 'BitBucket Cloud account username for authentication',
      conditionalOn: { field: 'code_base', value: 'BitBucket Cloud Integration' },
    },
    // BitBucket Server Integration fields
    {
      name: 'bitbucket_server_url',
      label: 'BitBucket Server URL',
      infoIconSelector:
        'label:has(generic:text("BitBucket Server URL")) button',
      inputSelector: 'textbox[name="BitBucket Server URL"]',
      type: 'string',
      required: true,
      advanced: false,
      apiProperty: 'spec.bitbucket_server.url',
      apiNote:
        'Full URL to BitBucket Server instance (e.g., https://bitbucket.mycompany.com)',
      conditionalOn: {
        field: 'code_base',
        value: 'BitBucket Server Integration',
      },
    },
    {
      name: 'bitbucket_server_username',
      label: 'BitBucket Server Username',
      infoIconSelector:
        'label:has(generic:text("BitBucket Server Username")) button',
      inputSelector: 'textbox[name="BitBucket Server Username"]',
      type: 'string',
      required: true,
      advanced: false,
      apiProperty: 'spec.bitbucket_server.username',
      apiNote: 'BitBucket Server account username for authentication',
      conditionalOn: {
        field: 'code_base',
        value: 'BitBucket Server Integration',
      },
    },
    {
      name: 'bitbucket_server_verify_ssl',
      label: 'Verify SSL',
      infoIconSelector: 'label:has(generic:text("Verify SSL")) button',
      inputSelector: 'checkbox[name="Verify SSL"]',
      type: 'boolean',
      required: false,
      advanced: false,
      defaultValue: true,
      apiProperty: 'spec.bitbucket_server.verify_ssl',
      apiNote:
        'Enable SSL certificate verification for BitBucket Server API connections',
      conditionalOn: {
        field: 'code_base',
        value: 'BitBucket Server Integration',
      },
    },
  ],

  // Nested configurations for secrets/passwords
  nestedConfigs: [
    // GitHub Personal Access Token
    {
      name: 'github_personal_access_token',
      trigger: 'github_personal_access_token',
      triggerValue: 'configured',
      apiBlock: 'spec.github.access_token',
      apiNote:
        'API: spec.github.access_token containing blindfold or clear secret',
      description:
        'Configure the GitHub Personal Access Token for API authentication. Supports blindfolded (encrypted) or clear text secrets.',
      conditionalOn: { field: 'code_base', value: 'GitHub Integration' },
      actionSelectors: {
        edit: 'link:text("Configure")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'secret_type',
          label: 'Secret Type',
          infoIconSelector: 'link:text("Secret Type")',
          inputSelector: 'listbox[name="Secret Type"]',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Blindfolded Secret',
          enum: [...SECRET_TYPES],
          enumDescriptions: {
            'Blindfolded Secret':
              'Secret encrypted using F5 XC Blindfold technology',
            'Clear Secret': 'Secret that is not encrypted (stored in plain text)',
          },
        },
        {
          name: 'action',
          label: 'Action',
          inputSelector: 'listbox[name="Action"]',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Blindfold New Secret',
          enum: ['Blindfold New Secret'],
          conditionalOn: { field: 'secret_type', value: 'Blindfolded Secret' },
        },
        {
          name: 'policy_type',
          label: 'Policy Type',
          inputSelector: 'listbox[name="Policy Type"]',
          type: 'string',
          required: false,
          advanced: false,
          defaultValue: 'Built-in',
          enum: ['Built-in'],
          conditionalOn: { field: 'secret_type', value: 'Blindfolded Secret' },
        },
        {
          name: 'secret_to_blindfold',
          label: 'Secret to Blindfold',
          inputSelector: 'textbox[name="Secret to Blindfold"]',
          type: 'string',
          required: true,
          advanced: false,
          apiProperty: 'spec.github.access_token.blindfold_secret_info.location',
          conditionalOn: { field: 'secret_type', value: 'Blindfolded Secret' },
        },
        {
          name: 'clear_secret_value',
          label: 'Secret Value',
          inputSelector: 'textbox[name="Secret Value"]',
          type: 'string',
          required: true,
          advanced: false,
          apiProperty: 'spec.github.access_token.clear_secret_info.value',
          conditionalOn: { field: 'secret_type', value: 'Clear Secret' },
        },
      ],
    },
    // GitHub Enterprise Personal Access Token
    {
      name: 'github_enterprise_personal_access_token',
      trigger: 'github_enterprise_personal_access_token',
      triggerValue: 'configured',
      apiBlock: 'spec.github_enterprise.access_token',
      apiNote:
        'API: spec.github_enterprise.access_token containing blindfold or clear secret',
      description:
        'Configure the GitHub Enterprise Personal Access Token for API authentication.',
      conditionalOn: {
        field: 'code_base',
        value: 'GitHub Enterprise Integration',
      },
      actionSelectors: {
        edit: 'link:text("Configure")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'secret_type',
          label: 'Secret Type',
          inputSelector: 'listbox[name="Secret Type"]',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Blindfolded Secret',
          enum: [...SECRET_TYPES],
        },
        {
          name: 'secret_to_blindfold',
          label: 'Secret to Blindfold',
          inputSelector: 'textbox[name="Secret to Blindfold"]',
          type: 'string',
          required: true,
          advanced: false,
          conditionalOn: { field: 'secret_type', value: 'Blindfolded Secret' },
        },
      ],
    },
    // GitLab Cloud Personal Access Token
    {
      name: 'gitlab_cloud_personal_access_token',
      trigger: 'gitlab_cloud_personal_access_token',
      triggerValue: 'configured',
      apiBlock: 'spec.gitlab_cloud.access_token',
      apiNote:
        'API: spec.gitlab_cloud.access_token containing blindfold or clear secret',
      description:
        'Configure the GitLab Cloud Personal Access Token for API authentication.',
      conditionalOn: { field: 'code_base', value: 'GitLab Cloud Integration' },
      actionSelectors: {
        edit: 'link:text("Configure")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'secret_type',
          label: 'Secret Type',
          inputSelector: 'listbox[name="Secret Type"]',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Blindfolded Secret',
          enum: [...SECRET_TYPES],
        },
        {
          name: 'secret_to_blindfold',
          label: 'Secret to Blindfold',
          inputSelector: 'textbox[name="Secret to Blindfold"]',
          type: 'string',
          required: true,
          advanced: false,
          conditionalOn: { field: 'secret_type', value: 'Blindfolded Secret' },
        },
      ],
    },
    // GitLab Enterprise Personal Access Token
    {
      name: 'gitlab_enterprise_personal_access_token',
      trigger: 'gitlab_enterprise_personal_access_token',
      triggerValue: 'configured',
      apiBlock: 'spec.gitlab_enterprise.access_token',
      apiNote:
        'API: spec.gitlab_enterprise.access_token containing blindfold or clear secret',
      description:
        'Configure the GitLab Enterprise Personal Access Token for API authentication.',
      conditionalOn: {
        field: 'code_base',
        value: 'GitLab Enterprise Integration',
      },
      actionSelectors: {
        edit: 'link:text("Configure")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'secret_type',
          label: 'Secret Type',
          inputSelector: 'listbox[name="Secret Type"]',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Blindfolded Secret',
          enum: [...SECRET_TYPES],
        },
        {
          name: 'secret_to_blindfold',
          label: 'Secret to Blindfold',
          inputSelector: 'textbox[name="Secret to Blindfold"]',
          type: 'string',
          required: true,
          advanced: false,
          conditionalOn: { field: 'secret_type', value: 'Blindfolded Secret' },
        },
      ],
    },
    // BitBucket Cloud Password
    {
      name: 'bitbucket_password',
      trigger: 'bitbucket_password',
      triggerValue: 'configured',
      apiBlock: 'spec.bitbucket_cloud.password',
      apiNote:
        'API: spec.bitbucket_cloud.password containing blindfold or clear secret',
      description:
        'Configure the BitBucket Cloud App Password for API authentication.',
      conditionalOn: { field: 'code_base', value: 'BitBucket Cloud Integration' },
      actionSelectors: {
        edit: 'link:text("Configure")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'secret_type',
          label: 'Secret Type',
          inputSelector: 'listbox[name="Secret Type"]',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Blindfolded Secret',
          enum: [...SECRET_TYPES],
        },
        {
          name: 'secret_to_blindfold',
          label: 'Secret to Blindfold',
          inputSelector: 'textbox[name="Secret to Blindfold"]',
          type: 'string',
          required: true,
          advanced: false,
          conditionalOn: { field: 'secret_type', value: 'Blindfolded Secret' },
        },
      ],
    },
    // BitBucket Server Password
    {
      name: 'bitbucket_server_password',
      trigger: 'bitbucket_server_password',
      triggerValue: 'configured',
      apiBlock: 'spec.bitbucket_server.password',
      apiNote:
        'API: spec.bitbucket_server.password containing blindfold or clear secret',
      description:
        'Configure the BitBucket Server Password for API authentication.',
      conditionalOn: {
        field: 'code_base',
        value: 'BitBucket Server Integration',
      },
      actionSelectors: {
        edit: 'link:text("Configure")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'secret_type',
          label: 'Secret Type',
          inputSelector: 'listbox[name="Secret Type"]',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Blindfolded Secret',
          enum: [...SECRET_TYPES],
        },
        {
          name: 'action',
          label: 'Action',
          inputSelector: 'listbox[name="Action"]',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Blindfold New Secret',
          enum: ['Blindfold New Secret'],
          conditionalOn: { field: 'secret_type', value: 'Blindfolded Secret' },
        },
        {
          name: 'policy_type',
          label: 'Policy Type',
          inputSelector: 'listbox[name="Policy Type"]',
          type: 'string',
          required: false,
          advanced: false,
          defaultValue: 'Built-in',
          enum: ['Built-in'],
          conditionalOn: { field: 'secret_type', value: 'Blindfolded Secret' },
        },
        {
          name: 'secret_to_blindfold',
          label: 'Secret to Blindfold',
          inputSelector: 'textbox[name="Secret to Blindfold"]',
          type: 'string',
          required: true,
          advanced: false,
          conditionalOn: { field: 'secret_type', value: 'Blindfolded Secret' },
        },
      ],
    },
    // Azure Repos Personal Access Token
    {
      name: 'azure_repos_personal_access_token',
      trigger: 'azure_repos_personal_access_token',
      triggerValue: 'configured',
      apiBlock: 'spec.azure_repos.access_token',
      apiNote:
        'API: spec.azure_repos.access_token containing blindfold or clear secret',
      description:
        'Configure the Azure Repos Personal Access Token for API authentication.',
      conditionalOn: { field: 'code_base', value: 'Azure Repos Integration' },
      actionSelectors: {
        edit: 'link:text("Configure")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'secret_type',
          label: 'Secret Type',
          inputSelector: 'listbox[name="Secret Type"]',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Blindfolded Secret',
          enum: [...SECRET_TYPES],
        },
        {
          name: 'secret_to_blindfold',
          label: 'Secret to Blindfold',
          inputSelector: 'textbox[name="Secret to Blindfold"]',
          type: 'string',
          required: true,
          advanced: false,
          conditionalOn: { field: 'secret_type', value: 'Blindfolded Secret' },
        },
      ],
    },
  ],

  // Section-level tooltips
  sectionTooltips: {
    metadata:
      'Common attributes that can be set during create for all configuration objects like name, labels etc.',
    integration_data:
      'Configure the code repository integration type and credentials for connecting to source control systems.',
    secret_configuration:
      'Configure authentication credentials using encrypted (blindfolded) or plain text secrets.',
  },

  // Tooltip data captured from F5 XC Console
  tooltipData: {
    ...API_SECURITY_METADATA_TOOLTIPS,
    code_base:
      'Select the type of code repository integration. Each type has specific fields for authentication and connection settings.',
    github_username:
      'GitHub account username used for API authentication. Requires a Personal Access Token with appropriate repository permissions.',
    github_verify_ssl:
      'Enable SSL certificate verification when connecting to GitHub API. Disable only for testing with self-signed certificates.',
    github_enterprise_hostname:
      'Hostname of your GitHub Enterprise Server instance (e.g., github.mycompany.com). Do not include protocol or trailing slash.',
    gitlab_enterprise_url:
      'Full URL to your GitLab Enterprise instance including protocol (e.g., https://gitlab.mycompany.com).',
    bitbucket_username:
      'BitBucket Cloud account username. Use with an App Password (not your account password).',
    bitbucket_server_url:
      'Full URL to your BitBucket Server instance including protocol (e.g., https://bitbucket.mycompany.com).',
    bitbucket_server_username:
      'BitBucket Server account username for API authentication.',
    bitbucket_server_verify_ssl:
      'Enable SSL certificate verification when connecting to BitBucket Server. Disable only for testing with self-signed certificates.',
    secret_type:
      'Choose how to store the secret: Blindfolded Secret encrypts using F5 XC technology, Clear Secret stores as plain text.',
    secret_to_blindfold:
      'Enter the secret value (e.g., Personal Access Token) to be encrypted using F5 XC Blindfold technology.',
  },

  // Enum descriptions for UI mapping
  enumDescriptions: {
    code_base: {
      'GitHub Integration': 'Connect to GitHub.com repositories',
      'GitHub Enterprise Integration':
        'Connect to GitHub Enterprise Server on-premises',
      'GitLab Cloud Integration': 'Connect to GitLab.com repositories',
      'GitLab Enterprise Integration':
        'Connect to self-hosted GitLab Enterprise',
      'BitBucket Cloud Integration':
        'Connect to Atlassian BitBucket Cloud repositories',
      'BitBucket Server Integration':
        'Connect to self-hosted BitBucket Server (formerly Stash)',
      'Azure Repos Integration':
        'Connect to Azure DevOps Repos (formerly VSTS)',
    },
    secret_type: {
      'Blindfolded Secret':
        'Secret encrypted using F5 XC Blindfold technology',
      'Clear Secret': 'Secret that is not encrypted (stored in plain text)',
    },
  },
};
