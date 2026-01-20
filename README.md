# CabiPro - Cabinetry Project Management System

## 📋 Project Overview

**CabiPro** is a comprehensive, **multi-tenant SaaS application** built for managing cabinetry projects, from client onboarding and material selection to purchase orders, inventory management, and project tracking. The system is designed for cabinetry businesses to streamline their operations, track projects through multiple stages, manage suppliers, and maintain detailed records of materials and installations.

### Technology Stack

- **Frontend**: Next.js 16.1.1 (App Router), React 19.2.3, TypeScript 5
- **Backend**: Next.js API Routes (serverless)
- **Database**: MySQL with Prisma ORM 7.2.0
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Styling**: Tailwind CSS 4
- **State Management**: Redux Toolkit 2.11.2
- **Rich Text**: TipTap 3.14.0
- **File Handling**: Sharp 0.34.5, heic2any, JSZip
- **Charts**: Chart.js 4.5.1 with react-chartjs-2
- **PDF Generation**: jsPDF 3.0.4, react-pdf 10.3.0
- **Email**: Mailgun.js 12.4.0
- **Animations**: Motion 12.23.26, AOS 3.0.0-beta.6

---

## 🏗️ Architecture Overview

### Multi-Tenant Architecture

The application implements a **robust multi-tenant system** where each organization has:

- Isolated data with organization-scoped queries
- Separate authentication sessions
- Individual plan-based feature access (STARTER, PLUS, PRO, ENTERPRISE)
- Soft-delete patterns for data recovery

### Database Schema (984 lines, 23+ models)

The Prisma schema is **exceptionally comprehensive** and well-organized into logical sections:

#### Core Models

- **organization** - Multi-tenant root entity with plan management
- **constants_config** - Organization-specific configuration
- **users** - Organization users with module-based permissions
- **module_access** - Granular permission system (20+ permission flags)
- **Admin** - Super admin system separate from organization users
- **sessions** / **admin_sessions** - JWT-based session management

#### Business Domain Models

- **client** - Customer management with contacts
- **contact** - Contacts for clients and suppliers
- **employees** - Employee records with detailed info (banking, emergency contacts)
- **project** - Project container linking clients and lots
- **lot** - Individual project units with stages and tabs
- **stage** / **stage_employee** - Workflow stages with employee assignments
- **lot_tab** - Organized sections (10 tab types: drawings, photos, measurements, etc.)
- **lot_file** - File attachments with metadata and soft-delete

#### Material & Inventory Models

- **item** - Multi-category inventory (SHEET, HANDLE, HARDWARE, ACCESSORY, EDGING_TAPE)
- **sheet** / **handle** / **hardware** / **accessory** / **edging_tape** - Category-specific attributes
- **material_selection** - Material selection with versioning support
- **material_selection_versions** - Version history for material changes
- **material_selection_version_area** - Areas within material selections
- **quote** - Quote management system

#### Procurement Models

- **supplier** - Supplier directory
- **supplier_statement** - Monthly supplier statements with payment tracking
- **materials_to_order** - Materials requisition with status workflow
- **materials_to_order_item** - Line items for material orders
- **purchase_order** - Purchase order management with status tracking
- **purchase_order_item** - PO line items
- **stock_transaction** - Inventory transactions (ADDED, USED, WASTED)

#### Media & Logging

- **media** - Centralized media storage for employees, items, material selections
- **supplier_file** - Supplier-specific documents
- **maintenance_checklist** - Maintenance tracking for lot files
- **logs** - Comprehensive audit logging system

### API Architecture

The API follows **RESTful conventions** with 34+ route groups:

- Organized by domain (client, employee, project, lot, supplier, etc.)
- Consistent CRUD patterns
- Authentication middleware integration
- Logging middleware for audit trails

### Authentication System

**Dual authentication system**:

1. **Organization Users** (`lib/auth.ts`)

   - JWT-based authentication
   - Email/password login
   - Session management in database
   - Organization-scoped access control

2. **Admin Users** (`lib/admin-auth.ts`)
   - Separate admin authentication
   - Role-based access (SUPERADMIN, ADMIN, MANAGER, STAFF)
   - Dedicated admin session table

