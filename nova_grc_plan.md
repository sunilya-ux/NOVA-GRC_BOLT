# NOVA-GRC Comprehensive Scrum Master Plan v2.0

**AI-First Banking Compliance Platform - Agile Delivery Framework with RBAC Integration**

---

## Document Control

**Version:** 2.0  
**Last Updated:** October 30, 2025  
**Document Owner:** Scrum Master  
**Contributors:** Product Owner, Engineering Manager, Security Officer, Compliance Lead  
**Status:** Active - Living Document  
**Next Review:** Sprint 1 Retrospective

---

## Executive Summary

This comprehensive Scrum Master Plan integrates the **NOVA-GRC Product Requirements** with the **Role-Based Access Control (RBAC) framework** to deliver a production-ready, compliance-first AI platform in **24 weeks (12 two-week sprints)**.

### Key Updates in v2.0

✅ **RBAC Integration**: User roles, permissions, and maker-checker workflows embedded throughout all epics  
✅ **Enhanced Security Focus**: RBAC implementation across Sprints 2, 7-8 with audit trails  
✅ **Compliance-First Design**: Data protection, segregation of duties, and least privilege principles  
✅ **User Journey Mapping**: Role-specific workflows for Compliance Officers, Managers, CCOs, and Technical teams  
✅ **Access Control Testing**: New acceptance criteria for permission boundaries and audit logging

### Project Fundamentals

**Duration:** 24 weeks (12 two-week sprints)  
**Target MVP:** 180-day pilot-ready system  
**Team Size:** 12 people (scaling to 20 by Sprint 7)  
**Methodology:** Scrum with 2-week sprints  
**Deployment Model:** Cloud-first (AWS Mumbai region) with on-premise option

### Risk-Driven, Value-First Approach

1. **Early Validation** - Week 0 prototype (pre-Sprint 1)
2. **Technical Foundation** - Sprints 1-3: Infrastructure, RBAC, document processing, RAG
3. **AI Core Capabilities** - Sprints 4-6: Classification, explainability, bias detection
4. **Compliance & Security** - Sprints 7-9: DPDP Act, RBAC hardening, security audit
5. **User Experience & Pilot** - Sprints 10-12: Role-based dashboards, testing, deployment

### Critical Success Factors

- ✅ 99.5% AI accuracy maintained throughout
- ✅ Zero bias incidents (automated monitoring)
- ✅ 100% RBI FREE-AI framework compliance
- ✅ RBAC implemented with full audit trails
- ✅ Zero unauthorized access incidents
- ✅ 3/3 pilot banks convert to paid customers

---

## 📊 Enhanced Epic Roadmap with RBAC Integration

```
Sprint Timeline:                     Epic Distribution + RBAC:
├─ Pre-Sprint: Week 0 Prototype      Sprint 1-3:  [EPIC-1] [EPIC-2] [EPIC-8] [RBAC-Core]
├─ Sprints 1-3: Foundation & Data    Sprint 4-6:  [EPIC-3] [EPIC-4] [EPIC-8] [RBAC-Workflow]
├─ Sprints 4-6: AI Core              Sprint 7-9:  [EPIC-5] [EPIC-6] [EPIC-8] [RBAC-Hardening]
├─ Sprints 7-9: Compliance           Sprint 10-12: [EPIC-7] [EPIC-8] [RBAC-Validation]
└─ Sprints 10-12: UX & Pilot Launch
```

---

## 🎯 EPIC-1: Document Processing Pipeline (ENHANCED)

**Epic ID:** NOVA-EP-001  
**Business Value:** Core infrastructure for ingesting and processing 2,000+ KYC documents daily with role-based access control  
**Priority:** MUST-HAVE  
**Estimated Duration:** Sprints 1-3 (6 weeks)

### Epic-Level Acceptance Criteria

1. Given a KYC document is uploaded via API/Web/Mobile
2. When the document processing pipeline executes
3. Then the document should be:
   - Validated for format compliance (PDF, JPEG, PNG)
   - OCR-processed with 95%+ text extraction accuracy
   - Entity-extracted (Name, DOB, Address, ID numbers)
   - Stored securely with audit trail **including user role who uploaded**
   - Processed in <30 seconds end-to-end
   - **Access controlled based on user role (Officer sees own, Manager sees team, CCO sees all)**
