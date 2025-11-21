import { Injectable, OnModuleInit } from "@nestjs/common";
import { Counter, Histogram } from "prom-client";
import PrometheusService from "src/main/prometheus.service";

/**
 * Сервис для работы с HTTP метриками
 * Предоставляет готовые методы для записи HTTP метрик
 */
@Injectable()
export default class HttpMetricsService implements OnModuleInit {
	private httpRequestsTotal!: Counter;
	private httpRequestDuration!: Histogram;
	private httpRequestSize!: Histogram;
	private httpResponseSize!: Histogram;
	private httpErrorsTotal!: Counter;

	constructor(private readonly prometheusService: PrometheusService) {}

	onModuleInit() {
		// Создаем метрики при инициализации модуля
		this.httpRequestsTotal = this.prometheusService.createCounter({
			name: "http_requests_total",
			help: "Total number of HTTP requests",
			labelNames: ["method", "route", "status", "controller", "handler"],
		});

		this.httpRequestDuration = this.prometheusService.createHistogram({
			name: "http_request_duration_seconds",
			help: "Duration of HTTP requests in seconds",
			labelNames: ["method", "route", "controller", "handler"],
			buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
		});

		this.httpRequestSize = this.prometheusService.createHistogram({
			name: "http_request_size_bytes",
			help: "Size of HTTP requests in bytes",
			labelNames: ["method", "route"],
			buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
		});

		this.httpResponseSize = this.prometheusService.createHistogram({
			name: "http_response_size_bytes",
			help: "Size of HTTP responses in bytes",
			labelNames: ["method", "route", "status"],
			buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
		});

		this.httpErrorsTotal = this.prometheusService.createCounter({
			name: "http_errors_total",
			help: "Total number of HTTP errors",
			labelNames: ["method", "route", "status", "error_type"],
		});
	}

	// Записать метрики для HTTP запроса
	recordHttpRequest(
		method: string,
		route: string,
		status: number,
		duration: number,
		requestSize?: number,
		responseSize?: number,
		controller?: string,
		handler?: string
	): void {
		const durationSeconds = duration / 1000; // конвертируем в секунды
		const labels = {
			method,
			route,
			status: status.toString(),
			controller: controller || "unknown",
			handler: handler || "unknown",
		};

		this.httpRequestsTotal.inc(labels);
		this.httpRequestDuration.observe(
			{ method, route, controller: controller || "unknown", handler: handler || "unknown" },
			durationSeconds
		);

		if (requestSize !== undefined && requestSize) {
			this.httpRequestSize.observe({ method, route }, requestSize);
		}

		if (responseSize !== undefined && responseSize) {
			this.httpResponseSize.observe({ method, route, status: status.toString() }, responseSize);
		}
	}

	// Записать метрики для HTTP ошибки
	recordHttpError(
		method: string,
		route: string,
		status: number,
		duration: number,
		error: Error | unknown
	): void {
		const errorType = error instanceof Error ? error.constructor.name : "UnknownError";

		this.httpErrorsTotal.inc({
			method,
			route,
			status: status.toString(),
			error_type: errorType,
		});

		this.recordHttpRequest(method, route, status, duration);
	}
}
