import type { Counter, Histogram } from "prom-client";

// Опции для обертки функции с метриками
export interface MetricWrapperOptions {
	counter?: Counter;
	histogram?: Histogram;
	counterLabels?: Record<string, string> | (() => Record<string, string>);
	histogramLabels?: Record<string, string> | (() => Record<string, string>);
	onError?: (error: Error) => void;
}

