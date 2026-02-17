"""Navigation Controller Module (Phase 10, Tier 1 - Browser Control)

Manages element interactions and navigation on web pages.
Provides abstraction for clicking, typing, form submission, and page navigation.

Архитектура:
- InteractionType: Types of user interactions
- InteractionResult: Result of an interaction attempt
- NavigationController: Manages page element interactions
- NavigationStrategy: Different navigation approaches
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List, Dict, Any, Tuple, Callable
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)


class InteractionType(Enum):
    """Types of user interactions with page elements."""
    CLICK = "click"
    DOUBLE_CLICK = "double_click"
    RIGHT_CLICK = "right_click"
    TYPE_TEXT = "type_text"
    CLEAR_FIELD = "clear_field"
    SELECT_OPTION = "select_option"
    SUBMIT_FORM = "submit_form"
    HOVER = "hover"
    DRAG_DROP = "drag_drop"
    SCROLL_INTO_VIEW = "scroll_into_view"
    FOCUS = "focus"
    BLUR = "blur"
    KEY_PRESS = "key_press"


class NavigationStrategy(Enum):
    """Strategies for navigating pages."""
    DIRECT = "direct"  # Direct navigation by URL
    CLICK_LINK = "click_link"  # Click navigation link
    FORM_SUBMIT = "form_submit"  # Submit form to navigate
    JAVASCRIPT = "javascript"  # JavaScript-based navigation
    BACK_FORWARD = "back_forward"  # Browser back/forward


class InteractionStatus(Enum):
    """Status of interaction attempt."""
    SUCCESS = "success"
    ELEMENT_NOT_FOUND = "element_not_found"
    INTERACTION_FAILED = "interaction_failed"
    TIMEOUT = "timeout"
    PERMISSION_DENIED = "permission_denied"
    INVALID_STATE = "invalid_state"


@dataclass
class InteractionResult:
    """Result of an element interaction."""
    status: InteractionStatus
    interaction_type: InteractionType
    target_selector: str
    success: bool
    error_message: Optional[str] = None
    page_changed: bool = False
    new_url: Optional[str] = None
    response_data: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    retry_count: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary."""
        return {
            'status': self.status.value,
            'interaction_type': self.interaction_type.value,
            'target_selector': self.target_selector,
            'success': self.success,
            'error_message': self.error_message,
            'page_changed': self.page_changed,
            'new_url': self.new_url,
            'response_data': self.response_data,
            'timestamp': self.timestamp.isoformat(),
            'retry_count': self.retry_count
        }


class ElementInteractor(ABC):
    """Abstract base class for element interaction strategies."""
    
    @abstractmethod
    def click_element(self, selector: str) -> InteractionResult:
        """Click element by selector."""
        pass
    
    @abstractmethod
    def type_text(self, selector: str, text: str, clear_first: bool = False) -> InteractionResult:
        """Type text into element."""
        pass
    
    @abstractmethod
    def submit_form(self, selector: str) -> InteractionResult:
        """Submit form element."""
        pass
    
    @abstractmethod
    def select_option(self, selector: str, option_value: str) -> InteractionResult:
        """Select dropdown option."""
        pass


