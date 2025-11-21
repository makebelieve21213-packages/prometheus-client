import { Test } from "@nestjs/testing";
import PrometheusService from "src/main/prometheus.service";
import KafkaMetricsService from "src/services/kafka-metrics.service";

import type { TestingModule } from "@nestjs/testing";
import type { Counter, Histogram } from "prom-client";

describe("KafkaMetricsService", () => {
	let service: KafkaMetricsService;
	let prometheusService: PrometheusService;
	let mockCounter: { inc: jest.Mock };
	let mockHistogram: { observe: jest.Mock };

	beforeEach(async () => {
		mockCounter = { inc: jest.fn() };
		mockHistogram = { observe: jest.fn() };

		const module: TestingModule = await Test.createTestingModule({
			providers: [PrometheusService, KafkaMetricsService],
		}).compile();

		service = module.get<KafkaMetricsService>(KafkaMetricsService);
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

	describe("recordKafkaMessage", () => {
		it("should record Kafka message metrics", () => {
			service.recordKafkaMessage("user-events", "UserCreated", "success", 150);

			expect(mockCounter.inc).toHaveBeenCalledWith({
				topic: "user-events",
				command_type: "UserCreated",
				status: "success",
			});

			expect(mockHistogram.observe).toHaveBeenCalledWith(
				{ topic: "user-events", command_type: "UserCreated" },
				0.15 // duration в секундах
			);
		});

		it("should handle different statuses", () => {
			service.recordKafkaMessage("order-events", "OrderPlaced", "error", 200);

			expect(mockCounter.inc).toHaveBeenCalledWith({
				topic: "order-events",
				command_type: "OrderPlaced",
				status: "error",
			});
		});
	});

	describe("recordKafkaError", () => {
		it("should record Kafka error metrics", () => {
			const error = new Error("Processing failed");
			service.recordKafkaError("user-events", "UserCreated", error);

			expect(mockCounter.inc).toHaveBeenCalledWith({
				topic: "user-events",
				command_type: "UserCreated",
				error_type: "Error",
			});
		});

		it("should handle unknown error types", () => {
			const error = { message: "Unknown error" };
			service.recordKafkaError("order-events", "OrderPlaced", error);

			expect(mockCounter.inc).toHaveBeenCalledWith({
				topic: "order-events",
				command_type: "OrderPlaced",
				error_type: "UnknownError",
			});
		});
	});
});
