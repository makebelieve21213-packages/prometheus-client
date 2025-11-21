import { SetMetadata } from "@nestjs/common";

export const TRACK_COUNTER_METADATA_KEY = "prometheus:track-counter";

/**
 * Декоратор для автоматического подсчета вызовов метода
 * Используется вместе с PrometheusMetricsInterceptor
 */
export function TrackCounter(metricName?: string, labels?: Record<string, string>) {
	return SetMetadata(TRACK_COUNTER_METADATA_KEY, { metricName, labels });
}