**Middleware** (`lib/auth-middleware.ts`, 518 lines):

- `requireAuth()` - Enforce user authentication
- `requireAdminAuth()` - Enforce admin authentication
- `requireAuthFromCookies()` - Server component authentication
- Token validation, session verification, and account status checks
- Comprehensive error handling with `AuthenticationError` class

### Multi-Tenancy Implementation

**Tenant isolation** (`lib/tenant.ts`, `lib/prisma-middleware.ts`):

- Organization ID automatically injected into all queries
- Prisma middleware for automatic tenant scoping
- Tenant slug-based routing
- Soft-delete support across all tables

---

## ✅ Strengths

### 1. **Excellent Database Design**

- Comprehensive schema covering all business requirements
- Well-organized with logical sections and comments
- Proper indexing strategy (60+ indexes)
- Soft-delete pattern for data recovery
- Audit logging system
- Versioning support for critical data (material selections)

### 2. **Robust Authentication & Security**

- JWT-based authentication with proper expiry
- Bcrypt password hashing (10 salt rounds)
- Dual authentication system (users + admins)
- Session management in database
- Middleware-based protection
- Organization and user status validation

### 3. **Multi-Tenant Architecture**

- Clean tenant isolation
- Prisma middleware for automatic scoping
- Per-organization configuration
- Plan-based feature access

### 4. **Comprehensive Permission System**

- Granular module-based permissions (20+ flags)
- User-level access control
- Feature toggles per organization

### 5. **Well-Organized Codebase**

- Clear folder structure (app router convention)
- Domain-driven API organization
- Separation of concerns (lib, components, app)
- TypeScript for type safety
- Environment-based configuration

### 6. **Rich Feature Set**

- Dashboard with analytics (charts, KPIs, stats)
- File upload/management with media handling
- PDF generation and Excel exports
- Email integration (Mailgun)
- Rich text editing (TipTap)
- Complex material selection with versioning

### 7. **Modern Tech Stack**

- Latest Next.js 16 with App Router
- React 19
- TypeScript 5
- Prisma 7
- Tailwind CSS 4

---

## ⚠️ Weaknesses & Areas for Improvement

### 1. **Component Organization & Reusability**

**Issues:**

- Many large page components (1500+ lines: `app/app/page.tsx`)
- Duplicate logic across similar pages (suppliers, clients, employees)
- Component-specific utilities mixed with business logic
- Limited shared component library

**Impact:**

- Difficult to maintain
- Code duplication
- Inconsistent UX patterns
- Slower development for new features

### 2. **State Management Inconsistency**

**Issues:**

- Redux Toolkit installed but minimal usage
- Heavy reliance on local `useState` and `useEffect`
- API calls scattered throughout components
- No centralized data fetching/caching strategy

**Impact:**

- Inconsistent data flow
- Potential race conditions
- Duplicate API requests
- Hard to debug state issues

### 3. **API Layer Concerns**

**Issues:**

- No API client abstraction (raw axios calls everywhere)
- Error handling patterns vary across components
- No request/response interceptors
- Limited API response typing
- No centralized loading/error states

**Impact:**

- Inconsistent error handling
- Difficult to implement global features (retry, logging)
- Type safety gaps

### 4. **Performance Optimization Opportunities**

**Issues:**

- Large bundle sizes (multiple heavy dependencies)
- No code splitting for large components
- Missing React.memo/useMemo/useCallback in key areas
- Potential N+1 queries in Prisma
- No image optimization strategy documented

**Impact:**

- Slower page loads
- Reduced user experience
- Increased server costs

### 5. **Testing Infrastructure**

**Issues:**

- No test files found in the codebase
- No test configuration (Jest, Vitest, etc.)
- No CI/CD pipeline visible
- No documented testing strategy

**Impact:**

- High risk of regressions
- Difficult to refactor with confidence
- Manual testing burden

### 6. **Documentation**

**Issues:**

- Generic Next.js README (not project-specific)
- No API documentation
- No component documentation
- Missing setup instructions
- No architecture diagrams

**Impact:**

- Slow onboarding for new developers
- Knowledge silos
- Difficult to understand system design

