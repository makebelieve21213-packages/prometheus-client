import type { InjectionToken, ModuleMetadata, OptionalFactoryDependency } from "@nestjs/common";
import type {
	CounterConfig,
	HistogramConfig,
	GaugeConfig,
	SummaryConfig,
} from "src/types/prometheus.interface";

// Опции конфигурации для HTTP метрик
export interface HttpMetricsOptions {
	/** Включить сбор HTTP метрик (по умолчанию: true) */
	enabled?: boolean;
	/** Игнорировать определенные пути (например, /metrics, /health) */
	ignorePaths?: string[];
	/** Игнорировать определенные методы (например, OPTIONS) */
	ignoreMethods?: string[];
	/** Buckets для гистограммы длительности запросов */
	durationBuckets?: number[];
	/** Buckets для гистограммы размера запроса */
	requestSizeBuckets?: number[];
	/** Buckets для гистограммы размера ответа */
	responseSizeBuckets?: number[];
}

// Конфигурация предварительно регистрируемых метрик
export interface PredefinedMetricsConfig {
	/** Список Counter метрик для предварительной регистрации */
	counters?: CounterConfig[];
	/** Список Histogram метрик для предварительной регистрации */
	histograms?: HistogramConfig[];
	/** Список Gauge метрик для предварительной регистрации */
	gauges?: GaugeConfig[];
	/** Список Summary метрик для предварительной регистрации */
	summaries?: SummaryConfig[];
}

// Опции конфигурации для Prometheus Client модуля
export interface PrometheusModuleOptions {
	/** Путь для экспорта метрик (по умолчанию: /metrics) */
	path?: string;
	/** Включить стандартные метрики Node.js (по умолчанию: true) */
	defaultMetrics?: boolean;
	/** Опции для HTTP метрик */
	httpMetrics?: HttpMetricsOptions;
	/** Конфигурация предварительно регистрируемых метрик */
	predefinedMetrics?: PredefinedMetricsConfig;
}

// Тип для функции фабрики с динамическими аргументами
type PrometheusModuleOptionsFactory<T extends unknown[] = []> = (
	...args: T
) => Promise<PrometheusModuleOptions> | PrometheusModuleOptions;

// Асинхронные опции для динамической конфигурации модуля через useFactory
export interface PrometheusModuleAsyncOptions<T extends unknown[] = []>
	extends Pick<ModuleMetadata, "imports"> {
	/**
	 * Фабрика для создания опций
	 * Аргументы функции соответствуют зависимостям из inject
	 */
	useFactory: PrometheusModuleOptionsFactory<T>;
	/** Зависимости для инъекции в useFactory */
	inject?: (InjectionToken | OptionalFactoryDependency)[];
}
