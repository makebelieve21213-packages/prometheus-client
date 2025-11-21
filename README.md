# @makebelieve21213-packages/prometheus-client

Prometheus клиент для NestJS с поддержкой метрик, экспорта и интеграции с @willsoto/nestjs-prometheus.

## 🎯 Возможности

- ✅ **Интеграция с @willsoto/nestjs-prometheus** - автоматический экспорт метрик на `/metrics` endpoint
- ✅ **Type-safe API** - полная типобезопасность TypeScript
- ✅ **Создание метрик** - Counter, Histogram, Gauge, Summary метрики
- ✅ **Специализированные сервисы** - готовые сервисы для HTTP, Kafka и AI метрик
- ✅ **Автоматический сбор HTTP метрик** - интерцептор для автоматического трекинга HTTP запросов
- ✅ **Декораторы** - `@TrackDuration`, `@TrackCounter`, `@PrometheusMetric` для удобного трекинга
- ✅ **Предопределенные наборы метрик** - готовые наборы для HTTP, Kafka и Database
- ✅ **Реестр метрик** - централизованное управление предопределенными метриками
- ✅ **Утилиты** - вспомогательные функции для работы с метриками
- ✅ **Registry management** - управление реестром метрик
- ✅ **Global Module** - регистрируется один раз и доступен во всех модулях
- ✅ **100% покрытие тестами** - надежность и качество кода
- ✅ **ESM модуль** - современный стандарт модулей JavaScript
- ✅ **TypeScript** - полная типизация

## 📦 Установка

```bash
pnpm add @makebelieve21213-packages/prometheus-client
```

Или добавьте в `package.json` вашего микросервиса:
```json
{
  "dependencies": {
    "@makebelieve21213-packages/prometheus-client": "workspace:*"
  }
}
```

## 🚀 Быстрый старт

