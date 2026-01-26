#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { SchemaGenerator } from '../src/extractors/schema-generator';
import { SnapshotParser, ParsedSnapshot } from '../src/mcp/snapshot-parser';
import { DetectedFormField } from '../src/handlers/form-handler';
import { OneOfDetector } from '../src/extractors/oneof-detector';
import { SchemaGenerationOutput, SchemaMetadata } from '../src/types/schema-extractor';

interface BrowserTools {
  tabId: number;
  goto(url: string): Promise<void>;
  readPage(): Promise<string>;
  click(ref: string, description: string): Promise<void>;
  selectOption(ref: string, option: string): Promise<void>;
  fill(ref: string, value: string): Promise<void>;
  wait(ms: number): Promise<void>;
}

// Mock snapshots - different based on policy selection
function createBaselineSnapshot(): string {
  return `[ref_1] textbox "Name" 
[ref_2] textbox "Labels" 
[ref_3] textbox "Description" 
[ref_4] checkbox "Disabled" 
[ref_5] combobox "Policy Type" value="Allow All" expanded
  [opt_1] option "Allow All" selected
  [opt_2] option "Allow Specific" 
  [opt_3] option "Deny All" 
  [opt_4] option "Deny Specific" 
[ref_6] combobox "Action Type" value="Allow" expanded
  [opt_5] option "Allow" selected
  [opt_6] option "Deny" 
[ref_7] checkbox "Enabled" checked
[ref_8] button "Save" 
[ref_9] button "Cancel"`;
}

function createAllowSpecificSnapshot(): string {
  return `[ref_1] textbox "Name" 
[ref_2] textbox "Labels" 
[ref_3] textbox "Description" 
[ref_4] checkbox "Disabled" 
[ref_5] combobox "Policy Type" value="Allow Specific" expanded
  [opt_1] option "Allow All" 
  [opt_2] option "Allow Specific" selected
  [opt_3] option "Deny All" 
  [opt_4] option "Deny Specific" 
[ref_6] combobox "Action Type" value="Allow" expanded
  [opt_5] option "Allow" selected
  [opt_6] option "Deny" 
[ref_7] checkbox "Enabled" checked
[ref_10] listbox "Allowed URLs" 
[ref_11] textbox "Add URL pattern" 
[ref_8] button "Save" 
[ref_9] button "Cancel"`;
}

function createDenySpecificSnapshot(): string {
  return `[ref_1] textbox "Name" 
[ref_2] textbox "Labels" 
[ref_3] textbox "Description" 
[ref_4] checkbox "Disabled" 
[ref_5] combobox "Policy Type" value="Deny Specific" expanded
  [opt_1] option "Allow All" 
  [opt_2] option "Allow Specific" 
  [opt_3] option "Deny All" 
  [opt_4] option "Deny Specific" selected
[ref_6] combobox "Action Type" value="Deny" expanded
  [opt_5] option "Allow" 
  [opt_6] option "Deny" selected
[ref_7] checkbox "Enabled" checked
[ref_12] listbox "Denied URLs" 
[ref_13] textbox "Add URL pattern" 
[ref_14] textbox "Block Response Code" 
[ref_8] button "Save" 
[ref_9] button "Cancel"`;
}

function createMockBrowser(): BrowserTools {
  let currentPolicy = 'Allow All';
  
  return {
    tabId: 1,
    goto: async (url: string) => {
      console.log('  [GOTO] ' + url);
    },
    readPage: async () => {
      if (currentPolicy === 'Allow Specific') {
        return createAllowSpecificSnapshot();
      } else if (currentPolicy === 'Deny Specific') {
        return createDenySpecificSnapshot();
      }
      return createBaselineSnapshot();
    },
    click: async (ref: string, description: string) => {
      console.log('  [CLICK] ' + description);
    },
    selectOption: async (ref: string, option: string) => {
      console.log('  [SELECT] ' + option);
      if (['Allow All', 'Allow Specific', 'Deny All', 'Deny Specific'].includes(option)) {
        currentPolicy = option;
      }
    },
    fill: async (ref: string, value: string) => {
      console.log('  [FILL] ' + value);
    },
    wait: async (ms: number) => {},
  };
}

class FormExplorer {
  private formHandler: FormHandler;
  private detector: OneOfDetector;
  private capturedStates: Map<string, DetectedFormField[]>;

  constructor() {
    this.formHandler = {
      detectFormFields: (snapshot: ParsedSnapshot): DetectedFormField[] => {
        return snapshot.elements
          .filter(e => 
            e.role === 'textbox' || 
            e.role === 'combobox' || 
            e.role === 'checkbox' ||
            e.role === 'button' ||
            e.role === 'listbox'
          )
          .map(e => ({
            uid: e.uid,
            name: e.name || e.role,
            type: e.role === 'checkbox' ? 'checkbox' : 
                  e.role === 'combobox' || e.role === 'listbox' ? 'combobox' : 'textbox',
            value: e.value,
            disabled: e.disabled || false,
            required: false,
            options: this.extractOptions(e, snapshot),
            placeholder: e.placeholder,
          }));
      }
    };
    this.detector = new OneOfDetector();
    this.capturedStates = new Map();
  }

  private extractOptions(element: any, snapshot: ParsedSnapshot): string[] {
    const options: string[] = [];
    const elementIndex = snapshot.elements.indexOf(element);
    
    for (let i = elementIndex + 1; i < snapshot.elements.length; i++) {
      const next = snapshot.elements[i];
      if (next.level <= element.level) break;
      if (next.role === 'option' && next.name) {
        options.push(next.name);
      }
    }
    return options;
  }