### 7. **Type Safety Gaps**

**Issues:**

- Many TypeScript interfaces defined inline
- Limited shared type definitions
- Some `any` types in complex components
- Prisma types not fully leveraged

**Impact:**

- Runtime errors that could be caught at compile time
- Inconsistent data structures

### 8. **File Upload & Media Management**

**Issues:**

- Custom file handler implementation (`lib/filehandler.ts`)
- No CDN integration mentioned
- File storage in local `mediauploads` directory
- Potential scalability issues

**Impact:**

- Storage limitations
- Performance bottlenecks
- Backup/recovery complexity

### 9. **Error Handling & Logging**

**Issues:**

- Basic console.error in many places
- Limited structured logging
- No error tracking service integration (Sentry, etc.)
- Inconsistent user-facing error messages

**Impact:**

- Difficult to debug production issues
- Poor user experience during errors

### 10. **Code Quality & Consistency**

**Issues:**

- Large functions with multiple responsibilities
- Inconsistent naming conventions
- Magic numbers/strings in code
- Limited code comments for complex logic

**Impact:**

- Reduced code maintainability
- Increased cognitive load

---

## 🚀 Recommended Improvements

### High Priority

1. **Implement Comprehensive Testing**

   - Add unit tests for utilities and business logic
   - Integration tests for API routes
   - E2E tests for critical user flows
   - Set up test coverage reporting

2. **Create Shared Component Library**

   - Extract reusable components (see suggestions below)
   - Document component APIs with Storybook
   - Implement consistent design system

3. **API Client Abstraction**

   - Create centralized API client with interceptors
   - Implement request/response type definitions
   - Add automatic retry and error handling
   - Use React Query or SWR for data fetching

4. **Performance Optimization**

   - Implement code splitting for large pages
   - Add React.memo to expensive components
   - Optimize Prisma queries (use select, include strategically)
   - Implement image optimization with Next.js Image

5. **Documentation**
   - Update README with project-specific info
   - Create API documentation (OpenAPI/Swagger)
   - Add architecture diagrams
   - Document deployment process

### Medium Priority

6. **State Management**

   - Either fully adopt Redux Toolkit or remove it
   - Consider React Query for server state
   - Standardize client state patterns

7. **Error Handling**

   - Implement error boundaries
   - Add error tracking service (Sentry)
   - Create user-friendly error pages
   - Standardize API error responses

8. **Type Safety**

   - Create shared type definitions file
   - Eliminate `any` types
   - Generate types from Prisma schema
   - Add strict TypeScript rules

9. **Media Management**

   - Integrate cloud storage (AWS S3, Cloudinary)
   - Implement CDN for media delivery
   - Add image optimization pipeline
   - Use proper mime type validation

10. **Code Quality**
    - Set up ESLint with strict rules
    - Add Prettier for code formatting
    - Implement pre-commit hooks (Husky)
    - Create coding style guide

### Low Priority

11. **Developer Experience**

    - Add Storybook for component development
    - Create development documentation
    - Add debugging tools
    - Improve local development setup

12. **Monitoring & Analytics**
    - Add performance monitoring
    - Implement user analytics
    - Create admin dashboard for system health
    - Add uptime monitoring

---

## 🔧 Suggested Reusable Components

### 1. **Data Table Component** ⭐⭐⭐ (High Impact)

**Purpose**: Replace duplicate table implementations across clients, employees, suppliers, items, projects.

**Features**:

- Sortable columns
- Pagination with server-side support
- Search/filter
- Bulk actions
- Column visibility toggle
- Export functionality (CSV, Excel, PDF)
- Loading states
- Empty states
- Responsive design

**Current Duplication**: ~10 pages with similar table logic

**Files**:

```typescript
// components/shared/DataTable/DataTable.tsx
// components/shared/DataTable/DataTableHeader.tsx
// components/shared/DataTable/DataTableRow.tsx
// components/shared/DataTable/DataTablePagination.tsx
// components/shared/DataTable/types.ts
```

### 2. **Form Builder Component** ⭐⭐⭐ (High Impact)

**Purpose**: Standardize form creation for add/edit operations.

**Features**:

