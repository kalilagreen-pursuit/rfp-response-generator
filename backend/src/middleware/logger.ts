import { Request, Response, NextFunction } from 'express';

/**
 * Request/Response Logging Middleware
 * Logs all API requests for debugging and monitoring
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// HTTP method colors
const methodColors: Record<string, string> = {
  GET: colors.green,
  POST: colors.yellow,
  PUT: colors.blue,
  DELETE: colors.red,
  PATCH: colors.magenta,
};

// Status code colors
function getStatusColor(status: number): string {
  if (status >= 500) return colors.red;
  if (status >= 400) return colors.yellow;
  if (status >= 300) return colors.cyan;
  if (status >= 200) return colors.green;
  return colors.reset;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log request
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const methodColor = methodColors[method] || colors.reset;

  // Store original end function
  const originalEnd = res.end;

  // Override res.end to capture response
  res.end = function(chunk?: any, encoding?: any, callback?: any): Response {
    // Restore original end function
    res.end = originalEnd;

    // Calculate response time
    const responseTime = Date.now() - startTime;
    const status = res.statusCode;
    const statusColor = getStatusColor(status);

    // Log response
    const userAgent = req.get('user-agent') || 'unknown';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Format log message
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
      `${methodColor}${method}${colors.reset} ` +
      `${url} ` +
      `${statusColor}${status}${colors.reset} ` +
      `${colors.dim}${responseTime}ms${colors.reset}` +
      (process.env.NODE_ENV === 'development' ? ` ${colors.dim}(${ip})${colors.reset}` : '')
    );

    // Log errors with additional details
    if (status >= 400) {
      console.error(
        `${colors.red}ERROR DETAILS:${colors.reset} ` +
        `${method} ${url} ` +
        `Status: ${status} ` +
        `IP: ${ip} ` +
        `User-Agent: ${userAgent}`
      );
    }

    // Call original end function
    return originalEnd.call(this, chunk, encoding, callback) as Response;
  };

  next();
}

/**
 * Error logger middleware
 * Logs detailed error information
 */
export function errorLogger(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.get('user-agent') || 'unknown';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  // Log error details
  console.error('\n' + colors.red + colors.bright + '═══ ERROR ═══' + colors.reset);
  console.error(`${colors.dim}Time:${colors.reset} ${timestamp}`);
  console.error(`${colors.dim}Endpoint:${colors.reset} ${method} ${url}`);
  console.error(`${colors.dim}IP:${colors.reset} ${ip}`);
  console.error(`${colors.dim}User-Agent:${colors.reset} ${userAgent}`);
  console.error(`${colors.dim}Error:${colors.reset} ${err.message}`);

  if (process.env.NODE_ENV === 'development' && err.stack) {
    console.error(`${colors.dim}Stack Trace:${colors.reset}`);
    console.error(err.stack);
  }

  console.error(colors.red + '═══════════' + colors.reset + '\n');

  // Pass error to next error handler
  next(err);
}

/**
 * Performance monitoring
 * Logs slow requests for optimization
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const slowThreshold = 1000; // 1 second

    if (responseTime > slowThreshold) {
      console.warn(
        `${colors.yellow}⚠️  SLOW REQUEST:${colors.reset} ` +
        `${req.method} ${req.originalUrl} ` +
        `took ${responseTime}ms`
      );
    }
  });

  next();
}
