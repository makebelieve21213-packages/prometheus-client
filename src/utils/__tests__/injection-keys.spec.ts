import { PROMETHEUS_MODULE_OPTIONS } from "src/utils/injection-keys";

describe("injection-keys", () => {
	it("should export PROMETHEUS_MODULE_OPTIONS constant", () => {
		expect(PROMETHEUS_MODULE_OPTIONS).toBe("PROMETHEUS_MODULE_OPTIONS");
	});
});
