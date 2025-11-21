import { Injectable, OnModuleInit } from "@nestjs/common";
import { Counter, Histogram } from "prom-client";
import PrometheusService from "src/main/prometheus.service";

/**
 * Сервис для работы с AI метриками
 * Предоставляет готовые методы для записи AI метрик
 */
@Injectable()
export default class AiMetricsService implements OnModuleInit {
	private aiStreamRequestsTotal!: Counter;
	private aiStreamDuration!: Histogram;
	private aiStreamTokensTotal!: Counter;
	private aiRequestsTotal!: Counter;
	private aiRequestDuration!: Histogram;

	constructor(private readonly prometheusService: PrometheusService) {}

	onModuleInit() {
		// Создаем метрики при инициализации модуля
		this.aiStreamRequestsTotal = this.prometheusService.createCounter({
			name: "ai_stream_requests_total",
			help: "Total number of AI stream requests",
			labelNames: ["status"],
		});

		this.aiStreamDuration = this.prometheusService.createHistogram({
			name: "ai_stream_duration_seconds",
			help: "Duration of AI stream requests in seconds",
			buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
		});

		this.aiStreamTokensTotal = this.prometheusService.createCounter({
			name: "ai_stream_tokens_total",
			help: "Total number of tokens processed in AI streams",
		});

		this.aiRequestsTotal = this.prometheusService.createCounter({
			name: "ai_requests_total",
			help: "Total number of AI requests",
			labelNames: ["status", "model"],
		});

		this.aiRequestDuration = this.prometheusService.createHistogram({
			name: "ai_request_duration_seconds",
			help: "Duration of AI requests in seconds",
			labelNames: ["model"],
			buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
		});
	}

	// Записать метрики для AI stream запроса
	recordAiStream(status: string, duration: number, tokens?: number): void {
		const durationSeconds = duration / 1000; // конвертируем в секунды

		this.aiStreamRequestsTotal.inc({ status });
		this.aiStreamDuration.observe(durationSeconds);

		if (tokens !== undefined && tokens) {
			this.aiStreamTokensTotal.inc(tokens);
		}
	}

	// Записать метрики для AI запроса
	recordAiRequest(status: string, duration: number, tokens?: number, model?: string): void {
		const durationSeconds = duration / 1000; // конвертируем в секунды
		const modelLabel = model || "unknown";

		this.aiRequestsTotal.inc({ status, model: modelLabel });
		this.aiRequestDuration.observe({ model: modelLabel }, durationSeconds);

		if (tokens !== undefined && tokens) {
			this.aiStreamTokensTotal.inc(tokens);
		}
	}
}
