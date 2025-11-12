import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditPasswordEvents } from '../entities/audit-password-events.entity';

export interface PasswordEvent {
  eventId: string;
  type: string;
  at: string;
  schemaVersion: string;
  data: any;
}

class KafkaConsumerService {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private isRunning = false;
  private auditRepository: Repository<AuditPasswordEvents>;

  constructor(auditRepository: Repository<AuditPasswordEvents>) {
    const brokers = (process.env.KAFKA_BROKERS || 'kafka:9093').split(',');
    const clientId = process.env.KAFKA_CLIENT_ID || 'storage-sqlite';
    const groupId = process.env.KAFKA_GROUP_ID || 'storage-sqlite-group';

    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxInFlightRequests: 1,
      allowAutoTopicCreation: false,
    });

    this.auditRepository = auditRepository;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      const topic = process.env.KAFKA_TOPIC_PASSWORD_EVENTS || 'passwords.v1.events';

      await this.consumer.connect();
      this.logger.log(`Kafka consumer connected to brokers`);

      await this.consumer.subscribe({ topic, fromBeginning: false });
      this.logger.log(`Kafka consumer subscribed to topic: ${topic}`);

      // Iniciar el consumer (run ejecuta en background, no bloquea)
      this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.processMessage(payload);
        },
      }).catch((error) => {
        this.logger.error('Error in consumer run loop:', error);
      });

      this.isRunning = true;
      this.logger.log('Kafka consumer started successfully');
    } catch (error) {
      this.logger.error('Failed to start Kafka consumer:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.consumer.disconnect();
      this.isRunning = false;
      this.logger.log('Kafka consumer stopped');
    } catch (error) {
      this.logger.error('Failed to stop Kafka consumer:', error);
    }
  }

  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;
    const offset = message.offset;
    const timestamp = message.timestamp || Date.now().toString();

    this.logger.log(
      `Received message from topic: ${topic}, partition: ${partition}, offset: ${offset}`,
    );

    try {
      if (!message.value) {
        this.logger.warn('Message value is null, skipping');
        return;
      }

      const eventStr = message.value.toString();
      const event: PasswordEvent = JSON.parse(eventStr);

      // Validar evento
      if (!event.eventId || !event.type || !event.at || !event.schemaVersion) {
        throw new Error('Invalid event format: missing required fields');
      }

      // Verificar idempotencia: buscar si el evento ya fue procesado
      const existingEvent = await this.auditRepository.findOne({
        where: { eventId: event.eventId },
      });

      if (existingEvent) {
        this.logger.warn(
          `Event ${event.eventId} already processed, skipping (idempotency check)`,
        );
        return;
      }

      // Guardar evento en auditoría
      const auditEvent = this.auditRepository.create({
        eventId: event.eventId,
        type: event.type,
        occurredAt: new Date(event.at),
        payload: eventStr,
        receivedAt: new Date(),
      });

      await this.auditRepository.save(auditEvent);

      this.logger.log(
        `Successfully processed event: ${event.type} (eventId: ${event.eventId}, passwordId: ${event.data?.id})`,
      );
    } catch (error) {
      this.logger.error(`Error processing message from topic ${topic}:`, error);

      // DLQ: Guardar evento fallido con error
      try {
        const errorPayload = message.value?.toString() || '{}';
        const dlqEvent = this.auditRepository.create({
          eventId: `dlq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'dlq.error',
          occurredAt: new Date(timestamp),
          payload: errorPayload,
          receivedAt: new Date(),
          error: error instanceof Error ? error.message : String(error),
        });

        await this.auditRepository.save(dlqEvent);
        this.logger.log(`Saved failed message to DLQ with eventId: ${dlqEvent.eventId}`);
      } catch (dlqError) {
        this.logger.error('Failed to save message to DLQ:', dlqError);
      }
    }
  }
}

export { KafkaConsumerService };

