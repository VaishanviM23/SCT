# SCT Chatbot Microservice

> **AI-Powered Conversational Security Assistant for Security Control Tower**

[![Python Version](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/license-Internal-lightgrey.svg)](LICENSE)
[![Code Coverage](https://img.shields.io/badge/coverage-85%25-green.svg)](tests/)

## 📋 Overview

The SCT Chatbot Microservice is an independent conversational AI service designed to provide advanced natural language interaction capabilities for security analysis. It extends the Security Control Tower (SCT) platform by enabling multi-channel communication, conversation context management, and sophisticated intent recognition for security operations.

### Key Features

- 🤖 **Natural Language Understanding**: Process security queries in plain English
- 💬 **Multi-Turn Conversations**: Maintain context across multiple interactions
- 🔄 **Real-Time Communication**: Support for both REST and WebSocket APIs
- 🎯 **Intent Recognition**: Intelligent classification of user queries and actions
- 📊 **Data Integration**: Seamless access to Microsoft Sentinel security data
- 🔐 **Secure by Design**: Azure AD authentication and role-based access control
- 📡 **Multi-Channel Support**: Web, Microsoft Teams, Slack integration-ready
- 📈 **Scalable Architecture**: Containerized deployment with auto-scaling capabilities

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Chatbot Microservice                          │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   Conversation   │  │  Intent & Entity │  │   Channel    │ │
│  │    Manager       │  │    Recognition   │  │   Adapters   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   Context Store  │  │  Response        │  │   Session    │ │
│  │   (Redis)        │  │  Generator       │  │   Manager    │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Azure OpenAI   │ │  Log Analytics  │ │  Microsoft      │
│    Service      │ │   /Sentinel     │ │   Sentinel      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11 or higher
- Azure subscription with:
  - Azure AD tenant
  - Azure OpenAI Service
  - Microsoft Sentinel workspace
  - Redis Cache (or Cosmos DB for context storage)
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/VaishanviM23/sct-chatbot-service.git
cd sct-chatbot-service
```

2. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your Azure credentials and configuration
```

5. **Run the application**:
```bash
uvicorn app.main:app --reload --port 8000
```

6. **Access API documentation**:
Open your browser to `http://localhost:8000/docs` for interactive API documentation.

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Microsoft Sentinel Configuration
AZURE_WORKSPACE_ID=your-workspace-id
AZURE_LOG_ANALYTICS_ENDPOINT=https://api.loganalytics.io/v1

# Redis Configuration (for context storage)
REDIS_HOST=your-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your-redis-password
REDIS_SSL=true
REDIS_DB=0

# Cosmos DB Configuration (alternative to Redis)
COSMOS_DB_ENDPOINT=https://your-cosmos.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmos-key
COSMOS_DB_DATABASE=chatbot
COSMOS_DB_CONTAINER=conversations

# Application Configuration
APP_NAME=sct-chatbot-service
APP_VERSION=1.0.0
LOG_LEVEL=INFO
ENVIRONMENT=development
API_V1_PREFIX=/api/v1
CORS_ORIGINS=["http://localhost:4200"]

# Security Configuration
JWT_ALGORITHM=RS256
JWT_AUDIENCE=api://chatbot-service
JWT_ISSUER=https://login.microsoftonline.com/{tenant-id}/v2.0

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Conversation Settings
CONVERSATION_TIMEOUT_MINUTES=60
MAX_CONVERSATION_HISTORY=100
MAX_MESSAGE_LENGTH=2000
```

### Azure Key Vault Integration

For production deployments, secrets should be stored in Azure Key Vault:

```python
# Example: Load secrets from Azure Key Vault
from azure.keyvault.secrets import SecretClient
from azure.identity import DefaultAzureCredential

credential = DefaultAzureCredential()
client = SecretClient(vault_url="https://your-keyvault.vault.azure.net/", credential=credential)

AZURE_OPENAI_API_KEY = client.get_secret("openai-api-key").value
REDIS_PASSWORD = client.get_secret("redis-password").value
```

---

## 📚 API Documentation

### Base URL

- **Development**: `http://localhost:8000/api/v1`
- **Staging**: `https://chatbot-staging.sct.azure.com/api/v1`
- **Production**: `https://chatbot.sct.azure.com/api/v1`

### Authentication

All API requests require a valid JWT token:

```bash
curl -X POST "http://localhost:8000/api/v1/chat/message" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me all high-severity incidents",
    "userId": "user@example.com"
  }'
```

### Core Endpoints

#### 1. Send Message
```
POST /api/v1/chat/message
```

Send a chat message and receive an AI-generated response.

**Request Body**:
```json
{
  "message": "Show me all high-severity incidents from the last 24 hours",
  "conversationId": "optional-conversation-id",
  "userId": "user@example.com",
  "context": {
    "currentView": "dashboard"
  }
}
```

**Response**:
```json
{
  "conversationId": "conv-123-456-789",
  "messageId": "msg-987-654-321",
  "response": {
    "text": "I found 15 high-severity incidents...",
    "type": "text_with_data"
  },
  "data": {
    "incidents": [...]
  },
  "suggestions": [
    "Show details for incident INC-001"
  ],
  "timestamp": "2024-12-09T12:45:00Z"
}
```

#### 2. Get Conversation History
```
GET /api/v1/chat/conversations/{userId}?limit=10&offset=0
```

#### 3. Clear Conversation
```
POST /api/v1/chat/conversations/{conversationId}/clear
```

#### 4. Health Check
```
GET /api/v1/health
```

For complete API documentation, visit `/docs` (Swagger UI) or `/redoc` (ReDoc) when the service is running.

---

## 🐳 Docker Deployment

### Build Docker Image

```bash
docker build -t sct-chatbot-service:latest -f docker/Dockerfile .
```

### Run Container Locally

```bash
docker run -d \
  --name sct-chatbot \
  -p 8000:8000 \
  --env-file .env \
  sct-chatbot-service:latest
```

### Docker Compose (with Redis)

```bash
docker-compose -f docker/docker-compose.yml up -d
```

---

## ☸️ Kubernetes Deployment

### Deploy to Azure Kubernetes Service (AKS)

1. **Create Kubernetes secrets**:
```bash
kubectl create secret generic chatbot-secrets \
  --from-literal=azure-client-secret=YOUR_SECRET \
  --from-literal=redis-password=YOUR_REDIS_PASSWORD \
  --from-literal=openai-api-key=YOUR_OPENAI_KEY
```

2. **Deploy application**:
```bash
kubectl apply -f infrastructure/kubernetes/deployment.yaml
kubectl apply -f infrastructure/kubernetes/service.yaml
kubectl apply -f infrastructure/kubernetes/ingress.yaml
```

3. **Verify deployment**:
```bash
kubectl get pods
kubectl logs -f deployment/sct-chatbot
```

---

## 🧪 Testing

### Run Unit Tests

```bash
pytest tests/unit -v --cov=app --cov-report=html
```

### Run Integration Tests

```bash
pytest tests/integration -v
```

### Run End-to-End Tests

```bash
pytest tests/e2e -v
```

### Run All Tests with Coverage

```bash
pytest tests/ -v --cov=app --cov-report=term-missing --cov-report=html
```

View coverage report: `open htmlcov/index.html`

---

## 🔄 CI/CD Pipeline

The service uses GitHub Actions for continuous integration and deployment:

### Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push and pull request
   - Executes linting, type checking, and tests
   - Generates code coverage reports

2. **CD to Staging** (`.github/workflows/cd-staging.yml`)
   - Deploys to staging environment on merge to `develop` branch
   - Runs smoke tests after deployment

3. **CD to Production** (`.github/workflows/cd-production.yml`)
   - Deploys to production on merge to `main` branch
   - Requires manual approval
   - Runs comprehensive smoke tests

### Deployment Commands

```bash
# Deploy to staging
git push origin develop

# Deploy to production (after PR approval)
git checkout main
git merge develop
git push origin main
```

---

## 📊 Monitoring & Observability

### Application Insights

The service automatically sends telemetry to Azure Application Insights:

- Request traces
- Dependency calls (OpenAI, Sentinel, Redis)
- Custom events and metrics
- Exception tracking

### Health Checks

**Liveness Probe**: `/api/v1/health`
**Readiness Probe**: `/api/v1/health/ready`

### Metrics

Key metrics exported to Azure Monitor:

- `chatbot_requests_total` - Total number of requests
- `chatbot_request_duration_seconds` - Request latency
- `chatbot_active_conversations` - Number of active conversations
- `chatbot_openai_calls_total` - Azure OpenAI API calls
- `chatbot_sentinel_queries_total` - Sentinel query count
- `chatbot_errors_total` - Error count by type

### Logging

Structured JSON logging to stdout (captured by Azure Monitor):

```json
{
  "timestamp": "2024-12-09T12:45:00Z",
  "level": "INFO",
  "service": "chatbot-service",
  "traceId": "trace-123-456",
  "userId": "user@example.com",
  "event": "message_processed",
  "duration_ms": 1250
}
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** with clear commit messages
4. **Write tests** for new functionality
5. **Ensure all tests pass**: `pytest tests/`
6. **Lint your code**: `black . && isort . && mypy app/`
7. **Submit a pull request**

### Code Style

- Follow [PEP 8](https://peps.python.org/pep-0008/) style guide
- Use [Black](https://black.readthedocs.io/) for code formatting
- Use [isort](https://pycqa.github.io/isort/) for import sorting
- Use [mypy](https://mypy.readthedocs.io/) for type checking
- Maintain test coverage above 80%

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for Microsoft Teams channel
fix: resolve conversation context timeout issue
docs: update API documentation with examples
test: add integration tests for sentinel service
refactor: improve intent recognition accuracy
```

---

## 🔒 Security

### Reporting Security Issues

Please report security vulnerabilities to `security@sct.azure.com`. Do not create public GitHub issues for security vulnerabilities.

### Security Best Practices

- ✅ All secrets stored in Azure Key Vault
- ✅ JWT token validation on all protected endpoints
- ✅ TLS 1.3 for all external communication
- ✅ Rate limiting to prevent abuse
- ✅ Input validation and sanitization
- ✅ CORS configuration for allowed origins only
- ✅ Regular dependency updates and vulnerability scanning
- ✅ Principle of least privilege for Azure service principals

---

## 📖 Additional Resources

### Documentation

- [Integration Guide](../../Chatbot-Integration.md) - How to integrate with SCT
- [API Specification](docs/API.md) - Detailed API documentation
- [Architecture Decision Records](../../adr/ADR-004-Chatbot-Microservice.md) - Why we built this service
- [Setup Guide](docs/SETUP.md) - Detailed setup instructions
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Common issues and solutions

### External Resources

- [FastAPI Documentation](https://fastapi.tiangulo.com/)
- [Azure OpenAI Service](https://learn.microsoft.com/azure/cognitive-services/openai/)
- [Microsoft Sentinel KQL Reference](https://learn.microsoft.com/azure/data-explorer/kusto/query/)
- [Azure AD Authentication](https://learn.microsoft.com/azure/active-directory/develop/)

---

## 📝 License

This project is proprietary and confidential. Internal use only.

Copyright © 2024 SCT Development Team. All rights reserved.

---

## 👥 Team & Support

### Maintainers

- **SCT Development Team** - Primary development and maintenance
- **Security Operations Team** - Security requirements and feedback

### Support Channels

- **Technical Issues**: Create a GitHub issue
- **Security Concerns**: Email `security@sct.azure.com`
- **General Questions**: SCT development channel on Teams

---

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ Basic conversational AI capabilities
- ✅ REST and WebSocket APIs
- ✅ Azure AD authentication
- ✅ Microsoft Sentinel integration
- ✅ Conversation context management

### Planned Features (v1.1)
- 🔄 Microsoft Teams channel adapter
- 🔄 Slack channel adapter
- 🔄 Advanced intent recognition with custom models
- 🔄 Multi-language support
- 🔄 Voice interaction capabilities

### Future Enhancements (v2.0)
- 📋 Proactive alerts and recommendations
- 📋 Custom skill plugins
- 📋 Advanced analytics and reporting
- 📋 Integration with ITSM tools (ServiceNow, Jira)
- 📋 Fine-tuned security domain models

---

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [Azure OpenAI](https://azure.microsoft.com/products/cognitive-services/openai-service) - AI capabilities
- [Microsoft Sentinel](https://azure.microsoft.com/products/microsoft-sentinel) - Security data
- [Redis](https://redis.io/) - Context storage
- [Pydantic](https://pydantic-docs.helpmanual.io/) - Data validation

Special thanks to the SCT community and contributors!

---

**Last Updated**: 2024-12-09  
**Version**: 1.0.0  
**Status**: 🚀 Ready for Development
