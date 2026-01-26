// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

/**
 * Chrome DevTools MCP Adapter
 *
 * Typed wrapper for chrome-devtools MCP server calls.
 * Provides a clean interface for browser automation operations.
 */

import { DeterministicSelector } from '../types';

/**
 * Navigation options
 */
export interface NavigationOptions {
  /** URL to navigate to */
  url: string;
  /** Navigation type */
  type?: 'url' | 'back' | 'forward' | 'reload';
  /** Whether to ignore cache on reload */
  ignoreCache?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Click options
 */
export interface ClickOptions {
  /** Element UID from snapshot */
  uid: string;
  /** Human-readable description */
  element?: string;
  /** Mouse button */
  button?: 'left' | 'right' | 'middle';
  /** Whether to double-click */
  doubleClick?: boolean;
}

/**
 * Fill options
 */
export interface FillOptions {
  /** Element UID from snapshot */
  uid: string;
  /** Value to fill */
  value: string;
}

/**
 * Wait options
 */
export interface WaitOptions {
  /** Text to wait for */
  text?: string;
  /** Text to wait for disappearance */
  textGone?: string;
  /** Time to wait in seconds */
  time?: number;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Screenshot options
 */
export interface ScreenshotOptions {
  /** Element UID for element screenshot */
  uid?: string;
  /** Element description */
  element?: string;
  /** Whether to capture full page */
  fullPage?: boolean;
  /** Output file path */
  filename?: string;
  /** Image format */
  type?: 'png' | 'jpeg';
}

/**
 * Form field for bulk fill
 */
export interface FormFieldInput {
  /** Element UID */
  ref: string;
  /** Field name */
  name: string;
  /** Field type */
  type: 'textbox' | 'checkbox' | 'radio' | 'combobox' | 'slider';
  /** Value to fill */
  value: string;
}

/**
 * Snapshot element from accessibility tree
 */
export interface SnapshotElement {
  /** Element UID */
  uid: string;
  /** Element role */
  role: string;
  /** Element name */
  name?: string;
  /** Element value */
  value?: string;
  /** Element description */
  description?: string;
  /** Whether element is focused */
  focused?: boolean;
  /** Element children */
  children?: SnapshotElement[];
}

/**
 * Page snapshot result
 */
export interface PageSnapshot {
  /** Raw snapshot text */
  raw: string;
  /** Parsed elements */
  elements: SnapshotElement[];
  /** Current URL */
  url?: string;
  /** Page title */
  title?: string;
}

/**
 * Page info
 */
export interface PageInfo {
  /** Page index */
  index: number;
  /** Page URL */
  url: string;
  /** Page title */
  title: string;
  /** Whether page is selected */
  selected?: boolean;
}

/**
 * Network request info
 */
export interface NetworkRequest {
  /** Request ID */
  reqid: number;
  /** Request URL */
  url: string;
  /** Request method */
  method: string;
  /** Response status */
  status?: number;
  /** Resource type */
  resourceType: string;
}

/**
 * Console message info
 */
export interface ConsoleMessage {
  /** Message ID */
  msgid: number;
  /** Message type */
  type: string;
  /** Message text */
  text: string;
  /** Source URL */
  source?: string;
  /** Line number */
  line?: number;
}

/**
 * Chrome DevTools MCP Adapter
 *
 * Provides typed interfaces and parameter builders for chrome-devtools MCP server operations.
 *
 * ## Architecture Notes
 * - This adapter does NOT make MCP calls directly
 * - It provides parameter builders that generate correctly-typed inputs for MCP tools
 * - Claude (the AI assistant) executes the actual MCP calls using mcp__chrome-devtools__* tools
 * - Tab management is handled automatically by the chrome-devtools MCP server
 *   (defaults to active tab when tabId not specified)
 *
 * ## Key Capabilities
 * - **Navigation**: Page navigation, forward/back, reload
 * - **Element Interaction**: Click, fill, hover, select (all use element UIDs from snapshots)
 * - **Snapshots**: Capture accessibility tree state for analysis
 * - **Network Monitoring**: Track API requests and responses (NEW)
 * - **Console Monitoring**: Detect JavaScript errors and warnings (NEW)
 * - **Dialog Handling**: Accept/dismiss browser alerts and prompts (NEW)
 *
 * ## Migration from claude-in-chrome
 * - All coordinate-based clicks migrated to UID-based element references
 * - Tab management simplified (server defaults to active tab)
 * - New capabilities added: network debugging, console monitoring, dialog handling
 *
 * @example
 * // Build navigation parameters
 * const params = ChromeDevToolsAdapter.buildNavigationParams({
 *   url: 'https://example.com',
 *   timeout: 30000
 * });
 * // Claude then calls: mcp__chrome-devtools__navigate_page with params
 *
 * @example
 * // Build click parameters using element UID from snapshot
 * const clickParams = ChromeDevToolsAdapter.buildClickParams({
 *   uid: '123',
 *   element: 'Submit button'
 * });
 * // Claude then calls: mcp__chrome-devtools__click with clickParams
 */
export class ChromeDevToolsAdapter {
  /**
   * Build navigation parameters for mcp__chrome-devtools__navigate_page
   *
   * @param options - Navigation options including URL, type, and timeout
   * @returns Parameter object ready for MCP tool execution
   *
   * @example
   * const params = ChromeDevToolsAdapter.buildNavigationParams({
   *   url: 'https://f5-console.com/web/workspaces/web-app-and-api-protection',
   *   type: 'url',
   *   timeout: 30000
   * });
   */
  static buildNavigationParams(options: NavigationOptions): Record<string, unknown> {
    return {
      url: options.url,
      type: options.type ?? 'url',
      ignoreCache: options.ignoreCache,
      timeout: options.timeout,
    };
  }

