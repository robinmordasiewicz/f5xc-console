// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * OneOf Detector
 *
 * Detects oneOf relationships and conditional dependencies by analyzing
 * DOM mutations across different form states. Works by:
 * 1. Recording field visibility for each dropdown option
 * 2. Comparing field sets to identify mutually exclusive relationships
 * 3. Building oneOf relationship structures for JSON Schema
 */

import { DetectedFormField } from '../handlers/form-handler';
import {
  OneOfRelationship,
  OneOfOption,
  ConditionalDependency,
  FieldMutation,
  FormStateSnapshot,
  OneOfAnalysisResult,
  NestedConfiguration,
} from '../types/schema-extractor';

/**
 * OneOf Detector class
 *
 * Usage:
 * ```typescript
 * const detector = new OneOfDetector();
 *
 * // For each dropdown and its options
 * for (const option of dropdown.options) {
 *   await selectOption(option);
 *   const fields = formHandler.detectFormFields(snapshot);
 *   detector.recordFieldState(dropdown.name, option, fields);
 * }
 *
 * // Analyze to detect relationships
 * const result = detector.analyzeRelationships();
 * ```
 */
export class OneOfDetector {
  /**
   * Recorded states for each discriminator field
   * Map: discriminatorFieldName -> Map: optionValue -> DetectedFormField[]
   */
  private states: Map<string, Map<string, DetectedFormField[]>> = new Map();

  /**
   * Recorded state snapshots for detailed analysis
   */
  private snapshots: FormStateSnapshot[] = [];

  /**
   * Detected mutations during state changes
   */
  private mutations: FieldMutation[] = [];

  /**
   * Record field state for a specific dropdown option
   *
   * @param dropdownName - Name of the discriminator field (e.g., "Health Check Type")
   * @param optionValue - Selected option value (e.g., "HTTP", "TCP", "ICMP")
   * @param fields - All visible fields in this state
   */
  recordFieldState(dropdownName: string, optionValue: string, fields: DetectedFormField[]): void {
    // Initialize nested map if needed
    if (!this.states.has(dropdownName)) {
      this.states.set(dropdownName, new Map());
    }

    const optionStates = this.states.get(dropdownName)!;

    // Check for mutations if we have a previous state
    const previousState = this.getLastStateForDropdown(dropdownName);
    if (previousState) {
      this.detectMutations(previousState.fields, fields, dropdownName, optionValue);
    }

    // Store the new state
    optionStates.set(optionValue, fields);

    // Create and store snapshot
    const snapshot: FormStateSnapshot = {
      stateId: `${dropdownName}:${optionValue}`,
      trigger: {
        fieldName: dropdownName,
        value: optionValue,
      },
      visibleFields: fields.map(f => f.name),
      requiredFields: fields.filter(f => f.required).map(f => f.name),
      fieldMetadata: this.fieldsToMetadata(fields),
    };

    this.snapshots.push(snapshot);
  }

  /**
   * Analyze all recorded states to identify oneOf patterns
   *
   * @returns Analysis result with detected relationships
   */
  analyzeRelationships(): OneOfAnalysisResult {
    const relationships: OneOfRelationship[] = [];
    const conditionalDependencies: ConditionalDependency[] = [];
    const ambiguities: string[] = [];

    for (const [dropdownName, optionStates] of this.states.entries()) {
      const analysis = this.analyzeDiscriminatorField(dropdownName, optionStates);

      if (analysis.relationship) {
        relationships.push(analysis.relationship);
      }

      conditionalDependencies.push(...analysis.conditionalDependencies);
      ambiguities.push(...analysis.ambiguities);
    }

    // Calculate confidence based on analysis quality
    const confidence = this.calculateConfidence(relationships, ambiguities);

    return {
      relationships,
      conditionalDependencies,
      mutations: this.mutations,
      confidence,
      ambiguities: ambiguities.length > 0 ? ambiguities : undefined,
    };
  }

