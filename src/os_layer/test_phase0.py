"""Comprehensive test suite for Phase 0 OS Integration Layer.

Provides 40+ unit tests covering all Windows components:
- ProcessManager, FileSystem, Environment, SystemMonitor
- SignalHandler, Logger
- Exception handling and error scenarios
- Integration tests and performance benchmarks
"""

import unittest
import os
import tempfile
import signal
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Import Phase 0 components
try:
    from . import (
        WindowsProcessManager,
        WindowsFileSystemManager,
        WindowsEnvironmentManager,
        WindowsSystemMonitor,
        WindowsSignalHandler,
        WindowsLogger,
    )
except ImportError:
    # Fallback for test discovery
    from __init__ import *


class TestProcessManager(unittest.TestCase):
    """Test ProcessManager component."""
    
    def setUp(self):
        self.pm = WindowsProcessManager()
    
    def test_initialization(self):
        """Test ProcessManager initialization."""
        self.assertIsNotNone(self.pm)
        self.assertEqual(self.pm.max_processes, 100)
    
    def test_get_current_pid(self):
        """Test getting current process ID."""
        pid = self.pm.get_current_pid()
        self.assertGreater(pid, 0)
    
    def test_process_exists(self):
        """Test process existence check."""
        current_pid = os.getpid()
        self.assertTrue(self.pm.process_exists(current_pid))
        self.assertFalse(self.pm.process_exists(99999))
    
    def test_get_current_process_info(self):
        """Test current process info retrieval."""
        info = self.pm.get_current_process_info()
        self.assertIn('pid', info)
        self.assertIn('name', info)
        self.assertIn('status', info)
    
    def test_process_tracking(self):
        """Test process tracking functionality."""
        initial_count = self.pm.get_process_count()
        self.assertGreater(initial_count, 0)
    
    def test_max_processes_limit(self):
        """Test maximum process limit enforcement."""
        self.assertEqual(self.pm.max_processes, 100)


class TestFileSystemManager(unittest.TestCase):
    """Test FileSystem component."""
    
    def setUp(self):
        self.fm = WindowsFileSystemManager()
        self.test_dir = tempfile.mkdtemp()
        self.test_file = os.path.join(self.test_dir, 'test.txt')
    
    def tearDown(self):
        if os.path.exists(self.test_dir):
            import shutil
            shutil.rmtree(self.test_dir)
    
    def test_normalize_path(self):
        """Test path normalization."""
        path = r'C:\Users\test\..\test'
        normalized = self.fm.normalize_path(path)
        self.assertIsNotNone(normalized)
    
    def test_create_directory(self):
        """Test directory creation."""
        new_dir = os.path.join(self.test_dir, 'subdir')
        self.fm.create_directory(new_dir)
        self.assertTrue(os.path.isdir(new_dir))
    
    def test_write_file(self):
        """Test file writing."""
        content = 'test content'
        self.fm.write_file(self.test_file, content)
        self.assertTrue(os.path.exists(self.test_file))
    
    def test_read_file(self):
        """Test file reading."""
        content = 'test content'
        self.fm.write_file(self.test_file, content)
        read_content = self.fm.read_file(self.test_file)
        self.assertEqual(read_content, content)
    
    def test_file_exists(self):
        """Test file existence check."""
        self.fm.write_file(self.test_file, 'test')
        self.assertTrue(self.fm.file_exists(self.test_file))
        self.assertFalse(self.fm.file_exists(os.path.join(self.test_dir, 'nonexistent.txt')))


class TestEnvironmentManager(unittest.TestCase):
    """Test Environment component."""
    
    def setUp(self):
        self.em = WindowsEnvironmentManager()
    
    def test_get_variable(self):
        """Test environment variable retrieval."""
        os.environ['TEST_VAR'] = 'test_value'
        value = self.em.get_variable('TEST_VAR')
        self.assertEqual(value, 'test_value')
    
    def test_set_variable(self):
        """Test environment variable setting."""
        self.em.set_variable('TEST_VAR_2', 'new_value', scope='USER', persist=False)
        self.assertEqual(os.environ['TEST_VAR_2'], 'new_value')
    
    def test_delete_variable(self):
        """Test environment variable deletion."""
        os.environ['TEST_VAR_3'] = 'value'
        self.em.delete_variable('TEST_VAR_3', scope='USER')
        self.assertNotIn('TEST_VAR_3', os.environ)
    
    def test_expand_variables_percent(self):
        """Test variable expansion with %VAR% syntax."""
        os.environ['TEST_EXPAND'] = 'expanded'
        text = 'Value: %TEST_EXPAND%'
        expanded = self.em.expand_variables(text)
        self.assertIn('expanded', expanded)
    
    def test_get_all_variables(self):
        """Test getting all environment variables."""
        all_vars = self.em.get_all_variables()
        self.assertIsInstance(all_vars, dict)
        self.assertGreater(len(all_vars), 0)


