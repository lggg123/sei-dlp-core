"""Tests for SEI DLP Core Engine"""

import pytest
from sei_dlp_ai.core.engine import SEIDLPEngine


class TestSEIDLPEngine:
    """Test cases for the main SEI DLP Engine"""
    
    def test_engine_initialization(self):
        """Test that the engine can be initialized"""
        engine = SEIDLPEngine()
        assert engine is not None
        assert isinstance(engine, SEIDLPEngine)
    
    def test_engine_multiple_instances(self):
        """Test that multiple engine instances can be created"""
        engine1 = SEIDLPEngine()
        engine2 = SEIDLPEngine()
        
        assert engine1 is not engine2
        assert isinstance(engine1, SEIDLPEngine)
        assert isinstance(engine2, SEIDLPEngine)