4. And zero documents are dropped or lost
5. And all processing is logged with **user identity, role, timestamp, and action type**

### RBAC Requirements for EPIC-1

- Compliance Officers: Upload documents (own cases only)
- Compliance Managers: View team documents, reassign cases
- System Administrators: Configure upload settings, no PII access
- Audit logs capture: User ID, Role, Document ID, Timestamp, Action

---

## 🎫 NOVA-1.1: Encore.ts Infrastructure Setup (UPDATED)

**Story:** As a **DevOps Engineer**, I want to set up the Encore.ts development environment with microservices architecture and **role-based authentication middleware**, so that we have a secure, scalable backend foundation.

**Priority:** High  
**Story Points:** 8  
**Sprint:** Sprint 1

### Acceptance Criteria

1. Given Encore.ts is installed and configured
2. When I run the development server locally
3. Then I should see:
   - Health check endpoint responding at /health
   - API documentation auto-generated at /docs
   - Type-safe API routes with full TypeScript coverage
   - Hot reload working for code changes
   - **JWT authentication middleware integrated**
   - **Role-based access control middleware (RBAC) stubbed**
4. And when I deploy to staging
5. Then the application should deploy successfully to AWS ECS
6. And observability dashboard should show service metrics in Datadog
7. **And authentication endpoints (/auth/login, /auth/logout) should be accessible**

### Technical Dependencies

- AWS account with Mumbai region access
- GitHub repository with CI/CD pipeline
- Docker containerization
- Datadog APM integration
- **Auth0 or JWT library for authentication**
- **RBAC middleware framework**

### Definition of Done

- [ ] Encore.ts service running locally
- [ ] CI/CD pipeline deploying to staging
- [ ] Health check endpoint returning 200 OK
- [ ] API documentation accessible
- [ ] **Authentication middleware integrated**
- [ ] **RBAC middleware structure created**
- [ ] Code review completed and merged
- [ ] Infrastructure-as-code committed to repo

---

## 🎫 NOVA-1.2: Database Schema & Authentication with RBAC (UPDATED)

**Story:** As a **Backend Engineer**, I want to implement PostgreSQL database schema with **role-based authentication and audit logging**, so that we can securely store documents and control access based on user roles.

**Priority:** High  
**Story Points:** 8 *(increased from 5 due to RBAC complexity)*  
**Sprint:** Sprint 1

### Acceptance Criteria

1. Given the database schema is designed
2. When I run the migration scripts
3. Then the following tables should be created:
   - **users** (with roles: compliance_officer, compliance_manager, cco, system_admin, ciso, internal_auditor, ml_engineer, dpo)
   - **role_permissions** (mapping roles to module permissions)
   - documents (with metadata, status, processing results, **assigned_user_id, assigned_role**)
   - **audit_logs** (complete access trail with user_id, role, action, timestamp, ip_address, resource_id)
   - decisions (AI + human verdicts with reasoning, **approved_by_user_id, approved_by_role**)
   - **access_control_matrix** (defines who can access what)
4. And when a user authenticates with JWT token
5. Then they should receive appropriate **role-based permissions** from the access control matrix
6. And when a user attempts unauthorized access
7. Then they should receive 403 Forbidden response **with audit log entry**
8. And all authentication attempts should be logged with **success/failure status**

### RBAC Schema Design