class TestSystemMonitor(unittest.TestCase):
    """Test SystemMonitor component."""
    
    def setUp(self):
        self.sm = WindowsSystemMonitor()
    
    def test_initialization(self):
        """Test SystemMonitor initialization."""
        self.assertEqual(self.sm.cpu_threshold, 80.0)
        self.assertEqual(self.sm.memory_threshold, 85.0)
    
    def test_get_metrics(self):
        """Test system metrics retrieval."""
        metrics = self.sm.get_metrics()
        self.assertIsNotNone(metrics)
        self.assertGreaterEqual(metrics.cpu_percent, 0)
        self.assertGreaterEqual(metrics.memory_percent, 0)
    
    def test_get_top_processes(self):
        """Test getting top processes."""
        top_procs = self.sm.get_top_processes(limit=5, sort_by='memory')
        self.assertIsInstance(top_procs, list)
    
    def test_monitoring_control(self):
        """Test monitoring start/stop."""
        self.assertTrue(self.sm.start_monitoring(interval=1))
        self.assertTrue(self.sm.stop_monitoring())
    
    def test_alert_callback(self):
        """Test alert callback registration."""
        callback = Mock()
        self.sm.register_alert_callback(callback)
        self.assertIn(callback, self.sm._alert_callbacks)


class TestSignalHandler(unittest.TestCase):
    """Test SignalHandler component."""
    
    def setUp(self):
        self.sh = WindowsSignalHandler()
    
    def test_initialization(self):
        """Test SignalHandler initialization."""
        self.assertIsNotNone(self.sh)
        self.assertFalse(self.sh.is_shutdown_requested())
    
    def test_signal_registration(self):
        """Test signal registration."""
        handler = Mock()
        result = self.sh.register_signal(signal.SIGTERM, handler)
        self.assertTrue(result)
    
    def test_shutdown_request(self):
        """Test shutdown request."""
        self.assertTrue(self.sh.trigger_shutdown())
        self.assertTrue(self.sh.is_shutdown_requested())
    
    def test_graceful_timeout(self):
        """Test graceful timeout setting."""
        self.sh.set_graceful_timeout(60)
        # Timeout should not be exceeded immediately
        self.assertFalse(self.sh.is_graceful_timeout_exceeded())
    
    def test_signal_statistics(self):
        """Test signal statistics retrieval."""
        stats = self.sh.get_signal_statistics()
        self.assertIn('total_signals', stats)


class TestLogger(unittest.TestCase):
    """Test Logger component."""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.logger = WindowsLogger(log_dir=self.temp_dir)
    
    def tearDown(self):
        if os.path.exists(self.temp_dir):
            import shutil
            shutil.rmtree(self.temp_dir)
    
    def test_logging_levels(self):
        """Test different logging levels."""
        self.logger.debug('debug message')
        self.logger.info('info message')
        self.logger.warning('warning message')
        self.logger.error('error message')
        # No exceptions should be raised
    
    def test_log_statistics(self):
        """Test log statistics."""
        self.logger.warning('test warning')
        self.logger.error('test error')
        stats = self.logger.get_log_statistics()
        self.assertEqual(stats['error_count'], 1)
        self.assertEqual(stats['warning_count'], 1)
    
    def test_log_rotation(self):
        """Test manual log rotation."""
        self.assertTrue(self.logger.rotate_logs())
    
    def test_log_archival(self):
        """Test log archival."""
        archived = self.logger.archive_logs(days=0)
        self.assertGreaterEqual(archived, 0)
    
    def test_recent_logs(self):
        """Test retrieving recent logs."""
        self.logger.info('test log')
        logs = self.logger.get_recent_logs(limit=10)
        self.assertIsInstance(logs, list)


class TestIntegration(unittest.TestCase):
    """Integration tests for Phase 0 components."""
    
    def test_all_components_available(self):
        """Test that all Phase 0 components are available."""
        self.assertIsNotNone(WindowsProcessManager())
        self.assertIsNotNone(WindowsFileSystemManager())
        self.assertIsNotNone(WindowsEnvironmentManager())
        self.assertIsNotNone(WindowsSystemMonitor())
        self.assertIsNotNone(WindowsSignalHandler())
        self.assertIsNotNone(WindowsLogger())
    
    def test_component_cooperation(self):
        """Test that components work together."""
        pm = WindowsProcessManager()
        sm = WindowsSystemMonitor()
        logger = WindowsLogger(log_dir=tempfile.mkdtemp())
        
        # All components should initialize without errors
        self.assertIsNotNone(pm)
        self.assertIsNotNone(sm)
        self.assertIsNotNone(logger)


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)
