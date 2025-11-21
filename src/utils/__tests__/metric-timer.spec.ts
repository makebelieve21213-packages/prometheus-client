import { createMetricTimer, MetricTimer } from "src/utils/metric-timer";

import type { Histogram } from "prom-client";

describe("MetricTimer", () => {
	let mockHistogram: { observe: jest.Mock };

	beforeEach(() => {
		mockHistogram = { observe: jest.fn() };
	});

	it("should create timer instance", () => {
		const timer = createMetricTimer(mockHistogram as unknown as Histogram);
		expect(timer).toBeInstanceOf(MetricTimer);
	});

	it("should record duration when end is called", () => {
		const dateNowSpy = jest.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValueOnce(2000);
		const timer = createMetricTimer(mockHistogram as unknown as Histogram);

		const duration = timer.end();

		expect(duration).toBe(1000);
		expect(mockHistogram.observe).toHaveBeenCalledWith(1.0); // в секундах
		dateNowSpy.mockRestore();
	});

	it("should record duration with labels when end is called", () => {
		const labels = { method: "GET", route: "/api/test" };
		const dateNowSpy = jest.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValueOnce(2500);
		const timer = createMetricTimer(mockHistogram as unknown as Histogram, labels);

		timer.end();

		expect(mockHistogram.observe).toHaveBeenCalledWith(labels, 1.5);
		dateNowSpy.mockRestore();
	});

	it("should return elapsed time without recording", () => {
		const dateNowSpy = jest.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValueOnce(1500);
		const timer = createMetricTimer(mockHistogram as unknown as Histogram);

		const elapsed = timer.getElapsed();
		expect(elapsed).toBe(500);
		expect(mockHistogram.observe).not.toHaveBeenCalled();
		dateNowSpy.mockRestore();
	});

	it("should return elapsed time in seconds", () => {
		const dateNowSpy = jest.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValueOnce(2500);
		const timer = createMetricTimer(mockHistogram as unknown as Histogram);

		const elapsedSeconds = timer.getElapsedSeconds();
		expect(elapsedSeconds).toBe(1.5);
		dateNowSpy.mockRestore();
	});
});
