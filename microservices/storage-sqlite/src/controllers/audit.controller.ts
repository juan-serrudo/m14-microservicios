import { Controller, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditPasswordEvents } from '../entities/audit-password-events.entity';
import { ApiKeyGuard } from '../guards/api-key.guard';

@ApiTags('AUDITORÍA - EVENTOS')
@ApiSecurity('X-API-Key')
@Controller('api/v1/audit/password-events')
@UseGuards(ApiKeyGuard)
export class AuditController {
  constructor(
    @InjectRepository(AuditPasswordEvents)
    private auditRepository: Repository<AuditPasswordEvents>,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todos los eventos de auditoría',
    description: 'Retorna todos los eventos de contraseñas procesados desde Kafka',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo de evento' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados', type: 'number' })
  @ApiResponse({ status: 200, description: 'Lista de eventos obtenida exitosamente' })
  async findAll(
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const queryBuilder = this.auditRepository.createQueryBuilder('audit');

    if (type) {
      queryBuilder.where('audit.type = :type', { type });
    }

    queryBuilder.orderBy('audit.receivedAt', 'DESC');

    if (limit) {
      queryBuilder.limit(parseInt(limit, 10) || 100);
    }

    const events = await queryBuilder.getMany();

    return {
      data: events.map((event) => ({
        id: event.id,
        eventId: event.eventId,
        type: event.type,
        occurredAt: event.occurredAt,
        receivedAt: event.receivedAt,
        payload: JSON.parse(event.payload),
        error: event.error,
      })),
    };
  }

  @Get(':eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un evento por eventId',
    description: 'Retorna un evento específico por su eventId',
  })
  @ApiParam({ name: 'eventId', description: 'ID del evento', type: 'string' })
  @ApiResponse({ status: 200, description: 'Evento obtenido exitosamente' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  async findOne(@Param('eventId') eventId: string) {
    const event = await this.auditRepository.findOne({
      where: { eventId },
    });

    if (!event) {
      return {
        error: {
          code: 'NOT_FOUND',
          message: 'Evento no encontrado',
          traceId: '',
          retryable: false,
        },
      };
    }

    return {
      data: {
        id: event.id,
        eventId: event.eventId,
        type: event.type,
        occurredAt: event.occurredAt,
        receivedAt: event.receivedAt,
        payload: JSON.parse(event.payload),
        error: event.error,
      },
    };
  }

  @Get('stats/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas de eventos',
    description: 'Retorna un resumen de eventos por tipo',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente' })
  async getStats() {
    const stats = await this.auditRepository
      .createQueryBuilder('audit')
      .select('audit.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.type')
      .getRawMany();

    const total = await this.auditRepository.count();
    
    // Contar eventos con error (DLQ)
    const errors = await this.auditRepository
      .createQueryBuilder('audit')
      .where('audit.error IS NOT NULL')
      .andWhere("audit.error != ''")
      .getCount();

    return {
      data: {
        total,
        errors,
        byType: stats.map((stat: any) => ({
          type: stat.type,
          count: parseInt(stat.count, 10),
        })),
      },
    };
  }
}

