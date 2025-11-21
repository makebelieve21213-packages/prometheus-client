import type { ExecutionContext } from "@nestjs/common";

// Извлечь метки из ExecutionContext для HTTP запросов
export function extractHttpLabels(context: ExecutionContext): Record<string, string> {
	const request = context.switchToHttp().getRequest();
	const response = context.switchToHttp().getResponse();

	return {
		method: request.method || "UNKNOWN",
		route: request.route?.path || request.url?.split("?")[0] || "unknown",
		status: response.statusCode?.toString() || "unknown",
		controller: context.getClass()?.name || "UnknownController",
		handler: context.getHandler()?.name || "unknownHandler",
	};
}

// Извлечь метки из объекта запроса
export function extractRequestLabels(request: {
	method?: string;
	url?: string;
	route?: { path?: string };
}): Record<string, string> {
	return {
		method: request.method || "UNKNOWN",
		route: request.route?.path || request.url?.split("?")[0] || "unknown",
	};
}

// Создать метки из объекта с возможностью фильтрации
export function createLabels(
	source: Record<string, unknown>,
	keys: string[]
): Record<string, string> {
	const labels: Record<string, string> = {};

	for (const key of keys) {
		if (source[key] !== undefined && source[key] !== null) {
			labels[key] = String(source[key]);
		}
	}

	return labels;
}

// Объединить несколько объектов меток
export function mergeLabels(...labels: Array<Record<string, string>>): Record<string, string> {
	return Object.assign({}, ...labels);
}
