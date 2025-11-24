# @makebelieve21213-packages/prometheus-client

Prometheus клиент для NestJS с поддержкой метрик, экспорта и интеграции с @willsoto/nestjs-prometheus.

## 📋 Содержание

- [Возможности](#-возможности)
- [Требования](#-требования)
- [Установка](#-установка)
- [Структура пакета](#-структура-пакета)
- [Быстрый старт](#-быстрый-старт)
- [Использование](#-использование)
- [API Reference](#-api-reference)
- [Конфигурация](#-конфигурация)
- [Тестирование](#-тестирование)

## 🚀 Возможности

- ✅ **Интеграция с @willsoto/nestjs-prometheus** - автоматический экспорт метрик на `/metrics` endpoint
- ✅ **Type-safe API** - полная типобезопасность TypeScript
- ✅ **Создание метрик** - Counter, Histogram, Gauge, Summary метрики
- ✅ **Специализированные сервисы** - готовые сервисы для HTTP, Kafka и AI метрик
- ✅ **Автоматический сбор HTTP метрик** - интерцептор для автоматического трекинга HTTP запросов
- ✅ **Декораторы** - `@TrackDuration`, `@TrackCounter`, `@PrometheusMetric` для удобного трекинга
- ✅ **Предопределенные наборы метрик** - готовые наборы для HTTP, Kafka и Database
- ✅ **Global Module** - регистрируется один раз и доступен во всех модулях
- ✅ **100% покрытие тестами** - надежность и качество кода
- ✅ **ESM модуль** - современный стандарт модулей JavaScript
- ✅ **TypeScript** - полная типизация

## 📋 Требования

- **Node.js**: >= 22.11.0
- **NestJS**: >= 11.0.0

## 📦 Установка

```bash
npm install @makebelieve21213-packages/prometheus-client
```

### Зависимости

Пакет требует следующие peer dependencies:

```json
{
  "@nestjs/common": "^11.0.0",
  "@willsoto/nestjs-prometheus": "^6.0.0",
  "prom-client": "^15.0.0",
  "reflect-metadata": "^0.1.13 || ^0.2.0",
  "rxjs": "^7.8.0"
}
```

## 📁 Структура пакета

```
src/
├── main/
│   ├── prometheus.module.ts              # NestJS модуль (Global)
│   └── prometheus.service.ts             # Сервис для работы с метриками
├── services/
│   ├── http-metrics.service.ts           # Сервис для HTTP метрик
│   ├── kafka-metrics.service.ts          # Сервис для Kafka метрик
│   └── ai-metrics.service.ts             # Сервис для AI метрик
├── interceptors/
│   └── prometheus-http.interceptor.ts    # HTTP интерцептор
├── decorators/
│   ├── prometheus-metric.decorator.ts    # Декоратор для кастомных метрик
│   ├── track-duration.decorator.ts       # Декоратор для измерения времени
│   └── track-counter.decorator.ts        # Декоратор для подсчета вызовов
├── utils/
│   ├── injection-keys.ts                 # DI токены
│   ├── metric-labels.ts                  # Утилиты для работы с метками
│   ├── metric-registry.ts                # Реестр предопределенных метрик
│   ├── metric-sets.ts                    # Предопределенные наборы метрик
│   ├── metric-timer.ts                   # Утилита для измерения времени
│   └── metric-wrapper.ts                 # Обертка для функций с метриками
├── types/
│   ├── module-options.interface.ts       # Опции конфигурации модуля
│   ├── prometheus.interface.ts           # Интерфейс PrometheusClientContract
│   ├── metric-sets.interface.ts          # Интерфейсы наборов метрик
│   ├── metric-wrapper.interface.ts       # Интерфейс опций обертки функций
│   └── prometheus-metric.interface.ts    # Интерфейс конфигурации декоратора метрик
└── index.ts                              # Точка входа (экспорты)
```

## 🔧 Быстрый старт

### Шаг 1: Подключение в AppModule

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

### Шаг 2: Автоматический сбор HTTP метрик

Подключите интерцептор глобально:

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

### Шаг 3: Использование в сервисах

```typescript
import { Injectable } from '@nestjs/common';
import { HttpMetricsService, TrackDuration, TrackCounter } from '@makebelieve21213-packages/prometheus-client';

@Injectable()
export default class MyService {
  constructor(private readonly httpMetrics: HttpMetricsService) {}

  @TrackDuration('my_method_duration_seconds', { service: 'my-service' })
  @TrackCounter('my_method_calls_total', { service: 'my-service' })
  async myMethod() {
    // Ваша логика
  }
}
```

## 📚 Использование

### PrometheusService

**Методы:**

#### `createCounter(config)`

Создает Counter метрику для подсчета событий.

```typescript
const counter = prometheusService.createCounter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

counter.inc({ method: 'GET', route: '/api/users', status: '200' });
```

#### `createHistogram(config)`

Создает Histogram метрику для измерения распределения значений.

```typescript
const histogram = prometheusService.createHistogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const timer = histogram.startTimer({ method: 'GET', route: '/api/users' });
// ... выполнение запроса
timer();
```

#### `createGauge(config)`

Создает Gauge метрику для значений, которые могут увеличиваться и уменьшаться.

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

#### `createSummary(config)`

Создает Summary метрику для вычисления квантилей.

```typescript
const summary = prometheusService.createSummary({
  name: 'request_summary_seconds',
  help: 'Request duration summary',
  labelNames: ['method'],
  percentiles: [0.5, 0.9, 0.99],
});

summary.observe({ method: 'GET' }, 0.5);
```

### Специализированные сервисы

#### HttpMetricsService

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
this.httpMetrics.recordHttpRequest('GET', '/api/users', 200, 150);

// Записать метрики для ошибки
this.httpMetrics.recordHttpError('GET', '/api/users', 500, 150, new Error('Error'));
```

#### KafkaMetricsService

Автоматически создает и управляет Kafka метриками:
- `kafka_messages_total` - общее количество обработанных сообщений
- `kafka_message_duration_seconds` - длительность обработки сообщений
- `kafka_errors_total` - количество ошибок обработки

```typescript
import { KafkaMetricsService } from '@makebelieve21213-packages/prometheus-client';

constructor(private readonly kafkaMetrics: KafkaMetricsService) {}

this.kafkaMetrics.recordKafkaMessage('chat.service.commands', 'CreateMessage', 'success', 50);
this.kafkaMetrics.recordKafkaError('chat.service.commands', 'CreateMessage', new Error('Error'));
```

#### AiMetricsService

Автоматически создает и управляет AI метриками:
- `ai_stream_requests_total` - общее количество stream запросов
- `ai_stream_duration_seconds` - длительность stream запросов
- `ai_stream_tokens_total` - общее количество токенов в stream
- `ai_requests_total` - общее количество AI запросов
- `ai_request_duration_seconds` - длительность AI запросов

```typescript
import { AiMetricsService } from '@makebelieve21213-packages/prometheus-client';

constructor(private readonly aiMetrics: AiMetricsService) {}

this.aiMetrics.recordAiStream('success', 5000, 1000);
this.aiMetrics.recordAiRequest('success', 3000, 500, 'gpt-4');
```

### Декораторы

#### `@TrackDuration(metricName?, labels?)`

Автоматически измеряет время выполнения метода и записывает в Histogram метрику.

```typescript
import { TrackDuration } from '@makebelieve21213-packages/prometheus-client';

@TrackDuration('my_method_duration_seconds', { service: 'my-service' })
async myMethod() {
  // Время выполнения будет автоматически измерено
}
```

#### `@TrackCounter(metricName?, labels?)`

Автоматически подсчитывает вызовы метода и записывает в Counter метрику.

```typescript
import { TrackCounter } from '@makebelieve21213-packages/prometheus-client';

@TrackCounter('my_method_calls_total', { service: 'my-service' })
async myMethod() {
  // Каждый вызов будет автоматически подсчитан
}
```

#### `@PrometheusMetric(config)`

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

## ⚙️ Конфигурация

### PrometheusModuleOptions

```typescript
interface PrometheusModuleOptions {
  path?: string; // Опционально: путь для экспорта метрик (по умолчанию "/metrics")
  defaultMetrics?: boolean; // Опционально: включить дефолтные метрики Node.js (по умолчанию true)
  httpMetrics?: HttpMetricsOptions; // Опционально: опции для HTTP метрик
  predefinedMetrics?: PredefinedMetricsConfig; // Опционально: предопределенные метрики
}

interface HttpMetricsOptions {
  enabled?: boolean; // Включить сбор HTTP метрик (по умолчанию: true)
  ignorePaths?: string[]; // Игнорировать определенные пути
  ignoreMethods?: string[]; // Игнорировать определенные методы
  durationBuckets?: number[]; // Buckets для гистограммы длительности запросов
  requestSizeBuckets?: number[]; // Buckets для гистограммы размера запроса
  responseSizeBuckets?: number[]; // Buckets для гистограммы размера ответа
}
```

### Переменные окружения

```env
# Prometheus конфигурация
PROMETHEUS_METRICS_PATH=/metrics
PROMETHEUS_DEFAULT_METRICS=true
```

## 📈 Интеграция с Prometheus

После настройки модуля метрики автоматически экспортируются на `/metrics` endpoint через @willsoto/nestjs-prometheus.

Prometheus будет собирать метрики по адресу:
- `http://localhost:5001/metrics` (service-1)
- `http://localhost:5002/metrics` (service-2)
- `http://localhost:5003/metrics` (service-3)

### Пример конфигурации Prometheus

```yaml
scrape_configs:
  - job_name: 'service-1'
    static_configs:
      - targets: ['localhost:5001']
    metrics_path: '/metrics'
  
  - job_name: 'service-2'
    static_configs:
      - targets: ['localhost:5002']
    metrics_path: '/metrics'
```

## 🧪 Тестирование

Пакет имеет **100% покрытие тестами**.

```bash
# Запустить тесты
npm test

# Запустить тесты с покрытием
npm run test:coverage
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

## 🚨 Troubleshooting

### Метрики не экспортируются на /metrics

**Решение:**
1. Проверьте, что PrometheusClientModule зарегистрирован в AppModule
2. Убедитесь, что используется глобальный Registry (по умолчанию)
3. Проверьте путь `/metrics` в конфигурации

### HTTP метрики не собираются

**Решение:**
1. Убедитесь, что `PrometheusHttpInterceptor` подключен как `APP_INTERCEPTOR`
2. Проверьте, что `httpMetrics.enabled` не установлен в `false`

### Метрики не создаются

**Решение:**
1. Убедитесь, что PrometheusService инжектирован через DI NestJS
2. Проверьте, что метрики создаются в конструкторе сервиса или в `onModuleInit()`

## 📄 Лицензия

MIT

## 👥 Автор

Skryabin Aleksey
