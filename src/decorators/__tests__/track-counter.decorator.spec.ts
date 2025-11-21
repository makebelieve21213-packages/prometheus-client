import { Reflector } from "@nestjs/core";
import { TrackCounter, TRACK_COUNTER_METADATA_KEY } from "src/decorators/track-counter.decorator";

describe("TrackCounter", () => {
	let reflector: Reflector;

	beforeEach(() => {
		reflector = new Reflector();
	});

	it("should set metadata with default values", () => {
		class TestClass {
			@TrackCounter()
			testMethod() {}
		}

		const metadata = reflector.get(TRACK_COUNTER_METADATA_KEY, TestClass.prototype.testMethod);
		expect(metadata).toEqual({ metricName: undefined, labels: undefined });
	});

	it("should set metadata with custom metric name", () => {
		class TestClass {
			@TrackCounter("custom_counter")
			testMethod() {}
		}

		const metadata = reflector.get(TRACK_COUNTER_METADATA_KEY, TestClass.prototype.testMethod);
		expect(metadata).toEqual({ metricName: "custom_counter", labels: undefined });
	});

	it("should set metadata with custom labels", () => {
		class TestClass {
			@TrackCounter("custom_counter", { service: "TestService", operation: "test" })
			testMethod() {}
		}

		const metadata = reflector.get(TRACK_COUNTER_METADATA_KEY, TestClass.prototype.testMethod);
		expect(metadata).toEqual({
			metricName: "custom_counter",
			labels: { service: "TestService", operation: "test" },
		});
	});
});
