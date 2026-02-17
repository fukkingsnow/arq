"""Message Broker for Phase 12 - Multi-Agent Communication Layer

Provides central message routing, event bus, and message queue management
with priority support and dead letter queue handling.
"""

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable
from collections import defaultdict
from queue import PriorityQueue, Queue
import threading
import json


class MessageType(Enum):
    """Types of messages in the multi-agent system."""
    TASK = "task"
    RESULT = "result"
    EVENT = "event"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    CONTROL = "control"


class MessagePriority(Enum):
    """Message priority levels."""
    CRITICAL = 0
    HIGH = 1
    NORMAL = 2
    LOW = 3


@dataclass
class EventData:
    """Structured event data."""
    event_type: str
    source: str
    timestamp: datetime
    data: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        return {
            "event_type": self.event_type,
            "source": self.source,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data
        }


@dataclass
class Message:
    """Core message structure."""
    sender: str
    recipient: str
    message_type: MessageType
    payload: Dict[str, Any] = field(default_factory=dict)
    priority: MessagePriority = MessagePriority.NORMAL
    timestamp: datetime = field(default_factory=datetime.now)
    message_id: str = field(default="")
    correlation_id: Optional[str] = None
    
    def __lt__(self, other):
        """Priority comparison for queue ordering."""
        if self.priority.value != other.priority.value:
            return self.priority.value < other.priority.value
        return self.timestamp < other.timestamp
    
    def to_dict(self) -> Dict:
        return {
            "sender": self.sender,
            "recipient": self.recipient,
            "type": self.message_type.value,
            "payload": self.payload,
            "priority": self.priority.name,
            "timestamp": self.timestamp.isoformat(),
            "message_id": self.message_id,
            "correlation_id": self.correlation_id
        }


class MessageQueue:
    """Priority-based message queue with FIFO fallback."""
    
    def __init__(self, max_size: int = 1000):
        self.queue = PriorityQueue(maxsize=max_size)
        self.max_size = max_size
        self.size_lock = threading.Lock()
        self.message_count = 0
    
    def put(self, message: Message, block: bool = True) -> bool:
        """Add message to queue."""
        try:
            self.queue.put(message, block=block)
            with self.size_lock:
                self.message_count += 1
            return True
        except Exception:
            return False
    
    def get(self, block: bool = True, timeout: Optional[float] = None) -> Optional[Message]:
        """Retrieve message from queue."""
        try:
            message = self.queue.get(block=block, timeout=timeout)
            with self.size_lock:
                self.message_count -= 1
            return message
        except Exception:
            return None
    
    def size(self) -> int:
        """Get current queue size."""
        with self.size_lock:
            return self.message_count
    
    def is_empty(self) -> bool:
        return self.size() == 0


class DeadLetterQueue:
    """Handles messages that cannot be delivered or processed."""
    
    def __init__(self, max_messages: int = 500):
        self.messages: List[Dict] = []
        self.max_messages = max_messages
        self.lock = threading.Lock()
    
    def add_message(self, message: Message, reason: str) -> None:
        """Add failed message to DLQ."""
        with self.lock:
            if len(self.messages) >= self.max_messages:
                self.messages.pop(0)
            
            dlq_entry = {
                "message": message.to_dict(),
                "failure_reason": reason,
                "timestamp": datetime.now().isoformat()
            }
            self.messages.append(dlq_entry)
    
    def get_messages(self, limit: int = 10) -> List[Dict]:
        """Retrieve messages from DLQ."""
        with self.lock:
            return self.messages[-limit:]
    
    def clear(self) -> None:
        """Clear all messages from DLQ."""
        with self.lock:
            self.messages.clear()


