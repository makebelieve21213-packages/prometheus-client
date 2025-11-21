import { SetMetadata } from "@nestjs/common";

export const TRACK_DURATION_METADATA_KEY = "prometheus:track-duration";

/**
 * Декоратор для автоматического измерения времени выполнения метода
 * Используется вместе с PrometheusMetricsInterceptor
 */
export function TrackDuration(metricName?: string, labels?: Record<string, string>) {
	return SetMetadata(TRACK_DURATION_METADATA_KEY, { metricName, labels });
}
