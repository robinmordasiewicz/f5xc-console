// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { JSONSchema } from '../types/schema-extractor';

export class ExtractionUtils {
  static calculateNestingDepth(schema: any, currentDepth: number = 0): number {
    if (!schema) return currentDepth;

    let maxDepth = currentDepth;

    if (schema.properties) {
      for (const prop of Object.values(schema.properties)) {
        maxDepth = Math.max(maxDepth, ExtractionUtils.calculateNestingDepth(prop, currentDepth + 1));
      }
    }

    if (schema.oneOf) {
      for (const option of schema.oneOf) {
        maxDepth = Math.max(maxDepth, ExtractionUtils.calculateNestingDepth(option, currentDepth + 1));
      }
    }

    if (schema.items) {
      maxDepth = Math.max(maxDepth, ExtractionUtils.calculateNestingDepth(schema.items, currentDepth + 1));
    }

    return maxDepth;
  }

  static hasArrayFields(schema: any): boolean {
    if (!schema?.properties) return false;

    for (const prop of Object.values(schema.properties)) {
      if ((prop as any).type === 'array') return true;
    }

    return false;
  }

  static normalizeSchema(schema: any): any {
    const normalized = JSON.parse(JSON.stringify(schema));

    if (normalized['x-f5xc-metadata']) {
      delete normalized['x-f5xc-metadata'].extractedAt;

      if (normalized['x-f5xc-metadata'].apiDiscovery?.references) {
        for (const ref of normalized['x-f5xc-metadata'].apiDiscovery.references) {
          delete ref.lastFetched;
        }
      }
    }

    return normalized;
  }

  static findOneOfByProperty(schema: any, propertyName: string): any {
    if (!schema?.properties) return null;

    const prop = schema.properties[propertyName];
    if (prop?.oneOf) return prop;

    for (const value of Object.values(schema.properties)) {
      const found = ExtractionUtils.findOneOfByProperty(value, propertyName);
      if (found) return found;
    }

    return null;
  }
}