- Automatic field generation from schema
- Built-in validation (Zod/Yup)
- Consistent error handling
- Loading states
- Auto-save drafts
- File upload support
- Multi-step forms
- Conditional fields

**Current Duplication**: ~20 forms with similar patterns

**Files**:

```typescript
// components/shared/Form/FormBuilder.tsx
// components/shared/Form/FormField.tsx
// components/shared/Form/FormValidation.ts
// components/shared/Form/hooks/useForm.ts
```

### 3. **API Client with Hooks** ⭐⭐⭐ (High Impact)

**Purpose**: Centralize all API calls with consistent error handling.

**Features**:

- Type-safe API methods
- Automatic authentication headers
- Request/response interceptors
- Error handling
- Loading states
- React Query integration
- Optimistic updates

**Files**:

```typescript
// lib/api/client.ts
// lib/api/hooks/useQuery.ts
// lib/api/hooks/useMutation.ts
// lib/api/types.ts
```

### 4. **Modal/Dialog Component** ⭐⭐ (Medium Impact)

**Purpose**: Standardize all modal interactions.

**Features**:

- Customizable sizes
- Confirmation dialogs
- Form modals
- Loading states
- Keyboard shortcuts (ESC to close)
- Focus management
- Animation support

**Current Duplication**: Multiple modal implementations across pages

**Files**:

```typescript
// components/shared/Modal/Modal.tsx
// components/shared/Modal/ConfirmDialog.tsx
// components/shared/Modal/FormModal.tsx
```

### 5. **File Upload Component** ⭐⭐ (Medium Impact)

**Purpose**: Centralize file upload logic (currently duplicated in FileUploadSection).

**Features**:

- Drag and drop
- Multiple file support
- Progress tracking
- Image preview
- File type validation
- Size validation
- Upload to different tabs/categories
- HEIC conversion support

**Files**:

```typescript
// components/shared/FileUpload/FileUpload.tsx
// components/shared/FileUpload/FilePreview.tsx
// components/shared/FileUpload/UploadProgress.tsx
// lib/fileUpload/utils.ts
```

### 6. **Search Component** ⭐⭐ (Medium Impact)

**Purpose**: Unified search experience across entities.

**Features**:

- Debounced input
- Multi-entity search
- Recent searches
- Keyboard navigation
- Highlighted results
- Quick actions

**Current Usage**: Dashboard search can be extracted and reused

**Files**:

```typescript
// components/shared/Search/SearchInput.tsx
// components/shared/Search/SearchResults.tsx
// components/shared/Search/hooks/useSearch.ts
```

### 7. **Chart Components** ⭐⭐ (Medium Impact)

**Purpose**: Reusable chart wrappers with consistent styling.

**Features**:

- Bar, Line, Pie, Doughnut charts
- Responsive design
- Loading states
- Empty states
- Export chart as image
- Consistent color palette

**Current Usage**: Dashboard has chart logic that can be extracted

**Files**:

```typescript
// components/shared/Charts/BarChart.tsx
// components/shared/Charts/LineChart.tsx
// components/shared/Charts/PieChart.tsx
// components/shared/Charts/ChartWrapper.tsx
```

### 8. **Filter Component** ⭐ (Medium Impact)

**Purpose**: Advanced filtering for tables.

**Features**:

- Date range picker
- Multi-select filters
- Search filters
- Saved filter presets
- Clear all filters
- Filter badges

**Files**:

```typescript
// components/shared/Filter/FilterPanel.tsx
// components/shared/Filter/DateRangeFilter.tsx
// components/shared/Filter/MultiSelectFilter.tsx
```

### 9. **Status Badge Component** ⭐ (Low Impact)

**Purpose**: Consistent status display.

**Features**:

- Predefined color schemes
- Icon support
- Animated states
- Tooltip descriptions

**Files**:

```typescript
// components/shared/StatusBadge/StatusBadge.tsx
```

### 10. **Empty State Component** ⭐ (Low Impact)

**Purpose**: Consistent empty state design.

**Features**:

- Customizable icon/illustration
- Call-to-action button
- Helpful descriptions

**Files**:

```typescript
// components/shared/EmptyState/EmptyState.tsx
```

### 11. **Loading Component** ⭐ (Low Impact)

**Purpose**: Consistent loading states.

**Features**:

- Skeleton loaders
- Spinner variants
- Full-page loading
- Inline loading

**Files**:

```typescript
// components/shared/Loading/Skeleton.tsx
// components/shared/Loading/Spinner.tsx
// components/shared/Loading/PageLoader.tsx
```

### 12. **Notification/Toast System** ⭐ (Low Impact)

**Purpose**: Centralized notification system (currently using react-toastify).

**Features**:

- Success/Error/Warning/Info types
- Action buttons
- Auto-dismiss
- Persistent notifications
- Position control

**Current**: Already using `react-toastify` - wrap in custom component

**Files**:

```typescript
// components/shared/Notification/Toast.tsx
// lib/notification/useNotification.ts
```

---

## 📊 Component Reusability Priority Matrix

| Component        | Impact | Effort | Priority    |
| ---------------- | ------ | ------ | ----------- |
| Data Table       | High   | High   | ⭐⭐⭐ High |
| Form Builder     | High   | High   | ⭐⭐⭐ High |
| API Client       | High   | Medium | ⭐⭐⭐ High |
| File Upload      | Medium | Medium | ⭐⭐ Medium |
| Modal/Dialog     | Medium | Low    | ⭐⭐ Medium |
| Search Component | Medium | Medium | ⭐⭐ Medium |
| Chart Components | Medium | Low    | ⭐⭐ Medium |
| Filter Component | Medium | Medium | ⭐ Low      |
| Status Badge     | Low    | Low    | ⭐ Low      |
| Empty State      | Low    | Low    | ⭐ Low      |

---

## 🎯 Performance Optimization Recommendations

### 1. **Code Splitting**

```typescript
// Instead of:
import DashboardPage from "./page";

// Use dynamic imports for large pages:
const DashboardPage = dynamic(() => import("./page"), {
  loading: () => <PageLoader />,
  ssr: false, // if not needed
});
```

### 2. **Image Optimization**

```typescript
// Replace <img> with Next.js Image:
import Image from "next/image";

<Image
  src="/path/to/image.jpg"
  width={500}
  height={300}
  alt="Description"
  priority={false}
/>;
```

### 3. **Memo Heavy Components**

```typescript
// For expensive component renders:
const ExpensiveComponent = React.memo(
  ({ data }) => {
    // Complex rendering logic
  },
  (prevProps, nextProps) => {
    // Custom comparison
    return prevProps.data.id === nextProps.data.id;
  }
);
```

### 4. **Optimize Prisma Queries**

```typescript
// Bad - fetches all fields:
const projects = await prisma.project.findMany({
  where: { organization_id },
});

// Good - select only needed fields:
const projects = await prisma.project.findMany({
  where: { organization_id },
  select: {
    id: true,
    name: true,
    project_id: true,
    client: { select: { name: true } },
  },
});
```

### 5. **Database Indexing**

The schema already has good indexing, but consider adding:

- Composite indexes for frequent query combinations
- Covering indexes for common SELECT queries
- Index on `createdAt` for date-range queries

### 6. **React Query for Data Fetching**

```typescript
// Replace useState/useEffect patterns:
const { data, isLoading, error } = useQuery({
  queryKey: ["projects", organizationId],
  queryFn: () => fetchProjects(organizationId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

---

## 🏗️ Recommended Architecture Enhancements

### 1. **Service Layer Pattern**

Create a service layer between API routes and database:

```
lib/
  services/
    projectService.ts
    lotService.ts
    materialService.ts
```

**Benefits**:

- Business logic separation
- Easier testing
- Reusable across API routes
- Consistent error handling

### 2. **Repository Pattern for Database**

Abstract Prisma queries:

```
lib/
  repositories/
    projectRepository.ts
    userRepository.ts
```

**Benefits**:

- Easier to switch ORMs if needed
- Centralized query logic
- Better testability

### 3. **DTO (Data Transfer Objects)**

Define clear input/output types:

```
types/
  dto/
    project.dto.ts
    lot.dto.ts