class EventBus:
    """Pub/Sub event bus for agent communication."""
    
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = defaultdict(list)
        self.lock = threading.Lock()
    
    def subscribe(self, event_type: str, callback: Callable) -> None:
        """Subscribe to event type."""
        with self.lock:
            self.subscribers[event_type].append(callback)
    
    def unsubscribe(self, event_type: str, callback: Callable) -> None:
        """Unsubscribe from event type."""
        with self.lock:
            if event_type in self.subscribers:
                self.subscribers[event_type].remove(callback)
    
    def publish(self, event: EventData) -> None:
        """Publish event to subscribers."""
        with self.lock:
            callbacks = self.subscribers.get(event.event_type, [])
        
        for callback in callbacks:
            try:
                callback(event)
            except Exception as e:
                print(f"Error in event callback: {e}")
    
    def get_subscriber_count(self, event_type: str) -> int:
        """Get number of subscribers for event type."""
        with self.lock:
            return len(self.subscribers.get(event_type, []))


class MessageBroker:
    """Central message broker for multi-agent system."""
    
    def __init__(self, max_queue_size: int = 1000):
        self.message_queues: Dict[str, MessageQueue] = {}
        self.event_bus = EventBus()
        self.dead_letter_queue = DeadLetterQueue()
        self.max_queue_size = max_queue_size
        self.broker_lock = threading.Lock()
        self.message_history: List[Dict] = []
        self.max_history = 1000
    
    def _get_or_create_queue(self, agent_id: str) -> MessageQueue:
        """Get or create message queue for agent."""
        if agent_id not in self.message_queues:
            with self.broker_lock:
                if agent_id not in self.message_queues:
                    self.message_queues[agent_id] = MessageQueue(self.max_queue_size)
        return self.message_queues[agent_id]
    
    def send_message(self, message: Message) -> bool:
        """Send message to recipient."""
        try:
            queue = self._get_or_create_queue(message.recipient)
            success = queue.put(message, block=False)
            
            if success:
                self._record_message(message)
            else:
                self.dead_letter_queue.add_message(message, "Queue full")
            
            return success
        except Exception as e:
            self.dead_letter_queue.add_message(message, str(e))
            return False
    
    def receive_message(self, agent_id: str, timeout: float = 1.0) -> Optional[Message]:
        """Receive message for agent."""
        queue = self._get_or_create_queue(agent_id)
        return queue.get(block=True, timeout=timeout)
    
    def broadcast_message(self, message: Message, exclude_agents: List[str] = None) -> int:
        """Send message to all agents except excluded ones."""
        exclude_agents = exclude_agents or []
        successful_sends = 0
        
        with self.broker_lock:
            agents = list(self.message_queues.keys())
        
        for agent_id in agents:
            if agent_id not in exclude_agents:
                msg_copy = Message(
                    sender=message.sender,
                    recipient=agent_id,
                    message_type=message.message_type,
                    payload=message.payload.copy(),
                    priority=message.priority
                )
                if self.send_message(msg_copy):
                    successful_sends += 1
        
        return successful_sends
    
    def publish_event(self, event: EventData) -> None:
        """Publish event through event bus."""
        self.event_bus.publish(event)
    
    def subscribe_to_event(self, event_type: str, callback: Callable) -> None:
        """Subscribe to event type."""
        self.event_bus.subscribe(event_type, callback)
    
    def get_queue_status(self) -> Dict[str, int]:
        """Get status of all message queues."""
        with self.broker_lock:
            return {agent_id: queue.size() for agent_id, queue in self.message_queues.items()}
    
    def _record_message(self, message: Message) -> None:
        """Record message in history."""
        if len(self.message_history) >= self.max_history:
            self.message_history.pop(0)
        self.message_history.append(message.to_dict())
    
    def get_message_history(self, limit: int = 100) -> List[Dict]:
        """Get recent message history."""
        return self.message_history[-limit:]
    
    def get_dlq_messages(self, limit: int = 10) -> List[Dict]:
        """Get messages from dead letter queue."""
        return self.dead_letter_queue.get_messages(limit)
    
    def clear_dlq(self) -> None:
        """Clear dead letter queue."""
        self.dead_letter_queue.clear()
    
    def get_broker_stats(self) -> Dict[str, Any]:
        """Get broker statistics."""
        with self.broker_lock:
            return {
                "active_agents": len(self.message_queues),
                "total_queued_messages": sum(q.size() for q in self.message_queues.values()),
                "dlq_size": len(self.dead_letter_queue.messages),
                "history_size": len(self.message_history)
            }
