import { Test } from "@nestjs/testing";
import PrometheusService from "src/main/prometheus.service";
import AiMetricsService from "src/services/ai-metrics.service";

import type { TestingModule } from "@nestjs/testing";
import type { Counter, Histogram } from "prom-client";

describe("AiMetricsService", () => {
	let service: AiMetricsService;
	let prometheusService: PrometheusService;
	let mockCounter: { inc: jest.Mock };
	let mockHistogram: { observe: jest.Mock };

	beforeEach(async () => {
		mockCounter = { inc: jest.fn() };
		mockHistogram = { observe: jest.fn() };

		const module: TestingModule = await Test.createTestingModule({
			providers: [PrometheusService, AiMetricsService],
		}).compile();

		service = module.get<AiMetricsService>(AiMetricsService);
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

	describe("recordAiStream", () => {
		it("should record AI stream metrics", () => {
			service.recordAiStream("success", 1500, 100);

			expect(mockCounter.inc).toHaveBeenCalledWith({ status: "success" });
			expect(mockHistogram.observe).toHaveBeenCalledWith(1.5); // duration в секундах
			expect(mockCounter.inc).toHaveBeenCalledWith(100); // tokens
		});

		it("should record stream metrics without tokens", () => {
			service.recordAiStream("error", 500);

			expect(mockCounter.inc).toHaveBeenCalledWith({ status: "error" });
			expect(mockHistogram.observe).toHaveBeenCalledWith(0.5);
			// Проверяем, что токены не записываются, если не указаны
			const tokenCalls = mockCounter.inc.mock.calls.filter((call) => typeof call[0] === "number");
			expect(tokenCalls.length).toBe(0);
		});

		it("should not record tokens when tokens is 0", () => {
			service.recordAiStream("success", 1000, 0);

			expect(mockCounter.inc).toHaveBeenCalledWith({ status: "success" });
			expect(mockHistogram.observe).toHaveBeenCalledWith(1.0);
			// Проверяем, что токены не записываются, если 0
			const tokenCalls = mockCounter.inc.mock.calls.filter((call) => typeof call[0] === "number");
			expect(tokenCalls.length).toBe(0);
		});
	});

	describe("recordAiRequest", () => {
		it("should record AI request metrics with model", () => {
			service.recordAiRequest("success", 2000, 200, "gpt-4");

			expect(mockCounter.inc).toHaveBeenCalledWith({ status: "success", model: "gpt-4" });
			expect(mockHistogram.observe).toHaveBeenCalledWith({ model: "gpt-4" }, 2.0);
			expect(mockCounter.inc).toHaveBeenCalledWith(200); // tokens
		});

		it("should record AI request metrics without model", () => {
			service.recordAiRequest("error", 1000, 50);

			expect(mockCounter.inc).toHaveBeenCalledWith({ status: "error", model: "unknown" });
			expect(mockHistogram.observe).toHaveBeenCalledWith({ model: "unknown" }, 1.0);
		});

		it("should record AI request metrics without tokens", () => {
			service.recordAiRequest("success", 1500, undefined, "claude-3");

			expect(mockCounter.inc).toHaveBeenCalledWith({ status: "success", model: "claude-3" });
			expect(mockHistogram.observe).toHaveBeenCalledWith({ model: "claude-3" }, 1.5);
			// Проверяем, что токены не записываются
			const tokenCalls = mockCounter.inc.mock.calls.filter((call) => typeof call[0] === "number");
			expect(tokenCalls.length).toBe(0);
		});
	});
});