  async captureState(snapshotText: string, stateId: string): Promise<DetectedFormField[]> {
    const parser = new SnapshotParser();
    const snapshot = parser.parse(snapshotText);
    const fields = this.formHandler.detectFormFields(snapshot);
    this.capturedStates.set(stateId, fields);
    console.log('  [CAPTURE] ' + stateId + ': ' + fields.length + ' fields');
    return fields;
  }

  findControlFields(fields: DetectedFormField[]): DetectedFormField[] {
    return fields.filter(f => f.type === 'combobox');
  }

  findToggleFields(fields: DetectedFormField[]): DetectedFormField[] {
    return fields.filter(f => f.type === 'checkbox');
  }

  recordState(controlField: string, optionValue: string, fields: DetectedFormField[]): void {
    this.detector.recordFieldState(controlField, optionValue, fields);
  }

  getStates(): Map<string, DetectedFormField[]> {
    return this.capturedStates;
  }

  analyze(): any {
    return this.detector.analyzeRelationships();
  }
}

interface FormHandler {
  detectFormFields(snapshot: ParsedSnapshot): DetectedFormField[];
}

async function runTest() {
  console.log('='.repeat(80));
  console.log('App Firewall Schema Extraction - TEST MODE');
  console.log('='.repeat(80));
  console.log('');
  console.log('Testing extraction with mock browser (variable snapshots)...');
  console.log('');

  const browser = createMockBrowser();
  const explorer = new FormExplorer();
  const generator = new SchemaGenerator();

  try {
    console.log('[1/8] Navigate to form');
    await browser.goto('https://f5-amer-ent.console.ves.volterra.io/...');
    await browser.wait(100);

    console.log('[2/8] Capture baseline state');
    const baselineSnapshot = await browser.readPage();
    const baselineFields = await explorer.captureState(baselineSnapshot, 'baseline');

    console.log('[3/8] Find control fields');
    const controlFields = explorer.findControlFields(baselineFields);
    const dropdowns = controlFields.filter(f => f.type === 'combobox');
    console.log('  Found ' + dropdowns.length + ' dropdowns');

    console.log('[4/8] Capture expanded baseline');
    const expandedSnapshot = await browser.readPage();
    const expandedFields = await explorer.captureState(expandedSnapshot, 'expanded');

    console.log('[5/8] Explore dropdown states (with field mutations)');
    for (const dropdown of dropdowns) {
      console.log('  Testing: ' + dropdown.name);
      for (const option of (dropdown.options || [])) {
        await browser.selectOption(dropdown.uid, option);
        await browser.wait(100);
        const snapshot = await browser.readPage();
        const fields = await explorer.captureState(snapshot, dropdown.name + ':' + option);
        explorer.recordState(dropdown.name, option, fields);
      }
    }

    console.log('[6/8] Analyze relationships');
    const analysis = explorer.analyze();
    const relationships = analysis.relationships || [];
    console.log('  Found ' + relationships.length + ' relationships');
    console.log('  Confidence: ' + (analysis.confidence * 100).toFixed(1) + '%');
    console.log('  Mutations: ' + (analysis.mutations?.length || 0));

    console.log('[7/8] Generate JSON Schema');
    const metadata: SchemaMetadata = {
      formUrl: 'https://f5-amer-ent.console.ves.volterra.io/...',
      resourceType: 'app_firewall',
      extractedAt: new Date().toISOString(),
      version: '1.0.0',
      extractionVersion: '1.0.0',
      advancedFields: [],
      warnings: [],
    };

    const result: SchemaGenerationOutput = await generator.generate({
      formFields: expandedFields,
      oneOfRelationships: relationships,
      metadata,
      formUrl: 'https://f5-amer-ent.console.ves.volterra.io/...',
    });

    console.log('[8/8] Validate results');
    const schemaValid = result.schema?.$schema === 'http://json-schema.org/draft-07/schema#';
    const hasOneOf = result.schema?.oneOf && result.schema.oneOf.length > 0;
    const hasProperties = result.schema?.properties && Object.keys(result.schema.properties).length > 0;

    console.log('');
    console.log('='.repeat(80));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(80));
    console.log('');
    console.log('Schema Statistics:');
    console.log('  - Properties: ' + (result.schema?.properties ? Object.keys(result.schema.properties).length : 0));
    console.log('  - OneOf blocks: ' + (result.schema?.oneOf?.length || 0));
    console.log('');
    console.log('Criteria:');
    console.log('  JSON Schema draft-07: ' + (schemaValid ? 'PASS' : 'FAIL'));
    console.log('  Has OneOf blocks: ' + (hasOneOf ? 'PASS' : 'FAIL'));
    console.log('  Has Properties: ' + (hasProperties ? 'PASS' : 'FAIL'));
    console.log('');

    if (schemaValid && hasOneOf && hasProperties) {
      console.log('TEST PASSED!');
      console.log('');
      console.log('Schema Output:');
      console.log('-'.repeat(80));
      console.log(JSON.stringify(result.schema, null, 2));
      console.log('-'.repeat(80));
      return true;
    } else {
      console.log('TEST FAILED - Partial pass (schema valid but no oneOf detected)');
      console.log('');
      console.log('Schema Output:');
      console.log('-'.repeat(80));
      console.log(JSON.stringify(result.schema, null, 2));
      console.log('-'.repeat(80));
      return false;
    }
  } catch (error) {
    console.error('');
    console.error('ERROR: ' + (error instanceof Error ? error.message : String(error)));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

runTest().then(success => {
  process.exit(success ? 0 : 1);
});
