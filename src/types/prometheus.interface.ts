import type { Counter, Histogram, Gauge, Summary, Registry } from "prom-client";

// Тип для меток метрик
export type LabelNames<T extends string = string> = readonly T[];

// Тип для объекта меток
export type LabelValues<T extends Record<string, string> = Record<string, string>> = T;

// Конфигурация для Counter метрики с типизированными метками
export interface CounterConfig<T extends string = string> {
	name: string;
	help: string;
	labelNames?: LabelNames<T>;
}

// Конфигурация для Histogram метрики с типизированными метками
export interface HistogramConfig<T extends string = string> {
	name: string;
	help: string;
	labelNames?: LabelNames<T>;
	buckets?: number[];
}

// Конфигурация для Gauge метрики с типизированными метками
export interface GaugeConfig<T extends string = string> {
	name: string;
	help: string;
	labelNames?: LabelNames<T>;
}

// Конфигурация для Summary метрики с типизированными метками
export interface SummaryConfig<T extends string = string> {
	name: string;
	help: string;
	labelNames?: LabelNames<T>;
	percentiles?: number[];
	maxAgeSeconds?: number;
	ageBuckets?: number;
	compressCount?: number;
}

// Интерфейс для Prometheus клиента
export default interface PrometheusClientContract {
	// Создать Counter метрику
	createCounter<T extends string = string>(config: CounterConfig<T>): Counter<string>;

	// Создать Histogram метрику
	createHistogram<T extends string = string>(config: HistogramConfig<T>): Histogram<string>;

	// Создать Gauge метрику
	createGauge<T extends string = string>(config: GaugeConfig<T>): Gauge<string>;

	// Создать Summary метрику
	createSummary<T extends string = string>(config: SummaryConfig<T>): Summary<string>;

	// Получить Registry для экспорта метрик
	getRegistry(): Registry;
}
