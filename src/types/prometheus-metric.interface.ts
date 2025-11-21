/**
 * Декоратор для определения кастомных метрик для метода
 * Позволяет указать тип метрики и её конфигурацию
 */
export interface PrometheusMetricConfig {
	type: "counter" | "histogram" | "gauge" | "summary";
	name: string;
	help: string;
	labels?: string[];
	buckets?: number[]; // для histogram
	percentiles?: number[]; // для summary
}
