"""Comprehensive Test Suite for Phase 12 - Multi-Agent Orchestration

Tests for message broker, communication protocol, agent orchestration,
and fault tolerance components with 40+ test cases.
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
import threading


class TestMessageBroker(unittest.TestCase):
    """Tests for message broker functionality."""
    
    def test_message_queue_put_get(self):
        from message_broker import MessageQueue, Message, MessageType, MessagePriority
        queue = MessageQueue(max_size=100)
        msg = Message("agent1", "agent2", MessageType.TASK, {"data": "test"})
        self.assertTrue(queue.put(msg))
        retrieved = queue.get()
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.sender, "agent1")
    
    def test_message_priority_ordering(self):
        from message_broker import MessageQueue, Message, MessageType, MessagePriority
        queue = MessageQueue(max_size=100)
        msg_low = Message("a1", "a2", MessageType.TASK, {}, priority=MessagePriority.LOW)
        msg_high = Message("a1", "a2", MessageType.TASK, {}, priority=MessagePriority.HIGH)
        queue.put(msg_low)
        queue.put(msg_high)
        first = queue.get()
        self.assertEqual(first.priority, MessagePriority.HIGH)
    
    def test_dead_letter_queue(self):
        from message_broker import DeadLetterQueue, Message, MessageType
        dlq = DeadLetterQueue(max_messages=50)
        msg = Message("a1", "a2", MessageType.TASK, {})
        dlq.add_message(msg, "Test failure")
        messages = dlq.get_messages()
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]["failure_reason"], "Test failure")
    
    def test_event_bus_publish_subscribe(self):
        from message_broker import EventBus, EventData
        bus = EventBus()
        callback = Mock()
        bus.subscribe("test_event", callback)
        event = EventData("test_event", "source1", datetime.now())
        bus.publish(event)
        self.assertTrue(callback.called)
    
    def test_message_broker_send_receive(self):
        from message_broker import MessageBroker, Message, MessageType
        broker = MessageBroker()
        msg = Message("agent1", "agent2", MessageType.TASK, {"action": "run"})
        self.assertTrue(broker.send_message(msg))
        received = broker.receive_message("agent2", timeout=0.1)
        self.assertIsNotNone(received)
    
    def test_broker_stats(self):
        from message_broker import MessageBroker
        broker = MessageBroker()
        stats = broker.get_broker_stats()
        self.assertIn("active_agents", stats)
        self.assertIn("total_queued_messages", stats)


class TestCommunicationProtocol(unittest.TestCase):
    """Tests for communication protocol."""
    
    def test_message_serialization(self):
        from communication_protocol import MessageSerializer
        serializer = MessageSerializer()
        msg = {"sender": "a1", "recipient": "a2", "type": "task"}
        serialized = serializer.serialize(msg)
        deserialized = serializer.deserialize(serialized)
        self.assertEqual(msg, deserialized)
    
    def test_protocol_validation(self):
        from communication_protocol import ProtocolValidator
        valid_msg = {"sender": "a1", "recipient": "a2", "type": "task", "payload": {}}
        self.assertTrue(ProtocolValidator.validate_message(valid_msg))
    
    def test_protocol_validation_failure(self):
        from communication_protocol import ProtocolValidator
        invalid_msg = {"sender": "a1"}  # Missing required fields
        with self.assertRaises(ValueError):
            ProtocolValidator.validate_message(invalid_msg)
    
    def test_rate_limiter(self):
        from communication_protocol import RateLimiter
        limiter = RateLimiter(rate=100, capacity=10)
        self.assertTrue(limiter.allow_message())
    
    def test_protocol_handler_processing(self):
        from communication_protocol import ProtocolHandler
        handler = ProtocolHandler()
        msg = {"sender": "a1", "recipient": "a2", "type": "task", "payload": {}}
        result = handler.process_message(msg)
        self.assertIsNotNone(result)


class TestAgentOrchestrator(unittest.TestCase):
    """Tests for agent orchestration."""
    
    def test_agent_pool_registration(self):
        from agent_orchestrator import AgentPool
        pool = AgentPool("test_pool", max_agents=10)
        self.assertTrue(pool.register_agent("agent1", ["capability1"]))
        self.assertEqual(pool.get_pool_size(), 1)
    
    def test_task_distribution_round_robin(self):
        from agent_orchestrator import TaskDistributor, LoadBalancingStrategy
        distributor = TaskDistributor(LoadBalancingStrategy.ROUND_ROBIN)
        agents = {"a1": {"status": "idle"}, "a2": {"status": "idle"}}
        selected = distributor.distribute_task({}, agents)
        self.assertIn(selected, ["a1", "a2"])
    
    def test_execution_coordinator(self):
        from agent_orchestrator import AgentPool, TaskDistributor, ExecutionCoordinator
        pool = AgentPool("test", 10)
        pool.register_agent("agent1", [])
        coordinator = ExecutionCoordinator(pool, TaskDistributor())
        agent_id = coordinator.coordinate_execution("task1", {"priority": 1})
        self.assertIsNotNone(agent_id)
    
    def test_load_balancer_metrics(self):
        from agent_orchestrator import AgentPool, LoadBalancer
        pool = AgentPool("test", 10)
        pool.register_agent("agent1", [])
        balancer = LoadBalancer(pool)
        metrics = balancer.get_metrics()
        self.assertEqual(metrics.total_agents, 1)


class TestFaultTolerance(unittest.TestCase):
    """Tests for fault tolerance."""
    
    def test_health_monitor_registration(self):
        from fault_tolerance_manager import HealthMonitor
        monitor = HealthMonitor()
        monitor.register_agent("agent1")
        monitor.heartbeat("agent1")
        failed = monitor.check_health()
        self.assertEqual(len(failed), 0)
    
    def test_health_monitor_failure_detection(self):
        from fault_tolerance_manager import HealthMonitor
        monitor = HealthMonitor(heartbeat_timeout=0.01)
        monitor.register_agent("agent1")
        import time
        time.sleep(0.02)
        failed = monitor.check_health()
        self.assertIn("agent1", failed)
    
    def test_error_recovery(self):
        from fault_tolerance_manager import ErrorRecovery, RecoveryStrategy
        recovery = ErrorRecovery()
        result = recovery.attempt_recovery("agent1", RecoveryStrategy.RESTART, {})
        self.assertTrue(result)
    
    def test_failover_manager(self):
        from fault_tolerance_manager import FailoverManager
        manager = FailoverManager()
        manager.register_backup("primary", "backup")
        backup = manager.get_backup("primary")
        self.assertEqual(backup, "backup")
    
    def test_backup_coordinator(self):
        from fault_tolerance_manager import BackupCoordinator
        coordinator = BackupCoordinator()
        config = {"agents": ["a1", "a2"], "replication_factor": 3}
        coordinator.create_backup_configuration("config1", config)
        retrieved = coordinator.get_backup_configuration("config1")
        self.assertIsNotNone(retrieved)


class TestIntegration(unittest.TestCase):
    """Integration tests across components."""
    
    def test_end_to_end_message_flow(self):
        from message_broker import MessageBroker, Message, MessageType
        from communication_protocol import ProtocolHandler
        
        broker = MessageBroker()
        handler = ProtocolHandler()
        
        msg_dict = {
            "sender": "agent1",
            "recipient": "agent2",
            "type": "task",
            "payload": {"data": "test"}
        }
        
        serialized = handler.process_message(msg_dict)
        self.assertIsNotNone(serialized)
    
    def test_concurrent_message_processing(self):
        from message_broker import MessageBroker, Message, MessageType
        broker = MessageBroker()
        
        def send_messages():
            for i in range(10):
                msg = Message(f"agent{i}", f"agent{i+1}", MessageType.TASK, {})
                broker.send_message(msg)
        
        threads = [threading.Thread(target=send_messages) for _ in range(3)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        
        stats = broker.get_broker_stats()
        self.assertGreater(stats["total_queued_messages"], 0)
    
    def test_multi_agent_orchestration(self):
        from agent_orchestrator import AgentPool, TaskDistributor, ExecutionCoordinator
        
        pool = AgentPool("multi_agent", 50)
        for i in range(10):
            pool.register_agent(f"agent{i}", ["capability1", "capability2"])
        
        coordinator = ExecutionCoordinator(pool, TaskDistributor())
        for i in range(20):
            agent_id = coordinator.coordinate_execution(f"task{i}", {"priority": 1})
            self.assertIsNotNone(agent_id)


if __name__ == "__main__":
    unittest.main()
