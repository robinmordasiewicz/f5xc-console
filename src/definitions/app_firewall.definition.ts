// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * App Firewall Resource Definition
 *
 * Declarative definition for F5 XC App Firewall (WAF) resource.
 * Used by PropertyBuilder to generate JSON Schema with tooltips,
 * defaults, and nested configurations.
 *
 * Data captured from live F5 XC Console via Claude in Chrome MCP (2026-01-24)
 * Version 2.3.0 - Validated against official F5 XC API spec (f5xc-api-specs-v2.0.46):
 * - API enum values: AI_BLOCK/AI_REPORT for risk actions, BLOCK/REPORT/IGNORE for bot actions
 * - Field names match API: high_risk_action, medium_risk_action, low_risk_action
 * - blocking_page max size: 4096 bytes (per API spec)
 * - Added apiProperty mappings for all fields to match F5 XC API field names
 *
 * API Spec Source: https://github.com/robinmordasiewicz/f5xc-api-enriched/releases
 *
 * API OneOf Field Groups (mutually exclusive):
 * - enforcement_mode_choice: [blocking, monitoring]
 * - detection_setting_choice: [ai_risk_based_blocking, default_detection_settings, detection_settings]
 * - blocking_page_choice: [blocking_page, use_default_blocking_page]
 * - allowed_response_codes_choice: [allow_all_response_codes, allowed_response_codes]
 * - anonymization_setting: [custom_anonymization, default_anonymization, disable_anonymization]
 * - bot_protection_choice: [bot_protection_setting, default_bot_setting]
 *
 * API Block Mapping:
 * - ai_risk_based_blocking → risk_based_blocking_config
 * - detection_settings → custom_security_policy_config
 * - blocking_page → custom_blocking_page_config
 * - bot_protection_setting → custom_bot_settings_config
 */

import { ResourceDefinition } from '../extractors/resource-definition';

/**
 * App Firewall resource definition
 */
