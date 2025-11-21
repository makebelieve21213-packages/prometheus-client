import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	Inject,
	Optional,
	HttpStatus,
} from "@nestjs/common";
import { Counter, Histogram } from "prom-client";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import PrometheusService from "src/main/prometheus.service";
import { PROMETHEUS_MODULE_OPTIONS } from "src/utils/injection-keys";

import type { PrometheusModuleOptions } from "src/types/module-options.interface";

/**
 * Интерцептор для автоматического сбора HTTP метрик
 * Собирает метрики:
 * - http_requests_total (Counter) - общее количество запросов
 * - http_request_duration_seconds (Histogram) - длительность запросов
 * - http_request_size_bytes (Histogram) - размер запроса
 * - http_response_size_bytes (Histogram) - размер ответа
 */
@Injectable()
export default class PrometheusHttpInterceptor implements NestInterceptor {
	private readonly httpRequestsTotal: Counter;
	private readonly httpRequestDuration: Histogram;
	private readonly httpRequestSize: Histogram;
	private readonly httpResponseSize: Histogram;
	private readonly options: PrometheusModuleOptions["httpMetrics"];

	constructor(
		private readonly prometheusService: PrometheusService,
		@Optional()
		@Inject(PROMETHEUS_MODULE_OPTIONS)
		private readonly moduleOptions?: PrometheusModuleOptions
	) {
		this.options = this.moduleOptions?.httpMetrics ?? {};
		const enabled = this.options.enabled ?? true;

		if (!enabled) {
			// Создаем заглушки, чтобы избежать ошибок при вызовах
			this.httpRequestsTotal = null as unknown as Counter;
			this.httpRequestDuration = null as unknown as Histogram;
			this.httpRequestSize = null as unknown as Histogram;
			this.httpResponseSize = null as unknown as Histogram;
			
			return;
		}

		// Создаем метрики
		this.httpRequestsTotal = this.prometheusService.createCounter({
			name: "http_requests_total",
			help: "Total number of HTTP requests",
			labelNames: ["method", "route", "status", "controller", "handler"],
		});

		this.httpRequestDuration = this.prometheusService.createHistogram({
			name: "http_request_duration_seconds",
			help: "Duration of HTTP requests in seconds",
			labelNames: ["method", "route", "controller", "handler"],
			buckets: this.options.durationBuckets ?? [
				0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
			],
		});

		this.httpRequestSize = this.prometheusService.createHistogram({
			name: "http_request_size_bytes",
			help: "Size of HTTP requests in bytes",
			labelNames: ["method", "route"],
			buckets: this.options.requestSizeBuckets ?? [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
		});

		this.httpResponseSize = this.prometheusService.createHistogram({
			name: "http_response_size_bytes",
			help: "Size of HTTP responses in bytes",
			labelNames: ["method", "route", "status"],
			buckets: this.options.responseSizeBuckets ?? [
				100, 500, 1000, 5000, 10000, 50000, 100000, 500000,
			],
		});
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();

		// Проверяем, нужно ли игнорировать этот запрос
		if (this.shouldIgnore(request)) {
			return next.handle();
		}

		const method = request.method || "UNKNOWN";
		const route = this.getRoute(request);
		const controller = context.getClass()?.name || "UnknownController";
		const handler = context.getHandler()?.name || "unknownHandler";

		const startTime = Date.now();
		const requestSize = this.getRequestSize(request);

		return next.handle().pipe(
			tap((data: unknown) => {
				const duration = (Date.now() - startTime) / 1000; // в секундах
				const status = response.statusCode || HttpStatus.OK;
				const responseSize = this.getResponseSize(data);

				// Записываем метрики
				this.httpRequestsTotal.inc({
					method,
					route,
					status: status.toString(),
					controller,
					handler,
				});

				this.httpRequestDuration.observe({ method, route, controller, handler }, duration);

				if (requestSize) {
					this.httpRequestSize.observe({ method, route }, requestSize);
				}

				if (responseSize) {
					this.httpResponseSize.observe({ method, route, status: status.toString() }, responseSize);
				}
			}),
			catchError((error: unknown) => {
				const duration = (Date.now() - startTime) / 1000;
				const status = (error as { status?: number })?.status || HttpStatus.INTERNAL_SERVER_ERROR;

				// Записываем метрики для ошибок
				this.httpRequestsTotal.inc({
					method,
					route,
					status: status.toString(),
					controller,
					handler,
				});

				this.httpRequestDuration.observe({ method, route, controller, handler }, duration);

				if (requestSize) {
					this.httpRequestSize.observe({ method, route }, requestSize);
				}

				throw error;
			})
		);
	}

	private shouldIgnore(request: { url?: string; method?: string }): boolean {
		if (!this.options?.enabled) {
			return true;
		}

		const path = request.url?.split("?")[0] || "";
		const method = request.method || "";

		// Проверяем игнорируемые пути
		if (this.options.ignorePaths) {
			for (const ignorePath of this.options.ignorePaths) {
				if (path.startsWith(ignorePath)) {
					return true;
				}
			}
		}

		// Проверяем игнорируемые методы
		if (this.options.ignoreMethods) {
			if (this.options.ignoreMethods.includes(method)) {
				return true;
			}
		}

		return false;
	}

	private getRoute(request: { url?: string; route?: { path?: string } }): string {
		// Пытаемся получить маршрут из request.route?.path или request.url
		if (request.route?.path) {
			return request.route.path;
		}

		const url = request.url?.split("?")[0] || "";
		return url || "unknown";
	}

	private getRequestSize(request: {
		headers?: { [key: string]: string | string[] | undefined };
		body?: string | object;
	}): number {
		// Пытаемся получить размер запроса из заголовков или тела
		const contentLength = request.headers?.["content-length"];
		if (contentLength) {
			const lengthValue = Array.isArray(contentLength) ? contentLength[0] : contentLength;
			return parseInt(lengthValue, 10) || 0;
		}

		if (request.body && typeof request.body === "string") {
			return Buffer.byteLength(request.body, "utf8");
		}

		if (request.body && typeof request.body === "object") {
			return Buffer.byteLength(JSON.stringify(request.body), "utf8");
		}

		return 0;
	}

	private getResponseSize(data: unknown): number {
		if (!data) {
			return 0;
		}

		if (typeof data === "string") {
			return Buffer.byteLength(data, "utf8");
		}

		if (typeof data === "object") {
			return Buffer.byteLength(JSON.stringify(data), "utf8");
		}

		return 0;
	}
}
