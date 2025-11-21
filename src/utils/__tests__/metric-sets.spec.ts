import { Test } from "@nestjs/testing";
import { register, Counter, Histogram, Gauge } from "prom-client";
import PrometheusService from "src/main/prometheus.service";
import {
	createHttpMetricsSet,
	createKafkaMetricsSet,
	createDatabaseMetricsSet,
} from "src/utils/metric-sets";

import type { TestingModule } from "@nestjs/testing";

describe("Metric Sets", () => {
	let prometheusService: PrometheusService;

	beforeEach(async () => {
		// Очищаем registry перед каждым тестом
		register.clear();

		const module: TestingModule = await Test.createTestingModule({
			providers: [PrometheusService],
		}).compile();

		prometheusService = module.get<PrometheusService>(PrometheusService);
	});

	describe("createHttpMetricsSet", () => {
		it("should create HTTP metrics set", () => {
			const metrics = createHttpMetricsSet(prometheusService);

			expect(metrics.httpRequestsTotal).toBeInstanceOf(Counter);
			expect(metrics.httpRequestDuration).toBeInstanceOf(Histogram);
			expect(metrics.httpRequestSize).toBeInstanceOf(Histogram);
			expect(metrics.httpResponseSize).toBeInstanceOf(Histogram);
			expect(metrics.httpErrorsTotal).toBeInstanceOf(Counter);
		});

		it("should register HTTP metrics in registry", () => {
			const metrics = createHttpMetricsSet(prometheusService);

			const registry = prometheusService.getRegistry();
			expect(registry.getSingleMetric("http_requests_total")).toBe(metrics.httpRequestsTotal);
			expect(registry.getSingleMetric("http_request_duration_seconds")).toBe(
				metrics.httpRequestDuration
			);
			expect(registry.getSingleMetric("http_request_size_bytes")).toBe(metrics.httpRequestSize);
			expect(registry.getSingleMetric("http_response_size_bytes")).toBe(metrics.httpResponseSize);
			expect(registry.getSingleMetric("http_errors_total")).toBe(metrics.httpErrorsTotal);
		});
	});

	describe("createKafkaMetricsSet", () => {
		it("should create Kafka metrics set", () => {
			const metrics = createKafkaMetricsSet(prometheusService);

			expect(metrics.kafkaMessagesTotal).toBeInstanceOf(Counter);
			expect(metrics.kafkaMessageDuration).toBeInstanceOf(Histogram);
			expect(metrics.kafkaErrorsTotal).toBeInstanceOf(Counter);
		});

		it("should register Kafka metrics in registry", () => {
			const metrics = createKafkaMetricsSet(prometheusService);

			const registry = prometheusService.getRegistry();
			expect(registry.getSingleMetric("kafka_messages_total")).toBe(metrics.kafkaMessagesTotal);
			expect(registry.getSingleMetric("kafka_message_duration_seconds")).toBe(
				metrics.kafkaMessageDuration
			);
			expect(registry.getSingleMetric("kafka_errors_total")).toBe(metrics.kafkaErrorsTotal);
		});
	});

	describe("createDatabaseMetricsSet", () => {
		it("should create database metrics set", () => {
			const metrics = createDatabaseMetricsSet(prometheusService);

			expect(metrics.databaseQueriesTotal).toBeInstanceOf(Counter);
			expect(metrics.databaseQueryDuration).toBeInstanceOf(Histogram);
			expect(metrics.databaseConnectionsActive).toBeInstanceOf(Gauge);
			expect(metrics.databaseConnectionsIdle).toBeInstanceOf(Gauge);
			expect(metrics.databaseErrorsTotal).toBeInstanceOf(Counter);
		});

		it("should register database metrics in registry", () => {
			const metrics = createDatabaseMetricsSet(prometheusService);

			const registry = prometheusService.getRegistry();
			expect(registry.getSingleMetric("database_queries_total")).toBe(metrics.databaseQueriesTotal);
			expect(registry.getSingleMetric("database_query_duration_seconds")).toBe(
				metrics.databaseQueryDuration
			);
			expect(registry.getSingleMetric("database_connections_active")).toBe(
				metrics.databaseConnectionsActive
			);
			expect(registry.getSingleMetric("database_connections_idle")).toBe(
				metrics.databaseConnectionsIdle
			);
			expect(registry.getSingleMetric("database_errors_total")).toBe(metrics.databaseErrorsTotal);
		});
	});
});
