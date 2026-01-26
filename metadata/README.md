# Schema Extraction Metadata

This directory contains supporting metadata for JSON Schema extraction and form automation.

## File Types

### Selector Metadata (`*-selectors.json`)

Maps schema properties to UI selectors for automated form filling.

**Format:**
```json
{
  "resourceType": "healthcheck",
  "fieldSelectors": {
    "name": {
      "schemaPath": "properties.name",
      "selector": "ref_123",
      "inputType": "textbox",
      "required": true
    }
  },
  "actionSelectors": {
    "submit": "button[type=\"submit\"]",
    "cancel": "button[aria-label*=\"cancel\" i]"
  }
}
```

**Usage:**
```typescript
const selectors = require('./metadata/healthcheck-selectors.json');
const nameSelector = selectors.fieldSelectors.name.selector;

// Fill field using selector
await browser.fill(nameSelector, "my-healthcheck");
```

### Warning Files (`*-warnings.json`)

Documents issues encountered during schema extraction.

**Format:**
```json
{
  "warnings": [
    "Field 'timeout' has no validation pattern",
    "Advanced field detection is heuristic-based"
  ]
}
```

### Analysis Results (`*-analysis.json`)

Detailed extraction analysis for debugging and improvement.

**Format:**
```json
{
  "confidence": 0.85,
  "oneOfRelationships": [...],
  "mutations": [...],
  "ambiguities": [...]
}
```

## Selector Types

Selectors use the priority chain from most to least reliable:

1. **name** - Element name attribute
2. **aria_label** - ARIA label (accessibility)
3. **href_path** - URL path for links
4. **text_match** - Text content match
5. **placeholder** - Placeholder text
6. **css** - CSS selector (fallback)
7. **ref** - Session-specific reference (unstable)

## Using Metadata for Automation

### Form Filling

```typescript
import { fillFormFromSchema } from './automation';

const schema = require('./schemas/healthcheck.schema.json');
const selectors = require('./metadata/healthcheck-selectors.json');

const data = {
  name: "my-healthcheck",
  health_check_parameters: {
    type: "HTTP",
    timeout: 10
  }
};

await fillFormFromSchema(schema, selectors, data);
```

### Validation Before Submission

```typescript
import Ajv from 'ajv';

const ajv = new Ajv();
const schema = require('./schemas/healthcheck.schema.json');
const validate = ajv.compile(schema);

// Validate data before form filling
if (!validate(data)) {
  console.error('Validation errors:', validate.errors);
  // Fix data before proceeding
}

// Proceed with form filling...
```

## Maintenance

Metadata files should be regenerated whenever:
- Schemas are updated
- Form selectors change
- Console UI is updated
- New warnings are discovered

## File Naming Convention

- Schemas: `schemas/{resource-type}.schema.json`
- Selectors: `metadata/{resource-type}-selectors.json`
- Warnings: `metadata/{resource-type}-warnings.json`
- Analysis: `metadata/{resource-type}-analysis.json`

## Quality Checks

Before using metadata in production:

1. **Selector Stability**: Verify selectors work across sessions
2. **Coverage**: Check that all required fields have selectors
3. **Validation**: Test schema validation with real data
4. **Warnings**: Review and address extraction warnings
