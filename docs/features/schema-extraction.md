# Schema Extraction ↔ API Enrichment Integration

**Status**: Milestone 1, 2 & 3 Complete ✅
**Date**: 2026-01-21
**Implementation**: f5xc-console (this repository)

## Executive Summary

Successfully implemented Milestone 1 (Nested Configuration Capture), Milestone 2 (Metadata Enrichment), and Milestone 3 (API Property Mapping) of the Schema Extraction ↔ API Enrichment integration plan. The f5xc-console repository now serves as the authoritative source of truth for F5 XC resource schemas with comprehensive UI intelligence and complete UI-to-API field mapping.

## What Was Accomplished

### Milestone 1: Nested Configuration Capture ✅

**Goal**: Capture nested configuration dialogs (like "Edit HTTP Configuration") with hierarchical schema structure.

#### Implemented Features:

1. **Nested Configuration Button Detection** (`src/extractors/oneof-detector.ts`)
   - `detectNestedConfigButtons()`: Identifies "Edit Configuration" triggers
   - Detects configuration-related fields (configuration, settings, options keywords)
   - Returns trigger metadata (button UID, field name, trigger text)

2. **Nested Dialog Field Recording** (`src/extractors/oneof-detector.ts`)
   - `recordNestedConfigFields()`: Captures fields within nested dialogs
   - Creates special snapshots for nested configurations
   - Tracks dialog metadata (trigger field, nested fields, dialog title)

3. **Nested OneOf Analysis** (`src/extractors/oneof-detector.ts`)
   - `analyzeNestedOneOf()`: Detects oneOf relationships within nested configurations
   - Supports multi-level oneOf (e.g., Health Check → HTTP → Host Header → Custom Value)
   - Preserves hierarchical relationships in schema

4. **Hierarchical Schema Generation** (`src/extractors/schema-generator.ts`)
   - `buildNestedConfigSchemas()`: Creates nested property structures
   - `integrateNestedConfigsIntoOneOf()`: Merges nested configs into oneOf blocks
   - Generates object-type properties for nested configurations
   - Includes `x-f5xc-field.nestedConfig` metadata for automation

### Milestone 2: Metadata Enrichment ✅

**Goal**: Extract comprehensive field metadata (descriptions, validation, defaults) from accessibility tree.

#### New Extension Schemas:

**x-f5xc-validation**: Validation constraints
**x-f5xc-ui**: UI behavior metadata
**x-f5xc-field**: Enhanced with uiLabel and apiProperty

### Milestone 3: API Property Mapping ✅

**Goal**: Create systematic UI-to-API field mapping infrastructure to bridge the gap between human-friendly UI labels and machine-readable API property paths.

#### Implemented Features:

1. **Field Mapping Configuration** (`config/field-mappings.yaml`)
   - Centralized YAML configuration for UI ↔ API mappings
   - Structured mapping types:
     - `common_fields`: Always-present fields (name → metadata.name, timeout → timeout)
     - `discriminator_fields`: Dropdown option mappings (HTTP HealthCheck → http_health_check)
     - `nested_configs`: Nested configuration field mappings (path → http_health_check.path)
   - Validation rules: required API fields, mutually exclusive groups
   - Transformation specifications for complex field types (arrays, objects)
   - UI-only field markers (`__ui_only__` for fields not sent to API)

2. **Field Mapper Implementation** (`src/bridge/field-mapper.ts`)
   - `FieldMapper` class with comprehensive mapping capabilities:
     - `loadMappings(yamlPath)`: Async YAML configuration loading
     - `mapFieldToApiProperty()`: Map common field names to API properties
     - `mapDiscriminatorField()`: Map dropdown options to API property paths
     - `mapNestedConfigField()`: Map nested configuration fields
     - `validateMappings()`: Validate required fields and mutual exclusivity
     - `getUIOnlyFields()`: Identify fields that shouldn't be sent to API
   - Field name normalization (snake_case conversion for matching)
   - Singleton pattern with `getFieldMapper()` helper
   - Hot-reload support for development

3. **Schema Generator Integration** (`src/extractors/schema-generator.ts`)
   - Auto-population of `apiProperty` in `x-f5xc-field` extension
   - Trigger field filtering (excluded from regular properties when used for nested configs)
   - Optional field mapper loading via `loadFieldMappings()`
   - Graceful degradation when field mapper not loaded

#### Example Mappings:

