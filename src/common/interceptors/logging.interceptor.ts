import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { RequestLogService } from '../services/request-log.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly requestLogService: RequestLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, body, headers, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.logger.log(
            `${method} ${url} ${statusCode} - ${duration}ms - ${userAgent}`,
          );

          this.requestLogService
            .saveLog({
              method,
              url,
              statusCode,
              requestBody: Object.keys(body || {}).length > 0 ? body : null,
              responseBody: responseBody ?? null,
              headers: this.sanitizeHeaders(headers),
              ip: ip || request.socket?.remoteAddress || undefined,
              userAgent,
              duration,
            })
            .catch(() => {});
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(
            `${method} ${url} ${statusCode} - ${duration}ms - ${error.message}`,
          );

          this.requestLogService
            .saveLog({
              method,
              url,
              statusCode,
              requestBody: Object.keys(body || {}).length > 0 ? body : null,
              responseBody: { error: error.message },
              headers: this.sanitizeHeaders(headers),
              ip: ip || request.socket?.remoteAddress || undefined,
              userAgent,
              duration,
            })
            .catch(() => {});
        },
      }),
    );
  }

  private sanitizeHeaders(
    headers: Record<string, any>,
  ): Record<string, string> {
    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'cookie', 'set-cookie'];
    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
