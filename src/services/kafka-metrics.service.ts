import { Injectable, OnModuleInit } from "@nestjs/common";
import { Counter, Histogram } from "prom-client";
import PrometheusService from "src/main/prometheus.service";

/**
 * Сервис для работы с Kafka метриками
 * Предоставляет готовые методы для записи Kafka метрик
 */
@Injectable()
export default class KafkaMetricsService implements OnModuleInit {
	private kafkaMessagesTotal!: Counter;
	private kafkaMessageDuration!: Histogram;
	private kafkaErrorsTotal!: Counter;

	constructor(private readonly prometheusService: PrometheusService) {}

	onModuleInit() {
		// Создаем метрики при инициализации модуля
		this.kafkaMessagesTotal = this.prometheusService.createCounter({
			name: "kafka_messages_total",
			help: "Total number of Kafka messages processed",
			labelNames: ["topic", "command_type", "status"],
		});

		this.kafkaMessageDuration = this.prometheusService.createHistogram({
			name: "kafka_message_duration_seconds",
			help: "Duration of Kafka message processing in seconds",
			labelNames: ["topic", "command_type"],
			buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
		});

		this.kafkaErrorsTotal = this.prometheusService.createCounter({
			name: "kafka_errors_total",
			help: "Total number of Kafka processing errors",
			labelNames: ["topic", "command_type", "error_type"],
		});
	}

	// Записать метрики для обработанного Kafka сообщения
	recordKafkaMessage(topic: string, commandType: string, status: string, duration: number): void {
		const durationSeconds = duration / 1000; // конвертируем в секунды

		this.kafkaMessagesTotal.inc({
			topic,
			command_type: commandType,
			status,
		});

		this.kafkaMessageDuration.observe({ topic, command_type: commandType }, durationSeconds);
	}

	// Записать метрики для ошибки обработки Kafka сообщения
	recordKafkaError(topic: string, commandType: string, error: Error | unknown): void {
		const errorType = error instanceof Error ? error.constructor.name : "UnknownError";

		this.kafkaErrorsTotal.inc({
			topic,
			command_type: commandType,
			error_type: errorType,
		});
	}
}
