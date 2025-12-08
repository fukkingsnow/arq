# PHASE 0: OS INTEGRATION LAYER - Детальная спецификация

## Обзор

Phase 0 (OS Integration Layer) является фундаментальным уровнем архитектуры ARQ AI Assistant Backend. Это критическая основа, на которой строятся все последующие фазы (9, 10, 11, 12). Phase 0 обеспечивает абстрактивный слой между операционной системой и приложением, позволяя кроссплатформенное взаимодействие с Windows, Linux и macOS.

**Важность:** Без OS Integration Layer, все последующие фазы не смогут работать корректно на разных платформах.

## Сроки реализации

- **Ожидаемая длительность:** 3-4 недели
- **Предварительные тесты:** 1 неделя (40+ unit/integration тестов)
- **Deployment Testing:** 1 неделя
- **Критический путь:** Должна быть завершена до всех других фаз

## Архитектурные компоненты

### 1. Cross-Platform Process Management

**Назначение:** Унифицированное управление процессами независимо от ОС.

**Компоненты:**
- `ProcessManager` - базовый класс для управления процессами
- `WindowsProcessManager` - реализация для Windows
- `LinuxProcessManager` - реализация для Linux
- `MacOSProcessManager` - реализация для macOS
- Process Pool с поддержкой graceful shutdown
- Monitoring и health checks

**Ключевые методы:**
```python
class ProcessManager:
    def spawn_process(self, command, args, env)
    def get_process_status(self, pid)
    def terminate_process(self, pid, graceful=True)
    def get_resource_usage(self, pid)
    def monitor_processes(self, callback)
```

**Требования:**
- Поддержка до 100 одновременных процессов
- Graceful shutdown за < 5 секунд
- Автоматическое очищение zombie processes
- Real-time resource monitoring

### 2. File System Abstraction

**Назначение:** Единый интерфейс для работы с файловой системой.

**Компоненты:**
- `FileSystemManager` - базовый класс
- `WindowsFSManager` - для Windows (обработка UNC paths, short names)
- `UnixFSManager` - для Linux/macOS
- Path normalization и validation
- Symbolic link handling
- File permissions management

**Ключевые методы:**
```python
class FileSystemManager:
    def normalize_path(self, path)
    def create_directory(self, path, mode)
    def read_file(self, path, encoding)
    def write_file(self, path, content, encoding)
    def list_directory(self, path, recursive)
    def get_file_permissions(self, path)
    def set_file_permissions(self, path, mode)
    def watch_directory(self, path, callback)
```