### 1. Подключение в AppModule

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrometheusClientModule } from '@makebelieve21213-packages/prometheus-client';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrometheusClientModule.forRootAsync<[ConfigService]>({
      useFactory: (configService: ConfigService) => ({
        path: configService.get('PROMETHEUS_METRICS_PATH') || '/metrics',
        defaultMetrics: configService.get('PROMETHEUS_DEFAULT_METRICS') !== 'false',
        httpMetrics: {
          enabled: true,
          ignorePaths: ['/metrics', '/health'],
          ignoreMethods: ['OPTIONS'],
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### 2. Автоматический сбор HTTP метрик

Подключите интерцептор глобально для автоматического сбора HTTP метрик:

```typescript
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusHttpInterceptor } from '@makebelieve21213-packages/prometheus-client';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PrometheusHttpInterceptor,
    },
  ],
})
export class AppModule {}
```

### 3. Использование специализированных сервисов

```typescript
import { Injectable } from '@nestjs/common';
import { HttpMetricsService, KafkaMetricsService, AiMetricsService } from '@makebelieve21213-packages/prometheus-client';

@Injectable()
export default class MyService {
  constructor(
    private readonly httpMetrics: HttpMetricsService,
    private readonly kafkaMetrics: KafkaMetricsService,
    private readonly aiMetrics: AiMetricsService,
  ) {}

  async handleRequest() {
    const startTime = Date.now();
    try {
      // Ваша логика
      const duration = Date.now() - startTime;
      this.httpMetrics.recordHttpRequest('GET', '/api/users', 200, duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.httpMetrics.recordHttpError('GET', '/api/users', 500, duration, error);
    }
  }

  async processKafkaMessage(topic: string, commandType: string) {
    const startTime = Date.now();
    try {
      // Обработка сообщения
      const duration = Date.now() - startTime;
      this.kafkaMetrics.recordKafkaMessage(topic, commandType, 'success', duration);
    } catch (error) {
      this.kafkaMetrics.recordKafkaError(topic, commandType, error);
    }
  }

  async processAiRequest(model: string) {
    const startTime = Date.now();
    try {
      // AI запрос
      const duration = Date.now() - startTime;
      this.aiMetrics.recordAiRequest('success', duration, 100, model);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.aiMetrics.recordAiRequest('error', duration, 0, model);
    }
  }
}
```

### 4. Использование декораторов

```typescript
import { Injectable } from '@nestjs/common';
import { TrackDuration, TrackCounter, PrometheusMetric } from '@makebelieve21213-packages/prometheus-client';

@Injectable()
export default class MyService {
  @TrackDuration('my_method_duration_seconds', { service: 'my-service' })
  @TrackCounter('my_method_calls_total', { service: 'my-service' })
  async myMethod() {
    // Ваша логика
  }

  @PrometheusMetric({
    type: 'histogram',
    name: 'custom_metric_seconds',
    help: 'Custom metric description',
    labels: ['method'],
    buckets: [0.1, 0.5, 1, 2, 5],
  })
  async customMethod() {
    // Ваша логика
  }
}
```

### 5. Использование базового PrometheusService

```typescript
import { Injectable } from '@nestjs/common';
import { PrometheusService } from '@makebelieve21213-packages/prometheus-client';
import { Counter, Histogram, Gauge, Summary } from 'prom-client';

@Injectable()
export default class MetricsService {
  private readonly httpRequestCounter: Counter;
  private readonly httpRequestDuration: Histogram;
  private readonly activeConnections: Gauge;
  private readonly requestSummary: Summary;

  constructor(private readonly prometheusService: PrometheusService) {
    // Создание Counter метрики
    this.httpRequestCounter = this.prometheusService.createCounter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });

    // Создание Histogram метрики
    this.httpRequestDuration = this.prometheusService.createHistogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    // Создание Gauge метрики
    this.activeConnections = this.prometheusService.createGauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['type'],
    });

    // Создание Summary метрики
    this.requestSummary = this.prometheusService.createSummary({
      name: 'request_summary_seconds',
      help: 'Request duration summary',
      labelNames: ['method'],
      percentiles: [0.5, 0.9, 0.99],
    });
  }

  recordHttpRequest(method: string, route: string, status: number, duration: number): void {
    this.httpRequestCounter.inc({ method, route, status: status.toString() });
    this.httpRequestDuration.observe({ method, route }, duration);
    this.requestSummary.observe({ method }, duration);
  }

  setActiveConnections(type: string, count: number): void {
    this.activeConnections.set({ type }, count);
  }
}
```

## 📊 Методы PrometheusService

### `createCounter(config)`
Создает Counter метрику для подсчета событий.

**Параметры:**
- `config.name` - имя метрики (обязательно)
- `config.help` - описание метрики (обязательно)
- `config.labelNames` - массив имен меток (опционально)

**Возвращает:** `Counter` из `prom-client`

```typescript
const counter = prometheusService.createCounter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

counter.inc({ method: 'GET', route: '/api/users', status: '200' });
```

### `createHistogram(config)`
Создает Histogram метрику для измерения распределения значений (например, время выполнения).

**Параметры:**
- `config.name` - имя метрики (обязательно)
- `config.help` - описание метрики (обязательно)
- `config.labelNames` - массив имен меток (опционально)
- `config.buckets` - массив buckets для гистограммы (опционально)

**Возвращает:** `Histogram` из `prom-client`

```typescript
const histogram = prometheusService.createHistogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const timer = histogram.startTimer({ method: 'GET', route: '/api/users' });
// ... выполнение запроса
timer(); // Завершает измерение и записывает значение
```

### `createGauge(config)`
Создает Gauge метрику для значений, которые могут увеличиваться и уменьшаться.

**Параметры:**
- `config.name` - имя метрики (обязательно)
- `config.help` - описание метрики (обязательно)
- `config.labelNames` - массив имен меток (опционально)

**Возвращает:** `Gauge` из `prom-client`

```typescript
const gauge = prometheusService.createGauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['type'],
});

gauge.set({ type: 'websocket' }, 10);
gauge.inc({ type: 'websocket' }, 1);
gauge.dec({ type: 'websocket' }, 1);
```

### `createSummary(config)`
Создает Summary метрику для вычисления квантилей.

**Параметры:**
- `config.name` - имя метрики (обязательно)
- `config.help` - описание метрики (обязательно)
- `config.labelNames` - массив имен меток (опционально)
- `config.percentiles` - массив квантилей (опционально)
- `config.maxAgeSeconds` - максимальный возраст наблюдений (опционально)
- `config.ageBuckets` - количество buckets для возраста (опционально)

**Возвращает:** `Summary` из `prom-client`

```typescript
const summary = prometheusService.createSummary({
  name: 'request_summary_seconds',
  help: 'Request duration summary',
  labelNames: ['method'],
  percentiles: [0.5, 0.9, 0.99],
});

summary.observe({ method: 'GET' }, 0.5);
```

### `getRegistry()`
Возвращает Registry для экспорта метрик.

**Возвращает:** `Registry` из `prom-client`

```typescript
const registry = prometheusService.getRegistry();
```

## 🔧 Специализированные сервисы

### HttpMetricsService

Автоматически создает и управляет HTTP метриками:
- `http_requests_total` - общее количество HTTP запросов
- `http_request_duration_seconds` - длительность HTTP запросов
- `http_request_size_bytes` - размер HTTP запросов
- `http_response_size_bytes` - размер HTTP ответов
- `http_errors_total` - количество HTTP ошибок

```typescript
import { HttpMetricsService } from '@makebelieve21213-packages/prometheus-client';

constructor(private readonly httpMetrics: HttpMetricsService) {}

// Записать метрики для успешного запроса
this.httpMetrics.recordHttpRequest(
  'GET',
  '/api/users',
  200,
  150, // duration в миллисекундах
  1024, // requestSize в байтах
  2048, // responseSize в байтах
  'UserController',
  'getUsers'
);

// Записать метрики для ошибки
this.httpMetrics.recordHttpError(
  'GET',
  '/api/users',
  500,
  150,
  new Error('Internal error')
);
```

### KafkaMetricsService

Автоматически создает и управляет Kafka метриками:
- `kafka_messages_total` - общее количество обработанных сообщений
- `kafka_message_duration_seconds` - длительность обработки сообщений
- `kafka_errors_total` - количество ошибок обработки

```typescript
import { KafkaMetricsService } from '@makebelieve21213-packages/prometheus-client';

constructor(private readonly kafkaMetrics: KafkaMetricsService) {}

// Записать метрики для успешно обработанного сообщения
this.kafkaMetrics.recordKafkaMessage(
  'chat.service.commands',
  'CreateMessage',
  'success',
  50 // duration в миллисекундах
);

// Записать метрики для ошибки
this.kafkaMetrics.recordKafkaError(
  'chat.service.commands',
  'CreateMessage',
  new Error('Processing error')
);
```

### AiMetricsService

Автоматически создает и управляет AI метриками:
- `ai_stream_requests_total` - общее количество stream запросов
- `ai_stream_duration_seconds` - длительность stream запросов
- `ai_stream_tokens_total` - общее количество токенов в stream
- `ai_requests_total` - общее количество AI запросов
- `ai_request_duration_seconds` - длительность AI запросов

```typescript
import { AiMetricsService } from '@makebelieve21213-packages/prometheus-client';

constructor(private readonly aiMetrics: AiMetricsService) {}

// Записать метрики для stream запроса
this.aiMetrics.recordAiStream(
  'success',
  5000, // duration в миллисекундах
  1000 // tokens
);

// Записать метрики для обычного AI запроса
this.aiMetrics.recordAiRequest(
  'success',
  3000,
  500,
  'gpt-4'
);
```

## 🎨 Декораторы

### `@TrackDuration(metricName?, labels?)`

Автоматически измеряет время выполнения метода и записывает в Histogram метрику.

```typescript
import { TrackDuration } from '@makebelieve21213-packages/prometheus-client';

@TrackDuration('my_method_duration_seconds', { service: 'my-service' })
async myMethod() {
  // Время выполнения будет автоматически измерено
}
```

### `@TrackCounter(metricName?, labels?)`

Автоматически подсчитывает вызовы метода и записывает в Counter метрику.

```typescript
import { TrackCounter } from '@makebelieve21213-packages/prometheus-client';

@TrackCounter('my_method_calls_total', { service: 'my-service' })
async myMethod() {
  // Каждый вызов будет автоматически подсчитан
}
```

### `@PrometheusMetric(config)`

Определяет кастомную метрику для метода.

```typescript
import { PrometheusMetric } from '@makebelieve21213-packages/prometheus-client';

@PrometheusMetric({
  type: 'histogram',
  name: 'custom_metric_seconds',
  help: 'Custom metric description',
  labels: ['method'],
  buckets: [0.1, 0.5, 1, 2, 5],
})
async customMethod() {
  // Метрика будет автоматически создана и использована
}
```

## 🛠️ Утилиты

### Предопределенные наборы метрик

```typescript
import {
  createHttpMetricsSet,
  createKafkaMetricsSet,
  createDatabaseMetricsSet,
} from '@makebelieve21213-packages/prometheus-client';

const httpMetrics = createHttpMetricsSet(prometheusService);
const kafkaMetrics = createKafkaMetricsSet(prometheusService);
const dbMetrics = createDatabaseMetricsSet(prometheusService);
```

### MetricTimer

Утилита для измерения времени выполнения с автоматической записью в Histogram.

```typescript
import { createMetricTimer } from '@makebelieve21213-packages/prometheus-client';

const timer = createMetricTimer(histogram, { method: 'GET', route: '/api/users' });
// ... выполнение кода
timer.end(); // Автоматически записывает время выполнения
```

### wrapWithMetrics

Обертка для автоматического сбора метрик при вызове функции.

```typescript
import { wrapWithMetrics } from '@makebelieve21213-packages/prometheus-client';

const wrappedFunction = wrapWithMetrics(myFunction, {
  counter: myCounter,
  histogram: myHistogram,
  counterLabels: { service: 'my-service' },
  histogramLabels: { method: 'process' },
});
```

### Работа с метками

```typescript
import {
  extractHttpLabels,
  extractRequestLabels,
  createLabels,
  mergeLabels,
} from '@makebelieve21213-packages/prometheus-client';

// Извлечь метки из ExecutionContext
const labels = extractHttpLabels(context);

// Извлечь метки из запроса
const requestLabels = extractRequestLabels(request);

// Создать метки из объекта
const customLabels = createLabels({ method: 'GET', status: '200' }, ['method', 'status']);

// Объединить метки
const merged = mergeLabels(labels1, labels2, labels3);
```

## 📁 Структура пакета

```
prometheus-client/
├── src/
│   ├── main/
│   │   ├── __tests__/
│   │   │   ├── prometheus.module.spec.ts    # Тесты модуля
│   │   │   └── prometheus.service.spec.ts   # Тесты сервиса
│   │   ├── prometheus.module.ts             # NestJS модуль (Global)
│   │   └── prometheus.service.ts            # Сервис для работы с метриками
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── http-metrics.service.spec.ts
│   │   │   ├── kafka-metrics.service.spec.ts
│   │   │   └── ai-metrics.service.spec.ts
│   │   ├── http-metrics.service.ts          # Сервис для HTTP метрик
│   │   ├── kafka-metrics.service.ts         # Сервис для Kafka метрик
│   │   └── ai-metrics.service.ts            # Сервис для AI метрик
│   ├── interceptors/
│   │   ├── __tests__/
│   │   │   └── prometheus-http.interceptor.spec.ts
│   │   └── prometheus-http.interceptor.ts   # HTTP интерцептор
│   ├── decorators/
│   │   ├── __tests__/
│   │   │   ├── prometheus-metric.decorator.spec.ts
│   │   │   ├── track-duration.decorator.spec.ts
│   │   │   └── track-counter.decorator.spec.ts
│   │   ├── prometheus-metric.decorator.ts   # Декоратор для кастомных метрик
│   │   ├── track-duration.decorator.ts     # Декоратор для измерения времени
│   │   └── track-counter.decorator.ts       # Декоратор для подсчета вызовов
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── injection-keys.spec.ts
│   │   │   ├── metric-labels.spec.ts
│   │   │   ├── metric-registry.spec.ts
│   │   │   ├── metric-sets.spec.ts
│   │   │   ├── metric-timer.spec.ts
│   │   │   └── metric-wrapper.spec.ts
│   │   ├── injection-keys.ts               # DI токены
│   │   ├── metric-labels.ts                 # Утилиты для работы с метками
│   │   ├── metric-registry.ts              # Реестр предопределенных метрик
│   │   ├── metric-sets.ts                   # Предопределенные наборы метрик
│   │   ├── metric-timer.ts                  # Утилита для измерения времени
│   │   └── metric-wrapper.ts                # Обертка для функций с метриками
│   ├── types/
│   │   ├── module-options.interface.ts     # Опции конфигурации модуля
│   │   ├── prometheus.interface.ts         # Интерфейс PrometheusClientContract
│   │   ├── metric-sets.interface.ts        # Интерфейсы наборов метрик
│   │   ├── metric-wrapper.interface.ts    # Интерфейс опций обертки функций
│   │   └── prometheus-metric.interface.ts  # Интерфейс конфигурации декоратора метрик
│   └── index.ts                            # Экспорты пакета
├── dist/                                   # Скомпилированный код
```

## ⚙️ Конфигурация

### PrometheusModuleOptions

```typescript
interface PrometheusModuleOptions {
  path?: string;              // Опционально: путь для экспорта метрик (по умолчанию "/metrics")
  defaultMetrics?: boolean;    // Опционально: включить дефолтные метрики Node.js (по умолчанию true)
  httpMetrics?: HttpMetricsOptions;  // Опционально: опции для HTTP метрик
  predefinedMetrics?: PredefinedMetricsConfig;  // Опционально: предопределенные метрики
}

interface HttpMetricsOptions {
  enabled?: boolean;          // Включить сбор HTTP метрик (по умолчанию: true)
  ignorePaths?: string[];     // Игнорировать определенные пути
  ignoreMethods?: string[];    // Игнорировать определенные методы
  durationBuckets?: number[]; // Buckets для гистограммы длительности запросов
  requestSizeBuckets?: number[]; // Buckets для гистограммы размера запроса
  responseSizeBuckets?: number[]; // Buckets для гистограммы размера ответа
}

interface PredefinedMetricsConfig {
  counters?: CounterConfig[];     // Список Counter метрик для предварительной регистрации
  histograms?: HistogramConfig[]; // Список Histogram метрик для предварительной регистрации
  gauges?: GaugeConfig[];         // Список Gauge метрик для предварительной регистрации
  summaries?: SummaryConfig[];    // Список Summary метрик для предварительной регистрации
}
```

### Переменные окружения

```env
# Prometheus конфигурация
PROMETHEUS_METRICS_PATH=/metrics
PROMETHEUS_DEFAULT_METRICS=true
```

### Пример конфигурации с предопределенными метриками

```typescript
PrometheusClientModule.forRootAsync<[ConfigService]>({
  useFactory: (configService: ConfigService) => ({
    path: configService.get('PROMETHEUS_METRICS_PATH') || '/metrics',
    defaultMetrics: configService.get('PROMETHEUS_DEFAULT_METRICS') !== 'false',
    httpMetrics: {
      enabled: true,
      ignorePaths: ['/metrics', '/health'],
      ignoreMethods: ['OPTIONS'],
      durationBuckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    },
    predefinedMetrics: {
      counters: [
        {
          name: 'custom_counter_total',
          help: 'Custom counter metric',
          labelNames: ['service'],
        },
      ],
      histograms: [
        {
          name: 'custom_histogram_seconds',
          help: 'Custom histogram metric',
          labelNames: ['method'],
          buckets: [0.1, 0.5, 1, 2, 5],
        },
      ],
    },
  }),
  inject: [ConfigService],
}),
```

## 📈 Интеграция с Prometheus

После настройки модуля метрики автоматически экспортируются на `/metrics` endpoint через @willsoto/nestjs-prometheus.

Prometheus будет собирать метрики по адресу:
- `http://localhost:5001/metrics` (api-service)
- `http://localhost:5002/metrics` (dashboard-service)
- `http://localhost:5003/metrics` (chat-service)

### Пример конфигурации Prometheus

```yaml
scrape_configs:
  - job_name: 'api-service'
    static_configs:
      - targets: ['localhost:5001']
    metrics_path: '/metrics'
  
  - job_name: 'dashboard-service'
    static_configs:
      - targets: ['localhost:5002']
    metrics_path: '/metrics'
```

## 📝 Примеры использования

### HTTP метрики через интерцептор

```typescript
// Автоматически собираются через PrometheusHttpInterceptor
// Метрики: http_requests_total, http_request_duration_seconds, http_request_size_bytes, http_response_size_bytes
```

### HTTP метрики через сервис

```typescript
const httpMetrics = httpMetricsService.recordHttpRequest(
  'GET',
  '/api/users',
  200,
  150,
  1024,
  2048,
  'UserController',
  'getUsers'
);
```

### Kafka метрики

```typescript
const kafkaMetrics = kafkaMetricsService.recordKafkaMessage(
  'chat.service.commands',
  'CreateMessage',
  'success',
  50
);
```

### AI метрики

```typescript
const aiMetrics = aiMetricsService.recordAiRequest(
  'success',
  3000,
  500,
  'gpt-4'
);
```

### Database метрики

```typescript
import { createDatabaseMetricsSet } from '@makebelieve21213-packages/prometheus-client';

const dbMetrics = createDatabaseMetricsSet(prometheusService);

dbMetrics.databaseQueriesTotal.inc({ database: 'postgres', operation: 'select', status: 'success' });
const timer = dbMetrics.databaseQueryDuration.startTimer({ database: 'postgres', operation: 'select' });
// ... выполнение запроса
timer();
```

### WebSocket метрики

```typescript
const wsConnections = prometheusService.createGauge({
  name: 'websocket_connections',
  help: 'Number of active WebSocket connections',
  labelNames: ['room'],
});

wsConnections.set({ room: 'chat' }, 5);
wsConnections.inc({ room: 'chat' }, 1);
wsConnections.dec({ room: 'chat' }, 1);
```

## 🧪 Тестирование

Пакет имеет 100% покрытие тестами:

```bash
cd prometheus-client
pnpm test
pnpm test:coverage
```

### Моки для тестирования

```typescript
import { Test } from '@nestjs/testing';
import { PrometheusService } from '@makebelieve21213-packages/prometheus-client';

const mockPrometheusService = {
  createCounter: jest.fn(),
  createHistogram: jest.fn(),
  createGauge: jest.fn(),
  createSummary: jest.fn(),
  getRegistry: jest.fn(),
};

const module = await Test.createTestingModule({
  providers: [
    MyService,
    {
      provide: PrometheusService,
      useValue: mockPrometheusService,
    },
  ],
}).compile();
```

## 🏗️ Разработка

### Технический стек
- **TypeScript 5.7+** - строгая типизация
- **ESM модули** - современный стандарт модулей JavaScript
- **prom-client 15.x** - клиент для Prometheus метрик
- **NestJS 11.x** - фреймворк для микросервисов

### Процесс сборки
Пакет использует многоэтапную сборку для корректной работы ESM:
1. **TypeScript компиляция** (`tsc --build`) - компиляция TypeScript в JavaScript
2. **Замена алиасов** (`tsc-alias`) - замена путей `src/*` на относительные
3. **Исправление ESM** (`tsc-esm-fix`) - добавление `.js` расширений к импортам

```bash
# Установка зависимостей
pnpm install

# Сборка
pnpm build

# Запуск тестов
pnpm test

# Запуск тестов с покрытием
pnpm test:coverage

# Линтер
pnpm lint
pnpm lint:fix

# Форматирование
pnpm format
pnpm format:fix
```

## 🐳 Развертывание в Docker локально

### Сборка образа

Соберите Docker образ из корня проекта:

```bash
docker build -t prometheus-client-package:latest .
```

### Запуск контейнера

#### Базовый запуск

```bash
docker run -d \
  --name prometheus-client-package \
  prometheus-client-package:latest
```

#### С переменными окружения

```bash
docker run -d \
  --name prometheus-client-package \
  -e PROMETHEUS_METRICS_PATH=/metrics \
  -e PROMETHEUS_DEFAULT_METRICS=true \
  prometheus-client-package:latest
```

### Просмотр метрик

```bash
# Метрики доступны на /metrics endpoint
curl http://localhost:5001/metrics
```

### Остановка и удаление

```bash
# Остановка контейнера
docker stop prometheus-client-package

# Удаление контейнера
docker rm prometheus-client-package

# Остановка и удаление одной командой
docker rm -f prometheus-client-package
```

### Использование docker-compose

Создайте файл `docker-compose.yml`:

```yaml
version: '3.8'

services:
  prometheus-client:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: prometheus-client-package
    environment:
      - PROMETHEUS_METRICS_PATH=/metrics
      - PROMETHEUS_DEFAULT_METRICS=true
    ports:
      - "5001:5001"
    networks:
      - prometheus-network
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - prometheus-network
    restart: unless-stopped

networks:
  prometheus-network:
    driver: bridge
```

Запуск:

```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f prometheus-client

# Остановка
docker-compose down
```

## 🔑 Ключевые особенности реализации

### ESM пакет
Пакет полностью использует ESM (ECMAScript Modules):
- `"type": "module"` в package.json
- Все импорты используют ESM синтаксис
- Поддержка `exports` поля для современного разрешения модулей
- Совместим с Node.js 22.11+ и современными bundler'ами

### Global Module
PrometheusClientModule помечен как `@Global()`:
- Регистрируется **один раз** в AppModule
- Доступен во **всех модулях** без повторного импорта
- Конфигурация передается через `forRootAsync()`

### Глобальный Registry
- Используется глобальный Registry от `prom-client` (`register`)
- Это гарантирует совместимость с @willsoto/nestjs-prometheus
- Все метрики автоматически экспортируются на `/metrics` endpoint

### Инициализация метрик
- Метрики создаются в конструкторе сервиса через `PrometheusService`
- Метрики регистрируются в глобальном Registry автоматически
- Метрики доступны сразу после создания

### Экспорт метрик
- Метрики автоматически экспортируются на `/metrics` endpoint через @willsoto/nestjs-prometheus
- Endpoint настраивается через `path` в `PrometheusModuleOptions`
- По умолчанию: `/metrics`

### Специализированные сервисы
- `HttpMetricsService`, `KafkaMetricsService`, `AiMetricsService` автоматически создают метрики при инициализации
- Предоставляют готовые методы для записи метрик
- Упрощают работу с метриками в приложении

### HTTP Интерцептор
- `PrometheusHttpInterceptor` автоматически собирает HTTP метрики
- Настраивается через `httpMetrics` в `PrometheusModuleOptions`
- Поддерживает игнорирование путей и методов

### Реестр метрик
- `MetricRegistry` управляет предопределенными метриками
- Метрики регистрируются при инициализации модуля
- Доступны через методы `getCounter()`, `getHistogram()`, `getGauge()`, `getSummary()`

## 📝 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🤝 Contribution

Pull requests приветствуются! Для крупных изменений, пожалуйста, сначала откройте issue для обсуждения.

## ❓ Частые вопросы

### Почему метрики не экспортируются на /metrics?
- Проверьте, что PrometheusClientModule зарегистрирован в AppModule
- Убедитесь, что используется глобальный Registry (по умолчанию)
- Проверьте путь `/metrics` в конфигурации

### Как изменить путь для экспорта метрик?
Используйте параметр `path` в конфигурации `PrometheusModuleOptions`.

### Как отключить дефолтные метрики Node.js?
Установите `defaultMetrics: false` в конфигурации `PrometheusModuleOptions`.

### Как отключить автоматический сбор HTTP метрик?
Установите `httpMetrics.enabled: false` в конфигурации `PrometheusModuleOptions` или не подключайте `PrometheusHttpInterceptor`.

### Как использовать предопределенные метрики?
Настройте `predefinedMetrics` в конфигурации модуля и используйте `MetricRegistry` для доступа к метрикам.

### Почему используется Global Module?
Чтобы PrometheusService и специализированные сервисы были доступны во всех модулях без повторного импорта. Это упрощает использование метрик в любом месте приложения.

### Как работает Registry?
Используется глобальный Registry от `prom-client`, который автоматически используется @willsoto/nestjs-prometheus для экспорта метрик на `/metrics` endpoint.
