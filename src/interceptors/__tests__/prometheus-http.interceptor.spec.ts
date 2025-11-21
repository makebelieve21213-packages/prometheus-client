import { Test } from "@nestjs/testing";
import { register } from "prom-client";
import { of, throwError } from "rxjs";
import PrometheusHttpInterceptor from "src/interceptors/prometheus-http.interceptor";
import PrometheusService from "src/main/prometheus.service";
import { PROMETHEUS_MODULE_OPTIONS } from "src/utils/injection-keys";

import type { ExecutionContext, CallHandler } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import type { Counter, Histogram } from "prom-client";
import type { PrometheusModuleOptions } from "src/types/module-options.interface";

describe("PrometheusHttpInterceptor", () => {
	let interceptor: PrometheusHttpInterceptor;
	let prometheusService: PrometheusService;
	let mockCounter: { inc: jest.Mock };
	let mockHistogramDuration: { observe: jest.Mock };
	let mockHistogramRequestSize: { observe: jest.Mock };
	let mockHistogramResponseSize: { observe: jest.Mock };
	let createCounterSpy: jest.SpyInstance;
	let createHistogramSpy: jest.SpyInstance;

	beforeEach(async () => {
		// Очищаем registry перед каждым тестом
		register.clear();

		mockCounter = { inc: jest.fn() };
		mockHistogramDuration = { observe: jest.fn() };
		mockHistogramRequestSize = { observe: jest.fn() };
		mockHistogramResponseSize = { observe: jest.fn() };

		// Создаем модуль с PrometheusService
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PrometheusService,
				{
					provide: PROMETHEUS_MODULE_OPTIONS,
					useValue: {
						httpMetrics: {
							enabled: true,
						},
					} as PrometheusModuleOptions,
				},
			],
		}).compile();

		prometheusService = module.get<PrometheusService>(PrometheusService);

		// Мокаем создание метрик ДО создания интерцептора
		// Интерцептор создает: 1 counter и 3 histogram (duration, requestSize, responseSize)
		createCounterSpy = jest
			.spyOn(prometheusService, "createCounter")
			.mockReturnValue(mockCounter as unknown as Counter<string>);
		createHistogramSpy = jest
			.spyOn(prometheusService, "createHistogram")
			.mockReturnValueOnce(mockHistogramDuration as unknown as Histogram<string>) // для duration
			.mockReturnValueOnce(mockHistogramRequestSize as unknown as Histogram<string>) // для requestSize
			.mockReturnValueOnce(mockHistogramResponseSize as unknown as Histogram<string>); // для responseSize

		// Теперь создаем интерцептор с уже замокированным сервисом
		interceptor = new PrometheusHttpInterceptor(prometheusService, {
			httpMetrics: {
				enabled: true,
			},
		} as PrometheusModuleOptions);
	});

	afterEach(() => {
		createCounterSpy?.mockRestore();
		createHistogramSpy?.mockRestore();
	});

	it("should be defined", () => {
		expect(interceptor).toBeDefined();
	});

	it("should use custom duration buckets when provided", async () => {
		register.clear();
		const mockCounterCustom = { inc: jest.fn() };
		const mockHistogramCustom1 = { observe: jest.fn() };
		const mockHistogramCustom2 = { observe: jest.fn() };
		const mockHistogramCustom3 = { observe: jest.fn() };

		const moduleCustom: TestingModule = await Test.createTestingModule({
			providers: [
				PrometheusService,
				{
					provide: PROMETHEUS_MODULE_OPTIONS,
					useValue: {
						httpMetrics: {
							enabled: true,
							durationBuckets: [0.1, 0.5, 1.0],
						},
					} as PrometheusModuleOptions,
				},
			],
		}).compile();

		const prometheusServiceCustom = moduleCustom.get<PrometheusService>(PrometheusService);
		jest
			.spyOn(prometheusServiceCustom, "createCounter")
			.mockReturnValue(mockCounterCustom as unknown as Counter<string>);
		const createHistogramSpyCustom = jest
			.spyOn(prometheusServiceCustom, "createHistogram")
			.mockReturnValueOnce(mockHistogramCustom1 as unknown as Histogram<string>)
			.mockReturnValueOnce(mockHistogramCustom2 as unknown as Histogram<string>)
			.mockReturnValueOnce(mockHistogramCustom3 as unknown as Histogram<string>);

		new PrometheusHttpInterceptor(prometheusServiceCustom, {
			httpMetrics: {
				enabled: true,
				durationBuckets: [0.1, 0.5, 1.0],
			},
		} as PrometheusModuleOptions);

		expect(createHistogramSpyCustom).toHaveBeenCalledWith(
			expect.objectContaining({
				buckets: [0.1, 0.5, 1.0],
			})
		);
	});

	it("should use custom request size buckets when provided", async () => {
		register.clear();
		const mockCounterCustom = { inc: jest.fn() };
		const mockHistogramCustom1 = { observe: jest.fn() };
		const mockHistogramCustom2 = { observe: jest.fn() };
		const mockHistogramCustom3 = { observe: jest.fn() };

		const moduleCustom: TestingModule = await Test.createTestingModule({
			providers: [
				PrometheusService,
				{
					provide: PROMETHEUS_MODULE_OPTIONS,
					useValue: {
						httpMetrics: {
							enabled: true,
							requestSizeBuckets: [200, 1000, 5000],
						},
					} as PrometheusModuleOptions,
				},
			],
		}).compile();

		const prometheusServiceCustom = moduleCustom.get<PrometheusService>(PrometheusService);
		jest
			.spyOn(prometheusServiceCustom, "createCounter")
			.mockReturnValue(mockCounterCustom as unknown as Counter<string>);
		const createHistogramSpyCustom = jest
			.spyOn(prometheusServiceCustom, "createHistogram")
			.mockReturnValueOnce(mockHistogramCustom1 as unknown as Histogram<string>)
			.mockReturnValueOnce(mockHistogramCustom2 as unknown as Histogram<string>)
			.mockReturnValueOnce(mockHistogramCustom3 as unknown as Histogram<string>);

		new PrometheusHttpInterceptor(prometheusServiceCustom, {
			httpMetrics: {
				enabled: true,
				requestSizeBuckets: [200, 1000, 5000],
			},
		} as PrometheusModuleOptions);

		const calls = createHistogramSpyCustom.mock.calls;
		expect(calls[1]).toEqual([
			expect.objectContaining({
				buckets: [200, 1000, 5000],
			}),
		]);
	});

	it("should use custom response size buckets when provided", async () => {
		register.clear();
		const mockCounterCustom = { inc: jest.fn() };
		const mockHistogramCustom1 = { observe: jest.fn() };
		const mockHistogramCustom2 = { observe: jest.fn() };
		const mockHistogramCustom3 = { observe: jest.fn() };

		const moduleCustom: TestingModule = await Test.createTestingModule({
			providers: [
				PrometheusService,
				{
					provide: PROMETHEUS_MODULE_OPTIONS,
					useValue: {
						httpMetrics: {
							enabled: true,
							responseSizeBuckets: [300, 1500, 6000],
						},
					} as PrometheusModuleOptions,
				},
			],
		}).compile();

		const prometheusServiceCustom = moduleCustom.get<PrometheusService>(PrometheusService);
		jest
			.spyOn(prometheusServiceCustom, "createCounter")
			.mockReturnValue(mockCounterCustom as unknown as Counter<string>);
		const createHistogramSpyCustom = jest
			.spyOn(prometheusServiceCustom, "createHistogram")
			.mockReturnValueOnce(mockHistogramCustom1 as unknown as Histogram<string>)
			.mockReturnValueOnce(mockHistogramCustom2 as unknown as Histogram<string>)
			.mockReturnValueOnce(mockHistogramCustom3 as unknown as Histogram<string>);

		new PrometheusHttpInterceptor(prometheusServiceCustom, {
			httpMetrics: {
				enabled: true,
				responseSizeBuckets: [300, 1500, 6000],
			},
		} as PrometheusModuleOptions);

		const calls = createHistogramSpyCustom.mock.calls;
		expect(calls[2]).toEqual([
			expect.objectContaining({
				buckets: [300, 1500, 6000],
			}),
		]);
	});

	describe("intercept", () => {
		it("should record metrics for successful request", (done) => {
			const mockRequest = {
				method: "GET",
				url: "/api/test",
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockCounter.inc).toHaveBeenCalledWith({
						method: "GET",
						route: "/api/test",
						status: "200",
						controller: "TestController",
						handler: "testHandler",
					});
					expect(mockHistogramDuration.observe).toHaveBeenCalled();
					done();
				},
			});
		});

		it("should record metrics for failed request", (done) => {
			const mockRequest = {
				method: "POST",
				url: "/api/error",
				headers: {},
			};
			const mockResponse = {
				statusCode: 500,
			};
			const error = { status: 500, message: "Internal Server Error" };
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "ErrorController" }),
				getHandler: jest.fn().mockReturnValue({ name: "errorHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => throwError(() => error),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				error: (err) => {
					expect(mockCounter.inc).toHaveBeenCalledWith({
						method: "POST",
						route: "/api/error",
						status: "500",
						controller: "ErrorController",
						handler: "errorHandler",
					});
					expect(mockHistogramDuration.observe).toHaveBeenCalled();
					expect(err).toBe(error);
					done();
				},
			});
		});

		it("should ignore requests when disabled", async () => {
			register.clear();
			const moduleDisabled: TestingModule = await Test.createTestingModule({
				providers: [
					PrometheusService,
					{
						provide: PROMETHEUS_MODULE_OPTIONS,
						useValue: {
							httpMetrics: {
								enabled: false,
							},
						} as PrometheusModuleOptions,
					},
				],
			}).compile();

			const prometheusServiceDisabled = moduleDisabled.get<PrometheusService>(PrometheusService);
			const interceptorDisabled = new PrometheusHttpInterceptor(prometheusServiceDisabled, {
				httpMetrics: {
					enabled: false,
				},
			} as PrometheusModuleOptions);

			const mockRequest = {
				method: "GET",
				url: "/api/test",
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => ({}),
				}),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			await new Promise<void>((resolve) => {
				interceptorDisabled.intercept(mockContext, mockHandler).subscribe({
					next: () => {
						expect(mockCounter.inc).not.toHaveBeenCalled();
						resolve();
					},
				});
			});
		});

		it("should ignore requests matching ignorePaths", async () => {
			register.clear();
			const mockCounterIgnore = { inc: jest.fn() };
			const mockHistogramIgnore1 = { observe: jest.fn() };
			const mockHistogramIgnore2 = { observe: jest.fn() };
			const mockHistogramIgnore3 = { observe: jest.fn() };

			const moduleWithIgnore: TestingModule = await Test.createTestingModule({
				providers: [
					PrometheusService,
					{
						provide: PROMETHEUS_MODULE_OPTIONS,
						useValue: {
							httpMetrics: {
								enabled: true,
								ignorePaths: ["/metrics", "/health"],
							},
						} as PrometheusModuleOptions,
					},
				],
			}).compile();

			const prometheusServiceIgnore = moduleWithIgnore.get<PrometheusService>(PrometheusService);
			jest
				.spyOn(prometheusServiceIgnore, "createCounter")
				.mockReturnValue(mockCounterIgnore as unknown as Counter<string>);
			jest
				.spyOn(prometheusServiceIgnore, "createHistogram")
				.mockReturnValueOnce(mockHistogramIgnore1 as unknown as Histogram<string>)
				.mockReturnValueOnce(mockHistogramIgnore2 as unknown as Histogram<string>)
				.mockReturnValueOnce(mockHistogramIgnore3 as unknown as Histogram<string>);

			const interceptorWithIgnore = new PrometheusHttpInterceptor(prometheusServiceIgnore, {
				httpMetrics: {
					enabled: true,
					ignorePaths: ["/metrics", "/health"],
				},
			} as PrometheusModuleOptions);

			const mockRequest = {
				method: "GET",
				url: "/metrics",
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => ({}),
				}),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			await new Promise<void>((resolve) => {
				interceptorWithIgnore.intercept(mockContext, mockHandler).subscribe({
					next: () => {
						expect(mockCounterIgnore.inc).not.toHaveBeenCalled();
						resolve();
					},
				});
			});
		});

		it("should calculate request size from content-length header", (done) => {
			const mockRequest = {
				method: "POST",
				url: "/api/test",
				headers: {
					"content-length": "1024",
				},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockHistogramRequestSize.observe).toHaveBeenCalledWith(
						{ method: "POST", route: "/api/test" },
						1024
					);
					done();
				},
			});
		});

		it("should calculate request size from content-length header array", (done) => {
			const mockRequest = {
				method: "POST",
				url: "/api/test",
				headers: {
					"content-length": ["2048"],
				},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockHistogramRequestSize.observe).toHaveBeenCalledWith(
						{ method: "POST", route: "/api/test" },
						2048
					);
					done();
				},
			});
		});

		it("should handle invalid content-length header", (done) => {
			const mockRequest = {
				method: "POST",
				url: "/api/test",
				headers: {
					"content-length": "invalid",
				},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					const requestSizeCalls = mockHistogramRequestSize.observe.mock.calls;
					expect(requestSizeCalls.length).toBe(0);
					done();
				},
			});
		});

		it("should ignore requests matching ignoreMethods", async () => {
			register.clear();
			const mockCounterIgnore = { inc: jest.fn() };
			const mockHistogramIgnore1 = { observe: jest.fn() };
			const mockHistogramIgnore2 = { observe: jest.fn() };
			const mockHistogramIgnore3 = { observe: jest.fn() };

			const moduleWithIgnore: TestingModule = await Test.createTestingModule({
				providers: [
					PrometheusService,
					{
						provide: PROMETHEUS_MODULE_OPTIONS,
						useValue: {
							httpMetrics: {
								enabled: true,
								ignoreMethods: ["OPTIONS", "HEAD"],
							},
						} as PrometheusModuleOptions,
					},
				],
			}).compile();

			const prometheusServiceIgnore = moduleWithIgnore.get<PrometheusService>(PrometheusService);
			jest
				.spyOn(prometheusServiceIgnore, "createCounter")
				.mockReturnValue(mockCounterIgnore as unknown as Counter<string>);
			jest
				.spyOn(prometheusServiceIgnore, "createHistogram")
				.mockReturnValueOnce(mockHistogramIgnore1 as unknown as Histogram<string>)
				.mockReturnValueOnce(mockHistogramIgnore2 as unknown as Histogram<string>)
				.mockReturnValueOnce(mockHistogramIgnore3 as unknown as Histogram<string>);

			const interceptorWithIgnore = new PrometheusHttpInterceptor(prometheusServiceIgnore, {
				httpMetrics: {
					enabled: true,
					ignoreMethods: ["OPTIONS", "HEAD"],
				},
			} as PrometheusModuleOptions);

			const mockRequest = {
				method: "OPTIONS",
				url: "/api/test",
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => ({}),
				}),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			await new Promise<void>((resolve) => {
				interceptorWithIgnore.intercept(mockContext, mockHandler).subscribe({
					next: () => {
						expect(mockCounterIgnore.inc).not.toHaveBeenCalled();
						resolve();
					},
				});
			});
		});

		it("should use route.path when available", (done) => {
			const mockRequest = {
				method: "GET",
				url: "/api/test?param=value",
				route: {
					path: "/api/test",
				},
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockCounter.inc).toHaveBeenCalledWith(
						expect.objectContaining({
							route: "/api/test",
						})
					);
					done();
				},
			});
		});

		it("should strip query parameters from url when route.path is not available", (done) => {
			const mockRequest = {
				method: "GET",
				url: "/api/test?param=value&other=123",
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockCounter.inc).toHaveBeenCalledWith(
						expect.objectContaining({
							route: "/api/test",
						})
					);
					done();
				},
			});
		});

		it("should calculate request size from string body", (done) => {
			const mockRequest = {
				method: "POST",
				url: "/api/test",
				headers: {},
				body: "test body content",
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockHistogramRequestSize.observe).toHaveBeenCalled();
					done();
				},
			});
		});

		it("should calculate request size from object body", (done) => {
			const mockRequest = {
				method: "POST",
				url: "/api/test",
				headers: {},
				body: { key: "value", nested: { data: "test" } },
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockHistogramRequestSize.observe).toHaveBeenCalled();
					done();
				},
			});
		});

		it("should calculate response size from string data", (done) => {
			const mockRequest = {
				method: "GET",
				url: "/api/test",
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of("response string data"),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockHistogramResponseSize.observe).toHaveBeenCalled();
					done();
				},
			});
		});

		it("should calculate response size from object data", (done) => {
			const mockRequest = {
				method: "GET",
				url: "/api/test",
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test", nested: { value: 123 } }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockHistogramResponseSize.observe).toHaveBeenCalled();
					done();
				},
			});
		});

		it("should not record response size when data is null or undefined", (done) => {
			const mockRequest = {
				method: "GET",
				url: "/api/test",
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of(null),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					const responseSizeCalls = mockHistogramResponseSize.observe.mock.calls;
					expect(responseSizeCalls.length).toBe(0);
					done();
				},
			});
		});

		it("should return 0 for response size when data is not string or object", (done) => {
			const mockRequest = {
				method: "GET",
				url: "/api/test",
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of(123), // число вместо строки или объекта
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					const responseSizeCalls = mockHistogramResponseSize.observe.mock.calls;
					expect(responseSizeCalls.length).toBe(0);
					done();
				},
			});
		});

		it("should record request size in error handler", (done) => {
			const mockRequest = {
				method: "POST",
				url: "/api/error",
				headers: {
					"content-length": "2048",
				},
			};
			const mockResponse = {
				statusCode: 500,
			};
			const error = { status: 500, message: "Internal Server Error" };
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "ErrorController" }),
				getHandler: jest.fn().mockReturnValue({ name: "errorHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => throwError(() => error),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				error: () => {
					expect(mockHistogramRequestSize.observe).toHaveBeenCalledWith(
						{ method: "POST", route: "/api/error" },
						2048
					);
					done();
				},
			});
		});

		it("should handle request without url", (done) => {
			const mockRequest = {
				method: "GET",
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockCounter.inc).toHaveBeenCalledWith(
						expect.objectContaining({
							route: "unknown",
						})
					);
					done();
				},
			});
		});

		it("should handle request without method", (done) => {
			const mockRequest = {
				url: "/api/test",
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockCounter.inc).toHaveBeenCalledWith(
						expect.objectContaining({
							method: "UNKNOWN",
						})
					);
					done();
				},
			});
		});

		it("should use UnknownController when getClass returns null", (done) => {
			const mockRequest = {
				method: "GET",
				url: "/api/test",
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue(null),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockCounter.inc).toHaveBeenCalledWith(
						expect.objectContaining({
							controller: "UnknownController",
						})
					);
					done();
				},
			});
		});

		it("should use unknownHandler when getHandler returns null", (done) => {
			const mockRequest = {
				method: "GET",
				url: "/api/test",
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue(null),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockCounter.inc).toHaveBeenCalledWith(
						expect.objectContaining({
							handler: "unknownHandler",
						})
					);
					done();
				},
			});
		});

		it("should use default status 500 when error has no status property", (done) => {
			const mockRequest = {
				method: "POST",
				url: "/api/error",
				headers: {},
			};
			const mockResponse = {
				statusCode: 500,
			};
			const error = { message: "Error without status" };
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "ErrorController" }),
				getHandler: jest.fn().mockReturnValue({ name: "errorHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => throwError(() => error),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				error: () => {
					expect(mockCounter.inc).toHaveBeenCalledWith(
						expect.objectContaining({
							status: "500",
						})
					);
					done();
				},
			});
		});

		it("should work when moduleOptions has no httpMetrics", async () => {
			register.clear();
			const mockCounterNoHttp = { inc: jest.fn() };
			const mockHistogramNoHttp1 = { observe: jest.fn() };
			const mockHistogramNoHttp2 = { observe: jest.fn() };
			const mockHistogramNoHttp3 = { observe: jest.fn() };

			const moduleNoHttp: TestingModule = await Test.createTestingModule({
				providers: [
					PrometheusService,
					{
						provide: PROMETHEUS_MODULE_OPTIONS,
						useValue: {} as PrometheusModuleOptions,
					},
				],
			}).compile();

			const prometheusServiceNoHttp = moduleNoHttp.get<PrometheusService>(PrometheusService);
			jest
				.spyOn(prometheusServiceNoHttp, "createCounter")
				.mockReturnValue(mockCounterNoHttp as unknown as Counter<string>);
			jest
				.spyOn(prometheusServiceNoHttp, "createHistogram")
				.mockReturnValueOnce(mockHistogramNoHttp1 as unknown as Histogram<string>)
				.mockReturnValueOnce(mockHistogramNoHttp2 as unknown as Histogram<string>)
				.mockReturnValueOnce(mockHistogramNoHttp3 as unknown as Histogram<string>);

			const interceptorNoHttp = new PrometheusHttpInterceptor(prometheusServiceNoHttp, {
				httpMetrics: { enabled: true },
			} as PrometheusModuleOptions);

			const mockRequest = {
				method: "GET",
				url: "/api/test",
				headers: {},
			};
			const mockResponse = {
				statusCode: 200,
			};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			await new Promise<void>((resolve, reject) => {
				interceptorNoHttp.intercept(mockContext, mockHandler).subscribe({
					next: () => {
						expect(mockCounterNoHttp.inc).toHaveBeenCalled();
						resolve();
					},
					error: (err) => {
						reject(err);
					},
					complete: () => {
						// Если complete вызван без next, проверяем что inc был вызван
						if (!mockCounterNoHttp.inc.mock.calls.length) {
							reject(new Error("mockCounterNoHttp.inc was not called"));
						} else {
							resolve();
						}
					},
				});
			});
		});

		it("should use default status 200 when response.statusCode is not defined", (done) => {
			const mockRequest = {
				method: "GET",
				url: "/api/test",
				headers: {},
			};
			const mockResponse = {};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue({ name: "TestController" }),
				getHandler: jest.fn().mockReturnValue({ name: "testHandler" }),
			} as unknown as ExecutionContext;

			const mockHandler: CallHandler = {
				handle: () => of({ data: "test" }),
			};

			interceptor.intercept(mockContext, mockHandler).subscribe({
				next: () => {
					expect(mockCounter.inc).toHaveBeenCalledWith(
						expect.objectContaining({
							status: "200",
						})
					);
					done();
				},
			});
		});

		it("should work when moduleOptions is undefined (Optional decorator)", async () => {
			register.clear();
			const mockCounterUndefined = { inc: jest.fn() };
			const mockHistogramUndefined1 = { observe: jest.fn() };
			const mockHistogramUndefined2 = { observe: jest.fn() };
			const mockHistogramUndefined3 = { observe: jest.fn() };

			const moduleUndefined: TestingModule = await Test.createTestingModule({
				providers: [PrometheusService],
			}).compile();

			const prometheusServiceUndefined = moduleUndefined.get<PrometheusService>(PrometheusService);
			const createCounterSpyUndefined = jest
				.spyOn(prometheusServiceUndefined, "createCounter")
				.mockReturnValue(mockCounterUndefined as unknown as Counter<string>);
			const createHistogramSpyUndefined = jest
				.spyOn(prometheusServiceUndefined, "createHistogram")
				.mockReturnValueOnce(mockHistogramUndefined1 as unknown as Histogram<string>)
				.mockReturnValueOnce(mockHistogramUndefined2 as unknown as Histogram<string>)
				.mockReturnValueOnce(mockHistogramUndefined3 as unknown as Histogram<string>);

			// Вызываем конструктор без второго параметра (moduleOptions будет undefined)
			// Это покрывает строки 33-39: параметры конструктора и инициализацию options
			// Покрывает ветку: this.moduleOptions?.httpMetrics ?? {}
			const interceptorUndefined = new PrometheusHttpInterceptor(prometheusServiceUndefined);

			// Проверяем, что метрики были созданы (enabled по умолчанию true)
			expect(createCounterSpyUndefined).toHaveBeenCalled();
			expect(createHistogramSpyUndefined).toHaveBeenCalledTimes(3);

			// Проверяем, что интерцептор создан успешно
			expect(interceptorUndefined).toBeDefined();
		});

		it("should work when moduleOptions.httpMetrics is undefined", async () => {
			register.clear();
			const mockCounterNoHttpMetrics = { inc: jest.fn() };
			const mockHistogramNoHttpMetrics1 = { observe: jest.fn() };
			const mockHistogramNoHttpMetrics2 = { observe: jest.fn() };
			const mockHistogramNoHttpMetrics3 = { observe: jest.fn() };

			const moduleNoHttpMetrics: TestingModule = await Test.createTestingModule({
				providers: [
					PrometheusService,
					{
						provide: PROMETHEUS_MODULE_OPTIONS,
						useValue: {} as PrometheusModuleOptions,
					},
				],
			}).compile();

			const prometheusServiceNoHttpMetrics =
				moduleNoHttpMetrics.get<PrometheusService>(PrometheusService);
			const createCounterSpyNoHttpMetrics = jest
				.spyOn(prometheusServiceNoHttpMetrics, "createCounter")
				.mockReturnValue(mockCounterNoHttpMetrics as unknown as Counter<string>);
			const createHistogramSpyNoHttpMetrics = jest
				.spyOn(prometheusServiceNoHttpMetrics, "createHistogram")
				.mockReturnValueOnce(mockHistogramNoHttpMetrics1 as unknown as Histogram<string>)
				.mockReturnValueOnce(mockHistogramNoHttpMetrics2 as unknown as Histogram<string>)
				.mockReturnValueOnce(mockHistogramNoHttpMetrics3 as unknown as Histogram<string>);

			// Вызываем конструктор с moduleOptions, но без httpMetrics
			// Это покрывает ветку: this.moduleOptions?.httpMetrics ?? {}
			// когда moduleOptions есть, но httpMetrics равен undefined
			const interceptorNoHttpMetrics = new PrometheusHttpInterceptor(
				prometheusServiceNoHttpMetrics,
				{} as PrometheusModuleOptions
			);

			// Проверяем, что метрики были созданы (enabled по умолчанию true)
			expect(createCounterSpyNoHttpMetrics).toHaveBeenCalled();
			expect(createHistogramSpyNoHttpMetrics).toHaveBeenCalledTimes(3);

			// Проверяем, что интерцептор создан успешно
			expect(interceptorNoHttpMetrics).toBeDefined();
		});
	});
});
