import { Reflector } from "@nestjs/core";
import {
	PrometheusMetric,
	PROMETHEUS_METRIC_METADATA_KEY,
} from "src/decorators/prometheus-metric.decorator";

import type { PrometheusMetricConfig } from "src/types/prometheus-metric.interface";

describe("PrometheusMetric", () => {
	let reflector: Reflector;

	beforeEach(() => {
		reflector = new Reflector();
	});

	it("should set metadata for counter metric", () => {
		const config: PrometheusMetricConfig = {
			type: "counter",
			name: "test_counter",
			help: "Test counter metric",
			labels: ["label1", "label2"],
		};

		class TestClass {
			@PrometheusMetric(config)
			testMethod() {}
		}

		const metadata = reflector.get(PROMETHEUS_METRIC_METADATA_KEY, TestClass.prototype.testMethod);
		expect(metadata).toEqual(config);
	});

	it("should set metadata for histogram metric", () => {
		const config: PrometheusMetricConfig = {
			type: "histogram",
			name: "test_histogram",
			help: "Test histogram metric",
			labels: ["label1"],
			buckets: [0.1, 0.5, 1, 2, 5],
		};

		class TestClass {
			@PrometheusMetric(config)
			testMethod() {}
		}

		const metadata = reflector.get(PROMETHEUS_METRIC_METADATA_KEY, TestClass.prototype.testMethod);
		expect(metadata).toEqual(config);
	});

	it("should set metadata for summary metric", () => {
		const config: PrometheusMetricConfig = {
			type: "summary",
			name: "test_summary",
			help: "Test summary metric",
			percentiles: [0.5, 0.9, 0.99],
		};

		class TestClass {
			@PrometheusMetric(config)
			testMethod() {}
		}

		const metadata = reflector.get(PROMETHEUS_METRIC_METADATA_KEY, TestClass.prototype.testMethod);
		expect(metadata).toEqual(config);
	});
});
