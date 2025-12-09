# Contributing to SCT Chatbot Microservice

Thank you for your interest in contributing to the SCT Chatbot Microservice! This document provides guidelines and instructions for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Documentation](#documentation)
7. [Pull Request Process](#pull-request-process)
8. [Issue Guidelines](#issue-guidelines)

---

## Code of Conduct

### Our Standards

- **Be Respectful**: Treat all contributors with respect and professionalism
- **Be Collaborative**: Work together to solve problems and improve the codebase
- **Be Inclusive**: Welcome contributors of all skill levels and backgrounds
- **Be Constructive**: Provide helpful feedback and suggestions

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Trolling, insulting comments, or personal attacks
- Publishing private information without permission
- Any conduct that could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

- Python 3.11 or higher
- Git
- Azure subscription (for testing with real services)
- Docker (optional, for containerized development)

### Setting Up Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**:
```bash
git clone https://github.com/YOUR_USERNAME/sct-chatbot-service.git
cd sct-chatbot-service
```

3. **Add upstream remote**:
```bash
git remote add upstream https://github.com/VaishanviM23/sct-chatbot-service.git
```

4. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

5. **Install dependencies**:
```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Development dependencies
```

6. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

7. **Run tests to verify setup**:
```bash
pytest tests/ -v
```

---

## Development Workflow

### Branch Strategy

We follow the **Git Flow** branching model:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation

### Creating a Feature Branch

```bash
# Update your local develop branch
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Make your changes** in logical, atomic commits
2. **Write tests** for new functionality
3. **Update documentation** as needed
4. **Run tests** to ensure everything works
5. **Lint your code** to ensure it meets standards

```bash
# Run tests
pytest tests/ -v

# Run linters
black app/ tests/
isort app/ tests/
flake8 app/ tests/
mypy app/
```

### Committing Changes

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples**:
```bash
git commit -m "feat(conversation): add context retention for multi-turn dialogues"
git commit -m "fix(auth): resolve JWT token validation issue"
git commit -m "docs(api): update endpoint documentation with examples"
git commit -m "test(intent): add unit tests for intent recognition"
```

### Pushing Changes

```bash
git push origin feature/your-feature-name
```

---

## Coding Standards

### Python Style Guide

We follow [PEP 8](https://peps.python.org/pep-0008/) with some modifications:

- **Line length**: 120 characters (not 79)
- **Quotes**: Use double quotes for strings
- **Imports**: Organized by standard library, third-party, local
- **Type hints**: Use type hints for all function signatures
- **Docstrings**: Use Google-style docstrings

### Code Formatting

We use the following tools:

- **Black**: Code formatter (configured for 120 char line length)
- **isort**: Import sorting
- **flake8**: Style guide enforcement
- **mypy**: Static type checking
- **pylint**: Code quality analysis

**Run all formatters**:
```bash
black app/ tests/
isort app/ tests/
```

### Example Code Style

```python
"""Module for conversation management.

This module provides classes and functions for managing multi-turn
conversations with context retention.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime

from pydantic import BaseModel, Field


class Conversation(BaseModel):
    """Represents a conversation session.
    
    Attributes:
        conversation_id: Unique identifier for the conversation
        user_id: ID of the user in the conversation
        messages: List of messages in the conversation
        created_at: Timestamp when conversation was created
        updated_at: Timestamp of last update
    """
    
    conversation_id: str = Field(..., description="Unique conversation identifier")
    user_id: str = Field(..., description="User identifier")
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def add_message(self, role: str, content: str) -> None:
        """Add a message to the conversation.
        
        Args:
            role: Role of the message sender (user or assistant)
            content: Content of the message
            
        Raises:
            ValueError: If role is not valid
        """
        if role not in ["user", "assistant"]:
            raise ValueError(f"Invalid role: {role}")
        
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
```

---

## Testing Guidelines

### Test Structure

```
tests/
├── unit/               # Unit tests (fast, isolated)
│   ├── test_conversation.py
│   ├── test_intent.py
│   └── test_context.py
├── integration/        # Integration tests (with external dependencies)
│   ├── test_openai_integration.py
│   ├── test_sentinel_integration.py
│   └── test_redis_integration.py
└── e2e/               # End-to-end tests
    ├── test_chat_flow.py
    └── test_websocket_flow.py
```

### Writing Tests

Use `pytest` with the following conventions:

```python
"""Unit tests for conversation manager."""

import pytest
from datetime import datetime
from app.services.conversation_manager import ConversationManager


class TestConversationManager:
    """Test suite for ConversationManager class."""
    
    @pytest.fixture
    def manager(self):
        """Create a ConversationManager instance for testing."""
        return ConversationManager()
    
    def test_create_conversation(self, manager):
        """Test creating a new conversation."""
        conversation = manager.create_conversation(user_id="user123")
        
        assert conversation.user_id == "user123"
        assert len(conversation.messages) == 0
        assert isinstance(conversation.created_at, datetime)
    
    def test_add_message_to_conversation(self, manager):
        """Test adding a message to conversation."""
        conversation = manager.create_conversation(user_id="user123")
        manager.add_message(
            conversation_id=conversation.conversation_id,
            role="user",
            content="Hello"
        )
        
        assert len(conversation.messages) == 1
        assert conversation.messages[0]["role"] == "user"
        assert conversation.messages[0]["content"] == "Hello"
    
    @pytest.mark.asyncio
    async def test_async_operation(self, manager):
        """Test asynchronous operation."""
        result = await manager.async_method()
        assert result is not None
```

### Test Coverage

- Maintain **minimum 80%** code coverage
- All new features must include tests
- All bug fixes must include regression tests

**Run tests with coverage**:
```bash
pytest tests/ -v --cov=app --cov-report=html --cov-report=term-missing
```

View coverage report:
```bash
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

---

## Documentation

### Code Documentation

- **Modules**: Include module-level docstring
- **Classes**: Document purpose, attributes, and examples
- **Functions**: Document parameters, return values, exceptions
- **Complex Logic**: Add inline comments for clarity

### API Documentation

- FastAPI generates automatic documentation
- Add descriptions to endpoint parameters
- Include example requests and responses
- Document error codes and responses

**Example**:
```python
@router.post("/chat/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
) -> ChatResponse:
    """Send a chat message and receive AI-generated response.
    
    This endpoint processes a user's message through the AI pipeline,
    maintains conversation context, and returns a structured response
    with data and suggestions.
    
    Args:
        request: Chat message request containing message text and context
        current_user: Authenticated user from JWT token
    
    Returns:
        ChatResponse with AI-generated text, data, and suggestions
    
    Raises:
        HTTPException: 400 if message is invalid or empty
        HTTPException: 401 if user is not authenticated
        HTTPException: 429 if rate limit is exceeded
        HTTPException: 502 if external service is unavailable
    
    Example:
        ```
        POST /api/v1/chat/message
        {
            "message": "Show high-severity incidents",
            "conversationId": "optional-id"
        }
        ```
    """
    # Implementation
```

### README Updates

Update README.md when:
- Adding new features
- Changing configuration options
- Modifying deployment process
- Adding new dependencies

---

## Pull Request Process

### Before Submitting

1. ✅ **All tests pass**: `pytest tests/ -v`
2. ✅ **Code is formatted**: `black . && isort .`
3. ✅ **Linting passes**: `flake8 app/ tests/`
4. ✅ **Type checking passes**: `mypy app/`
5. ✅ **Documentation is updated**
6. ✅ **CHANGELOG.md is updated** (if applicable)

### Submitting Pull Request

1. **Push your branch** to your fork
2. **Open a Pull Request** against `develop` branch
3. **Fill out the PR template** completely
4. **Link related issues** using keywords (fixes #123)
5. **Request review** from maintainers

### PR Title Format

Follow Conventional Commits:
```
feat(conversation): add support for multi-language conversations
fix(auth): resolve token expiration handling
docs(api): update integration guide with examples
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Fixes #123
Relates to #456

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] Tests added/updated
- [ ] All tests pass locally

## Screenshots (if applicable)
Add screenshots for UI changes

## Additional Notes
Any additional context or notes for reviewers
```

### Review Process

1. **Automated checks** must pass (CI pipeline)
2. **At least one approval** from maintainer required
3. **All comments addressed** before merging
4. **Squash and merge** for clean history

---

## Issue Guidelines

### Creating Issues

Use the appropriate issue template:

- **Bug Report**: For reporting bugs
- **Feature Request**: For suggesting new features
- **Documentation**: For documentation improvements
- **Question**: For asking questions

### Bug Report Template

```markdown
**Describe the bug**
Clear and concise description of the bug.

**To Reproduce**
Steps to reproduce the behavior:
1. Send request to '...'
2. With payload '....'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Python version: [e.g., 3.11.5]
- Service version: [e.g., 1.0.0]

**Logs/Screenshots**
Add relevant logs or screenshots.

**Additional context**
Any other context about the problem.
```

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem.

**Proposed solution**
How you think this should work.

**Alternatives considered**
Other solutions you've considered.

**Additional context**
Any other context, mockups, or examples.
```

---

## Additional Resources

### Useful Commands

```bash
# Run development server
uvicorn app.main:app --reload --port 8000

# Run with Docker
docker-compose -f docker/docker-compose.yml up

# Run specific test file
pytest tests/unit/test_conversation.py -v

# Run tests matching pattern
pytest tests/ -k "test_conversation" -v

# Generate test coverage report
pytest tests/ --cov=app --cov-report=html

# Check security vulnerabilities
bandit -r app/ -ll

# Format code
black app/ tests/
isort app/ tests/

# Type checking
mypy app/
```

### Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pytest Documentation](https://docs.pytest.org/)
- [Azure OpenAI Service](https://learn.microsoft.com/azure/cognitive-services/openai/)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)
- [Git Best Practices](https://git-scm.com/book/en/v2)

---

## Questions?

If you have questions about contributing:

1. Check existing [documentation](docs/)
2. Search [existing issues](https://github.com/VaishanviM23/sct-chatbot-service/issues)
3. Ask in the development channel on Teams
4. Create a new issue with the "question" label

---

**Thank you for contributing to SCT Chatbot Microservice!** 🎉

Your contributions help make security analysis more accessible and powerful for everyone.
