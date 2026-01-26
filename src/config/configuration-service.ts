// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { load } from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigurationError } from '../errors/extraction-errors';
import { LoggerService } from '../logging/logger-service';

interface GlobalConfig {
  api_references?: Record<string, any>;
  defaults?: Record<string, any>;
  version?: string;
}

interface ResourceConfig {
  resourceType?: string;
  description?: string;
  api_type?: string;
  formUrl?: string;
  formTitle?: string;
  field_mappings?: Record<string, string>;
  discriminators?: Array<{
    field: string;
    api_property: string;
    options: Record<string, any>;
  }>;
  arrays?: Array<any>;
  validation_rules?: any;
  apiReferences?: any;
  defaults?: any;
  metadata?: any;
}

export class ConfigurationService {
  private static instance: ConfigurationService;
  private configCache: Map<string, ResourceConfig> = new Map();
  private globalConfig: GlobalConfig | null = null;
  private configPath: string;
  private logger: LoggerService;

  private constructor(configPath?: string) {
    this.configPath = configPath || path.join(__dirname, '../../config/field-mappings.yaml');
    this.logger = LoggerService.getInstance();
  }

  static getInstance(configPath?: string): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService(configPath);
    }
    return ConfigurationService.instance;
  }

  async getResourceConfig(resourceType: string): Promise<ResourceConfig> {
    if (this.configCache.has(resourceType)) {
      this.logger.debug(`Configuration cache hit for ${resourceType}`);
      return this.configCache.get(resourceType)!;
    }

    const config = await this.loadResourceConfig(resourceType);
    this.configCache.set(resourceType, config);
    return config;
  }

  async getGlobalConfig(): Promise<GlobalConfig> {
    if (!this.globalConfig) {
      this.globalConfig = await this.loadGlobalConfig();
    }
    return this.globalConfig;
  }

  async reload(): Promise<void> {
    this.configCache.clear();
    this.globalConfig = null;
    this.logger.info('Configuration cache cleared');
  }

  private async loadResourceConfig(resourceType: string): Promise<ResourceConfig> {
    try {
      const fileContent = fs.readFileSync(this.configPath, 'utf8');
      const allConfig = load(fileContent) as any;

      if (!allConfig[resourceType]) {
        throw new ConfigurationError(
          `Resource type "${resourceType}" not found in ${this.configPath}`,
          { resourceType, availableTypes: Object.keys(allConfig) }
        );
      }

      const globalConfig = await this.getGlobalConfig();

      return {
        ...allConfig[resourceType],
        resourceType,
        apiReferences: globalConfig.api_references,
        defaults: globalConfig.defaults,
      };

    } catch (error) {
      if (error instanceof ConfigurationError) throw error;

      throw new ConfigurationError(
        `Failed to load configuration for ${resourceType}`,
        { resourceType, originalError: error }
      );
    }
  }

  private async loadGlobalConfig(): Promise<GlobalConfig> {
    const fileContent = fs.readFileSync(this.configPath, 'utf8');
    const config = load(fileContent) as any;

    return {
      api_references: config.api_references || {},
      defaults: config.defaults || {},
      version: config.version || '1.0.0',
    };
  }
}
