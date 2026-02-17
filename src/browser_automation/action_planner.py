"""Action Planner Module (Phase 10, Tier 2 - LLM Integration)

Converts natural language instructions from the LLM into browser automation actions.
Provides action planning, validation, and execution strategies.

Архитектура:
- ActionType: Enumeration of supported browser actions
- Action: Data class representing a single action with parameters
- ActionPlan: Container for sequences of actions
- ActionPlanner: NL to action conversion with LLM integration
- ActionValidator: Validates action feasibility on current page
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, List, Dict, Any, Callable
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)


class ActionType(Enum):
    """Enumeration of supported browser automation actions."""
    CLICK = "click"
    TYPE = "type"
    SCROLL = "scroll"
    WAIT = "wait"
    NAVIGATE = "navigate"
    SUBMIT_FORM = "submit_form"
    SELECT_DROPDOWN = "select_dropdown"
    EXTRACT_DATA = "extract_data"
    HOVER = "hover"
    RIGHT_CLICK = "right_click"
    DOUBLE_CLICK = "double_click"
    KEY_PRESS = "key_press"
    SCREENSHOT = "screenshot"
    SWITCH_WINDOW = "switch_window"
    CLOSE_WINDOW = "close_window"


class Priority(Enum):
    """Action priority levels."""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4


class ExecutionStrategy(Enum):
    """Strategy for executing action sequences."""
    SEQUENTIAL = "sequential"  # Execute one after another
    PARALLEL = "parallel"  # Execute simultaneously where possible
    CONDITIONAL = "conditional"  # Execute based on previous results
    RETRY = "retry"  # Retry on failure with backoff


@dataclass
class Action:
    """Represents a single browser automation action."""
    action_type: ActionType
    target: Optional[str] = None  # Element selector or URL
    value: Optional[str] = None  # Input text or action parameter
    wait_time: int = 0  # Wait time in seconds before action
    retry_count: int = 1  # Number of retry attempts
    priority: Priority = Priority.NORMAL
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    
    def __post_init__(self):
        """Validate action configuration."""
        if self.retry_count < 1:
            self.retry_count = 1
        if self.wait_time < 0:
            self.wait_time = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert action to dictionary."""
        return {
            'action_type': self.action_type.value,
            'target': self.target,
            'value': self.value,
            'wait_time': self.wait_time,
            'retry_count': self.retry_count,
            'priority': self.priority.name,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat()
        }