  /**
   * Build click parameters for mcp__chrome-devtools__click
   *
   * Prefers element UID references over coordinates for reliability.
   * UIDs come from accessibility tree snapshots (mcp__chrome-devtools__take_snapshot).
   *
   * @param options - Click options with element UID and optional button type
   * @returns Parameter object for MCP click tool
   *
   * @example
   * const params = ChromeDevToolsAdapter.buildClickParams({
   *   uid: '42',
   *   element: 'Save button',
   *   button: 'left'
   * });
   * // Claude calls: mcp__chrome-devtools__click with params
   */
  static buildClickParams(options: ClickOptions): Record<string, unknown> {
    return {
      uid: options.uid,
      element: options.element ?? `Element ${options.uid}`,
      button: options.button,
      doubleClick: options.doubleClick,
    };
  }

  /**
   * Build click parameters from a deterministic selector
   *
   * Alternative to UID-based clicks when working with selector-based targeting.
   *
   * @param selector - Deterministic selector (name, aria-label, text-match, etc.)
   * @param description - Human-readable element description
   * @returns Parameter object for MCP click tool
   */
  static buildClickFromSelector(
    selector: DeterministicSelector,
    description?: string
  ): Record<string, unknown> {
    return {
      ref: selector.value,
      element: description ?? `Element with ${selector.type}: ${selector.value}`,
    };
  }

  /**
   * Build fill parameters for mcp__chrome-devtools__fill
   *
   * Used to populate text inputs, textareas, and searchboxes.
   *
   * @param options - Fill options with element UID and value
   * @returns Parameter object for MCP fill tool
   *
   * @example
   * const params = ChromeDevToolsAdapter.buildFillParams({
   *   uid: '15',
   *   value: 'my-origin-pool'
   * });
   */
  static buildFillParams(options: FillOptions): Record<string, unknown> {
    return {
      uid: options.uid,
      value: options.value,
    };
  }

  /**
   * Build wait parameters
   */
  static buildWaitParams(options: WaitOptions): Record<string, unknown> {
    const params: Record<string, unknown> = {};

    if (options.text) params.text = options.text;
    if (options.textGone) params.textGone = options.textGone;
    if (options.time) params.time = options.time;

    return params;
  }

