import { Reflector } from "@nestjs/core";
import {
	TrackDuration,
	TRACK_DURATION_METADATA_KEY,
} from "src/decorators/track-duration.decorator";

describe("TrackDuration", () => {
	let reflector: Reflector;

	beforeEach(() => {
		reflector = new Reflector();
	});

	it("should set metadata with default values", () => {
		class TestClass {
			@TrackDuration()
			testMethod() {}
		}

		const metadata = reflector.get(TRACK_DURATION_METADATA_KEY, TestClass.prototype.testMethod);
		expect(metadata).toEqual({ metricName: undefined, labels: undefined });
	});

	it("should set metadata with custom metric name", () => {
		class TestClass {
			@TrackDuration("custom_duration")
			testMethod() {}
		}

		const metadata = reflector.get(TRACK_DURATION_METADATA_KEY, TestClass.prototype.testMethod);
		expect(metadata).toEqual({ metricName: "custom_duration", labels: undefined });
	});

	it("should set metadata with custom labels", () => {
		class TestClass {
			@TrackDuration("custom_duration", { service: "TestService", operation: "test" })
			testMethod() {}
		}

		const metadata = reflector.get(TRACK_DURATION_METADATA_KEY, TestClass.prototype.testMethod);
		expect(metadata).toEqual({
			metricName: "custom_duration",
			labels: { service: "TestService", operation: "test" },
		});
	});
});