@dataclass
class ActionPlan:
    """Container for a sequence of actions with execution metadata."""
    actions: List[Action] = field(default_factory=list)
    description: str = ""
    strategy: ExecutionStrategy = ExecutionStrategy.SEQUENTIAL
    timeout: int = 300  # Total execution timeout in seconds
    max_retries: int = 3  # Max retries for entire plan
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    def add_action(self, action: Action) -> None:
        """Add action to plan."""
        self.actions.append(action)
        self.updated_at = datetime.now()
    
    def get_actions_by_priority(self) -> List[Action]:
        """Get actions sorted by priority (highest first)."""
        return sorted(self.actions, key=lambda a: a.priority.value, reverse=True)
    
    def get_total_wait_time(self) -> int:
        """Calculate total wait time across all actions."""
        return sum(action.wait_time for action in self.actions)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert plan to dictionary."""
        return {
            'actions': [a.to_dict() for a in self.actions],
            'description': self.description,
            'strategy': self.strategy.value,
            'timeout': self.timeout,
            'max_retries': self.max_retries,
            'total_actions': len(self.actions),
            'total_wait_time': self.get_total_wait_time(),
            'created_at': self.created_at.isoformat()
        }


class ActionValidator(ABC):
    """Abstract base class for validating actions on current page state."""
    
    @abstractmethod
    def validate_action(self, action: Action, page_state: Dict[str, Any]) -> tuple[bool, str]:
        """Validate if action can be executed on current page.
        
        Args:
            action: Action to validate
            page_state: Current page state from PageAnalyzer
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        pass
    
    @abstractmethod
    def validate_plan(self, plan: ActionPlan, page_state: Dict[str, Any]) -> tuple[bool, str]:
        """Validate entire action plan feasibility.
        
        Args:
            plan: Action plan to validate
            page_state: Current page state
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        pass


class ConcreteActionValidator(ActionValidator):
    """Concrete implementation of ActionValidator."""
    
    def __init__(self):
        """Initialize validator."""
        self.validation_rules = self._create_validation_rules()
    
    def _create_validation_rules(self) -> Dict[ActionType, Callable]:
        """Create validation rules for each action type."""
        return {
            ActionType.CLICK: self._validate_click,
            ActionType.TYPE: self._validate_type,
            ActionType.SCROLL: self._validate_scroll,
            ActionType.NAVIGATE: self._validate_navigate,
            ActionType.SUBMIT_FORM: self._validate_submit_form,
        }
    
    def validate_action(self, action: Action, page_state: Dict[str, Any]) -> tuple[bool, str]:
        """Validate action against page state."""
        if action.action_type in self.validation_rules:
            validator = self.validation_rules[action.action_type]
            return validator(action, page_state)
        
        # Generic validation for unknown types
        if action.target is None and action.action_type not in [ActionType.SCREENSHOT, ActionType.WAIT]:
            return False, f"Action {action.action_type.value} requires a target"
        
        return True, ""
    
    def validate_plan(self, plan: ActionPlan, page_state: Dict[str, Any]) -> tuple[bool, str]:
        """Validate entire action plan."""
        if not plan.actions:
            return False, "Action plan contains no actions"
        
        if plan.timeout <= 0:
            return False, "Action plan timeout must be positive"
        
        for idx, action in enumerate(plan.actions):
            is_valid, error = self.validate_action(action, page_state)
            if not is_valid:
                return False, f"Action {idx} validation failed: {error}"
        
        return True, ""
    
    @staticmethod
    def _validate_click(action: Action, page_state: Dict[str, Any]) -> tuple[bool, str]:
        """Validate click action."""
        if not action.target:
            return False, "Click action requires a target element selector"
        return True, ""
    
    @staticmethod
    def _validate_type(action: Action, page_state: Dict[str, Any]) -> tuple[bool, str]:
        """Validate type action."""
        if not action.target:
            return False, "Type action requires a target element"
        if not action.value:
            return False, "Type action requires text value"
        return True, ""
    
    @staticmethod
    def _validate_scroll(action: Action, page_state: Dict[str, Any]) -> tuple[bool, str]:
        """Validate scroll action."""
        if action.value not in ["up", "down", "top", "bottom"]:
            return False, "Scroll action requires direction: up, down, top, or bottom"
        return True, ""
    
    @staticmethod
    def _validate_navigate(action: Action, page_state: Dict[str, Any]) -> tuple[bool, str]:
        """Validate navigate action."""
        if not action.value:
            return False, "Navigate action requires URL"
        return True, ""
    
    @staticmethod
    def _validate_submit_form(action: Action, page_state: Dict[str, Any]) -> tuple[bool, str]:
        """Validate submit form action."""
        if not action.target:
            return False, "Submit form action requires form selector"
        return True, ""


class ActionPlanner:
    """Converts natural language to action plans with LLM integration."""
    
    def __init__(self, llm_client=None, validator: Optional[ActionValidator] = None):
        """Initialize action planner.
        
        Args:
            llm_client: LLM client for NL processing (from Phase 9)
            validator: Action validator instance
        """
        self.llm_client = llm_client
        self.validator = validator or ConcreteActionValidator()
        self.action_history: List[ActionPlan] = []
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def plan_from_nl(self, instruction: str, page_context: Dict[str, Any]) -> ActionPlan:
        """Convert natural language instruction to action plan.
        
        Args:
            instruction: Natural language instruction from user/LLM
            page_context: Current page state and elements
            
        Returns:
            ActionPlan with sequenced actions
        """
        self.logger.info(f"Planning actions for: {instruction[:100]}...")
        
        plan = ActionPlan(description=instruction)
        
        if self.llm_client:
            # Use LLM to parse instruction and generate actions
            llm_response = self.llm_client.analyze_instruction(
                instruction, 
                page_context
            )
            actions = self._parse_llm_response(llm_response)
        else:
            # Fallback: simple rule-based parsing
            actions = self._parse_instruction_rules(instruction)
        
        for action in actions:
            plan.add_action(action)
        
        # Validate plan
        is_valid, error = self.validator.validate_plan(plan, page_context)
        if not is_valid:
            self.logger.warning(f"Plan validation failed: {error}")
        
        self.action_history.append(plan)
        return plan
    
    def _parse_llm_response(self, response: Dict[str, Any]) -> List[Action]:
        """Parse LLM response into action list."""
        actions = []
        
        for item in response.get('actions', []):
            try:
                action = Action(
                    action_type=ActionType[item.get('type', 'CLICK').upper()],
                    target=item.get('target'),
                    value=item.get('value'),
                    wait_time=item.get('wait_time', 0),
                    retry_count=item.get('retry_count', 1),
                    priority=Priority[item.get('priority', 'NORMAL').upper()],
                    metadata=item.get('metadata', {})
                )
                actions.append(action)
            except (KeyError, ValueError) as e:
                self.logger.error(f"Failed to parse action item: {e}")
        
        return actions
    
    def _parse_instruction_rules(self, instruction: str) -> List[Action]:
        """Simple rule-based instruction parsing."""
        actions = []
        instruction_lower = instruction.lower()
        
        # Example rules - in production, use more sophisticated parsing
        if "click" in instruction_lower or "press" in instruction_lower:
            actions.append(Action(ActionType.CLICK, target="#default-target"))
        elif "type" in instruction_lower or "enter" in instruction_lower:
            actions.append(Action(ActionType.TYPE, target="input", value=""))
        elif "scroll" in instruction_lower:
            actions.append(Action(ActionType.SCROLL, value="down"))
        elif "navigate" in instruction_lower or "go to" in instruction_lower:
            actions.append(Action(ActionType.NAVIGATE, value="https://"))
        else:
            # Default action
            actions.append(Action(ActionType.SCREENSHOT))
        
        return actions
    
    def get_action_history(self) -> List[ActionPlan]:
        """Get history of all action plans created."""
        return self.action_history.copy()
    
    def clear_history(self) -> None:
        """Clear action history."""
        self.action_history.clear()
        self.logger.debug("Action history cleared")
