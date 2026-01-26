// Copyright (c) 2026 Robin Mordasiewicz. MIT License.

import { ExtractionError } from '../errors/extraction-errors';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

export class LoggerService {
  private static instance: LoggerService;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];

  private constructor() {}

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  logError(error: unknown, context?: Record<string, any>): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    this.log(LogLevel.ERROR, errorObj.message, {
      ...context,
      stack: errorObj.stack,
    });
  }

  startExtraction(resourceType: string, namespace: string): void {
    this.info('Starting extraction', { resourceType, namespace, phase: 'start' });
  }

  completeExtraction(resourceType: string, result: any): void {
    this.info('Extraction complete', {
      resourceType,
      phase: 'complete',
      coverage: result.coverage?.percentage,
      fieldsDetected: result.formFields?.length,
    });
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    this.logs.push(entry);
    this.output(entry);
  }

  private output(entry: LogEntry): void {
    const prefix = this.getLevelPrefix(entry.level);
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    console.log(`${prefix} ${entry.message}${contextStr}`);
  }

  private getLevelPrefix(level: LogLevel): string {
    const prefixes = {
      [LogLevel.DEBUG]: '[DEBUG]',
      [LogLevel.INFO]: '[INFO]',
      [LogLevel.WARN]: '[WARN]',
      [LogLevel.ERROR]: '[ERROR]',
    };
    return prefixes[level];
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}
