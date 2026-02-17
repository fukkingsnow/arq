"""Communication Protocol for Phase 12 - Message Serialization and Validation

Provides message serialization, protocol validation, rate limiting,
and protocol handling for the multi-agent communication system.
"""

from typing import Dict, Any, Optional
import json
import hashlib
import time
from datetime import datetime
import threading
from queue import Queue


class MessageSerializer:
    """Handles message serialization and deserialization."""
    
    @staticmethod
    def serialize(message: Dict[str, Any]) -> str:
        """Serialize message to JSON string."""
        try:
            return json.dumps(message, default=str)
        except Exception as e:
            raise ValueError(f"Serialization failed: {e}")
    
    @staticmethod
    def deserialize(data: str) -> Dict[str, Any]:
        """Deserialize JSON string to message."""
        try:
            return json.loads(data)
        except Exception as e:
            raise ValueError(f"Deserialization failed: {e}")
    
    @staticmethod
    def compute_hash(data: str) -> str:
        """Compute SHA256 hash of data for integrity."""
        return hashlib.sha256(data.encode()).hexdigest()


class ProtocolValidator:
    """Validates message format and protocol compliance."""
    
    REQUIRED_FIELDS = {"sender", "recipient", "type", "payload"}
    VALID_MESSAGE_TYPES = {"task", "result", "event", "heartbeat", "error", "control"}
    VALID_PRIORITIES = {"CRITICAL", "HIGH", "NORMAL", "LOW"}
    
    @classmethod
    def validate_message(cls, message: Dict[str, Any]) -> bool:
        """Validate message structure."""
        # Check required fields
        if not all(field in message for field in cls.REQUIRED_FIELDS):
            raise ValueError("Missing required fields")
        
        # Validate message type
        if message.get("type") not in cls.VALID_MESSAGE_TYPES:
            raise ValueError(f"Invalid message type: {message.get('type')}")
        
        # Validate priority if present
        if "priority" in message:
            if message["priority"] not in cls.VALID_PRIORITIES:
                raise ValueError(f"Invalid priority: {message['priority']}")
        
        # Validate payload is dict
        if not isinstance(message.get("payload"), dict):
            raise ValueError("Payload must be a dictionary")
        
        return True
    
    @classmethod
    def validate_sender(cls, sender: str) -> bool:
        """Validate sender format."""
        if not isinstance(sender, str) or len(sender) == 0:
            return False
        return len(sender) <= 256
    
    @classmethod
    def validate_recipient(cls, recipient: str) -> bool:
        """Validate recipient format."""
        if not isinstance(recipient, str) or len(recipient) == 0:
            return False
        return len(recipient) <= 256


class RateLimiter:
    """Implements token bucket rate limiting for message flow control."""
    
    def __init__(self, rate: float, capacity: int):
        """
        Initialize rate limiter.
        
        Args:
            rate: Messages per second
            capacity: Maximum burst capacity
        """
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_update = time.time()
        self.lock = threading.Lock()
    
    def allow_message(self) -> bool:
        """Check if message is allowed under rate limit."""
        with self.lock:
            now = time.time()
            elapsed = now - self.last_update
            self.tokens = min(
                self.capacity,
                self.tokens + elapsed * self.rate
            )
            self.last_update = now
            
            if self.tokens >= 1:
                self.tokens -= 1
                return True
            return False
    
    def get_tokens(self) -> float:
        """Get current token count."""
        with self.lock:
            now = time.time()
            elapsed = now - self.last_update
            tokens = min(
                self.capacity,
                self.tokens + elapsed * self.rate
            )
            return tokens


class ProtocolHandler:
    """Central protocol handling for serialization, validation, and routing."""
    
    def __init__(self, rate_limit: float = 1000, burst_capacity: int = 10000):
        self.serializer = MessageSerializer()
        self.validator = ProtocolValidator()
        self.rate_limiter = RateLimiter(rate_limit, burst_capacity)
        self.processed_count = 0
        self.error_count = 0
        self.handler_lock = threading.Lock()
    
    def process_message(self, message: Dict[str, Any]) -> Optional[str]:
        """Process message through full protocol pipeline."""
        try:
            # Validate message
            self.validator.validate_message(message)
            
            # Check rate limit
            if not self.rate_limiter.allow_message():
                raise RuntimeError("Rate limit exceeded")
            
            # Serialize message
            serialized = self.serializer.serialize(message)
            
            with self.handler_lock:
                self.processed_count += 1
            
            return serialized
        except Exception as e:
            with self.handler_lock:
                self.error_count += 1
            raise ValueError(f"Message processing failed: {e}")
    
    def handle_incoming(self, data: str) -> Optional[Dict[str, Any]]:
        """Handle incoming serialized message."""
        try:
            # Deserialize
            message = self.serializer.deserialize(data)
            
            # Validate
            self.validator.validate_message(message)
            
            with self.handler_lock:
                self.processed_count += 1
            
            return message
        except Exception as e:
            with self.handler_lock:
                self.error_count += 1
            raise ValueError(f"Incoming message handling failed: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get protocol handler statistics."""
        with self.handler_lock:
            return {
                "processed_messages": self.processed_count,
                "errors": self.error_count,
                "available_tokens": self.rate_limiter.get_tokens(),
                "rate_limit": self.rate_limiter.rate
            }