  /**
   * Analyze a single discriminator field to identify relationships
   */
  private analyzeDiscriminatorField(
    dropdownName: string,
    optionStates: Map<string, DetectedFormField[]>
  ): {
    relationship: OneOfRelationship | null;
    conditionalDependencies: ConditionalDependency[];
    ambiguities: string[];
  } {
    const ambiguities: string[] = [];
    const conditionalDependencies: ConditionalDependency[] = [];

    // Build field sets for each option
    const fieldSetsByOption = new Map<string, Set<string>>();
    const allFields = new Set<string>();

    for (const [optionValue, fields] of optionStates.entries()) {
      const fieldNames = new Set(fields.map(f => f.name));
      fieldSetsByOption.set(optionValue, fieldNames);

      // Track all fields seen across options
      for (const name of fieldNames) {
        allFields.add(name);
      }
    }

    // Find fields that appear in all states (common fields)
    const commonFields = this.findCommonFields(fieldSetsByOption);

    // Find exclusive fields for each option
    const exclusiveFieldsByOption = new Map<string, Set<string>>();

    for (const [optionValue, fieldSet] of fieldSetsByOption.entries()) {
      const exclusiveFields = new Set<string>();

      for (const fieldName of fieldSet) {
        // Field is exclusive if it's not in common fields
        if (!commonFields.has(fieldName)) {
          exclusiveFields.add(fieldName);
        }
      }

      exclusiveFieldsByOption.set(optionValue, exclusiveFields);
    }

    // Check if there are meaningful exclusive fields
    const hasExclusiveFields = Array.from(exclusiveFieldsByOption.values()).some(
      set => set.size > 0
    );

    if (!hasExclusiveFields) {
      // No oneOf relationship - all options show the same fields
      ambiguities.push(
        `Field "${dropdownName}" does not affect form structure - all options show same fields`
      );
      return { relationship: null, conditionalDependencies, ambiguities };
    }

    // Build oneOf options
    const options: OneOfOption[] = [];

    for (const [optionValue, fields] of optionStates.entries()) {
      const exclusiveFields = exclusiveFieldsByOption.get(optionValue) ?? new Set();
      const requiredFields = fields
        .filter(f => f.required && exclusiveFields.has(f.name))
        .map(f => f.name);

      options.push({
        optionValue,
        exclusiveFields: Array.from(exclusiveFields),
        requiredFields: requiredFields.length > 0 ? requiredFields : undefined,
      });
    }

    // Build relationship
    const relationship: OneOfRelationship = {
      discriminatorField: dropdownName,
      options,
      description: `Field "${dropdownName}" determines which configuration fields are visible`,
    };

    // Detect conditional dependencies within options
    for (const [optionValue, fields] of optionStates.entries()) {
      const conditionals = this.detectConditionalDependencies(
        dropdownName,
        optionValue,
        fields
      );
      conditionalDependencies.push(...conditionals);
    }

    return { relationship, conditionalDependencies, ambiguities };
  }

  /**
   * Find fields that appear in all option states
   */
  private findCommonFields(fieldSetsByOption: Map<string, Set<string>>): Set<string> {
    const commonFields = new Set<string>();

    if (fieldSetsByOption.size === 0) {
      return commonFields;
    }

    // Start with fields from first option
    const firstOptionFields = Array.from(fieldSetsByOption.values())[0];

    for (const fieldName of firstOptionFields) {
      // Check if field appears in all other options
      const appearsInAll = Array.from(fieldSetsByOption.values()).every(fieldSet =>
        fieldSet.has(fieldName)
      );

      if (appearsInAll) {
        commonFields.add(fieldName);
      }
    }

    return commonFields;
  }

