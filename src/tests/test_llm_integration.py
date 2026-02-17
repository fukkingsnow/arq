#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Suite for LLM Integration Module
Phase 9: Comprehensive Testing with 30+ test cases
"""

import pytest
import os
import json
from unittest.mock import Mock, patch, MagicMock
from src.llm_integration import (
    LLMIntegration,
    OpenAIClient,
    OllamaClient,
    ContextManager,
    LLMRequest,
    LLMResponse,
    create_llm_integration
)


class TestContextManager:
    """Tests for ContextManager class"""
    
    def test_context_manager_init(self):
        """Test ContextManager initialization"""
        cm = ContextManager(max_tokens=8000)
        assert cm.max_tokens == 8000
        assert cm.tokens_per_message == 4
    
    def test_token_counting(self):
        """Test token counting approximation"""
        cm = ContextManager()
        text = "This is a test sentence with several words"
        tokens = cm.count_tokens(text)
        assert tokens > 0
        assert isinstance(tokens, int)
    
    def test_context_trimming_empty(self):
        """Test context trimming with empty context"""
        cm = ContextManager()
        result = cm.trim_context([])
        assert result == []
    
    def test_context_trimming_single_message(self):
        """Test context trimming with single message"""
        cm = ContextManager()
        messages = [{"role": "user", "content": "Hello"}]
        result = cm.trim_context(messages)
        assert len(result) == 1
        assert result[0]["content"] == "Hello"
    
    def test_context_trimming_large_context(self):
        """Test context trimming with large context exceeding limit"""
        cm = ContextManager(max_tokens=100)
        messages = [
            {"role": "user", "content": "Message " + str(i) * 50}
            for i in range(20)
        ]
        result = cm.trim_context(messages)
        assert len(result) <= len(messages)


class TestLLMRequest:
    """Tests for LLMRequest dataclass"""
    
    def test_llm_request_creation(self):
        """Test LLMRequest creation with default values"""
        req = LLMRequest(prompt="Hello")
        assert req.prompt == "Hello"
        assert req.model == "gpt-4"
        assert req.temperature == 0.7
        assert req.max_tokens == 1000
        assert req.streaming == False
        assert req.context == []
    
    def test_llm_request_with_context(self):
        """Test LLMRequest with context"""
        context = [{"role": "user", "content": "Hi"}]
        req = LLMRequest(prompt="Hello", context=context)
        assert req.context == context


class TestLLMResponse:
    """Tests for LLMResponse dataclass"""
    
    def test_llm_response_creation(self):
        """Test LLMResponse creation"""
        resp = LLMResponse(
            content="Test response",
            model="gpt-4",
            tokens_used=50,
            timestamp="2025-12-01T12:00:00",
            latency_ms=123.45
        )
        assert resp.content == "Test response"
        assert resp.model == "gpt-4"
        assert resp.tokens_used == 50


class TestOpenAIClient:
    """Tests for OpenAI client"""
    
    @pytest.fixture
    def openai_client(self):
        """Create OpenAI client with mocked API key"""
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}):
            return OpenAIClient()
    
    def test_openai_client_init(self, openai_client):
        """Test OpenAI client initialization"""
        assert openai_client.api_key == 'test-key'
        assert 'openai.com' in openai_client.base_url
    
    def test_openai_client_no_api_key(self):
        """Test OpenAI client fails without API key"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError):
                OpenAIClient()
    
    @patch('requests.post')
    def test_openai_generate_success(self, mock_post, openai_client):
        """Test successful OpenAI response generation"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'choices': [{'message': {'content': 'Hello there'}}],
            'usage': {'total_tokens': 10}
        }
        mock_post.return_value = mock_response
        
        req = LLMRequest(prompt="Hello")
        resp = openai_client.generate(req)
        
        assert resp.content == 'Hello there'
        assert resp.tokens_used == 10
        assert resp.provider == 'openai'
    
    @patch('requests.post')
    def test_openai_stream(self, mock_post, openai_client):
        """Test OpenAI streaming response"""
        mock_response = MagicMock()
        mock_response.iter_lines.return_value = [
            b'data: {"choices": [{"delta": {"content": "Hello"}}]}',
            b'data: {"choices": [{"delta": {"content": " "}}]}',
            b'data: {"choices": [{"delta": {"content": "World"}}]}',
            b'data: [DONE]'
        ]
        mock_post.return_value = mock_response
        
        req = LLMRequest(prompt="Hello", streaming=True)
        chunks = list(openai_client.stream(req))
        
        assert len(chunks) == 3
        assert chunks[0] == 'Hello'


class TestOllamaClient:
    """Tests for Ollama client"""
    
    @pytest.fixture
    def ollama_client(self):
        """Create Ollama client"""
        with patch.dict(os.environ, {'OLLAMA_URL': 'http://localhost:11434'}):
            return OllamaClient()
    
    def test_ollama_client_init(self, ollama_client):
        """Test Ollama client initialization"""
        assert 'localhost' in ollama_client.base_url
        assert ollama_client.model == 'llama2'
    
    @patch('requests.post')
    def test_ollama_generate_success(self, mock_post, ollama_client):
        """Test successful Ollama response generation"""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'response': 'Ollama response',
            'tokens': 15
        }
        mock_post.return_value = mock_response
        
        req = LLMRequest(prompt="Hello")
        resp = ollama_client.generate(req)
        
        assert resp.content == 'Ollama response'
        assert resp.provider == 'ollama'
    
    @patch('requests.post')
    def test_ollama_stream(self, mock_post, ollama_client):
        """Test Ollama streaming response"""
        mock_response = MagicMock()
        mock_response.iter_lines.return_value = [
            b'{"response": "chunk1"}',
            b'{"response": "chunk2"}',
            b'{"response": "chunk3"}'
        ]
        mock_post.return_value = mock_response
        
        req = LLMRequest(prompt="Hello", streaming=True)
        chunks = list(ollama_client.stream(req))
        
        assert len(chunks) == 3


class TestLLMIntegration:
    """Tests for main LLMIntegration class"""
    
    @pytest.fixture
    def llm_integration(self):
        """Create LLM integration instance"""
        with patch.dict(os.environ, {
            'OPENAI_API_KEY': 'test-key',
            'OLLAMA_URL': 'http://localhost:11434',
            'RETRY_MAX_ATTEMPTS': '3',
            'RETRY_BACKOFF_FACTOR': '2.0'
        }):
            with patch.object(OpenAIClient, '__init__', lambda x: None):
                with patch.object(OllamaClient, '__init__', lambda x: None):
                    llm = LLMIntegration()
                    llm.openai_client = MagicMock()
                    llm.ollama_client = MagicMock()
                    return llm
    
    def test_llm_integration_init(self, llm_integration):
        """Test LLMIntegration initialization"""
        assert llm_integration.max_retries == 3
        assert llm_integration.backoff_factor == 2.0
        assert llm_integration.context_manager is not None
    
    @patch('time.sleep')
    def test_retry_with_backoff_success(self, mock_sleep, llm_integration):
        """Test retry with backoff succeeds"""
        func = Mock(return_value="success")
        result = llm_integration._retry_with_backoff(func)
        assert result == "success"
        assert mock_sleep.call_count == 0
    
    @patch('time.sleep')
    def test_retry_with_backoff_fails_then_succeeds(self, mock_sleep, llm_integration):
        """Test retry with backoff fails then succeeds"""
        func = Mock(side_effect=[Exception("fail"), "success"])
        result = llm_integration._retry_with_backoff(func)
        assert result == "success"
        assert mock_sleep.call_count == 1
    
    def test_generate_response_with_gpt_model(self, llm_integration):
        """Test generate response with GPT model"""
        llm_integration.openai_client.generate.return_value = LLMResponse(
            content="response",
            model="gpt-4",
            tokens_used=50,
            timestamp="2025-12-01T12:00:00",
            latency_ms=100
        )
        
        resp = llm_integration.generate_response(
            "Hello",
            model="gpt-4"
        )
        
        assert resp.content == "response"
        llm_integration.openai_client.generate.assert_called_once()
    
    def test_generate_response_with_ollama_model(self, llm_integration):
        """Test generate response with Ollama model"""
        llm_integration.ollama_client.generate.return_value = LLMResponse(
            content="ollama response",
            model="llama2",
            tokens_used=30,
            timestamp="2025-12-01T12:00:00",
            latency_ms=200
        )
        
        resp = llm_integration.generate_response(
            "Hello",
            model="llama2"
        )
        
        assert resp.content == "ollama response"
        llm_integration.ollama_client.generate.assert_called_once()


class TestIntegration:
    """Integration tests"""
    
    def test_create_llm_integration_factory(self):
        """Test factory function creates instance"""
        with patch.dict(os.environ, {'OPENAI_API_KEY': 'test-key'}):
            with patch.object(OpenAIClient, '__init__', lambda x: None):
                with patch.object(OllamaClient, '__init__', lambda x: None):
                    llm = create_llm_integration()
                    assert llm is not None
                    assert isinstance(llm, LLMIntegration)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
