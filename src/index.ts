export { default as PrometheusClientModule } from "src/main/prometheus.module";
export { default as PrometheusService } from "src/main/prometheus.service";
export { default as PrometheusHttpInterceptor } from "src/interceptors/prometheus-http.interceptor";
export { default as HttpMetricsService } from "src/services/http-metrics.service";
export { default as KafkaMetricsService } from "src/services/kafka-metrics.service";
export { default as AiMetricsService } from "src/services/ai-metrics.service";
export { TrackDuration } from "src/decorators/track-duration.decorator";
export { TrackCounter } from "src/decorators/track-counter.decorator";
export { PrometheusMetric } from "src/decorators/prometheus-metric.decorator";
export type { PrometheusMetricConfig } from "src/types/prometheus-metric.interface";
export {
	createHttpMetricsSet,
	createKafkaMetricsSet,
	createDatabaseMetricsSet,
} from "src/utils/metric-sets";
export type {
	HttpMetricsSet,
	KafkaMetricsSet,
	DatabaseMetricsSet,
} from "src/types/metric-sets.interface";
export { createMetricTimer, MetricTimer } from "src/utils/metric-timer";
export { default as wrapWithMetrics } from "src/utils/metric-wrapper";
export type { MetricWrapperOptions } from "src/types/metric-wrapper.interface";
export {
	extractHttpLabels,
	extractRequestLabels,
	createLabels,
	mergeLabels,
} from "src/utils/metric-labels";

export type {
	PrometheusModuleOptions,
	PrometheusModuleAsyncOptions,
	HttpMetricsOptions,
	PredefinedMetricsConfig,
} from "src/types/module-options.interface";
export { default as MetricRegistry } from "src/utils/metric-registry";
export type {
	default as PrometheusClientContract,
	CounterConfig,
	HistogramConfig,
	GaugeConfig,
	SummaryConfig,
	LabelNames,
	LabelValues,
} from "src/types/prometheus.interface";
