"""ML Predictor - Tier 4: Machine Learning & Anomaly Detection

Advanced ML-based anomaly detection and predictive analytics for system behavior.
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Tuple
from datetime import datetime
from threading import RLock
import statistics
import math


class PredictionType(Enum):
    """Prediction types."""
    NORMAL = "normal"
    ANOMALY = "anomaly"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


@dataclass
class PredictionResult:
    """ML prediction result."""
    type: PredictionType
    confidence: float
    score: float
    timestamp: datetime
    explanation: str


@dataclass
class AnomalyPattern:
    """Detected anomaly pattern."""
    pattern_id: str
    severity: float  # 0.0 to 1.0
    frequency: int
    last_seen: datetime
    affected_metrics: List[str]


class MLPredictor:
    """Machine learning-based predictor and anomaly detector."""

    def __init__(self, sensitivity: float = 0.7, min_samples: int = 10):
        """Initialize ML predictor.
        
        Args:
            sensitivity: Detection sensitivity (0.0-1.0)
            min_samples: Minimum samples for training
        """
        self.sensitivity = sensitivity
        self.min_samples = min_samples
        self.patterns: List[AnomalyPattern] = []
        self._lock = RLock()
        self._training_data: List[float] = []
        self._model_trained = False

    def train(self, data: List[float]) -> None:
        """Train model with historical data.
        
        Args:
            data: Historical training data
        """
        with self._lock:
            if len(data) >= self.min_samples:
                self._training_data = data.copy()
                self._model_trained = True

    def predict(self, value: float) -> PredictionResult:
        """Make prediction using trained model.
        
        Args:
            value: Value to predict on
            
        Returns:
            PredictionResult with prediction type and confidence
        """
        with self._lock:
            if not self._model_trained:
                return PredictionResult(
                    type=PredictionType.UNKNOWN,
                    confidence=0.0,
                    score=0.0,
                    timestamp=datetime.now(),
                    explanation="Model not trained"
                )
            
            # Calculate anomaly probability using isolation forest concept
            mean = statistics.mean(self._training_data)
            stdev = statistics.stdev(self._training_data) if len(self._training_data) > 1 else 0.0
            
            if stdev == 0:
                z_score = 0.0
            else:
                z_score = (value - mean) / stdev
            
            # Convert to anomaly probability
            probability = min(1.0, max(0.0, abs(z_score) / (1.0 / (1.0 - self.sensitivity))))
            
            if probability < 0.3:
                pred_type = PredictionType.NORMAL
                explanation = "Value within normal distribution"
            elif probability < 0.7:
                pred_type = PredictionType.ANOMALY
                explanation = "Deviation from normal pattern detected"
            else:
                pred_type = PredictionType.CRITICAL
                explanation = "Critical anomaly detected"
            
            return PredictionResult(
                type=pred_type,
                confidence=probability,
                score=probability,
                timestamp=datetime.now(),
                explanation=explanation
            )

    def detect_pattern(self, metrics: List[Tuple[str, List[float]]]) -> List[AnomalyPattern]:
        """Detect repeating anomaly patterns.
        
        Args:
            metrics: List of (metric_name, values) tuples
            
        Returns:
            List of detected patterns
        """
        with self._lock:
            patterns = []
            for metric_name, values in metrics:
                if len(values) < self.min_samples:
                    continue
                
                mean = statistics.mean(values)
                stdev = statistics.stdev(values) if len(values) > 1 else 0.0
                
                # Find outliers
                outliers = 0
                for v in values:
                    if stdev > 0:
                        z = (v - mean) / stdev
                        if abs(z) > 2.5:
                            outliers += 1
                
                # Create pattern if anomalies detected
                if outliers > 0:
                    frequency = outliers
                    severity = min(1.0, frequency / len(values))
                    
                    pattern = AnomalyPattern(
                        pattern_id=f"{metric_name}_{datetime.now().timestamp()}",
                        severity=severity,
                        frequency=frequency,
                        last_seen=datetime.now(),
                        affected_metrics=[metric_name]
                    )
                    patterns.append(pattern)
            
            self.patterns.extend(patterns)
            return patterns

    def get_risk_score(self) -> float:
        """Calculate overall system risk score.
        
        Returns:
            Risk score (0.0-1.0)
        """
        with self._lock:
            if not self.patterns:
                return 0.0
            
            avg_severity = statistics.mean([p.severity for p in self.patterns])
            return min(1.0, avg_severity * (len(self.patterns) / 10.0))

    def clear_patterns(self) -> None:
        """Clear detected patterns."""
        with self._lock:
            self.patterns.clear()
