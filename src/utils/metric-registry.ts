import { Injectable, OnModuleInit, Inject, Optional } from "@nestjs/common";
import PrometheusService from "src/main/prometheus.service";
import { PROMETHEUS_MODULE_OPTIONS } from "src/utils/injection-keys";

import type { Counter, Histogram, Gauge, Summary } from "prom-client";
import type {
	PrometheusModuleOptions,
	PredefinedMetricsConfig,
} from "src/types/module-options.interface";

// Реестр предварительно зарегистрированных метрик
@Injectable()
export default class MetricRegistry implements OnModuleInit {
	private readonly counters: Map<string, Counter> = new Map();
	private readonly histograms: Map<string, Histogram> = new Map();
	private readonly gauges: Map<string, Gauge> = new Map();
	private readonly summaries: Map<string, Summary> = new Map();

	constructor(
		private readonly prometheusService: PrometheusService,
		@Optional()
		@Inject(PROMETHEUS_MODULE_OPTIONS)
		private readonly moduleOptions?: PrometheusModuleOptions
	) {}

	onModuleInit() {
		if (this.moduleOptions?.predefinedMetrics) {
			this.registerPredefinedMetrics(this.moduleOptions.predefinedMetrics);
		}
	}

	private registerPredefinedMetrics(config: PredefinedMetricsConfig): void {
		if (config.counters) {
			for (const counterConfig of config.counters) {
				const counter = this.prometheusService.createCounter(counterConfig);
				this.counters.set(counterConfig.name, counter);
			}
		}

		if (config.histograms) {
			for (const histogramConfig of config.histograms) {
				const histogram = this.prometheusService.createHistogram(histogramConfig);
				this.histograms.set(histogramConfig.name, histogram);
			}
		}

		if (config.gauges) {
			for (const gaugeConfig of config.gauges) {
				const gauge = this.prometheusService.createGauge(gaugeConfig);
				this.gauges.set(gaugeConfig.name, gauge);
			}
		}

		if (config.summaries) {
			for (const summaryConfig of config.summaries) {
				const summary = this.prometheusService.createSummary(summaryConfig);
				this.summaries.set(summaryConfig.name, summary);
			}
		}
	}

	// Получить предварительно зарегистрированный Counter
	getCounter(name: string): Counter | undefined {
		return this.counters.get(name);
	}

	// Получить предварительно зарегистрированный Histogram
	getHistogram(name: string): Histogram | undefined {
		return this.histograms.get(name);
	}

	// Получить предварительно зарегистрированный Gauge
	getGauge(name: string): Gauge | undefined {
		return this.gauges.get(name);
	}

	// Получить предварительно зарегистрированный Summary
	getSummary(name: string): Summary | undefined {
		return this.summaries.get(name);
	}

	// Получить все зарегистрированные метрики
	getAllMetrics(): {
		counters: Map<string, Counter>;
		histograms: Map<string, Histogram>;
		gauges: Map<string, Gauge>;
		summaries: Map<string, Summary>;
	} {
		return {
			counters: this.counters,
			histograms: this.histograms,
			gauges: this.gauges,
			summaries: this.summaries,
		};
	}
}