export const appFirewallDefinition: ResourceDefinition = {
  resourceType: 'app_firewall',
  title: 'F5 XC App Firewall Configuration',
  description: 'JSON Schema for F5 Distributed Cloud App Firewall (WAF) resource with UI tooltips, defaults, and nested configurations',
  version: '2.4.0', // Updated: Live API verification (2026-01-25) - blocking_page accepts empty string but requires URL format (uri_ref)
  formUrl: 'https://f5-amer-ent.console.ves.volterra.io/web/workspaces/web-app-and-api-protection/namespaces/default/manage/app_firewall',

  // Top-level fields
  fields: [
    {
      name: 'name',
      label: 'Name',
      apiProperty: 'metadata.name',
      infoIconSelector: 'label:has(generic:text("Name")) button',
      inputSelector: 'textbox[name="Name"]',
      type: 'string',
      required: true,
      advanced: false,
      minLength: 1,
      maxLength: 63, // DNS-1035 label limit verified via live API (2026-01-25)
      pattern: '^[a-z][a-z0-9-]*[a-z0-9]$',
      patternDescription: 'Must start with lowercase letter, contain only lowercase letters, numbers, and hyphens, and end with letter or number',
    },
    {
      name: 'labels',
      label: 'Labels',
      apiProperty: 'metadata.labels',
      infoIconSelector: 'label:has(generic:text("Labels")) button',
      inputSelector: 'link:text("Add Label")',
      type: 'object',
      required: false,
      advanced: false,
      placeholder: 'Add Label',
    },
    {
      name: 'description',
      label: 'Description',
      apiProperty: 'metadata.description',
      infoIconSelector: 'label:has(generic:text("Description")) button',
      inputSelector: 'textbox[name="Description"]',
      type: 'string',
      required: false,
      advanced: false,
      maxLength: 256,
    },
    {
      name: 'enforcement_mode',
      label: 'Enforcement Mode',
      apiProperty: 'spec.monitoring|spec.blocking',
      apiNote: 'Maps to mutually exclusive booleans: monitoring=true or blocking=true',
      infoIconSelector: 'label:has(generic:text("Enforcement Mode")) button',
      inputSelector: 'listbox',
      type: 'string',
      required: true,
      advanced: false,
      defaultValue: 'Monitoring',
      enum: ['Monitoring', 'Blocking'],
      enumDescriptions: {
        Monitoring: 'Requests will be logged but not blocked (alert-only mode)',
        Blocking: 'Requests matching WAF rules will be blocked',
      },
    },
    {
      name: 'security_policy',
      label: 'Security Policy',
      apiProperty: 'spec.default_detection_settings|spec.ai_risk_based_blocking|spec.detection_settings',
      apiNote: 'Maps to: Default=default_detection_settings:true, Risk-Based=ai_risk_based_blocking block, Custom=detection_settings block',
      infoIconSelector: 'label:has(generic:text("Security Policy")) button',
      inputSelector: 'listbox',
      type: 'string',
      required: true,
      advanced: false,
      defaultValue: 'Default',
      enum: ['Default', 'Risk-Based Blocking (Powered by AI) - Preview', 'Custom'],
      enumDescriptions: {
        Default: 'Use default WAF security policy with recommended signatures and thresholds',
        'Risk-Based Blocking (Powered by AI) - Preview':
          'AI-powered risk assessment for intelligent blocking decisions (Preview feature)',
        Custom: 'Configure custom security policy including signature selection and attack type settings',
      },
    },
    {
      name: 'blocking_response_page',
      label: 'Blocking Response Page',
      apiProperty: 'spec.use_default_blocking_page|spec.blocking_page',
      apiNote: 'Maps to: Default=use_default_blocking_page:true, Custom=blocking_page block',
      infoIconSelector: 'label:has(generic:text("Blocking Response Page")) button',
      inputSelector: 'listbox',
      type: 'string',
      required: false,
      advanced: false,
      defaultValue: 'Default Blocking Page',
      enum: ['Default Blocking Page', 'Custom Blocking Page'],
      enumDescriptions: {
        'Default Blocking Page': 'Use the default F5 XC blocking page',
        'Custom Blocking Page': 'Configure a custom blocking page with custom HTML body',
      },
    },
    {
      name: 'bot_protection_setting',
      label: 'Bot Protection Setting',
      apiProperty: 'spec.detection_settings.default_bot_setting|spec.bot_protection_setting',
      apiNote: 'Maps to: Default=detection_settings.default_bot_setting:true, Custom=bot_protection_setting block (deprecated at top-level)',
      infoIconSelector: 'label:has(generic:text("Bot Protection")) button',
      inputSelector: 'listbox',
      type: 'string',
      required: false,
      advanced: true,
      defaultValue: 'Default Bot Settings',
      enum: ['Default Bot Settings', 'Custom Bot Settings'],
      enumDescriptions: {
        'Default Bot Settings': 'Use default bot protection settings',
        'Custom Bot Settings': 'Configure custom bot protection with JavaScript insertion and grace period',
      },
    },
    {
      name: 'allowed_response_status_codes',
      label: 'Allowed Response Status Codes',
      apiProperty: 'spec.allow_all_response_codes|spec.allowed_response_codes',
      apiNote: 'Maps to: Default=(neither), AllowAll=allow_all_response_codes:true, Custom=allowed_response_codes.response_code[]',
      infoIconSelector: 'label:has(generic:text("Allowed Response Status Codes")) button',
      inputSelector: 'listbox',
      type: 'string',
      required: false,
      advanced: false,
      defaultValue: 'Default Allowed Response Status Codes',
      enum: [
        'Default Allowed Response Status Codes',
        'Allow All Response Status Codes',
        'Custom Allowed Response Status Codes',
      ],
      enumDescriptions: {
        'Default Allowed Response Status Codes':
          'Allow standard HTTP success and redirect status codes (1xx, 2xx, 3xx)',
        'Allow All Response Status Codes':
          'Allow all HTTP response codes from origin server without inspection',
        'Custom Allowed Response Status Codes':
          'Configure a custom list of allowed response status codes',
      },
    },
    {
      name: 'mask_sensitive_parameters',
      label: 'Mask Sensitive Parameters in Logs',
      apiProperty: 'spec.default_anonymization|spec.disable_anonymization|spec.custom_anonymization',
      apiNote: 'Maps to: Default=default_anonymization:true, Disable=disable_anonymization:true, Custom=custom_anonymization block',
      infoIconSelector: 'label:has(generic:text("Mask Sensitive Parameters")) button',
      inputSelector: 'listbox',
      type: 'string',
      required: false,
      advanced: false,
      defaultValue: 'Default Masked Parameters',
      enum: ['Default Masked Parameters', 'Custom Masked Parameters', 'Disable Masking'],
      enumDescriptions: {
        'Default Masked Parameters':
          'Use default list of sensitive parameters to mask in logs (passwords, tokens, etc.)',
        'Custom Masked Parameters': 'Configure custom list of parameters to mask in logs',
        'Disable Masking': 'Disable masking of sensitive parameters (not recommended)',
      },
    },
    {
      name: 'default_anonymization',
      label: 'Default Anonymization',
      apiProperty: 'spec.default_anonymization',
      infoIconSelector: 'label:has(generic:text("Anonymization")) button',
      inputSelector: 'checkbox',
      type: 'boolean',
      required: false,
      advanced: true,
      defaultValue: true,
    },
  ],

  // Nested configurations
  nestedConfigs: [
    {
      name: 'risk_based_blocking_config',
      trigger: 'security_policy',
      triggerValue: 'Risk-Based Blocking (Powered by AI) - Preview',
      apiBlock: 'spec.ai_risk_based_blocking',
      description:
        'Configure AI-powered risk-based blocking with separate actions for high, medium, and low risk requests',
      actionSelectors: {
        edit: 'link:text("Edit Configuration")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'high_risk_action',
          label: 'High Risk',
          apiProperty: 'spec.ai_risk_based_blocking.high_risk_action',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'AI_BLOCK',
          enum: ['AI_BLOCK', 'AI_REPORT'],
          enumDescriptions: {
            AI_BLOCK: 'Block high-risk requests that AI determines are likely malicious',
            AI_REPORT: 'Log high-risk requests without blocking for monitoring and analysis',
          },
        },
        {
          name: 'medium_risk_action',
          label: 'Medium Risk',
          apiProperty: 'spec.ai_risk_based_blocking.medium_risk_action',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'AI_REPORT',
          enum: ['AI_BLOCK', 'AI_REPORT'],
          enumDescriptions: {
            AI_BLOCK: 'Block medium-risk requests for stricter security posture',
            AI_REPORT: 'Log medium-risk requests without blocking (recommended for tuning)',
          },
        },
        {
          name: 'low_risk_action',
          label: 'Low Risk',
          apiProperty: 'spec.ai_risk_based_blocking.low_risk_action',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'AI_REPORT',
          enum: ['AI_BLOCK', 'AI_REPORT'],
          enumDescriptions: {
            AI_BLOCK: 'Block all low-risk requests (most restrictive)',
            AI_REPORT: 'Log low-risk requests without blocking (recommended)',
          },
        },
      ],
    },
    {
      name: 'custom_security_policy_config',
      trigger: 'security_policy',
      triggerValue: 'Custom',
      apiBlock: 'spec.detection_settings',
      description:
        'Configure custom WAF security policy including attack signatures, signature selection, and automatic tuning',
      actionSelectors: {
        edit: 'link:text("Edit Configuration")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'attack_types',
          label: 'Attack Types',
          apiProperty: 'spec.detection_settings.signature_selection_setting.default_attack_type_settings|spec.detection_settings.signature_selection_setting.attack_type_settings',
          apiNote: 'Maps to: Default=default_attack_type_settings:true, Custom=attack_type_settings.disabled_attack_types[]',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Default',
          enum: ['Default', 'Custom'],
          enumDescriptions: {
            Default: 'Use default attack type detection covering all common attack categories',
            Custom: 'Configure custom list of attack types to detect or exclude',
          },
        },
        {
          name: 'signature_selection_by_accuracy',
          label: 'Signature Selection by Accuracy',
          apiProperty: 'spec.detection_settings.signature_selection_setting.only_high_accuracy_signatures|high_medium_accuracy_signatures|high_medium_low_accuracy_signatures',
          apiNote: 'Maps to mutually exclusive booleans: only_high_accuracy_signatures, high_medium_accuracy_signatures, or high_medium_low_accuracy_signatures',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'High and Medium',
          enum: ['High Accuracy Only', 'High and Medium', 'High, Medium, and Low'],
          enumDescriptions: {
            'High Accuracy Only': 'Only use high accuracy signatures (fewer false positives)',
            'High and Medium': 'Use high and medium accuracy signatures (balanced)',
            'High, Medium, and Low':
              'Use all signatures including low accuracy (maximum coverage, more false positives)',
          },
        },
        {
          name: 'automatic_attack_signatures_tuning',
          label: 'Automatic Attack Signatures Tuning',
          apiProperty: 'spec.detection_settings.enable_suppression|spec.detection_settings.disable_suppression',
          apiNote: 'Maps to: Enable=enable_suppression:true, Disable=disable_suppression:true',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Enable',
          enum: ['Enable', 'Disable'],
          enumDescriptions: {
            Enable: 'Automatically tune attack signatures based on traffic patterns and false positive analysis',
            Disable: 'Use static signature configuration without automatic tuning',
          },
        },
        {
          name: 'attack_signatures_staging',
          label: 'Attack Signatures Staging',
          apiProperty: 'spec.detection_settings.disable_staging|spec.detection_settings.stage_new_signatures|stage_new_and_updated_signatures',
          apiNote: 'Maps to: Disable=disable_staging:true, Enable=stage_new_signatures or stage_new_and_updated_signatures block with staging_period',
          type: 'string',
          required: false,
          advanced: false,
          defaultValue: 'Disable',
          enum: ['Disable', 'Enable'],
          enumDescriptions: {
            Disable: 'Enforce new attack signatures immediately without staging period',
            Enable: 'Stage new attack signatures before enforcement to reduce false positives',
          },
        },
        {
          name: 'threat_campaigns',
          label: 'Threat Campaigns',
          apiProperty: 'spec.detection_settings.enable_threat_campaigns|spec.detection_settings.disable_threat_campaigns',
          apiNote: 'Maps to: Enable=enable_threat_campaigns:true, Disable=disable_threat_campaigns:true',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Enable',
          enum: ['Enable', 'Disable'],
          enumDescriptions: {
            Enable: 'Enable detection of known threat campaigns based on F5 threat intelligence',
            Disable: 'Disable threat campaign detection',
          },
        },
        {
          name: 'violations',
          label: 'Violations',
          apiProperty: 'spec.detection_settings.default_violation_settings|spec.detection_settings.violation_settings',
          apiNote: 'Maps to: Default=default_violation_settings:true, Custom=violation_settings.disabled_violation_types[]',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Default',
          enum: ['Default', 'Custom'],
          enumDescriptions: {
            Default: 'Use default violation detection settings covering all common violations',
            Custom: 'Configure custom violation types and thresholds',
          },
        },
        {
          name: 'signature_based_bot_protection',
          label: 'Signature-Based Bot Protection',
          apiProperty: 'spec.detection_settings.default_bot_setting|spec.detection_settings.bot_protection_setting',
          apiNote: 'Maps to: Default=default_bot_setting:true, Custom=bot_protection_setting block with good/malicious/suspicious_bot_action',
          type: 'string',
          required: true,
          advanced: false,
          defaultValue: 'Default',
          enum: ['Default', 'Custom'],
          enumDescriptions: {
            Default: 'Use default signature-based bot protection settings',
            Custom: 'Configure custom signature-based bot protection rules',
          },
        },
      ],
    },
    {
      name: 'custom_blocking_page_config',
      trigger: 'blocking_response_page',
      triggerValue: 'Custom Blocking Page',
      apiBlock: 'spec.blocking_page',
      description: 'Configure custom blocking page HTML content',
      actionSelectors: {
        edit: 'link:text("Edit Configuration")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'blocking_page',
          label: 'Blocking Response Page Body',
          apiProperty: 'spec.blocking_page.blocking_page',
          apiNote: 'Live API verification (2026-01-25): Empty string accepted, but field requires URL format (uri_ref constraint). Must be a valid URL like "http://example.com/error.html".',
          type: 'string',
          required: false,
          advanced: false,
          placeholder: 'Enter URL for blocking page (e.g., http://example.com/error.html)',
          minLength: 0, // API accepts empty string
          maxLength: 4096,
          format: 'uri', // API enforces uri_ref constraint
        },
        {
          name: 'response_code',
          label: 'Response Code',
          apiProperty: 'spec.blocking_page.response_code',
          type: 'string',
          required: false,
          advanced: false,
          defaultValue: 'Forbidden',
          enum: ['Forbidden', 'Not Found', 'Unauthorized', 'Service Unavailable', 'OK'],
          enumDescriptions: {
            'Forbidden': 'HTTP 403 Forbidden',
            'Not Found': 'HTTP 404 Not Found',
            'Unauthorized': 'HTTP 401 Unauthorized',
            'Service Unavailable': 'HTTP 503 Service Unavailable',
            'OK': 'HTTP 200 OK',
          },
        },
      ],
    },
    {
      name: 'custom_bot_settings_config',
      trigger: 'bot_protection_setting',
      triggerValue: 'Custom Bot Settings',
      apiBlock: 'spec.detection_settings.bot_protection_setting',
      apiNote: 'Note: Top-level bot_protection_setting is deprecated; use detection_settings.bot_protection_setting instead',
      description: 'Configure custom bot protection settings including JavaScript mode and grace period',
      actionSelectors: {
        edit: 'link:text("Edit Configuration")',
        apply: 'button:has(generic:text("Apply"))',
        discard: 'button:has(generic:text("Discard"))',
      },
      fields: [
        {
          name: 'good_bot_action',
          label: 'Good Bot Action',
          apiProperty: 'spec.detection_settings.bot_protection_setting.good_bot_action',
          type: 'string',
          required: false,
          advanced: false,
          defaultValue: 'REPORT',
          enum: ['BLOCK', 'REPORT', 'IGNORE'],
          enumDescriptions: {
            REPORT: 'Log good bot traffic without blocking',
            BLOCK: 'Block requests from known good bots',
            IGNORE: 'Ignore good bot signatures (disable detection)',
          },
        },
        {
          name: 'malicious_bot_action',
          label: 'Malicious Bot Action',
          apiProperty: 'spec.detection_settings.bot_protection_setting.malicious_bot_action',
          type: 'string',
          required: false,
          advanced: false,
          defaultValue: 'BLOCK',
          enum: ['BLOCK', 'REPORT', 'IGNORE'],
          enumDescriptions: {
            BLOCK: 'Block requests from known malicious bots',
            REPORT: 'Log malicious bot traffic without blocking',
            IGNORE: 'Ignore malicious bot signatures (disable detection)',
          },
        },
        {
          name: 'suspicious_bot_action',
          label: 'Suspicious Bot Action',
          apiProperty: 'spec.detection_settings.bot_protection_setting.suspicious_bot_action',
          type: 'string',
          required: false,
          advanced: false,
          defaultValue: 'REPORT',
          enum: ['BLOCK', 'REPORT', 'IGNORE'],
          enumDescriptions: {
            REPORT: 'Log suspicious bot traffic without blocking',
            BLOCK: 'Block requests from suspicious bots',
            IGNORE: 'Ignore suspicious bot signatures (disable detection)',
          },
        },
      ],
    },
  ],

  // Section-level tooltips
  sectionTooltips: {
    metadata:
      'Common attributes that can be set during create for all configuration objects like name, labels etc.',
    security_policy:
      'Configure the WAF security policy including attack signatures, detection accuracy, and automatic tuning',
    risk_based_blocking:
      'Configure AI-powered risk assessment with separate actions for high, medium, and low risk requests',
    attack_signatures:
      'Configure attack signature settings including types, accuracy selection, tuning, and staging',
    blocking_response_page: 'Configure the page displayed to users when their requests are blocked',
    bot_protection: 'Configure bot protection settings including JavaScript challenge and grace period',
  },

  // Tooltip data captured from F5 XC Console
  tooltipData: {
    // Top-level fields
    name: 'The configuration object will be created with name. It has to be unique within the namespace.\nThe value of name has to follow DNS-1035 format.',
    labels:
      'Map of string keys and values that can be used to organize and categorize\n(scope and select) objects as chosen by the user. Values specified here will be used\nby selector expression',
    description: 'Human readable description for the object',
    enforcement_mode:
      'Specifies whether the App Firewall should block requests that match WAF rules or only log them (monitoring mode)',
    security_policy:
      'Configure WAF security policy including attack signatures, signature accuracy, and automatic tuning. Options include Default, AI-powered Risk-Based Blocking, or Custom configuration.',
    blocking_response_page: 'Configure the response page shown when a request is blocked by the WAF',
    bot_protection_setting: 'Configure bot protection features including JavaScript challenge insertion',
    allowed_response_status_codes:
      'Configure which HTTP response status codes are allowed from the origin server. Use default (1xx, 2xx, 3xx), allow all, or specify a custom list.',
    mask_sensitive_parameters:
      'Configure which parameters should be masked in WAF logs to protect sensitive data like passwords and tokens',
    default_anonymization: 'Enable default anonymization of sensitive data in logs',

    // Risk-Based Blocking nested fields (API uses AI_BLOCK/AI_REPORT enums)
    high_risk_action:
      'Action for high-risk requests as determined by AI analysis. AI_BLOCK to prevent likely malicious requests, AI_REPORT to log only.',
    medium_risk_action:
      'Action for medium-risk requests. AI_REPORT recommended during tuning period to analyze traffic patterns.',
    low_risk_action:
      'Action for low-risk requests. AI_REPORT recommended to avoid blocking legitimate traffic.',

    // Custom security policy nested fields
    attack_types:
      'Configure which attack types to detect. Use Default for comprehensive coverage or Custom to select specific attack categories.',
    signature_selection_by_accuracy:
      'Select which signature accuracy levels to use. Higher accuracy means fewer false positives but potentially less coverage.',
    automatic_attack_signatures_tuning:
      'Enable automatic tuning of attack signatures based on traffic patterns and false positive analysis',
    attack_signatures_staging:
      'Enable staging of new attack signatures before enforcement to validate and reduce false positives',
    threat_campaigns:
      'Enable detection of known threat campaigns based on F5 threat intelligence feeds',
    violations:
      'Configure which protocol and request violations to detect. Use Default for comprehensive coverage.',
    signature_based_bot_protection:
      'Configure signature-based bot protection to detect and block known malicious bots',

    // Custom blocking page fields (API max size is 4096 bytes after base64 encoding)
    blocking_page:
      'Custom HTML content to display on the blocking page. Use {{request_id}} placeholder for tracking. Max 4096 bytes after base64 encoding.',
    response_code: 'HTTP response code to return when a request is blocked',

    // Bot protection fields
    javascript_mode: 'Specifies how JavaScript is injected into responses for bot detection',
    grace_period:
      'Time period in seconds to allow a client to complete JavaScript challenge before being blocked',
    timeout: 'Timeout in milliseconds for JavaScript challenge completion',
  },

  // Top-level enum descriptions for discriminator fields
  enumDescriptions: {
    enforcement_mode: {
      Monitoring: 'Requests will be logged but not blocked (alert-only mode).',
      Blocking: 'Requests matching WAF rules will be blocked.',
    },
    security_policy: {
      Default: 'Use default WAF security policy with recommended signatures and thresholds.',
      'Risk-Based Blocking (Powered by AI) - Preview':
        'AI-powered risk assessment for intelligent blocking decisions (Preview feature).',
      Custom: 'Configure custom security policy including signature selection and attack type settings.',
    },
    blocking_response_page: {
      'Default Blocking Page': 'Use the default F5 XC blocking page.',
      'Custom Blocking Page': 'Configure a custom blocking page with custom HTML body.',
    },
    allowed_response_status_codes: {
      'Default Allowed Response Status Codes':
        'Allow standard HTTP success and redirect status codes (1xx, 2xx, 3xx).',
      'Allow All Response Status Codes':
        'Allow all HTTP response codes from origin server without inspection.',
      'Custom Allowed Response Status Codes': 'Configure a custom list of allowed response status codes.',
    },
    mask_sensitive_parameters: {
      'Default Masked Parameters':
        'Use default list of sensitive parameters to mask in logs (passwords, tokens, etc.).',
      'Custom Masked Parameters': 'Configure custom list of parameters to mask in logs.',
      'Disable Masking': 'Disable masking of sensitive parameters (not recommended).',
    },
    bot_protection_setting: {
      'Default Bot Settings': 'Use default bot protection settings.',
      'Custom Bot Settings': 'Configure custom bot protection with JavaScript insertion and grace period.',
    },
    high_risk_action: {
      AI_BLOCK: 'Block high-risk requests that AI determines are likely malicious.',
      AI_REPORT: 'Log high-risk requests without blocking for monitoring and analysis.',
    },
    medium_risk_action: {
      AI_BLOCK: 'Block medium-risk requests for stricter security posture.',
      AI_REPORT: 'Log medium-risk requests without blocking (recommended for tuning).',
    },
    low_risk_action: {
      AI_BLOCK: 'Block all low-risk requests (most restrictive).',
      AI_REPORT: 'Log low-risk requests without blocking (recommended).',
    },
    good_bot_action: {
      BLOCK: 'Block requests from known good bots.',
      REPORT: 'Log good bot traffic without blocking.',
      IGNORE: 'Ignore good bot signatures (disable detection).',
    },
    malicious_bot_action: {
      BLOCK: 'Block requests from known malicious bots.',
      REPORT: 'Log malicious bot traffic without blocking.',
      IGNORE: 'Ignore malicious bot signatures (disable detection).',
    },
    suspicious_bot_action: {
      BLOCK: 'Block requests from suspicious bots.',
      REPORT: 'Log suspicious bot traffic without blocking.',
      IGNORE: 'Ignore suspicious bot signatures (disable detection).',
    },
    attack_types: {
      Default: 'Use default attack type detection covering all common attack categories.',
      Custom: 'Configure custom list of attack types to detect or exclude.',
    },
    signature_selection_by_accuracy: {
      'High Accuracy Only': 'Only use high accuracy signatures (fewer false positives).',
      'High and Medium': 'Use high and medium accuracy signatures (balanced).',
      'High, Medium, and Low':
        'Use all signatures including low accuracy (maximum coverage, more false positives).',
    },
    automatic_attack_signatures_tuning: {
      Enable: 'Automatically tune attack signatures based on traffic patterns and false positive analysis.',
      Disable: 'Use static signature configuration without automatic tuning.',
    },
    attack_signatures_staging: {
      Disable: 'Enforce new attack signatures immediately without staging period.',
      Enable: 'Stage new attack signatures before enforcement to reduce false positives.',
    },
    threat_campaigns: {
      Enable: 'Enable detection of known threat campaigns based on F5 threat intelligence.',
      Disable: 'Disable threat campaign detection.',
    },
    violations: {
      Default: 'Use default violation detection settings covering all common violations.',
      Custom: 'Configure custom violation types and thresholds.',
    },
    signature_based_bot_protection: {
      Default: 'Use default signature-based bot protection settings.',
      Custom: 'Configure custom signature-based bot protection rules.',
    },
    response_code: {
      Forbidden: 'HTTP 403 Forbidden.',
      'Not Found': 'HTTP 404 Not Found.',
      Unauthorized: 'HTTP 401 Unauthorized.',
      'Service Unavailable': 'HTTP 503 Service Unavailable.',
      OK: 'HTTP 200 OK.',
    },
    javascript_mode: {
      None: 'Do not inject JavaScript.',
      'Async JavaScript with No Caching': 'Inject JavaScript asynchronously without browser caching.',
      'Async JavaScript with Caching': 'Inject JavaScript asynchronously with browser caching.',
      'Sync JavaScript with No Caching': 'Inject JavaScript synchronously without browser caching.',
      'Sync JavaScript with Caching': 'Inject JavaScript synchronously with browser caching.',
    },
  },
};
