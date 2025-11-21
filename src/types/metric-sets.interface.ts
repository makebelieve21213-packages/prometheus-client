import type { Counter, Histogram, Gauge } from "prom-client";

// Набор HTTP метрик
export interface HttpMetricsSet {
	httpRequestsTotal: Counter;
	httpRequestDuration: Histogram;
	httpRequestSize: Histogram;
	httpResponseSize: Histogram;
	httpErrorsTotal: Counter;
}

// Набор Kafka метрик
export interface KafkaMetricsSet {
	kafkaMessagesTotal: Counter;
	kafkaMessageDuration: Histogram;
	kafkaErrorsTotal: Counter;
}

// Набор метрик базы данных
export interface DatabaseMetricsSet {
	databaseQueriesTotal: Counter;
	databaseQueryDuration: Histogram;
	databaseConnectionsActive: Gauge;
	databaseConnectionsIdle: Gauge;
	databaseErrorsTotal: Counter;
}
