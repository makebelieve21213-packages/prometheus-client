import wrapWithMetrics from "src/utils/metric-wrapper";

import type { Counter, Histogram } from "prom-client";

describe("wrapWithMetrics", () => {
	let mockCounter: { inc: jest.Mock };
	let mockHistogram: { observe: jest.Mock };

	beforeEach(() => {
		mockCounter = { inc: jest.fn() };
		mockHistogram = { observe: jest.fn() };
	});

	it("should wrap synchronous function", () => {
		const fn = jest.fn().mockReturnValue("result");
		const wrapped = wrapWithMetrics(fn, {
			counter: mockCounter as unknown as Counter,
			histogram: mockHistogram as unknown as Histogram,
		});

		const result = wrapped();

		expect(fn).toHaveBeenCalled();
		expect(result).toBe("result");
		expect(mockCounter.inc).toHaveBeenCalled();
		expect(mockHistogram.observe).toHaveBeenCalled();
	});

	it("should wrap async function", async () => {
		const fn = jest.fn().mockResolvedValue("async result");
		const wrapped = wrapWithMetrics(fn, {
			counter: mockCounter as unknown as Counter,
			histogram: mockHistogram as unknown as Histogram,
		});

		const result = await wrapped();

		expect(fn).toHaveBeenCalled();
		expect(result).toBe("async result");
		expect(mockCounter.inc).toHaveBeenCalled();
		expect(mockHistogram.observe).toHaveBeenCalled();
	});

	it("should handle errors", () => {
		const error = new Error("Test error");
		const fn = jest.fn().mockImplementation(() => {
			throw error;
		});
		const onError = jest.fn();
		const wrapped = wrapWithMetrics(fn, {
			counter: mockCounter as unknown as Counter,
			histogram: mockHistogram as unknown as Histogram,
			onError,
		});

		expect(() => wrapped()).toThrow(error);
		expect(onError).toHaveBeenCalledWith(error);
		expect(mockHistogram.observe).toHaveBeenCalled();
	});

	it("should use function for dynamic labels", () => {
		const fn = jest.fn().mockReturnValue("result");
		const counterLabelsFn = jest.fn().mockReturnValue({ operation: "test" });
		const wrapped = wrapWithMetrics(fn, {
			counter: mockCounter as unknown as Counter,
			counterLabels: counterLabelsFn,
		});

		wrapped();

		expect(counterLabelsFn).toHaveBeenCalled();
		expect(mockCounter.inc).toHaveBeenCalledWith({ operation: "test" });
	});

	it("should use function for dynamic histogram labels", () => {
		const fn = jest.fn().mockReturnValue("result");
		const histogramLabelsFn = jest.fn().mockReturnValue({ operation: "test" });
		const wrapped = wrapWithMetrics(fn, {
			histogram: mockHistogram as unknown as Histogram,
			histogramLabels: histogramLabelsFn,
		});

		wrapped();

		expect(histogramLabelsFn).toHaveBeenCalled();
	});

	it("should handle errors in async function", async () => {
		const error = new Error("Async error");
		const fn = jest.fn().mockRejectedValue(error);
		const onError = jest.fn();
		const wrapped = wrapWithMetrics(fn, {
			counter: mockCounter as unknown as Counter,
			histogram: mockHistogram as unknown as Histogram,
			onError,
		});

		await expect(wrapped()).rejects.toThrow(error);
		expect(onError).toHaveBeenCalledWith(error);
		expect(mockHistogram.observe).toHaveBeenCalled();
	});

	it("should handle errors in async function without onError", async () => {
		const error = new Error("Async error");
		const fn = jest.fn().mockRejectedValue(error);
		const wrapped = wrapWithMetrics(fn, {
			counter: mockCounter as unknown as Counter,
			histogram: mockHistogram as unknown as Histogram,
		});

		await expect(wrapped()).rejects.toThrow(error);
		expect(mockHistogram.observe).toHaveBeenCalled();
	});
});
