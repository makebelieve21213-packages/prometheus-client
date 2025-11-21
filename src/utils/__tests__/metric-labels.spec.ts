import {
	extractHttpLabels,
	extractRequestLabels,
	createLabels,
	mergeLabels,
} from "src/utils/metric-labels";

import type { ExecutionContext } from "@nestjs/common";

describe("metric-labels", () => {
	describe("extractHttpLabels", () => {
		it("should extract labels from ExecutionContext", () => {
			const mockRequest = {
				method: "GET",
				url: "/api/test?param=value",
				route: { path: "/api/test" },
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

			const labels = extractHttpLabels(mockContext);

			expect(labels).toEqual({
				method: "GET",
				route: "/api/test",
				status: "200",
				controller: "TestController",
				handler: "testHandler",
			});
		});

		it("should handle missing values", () => {
			const mockRequest = {};
			const mockResponse = {};
			const mockContext = {
				switchToHttp: jest.fn().mockReturnValue({
					getRequest: () => mockRequest,
					getResponse: () => mockResponse,
				}),
				getClass: jest.fn().mockReturnValue(null),
				getHandler: jest.fn().mockReturnValue(null),
			} as unknown as ExecutionContext;

			const labels = extractHttpLabels(mockContext);

			expect(labels.method).toBe("UNKNOWN");
			expect(labels.route).toBe("unknown");
			expect(labels.status).toBe("unknown");
			expect(labels.controller).toBe("UnknownController");
			expect(labels.handler).toBe("unknownHandler");
		});
	});

	describe("extractRequestLabels", () => {
		it("should extract labels from request object", () => {
			const request = {
				method: "POST",
				url: "/api/users",
				route: { path: "/api/users" },
			};

			const labels = extractRequestLabels(request);

			expect(labels).toEqual({
				method: "POST",
				route: "/api/users",
			});
		});

		it("should use url when route.path is not available", () => {
			const request = {
				method: "GET",
				url: "/api/test?param=value",
			};

			const labels = extractRequestLabels(request);

			expect(labels.route).toBe("/api/test");
		});

		it("should use unknown when route.path and url are not available", () => {
			const request = {
				method: "GET",
			};

			const labels = extractRequestLabels(request);

			expect(labels.route).toBe("unknown");
		});

		it("should use UNKNOWN when method is not available", () => {
			const request = {
				url: "/api/test",
			};

			const labels = extractRequestLabels(request);

			expect(labels.method).toBe("UNKNOWN");
		});

		it("should use UNKNOWN when method is empty string", () => {
			const request = {
				method: "",
				url: "/api/test",
			};

			const labels = extractRequestLabels(request);

			expect(labels.method).toBe("UNKNOWN");
		});
	});

	describe("createLabels", () => {
		it("should create labels from source object", () => {
			const source = {
				method: "GET",
				status: 200,
				ignored: "value",
			};

			const labels = createLabels(source, ["method", "status"]);

			expect(labels).toEqual({
				method: "GET",
				status: "200",
			});
			expect(labels.ignored).toBeUndefined();
		});

		it("should skip undefined and null values", () => {
			const source = {
				method: "GET",
				status: undefined,
				error: null,
			};

			const labels = createLabels(source, ["method", "status", "error"]);

			expect(labels).toEqual({
				method: "GET",
			});
		});
	});

	describe("mergeLabels", () => {
		it("should merge multiple label objects", () => {
			const labels1 = { method: "GET", route: "/api/test" };
			const labels2 = { status: "200" };
			const labels3 = { controller: "TestController" };

			const merged = mergeLabels(labels1, labels2, labels3);

			expect(merged).toEqual({
				method: "GET",
				route: "/api/test",
				status: "200",
				controller: "TestController",
			});
		});

		it("should override values from later objects", () => {
			const labels1 = { method: "GET", status: "200" };
			const labels2 = { status: "500" };

			const merged = mergeLabels(labels1, labels2);

			expect(merged.status).toBe("500");
		});
	});
});
