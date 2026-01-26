// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Console Monitor
 *
 * Monitors browser console messages for errors and warnings during extraction.
 * Uses chrome-devtools MCP server's console monitoring capabilities.
 */

import { ConsoleMessage } from '../mcp/chrome-devtools-adapter';

/**
 * Console error severity levels
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Categorized console error
 */
export interface CategorizedError {
  /** Original message */
  message: string;
  /** Error type */
  type: string;
  /** Severity level */
  severity: ErrorSeverity;
  /** Source file */
  source?: string;
  /** Line number */
  line?: number;
  /** Whether this is a critical error */
  critical: boolean;
  /** Category */
  category: string;
}

/**
 * Console monitoring result
 */
export interface ConsoleMonitoringResult {
  /** Whether errors were detected */
  hasErrors: boolean;
  /** Whether critical errors were detected */
  hasCriticalErrors: boolean;
  /** Total error count */
  errorCount: number;
  /** Total warning count */
  warningCount: number;
  /** Categorized errors */
  errors: CategorizedError[];
  /** Summary message */
  summary: string;
}

/**
 * Console Monitor Options
 */
export interface ConsoleMonitorOptions {
  /** Whether to include warnings */
  includeWarnings?: boolean;
  /** Whether to include info messages */
  includeInfo?: boolean;
  /** Filter patterns to ignore */
  ignorePatterns?: string[];
  /** Whether to categorize errors */
  categorize?: boolean;
}

/**
 * Error categorization patterns
 */
const ERROR_CATEGORIES: Record<string, RegExp[]> = {
  network: [/failed to fetch/i, /network error/i, /ERR_CONNECTION/i, /timeout/i],
  javascript: [/undefined is not/i, /cannot read property/i, /is not a function/i, /syntax error/i],
  resource: [/failed to load/i, /404/i, /not found/i],
  security: [/blocked by CORS/i, /CSP/i, /refused to execute/i],
  authentication: [/unauthorized/i, /forbidden/i, /authentication/i],
  validation: [/validation error/i, /invalid/i, /required field/i],
};

/**
 * Critical error patterns that should stop extraction
 */
const CRITICAL_PATTERNS = [
  /authentication failed/i,
  /unauthorized/i,
  /forbidden/i,
  /fatal error/i,
  /cannot connect/i,
];

/**
 * Console Monitor Class
 */
export class ConsoleMonitor {
  private options: Required<ConsoleMonitorOptions>;

  constructor(options?: ConsoleMonitorOptions) {
    this.options = {
      includeWarnings: options?.includeWarnings ?? true,
      includeInfo: options?.includeInfo ?? false,
      ignorePatterns: options?.ignorePatterns ?? [],
      categorize: options?.categorize ?? true,
    };
  }

  /**
   * Generate MCP instruction to list console messages
   */
  generateListMessagesInstruction(types?: string[]): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if (types) {
      params.types = types;
    }