```yaml
healthcheck:
  common_fields:
    name: "metadata.name"
    timeout: "timeout"
    labels: "metadata.labels"
    show_advanced_fields: "__ui_only__"  # UI-only field

  discriminator_fields:
    health_check:
      "HTTP HealthCheck": "http_health_check"
      "TCP HealthCheck": "tcp_health_check"
      "ICMP HealthCheck": "icmp_ping_health_check"

  nested_configs:
    http_health_check:
      path: "http_health_check.path"
      use_http2: "http_health_check.use_http2"
      host_header_value: "http_health_check.host_header"

  validation:
    required_api_fields:
      - "metadata.name"
      - "timeout"
      - "interval"
    mutually_exclusive:
      - ["http_health_check", "tcp_health_check", "icmp_ping_health_check"]
```

#### Usage Example:

```typescript
import { FieldMapper } from './bridge/field-mapper';
import { SchemaGenerator } from './extractors/schema-generator';

// Initialize field mapper
const mapper = new FieldMapper();
await mapper.loadMappings('config/field-mappings.yaml');

// Map UI field to API property
const result = mapper.mapFieldToApiProperty('healthcheck', 'name');
// Returns: { apiProperty: 'metadata.name', isUIOnly: false, source: 'common' }

// Map discriminator option
const discResult = mapper.mapDiscriminatorField(
  'healthcheck',
  'health_check',
  'HTTP HealthCheck'
);
// Returns: { apiProperty: 'http_health_check', isUIOnly: false, source: 'discriminator' }

// Use with schema generator
const generator = new SchemaGenerator();
await generator.loadFieldMappings('config/field-mappings.yaml');
const output = generator.generate(input);
// output.schema.properties['name']['x-f5xc-field'].apiProperty === 'metadata.name'
```

#### Key Design Decisions:

1. **YAML Configuration**: Human-readable, version-controllable mapping definitions
2. **Explicit Mapping**: No auto-inference - all mappings manually defined for clarity
3. **Namespace Separation**: Common, discriminator, and nested config mappings kept distinct
4. **Validation Support**: Built-in validation for required fields and mutual exclusivity
5. **Graceful Degradation**: Schema generation works without field mapper (missing apiProperty fields)
6. **Trigger Field Filtering**: Prevents duplicate properties when nested configs use trigger fields

## Test Coverage ✅

**Results**: 1080/1080 tests passing (26 test suites)
**Coverage**:
- OneOfDetector: 97.38% statements
- SchemaGenerator: 78.10% statements
- FieldMapper: 89.00% statements
- FormHandler: 71.68% statements

**Test Files**:
- `tests/unit/extractors/nested-config-detection.test.ts`: 11 tests
- `tests/unit/extractors/oneof-detector.test.ts`: 11 tests
- `tests/unit/bridge/field-mapper.test.ts`: 52 tests

## Next Steps

### Milestone 4: Schema Bridge (Week 3) ⏳
**Goal**: Create `src/bridge/schema-merger.ts` to merge UI schema + raw API spec → unified schema

**Tasks**:
- Design merger architecture for combining UI schemas with API specifications
- Resolve field naming conflicts (UI labels vs API property paths)
- Preserve oneOf relationships from UI while integrating API structure
- Generate unified schema ready for downstream enrichment pipeline

### Milestone 5-6: Downstream Integration (Week 4-5) ⏳
**Goal**: Create GitHub issues in f5xc-api-enrichment repository

**Issues to Create**:
1. Schema-First Enrichment Pipeline
2. OneOf Relationship Support
3. Consolidate Extension Namespace
4. UI-to-API Field Mapping
5. Selector Metadata for Automation

### Milestone 7: Proof of Concept (Week 6-7) ⏳
**Goal**: End-to-end validation of schema extraction → enrichment pipeline

**Tasks**:
- Run schema extraction for healthcheck resource
- Bridge schema with API spec
- Feed unified schema to enrichment
- Validate enriched output quality
- Document improvements vs current output

### Milestone 8: Production Pipeline (Week 8+) ⏳
**Goal**: Automate extraction → enrichment → publishing workflow

**Tasks**:
- Automate extraction on Console updates
- Trigger enrichment on schema changes
- Publish enriched specs to releases
- Update Terraform provider integration
- Monitor schema drift detection

**Milestone Status**: 3/8 Complete (37.5%)
**Next Action**: Begin Milestone 4 (Schema Bridge)
