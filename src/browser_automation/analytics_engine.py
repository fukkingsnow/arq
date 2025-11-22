"""Analytics Engine - Tier 2: Trend Analysis and Anomaly Detection

Provides trend detection, anomaly scoring, and multi-level classification
for ARQ system metrics and performance data.
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Tuple
import statistics
from threading import RLock


class TrendDirection(Enum):
    """Trend direction classification."""
    UP = "up"
    DOWN = "down"
    STABLE = "stable"
    UNKNOWN = "unknown"


class AnomalyLevel(Enum):
    """Anomaly severity classification."""
    NORMAL = "normal"
    MINOR = "minor"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass
class TrendAnalysis:
    """Trend analysis result."""
    direction: TrendDirection
    slope: float
    r_squared: float
    confidence: float


@dataclass
class AnomalyScore:
    """Anomaly detection result."""
    score: float
    level: AnomalyLevel
    z_score: float
    threshold: float
    message: str


class AnalyticsEngine:
    """Analytics engine for trend and anomaly detection."""

    def __init__(self, window_size: int = 30, anomaly_threshold: float = 2.5):
        """Initialize analytics engine.
        
        Args:
            window_size: Data window size for analysis (default: 30)
            anomaly_threshold: Z-score threshold for anomaly (default: 2.5)
        """
        self.window_size = window_size
        self.anomaly_threshold = anomaly_threshold
        self._lock = RLock()

    def detect_trend(self, data: List[float]) -> TrendAnalysis:
        """Detect trend in data.
        
        Args:
            data: List of float values
            
        Returns:
            TrendAnalysis with trend direction and metrics
        """
        with self._lock:
            if len(data) < 2:
                return TrendAnalysis(
                    direction=TrendDirection.UNKNOWN,
                    slope=0.0,
                    r_squared=0.0,
                    confidence=0.0
                )

            # Calculate trend using linear regression
            n = len(data)
            x_values = list(range(n))
            x_mean = sum(x_values) / n
            y_mean = sum(data) / n
            
            numerator = sum(
                (x_values[i] - x_mean) * (data[i] - y_mean)
                for i in range(n)
            )
            denominator = sum(
                (x_values[i] - x_mean) ** 2
                for i in range(n)
            )
            
            if denominator == 0:
                slope = 0.0
            else:
                slope = numerator / denominator
            
            # Determine trend direction
            if slope > 0.1:
                direction = TrendDirection.UP
            elif slope < -0.1:
                direction = TrendDirection.DOWN
            else:
                direction = TrendDirection.STABLE
            
            # Calculate R-squared
            y_pred = [y_mean + slope * (x - x_mean) for x in x_values]
            ss_res = sum((data[i] - y_pred[i]) ** 2 for i in range(n))
            ss_tot = sum((data[i] - y_mean) ** 2 for i in range(n))
            r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
            
            confidence = min(1.0, max(0.0, abs(slope) / (y_mean + 1)))
            
            return TrendAnalysis(
                direction=direction,
                slope=slope,
                r_squared=r_squared,
                confidence=confidence
            )

    def detect_anomaly(self, value: float, baseline: List[float]) -> AnomalyScore:
        """Detect anomalies using Z-score method.
        
        Args:
            value: Current value to check
            baseline: Baseline data for comparison
            
        Returns:
            AnomalyScore with detection result
        """
        with self._lock:
            if not baseline or len(baseline) < 2:
                return AnomalyScore(
                    score=0.0,
                    level=AnomalyLevel.NORMAL,
                    z_score=0.0,
                    threshold=self.anomaly_threshold,
                    message="Insufficient baseline data"
                )
            
            # Calculate Z-score
            mean = statistics.mean(baseline)
            stdev = statistics.stdev(baseline) if len(baseline) > 1 else 0.0
            
            if stdev == 0:
                z_score = 0.0
            else:
                z_score = (value - mean) / stdev
            
            # Classify anomaly level
            abs_z = abs(z_score)
            if abs_z < 1.0:
                level = AnomalyLevel.NORMAL
                score = 0.0
                message = "Value within normal range"
            elif abs_z < self.anomaly_threshold:
                level = AnomalyLevel.MINOR
                score = 0.3
                message = "Minor deviation detected"
            elif abs_z < self.anomaly_threshold * 1.5:
                level = AnomalyLevel.WARNING
                score = 0.7
                message = "Warning: Significant deviation"
            else:
                level = AnomalyLevel.CRITICAL
                score = 1.0
                message = "Critical: Severe anomaly detected"
            
            return AnomalyScore(
                score=score,
                level=level,
                z_score=z_score,
                threshold=self.anomaly_threshold,
                message=message
            )

    def aggregate_metrics(self, metrics: List[Tuple[str, float]]) -> dict:
        """Aggregate multiple metrics.
        
        Args:
            metrics: List of (name, value) tuples
            
        Returns:
            Dictionary with aggregated metrics
        """
        with self._lock:
            aggregated = {}
            for name, value in metrics:
                if name not in aggregated:
                    aggregated[name] = []
                aggregated[name].append(value)
            
            result = {}
            for name, values in aggregated.items():
                result[name] = {
                    "mean": statistics.mean(values),
                    "median": statistics.median(values),
                    "min": min(values),
                    "max": max(values),
                    "stdev": statistics.stdev(values) if len(values) > 1 else 0.0
                }
            
            return result

    def calculate_percentile(self, data: List[float], percentile: float) -> float:
        """Calculate percentile value.
        
        Args:
            data: List of values
            percentile: Percentile to calculate (0-100)
            
        Returns:
            Percentile value
        """
        with self._lock:
            if not data:
                return 0.0
            
            sorted_data = sorted(data)
            index = int((percentile / 100.0) * len(sorted_data))
            return sorted_data[min(index, len(sorted_data) - 1)]