**Требования:**
- Поддержка путей длиной > 260 символов на Windows (с prefix '\\?\')
- Обработка кодировок UTF-8, UTF-16, ASCII
- Atomic file operations с transactional support
- Watch mechanism с debouncing

### 3. Environment & Configuration Management

**Назначение:** Управление переменными окружения и платформо-специфичными параметрами.

**Компоненты:**
- `EnvironmentManager` - управление переменными окружения
- `ConfigResolver` - разрешение платформо-зависимых конфигов
- Registry access (Windows-only)
- Environment variable caching с auto-refresh

**Ключевые методы:**
```python
class EnvironmentManager:
    def get_env_var(self, name, default)
    def set_env_var(self, name, value)
    def get_all_env_vars(self)
    def get_platform_config(self, key)
    def read_registry(self, hive, path, key)  # Windows only
```

**Требования:**
- Поддержка переменных окружения длиной > 32KB
- Автоматическое экранирование специальных символов
- Кэширование с TTL 5 минут
- Thread-safe операции

### 4. System Monitoring & Resource Management

**Назначение:** Мониторинг ресурсов системы и контроль их использования.

**Компоненты:**
- `SystemMonitor` - сбор метрик ОС
- `ResourceController` - управление ресурсами (CPU throttling, memory limits)
- `PerformanceTracker` - отслеживание performance метрик
- Alert system при превышении лимитов

**Ключевые метрики:**
```python
class SystemMetrics:
    cpu_usage: float  # 0-100%
    memory_usage: float  # bytes
    memory_available: float  # bytes
    disk_usage: Dict[str, float]  # per mount point
    network_io: Dict[str, float]  # bytes in/out
    process_count: int
    thread_count: int
```

**Требования:**
- Сбор метрик каждые 1 секунду
- Поддержка cgroup limits на Linux
- Job Object limits на Windows
- Точность в ±2%

### 5. Signal & Event Handling

**Назначение:** Единая система обработки сигналов и системных событий.

**Компоненты:**
- `SignalHandler` - обработка POSIX signals (Linux/macOS)
- `EventListener` - обработка Windows events
- Graceful shutdown handler
- Error recovery mechanism

**Поддерживаемые события:**
- SIGTERM, SIGINT, SIGHUP (Linux/macOS)
- WM_QUERYENDSESSION, WM_ENDSESSION (Windows)
- System power events
- Process termination events

**Требования:**
- Graceful shutdown за < 10 секунд
- No data loss при завершении
- Automatic cleanup resources

### 6. Logging & Diagnostics (OS-aware)

**Назначение:** Платформо-специфичное логирование и диагностика.

**Компоненты:**
- `SystemLogger` - интеграция с syslog (Linux), Event Viewer (Windows)
- `DiagnosticCollector` - сбор информации для troubleshooting
- Performance profiling (platform-specific)
- Crash dump generation

**Логируемые события:**
- Process lifecycle (spawn, exit, crash)
- Resource usage alerts
- File system operations (при DEBUG уровне)
- Network connectivity changes
- System configuration changes

**Требования:**
- Ротация логов: 10MB файл или 24 часа
- Хранение последних 30 дней
- Поиск в логах за O(log n)

## Технический стек

### Обязательные библиотеки:
- `psutil` - система мониторинга
- `watchdog` - файловая система
- `loguru` - логирование
- `pydantic` - валидация конфигов
- `tenacity` - retry logic

### Python версии:
- Python 3.9+ (основная)
- Python 2.7 (для Variant A совместимости - optional)

### Платформы:
- Windows 10/11 (x64)
- Ubuntu 20.04 LTS+ (x64)
- macOS 11+ (x64/ARM64)

## Файлы для разработки

1. **src/os_layer/__init__.py** - Package initialization
2. **src/os_layer/base.py** - Абстрактные базовые классы
3. **src/os_layer/process_manager.py** - Управление процессами
4. **src/os_layer/filesystem.py** - Файловая система
5. **src/os_layer/environment.py** - Окружение и конфиг
6. **src/os_layer/system_monitor.py** - Мониторинг системы
7. **src/os_layer/signals.py** - Обработка сигналов
8. **src/os_layer/logger.py** - Логирование
9. **src/os_layer/exceptions.py** - Custom exceptions

## Тесты (40+ тестов требуются)

### Unit Tests (25+ тестов):
- ProcessManager функциональность
- FileSystemManager операции
- EnvironmentManager управление
- Path normalization
- Permission handling
- Signal handling

### Integration Tests (15+ тестов):
- Межпроцессное взаимодействие
- Файловая система мониторинг
- Resource limits enforcement
- Graceful shutdown
- Multi-platform compatibility

### Performance Tests:
- Process spawning: < 100ms
- File operations: < 50ms
- Resource queries: < 10ms
- Memory usage: < 20MB baseline

## Критерии успеха

✅ Все 40+ тестов проходят на Windows, Linux, macOS
✅ Code coverage >= 85%
✅ Performance benchmarks достигнуты
✅ Документация полная на русском и английском
✅ Нет warnings/errors в статическом анализе (pylint, mypy)
✅ Graceful shutdown работает без потери данных
✅ Zero memory leaks в long-running сценариях (24+ часа)

## Интеграция с фазами 9-12

**Phase 9 (LLM Integration):**
- Использует ProcessManager для запуска LLM моделей
- Использует SystemMonitor для мониторинга потребления памяти

**Phase 10 (Browser Automation):**
- Использует FileSystemManager для кэша браузера
- Использует EnvironmentManager для переменных браузера
- Использует SignalHandler для graceful browser shutdown

**Phase 11 (System Control):**
- Полная зависимость от OS Layer для всех операций
- Использует все 6 компонентов

**Phase 12 (Multi-Agent):**
- Использует ProcessManager для управления агентами
- Использует SystemMonitor для балансирования нагрузки

## Развертывание Phase 0

### Pre-Deployment:
1. Финальные тесты на всех платформах
2. Performance profiling
3. Security audit
4. Documentation review

### Deployment:
1. Создание feature branch `phase-0-os-integration`
2. Мерж в development после code review
3. Мерж в main перед развертыванием остальных фаз
4. Tag: `v0.1.0-phase0`

### Post-Deployment:
1. 48-часовой мониторинг
2. A/B тестирование с фазой 9
3. Performance baselines establish

## Зависимости и риски

### Зависимости:
- Требует Python 3.9+ (или 2.7 для Variant A)
- Требует административного доступа на Windows для некоторых операций
- Registry access требуется для полной Windows интеграции

### Риски:
- **Риск 1:** Platform-specific bugs - MITIGATION: Extensive cross-platform testing
- **Риск 2:** Performance degradation - MITIGATION: Caching и optimization
- **Риск 3:** Breaking changes в OS APIs - MITIGATION: Version pinning dependencies

## Выводы

Phase 0 (OS Integration Layer) является критической основой для успешной реализации ARQ AI Assistant Backend. Тщательная спецификация и реализация этой фазы обеспечит надежность, производительность и совместимость всех последующих фаз на различных платформах.

---

**Статус:** 📋 СПЕЦИФИКАЦИЯ ГОТОВА К РАЗРАБОТКЕ
**Автор:** ARQ Development Team
**Дата создания:** 2025-11-22
**Версия:** 1.0
