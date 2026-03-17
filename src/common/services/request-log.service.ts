import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RequestLogData {
  method: string;
  url: string;
  statusCode: number;
  requestBody?: any;
  responseBody?: any;
  headers?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  duration: number;
}

@Injectable()
export class RequestLogService {
  private readonly logger = new Logger(RequestLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async saveLog(data: RequestLogData): Promise<void> {
    try {
      await this.prisma.requestLog.create({
        data: {
          method: data.method,
          url: data.url,
          statusCode: data.statusCode,
          requestBody: data.requestBody ?? undefined,
          responseBody: data.responseBody ?? undefined,
          headers: data.headers ?? undefined,
          ip: data.ip ?? null,
          userAgent: data.userAgent ?? null,
          duration: data.duration,
        },
      });
    } catch (error) {
      this.logger.error(`Falha ao salvar log no banco: ${error.message}`);
    }
  }
}
