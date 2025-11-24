import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest';

/**
 * Конфигурация Jest для @packages/prometheus-client
 * Настроена для работы с ESM модулями
 */
const presetConfig = createDefaultEsmPreset({
	tsconfig: {
		module: 'ESNext',
		target: 'ES2023',
	},
});

const config: JestConfigWithTsJest = {
	...presetConfig,
	displayName: 'prometheus-client',
	testEnvironment: 'node',
	testRegex: '.*\\.spec\\.ts$',
	rootDir: '.',
	// Verbose output для детальных логов
	verbose: true,
	// Очистка моков между тестами
	clearMocks: true,
	resetMocks: true,
	restoreMocks: true,
	// Игнорируемые папки
	testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
	// Директория для coverage
	coverageDirectory: 'coverage',
	// Reporters для покрытия
	coverageReporters: ['text', 'lcov', 'html', 'json', 'clover'],
	// Общие расширения файлов
	moduleFileExtensions: ['js', 'json', 'ts'],
	// Максимальное количество воркеров для параллельного запуска тестов
	maxWorkers: '50%',
	// Таймаут для тестов (5 секунд)
	testTimeout: 5000,
	// Принудительное завершение процессов после завершения тестов (решает проблему EPERM на Windows)
	forceExit: process.platform === 'win32',
	// Настройка алиасов для тестов
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
		'^src/(.*)$': '<rootDir>/src/$1',
	},
	// Сборка покрытия кода
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/__tests__/**/*.ts',
		'!src/**/*.spec.ts',
		'!src/**/*.d.ts',
		'!src/index.ts',
		'!src/types/**/*.ts',
	],
	// Высокие пороги покрытия для критичного пакета
	coverageThreshold: {
		global: {
			branches: 96,
			functions: 100,
			lines: 100,
			statements: 100,
		},
	},
};

export default config;
