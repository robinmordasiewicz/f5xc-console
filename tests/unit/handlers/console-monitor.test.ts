// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import {
  ConsoleMonitor,
  getConsoleMonitor,
  resetConsoleMonitor,
  processConsoleMessages,
  hasConsoleErrors,
  formatConsoleErrors,
} from '../../../src/handlers/console-monitor';
import { ConsoleMessage } from '../../../src/mcp/chrome-devtools-adapter';

describe('ConsoleMonitor', () => {
  let monitor: ConsoleMonitor;

  beforeEach(() => {
    resetConsoleMonitor();
    monitor = new ConsoleMonitor();
  });

  describe('processMessages', () => {
    it('should process empty message array', () => {
      const result = monitor.processMessages([]);

      expect(result.hasErrors).toBe(false);
      expect(result.hasCriticalErrors).toBe(false);
      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
      expect(result.errors).toEqual([]);
      expect(result.summary).toBe('No console errors detected');
    });

    it('should categorize error messages', () => {
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'error',
          text: 'Failed to fetch https://api.example.com/data',
          source: 'main.js',
          line: 42,
        },
        {
          msgid: 2,
          type: 'error',
          text: 'Cannot read property "value" of null',
          source: 'app.js',
          line: 156,
        },
      ];

      const result = monitor.processMessages(messages);

      expect(result.hasErrors).toBe(true);
      expect(result.errorCount).toBe(2);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].category).toBe('Network');
      expect(result.errors[1].category).toBe('Javascript');
    });

    it('should detect critical errors', () => {
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'error',
          text: 'Authentication failed: unauthorized access',
        },
        {
          msgid: 2,
          type: 'error',
          text: 'Regular error message',
        },
      ];

      const result = monitor.processMessages(messages);

      expect(result.hasCriticalErrors).toBe(true);
      expect(result.errors[0].critical).toBe(true);
      expect(result.errors[1].critical).toBe(false);
    });

    it('should handle warnings when enabled', () => {
      const monitor = new ConsoleMonitor({ includeWarnings: true });
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'warning',
          text: 'Deprecated API usage',
        },
      ];

      const result = monitor.processMessages(messages);

      expect(result.warningCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('warning');
    });

    it('should filter warnings when disabled', () => {
      const monitor = new ConsoleMonitor({ includeWarnings: false });
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'warning',
          text: 'Deprecated API usage',
        },
      ];

      const result = monitor.processMessages(messages);

      expect(result.warningCount).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should ignore filtered patterns', () => {
      const monitor = new ConsoleMonitor({
        ignorePatterns: ['DevTools', 'React'],
      });
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'error',
          text: 'DevTools warning: something',
        },
        {
          msgid: 2,
          type: 'error',
          text: 'Real error message',
        },
      ];

      const result = monitor.processMessages(messages);

      expect(result.errorCount).toBe(1);
      expect(result.errors[0].message).toBe('Real error message');
    });

    it('should generate correct summary', () => {
      const messages: ConsoleMessage[] = [
        { msgid: 1, type: 'error', text: 'Error 1' },
        { msgid: 2, type: 'error', text: 'Error 2' },
        { msgid: 3, type: 'warning', text: 'Warning 1' },
      ];

      const result = monitor.processMessages(messages);

      expect(result.summary).toBe('2 errors, 1 warning');
    });
  });

  describe('formatErrors', () => {
    it('should format errors by category', () => {
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'error',
          text: 'Failed to fetch',
        },
        {
          msgid: 2,
          type: 'error',
          text: 'Cannot read property',
        },
      ];

      const result = monitor.processMessages(messages);
      const formatted = monitor.formatErrors(result);

      expect(formatted).toContain('## Console Errors');
      expect(formatted).toContain('### Network');
      expect(formatted).toContain('### Javascript'); // Capitalized from category name
      expect(formatted).toContain('Failed to fetch');
      expect(formatted).toContain('Cannot read property');
    });

    it('should mark critical errors', () => {
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'error',
          text: 'Authentication failed',
        },
      ];

      const result = monitor.processMessages(messages);
      const formatted = monitor.formatErrors(result);

      expect(formatted).toContain('[CRITICAL]');
    });

    it('should include source location when available', () => {
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'error',
          text: 'Error message',
          source: 'main.js',
          line: 42,
        },
      ];

      const result = monitor.processMessages(messages);
      const formatted = monitor.formatErrors(result);

      expect(formatted).toContain('(main.js:42)');
    });
  });

  describe('generateListMessagesInstruction', () => {
    it('should generate correct MCP instruction', () => {
      const instruction = monitor.generateListMessagesInstruction(['error', 'warning']);

      expect(instruction.tool).toBe('mcp__chrome-devtools__list_console_messages');
      expect(instruction.params).toEqual({ types: ['error', 'warning'] });
      expect(instruction.description).toContain('List console messages');
    });

    it('should handle no types specified', () => {
      const instruction = monitor.generateListMessagesInstruction();

      expect(instruction.params).toEqual({});
    });
  });

  describe('generateGetMessageInstruction', () => {
    it('should generate correct MCP instruction', () => {
      const instruction = monitor.generateGetMessageInstruction(42);

      expect(instruction.tool).toBe('mcp__chrome-devtools__get_console_message');
      expect(instruction.params).toEqual({ msgid: 42 });
      expect(instruction.description).toContain('Get console message 42');
    });
  });

  describe('hasErrors', () => {
    it('should return true when errors present', async () => {
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'error',
          text: 'Error message',
        },
      ];

      const result = await monitor.hasErrors(messages);
      expect(result).toBe(true);
    });

    it('should return false when no errors', async () => {
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'info',
          text: 'Info message',
        },
      ];

      const result = await monitor.hasErrors(messages);
      expect(result).toBe(false);
    });
  });

  describe('hasCriticalErrors', () => {
    it('should return true when critical errors present', async () => {
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'error',
          text: 'Authentication failed',
        },
      ];

      const result = await monitor.hasCriticalErrors(messages);
      expect(result).toBe(true);
    });

    it('should return false when no critical errors', async () => {
      const messages: ConsoleMessage[] = [
        {
          msgid: 1,
          type: 'error',
          text: 'Minor error',
        },
      ];

      const result = await monitor.hasCriticalErrors(messages);
      expect(result).toBe(false);
    });
  });

  describe('filterErrors', () => {
    it('should filter to errors only', () => {
      const messages: ConsoleMessage[] = [
        { msgid: 1, type: 'error', text: 'Error' },
        { msgid: 2, type: 'warning', text: 'Warning' },
        { msgid: 3, type: 'info', text: 'Info' },
      ];

      const filtered = monitor.filterErrors(messages);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('error');
    });

    it('should respect ignore patterns', () => {
      const monitor = new ConsoleMonitor({ ignorePatterns: ['DevTools'] });
      const messages: ConsoleMessage[] = [
        { msgid: 1, type: 'error', text: 'Error' },
        { msgid: 2, type: 'error', text: 'DevTools error' },
      ];

      const filtered = monitor.filterErrors(messages);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].text).toBe('Error');
    });
  });

  describe('getErrorCategories', () => {
    it('should return unique categories', () => {
      const messages: ConsoleMessage[] = [
        { msgid: 1, type: 'error', text: 'Failed to fetch' },
        { msgid: 2, type: 'error', text: 'Network error' },
        { msgid: 3, type: 'error', text: 'Cannot read property' },
      ];

      const categories = monitor.getErrorCategories(messages);

      expect(categories).toContain('Network');
      expect(categories).toContain('Javascript');
      expect(categories).toHaveLength(2);
    });
  });

  describe('singleton functions', () => {
    it('should return same instance', () => {
      const instance1 = getConsoleMonitor();
      const instance2 = getConsoleMonitor();

      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = getConsoleMonitor();
      resetConsoleMonitor();
      const instance2 = getConsoleMonitor();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('utility functions', () => {
    it('should process messages with utility function', () => {
      const messages: ConsoleMessage[] = [
        { msgid: 1, type: 'error', text: 'Error' },
      ];

      const result = processConsoleMessages(messages);

      expect(result.hasErrors).toBe(true);
    });

    it('should check errors with utility function', () => {
      const messages: ConsoleMessage[] = [
        { msgid: 1, type: 'error', text: 'Error' },
      ];

      const result = hasConsoleErrors(messages);

      expect(result).toBe(true);
    });

    it('should format errors with utility function', () => {
      const messages: ConsoleMessage[] = [
        { msgid: 1, type: 'error', text: 'Error' },
      ];

      const formatted = formatConsoleErrors(messages);

      expect(formatted).toContain('Console Errors');
    });
  });
});
