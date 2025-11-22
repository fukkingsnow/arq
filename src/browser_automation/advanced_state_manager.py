"""advanced_state_manager.py - Phase 11: Advanced workflow state management.

Provides state machine implementation, state tracking, transitions, and validation
for complex workflow automation processes with comprehensive audit trails.
"""

from typing import Dict, Optional, Any, Callable, List, Set, Tuple
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
import logging
import uuid
from collections import defaultdict


class StateType(Enum):
    """Classification of workflow states."""
    INITIAL = "initial"
    INTERMEDIATE = "intermediate"
    TERMINAL = "terminal"
    ERROR = "error"
    WAIT = "wait"


class TransitionType(Enum):
    """Type of state transition."""
    NORMAL = "normal"
    CONDITIONAL = "conditional"
    FALLBACK = "fallback"
    TIMEOUT = "timeout"


@dataclass
class StateTransition:
    """Represents a state machine transition."""
    transition_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    from_state: str = ""
    to_state: str = ""
    transition_type: TransitionType = TransitionType.NORMAL
    condition: Optional[Callable[[Any], bool]] = None
    action: Optional[Callable[[], None]] = None
    guard_clauses: List[Callable[[Any], bool]] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class StateSnapshot:
    """Point-in-time snapshot of state."""
    snapshot_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    state: str = ""
    timestamp: datetime = field(default_factory=datetime.now)
    context: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AuditEntry:
    """Audit trail entry for state changes."""
    entry_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.now)
    from_state: str = ""
    to_state: str = ""
    trigger: str = ""
    user: str = "system"
    success: bool = True
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class StateMachine:
    """Implements a finite state machine for workflow control."""
    
    def __init__(self, initial_state: str, logger: Optional[logging.Logger] = None):
        self.logger = logger or logging.getLogger(__name__)
        self.current_state = initial_state
        self.states: Dict[str, StateType] = {}
        self.transitions: Dict[str, List[StateTransition]] = defaultdict(list)
        self.callbacks: Dict[str, List[Callable]] = defaultdict(list)
        self.state_entry_handlers: Dict[str, Callable] = {}
        self.state_exit_handlers: Dict[str, Callable] = {}
        self.audit_trail: List[AuditEntry] = []
    
    def define_state(self, state: str, state_type: StateType) -> None:
        """Define a state in the state machine."""
        self.states[state] = state_type
        self.logger.debug(f"State defined: {state} ({state_type.value})")
    
    def add_transition(self, transition: StateTransition) -> None:
        """Add transition to state machine."""
        if transition.from_state not in self.states or transition.to_state not in self.states:
            self.logger.error(f"Invalid transition states")
            return
        self.transitions[transition.from_state].append(transition)
    
    def can_transition(self, from_state: str, to_state: str, context: Optional[Any] = None) -> bool:
        """Check if transition is valid."""
        for trans in self.transitions.get(from_state, []):
            if trans.to_state == to_state:
                if trans.condition and context:
                    return trans.condition(context)
                return True
        return False
    
    def transition(self, trigger: str, context: Optional[Any] = None, user: str = "system") -> bool:
        """Perform state transition.
        
        Returns:
            True if transition successful, False otherwise
        """
        next_state = None
        transition_obj = None
        
        for trans in self.transitions.get(self.current_state, []):
            if trans.condition is None or (context and trans.condition(context)):
                if all(guard(context) for guard in trans.guard_clauses):
                    next_state = trans.to_state
                    transition_obj = trans
                    break
        
        if next_state is None:
            entry = AuditEntry(
                from_state=self.current_state,
                to_state="",
                trigger=trigger,
                user=user,
                success=False,
                error_message="No valid transition found"
            )
            self.audit_trail.append(entry)
            self.logger.warning(f"No valid transition from {self.current_state}")
            return False
        
        # Call exit handler for current state
        if self.current_state in self.state_exit_handlers:
            self.state_exit_handlers[self.current_state]()
        
        # Execute transition action
        if transition_obj and transition_obj.action:
            transition_obj.action()
        
        old_state = self.current_state
        self.current_state = next_state
        
        # Call entry handler for new state
        if next_state in self.state_entry_handlers:
            self.state_entry_handlers[next_state]()
        
        # Record audit entry
        entry = AuditEntry(
            from_state=old_state,
            to_state=next_state,
            trigger=trigger,
            user=user,
            success=True
        )
        self.audit_trail.append(entry)
        
        # Trigger callbacks
        for callback in self.callbacks[f"{old_state}_to_{next_state}"]:
            callback(old_state, next_state, context)
        
        self.logger.debug(f"Transitioned {old_state} -> {next_state} (trigger: {trigger})")
        return True
    
    def register_entry_handler(self, state: str, handler: Callable) -> None:
        """Register handler for state entry."""
        self.state_entry_handlers[state] = handler
    
    def register_exit_handler(self, state: str, handler: Callable) -> None:
        """Register handler for state exit."""
        self.state_exit_handlers[state] = handler


