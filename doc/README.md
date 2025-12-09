# Security Control Tower (SCT) - Documentation

## Overview

This directory contains comprehensive documentation for the Security Control Tower (SCT) application, an AI-powered security monitoring and analysis platform built on Microsoft Azure.

---

## Documentation Structure

### 📘 [High-Level Design (HLD.md)](./HLD.md)
**Audience**: Architects, Managers, All Stakeholders

Provides a comprehensive overview of the system including:
- Executive summary and system purpose
- Business capabilities and value proposition
- High-level architecture and system boundaries
- Integration points with Azure and external services
- Security architecture and deployment strategy
- Technology stack and success metrics

**Use this when**: Understanding the overall system architecture, explaining the system to non-technical stakeholders, or planning integrations.

---

### 📗 [Low-Level Design (LLD.md)](./LLD.md)
**Audience**: Developers, Technical Leads, DevOps Engineers

Detailed technical design documentation covering:
- Component architecture and service layer design
- Data models and interfaces (TypeScript/Angular)
- Authentication flow with MSAL
- Query processing pipeline (SentriBot AI workflow)
- Error handling strategies
- Configuration management
- Testing and deployment procedures

**Use this when**: Implementing features, debugging issues, understanding code architecture, or onboarding new developers.

---

### 📙 [Functional Documentation](./Functional-Documentation.md)
**Audience**: Security Analysts, Managers, Business Users, Non-Technical Stakeholders

Business-focused documentation explaining:
- User roles and personas (SOC Analyst, Security Manager, Incident Responder)
- Core features with business value
- Business processes and workflows
- SentriBot AI assistant capabilities
- Security posture management
- Dashboard features and metrics
- Real-world use cases and examples

**Use this when**: Training users, understanding business processes, explaining features to stakeholders, or writing user guides.

---

### 📕 [Technical Reference](./Technical-Reference.md)
**Audience**: Developers, DevOps Engineers, System Administrators

Technical reference guide including:
- Complete technology stack
- Development environment setup
- Configuration reference
- API documentation (Log Analytics, Azure OpenAI, Power BI)
- Service interfaces and methods
- KQL query patterns and examples
- Deployment procedures
- Troubleshooting guide
- Performance optimization techniques

**Use this when**: Setting up development environment, integrating with APIs, writing queries, deploying to production, or troubleshooting issues.

---

### 🎨 [C4 Architecture Diagrams](./diagrams/C4-Diagrams.md)
**Audience**: Architects, Developers, Technical Stakeholders

Visual architecture documentation using C4 model in Mermaid format:
- **Level 1**: System Context Diagram (external dependencies)
- **Level 2**: Container Diagram (high-level components)
- **Level 3**: Component Diagram (internal structure)
- **Sequence Diagrams**: Key workflows (authentication, query processing, etc.)
- **Flow Diagrams**: Business processes (user risk analysis, CVE tracking, etc.)
- **Class Diagram**: Service and component relationships

**Use this when**: Understanding system architecture visually, presenting to stakeholders, or designing new features.

---

### 📋 [Architecture Decision Records (ADR)](./adr/)
**Audience**: Architects, Technical Leads, Developers

Documents key architectural decisions with rationale:

- **[ADR-001: Angular Framework](./adr/ADR-001-Angular-Framework.md)**
  - Why Angular 18 was chosen for the frontend
  - Comparison with React and Vue.js
  - Benefits and trade-offs

- **[ADR-002: MSAL Authentication](./adr/ADR-002-MSAL-Authentication.md)**
  - Why MSAL library for Azure AD authentication
  - Token management strategy
  - Security considerations

- **[ADR-003: Azure OpenAI](./adr/ADR-003-Azure-OpenAI.md)**
  - Why Azure OpenAI for natural language processing
  - GPT-4o model selection
  - Function calling implementation
  - Cost management strategies

**Use this when**: Understanding why specific technologies were chosen, evaluating alternatives, or making similar decisions in other projects.

---

## Quick Start Guide

### For New Developers
1. Read [HLD.md](./HLD.md) - Section "System Overview" for context
2. Read [LLD.md](./LLD.md) - Section "Component Architecture" for structure
3. Read [Technical Reference](./Technical-Reference.md) - Section "Development Environment Setup"
4. Review [C4 Diagrams](./diagrams/C4-Diagrams.md) for visual understanding
5. Check relevant ADRs for technology choices

### For Security Analysts (Users)
1. Read [Functional Documentation](./Functional-Documentation.md) - Section "User Roles and Personas"
2. Review "Core Features" for SentriBot usage
3. Study "Business Processes" for workflows
4. Check "User Workflows" for common scenarios

