"use client"

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, any>
  timestamp: Date
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  error?: Error
}

export class Logger {
  private static instance: Logger
  private logLevel: LogLevel = LogLevel.INFO
  private sessionId: string
  private userId?: string
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private constructor() {
    this.sessionId = this.generateSessionId()

    // Set log level based on environment
    if (typeof window !== "undefined") {
      this.logLevel = process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.WARN
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      error,
    }
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output for development
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      const prefix = `[v0:${LogLevel[entry.level]}]`
      const logData = {
        message: entry.message,
        context: entry.context,
        userId: entry.userId,
        component: entry.component,
        action: entry.action,
        timestamp: entry.timestamp.toISOString(),
      }

      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(prefix, logData)
          break
        case LogLevel.INFO:
          console.log(prefix, logData)
          break
        case LogLevel.WARN:
          console.warn(prefix, logData)
          break
        case LogLevel.ERROR:
          console.error(prefix, logData, entry.error)
          break
      }
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog(this.createLogEntry(LogLevel.DEBUG, message, context))
    }
  }

  info(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog(this.createLogEntry(LogLevel.INFO, message, context))
    }
  }

  warn(message: string, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog(this.createLogEntry(LogLevel.WARN, message, context))
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog(this.createLogEntry(LogLevel.ERROR, message, context, error))
    }
  }

  // Specialized logging methods for common patterns
  userAction(action: string, userId: string, context?: Record<string, any>) {
    this.info(`User action: ${action}`, { ...context, userId, action })
  }

  apiCall(endpoint: string, method: string, context?: Record<string, any>) {
    this.debug(`API call: ${method} ${endpoint}`, { ...context, endpoint, method })
  }

  apiError(endpoint: string, method: string, error: Error, context?: Record<string, any>) {
    this.error(`API error: ${method} ${endpoint}`, error, { ...context, endpoint, method })
  }

  componentError(component: string, error: Error, context?: Record<string, any>) {
    this.error(`Component error in ${component}`, error, { ...context, component })
  }

  authEvent(event: string, userId?: string, context?: Record<string, any>) {
    this.info(`Auth event: ${event}`, { ...context, userId, event, authEvent: true })
  }

  businessLogic(operation: string, context?: Record<string, any>) {
    this.info(`Business operation: ${operation}`, { ...context, operation, businessLogic: true })
  }

  // Get logs for debugging or reporting
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter((log) => log.level >= level)
    }
    return [...this.logs]
  }

  // Clear logs (useful for testing or memory management)
  clearLogs() {
    this.logs = []
  }

  // Export logs for external monitoring services
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Singleton instance
export const logger = Logger.getInstance()

// Convenience functions for common use cases
export const logUserAction = (action: string, userId: string, context?: Record<string, any>) =>
  logger.userAction(action, userId, context)

export const logApiCall = (endpoint: string, method: string, context?: Record<string, any>) =>
  logger.apiCall(endpoint, method, context)

export const logApiError = (endpoint: string, method: string, error: Error, context?: Record<string, any>) =>
  logger.apiError(endpoint, method, error, context)

export const logComponentError = (component: string, error: Error, context?: Record<string, any>) =>
  logger.componentError(component, error, context)

export const logAuthEvent = (event: string, userId?: string, context?: Record<string, any>) =>
  logger.authEvent(event, userId, context)

export const logBusinessLogic = (operation: string, context?: Record<string, any>) =>
  logger.businessLogic(operation, context)
