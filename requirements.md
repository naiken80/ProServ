# Consulting Estimator Application – Functional & Technical Requirements

## 1. Overview
A modern web application to streamline creation of project estimates for consulting and professional service firms. The solution replaces complex spreadsheets with a collaborative, AI-assisted platform capable of handling global teams, multi-currency rate cards, and time-phased project planning.

---

## 2. Core Objectives
- Simplify estimate creation for multi-role, multi-currency, multi-region projects.
- Provide real-time collaboration with editable weekly schedules and role assignments.
- Offer AI-assisted WBS and staffing recommendations to optimize cost, margin, and timelines.
- Output professional Gantt-style visualizations and exportable estimates (PDF, XLSX, JSON).
- Support integrations with PSA/ERP systems for downstream planning and invoicing.

---

## 3. Functional Requirements

### 3.1 Project Management
- Create, read, update, and delete (CRUD) projects with attributes:
  - Client, base currency, start/end dates, billing model (T&M, Fixed Price, etc.)
  - Associated versions and approval workflow

### 3.2 Estimate Versions
- Each project supports multiple versions (scenarios or iterations).
- Each version captures an FX rate snapshot, rate card set, and locked configuration.
- Users can clone, compare, and roll back versions.

### 3.3 Work Breakdown Structure (WBS)
- Hierarchical task model: Epics → Workstreams → Tasks → Milestones.
- Dependencies (Start-Start, Finish-Finish, Start-Finish, Finish-Start).
- Editable via drag-and-drop Gantt chart with real-time validation.

### 3.4 Role and Resource Management
- Define roles (e.g., Architect, Consultant, PM) with rate and cost per currency.
- Assign named or generic resources to work items.
- Each assignment supports:
  - Weekly planned hours (time-phased grid)
  - Allocation model (hours, %FTE, fixed)
  - Local calendar/holiday support

### 3.5 Rate Cards & Multi-Currency Support
- Role-based rate cards supporting multiple currencies per role.
- Currency conversions captured via FX rate snapshots (locked per estimate version).
- Automatic recalculation if rates or FX values change.

### 3.6 AI Assistant Integration
- Suggests project WBS, staffing plan, and role mix from a project description.
- Recommends adjustments to hit margin, cost, or duration targets.
- Highlights anomalies (overbooking, misaligned roles, unrealistic durations).
- Provides proposal summary text for client-facing documents.

### 3.7 Scenario Planning
- Create scenarios within a version to explore pricing and resource allocation strategies.
- Compare multiple scenarios side-by-side on KPIs (price, cost, margin, duration).
- Enable one-click conversion of a scenario into an official version.

### 3.8 Gantt and Time-Phased Planning
- Week-by-week editable grid of resource allocations.
- Real-time cost/margin rollups at project, work item, and version levels.
- Auto-leveling option to prevent >100% resource utilization.

### 3.9 Exports & Outputs
- Export formats:
  - XLSX for spreadsheet compatibility
  - PDF for proposal output
  - JSON for API integrations
  - XML for MS Project import
- Template-driven document exports with corporate branding.

### 3.10 Collaboration & Governance
- Real-time multi-user editing and commenting.
- Approval workflow for estimate review and locking.
- Role-based visibility (Finance, Sales, Delivery, etc.).
- Version control and change audit trail.

### 3.11 Integration Interfaces
- Connectors for PSA/ERP (e.g., ServiceNow, NetSuite, SAP, Workday).
- Pull HRIS data (skills, calendars, resource availability).
- Push approved estimates to ERP for soft bookings.

---

## 4. Technical Requirements

### 4.1 Frontend
- **Framework:** Next.js 15 (React 19)
- **UI Libraries:** TailwindCSS, Recharts, Lucide Icons
- **Visualization:** Custom Gantt (Canvas/WebGL-based), Virtualized grid (React-Window)
- **Features:** Offline cache, keyboard navigation, accessibility compliance (ARIA)

### 4.2 Backend
- **Language/Framework:** Node.js with NestJS or Fastify
- **Database:** PostgreSQL (primary), Redis (caching/sessions)
- **Storage:** S3-compatible for exports and attachments
- **API Layers:**
  - REST (bulk import/export)
  - GraphQL (query flexibility)
- **Auth:** OIDC/SAML with RBAC and field-level permissions

### 4.3 AI Integration
- **Provider:** OpenAI GPT-5 API or Azure OpenAI
- **Capabilities:**
  - Project parsing, staffing recommendation, text generation
  - Scenario optimization (greedy + OR-Tools for constraints)
- **Safety:** Prompt redaction for PII, audit logging for AI actions

### 4.4 Performance Targets
- Load estimates up to 200 resources × 52 weeks < 1.5s
- UI edit latency < 50ms client-side echo, < 300ms server confirm
- Export operations complete < 5s for 10,000+ data rows

### 4.5 Security & Compliance
- Per-tenant data isolation with encryption (KMS-managed keys)
- Immutable audit trail for estimates and rate changes
- SCIM provisioning, MFA, and SSO
- GDPR and SOC2 readiness

---

## 5. Data Model Summary
**Entities:** Organization, Role, RateCard, FxRate, Project, EstimateVersion, WorkItem, Assignment, TimePhasedPlan, PriceRule, Scenario, Approval, Comment, ActivityEvent, Connector.

**Relationships:**
- `Project` → many `EstimateVersion`
- `EstimateVersion` → many `WorkItem`
- `WorkItem` → many `Assignment`
- `Assignment` → many `TimePhasedPlan`
- `RateCard` ↔ `Role` (many-to-many)
- `FxRate` used in `EstimateVersion` snapshots

---

## 6. MVP Deliverables (Phase 1)
- Project creation and versioning
- Rate card and FX management
- Time-phased grid and Gantt visualization
- Calculation engine (cost, bill, margin)
- Exports (PDF, XLSX)
- User management and approvals

---

## 7. Phase 2 Enhancements
- Scenario comparison and optimization engine
- Real-time collaboration (CRDT)
- AI-assisted WBS and staffing generation
- ERP integration connector
- Proposal document generator

---

## 8. Success Metrics
- 80% reduction in time spent building multi-week estimates
- Sub-2s average load time for 100+ resource estimates
- >95% adoption rate within internal consulting teams
- Positive ROI through optimized margin and role utilization

---

## 9. Next Steps
1. Implement core schema and API scaffolding.
2. Build frontend grid and Gantt with sample data.
3. Integrate authentication and RBAC.
4. Add AI prompt handler for estimate generation.
5. Connect export and versioning modules.
6. Conduct usability testing with target consulting teams.

