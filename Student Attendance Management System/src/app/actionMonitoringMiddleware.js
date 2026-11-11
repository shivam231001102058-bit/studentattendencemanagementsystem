const monitoredPrefixes = ['students/', 'attendance/', 'subjects/']

export function createActionMonitoringMiddleware({
  enabled = import.meta.env.DEV,
  logger = console,
  now = () => new Date(),
} = {}) {
  return () => (next) => (action) => {
    const result = next(action)
    if (
      enabled &&
      typeof action.type === 'string' &&
      monitoredPrefixes.some((prefix) => action.type.startsWith(prefix))
    ) {
      logger.info('Redux action', {
        type: action.type,
        timestamp: now().toISOString(),
      })
    }
    return result
  }
}
