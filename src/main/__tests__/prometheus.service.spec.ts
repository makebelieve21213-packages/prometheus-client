import { Test } from "@nestjs/testing";
import { register, Counter, Histogram, Gauge, Summary } from "prom-client";
import PrometheusService from "src/main/prometheus.service";

import type { TestingModule } from "@nestjs/testing";

describe("PrometheusService", () => {
	let service: PrometheusService;

	beforeEach(async () => {
		// Очищаем registry перед каждым тестом
		register.clear();

		const module: TestingModule = await Test.createTestingModule({
			providers: [PrometheusService],
		}).compile();

		service = module.get<PrometheusService>(PrometheusService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("createCounter", () => {
		it("should create a counter metric", () => {
			const counter = service.createCounter({
				name: "test_counter",
				help: "Test counter metric",
			});

			expect(counter).toBeInstanceOf(Counter);
			// Проверяем, что метрика работает через вызов метода
			counter.inc();
			const metric = service.getRegistry().getSingleMetric("test_counter");
			expect(metric).toBeDefined();
			expect(metric).toBe(counter);
		});

		it("should create a counter with label names", () => {
			const counter = service.createCounter({
				name: "test_counter_labels",
				help: "Test counter with labels",
				labelNames: ["method", "status"],
			});

			expect(counter).toBeInstanceOf(Counter);
			// Проверяем, что метрика работает с метками
			counter.inc({ method: "GET", status: "200" });
			const metric = service.getRegistry().getSingleMetric("test_counter_labels");
			expect(metric).toBeDefined();
			expect(metric).toBe(counter);
		});

		it("should return existing counter if metric already exists", () => {
			const counter1 = service.createCounter({
				name: "test_existing_counter",
				help: "Test existing counter",
			});

			// Попытка создать метрику с тем же именем
			const counter2 = service.createCounter({
				name: "test_existing_counter",
				help: "Test existing counter",
			});

			// Должна вернуться та же метрика
			expect(counter1).toBe(counter2);
			expect(counter2).toBeInstanceOf(Counter);
		});
	});

	describe("createHistogram", () => {
		it("should create a histogram metric", () => {
			const histogram = service.createHistogram({
				name: "test_histogram",
				help: "Test histogram metric",
			});

			expect(histogram).toBeInstanceOf(Histogram);
			// Проверяем, что метрика работает через вызов метода
			histogram.observe(0.5);
			const metric = service.getRegistry().getSingleMetric("test_histogram");
			expect(metric).toBeDefined();
			expect(metric).toBe(histogram);
		});

		it("should create a histogram with buckets", () => {
			const buckets = [0.1, 0.5, 1, 2, 5];
			const histogram = service.createHistogram({
				name: "test_histogram_buckets",
				help: "Test histogram with buckets",
				buckets,
			});

			expect(histogram).toBeInstanceOf(Histogram);
			// Проверяем, что метрика работает с заданными buckets
			histogram.observe(0.3);
			const metric = service.getRegistry().getSingleMetric("test_histogram_buckets");
			expect(metric).toBeDefined();
			expect(metric).toBe(histogram);
		});

		it("should return existing histogram if metric already exists", () => {
			const histogram1 = service.createHistogram({
				name: "test_existing_histogram",
				help: "Test existing histogram",
			});

			// Попытка создать метрику с тем же именем
			const histogram2 = service.createHistogram({
				name: "test_existing_histogram",
				help: "Test existing histogram",
			});

			// Должна вернуться та же метрика
			expect(histogram1).toBe(histogram2);
			expect(histogram2).toBeInstanceOf(Histogram);
		});
	});

	describe("createGauge", () => {
		it("should create a gauge metric", () => {
			const gauge = service.createGauge({
				name: "test_gauge",
				help: "Test gauge metric",
			});

			expect(gauge).toBeInstanceOf(Gauge);
			// Проверяем, что метрика работает через вызов метода
			gauge.set(10);
			const metric = service.getRegistry().getSingleMetric("test_gauge");
			expect(metric).toBeDefined();
			expect(metric).toBe(gauge);
		});

		it("should create a gauge with label names", () => {
			const gauge = service.createGauge({
				name: "test_gauge_labels",
				help: "Test gauge with labels",
				labelNames: ["state"],
			});

			expect(gauge).toBeInstanceOf(Gauge);
			// Проверяем, что метрика работает с метками
			gauge.set({ state: "active" }, 5);
			const metric = service.getRegistry().getSingleMetric("test_gauge_labels");
			expect(metric).toBeDefined();
			expect(metric).toBe(gauge);
		});

		it("should return existing gauge if metric already exists", () => {
			const gauge1 = service.createGauge({
				name: "test_existing_gauge",
				help: "Test existing gauge",
			});

			// Попытка создать метрику с тем же именем
			const gauge2 = service.createGauge({
				name: "test_existing_gauge",
				help: "Test existing gauge",
			});

			// Должна вернуться та же метрика
			expect(gauge1).toBe(gauge2);
			expect(gauge2).toBeInstanceOf(Gauge);
		});
	});

	describe("createSummary", () => {
		it("should create a summary metric", () => {
			const summary = service.createSummary({
				name: "test_summary",
				help: "Test summary metric",
			});

			expect(summary).toBeInstanceOf(Summary);
			// Проверяем, что метрика работает через вызов метода
			summary.observe(0.5);
			const metric = service.getRegistry().getSingleMetric("test_summary");
			expect(metric).toBeDefined();
			expect(metric).toBe(summary);
		});

		it("should create a summary with percentiles", () => {
			const percentiles = [0.5, 0.9, 0.99];
			const summary = service.createSummary({
				name: "test_summary_percentiles",
				help: "Test summary with percentiles",
				percentiles,
			});

			expect(summary).toBeInstanceOf(Summary);
			// Проверяем, что метрика работает с заданными percentiles
			summary.observe(0.3);
			const metric = service.getRegistry().getSingleMetric("test_summary_percentiles");
			expect(metric).toBeDefined();
			expect(metric).toBe(summary);
		});

		it("should create a summary with label names", () => {
			const summary = service.createSummary({
				name: "test_summary_labels",
				help: "Test summary with labels",
				labelNames: ["method", "status"],
			});

			expect(summary).toBeInstanceOf(Summary);
			// Проверяем, что метрика работает с метками
			summary.observe({ method: "GET", status: "200" }, 0.5);
			const metric = service.getRegistry().getSingleMetric("test_summary_labels");
			expect(metric).toBeDefined();
			expect(metric).toBe(summary);
		});

		it("should return existing summary if metric already exists", () => {
			const summary1 = service.createSummary({
				name: "test_existing_summary",
				help: "Test existing summary",
			});

			// Попытка создать метрику с тем же именем
			const summary2 = service.createSummary({
				name: "test_existing_summary",
				help: "Test existing summary",
			});

			// Должна вернуться та же метрика
			expect(summary1).toBe(summary2);
			expect(summary2).toBeInstanceOf(Summary);
		});
	});

	describe("getRegistry", () => {
		it("should return a registry instance", () => {
			const registry = service.getRegistry();

			expect(registry).toBeDefined();
		});

		it("should return the same registry instance", () => {
			const registry1 = service.getRegistry();
			const registry2 = service.getRegistry();

			expect(registry1).toBe(registry2);
		});
	});
});
