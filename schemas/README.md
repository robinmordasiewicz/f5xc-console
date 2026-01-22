# F5 XC Resource Schemas

This directory contains JSON Schema definitions extracted from F5 Distributed Cloud Console forms.

## Schema Format

Each schema follows JSON Schema draft-07 specification and includes:

- **Standard JSON Schema properties**: type, properties, required, oneOf, etc.
- **F5 XC metadata** (`x-f5xc-metadata`): Extraction metadata and resource-specific information
- **Field metadata** (`x-f5xc-field`): Input types, selectors, and UI hints

## Schema Naming Convention

### Canonical Schema Files

Single source of truth for each resource type:
- `{resourceType}.schema.json` - Consolidated schema with metadata

Examples:
- `healthcheck.schema.json` - Health Check resource
- `origin_pool.schema.json` - Origin Pool resource (when consolidated)
- `load_balancer.schema.json` - HTTP Load Balancer resource

### Variant Schema Files (for phased development)

Multiple variants for comparison and testing:
- `{resourceType}-{variant}.schema.json`

Examples:
- `origin_pool-mvp.schema.json` - Minimal viable product (Phase 1)
- `origin_pool-full.schema.json` - Comprehensive with array fields (Phase 2)
- `origin_pool-api.schema.json` - With live API discovery (Phase 3)

## Schema Structure

### Consolidated File Format

All canonical schema files contain three main sections:

```json
{
  "schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "F5 XC Resource Configuration",
    "type": "object",
    "properties": {
      "field_name": {
        "type": "string",
        "description": "Field description",
        "x-f5xc-field": {
          "inputType": "textbox",
          "selector": "ref_123",
          "advanced": false
        }
      }
    },
    "required": ["field_name"],
    "x-f5xc-metadata": {
      "formUrl": "https://...",
      "resourceType": "healthcheck",
      "extractedAt": "2026-01-22T...",
      "version": "1.0.0"
    }
  },
  "selectors": {
    "resourceType": "healthcheck",
    "fieldSelectors": {
      "Field Name": {
        "schemaPath": "properties.field_name",
        "selector": "ref_123",
        "inputType": "textbox",
        "required": true
      }
    },
    "actionSelectors": {
      "submit": "button[type=\"submit\"]",
      "cancel": "button[aria-label*=\"cancel\" i]"
    }
  },
  "metadata": {
    "formUrl": "https://...",
    "resourceType": "healthcheck",
    "extractedAt": "2026-01-22T...",
    "version": "1.0.0",
    "coverage": {
      "totalFields": 9,
      "schemaFields": 9,
      "fieldsWithSelectors": 9,
      "percentage": 100
    },
    "warnings": []
  }
}
```

**Benefits of consolidated format:**
- Single file distribution
- All related information together
- Easier version control
- Simpler script maintenance

## Using Schemas

### Validation

```typescript
import Ajv from 'ajv';
const ajv = new Ajv();
const schemaFile = require('./schemas/healthcheck.schema.json');
const validate = ajv.compile(schemaFile.schema);

const valid = validate(data);
if (!valid) {
  console.error(validate.errors);
}
```

### Form Automation

Schemas include selector metadata for automated form filling:

```typescript
const schemaFile = require('./schemas/healthcheck.schema.json');

// Access schema metadata
const metadata = schemaFile.metadata;
console.log(`Coverage: ${metadata.coverage.percentage}%`);

// Access field selectors
const nameSelector = schemaFile.selectors.fieldSelectors['Name'];
console.log(`Selector: ${nameSelector.selector}`);
console.log(`Required: ${nameSelector.required}`);

// Access action selectors
const submitButton = schemaFile.selectors.actionSelectors.submit;
```

## Schema Maintenance

Schemas should be regenerated when:
- Form structure changes in the console
- New fields are added or removed
- Validation rules are updated
- Console version is upgraded

## Extraction Process

Schemas are extracted using the schema extraction system:

1. Open form in browser
2. Expand to maximum state (advanced fields)
3. Capture snapshots for oneOf detection
4. Generate schema with `SchemaExtractor`
5. Validate and export

See `/docs/features/schema-extraction.md` for detailed extraction guide.
