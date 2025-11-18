import { Kafka, Producer } from 'kafkajs';
import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';

export interface PasswordEventData {
  id: number;
  title: string;
  username: string;
  url?: string;
  category: string;
}

export interface PasswordEvent {
  eventId: string;
  type: string;
  at: string;
  schemaVersion: string;
  data: PasswordEventData;
}

class KafkaProducerService {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
    const clientId = process.env.KAFKA_CLIENT_ID || 'password-service';

    this.kafka = new Kafka({
      clientId,
      brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false,
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000,
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect Kafka producer:', error);
    }
  }

  async publishPasswordCreated(data: PasswordEventData): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    const topic = process.env.KAFKA_TOPIC_PASSWORD_EVENTS || 'passwords.v1.events';

    const event: PasswordEvent = {
      eventId: randomUUID(),
      type: 'password.created',
      at: new Date().toISOString(),
      schemaVersion: '1',
      data: {
        id: data.id,
        title: data.title,
        username: data.username,
        url: data.url,
        category: data.category,
      },
    };

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: data.id.toString(),
            value: JSON.stringify(event),
            headers: {
              'event-type': event.type,
              'schema-version': event.schemaVersion,
            },
          },
        ],
      });

      this.logger.log(`Published event: ${event.type} with eventId: ${event.eventId}`);
    } catch (error) {
      this.logger.error(`Failed to publish event ${event.type}:`, error);
      throw error;
    }
  }

  async publishPasswordUpdated(data: PasswordEventData): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    const topic = process.env.KAFKA_TOPIC_PASSWORD_EVENTS || 'passwords.v1.events';

    const event: PasswordEvent = {
      eventId: randomUUID(),
      type: 'password.updated',
      at: new Date().toISOString(),
      schemaVersion: '1',
      data: {
        id: data.id,
        title: data.title,
        username: data.username,
        url: data.url,
        category: data.category,
      },
    };

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: data.id.toString(),
            value: JSON.stringify(event),
            headers: {
              'event-type': event.type,
              'schema-version': event.schemaVersion,
            },
          },
        ],
      });

      this.logger.log(`Published event: ${event.type} with eventId: ${event.eventId}`);
    } catch (error) {
      this.logger.error(`Failed to publish event ${event.type}:`, error);
      throw error;
    }
  }

  async publishPasswordDeleted(id: number): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    const topic = process.env.KAFKA_TOPIC_PASSWORD_EVENTS || 'passwords.v1.events';

    const event: PasswordEvent = {
      eventId: randomUUID(),
      type: 'password.deleted',
      at: new Date().toISOString(),
      schemaVersion: '1',
      data: {
        id,
        title: '',
        username: '',
        category: '',
      },
    };

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: id.toString(),
            value: JSON.stringify(event),
            headers: {
              'event-type': event.type,
              'schema-version': event.schemaVersion,
            },
          },
        ],
      });

      this.logger.log(`Published event: ${event.type} with eventId: ${event.eventId}`);
    } catch (error) {
      this.logger.error(`Failed to publish event ${event.type}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const kafkaProducer = new KafkaProducerService();

