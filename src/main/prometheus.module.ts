import { Module, Global, DynamicModule, Provider } from "@nestjs/common";
import { PrometheusModule as NestPrometheusModule } from "@willsoto/nestjs-prometheus";
import PrometheusService from "src/main/prometheus.service";
import AiMetricsService from "src/services/ai-metrics.service";
import HttpMetricsService from "src/services/http-metrics.service";
import KafkaMetricsService from "src/services/kafka-metrics.service";
import { PROMETHEUS_MODULE_OPTIONS } from "src/utils/injection-keys";
import MetricRegistry from "src/utils/metric-registry";

import type {
	PrometheusModuleOptions,
	PrometheusModuleAsyncOptions,
} from "src/types/module-options.interface";

// Глобальный модуль для работы с Prometheus метриками
@Global()
@Module({})
export default class PrometheusClientModule {
	// Регистрация модуля с динамическими опциями через useFactory
	static forRootAsync<T extends unknown[]>(options: PrometheusModuleAsyncOptions<T>): DynamicModule {
		const optionsProvider: Provider = {
			provide: PROMETHEUS_MODULE_OPTIONS,
			useFactory: options.useFactory,
			inject: options.inject || [],
		};

		const providers: Provider[] = [
			optionsProvider,
			PrometheusService,
			HttpMetricsService,
			KafkaMetricsService,
			AiMetricsService,
			MetricRegistry,
		];

		// Создаем промежуточный модуль, который экспортирует PROMETHEUS_MODULE_OPTIONS
		// Это необходимо, чтобы NestPrometheusModule мог инжектить этот провайдер
		const optionsModule: DynamicModule = {
			module: class OptionsModule {},
			imports: options.imports || [],
			providers: [optionsProvider],
			exports: [PROMETHEUS_MODULE_OPTIONS],
		};

		const nestPrometheusModule = NestPrometheusModule.registerAsync({
			useFactory: (moduleOptions: PrometheusModuleOptions) => ({
				defaultMetrics: {
					enabled: moduleOptions.defaultMetrics ?? true,
				},
				path: moduleOptions.path ?? "/metrics",
			}),
			inject: [PROMETHEUS_MODULE_OPTIONS],
			imports: [optionsModule],
		});

		return {
			module: PrometheusClientModule,
			imports: [...(options.imports || []), nestPrometheusModule],
			providers,
			exports: [
				NestPrometheusModule,
				PrometheusService,
				HttpMetricsService,
				KafkaMetricsService,
				AiMetricsService,
				MetricRegistry,
				PROMETHEUS_MODULE_OPTIONS,
			],
		};
	}
}
