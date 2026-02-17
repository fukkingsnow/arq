"""Browser Manager - Tier 1 Component (Phase 10)

Abstract interface for browser control with Selenium/Playwright implementations.
"""

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from enum import Enum
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class BrowserType(Enum):
    """Supported browser types"""
    CHROME = "chrome"
    FIREFOX = "firefox"
    EDGE = "edge"
    SAFARI = "safari"


class BrowserMode(Enum):
    """Browser execution modes"""
    HEADLESS = "headless"
    HEADED = "headed"
    DEBUG = "debug"


class NavigationEvent:
    """Represents navigation event"""
    def __init__(self, event_type: str, url: str, timestamp: datetime = None):
        self.event_type = event_type
        self.url = url
        self.timestamp = timestamp or datetime.utcnow()


class BrowserManager(ABC):
    """Abstract base class for browser management"""

    def __init__(
        self,
        browser_type: BrowserType = BrowserType.CHROME,
        mode: BrowserMode = BrowserMode.HEADLESS,
    ):
        self.browser_type = browser_type
        self.mode = mode
        self.current_url: Optional[str] = None
        self.navigation_history: List[NavigationEvent] = []
        self.session_id: Optional[str] = None

    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize browser session"""
        pass

    @abstractmethod
    async def navigate_to(self, url: str) -> bool:
        """Navigate to URL"""
        pass

    @abstractmethod
    async def get_page_source(self) -> str:
        """Get current page HTML"""
        pass

    @abstractmethod
    async def take_screenshot(self, filename: Optional[str] = None) -> bytes:
        """Take screenshot of current page"""
        pass

    @abstractmethod
    async def click_element(self, selector: str) -> bool:
        """Click element by CSS selector"""
        pass

    @abstractmethod
    async def type_text(self, selector: str, text: str) -> bool:
        """Type text into element"""
        pass

    @abstractmethod
    async def get_element_text(self, selector: str) -> str:
        """Get text content of element"""
        pass

    @abstractmethod
    async def close(self) -> bool:
        """Close browser session"""
        pass

    def record_navigation(self, event_type: str, url: str) -> None:
        """Record navigation event"""
        event = NavigationEvent(event_type, url)
        self.navigation_history.append(event)
        self.current_url = url
        logger.info(f"Navigation: {event_type} to {url}")

    def get_navigation_history(self) -> List[NavigationEvent]:
        """Get navigation history"""
        return self.navigation_history.copy()

    def get_session_info(self) -> Dict[str, Any]:
        """Get session information"""
        return {
            "session_id": self.session_id,
            "browser_type": self.browser_type.value,
            "mode": self.mode.value,
            "current_url": self.current_url,
            "navigation_count": len(self.navigation_history),
        }