  /**
   * Detect conditional dependencies within a form state
   *
   * Looks for patterns like:
   * - "Host Header" dropdown with "Custom Value" textbox that only appears when "custom" is selected
   */
  private detectConditionalDependencies(
    discriminatorField: string,
    optionValue: string,
    fields: DetectedFormField[]
  ): ConditionalDependency[] {
    const dependencies: ConditionalDependency[] = [];

    // Find dropdown fields that might control other fields
    const dropdowns = fields.filter(f => f.type === 'combobox' || f.type === 'listbox');

    for (const dropdown of dropdowns) {
      // Look for fields near this dropdown that might be conditionally shown
      // This is a heuristic - in real implementation, would need to compare multiple states
      const nearbyFields = this.findFieldsNearby(dropdown, fields);

      if (nearbyFields.length > 0) {
        // This is a placeholder - real implementation would need to compare states
        // to verify the conditional relationship
        dependencies.push({
          controlField: dropdown.name,
          enabledWhen: dropdown.current_value ?? optionValue,
          dependentFields: nearbyFields.map(f => f.name),
          requiredWhenVisible: nearbyFields.some(f => f.required),
        });
      }
    }

    return dependencies;
  }

  /**
   * Find fields that appear near another field (heuristic for conditional dependencies)
   */
  private findFieldsNearby(field: DetectedFormField, allFields: DetectedFormField[]): DetectedFormField[] {
    // This is a simplified heuristic
    // In a real implementation, would use DOM structure analysis
    const fieldIndex = allFields.indexOf(field);
    if (fieldIndex === -1) return [];

    // Look at next 3 fields
    return allFields.slice(fieldIndex + 1, fieldIndex + 4).filter(f => f.type === 'textbox');
  }

  /**
   * Detect mutations between two field states
   */
  private detectMutations(
    previousFields: DetectedFormField[],
    currentFields: DetectedFormField[],
    dropdownName: string,
    optionValue: string
  ): void {
    const previousNames = new Set(previousFields.map(f => f.name));
    const currentNames = new Set(currentFields.map(f => f.name));

    // Find fields that appeared
    for (const field of currentFields) {
      if (!previousNames.has(field.name)) {
        this.mutations.push({
          fieldName: field.name,
          mutationType: 'appeared',
          triggerState: {
            fieldName: dropdownName,
            value: optionValue,
          },
        });
      }
    }

    // Find fields that disappeared
    for (const field of previousFields) {
      if (!currentNames.has(field.name)) {
        this.mutations.push({
          fieldName: field.name,
          mutationType: 'disappeared',
          triggerState: {
            fieldName: dropdownName,
            value: optionValue,
          },
        });
      }
    }
  }

  /**
   * Get the last recorded state for a dropdown
   */
  private getLastStateForDropdown(dropdownName: string): { fields: DetectedFormField[] } | null {
    const optionStates = this.states.get(dropdownName);
    if (!optionStates || optionStates.size === 0) {
      return null;
    }

    // Get the last recorded option
    const lastOption = Array.from(optionStates.keys()).pop();
    if (!lastOption) return null;

    const fields = optionStates.get(lastOption);
    return fields ? { fields } : null;
  }

  /**
   * Convert DetectedFormField[] to metadata record
   */
  private fieldsToMetadata(fields: DetectedFormField[]): Record<string, any> {
    const metadata: Record<string, any> = {};

    for (const field of fields) {
      metadata[field.name] = {
        type: field.type,
        required: field.required,
        options: field.options,
        current_value: field.current_value,
        disabled: field.disabled,
      };
    }

    return metadata;
  }

