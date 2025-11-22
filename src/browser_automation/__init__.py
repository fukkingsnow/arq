"""Phase 10: Browser Automation & Web Navigation

Пакет для автоматизации браузера с интеграцией LLM.
Provides intelligent web automation with natural language control.

Module structure:
- browser_manager: Abstract browser interface
- page_analyzer: DOM parsing and element detection
- navigation_controller: Element interaction and navigation
- context_preservation: State and history tracking
- action_planner: NL to action conversion
- response_interpreter: Page analysis and feedback
- automation_orchestrator: Workflow coordination
- workflow_manager: Task sequencing
"""

__version__ = "1.0.0"
__author__ = "ARQ Development Team"

from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

VERSION = __version__

__all__ = [
    "BrowserManager",
    "PageAnalyzer",
    "NavigationController",
    "ContextPreservation",
    "ActionPlanner",
    "ResponseInterpreter",
    "AutomationOrchestrator",
    "WorkflowManager",
]
