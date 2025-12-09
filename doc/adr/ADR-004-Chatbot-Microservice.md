# ADR-004: Chatbot Microservice Architecture

**Status**: Accepted  
**Date**: 2024-12-09  
**Decision Makers**: SCT Development Team  
**Related Documents**: [ADR-003: Azure OpenAI](./ADR-003-Azure-OpenAI.md), [Chatbot Integration Guide](../Chatbot-Integration.md)

---

## Context

The Security Control Tower (SCT) currently provides AI-powered security analysis through SentriBot, which is tightly integrated into the Angular frontend application. As the system evolves, there is a need to:

1. **Enable Multi-Channel Support**: Allow security teams to interact with the AI assistant through multiple channels (Teams, Slack, web chat, etc.) beyond the current web interface
2. **Improve Scalability**: Separate the conversational AI logic from the frontend to allow independent scaling
3. **Enhance Maintainability**: Isolate chatbot-specific logic, NLP models, and conversation management into a dedicated service
4. **Support Advanced Features**: Enable features like conversation history, context retention, multi-turn dialogues, and personalized responses
5. **Facilitate Integration**: Provide a standardized API for other applications to leverage the security chatbot capabilities

## Decision

We will create a **separate Chatbot microservice** that operates independently from the SCT frontend but integrates seamlessly with the existing system. The microservice will:

- Be deployed as a standalone service with its own repository, CI/CD pipeline, and infrastructure
- Expose RESTful and WebSocket APIs for real-time conversational interactions
- Integrate with the existing Azure OpenAI service for NLP capabilities
- Maintain conversation context and history in a dedicated data store
- Support multiple communication channels through adapters (Web, Teams, Slack)
- Communicate with SCT's backend services (Microsoft Sentinel, Log Analytics) through defined interfaces

### Technology Stack Decision

**Primary Technology**: **Python with FastAPI**

**Rationale**:
- **Rich NLP Ecosystem**: Python offers extensive libraries for natural language processing (transformers, spaCy, NLTK)
- **Azure OpenAI SDK**: Official Azure OpenAI Python SDK provides robust integration capabilities
- **FastAPI Framework**: Modern, high-performance web framework with async support and automatic API documentation
- **WebSocket Support**: Native support for real-time bidirectional communication
- **Microservice Compatibility**: Lightweight, containerizable, and cloud-native friendly
- **Team Expertise**: Aligns with common AI/ML development practices

**Alternative Considered**: Node.js with Express
- Pros: Consistency with Angular frontend (TypeScript), good async handling
- Cons: Less mature NLP ecosystem, fewer pre-built AI/ML libraries
- Decision: Python's superior AI/ML capabilities outweigh language consistency benefits

## Architecture Overview

### Microservice Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCT Frontend (Angular)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Dashboard   │  │  SentriBot   │  │   Overview   │         │
│  │    Views     │  │     UI       │  │     Page     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST/WebSocket API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Chatbot Microservice (Python/FastAPI)               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   Conversation   │  │  Intent & Entity │  │   Channel    │ │
│  │    Manager       │  │    Recognition   │  │   Adapters   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   Context Store  │  │  Response        │  │   Session    │ │
│  │   (Redis/CosmosDB)│  │  Generator       │  │   Manager    │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Azure OpenAI   │ │  Log Analytics  │ │  Microsoft      │
│    Service      │ │   /Sentinel     │ │   Sentinel      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### API Contract

The Chatbot microservice will expose the following primary endpoints:

**RESTful Endpoints**:
- `POST /api/chat/message` - Send a message and receive a response
- `GET /api/chat/conversations/{userId}` - Retrieve conversation history
- `POST /api/chat/conversations/{conversationId}/clear` - Clear conversation context
- `GET /api/health` - Health check endpoint

**WebSocket Endpoints**:
- `WS /ws/chat/{userId}` - Real-time bidirectional communication

### Integration Points with SCT

1. **Authentication**: Chatbot service validates JWT tokens issued by Azure AD (same as SCT)
2. **Authorization**: Uses same role-based access control (RBAC) as SCT
3. **Data Access**: Queries Microsoft Sentinel through shared service principal credentials
4. **Logging**: Publishes logs to same Azure Monitor/Application Insights workspace

## Consequences

### Positive

✅ **Independent Scaling**: Chatbot service can scale independently based on conversation load  
✅ **Multi-Channel Support**: Easy to add Teams, Slack, or other channel integrations  
✅ **Technology Optimization**: Use Python's superior NLP/AI capabilities where they're most beneficial  
✅ **Fault Isolation**: Issues in chatbot service don't affect core SCT functionality  
✅ **Easier Testing**: Conversational logic can be tested in isolation  
✅ **Reusability**: Other applications can leverage the chatbot service  
✅ **Advanced Features**: Easier to implement conversation memory, context awareness, personalization

### Negative

⚠️ **Increased Complexity**: Additional service to deploy, monitor, and maintain  
⚠️ **Network Latency**: Cross-service communication adds latency compared to monolithic approach  
⚠️ **Operational Overhead**: Requires separate CI/CD pipeline, monitoring, and infrastructure  
⚠️ **Multiple Tech Stacks**: Team needs Python expertise in addition to TypeScript/Angular  
⚠️ **Coordination**: Changes affecting both SCT and Chatbot require coordinated deployments

### Mitigation Strategies

- **Complexity**: Use infrastructure-as-code (Terraform/Bicep) and container orchestration (Kubernetes/AKS)
- **Latency**: Implement caching, optimize API calls, use WebSockets for real-time interactions
- **Operations**: Leverage Azure DevOps or GitHub Actions for automated CI/CD
- **Tech Stack**: Provide training and documentation; keep Python services focused and maintainable
- **Coordination**: Use API versioning and backward compatibility; maintain comprehensive integration tests

## Implementation Guidelines

### Phase 1: Foundation (Week 1-2)
- Set up separate GitHub repository for Chatbot microservice
- Implement basic FastAPI service with health check endpoint
- Configure Docker containerization
- Set up CI/CD pipeline with automated testing
- Deploy to Azure Container Instances (ACI) or Azure Kubernetes Service (AKS)

### Phase 2: Core Features (Week 3-4)
- Implement conversation manager with context retention
- Integrate Azure OpenAI SDK for NLP
- Build RESTful API endpoints for chat functionality
- Add authentication/authorization using Azure AD JWT validation
- Implement connection to Microsoft Sentinel for security queries

### Phase 3: Advanced Features (Week 5-6)
- Add WebSocket support for real-time communication
- Implement conversation history storage (Redis or Cosmos DB)
- Build channel adapters (starting with Web)
- Add telemetry and monitoring integration
- Optimize performance and add caching

### Phase 4: Integration (Week 7-8)
- Update SCT frontend to use Chatbot microservice API
- Conduct end-to-end integration testing
- Perform load testing and optimization
- Complete documentation and runbooks
- Deploy to production environment

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Azure OpenAI Python SDK](https://github.com/openai/openai-python)
- [Microservices Architecture Best Practices](https://docs.microsoft.com/azure/architecture/microservices/)
- [SCT Chatbot Integration Guide](../Chatbot-Integration.md)
- [ADR-003: Azure OpenAI Integration](./ADR-003-Azure-OpenAI.md)

---

**Decision Owner**: SCT Architecture Team  
**Review Date**: 2025-03-09 (3 months)  
**Status**: ✅ Accepted