  /**
   * Calculate confidence score based on analysis quality
   */
  private calculateConfidence(
    relationships: OneOfRelationship[],
    ambiguities: string[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for detected relationships
    if (relationships.length > 0) {
      confidence += 0.2;

      // Higher confidence if relationships have exclusive fields
      const hasExclusiveFields = relationships.some(r =>
        r.options.some(o => o.exclusiveFields.length > 0)
      );

      if (hasExclusiveFields) {
        confidence += 0.2;
      }
    }

    // Decrease confidence for ambiguities
    if (ambiguities.length > 0) {
      confidence -= 0.1 * Math.min(ambiguities.length, 3);
    }

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get all recorded state snapshots
   */
  getSnapshots(): FormStateSnapshot[] {
    return this.snapshots;
  }

  /**
   * Get all detected mutations
   */
  getMutations(): FieldMutation[] {
    return this.mutations;
  }

  /**
   * Reset detector state (useful for processing multiple forms)
   */
  reset(): void {
    this.states.clear();
    this.snapshots = [];
    this.mutations = [];
  }

  /**
   * Detect nested configuration buttons in form fields
   *
   * Looks for "Edit Configuration" or similar buttons that open dialogs
   * with additional fields not visible in the main form.
   *
   * @param fields - Current form fields to scan
   * @returns Array of detected nested configuration triggers
   */
  detectNestedConfigButtons(fields: DetectedFormField[]): Array<{
    trigger: string;
    buttonUid: string;
    fieldName: string;
  }> {
    const nestedConfigTriggers: Array<{
      trigger: string;
      buttonUid: string;
      fieldName: string;
    }> = [];

    for (const field of fields) {
      // Look for fields that might have "Edit Configuration" buttons
      // These typically appear near combobox/listbox fields
      if (field.type === 'combobox' || field.type === 'listbox') {
        // Check if field name suggests it has a nested config
        const suggestsNestedConfig =
          field.name.toLowerCase().includes('configuration') ||
          field.name.toLowerCase().includes('settings') ||
          field.name.toLowerCase().includes('options');

        if (suggestsNestedConfig) {
          nestedConfigTriggers.push({
            trigger: `Edit ${field.name}`,
            buttonUid: `${field.uid}_edit_config`,
            fieldName: field.name,
          });
        }
      }
    }

    return nestedConfigTriggers;
  }

  /**
   * Record nested configuration fields
   *
   * When a nested dialog is opened, this captures the fields within that dialog
   * and associates them with the parent field.
   *
   * @param parentFieldName - Name of the field that triggered the dialog
   * @param dialogFields - Fields detected within the nested dialog
   * @param dialogTitle - Title of the dialog (for identification)
   */
  recordNestedConfigFields(
    parentFieldName: string,
    dialogFields: DetectedFormField[],
    dialogTitle?: string
  ): void {
    // Create a special snapshot for nested config
    const snapshot: FormStateSnapshot = {
      stateId: `nested:${parentFieldName}`,
      trigger: {
        fieldName: parentFieldName,
        value: 'nested_config_dialog',
      },
      visibleFields: dialogFields.map(f => f.name),
      requiredFields: dialogFields.filter(f => f.required).map(f => f.name),
      fieldMetadata: this.fieldsToMetadata(dialogFields),
    };

    this.snapshots.push(snapshot);

    // Store dialog metadata separately for nested config tracking
    if (!this.nestedConfigs) {
      this.nestedConfigs = [];
    }

    this.nestedConfigs.push({
      trigger: parentFieldName,
      fields: dialogFields.map(f => f.name),
      dialogTitle,
    });
  }

  private nestedConfigs: Array<{
    trigger: string;
    fields: string[];
    dialogTitle?: string;
  }> = [];

  /**
   * Get recorded nested configurations
   */
  getNestedConfigs(): Array<{
    trigger: string;
    fields: string[];
    dialogTitle?: string;
  }> {
    return this.nestedConfigs;
  }

  /**
   * Analyze nested configurations within a oneOf option
   *
   * Some oneOf options have nested dropdowns that open dialogs with
   * additional exclusive fields. This detects those patterns.
   *
   * @param optionValue - The parent oneOf option being analyzed
   * @param fields - Fields visible for this option
   * @returns Nested oneOf relationships detected
   */
  analyzeNestedOneOf(
    optionValue: string,
    fields: DetectedFormField[]
  ): OneOfRelationship[] {
    const nestedRelationships: OneOfRelationship[] = [];

    // Find dropdowns within these fields that might have nested oneOf
    const dropdowns = fields.filter(f =>
      f.type === 'combobox' || f.type === 'listbox'
    );

    for (const dropdown of dropdowns) {
      // Check if we have recorded states for this nested dropdown
      const nestedStates = this.states.get(dropdown.name);

      if (nestedStates && nestedStates.size >= 2) {
        // This dropdown has multiple states - could be a nested oneOf
        const analysis = this.analyzeDiscriminatorField(dropdown.name, nestedStates);

        if (analysis.relationship) {
          nestedRelationships.push(analysis.relationship);
        }
      }
    }

    return nestedRelationships;
  }
}
