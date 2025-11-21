import { createMetricTimer } from "src/utils/metric-timer";
import type { MetricWrapperOptions } from "src/types/metric-wrapper.interface";

// Обернуть функцию для автоматического сбора метрик
export default function wrapWithMetrics<T extends (...args: unknown[]) => unknown>(
	fn: T,
	options: MetricWrapperOptions
): T {
	return ((...args: Parameters<T>) => {
		const timer = options.histogram
			? createMetricTimer(
					options.histogram,
					typeof options.histogramLabels === "function"
						? options.histogramLabels()
						: options.histogramLabels
				)
			: null;

		if (options.counter) {
			const labels =
				typeof options.counterLabels === "function" ? options.counterLabels() : options.counterLabels;
			if (labels) {
				options.counter.inc(labels);
			} else {
				options.counter.inc();
			}
		}

		try {
			const result = fn(...args);

			if (result instanceof Promise) {
				return result
					.then((value) => {
						if (timer) {
							timer.end();
						}
						return value;
					})
					.catch((error) => {
						if (timer) {
							timer.end();
						}
						if (options.onError) {
							options.onError(error);
						}
						throw error;
					});
			}

			if (timer) {
				timer.end();
			}
			return result;
		} catch (error) {
			if (timer) {
				timer.end();
			}
			if (options.onError) {
				options.onError(error as Error);
			}
			throw error;
		}
	}) as T;
}
