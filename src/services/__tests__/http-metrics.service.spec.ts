import { Test } from "@nestjs/testing";
import PrometheusService from "src/main/prometheus.service";
import HttpMetricsService from "src/services/http-metrics.service";

import type { TestingModule } from "@nestjs/testing";
import type { Counter, Histogram } from "prom-client";

describe("HttpMetricsService", () => {
	let service: HttpMetricsService;
	let prometheusService: PrometheusService;
	let mockCounter: { inc: jest.Mock };
	let mockHistogram: { observe: jest.Mock };

	beforeEach(async () => {
		mockCounter = { inc: jest.fn() };
		mockHistogram = { observe: jest.fn() };

		const module: TestingModule = await Test.createTestingModule({
			providers: [PrometheusService, HttpMetricsService],
		}).compile();

		service = module.get<HttpMetricsService>(HttpMetricsService);
		prometheusService = module.get<PrometheusService>(PrometheusService);

		// Мокаем создание метрик
		jest
			.spyOn(prometheusService, "createCounter")
			.mockReturnValue(mockCounter as unknown as Counter<string>);
		jest
			.spyOn(prometheusService, "createHistogram")
			.mockReturnValue(mockHistogram as unknown as Histogram<string>);

		// Инициализируем сервис
		service.onModuleInit();
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("recordHttpRequest", () => {
		it("should record HTTP request metrics", () => {
			service.recordHttpRequest(
				"GET",
				"/api/test",
				200,
				150,
				1024,
				2048,
				"TestController",
				"testHandler"
			);

			expect(mockCounter.inc).toHaveBeenCalledWith({
				method: "GET",
				route: "/api/test",
				status: "200",
				controller: "TestController",
				handler: "testHandler",
			});

			expect(mockHistogram.observe).toHaveBeenCalledWith(
				{ method: "GET", route: "/api/test", controller: "TestController", handler: "testHandler" },
				0.15 // duration в секундах
			);
		});

		it("should record request and response size when provided", () => {
			service.recordHttpRequest("POST", "/api/data", 201, 200, 500, 1000);

			expect(mockHistogram.observe).toHaveBeenCalledWith({ method: "POST", route: "/api/data" }, 500);
			expect(mockHistogram.observe).toHaveBeenCalledWith(
				{ method: "POST", route: "/api/data", status: "201" },
				1000
			);
		});

		it("should use default values for controller and handler when not provided", () => {
			service.recordHttpRequest("GET", "/api/test", 200, 100);

			expect(mockCounter.inc).toHaveBeenCalledWith({
				method: "GET",
				route: "/api/test",
				status: "200",
				controller: "unknown",
				handler: "unknown",
			});
		});

		it("should not record size metrics when size is 0 or undefined", () => {
			service.recordHttpRequest("GET", "/api/test", 200, 100, 0, undefined);

			// Проверяем, что размеры не записываются
			const observeCalls = mockHistogram.observe.mock.calls;
			const sizeObserveCalls = observeCalls.filter(
				(call) => call[0].method === "GET" && call[0].route === "/api/test" && call[1] !== 0.1
			);
			expect(sizeObserveCalls.length).toBe(0);
		});
	});

	describe("recordHttpError", () => {
		it("should record HTTP error metrics", () => {
			const error = new Error("Test error");
			service.recordHttpError("POST", "/api/error", 500, 200, error);

			expect(mockCounter.inc).toHaveBeenCalledWith({
				method: "POST",
				route: "/api/error",
				status: "500",
				error_type: "Error",
			});

			expect(mockCounter.inc).toHaveBeenCalledWith({
				method: "POST",
				route: "/api/error",
				status: "500",
				controller: "unknown",
				handler: "unknown",
			});
		});

		it("should handle unknown error types", () => {
			const error = { message: "Unknown error" };
			service.recordHttpError("GET", "/api/error", 400, 100, error);

			expect(mockCounter.inc).toHaveBeenCalledWith({
				method: "GET",
				route: "/api/error",
				status: "400",
				error_type: "UnknownError",
			});
		});
	});
});
