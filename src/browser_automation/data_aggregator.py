# Phase 13: Tier 1 - Data Aggregator
# Multi-level aggregation, rolling windows, and correlation analysis
# Transforms raw metrics into actionable insights

import threading
import time
from collections import defaultdict, deque
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
from statistics import mean, stdev, median
import math


class AggregationLevel(Enum):
    """Aggregation granularity levels."""
    RAW = 1
    SECOND = 60
    MINUTE = 60
    HOUR = 3600


@dataclass
class AggregatedMetrics:
    """Aggregated metric statistics."""
    timestamp: float
    count: int
    mean: float
    median: float
    stddev: float
    min_value: float
    max_value: float
    percentile_50: float
    percentile_95: float
    percentile_99: float

    def to_dict(self) -> Dict[str, Any]:
        return {'timestamp': self.timestamp, 'count': self.count, 'mean': self.mean,
                'median': self.median, 'stddev': self.stddev, 'min': self.min_value,
                'max': self.max_value, 'p50': self.percentile_50,
                'p95': self.percentile_95, 'p99': self.percentile_99}


@dataclass
class RollingWindow:
    """Configurable rolling window for time-series aggregation."""
    duration_seconds: int
    window_size: int
    data: deque = field(default_factory=deque)
    timestamps: deque = field(default_factory=deque)
    lock: threading.RLock = field(default_factory=threading.RLock)

    def add(self, value: float, timestamp: Optional[float] = None) -> None:
        if timestamp is None:
            timestamp = time.time()
        with self.lock:
            cutoff_time = timestamp - self.duration_seconds
            while self.timestamps and self.timestamps[0] < cutoff_time:
                self.timestamps.popleft()
                self.data.popleft()
            self.data.append(value)
            self.timestamps.append(timestamp)

    def get_stats(self) -> Optional[Dict[str, float]]:
        with self.lock:
            if not self.data:
                return None
            values = list(self.data)
            sorted_vals = sorted(values)
            stats = {'count': len(values), 'mean': mean(values),
                    'median': median(sorted_vals), 'min': min(values), 'max': max(values)}
            if len(values) > 1:
                stats['stddev'] = stdev(values)
                stats['p50'] = self._percentile(sorted_vals, 50)
                stats['p95'] = self._percentile(sorted_vals, 95)
                stats['p99'] = self._percentile(sorted_vals, 99)
            else:
                stats['stddev'] = stats['p50'] = stats['p95'] = stats['p99'] = 0
            return stats

    def clear(self) -> None:
        with self.lock:
            self.data.clear()
            self.timestamps.clear()

    @staticmethod
    def _percentile(sorted_vals: List[float], percentile: int) -> float:
        idx = (percentile / 100.0) * (len(sorted_vals) - 1)
        lower, upper = int(math.floor(idx)), int(math.ceil(idx))
        if lower == upper:
            return sorted_vals[lower]
        return sorted_vals[lower] + (sorted_vals[upper] - sorted_vals[lower]) * (idx - lower)


class MultiLevelAggregator:
    """Aggregates metrics across multiple time-scale levels."""
    def __init__(self, buffer_size: int = 10000):
        self.aggregations: Dict[AggregationLevel, deque] = \
            {level: deque(maxlen=buffer_size) for level in AggregationLevel}
        self.lock = threading.RLock()
        self.last_aggregation_time: Dict[AggregationLevel, float] = {}
        self.buffer_size = buffer_size

    def add_aggregation(self, level: AggregationLevel, metrics: AggregatedMetrics) -> None:
        with self.lock:
            self.aggregations[level].append(metrics)
            self.last_aggregation_time[level] = time.time()

    def get_aggregations(self, level: AggregationLevel) -> List[AggregatedMetrics]:
        with self.lock:
            return list(self.aggregations[level])

    def get_recent(self, level: AggregationLevel, count: int) -> List[AggregatedMetrics]:
        with self.lock:
            aggs = list(self.aggregations[level])
            return aggs[-count:] if count > 0 else []


class CorrelationAnalyzer:
    """Analyzes correlations between different metrics."""
    def __init__(self, window_size: int = 100):
        self.metric_data: Dict[str, deque] = \
            defaultdict(lambda: deque(maxlen=window_size))
        self.lock = threading.RLock()
        self.window_size = window_size

    def record_metrics(self, metric_name: str, value: float) -> None:
        with self.lock:
            self.metric_data[metric_name].append(value)

    def calculate_correlation(self, metric1: str, metric2: str) -> Optional[float]:
        with self.lock:
            data1 = list(self.metric_data.get(metric1, []))
            data2 = list(self.metric_data.get(metric2, []))
            if len(data1) < 2 or len(data2) < 2 or len(data1) != len(data2):
                return None
            return self._pearson(data1, data2)

    def get_correlation_matrix(self) -> Dict[Tuple[str, str], float]:
        with self.lock:
            names = list(self.metric_data.keys())
            correlations = {}
            for i in range(len(names)):
                for j in range(i + 1, len(names)):
                    corr = self.calculate_correlation(names[i], names[j])
                    if corr is not None:
                        correlations[(names[i], names[j])] = corr
            return correlations

    @staticmethod
    def _pearson(x: List[float], y: List[float]) -> float:
        n = len(x)
        mx, my = mean(x), mean(y)
        num = sum((x[i] - mx) * (y[i] - my) for i in range(n))
        den = math.sqrt(sum((x[i] - mx) ** 2 for i in range(n)) *
                       sum((y[i] - my) ** 2 for i in range(n)))
        return num / den if den != 0 else 0.0


class DataAggregator:
    """Central data aggregation engine for Phase 13."""
    def __init__(self):
        self.rolling_windows: Dict[str, RollingWindow] = {}
        self.multi_level = MultiLevelAggregator()
        self.correlation = CorrelationAnalyzer()
        self.lock = threading.RLock()
        self.is_active = True
        self.aggregation_count = 0

    def create_window(self, name: str, duration: int, size: int = 1000) -> RollingWindow:
        with self.lock:
            window = RollingWindow(duration, size)
            self.rolling_windows[name] = window
            return window

    def get_window(self, name: str) -> Optional[RollingWindow]:
        with self.lock:
            return self.rolling_windows.get(name)

    def add_to_window(self, name: str, value: float, ts: Optional[float] = None) -> bool:
        window = self.get_window(name)
        if window:
            window.add(value, ts)
            return True
        return False

    def get_window_stats(self, name: str) -> Optional[Dict[str, float]]:
        window = self.get_window(name)
        return window.get_stats() if window else None

    def aggregate_to_level(self, level: AggregationLevel,
                          values: List[float], ts: float) -> None:
        if not values:
            return
        sorted_vals = sorted(values)
        metrics = AggregatedMetrics(
            timestamp=ts,
            count=len(values),
            mean=mean(values),
            median=median(sorted_vals),
            stddev=stdev(values) if len(values) > 1 else 0,
            min_value=min(values),
            max_value=max(values),
            percentile_50=RollingWindow._percentile(sorted_vals, 50),
            percentile_95=RollingWindow._percentile(sorted_vals, 95),
            percentile_99=RollingWindow._percentile(sorted_vals, 99)
        )
        self.multi_level.add_aggregation(level, metrics)
        self.aggregation_count += 1

    def get_stats(self) -> Dict[str, Any]:
        with self.lock:
            return {
                'windows': len(self.rolling_windows),
                'aggregations': self.aggregation_count,
                'active': self.is_active
            }

    def shutdown(self) -> None:
        with self.lock:
            self.is_active = False
            for window in self.rolling_windows.values():
                window.clear()