```sql
-- Core RBAC Tables
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    role_type VARCHAR(20), -- Operational, Supervisory, Executive, Technical, Assurance
    priority VARCHAR(20), -- Mandatory, Need-based
    description TEXT
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role_id INTEGER REFERENCES roles(role_id),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

CREATE TABLE permissions (
    permission_id SERIAL PRIMARY KEY,
    module_name VARCHAR(100), -- Document Processing, AI Decision, Audit Logs, etc.
    action VARCHAR(50), -- view, create, update, delete, approve, export
    data_scope VARCHAR(50) -- own, team, department, all, none
);

CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(role_id),
    permission_id INTEGER REFERENCES permissions(permission_id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    role_name VARCHAR(50),
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id INTEGER,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT NOW(),
    success BOOLEAN,
    details JSONB
);

-- Document ownership and access
CREATE TABLE documents (
    document_id SERIAL PRIMARY KEY,
    uploaded_by INTEGER REFERENCES users(user_id),
    assigned_to INTEGER REFERENCES users(user_id),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Technical Dependencies

- PostgreSQL RDS instance provisioned
- Auth0 or custom JWT implementation
- MFA integration (Google Authenticator)
- **RBAC middleware implementation**
- **Audit logging service**

### Definition of Done

- [ ] Database schema documented and reviewed
- [ ] **RBAC tables created with seed data for 9 roles**
- [ ] Migrations tested on staging database
- [ ] Authentication endpoints implemented (/login, /logout, /refresh)
- [ ] **Role-based authorization middleware working**
- [ ] **Audit logging capturing all actions**
- [ ] Unit tests for auth logic (>90% coverage)
- [ ] **RBAC permissions tested for each role**
- [ ] Security review completed
- [ ] API documentation updated

---

## 📅 Updated Sprint Planning & Story Allocation

### Sprint 1 (Weeks 1-2): Foundation + RBAC Core

**Sprint Goal:** Establish infrastructure with RBAC authentication and authorization framework

| Story ID | Story Title | Points | Assignee Role |
|----------|-------------|--------|---------------|
| NOVA-1.1 | Encore.ts Infrastructure Setup (with auth middleware) | 8 | DevOps Engineer |
| NOVA-1.2 | Database Schema & RBAC Tables | 8 | Backend Engineer |
| **Total** | | **16** | |

**RBAC Deliverables:**
- 9 roles defined in database
- JWT authentication working
- RBAC middleware structure created
- Audit logging infrastructure

---

### Sprint 2 (Weeks 3-4): Document Processing + RBAC Enforcement

**Sprint Goal:** Document upload and OCR functional with role-based access control

| Story ID | Story Title | Points | Assignee Role |
|----------|-------------|--------|---------------|
| NOVA-1.3 | Document Upload API with RBAC | 8 | Backend Engineer |
| NOVA-1.4 | OCR Integration with Audit Trails | 8 | ML Engineer |
| NOVA-2.1 | Vector Database Setup | 5 | ML Engineer |
| **Total** | | **21** | |

**RBAC Deliverables:**
- Document ownership tracking
- Role-based document access (Officer sees own, Manager sees team)
- Audit logs for upload actions

---

### Sprint 7 (Weeks 13-14): RBAC Hardening + DPDP Compliance

**Sprint Goal:** Complete RBAC access control matrix and DPDP consent management

| Story ID | Story Title | Points | Assignee Role |
|----------|-------------|--------|---------------|
| NOVA-5.3 | Intersectional Bias Analysis | 5 | ML Engineer |
| NOVA-5.4 | Automated Bias Correction | 8 | ML Engineer |
| **NOVA-6.0** | **RBAC Hardening & Access Control Matrix** | **13** | **Security Officer** |
| **Total** | | **26** | |

**Critical Sprint: RBAC Enforcement Across All Modules**

---

## 🚨 Enhanced Risk Assessment with RBAC Risks

### New Critical Risk: RBAC-001 - Privilege Escalation Vulnerability

**Probability:** 35% | **Impact:** Critical (Regulatory Shutdown)

**Description:** User successfully escalates privileges (Officer → Manager, Manager → CCO) through token manipulation, API exploitation, or session hijacking.

**Mitigation Strategies:**
- **Sprint 1:** JWT tokens signed with strong secret, short expiration (30 min)
- **Sprint 7:** Comprehensive RBAC hardening, server-side permission checks
- **Sprint 11:** External penetration testing focused on privilege escalation
- **Continuous:** Real-time CISO alerts for suspicious role access patterns

**Early Warning Signals:**
- Repeated 403 errors from same user
- Token expiration/refresh anomalies
- Cross-role API calls detected
- Audit log inconsistencies (action doesn't match role)

**Incident Response Plan:**
1. **Immediate (0-1 hour):** Revoke all sessions for affected user, force re-authentication
2. **Investigation (1-4 hours):** Review audit logs, identify attack vector
3. **Remediation (4-24 hours):** Patch vulnerability, notify affected parties
4. **Validation (24-48 hours):** Re-test RBAC controls, external audit

---

## 📊 Enhanced Metrics & Reporting with RBAC KPIs

### Sprint Metrics (Enhanced with RBAC)

**Security & Access Control Metrics:**

| Metric | Target | Measurement | Owner |
|--------|--------|-------------|-------|
| **RBAC Test Coverage** | >95% | % of permission combinations tested | QA Engineer |
| **Unauthorized Access Attempts** | <5 per day | Count from audit logs | CISO |
| **Audit Log Completeness** | 100% | % of actions logged | Security Officer |
| **Permission Boundary Violations** | 0 | Failed authorization in production | CISO |
| **Privilege Escalation Incidents** | 0 | Successful role elevation attempts | Security Team |
| **Maker-Checker Compliance Rate** | >99% | % of decisions following approval workflow | Compliance Manager |

---

## 📚 Appendix A: RBAC Role Catalog (Detailed)

### 1. Compliance Officer (Operational User)

**Purpose:** Frontline user handling KYC reviews, validating AI outputs, and providing feedback.

**Responsibilities:**
- Upload and review KYC documents assigned to them
- Validate AI classification decisions
- Provide feedback (agree/disagree) on AI verdicts
- Submit documents for Manager approval
- View personal performance metrics

**Access Level:**
- **Documents:** Own cases only (assigned_to = user_id)
- **AI Decisions:** View and feedback on own cases
- **Audit Logs:** View own activity history
- **Dashboards:** Personal performance metrics

**Cannot Do:**
- Approve or reject documents (Manager only)
- View documents assigned to other officers
- Access system configuration
- Modify audit logs
- Export enterprise-wide reports

**Maker-Checker Role:** Maker (proposes decisions)

---

### 2. Compliance Manager (Supervisory User)

**Purpose:** Supervises officers, approves exceptions, manages workloads, and monitors accuracy.

**Responsibilities:**
- Review and approve/reject decisions submitted by Officers
- Reassign documents across team members
- Monitor team performance and workload distribution
- Override AI decisions when justified (with explanation)
- Escalate complex cases to CCO

**Access Level:**
- **Documents:** All documents assigned to team members
- **AI Decisions:** Approve, reject, override (with audit trail)
- **Audit Logs:** View team activity
- **Dashboards:** Team performance metrics

**Maker-Checker Role:** Checker (approves decisions made by Officers)

---

### 3. Chief Compliance Officer (CCO) (Executive Oversight)

**Purpose:** Oversees compliance program, reviews dashboards, exports audit trails, and reports to board/regulator.

**Access Level:**
- **Documents:** Read-only access to all documents (enterprise-wide)
- **AI Decisions:** View all, cannot approve/reject directly
- **Audit Logs:** Full read access to all audit logs
- **Dashboards:** Executive dashboard with strategic KPIs

**Maker-Checker Role:** Final escalation authority

---

## 📋 Complete RBAC Access Control Matrix

| Module | Compliance Officer | Compliance Manager | CCO | System Admin | ML Engineer | CISO | Internal Auditor | DPO |
|--------|-------------------|-------------------|-----|--------------|-------------|------|------------------|-----|
| **Login & Access** | Standard | Standard | Standard | Manage users | Test (sandbox) | Monitor | View logs | Standard |
| **User & Role Management** | -- | View | View | Full control | -- | View | View | -- |
| **Document Processing** | Full (own) | Approve/reassign (team) | View (all) | -- | Test (no PII) | Monitor | -- | Sample view |
| **AI Decision & Feedback** | Feedback (own) | Approve/override (team) | View summary | -- | Train/test | Monitor | View | -- |
| **Audit Logs** | View own | View team | View all | Export logs | View (dev) | Full read | Full read | View (privacy) |
| **Data Privacy (DPDP)** | View consent | Validate | View reports | Manage retention | Test anonymization | Review breaches | Verify controls | Full access |
| **Dashboards** | View personal | View team | Full view | View | View | View (security) | View (controls) | View |
| **Model Management** | -- | View | View | -- | Full control | Monitor | View | -- |
| **Security Alerts** | -- | -- | View | View | -- | Full control | View | -- |
| **Regulatory Reporting** | -- | -- | Export | -- | -- | View | Verify | -- |

---

## 🎯 Enhanced Success Criteria with RBAC Metrics

### Sprint-Level Success (Every 2 Weeks)

- ✅ Sprint goal achieved
- ✅ Zero critical bugs in production
- ✅ Velocity maintained
- ✅ **All new features have RBAC enforcement**
- ✅ **RBAC tests passing (>95% coverage)**
- ✅ **Zero unauthorized access incidents in staging**
- ✅ **Audit log completeness verified (100%)**

---

### Pilot-Level Success (End of Sprint 12)

- ✅ 99.5% AI accuracy on 10,000 real documents
- ✅ <30 second processing time (P95)
- ✅ <5% bias variance across demographic groups
- ✅ Zero critical security vulnerabilities
- ✅ **Zero RBAC violations in pilot**
- ✅ **100% maker-checker compliance**
- ✅ **All pilot users completed RBAC training**
- ✅ **Audit trail export <10 seconds**
- ✅ Compliance officer satisfaction >4.0/5
- ✅ 60% time savings demonstrated
- ✅ Pilot bank commits to paid contract

---

### Business Success (Post-Pilot)

- ✅ 3/3 pilot banks convert to paid customers
- ✅ Positive ROI (>400% in 90 days)
- ✅ RBI compliance validated
- ✅ Zero bias incidents
- ✅ **Zero data breaches**
- ✅ **100% audit trail integrity**
- ✅ **RBAC framework validated by external auditor**
- ✅ **DPDP Act compliance**
- ✅ Ready to scale to 10 customers in Year 2

---

## 🚀 Next Immediate Actions

### Week 0 (Pre-Sprint 1): Prototype & RBAC Design Validation

**Owner:** ML Engineer + Product Manager + Security Officer  
**Duration:** 5 days

**Deliverables:**

1. **AI Prototype** (3 days)
   - Collect 500 sample KYC documents
   - Build RAG + GPT-4 prototype
   - Test accuracy (target: >90%)

2. **RBAC Design Review** (2 days)
   - Validate 9-role framework
   - Document maker-checker workflows
   - Security assessment with pilot banks

**Success Criteria:**
- [ ] AI prototype >90% accuracy
- [ ] RBAC framework approved
- [ ] Integration requirements documented

---

### Sprint 1 Kickoff (Week 1)

**Actions:**

1. **Team Formation** (Day 1)
   - Finalize team roster
   - Set up Jira with RBAC templates

2. **RBAC Training Workshop** (Day 2 - 4 hours)
   - RBAC principles
   - NOVA-GRC framework
   - Development best practices

3. **Sprint Planning** (Day 2-3)
   - Commit to Sprint 1 stories
   - Schedule ceremonies

---

## 🏁 Conclusion

This **comprehensive v2.0 Scrum Master Plan** integrates NOVA-GRC requirements with robust **RBAC framework** to ensure:

✅ **Security-First Development**  
✅ **Compliance Ready**  
✅ **Regulatory Confidence**  
✅ **Risk Mitigation**  
✅ **User Adoption**  
✅ **Operational Excellence**

### Critical Path to Success

**Week 0:** Prototype + RBAC validation  
**Sprint 1-3:** Foundation with RBAC core  
**Sprint 4-6:** AI with maker-checker  
**Sprint 7:** RBAC hardening (CRITICAL)  
**Sprint 8-9:** Security validation  
**Sprint 10-12:** Pilot launch  

---

**Document Status:** ✅ Complete and Ready for Execution  
**Version:** 2.0 (RBAC-Enhanced)  
**Owner:** Scrum Master  
**Next Review:** Sprint 1 Retrospective

---

*This living document will be updated based on sprint retrospectives, security findings, and pilot feedback.*
