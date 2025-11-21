import { Test } from "@nestjs/testing";
import PrometheusService from "src/main/prometheus.service";
import { PROMETHEUS_MODULE_OPTIONS } from "src/utils/injection-keys";
import MetricRegistry from "src/utils/metric-registry";

import type { TestingModule } from "@nestjs/testing";
import type { Counter, Histogram, Gauge, Summary } from "prom-client";
import type { PrometheusModuleOptions } from "src/types/module-options.interface";

describe("MetricRegistry", () => {
	let registry: MetricRegistry;
	let prometheusService: PrometheusService;
	let mockCounter: Counter;
	let mockHistogram: Histogram;
	let mockGauge: Gauge;
	let mockSummary: Summary;

	beforeEach(async () => {
		mockCounter = { inc: jest.fn() } as unknown as Counter;
		mockHistogram = { observe: jest.fn() } as unknown as Histogram;
		mockGauge = { set: jest.fn() } as unknown as Gauge;
		mockSummary = { observe: jest.fn() } as unknown as Summary;

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PrometheusService,
				MetricRegistry,
				{
					provide: PROMETHEUS_MODULE_OPTIONS,
					useValue: {
						predefinedMetrics: {
							counters: [{ name: "test_counter", help: "Test counter" }],
							histograms: [{ name: "test_histogram", help: "Test histogram" }],
							gauges: [{ name: "test_gauge", help: "Test gauge" }],
							summaries: [{ name: "test_summary", help: "Test summary" }],
						},
					} as PrometheusModuleOptions,
				},
			],
		}).compile();

		registry = module.get<MetricRegistry>(MetricRegistry);
		prometheusService = module.get<PrometheusService>(PrometheusService);

		jest.spyOn(prometheusService, "createCounter").mockReturnValue(mockCounter);
		jest.spyOn(prometheusService, "createHistogram").mockReturnValue(mockHistogram);
		jest.spyOn(prometheusService, "createGauge").mockReturnValue(mockGauge);
		jest.spyOn(prometheusService, "createSummary").mockReturnValue(mockSummary);

		registry.onModuleInit();
	});

	it("should be defined", () => {
		expect(registry).toBeDefined();
	});

	it("should register predefined metrics on init", () => {
		expect(prometheusService.createCounter).toHaveBeenCalledWith({
			name: "test_counter",
			help: "Test counter",
		});
		expect(prometheusService.createHistogram).toHaveBeenCalledWith({
			name: "test_histogram",
			help: "Test histogram",
		});
		expect(prometheusService.createGauge).toHaveBeenCalledWith({
			name: "test_gauge",
			help: "Test gauge",
		});
		expect(prometheusService.createSummary).toHaveBeenCalledWith({
			name: "test_summary",
			help: "Test summary",
		});
	});

	it("should retrieve registered counter", () => {
		const counter = registry.getCounter("test_counter");
		expect(counter).toBe(mockCounter);
	});

	it("should retrieve registered histogram", () => {
		const histogram = registry.getHistogram("test_histogram");
		expect(histogram).toBe(mockHistogram);
	});

	it("should retrieve registered gauge", () => {
		const gauge = registry.getGauge("test_gauge");
		expect(gauge).toBe(mockGauge);
	});

	it("should retrieve registered summary", () => {
		const summary = registry.getSummary("test_summary");
		expect(summary).toBe(mockSummary);
	});

	it("should return undefined for non-existent metric", () => {
		expect(registry.getCounter("non_existent")).toBeUndefined();
	});

	it("should return all registered metrics", () => {
		const allMetrics = registry.getAllMetrics();
		expect(allMetrics.counters.size).toBe(1);
		expect(allMetrics.histograms.size).toBe(1);
		expect(allMetrics.gauges.size).toBe(1);
		expect(allMetrics.summaries.size).toBe(1);
	});

	it("should work without predefinedMetrics", async () => {
		const moduleWithoutMetrics: TestingModule = await Test.createTestingModule({
			providers: [PrometheusService, MetricRegistry],
		}).compile();

		const registryWithoutMetrics = moduleWithoutMetrics.get<MetricRegistry>(MetricRegistry);
		const prometheusServiceWithoutMetrics =
			moduleWithoutMetrics.get<PrometheusService>(PrometheusService);

		jest.spyOn(prometheusServiceWithoutMetrics, "createCounter").mockReturnValue(mockCounter);
		jest.spyOn(prometheusServiceWithoutMetrics, "createHistogram").mockReturnValue(mockHistogram);
		jest.spyOn(prometheusServiceWithoutMetrics, "createGauge").mockReturnValue(mockGauge);
		jest.spyOn(prometheusServiceWithoutMetrics, "createSummary").mockReturnValue(mockSummary);

		registryWithoutMetrics.onModuleInit();

		expect(prometheusServiceWithoutMetrics.createCounter).not.toHaveBeenCalled();
		expect(prometheusServiceWithoutMetrics.createHistogram).not.toHaveBeenCalled();
		expect(prometheusServiceWithoutMetrics.createGauge).not.toHaveBeenCalled();
		expect(prometheusServiceWithoutMetrics.createSummary).not.toHaveBeenCalled();
	});
});
