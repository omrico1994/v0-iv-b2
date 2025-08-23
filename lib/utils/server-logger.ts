export enum ServerLogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface ServerLogEntry {
  level: ServerLogLevel
  message: string
  context?: Record<string, any>
  timestamp: Date
  userId?: string
  action?: string
  error?: Error
  component?: string
}

class ServerLogger {
  private logLevel: ServerLogLevel = ServerLogLevel.INFO

  constructor() {
    // Set log level based on environment
    this.logLevel = process.env.NODE_ENV === "development" ? ServerLogLevel.DEBUG : ServerLogLevel.WARN
  }

  private shouldLog(level: ServerLogLevel): boolean {
    return level >= this.logLevel
  }

  private createLogEntry(
    level: ServerLogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
  ): ServerLogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date(),
      error,
    }
  }

  private outputLog(entry: ServerLogEntry) {
    const prefix = `[v0:${ServerLogLevel[entry.level]}]`
    const logData = {
      message: entry.message,
      context: entry.context,
      userId: entry.userId,
      component: entry.component,
      action: entry.action,
      timestamp: entry.timestamp.toISOString(),
    }

    switch (entry.level) {
      case ServerLogLevel.DEBUG:
        console.debug(prefix, logData)
        break
      case ServerLogLevel.INFO:
        console.log(prefix, logData)
        break
      case ServerLogLevel.WARN:
        console.warn(prefix, logData)
        break
      case ServerLogLevel.ERROR:
        console.error(prefix, logData, entry.error)
        break
    }

    // In production, you would send this to an external logging service
    if (process.env.NODE_ENV === "production" && entry.level >= ServerLogLevel.ERROR) {
      // Example: Send to external monitoring service
      // await sendToMonitoringService(entry)
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.shouldLog(ServerLogLevel.DEBUG)) {
      this.outputLog(this.createLogEntry(ServerLogLevel.DEBUG, message, context))
    }
  }

  info(message: string, context?: Record<string, any>) {
    if (this.shouldLog(ServerLogLevel.INFO)) {
      this.outputLog(this.createLogEntry(ServerLogLevel.INFO, message, context))
    }
  }

  warn(message: string, context?: Record<string, any>) {
    if (this.shouldLog(ServerLogLevel.WARN)) {
      this.outputLog(this.createLogEntry(ServerLogLevel.WARN, message, context))
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    if (this.shouldLog(ServerLogLevel.ERROR)) {
      this.outputLog(this.createLogEntry(ServerLogLevel.ERROR, message, context, error))
    }
  }

  // Specialized logging methods for server actions
  serverAction(action: string, userId?: string, context?: Record<string, any>) {
    this.info(`Server action: ${action}`, { ...context, userId, action, serverAction: true })
  }

  serverActionError(action: string, error: Error, userId?: string, context?: Record<string, any>) {
    this.error(`Server action error: ${action}`, error, { ...context, userId, action, serverAction: true })
  }

  databaseOperation(operation: string, table: string, context?: Record<string, any>) {
    this.debug(`Database operation: ${operation} on ${table}`, { ...context, operation, table, database: true })
  }

  databaseError(operation: string, table: string, error: Error, context?: Record<string, any>) {
    this.error(`Database error: ${operation} on ${table}`, error, { ...context, operation, table, database: true })
  }

  authOperation(operation: string, userId?: string, context?: Record<string, any>) {
    this.info(`Auth operation: ${operation}`, { ...context, userId, operation, auth: true })
  }

  authError(operation: string, error: Error, userId?: string, context?: Record<string, any>) {
    this.error(`Auth error: ${operation}`, error, { ...context, userId, operation, auth: true })
  }

  businessLogic(operation: string, userId?: string, context?: Record<string, any>) {
    this.info(`Business logic: ${operation}`, { ...context, userId, operation, business: true })
  }

  businessError(operation: string, error: Error, userId?: string, context?: Record<string, any>) {
    this.error(`Business logic error: ${operation}`, error, { ...context, userId, operation, business: true })
  }
}

// Singleton instance for server-side logging
export const serverLogger = new ServerLogger()

// Convenience functions
export const logServerAction = (action: string, userId?: string, context?: Record<string, any>) =>
  serverLogger.serverAction(action, userId, context)

export const logServerActionError = (action: string, error: Error, userId?: string, context?: Record<string, any>) =>
  serverLogger.serverActionError(action, error, userId, context)

export const logDatabaseOperation = (operation: string, table: string, context?: Record<string, any>) =>
  serverLogger.databaseOperation(operation, table, context)

export const logDatabaseError = (operation: string, table: string, error: Error, context?: Record<string, any>) =>
  serverLogger.databaseError(operation, table, error, context)

export const logAuthOperation = (operation: string, userId?: string, context?: Record<string, any>) =>
  serverLogger.authOperation(operation, userId, context)

export const logAuthError = (operation: string, error: Error, userId?: string, context?: Record<string, any>) =>
  serverLogger.authError(operation, error, userId, context)

export const logBusinessLogic = (operation: string, userId?: string, context?: Record<string, any>) =>
  serverLogger.businessLogic(operation, userId, context)

export const logBusinessError = (operation: string, error: Error, userId?: string, context?: Record<string, any>) =>
  serverLogger.businessError(operation, error, userId, context)
