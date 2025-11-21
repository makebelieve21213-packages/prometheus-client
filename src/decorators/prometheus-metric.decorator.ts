import { SetMetadata } from "@nestjs/common";
import type { PrometheusMetricConfig } from "src/types/prometheus-metric.interface";

export const PROMETHEUS_METRIC_METADATA_KEY = "prometheus:metric";

export function PrometheusMetric(config: PrometheusMetricConfig) {
	return SetMetadata(PROMETHEUS_METRIC_METADATA_KEY, config);
}
