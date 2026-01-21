# F5 XC Resource Schemas

This directory contains JSON Schema definitions extracted from F5 Distributed Cloud Console forms.

## Schema Format

Each schema follows JSON Schema draft-07 specification and includes:

- **Standard JSON Schema properties**: type, properties, required, oneOf, etc.
- **F5 XC metadata** (`x-f5xc-metadata`): Extraction metadata and resource-specific information
- **Field metadata** (`x-f5xc-field`): Input types, selectors, and UI hints

## Schema Naming Convention

Schemas are named by resource type:
- `healthcheck.schema.json` - Health Check resource
- `origin_pool.schema.json` - Origin Pool resource
- `load_balancer.schema.json` - HTTP Load Balancer resource

## Schema Structure

```json
{
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
  "oneOf": [
    {
      "properties": {
        "type": { "const": "HTTP" },
        "http_config": { ... }
      }
    }
  ],
  "x-f5xc-metadata": {
    "formUrl": "https://...",
    "resourceType": "healthcheck",
    "extractedAt": "2026-01-21T...",
    "version": "1.0.0"
  }
}
```

## Using Schemas

### Validation

```typescript
import Ajv from 'ajv';
const ajv = new Ajv();
const schema = require('./schemas/healthcheck.schema.json');
const validate = ajv.compile(schema);

const valid = validate(data);
if (!valid) {
  console.error(validate.errors);
}
```

### Form Automation

Schemas include selector metadata for automated form filling:

```typescript
const schema = require('./schemas/healthcheck.schema.json');
const metadata = schema['x-f5xc-metadata'];
const fieldSelector = schema.properties.name['x-f5xc-field'].selector;
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