    return {
      tool: 'mcp__chrome-devtools__list_console_messages',
      params,
      description: 'List console messages to detect errors',
      expectedOutcome: 'Console messages retrieved',
    };
  }

  /**
   * Generate MCP instruction to get specific console message
   */
  generateGetMessageInstruction(msgid: number): Record<string, unknown> {
    return {
      tool: 'mcp__chrome-devtools__get_console_message',
      params: { msgid },
      description: `Get console message ${msgid}`,
      expectedOutcome: 'Message details retrieved',
    };
  }

  /**
   * Process console messages and categorize errors
   */
  processMessages(messages: ConsoleMessage[]): ConsoleMonitoringResult {
    const errors: CategorizedError[] = [];
    let errorCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    for (const msg of messages) {
      // Skip if filtered out
      if (this.shouldIgnore(msg.text)) {
        continue;
      }

      // Determine severity
      const severity = this.determineSeverity(msg.type);

      // Skip if severity not included in options
      if (severity === 'warning' && !this.options.includeWarnings) continue;
      if (severity === 'info' && !this.options.includeInfo) continue;

      // Check if critical
      const critical = this.isCritical(msg.text);

      // Categorize
      const category = this.options.categorize
        ? this.categorizeError(msg.text)
        : 'uncategorized';

      // Create categorized error
      const error: CategorizedError = {
        message: msg.text,
        type: msg.type,
        severity,
        source: msg.source,
        line: msg.line,
        critical,
        category,
      };

      errors.push(error);

      // Update counts
      if (severity === 'error') errorCount++;
      if (severity === 'warning') warningCount++;
      if (critical) criticalCount++;
    }

    // Generate summary
    const summary = this.generateSummary(errorCount, warningCount, criticalCount);

    return {
      hasErrors: errorCount > 0,
      hasCriticalErrors: criticalCount > 0,
      errorCount,
      warningCount,
      errors,
      summary,
    };
  }

  /**
   * Check if message should be ignored
   */
  private shouldIgnore(message: string): boolean {
    for (const pattern of this.options.ignorePatterns) {
      if (message.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determine severity from message type
   */
  private determineSeverity(type: string): ErrorSeverity {
    if (type === 'error' || type === 'exception') return 'error';
    if (type === 'warning') return 'warning';
    return 'info';
  }

  /**
   * Check if error is critical
   */
  private isCritical(message: string): boolean {
    return CRITICAL_PATTERNS.some(pattern => pattern.test(message));
  }

  /**
   * Categorize error based on patterns
   */
  private categorizeError(message: string): string {
    for (const [category, patterns] of Object.entries(ERROR_CATEGORIES)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          // Capitalize first letter for display
          return category.charAt(0).toUpperCase() + category.slice(1);
        }
      }
    }
    return 'Uncategorized';
  }

  /**
   * Generate summary message
   */
  private generateSummary(
    errorCount: number,
    warningCount: number,
    criticalCount: number
  ): string {
    const parts: string[] = [];

    if (errorCount === 0 && warningCount === 0) {
      return 'No console errors detected';
    }

    if (errorCount > 0) {
      parts.push(`${errorCount} error${errorCount === 1 ? '' : 's'}`);
    }

    if (warningCount > 0) {
      parts.push(`${warningCount} warning${warningCount === 1 ? '' : 's'}`);
    }

    if (criticalCount > 0) {
      parts.push(`(${criticalCount} critical)`);
    }

    return parts.join(', ');
  }

  /**
   * Format errors for display
   */
  formatErrors(result: ConsoleMonitoringResult): string {
    if (!result.hasErrors) {
      return result.summary;
    }

    const lines: string[] = [];
    lines.push(`## Console Errors: ${result.summary}`);
    lines.push('');

    // Group by category
    const byCategory = new Map<string, CategorizedError[]>();
    for (const error of result.errors) {
      const existing = byCategory.get(error.category) ?? [];
      existing.push(error);
      byCategory.set(error.category, existing);
    }

    // Display by category
    byCategory.forEach((errors, category) => {
      lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)} (${errors.length})`);
      lines.push('');

      for (const error of errors) {
        const criticalMark = error.critical ? ' **[CRITICAL]**' : '';
        const location = error.source
          ? ` (${error.source}:${error.line})`
          : '';
        lines.push(`- ${error.message}${criticalMark}${location}`);
      }

      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Quick check if there are any errors
   */
  async hasErrors(messages: ConsoleMessage[]): Promise<boolean> {
    const result = this.processMessages(messages);
    return result.hasErrors;
  }

  /**
   * Quick check if there are critical errors
   */
  async hasCriticalErrors(messages: ConsoleMessage[]): Promise<boolean> {
    const result = this.processMessages(messages);
    return result.hasCriticalErrors;
  }

  /**
   * Filter messages to errors only
   */
  filterErrors(messages: ConsoleMessage[]): ConsoleMessage[] {
    return messages.filter(msg => {
      const severity = this.determineSeverity(msg.type);
      return severity === 'error' && !this.shouldIgnore(msg.text);
    });
  }

  /**
   * Get error categories present
   */
  getErrorCategories(messages: ConsoleMessage[]): string[] {
    const categories = new Set<string>();

    for (const msg of messages) {
      if (this.determineSeverity(msg.type) === 'error') {
        const category = this.categorizeError(msg.text);
        categories.add(category);
      }
    }

    return Array.from(categories);
  }
}

/**
 * Singleton instance
 */
let defaultMonitor: ConsoleMonitor | null = null;

/**
 * Get the default console monitor instance
 */
export function getConsoleMonitor(options?: ConsoleMonitorOptions): ConsoleMonitor {
  if (!defaultMonitor) {
    defaultMonitor = new ConsoleMonitor(options);
  }
  return defaultMonitor;
}

/**
 * Reset the default monitor (useful for testing)
 */
export function resetConsoleMonitor(): void {
  defaultMonitor = null;
}

/**
 * Quick function to process console messages
 */
export function processConsoleMessages(
  messages: ConsoleMessage[]
): ConsoleMonitoringResult {
  return getConsoleMonitor().processMessages(messages);
}

/**
 * Quick function to check for errors
 */
export function hasConsoleErrors(messages: ConsoleMessage[]): boolean {
  const result = processConsoleMessages(messages);
  return result.hasErrors;
}

/**
 * Quick function to format errors
 */
export function formatConsoleErrors(messages: ConsoleMessage[]): string {
  const result = processConsoleMessages(messages);
  return getConsoleMonitor().formatErrors(result);
}
