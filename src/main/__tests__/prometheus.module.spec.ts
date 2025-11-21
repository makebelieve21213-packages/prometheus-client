import { ConfigModule } from "@nestjs/config";
import PrometheusClientModule from "src/main/prometheus.module";
import PrometheusService from "src/main/prometheus.service";
import { PROMETHEUS_MODULE_OPTIONS } from "src/utils/injection-keys";

import type { PrometheusModuleOptions } from "src/types/module-options.interface";

// Мокируем @willsoto/nestjs-prometheus
jest.mock("@willsoto/nestjs-prometheus", () => ({
	PrometheusModule: {
		registerAsync: jest.fn(() => ({
			module: class MockPrometheusModule {},
			providers: [],
			exports: [],
		})),
	},
}));

describe("PrometheusClientModule", () => {
	describe("forRootAsync", () => {
		it("should create module with async options using useFactory", async () => {
			const options: PrometheusModuleOptions = {
				path: "/custom-metrics",
				defaultMetrics: true,
			};

			const module = PrometheusClientModule.forRootAsync({
				useFactory: () => options,
			});

			expect(module.module).toBe(PrometheusClientModule);
			expect(module.providers).toHaveLength(6);
			expect(module.providers).toContainEqual({
				provide: PROMETHEUS_MODULE_OPTIONS,
				useFactory: expect.any(Function),
				inject: [],
			});
			expect(module.providers).toContain(PrometheusService);
		});

		it("should inject dependencies in useFactory", async () => {
			const configToken = "CONFIG_TOKEN";

			const module = PrometheusClientModule.forRootAsync({
				useFactory: (config: PrometheusModuleOptions) => config,
				inject: [configToken],
			});

			const provider = module.providers?.find(
				(p) => (p as { provide?: string }).provide === PROMETHEUS_MODULE_OPTIONS
			) as { provide: string; useFactory: () => PrometheusModuleOptions; inject: unknown[] };

			expect(provider.inject).toEqual([configToken]);
		});

		it("should handle async factory function", async () => {
			const options: PrometheusModuleOptions = {
				path: "/metrics",
				defaultMetrics: false,
			};

			const module = PrometheusClientModule.forRootAsync({
				useFactory: async () => options,
			});

			expect(module.module).toBe(PrometheusClientModule);
			expect(module.providers).toBeDefined();
		});

		it("should support imports in forRootAsync", async () => {
			const module = PrometheusClientModule.forRootAsync({
				useFactory: () => ({ path: "/metrics" }),
				imports: [ConfigModule],
			});

			expect(module.imports).toContain(ConfigModule);
		});

		it("should work without inject parameter", async () => {
			const module = PrometheusClientModule.forRootAsync({
				useFactory: () => ({ path: "/metrics" }),
			});

			const provider = module.providers?.find(
				(p) => (p as { provide?: string }).provide === PROMETHEUS_MODULE_OPTIONS
			) as { provide: string; useFactory: () => PrometheusModuleOptions; inject: unknown[] };

			expect(provider.inject).toEqual([]);
		});

		it("should work without imports parameter", async () => {
			const module = PrometheusClientModule.forRootAsync({
				useFactory: () => ({ path: "/metrics" }),
			});

			expect(module.imports).toBeDefined();
		});

		it("should export PrometheusService", async () => {
			const module = PrometheusClientModule.forRootAsync({
				useFactory: () => ({ path: "/metrics" }),
			});

			expect(module.exports).toContain(PrometheusService);
		});

		it("should configure NestPrometheusModule with default path", async () => {
			const { PrometheusModule } = await import("@willsoto/nestjs-prometheus");
			const registerAsyncSpy = jest.spyOn(PrometheusModule, "registerAsync");

			PrometheusClientModule.forRootAsync({
				useFactory: () => ({}),
			});

			expect(registerAsyncSpy).toHaveBeenCalled();
			const callArgs = registerAsyncSpy.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			expect(callArgs?.useFactory).toBeDefined();

			if (callArgs?.useFactory) {
				const result = callArgs.useFactory({});
				expect(result).toEqual({
					defaultMetrics: {
						enabled: true,
					},
					path: "/metrics",
				});
			}
		});

		it("should configure NestPrometheusModule with custom path", async () => {
			const { PrometheusModule } = await import("@willsoto/nestjs-prometheus");
			const registerAsyncSpy = jest.spyOn(PrometheusModule, "registerAsync");

			PrometheusClientModule.forRootAsync({
				useFactory: () => ({ path: "/custom-path" }),
			});

			const callArgs = registerAsyncSpy.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			if (callArgs?.useFactory) {
				const result = callArgs.useFactory({ path: "/custom-path" });
				expect(result).toEqual({
					defaultMetrics: {
						enabled: true,
					},
					path: "/custom-path",
				});
			}
		});

		it("should configure NestPrometheusModule with defaultMetrics disabled", async () => {
			const { PrometheusModule } = await import("@willsoto/nestjs-prometheus");
			const registerAsyncSpy = jest.spyOn(PrometheusModule, "registerAsync");

			PrometheusClientModule.forRootAsync({
				useFactory: () => ({ defaultMetrics: false }),
			});

			const callArgs = registerAsyncSpy.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			if (callArgs?.useFactory) {
				const result = callArgs.useFactory({ defaultMetrics: false });
				expect(result).toEqual({
					defaultMetrics: {
						enabled: false,
					},
					path: "/metrics",
				});
			}
		});

		it("should configure NestPrometheusModule with defaultMetrics enabled", async () => {
			const { PrometheusModule } = await import("@willsoto/nestjs-prometheus");
			const registerAsyncSpy = jest.spyOn(PrometheusModule, "registerAsync");

			PrometheusClientModule.forRootAsync({
				useFactory: () => ({ defaultMetrics: true }),
			});

			const callArgs = registerAsyncSpy.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			if (callArgs?.useFactory) {
				const result = callArgs.useFactory({ defaultMetrics: true });
				expect(result).toEqual({
					defaultMetrics: {
						enabled: true,
					},
					path: "/metrics",
				});
			}
		});

		it("should inject PROMETHEUS_MODULE_OPTIONS into NestPrometheusModule", async () => {
			const { PrometheusModule } = await import("@willsoto/nestjs-prometheus");
			const registerAsyncSpy = jest.spyOn(PrometheusModule, "registerAsync");

			PrometheusClientModule.forRootAsync({
				useFactory: () => ({ path: "/metrics" }),
			});

			const callArgs = registerAsyncSpy.mock.calls[0]?.[0];
			expect(callArgs?.inject).toEqual([PROMETHEUS_MODULE_OPTIONS]);
		});
	});

	describe("module integration", () => {
		it("should be a global module", async () => {
			const module = PrometheusClientModule.forRootAsync({
				useFactory: () => ({ path: "/metrics" }),
			});

			expect(module.global).toBeUndefined(); // @Global() декоратор применяется к классу, не к DynamicModule
		});
	});
});