### For Architects and Managers
1. Read [HLD.md](./HLD.md) for system overview
2. Review [C4 Diagrams](./diagrams/C4-Diagrams.md) for architecture
3. Read ADRs for key decisions
4. Review [Functional Documentation](./Functional-Documentation.md) for business value

### For DevOps/Operations
1. Read [Technical Reference](./Technical-Reference.md) - Deployment Guide
2. Review [LLD.md](./LLD.md) - Configuration Management
3. Check Troubleshooting section in Technical Reference
4. Review monitoring and logging strategies

---

## Key Features Documentation

### SentriBot AI Assistant
- **Functional**: [Functional Documentation](./Functional-Documentation.md#1-sentribot---ai-powered-security-assistant)
- **Technical**: [LLD.md](./LLD.md#4-sentinelqueryservice)
- **Architecture**: [ADR-003: Azure OpenAI](./adr/ADR-003-Azure-OpenAI.md)
- **Diagrams**: [Sequence Diagram](./diagrams/C4-Diagrams.md#sentribot-query-processing-flow)

### Authentication & Authorization
- **High-Level**: [HLD.md](./HLD.md#security-architecture)
- **Technical**: [LLD.md](./LLD.md#authentication-flow)
- **Architecture**: [ADR-002: MSAL Authentication](./adr/ADR-002-MSAL-Authentication.md)
- **Diagrams**: [Authentication Flow](./diagrams/C4-Diagrams.md#user-authentication-flow)

### Security Dashboards
- **Functional**: [Functional Documentation](./Functional-Documentation.md#3-security-dashboards-power-bi-integration)
- **Technical**: [Technical Reference](./Technical-Reference.md#power-bi-embed-api)
- **High-Level**: [HLD.md](./HLD.md#integration-points)

### User Risk Analysis
- **Functional**: [Functional Documentation](./Functional-Documentation.md#2-user-risk-scoring-and-analysis)
- **Technical**: [LLD.md](./LLD.md#sentinel-query-models)
- **Workflow**: [User Risk Assessment Process](./Functional-Documentation.md#process-3-user-risk-assessment-and-response)
- **Diagrams**: [User Risk Flow](./diagrams/C4-Diagrams.md#user-risk-analysis-flow)

### CVE Vulnerability Tracking
- **Functional**: [Functional Documentation](./Functional-Documentation.md#1-multi-source-incident-correlation)
- **Technical**: [LLD.md](./LLD.md#multi-source-detection)
- **Process**: [CVE Management](./Functional-Documentation.md#process-2-cve-vulnerability-management)
- **Diagrams**: [Multi-Source Flow](./diagrams/C4-Diagrams.md#multi-source-incident-correlation-flow)

---

## Technology Stack Summary

| Layer | Technology | Documentation |
|-------|-----------|---------------|
| Frontend Framework | Angular 18 | [ADR-001](./adr/ADR-001-Angular-Framework.md) |
| Authentication | MSAL | [ADR-002](./adr/ADR-002-MSAL-Authentication.md) |
| AI/NLP | Azure OpenAI GPT-4o | [ADR-003](./adr/ADR-003-Azure-OpenAI.md) |
| Security Data | Microsoft Sentinel | [HLD.md](./HLD.md#data-layer) |
| Dashboards | Power BI Embedded | [Technical Reference](./Technical-Reference.md#power-bi-embed-api) |
| UI Components | Angular Material | [Technical Reference](./Technical-Reference.md#technology-stack) |

---

## Common Tasks Reference

### Development Tasks

| Task | Documentation Section |
|------|----------------------|
| Set up development environment | [Technical Reference - Development Setup](./Technical-Reference.md#development-environment-setup) |
| Understand component structure | [LLD - Component Architecture](./LLD.md#component-architecture) |
| Add a new service | [LLD - Service Layer Design](./LLD.md#service-layer-design) |
| Configure Azure services | [Technical Reference - Configuration](./Technical-Reference.md#configuration-reference) |
| Write KQL queries | [Technical Reference - KQL Patterns](./Technical-Reference.md#kql-query-patterns) |
| Debug authentication issues | [Technical Reference - Troubleshooting](./Technical-Reference.md#troubleshooting) |

### Operations Tasks

| Task | Documentation Section |
|------|----------------------|
| Deploy to production | [Technical Reference - Deployment Guide](./Technical-Reference.md#deployment-guide) |
| Monitor application | [Technical Reference - Monitoring](./Technical-Reference.md#monitoring-and-logging) |
| Troubleshoot errors | [Technical Reference - Troubleshooting](./Technical-Reference.md#troubleshooting) |
| Optimize performance | [Technical Reference - Performance](./Technical-Reference.md#performance-optimization) |
| Configure MSAL | [LLD - MSAL Configuration](./LLD.md#msal-configuration) |

### User Tasks

| Task | Documentation Section |
|------|----------------------|
| Query security data | [Functional - SentriBot](./Functional-Documentation.md#1-sentribot---ai-powered-security-assistant) |
| Investigate risky users | [Functional - User Risk Workflow](./Functional-Documentation.md#workflow-1-investigating-a-high-risk-user) |
| Track CVE vulnerabilities | [Functional - CVE Process](./Functional-Documentation.md#process-2-cve-vulnerability-management) |
| Review dashboards | [Functional - Dashboards](./Functional-Documentation.md#3-security-dashboards-power-bi-integration) |
| Understand security metrics | [Functional - Security Posture](./Functional-Documentation.md#2-security-posture-overview) |

---

## Diagram Quick Reference

### System Architecture
- **Context**: [C4 Level 1](./diagrams/C4-Diagrams.md#level-1-system-context-diagram)
- **Containers**: [C4 Level 2](./diagrams/C4-Diagrams.md#level-2-container-diagram)
- **Components**: [C4 Level 3](./diagrams/C4-Diagrams.md#level-3-component-diagram)

### Key Workflows
- **Authentication**: [Sequence Diagram](./diagrams/C4-Diagrams.md#user-authentication-flow)
- **SentriBot Query**: [Sequence Diagram](./diagrams/C4-Diagrams.md#sentribot-query-processing-flow)
- **Token Acquisition**: [Sequence Diagram](./diagrams/C4-Diagrams.md#token-acquisition-flow)
- **User Risk Analysis**: [Flow Diagram](./diagrams/C4-Diagrams.md#user-risk-analysis-flow)
- **CVE Tracking**: [Flow Diagram](./diagrams/C4-Diagrams.md#multi-source-incident-correlation-flow)
- **Error Handling**: [Flow Diagram](./diagrams/C4-Diagrams.md#error-handling-flow)

---

## Glossary

| Term | Description | Details |
|------|-------------|---------|
| SCT | Security Control Tower | Application name |
| SentriBot | AI Security Assistant | Natural language query interface |
| MSAL | Microsoft Authentication Library | Azure AD authentication |
| KQL | Kusto Query Language | Query language for Azure services |
| CVE | Common Vulnerabilities and Exposures | Standardized vulnerability identifiers |
| MTTR | Mean Time to Remediate | Average time to fix issues |
| MTTD | Mean Time to Detect | Average time to discover issues |
| SOC | Security Operations Center | Security monitoring team |
| XDR | Extended Detection and Response | Multi-domain security |
| EDR | Endpoint Detection and Response | Endpoint security |
| MFA | Multi-Factor Authentication | Additional security beyond passwords |

---

## Contributing to Documentation

### Documentation Standards
- Use clear, concise language
- Include code examples where applicable
- Add diagrams for complex concepts
- Keep technical and functional docs separate
- Update diagrams when architecture changes
- Add ADRs for significant decisions

### Updating Documentation
1. Identify which document needs update
2. Make changes consistent with existing style
3. Update version numbers if major changes
4. Update this README if structure changes
5. Review all cross-references

---

## Additional Resources

### External Documentation
- [Angular Documentation](https://angular.io/docs)
- [Microsoft Sentinel Docs](https://docs.microsoft.com/azure/sentinel/)
- [Azure OpenAI Service](https://docs.microsoft.com/azure/cognitive-services/openai/)
- [KQL Language Reference](https://docs.microsoft.com/azure/data-explorer/kusto/query/)
- [MSAL Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Power BI Embedded](https://docs.microsoft.com/power-bi/developer/embedded/)

### Support
- **Technical Issues**: See [Troubleshooting Guide](./Technical-Reference.md#troubleshooting)
- **Development Questions**: Review [LLD](./LLD.md) and [Technical Reference](./Technical-Reference.md)
- **Business Questions**: Review [Functional Documentation](./Functional-Documentation.md)
- **Architecture Decisions**: Review [ADR](./adr/) directory

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024 | Initial comprehensive documentation | SCT Development Team |

---

**Last Updated**: 2024  
**Maintained By**: SCT Development Team  
**License**: Internal Use - Confidential
