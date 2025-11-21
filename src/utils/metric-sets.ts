import type PrometheusService from "src/main/prometheus.service";
import type {
	HttpMetricsSet,
	KafkaMetricsSet,
	DatabaseMetricsSet,
} from "src/types/metric-sets.interface";

// Создать предустановленный набор HTTP метрик
export function createHttpMetricsSet(prometheusService: PrometheusService): HttpMetricsSet {
	return {
		httpRequestsTotal: prometheusService.createCounter({
			name: "http_requests_total",
			help: "Total number of HTTP requests",
			labelNames: ["method", "route", "status", "controller", "handler"],
		}),

		httpRequestDuration: prometheusService.createHistogram({
			name: "http_request_duration_seconds",
			help: "Duration of HTTP requests in seconds",
			labelNames: ["method", "route", "controller", "handler"],
			buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
		}),

		httpRequestSize: prometheusService.createHistogram({
			name: "http_request_size_bytes",
			help: "Size of HTTP requests in bytes",
			labelNames: ["method", "route"],
			buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
		}),

		httpResponseSize: prometheusService.createHistogram({
			name: "http_response_size_bytes",
			help: "Size of HTTP responses in bytes",
			labelNames: ["method", "route", "status"],
			buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000],
		}),

		httpErrorsTotal: prometheusService.createCounter({
			name: "http_errors_total",
			help: "Total number of HTTP errors",
			labelNames: ["method", "route", "status", "error_type"],
		}),
	};
}

// Создать предустановленный набор Kafka метрик
export function createKafkaMetricsSet(prometheusService: PrometheusService): KafkaMetricsSet {
	return {
		kafkaMessagesTotal: prometheusService.createCounter({
			name: "kafka_messages_total",
			help: "Total number of Kafka messages processed",
			labelNames: ["topic", "command_type", "status"],
		}),

		kafkaMessageDuration: prometheusService.createHistogram({
			name: "kafka_message_duration_seconds",
			help: "Duration of Kafka message processing in seconds",
			labelNames: ["topic", "command_type"],
			buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
		}),

		kafkaErrorsTotal: prometheusService.createCounter({
			name: "kafka_errors_total",
			help: "Total number of Kafka processing errors",
			labelNames: ["topic", "command_type", "error_type"],
		}),
	};
}

// Создать предустановленный набор метрик базы данных
export function createDatabaseMetricsSet(prometheusService: PrometheusService): DatabaseMetricsSet {
	return {
		databaseQueriesTotal: prometheusService.createCounter({
			name: "database_queries_total",
			help: "Total number of database queries",
			labelNames: ["database", "operation", "status"],
		}),

		databaseQueryDuration: prometheusService.createHistogram({
			name: "database_query_duration_seconds",
			help: "Duration of database queries in seconds",
			labelNames: ["database", "operation"],
			buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
		}),

		databaseConnectionsActive: prometheusService.createGauge({
			name: "database_connections_active",
			help: "Number of active database connections",
			labelNames: ["database"],
		}),

		databaseConnectionsIdle: prometheusService.createGauge({
			name: "database_connections_idle",
			help: "Number of idle database connections",
			labelNames: ["database"],
		}),

		databaseErrorsTotal: prometheusService.createCounter({
			name: "database_errors_total",
			help: "Total number of database errors",
			labelNames: ["database", "operation", "error_type"],
		}),
	};
}