```

**Benefits**:

- API contract definition
- Input validation
- Type safety

---

## 📁 Suggested Folder Structure

```
cabipro/
├── app/
│   ├── (auth)/          # Auth pages
│   ├── (marketing)/     # Public pages
│   ├── app/             # Protected app
│   └── admin/           # Admin area
├── components/
│   ├── shared/          # NEW: Reusable components
│   │   ├── DataTable/
│   │   ├── Form/
│   │   ├── Modal/
│   │   ├── FileUpload/
│   │   └── ...
│   ├── domain/          # NEW: Business domain components
│   │   ├── Project/
│   │   ├── Lot/
│   │   └── Material/
│   └── layout/          # Layout components
├── lib/
│   ├── api/             # NEW: API client
│   ├── services/        # NEW: Business logic
│   ├── repositories/    # NEW: Database access
│   ├── utils/           # NEW: Utility functions
│   └── ...
├── types/
│   ├── dto/             # NEW: Data transfer objects
│   ├── models/          # NEW: Domain models
│   └── api/             # NEW: API types
├── hooks/               # Custom React hooks
├── config/              # Configuration files
└── tests/               # NEW: Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 🔐 Security Recommendations

1. **Rate Limiting**: Add rate limiting to API routes
2. **Input Validation**: Use Zod/Yup for all API inputs
3. **CORS Configuration**: Properly configure CORS headers
4. **Environment Variables**: Review and secure all env vars
5. **SQL Injection**: Prisma protects against this, but validate inputs
6. **File Upload Validation**: Strict mime type and size validation
7. **CSRF Protection**: Implement CSRF tokens for forms
8. **Content Security Policy**: Add CSP headers

---

## 📈 Monitoring & Observability

### Recommended Tools

1. **Error Tracking**: Sentry or Rollbar
2. **Performance Monitoring**: Vercel Analytics or New Relic
3. **Logging**: Winston or Pino for structured logging
4. **Uptime Monitoring**: Pingdom or UptimeRobot
5. **Database Monitoring**: Prisma Studio + database-specific tools

---

## 🎓 Learning Resources for Team

### Next.js Best Practices

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)

### React Patterns

- [React Design Patterns](https://www.patterns.dev/react)
- [React Performance](https://react.dev/learn/render-and-commit)

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Type-Safe React](https://react-typescript-cheatsheet.netlify.app/)

### Prisma

- [Prisma Best Practices](https://www.prisma.io/docs/orm/prisma-client/best-practices)
- [Prisma Performance](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)

---

## 🚦 Getting Started (TODO: Add actual steps)

> **Note**: These sections need to be filled with actual project-specific information

### Prerequisites

- Node.js 20+
- MySQL 8.0+
- npm or yarn

### Installation

```bash
# Clone repository
git clone [repository-url]

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Environment Variables

Document all required environment variables here.

---

## 📝 Summary

CabiPro is a **well-architected, feature-rich SaaS application** with a solid foundation. The database design is **excellent**, the authentication system is **robust**, and the multi-tenant architecture is **properly implemented**.

### Key Takeaways

**Strengths**:

- ✅ Excellent database design with 23+ models
- ✅ Robust authentication and security
- ✅ Multi-tenant architecture
- ✅ Modern tech stack
- ✅ Comprehensive feature set

**Areas for Improvement**:

- ⚠️ Component reusability (high duplication)
- ⚠️ State management inconsistency
- ⚠️ Testing infrastructure missing
- ⚠️ API client abstraction needed
- ⚠️ Performance optimization opportunities

### Next Steps

1. **Immediate** (1-2 weeks):

   - Create shared DataTable component
   - Implement API client with React Query
   - Add basic unit tests
   - Update documentation

2. **Short-term** (1-2 months):

   - Build complete component library
   - Add E2E testing
   - Implement error tracking
   - Performance optimization

3. **Long-term** (3-6 months):
   - Cloud storage migration
   - Advanced monitoring
   - Comprehensive test coverage
   - Developer experience improvements

---

**Generated on**: January 14, 2026  
**Codebase Version**: 0.1.0  
**Analysis Scope**: Complete codebase review including database schema, API routes, components, and architecture
