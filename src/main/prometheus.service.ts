import { Injectable } from "@nestjs/common";
import { Counter, Histogram, Gauge, Summary, Registry, register } from "prom-client";

import type PrometheusClientContract from "src/types/prometheus.interface";
import type {
	CounterConfig,
	HistogramConfig,
	GaugeConfig,
	SummaryConfig,
} from "src/types/prometheus.interface";

/**
 * Сервис для работы с Prometheus метриками
 * Использует глобальный Registry от prom-client для совместимости с @willsoto/nestjs-prometheus
 */
@Injectable()
export default class PrometheusService implements PrometheusClientContract {
	/**
	 * Используем глобальный Registry от prom-client, который используется
	 * @willsoto/nestjs-prometheus
	 * Это гарантирует, что все метрики будут экспортироваться на /metrics endpoint
	 */
	private readonly registry: Registry = register;

	// Создание Counter метрики
	createCounter<T extends string = string>(config: CounterConfig<T>): Counter<string> {
		// Проверяем, существует ли метрика с таким именем
		const existingMetric = this.registry.getSingleMetric(config.name);
		if (existingMetric && existingMetric instanceof Counter) {
			return existingMetric as Counter<string>;
		}

		const counterConfig: {
			name: string;
			help: string;
			labelNames?: readonly string[];
			registers: Registry[];
		} = {
			...config,
			registers: [this.registry],
		};

		if (config.labelNames) {
			counterConfig.labelNames = [...config.labelNames];
		}

		return new Counter(counterConfig);
	}

	// Создание Histogram метрики
	createHistogram<T extends string = string>(config: HistogramConfig<T>): Histogram<string> {
		// Проверяем, существует ли метрика с таким именем
		const existingMetric = this.registry.getSingleMetric(config.name);
		if (existingMetric && existingMetric instanceof Histogram) {
			return existingMetric as Histogram<string>;
		}

		const histogramConfig: {
			name: string;
			help: string;
			labelNames?: readonly string[];
			buckets?: number[];
			registers: Registry[];
		} = {
			...config,
			registers: [this.registry],
		};

		if (config.labelNames) {
			histogramConfig.labelNames = [...config.labelNames];
		}

		return new Histogram(histogramConfig);
	}

	// Создание Gauge метрики
	createGauge<T extends string = string>(config: GaugeConfig<T>): Gauge<string> {
		// Проверяем, существует ли метрика с таким именем
		const existingMetric = this.registry.getSingleMetric(config.name);
		if (existingMetric && existingMetric instanceof Gauge) {
			return existingMetric as Gauge<string>;
		}

		const gaugeConfig: {
			name: string;
			help: string;
			labelNames?: readonly string[];
			registers: Registry[];
		} = {
			...config,
			registers: [this.registry],
		};

		if (config.labelNames) {
			gaugeConfig.labelNames = [...config.labelNames];
		}

		return new Gauge(gaugeConfig);
	}

	// Создание Summary метрики
	createSummary<T extends string = string>(config: SummaryConfig<T>): Summary<string> {
		// Проверяем, существует ли метрика с таким именем
		const existingMetric = this.registry.getSingleMetric(config.name);
		if (existingMetric && existingMetric instanceof Summary) {
			return existingMetric as Summary<string>;
		}

		const summaryConfig: {
			name: string;
			help: string;
			labelNames?: readonly string[];
			percentiles?: number[];
			maxAgeSeconds?: number;
			ageBuckets?: number;
			compressCount?: number;
			registers: Registry[];
		} = {
			...config,
			registers: [this.registry],
		};

		if (config.labelNames) {
			summaryConfig.labelNames = [...config.labelNames];
		}

		return new Summary(summaryConfig);
	}

	// Получить Registry для экспорта метрик
	getRegistry(): Registry {
		return this.registry;
	}
}