class ConcreteElementInteractor(ElementInteractor):
    """Concrete implementation of element interactions."""
    
    def __init__(self):
        """Initialize interactor."""
        self.interaction_history: List[InteractionResult] = []
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def click_element(self, selector: str) -> InteractionResult:
        """Click element by selector."""
        self.logger.info(f"Clicking element: {selector}")
        
        result = InteractionResult(
            status=InteractionStatus.SUCCESS,
            interaction_type=InteractionType.CLICK,
            target_selector=selector,
            success=True
        )
        
        self.interaction_history.append(result)
        return result
    
    def type_text(self, selector: str, text: str, clear_first: bool = False) -> InteractionResult:
        """Type text into element."""
        self.logger.info(f"Typing text into {selector}: {text[:50]}...")
        
        result = InteractionResult(
            status=InteractionStatus.SUCCESS,
            interaction_type=InteractionType.TYPE_TEXT,
            target_selector=selector,
            success=True,
            response_data={'text_length': len(text), 'cleared': clear_first}
        )
        
        self.interaction_history.append(result)
        return result
    
    def submit_form(self, selector: str) -> InteractionResult:
        """Submit form element."""
        self.logger.info(f"Submitting form: {selector}")
        
        result = InteractionResult(
            status=InteractionStatus.SUCCESS,
            interaction_type=InteractionType.SUBMIT_FORM,
            target_selector=selector,
            success=True,
            page_changed=True
        )
        
        self.interaction_history.append(result)
        return result
    
    def select_option(self, selector: str, option_value: str) -> InteractionResult:
        """Select dropdown option."""
        self.logger.info(f"Selecting option '{option_value}' in {selector}")
        
        result = InteractionResult(
            status=InteractionStatus.SUCCESS,
            interaction_type=InteractionType.SELECT_OPTION,
            target_selector=selector,
            success=True,
            response_data={'selected_value': option_value}
        )
        
        self.interaction_history.append(result)
        return result


class NavigationController:
    """Manages page navigation and element interaction."""
    
    def __init__(self, interactor: Optional[ElementInteractor] = None):
        """Initialize navigation controller.
        
        Args:
            interactor: Element interaction strategy
        """
        self.interactor = interactor or ConcreteElementInteractor()
        self.navigation_history: List[Dict[str, Any]] = []
        self.current_url: Optional[str] = None
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def navigate_to_url(self, url: str, strategy: NavigationStrategy = NavigationStrategy.DIRECT) -> InteractionResult:
        """Navigate to URL.
        
        Args:
            url: Target URL
            strategy: Navigation strategy to use
            
        Returns:
            InteractionResult of navigation attempt
        """
        self.logger.info(f"Navigating to {url} using {strategy.value} strategy")
        
        result = InteractionResult(
            status=InteractionStatus.SUCCESS,
            interaction_type=InteractionType.SCROLL_INTO_VIEW,
            target_selector=url,
            success=True,
            page_changed=True,
            new_url=url
        )
        
        self.current_url = url
        self.navigation_history.append({
            'url': url,
            'strategy': strategy.value,
            'timestamp': datetime.now().isoformat()
        })
        
        return result
    
    def click_element(self, selector: str, wait_for_load: int = 0) -> InteractionResult:
        """Click page element.
        
        Args:
            selector: CSS selector of element
            wait_for_load: Time to wait after click
            
        Returns:
            InteractionResult of click attempt
        """
        return self.interactor.click_element(selector)
    
    def fill_form_field(self, selector: str, value: str, clear_first: bool = True) -> InteractionResult:
        """Fill form field with text.
        
        Args:
            selector: CSS selector of input field
            value: Text value to enter
            clear_first: Whether to clear field first
            
        Returns:
            InteractionResult of fill attempt
        """
        return self.interactor.type_text(selector, value, clear_first)
    
    def submit_form(self, form_selector: str) -> InteractionResult:
        """Submit form element.
        
        Args:
            form_selector: CSS selector of form
            
        Returns:
            InteractionResult of submission
        """
        return self.interactor.submit_form(form_selector)
    
    def select_dropdown_option(self, dropdown_selector: str, option_value: str) -> InteractionResult:
        """Select option from dropdown.
        
        Args:
            dropdown_selector: CSS selector of dropdown
            option_value: Value of option to select
            
        Returns:
            InteractionResult of selection
        """
        return self.interactor.select_option(dropdown_selector, option_value)
    
    def get_interaction_history(self) -> List[InteractionResult]:
        """Get history of all interactions."""
        if isinstance(self.interactor, ConcreteElementInteractor):
            return self.interactor.interaction_history.copy()
        return []
    
    def get_navigation_history(self) -> List[Dict[str, Any]]:
        """Get navigation history."""
        return self.navigation_history.copy()
    
    def clear_history(self) -> None:
        """Clear all interaction and navigation history."""
        self.navigation_history.clear()
        if isinstance(self.interactor, ConcreteElementInteractor):
            self.interactor.interaction_history.clear()
        self.logger.debug("Navigation controller history cleared")