  /**
   * Build screenshot parameters
   */
  static buildScreenshotParams(options: ScreenshotOptions): Record<string, unknown> {
    return {
      uid: options.uid,
      element: options.element,
      fullPage: options.fullPage,
      filePath: options.filename,
      format: options.type,
    };
  }

  /**
   * Build form fill parameters for multiple fields
   */
  static buildFormFillParams(fields: FormFieldInput[]): Record<string, unknown> {
    return {
      elements: fields.map(field => ({
        uid: field.ref,
        value: field.value,
      })),
    };
  }

  /**
   * Build evaluate script parameters
   */
  static buildEvaluateParams(
    script: string,
    elementUid?: string
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {
      function: script,
    };

    if (elementUid) {
      params.element = `Element ${elementUid}`;
      params.ref = elementUid;
    }

    return params;
  }

  /**
   * Build select option parameters
   */
  static buildSelectParams(
    uid: string,
    values: string[],
    description?: string
  ): Record<string, unknown> {
    return {
      ref: uid,
      element: description ?? `Select ${uid}`,
      values,
    };
  }

  /**
   * Build hover parameters
   */
  static buildHoverParams(uid: string, description?: string): Record<string, unknown> {
    return {
      ref: uid,
      element: description ?? `Element ${uid}`,
    };
  }

  /**
   * Build key press parameters
   */
  static buildKeyPressParams(key: string): Record<string, unknown> {
    return { key };
  }

  /**
   * Build type parameters
   */
  static buildTypeParams(
    uid: string,
    text: string,
    options?: { slowly?: boolean; submit?: boolean }
  ): Record<string, unknown> {
    return {
      ref: uid,
      element: `Element ${uid}`,
      text,
      slowly: options?.slowly,
      submit: options?.submit,
    };
  }

  /**
   * Parse raw snapshot text into structured elements
   * This is a simplified parser - the actual parsing happens in snapshot-parser.ts
   */
  static parseSnapshotPreview(raw: string): string[] {
    // Extract element identifiers from snapshot text
    const elements: string[] = [];
    const uidPattern = /\[(\d+)\]/g;
    let match;

    while ((match = uidPattern.exec(raw)) !== null) {
      elements.push(match[1]);
    }

    return elements;
  }

  /**
   * Format MCP tool name
   */
  static getToolName(action: string): string {
    return `mcp__chrome-devtools__${action}`;
  }

  /**
   * Get the list of available MCP tools
   */
  static getAvailableTools(): string[] {
    return [
      'navigate_page',
      'take_snapshot',
      'take_screenshot',
      'click',
      'fill',
      'fill_form',
      'hover',
      'select_option',
      'press_key',
      'browser_type',
      'wait_for',
      'evaluate_script',
      'list_pages',
      'select_page',
      'new_page',
      'close_page',
      'list_network_requests',
      'get_network_request',
      'list_console_messages',
      'get_console_message',
      'handle_dialog',
      'drag',
      'resize_page',
      'emulate',
    ];
  }
}

/**
 * Helper type for MCP tool response
 */
export interface MCPToolResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a navigation instruction for Claude
 */
export function createNavigationInstruction(url: string): string {
  return `Navigate to ${url} using mcp__chrome-devtools__navigate_page`;
}

/**
 * Create a click instruction for Claude
 */
export function createClickInstruction(uid: string, description: string): string {
  return `Click on ${description} (uid: ${uid}) using mcp__chrome-devtools__click`;
}

/**
 * Create a fill instruction for Claude
 */
export function createFillInstruction(uid: string, value: string): string {
  return `Fill ${uid} with "${value}" using mcp__chrome-devtools__fill`;
}

/**
 * Create a snapshot instruction for Claude
 */
export function createSnapshotInstruction(): string {
  return 'Take a page snapshot using mcp__chrome-devtools__take_snapshot to see current page state';
}

/**
 * Create a wait instruction for Claude
 */
export function createWaitInstruction(condition: string): string {
  return `Wait for ${condition} using mcp__chrome-devtools__wait_for`;
}
