import type { Histogram } from "prom-client";

/**
 * Утилита для измерения времени выполнения функции
 * Автоматически записывает результат в Histogram метрику
 */
export class MetricTimer {
	private readonly startTime: number;
	private readonly histogram: Histogram<string>;
	private readonly labels?: Record<string, string>;

	constructor(histogram: Histogram<string>, labels?: Record<string, string>) {
		this.histogram = histogram;
		this.labels = labels;
		this.startTime = Date.now();
	}

	// Завершить измерение и записать результат в метрику
	end(): number {
		const duration = Date.now() - this.startTime;
		const durationSeconds = duration / 1000;

		if (this.labels) {
			this.histogram.observe(this.labels, durationSeconds);
		} else {
			this.histogram.observe(durationSeconds);
		}

		return duration;
	}

	// Получить текущее время выполнения без записи в метрику
	getElapsed(): number {
		return Date.now() - this.startTime;
	}

	// Получить текущее время выполнения в секундах
	getElapsedSeconds(): number {
		return (Date.now() - this.startTime) / 1000;
	}
}

// Создать таймер для измерения времени выполнения
export function createMetricTimer(
	histogram: Histogram<string>,
	labels?: Record<string, string>
): MetricTimer {
	return new MetricTimer(histogram, labels);
}