class StateTracker:
    """Tracks and manages workflow state history."""
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        self.logger = logger or logging.getLogger(__name__)
        self.current_state = ""
        self.state_history: List[StateSnapshot] = []
        self.state_transitions_count = 0
        self.state_durations: Dict[str, float] = defaultdict(float)
        self.last_state_change: Optional[datetime] = None
    
    def record_state(self, state: str, context: Optional[Dict[str, Any]] = None) -> StateSnapshot:
        """Record state change."""
        snapshot = StateSnapshot(state=state, context=context or {})
        self.state_history.append(snapshot)
        
        if self.last_state_change:
            duration = (datetime.now() - self.last_state_change).total_seconds()
            self.state_durations[self.current_state] += duration
        
        self.current_state = state
        self.last_state_change = datetime.now()
        self.state_transitions_count += 1
        
        return snapshot
    
    def get_state_duration(self, state: str) -> float:
        """Get total time spent in state."""
        return self.state_durations.get(state, 0.0)
    
    def get_history(self, limit: Optional[int] = None) -> List[StateSnapshot]:
        """Get state history."""
        if limit:
            return self.state_history[-limit:]
        return self.state_history


class StateValidator:
    """Validates state transitions and configurations."""
    
    def __init__(self, logger: Optional[logging.Logger] = None):
        self.logger = logger or logging.getLogger(__name__)
        self.rules: List[Callable[[str, str], bool]] = []
    
    def add_validation_rule(self, rule: Callable[[str, str], bool]) -> None:
        """Add validation rule."""
        self.rules.append(rule)
    
    def validate_transition(self, from_state: str, to_state: str) -> Tuple[bool, Optional[str]]:
        """Validate state transition.
        
        Returns:
            Tuple of (valid: bool, error_message: Optional[str])
        """
        for rule in self.rules:
            if not rule(from_state, to_state):
                error = f"Validation failed for {from_state} -> {to_state}"
                self.logger.error(error)
                return False, error
        return True, None


class AdvancedStateManager:
    """Advanced state management system combining machine, tracker, and validator."""
    
    def __init__(self, initial_state: str, logger: Optional[logging.Logger] = None):
        self.logger = logger or logging.getLogger(__name__)
        self.machine = StateMachine(initial_state, logger)
        self.tracker = StateTracker(logger)
        self.validator = StateValidator(logger)
        self.tracker.record_state(initial_state)
    
    def transition_with_validation(self, trigger: str, context: Optional[Any] = None, 
                                  user: str = "system") -> Tuple[bool, Optional[str]]:
        """Transition with validation.
        
        Returns:
            Tuple of (success: bool, error_message: Optional[str])
        """
        next_state = None
        for trans in self.machine.transitions.get(self.machine.current_state, []):
            if trans.condition is None or (context and trans.condition(context)):
                next_state = trans.to_state
                break
        
        if next_state is None:
            return False, "No valid transition found"
        
        valid, error = self.validator.validate_transition(self.machine.current_state, next_state)
        if not valid:
            return False, error
        
        success = self.machine.transition(trigger, context, user)
        if success:
            self.tracker.record_state(next_state, context)
        
        return success, None if success else "Transition failed"
    
    def get_state_report(self) -> Dict[str, Any]:
        """Get comprehensive state report."""
        return {
            "current_state": self.machine.current_state,
            "total_transitions": self.tracker.state_transitions_count,
            "state_durations": dict(self.tracker.state_durations),
            "history_length": len(self.tracker.state_history),
            "audit_entries": len(self.machine.audit_trail)
        }
