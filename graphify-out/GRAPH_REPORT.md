# Codebase Architectural Report

> **Auto-generated** by graphify knowledge graph analysis  
> **Purpose**: Dependency map, connection analysis, subsystem breakdown, and quality hotspots.

---

## 1. Executive Summary

- **Total Components**: `199`
- **Total Connections**: `255`
- **Subsystem Modules**: `1`
- **Dependency Types**: `9`

**Key Architectural Hubs:**

| # | Component | File | Type | Connections |
|---|-----------|------|------|-------------|
| 1 | `app.ts` | `backend/src/app.ts` | file | 19 |
| 2 | `compilerOptions` | `frontend/tsconfig.json` | function | 15 |
| 3 | `devDependencies` | `backend/package.json` | function | 12 |
| 4 | `authService.ts` | `backend/src/auth/authService.ts` | file | 12 |
| 5 | `auth.service.test.ts` | `backend/tests/auth.service.test.ts` | file | 11 |
| 6 | `authRouter.ts` | `backend/src/auth/authRouter.ts` | file | 10 |
| 7 | `compilerOptions` | `backend/tsconfig.json` | function | 10 |
| 8 | `devDependencies` | `frontend/package.json` | function | 10 |

---

## 2. Dependency & Connection Analysis

### Relationship Types

| Relationship | Count | Share |
|-------------|-------|-------|
| `contains` | 119 | 47% |
| `imports` | 62 | 24% |
| `imports_from` | 29 | 11% |
| `calls` | 13 | 5% |
| `extends` | 12 | 5% |
| `method` | 8 | 3% |
| `conceptually_related_to` | 6 | 2% |
| `references` | 4 | 2% |
| `indirect_call` | 2 | 1% |

### Hub Dependency Diagram

```mermaid
flowchart TD
    backend_src_app["app.ts"]
    frontend_tsconfig_compileroptions["compilerOptions"]
    backend_package_devdependencies["devDependencies"]
    backend_src_auth_authservice["authService.ts"]
    backend_tests_auth_service_test["auth.service.test.ts"]
    backend_src_auth_authrouter["authRouter.ts"]
    backend_tsconfig_compileroptions["compilerOptions"]
    frontend_package_devdependencies["devDependencies"]
    backend_src_app <--> backend_src_auth_authrouter
    backend_src_app <--> backend_src_auth_authservice
    backend_src_auth_authrouter <--> backend_src_auth_authservice
    backend_src_auth_authservice <--> backend_tests_auth_service_test
```

### Most Connected Pairs

| Component A | Component B | Shared Connections |
|-------------|-------------|-------------------|
| `build` | `scripts` | 2 |
| `dev` | `scripts` | 2 |
| `scripts` | `start` | 2 |
| `scripts` | `test` | 2 |
| `@types/node` | `devDependencies` | 2 |
| `devDependencies` | `typescript` | 2 |
| `devDependencies` | `vitest` | 2 |
| `@types/node` | `@types/node` | 2 |
| `typescript` | `typescript` | 2 |
| `vitest` | `vitest` | 2 |

---

## 3. Subsystem & Module Breakdown

### 3.1 backend/package.json
**Nodes**: `199`  
**Files**: `backend/package.json`, `backend/src/app.ts`, `backend/src/auth/authRouter.ts`, `backend/src/auth/authService.ts`, `backend/src/auth/sessionService.ts`, `backend/src/auth/userRepository.ts` +21 more

| Component | Type | File | Connections |
|-----------|------|------|-------------|
| `app.ts` | file | `backend/src/app.ts` | 19 |
| `compilerOptions` | function | `frontend/tsconfig.json` | 15 |
| `devDependencies` | function | `backend/package.json` | 12 |
| `authService.ts` | file | `backend/src/auth/authService.ts` | 12 |
| `auth.service.test.ts` | file | `backend/tests/auth.service.test.ts` | 11 |
| `authRouter.ts` | file | `backend/src/auth/authRouter.ts` | 10 |
| `compilerOptions` | function | `backend/tsconfig.json` | 10 |
| `devDependencies` | function | `frontend/package.json` | 10 |
| `createApp()` | method | `backend/src/app.ts` | 9 |
| `auth.api.test.ts` | file | `backend/tests/auth.api.test.ts` | 9 |


---

## 4. API Reference

Public classes and functions by subsystem.

### backend/package.json

| Name | Type | File | Connections |
|------|------|------|-------------|
| `compilerOptions` | function | `frontend/tsconfig.json` | 15 |
| `devDependencies` | function | `backend/package.json` | 12 |
| `compilerOptions` | function | `backend/tsconfig.json` | 10 |
| `devDependencies` | function | `frontend/package.json` | 10 |
| `dependencies` | function | `backend/package.json` | 8 |
| `UserRepository` | class | `backend/src/auth/userRepository.ts` | 8 |
| `SessionService` | class | `backend/src/auth/sessionService.ts` | 7 |
| `LoginForm.tsx` | class | `frontend/components/LoginForm.tsx` | 7 |

---

## 5. Code Quality & Architectural Risk Hotspots

### Component Type Distribution

| Type | Count | Share |
|------|-------|-------|
| function | 134 | 67% |
| class | 25 | 13% |
| method | 22 | 11% |
| file | 18 | 9% |

### High-Connectivity Hotspots

**1** component(s) with >15 connections:

| Component | File | Connections |
|-----------|------|-------------|
| `app.ts` | `backend/src/app.ts` | 19 |

### Dependency Cycles

**66** circular dependency loop(s) detected:

| # | Cycle Path |
|---|-----------|
| 1 | `frontend_components_loginform → frontend_components_loginform_loginform → frontend_tests_auth_test` |
| 2 | `frontend_components_loginform → frontend_app_login_page → frontend_components_loginform_loginform` |
| 3 | `frontend_lib_api → frontend_lib_api_requestlogin → frontend_components_loginform` |
| 4 | `frontend_lib_api → frontend_lib_api_readapierror → frontend_lib_api_requestlogin` |
| 5 | `frontend_components_otpform → frontend_lib_api_verifyotp → frontend_lib_api_readapierror → frontend_lib_api_requestlogin → frontend_components_loginform` |
| 6 | `frontend_lib_api → frontend_lib_api_verifyotp → frontend_lib_api_readapierror` |
| 7 | `frontend_components_otpform → frontend_lib_api → frontend_components_loginform` |
| 8 | `frontend_components_otpform → frontend_components_otpform_otpform → frontend_components_loginform` |
| 9 | `frontend_package_devdependencies_types_node → backend_package_json_types_node → backend_package_devdependencies_types_node → backend_package_devdependencies → backend_package_devdependencies_typescript → backend_package_json_typescript → frontend_package_devdependencies_typescript → frontend_package_devdependencies` |
| 10 | `backend_tests_auth_service_test → backend_src_db_migrations_runmigrations → backend_tests_auth_service_test_buildservice` |

### Orphaned Components

**2** isolated node(s) with no connections:

| Component | File |
|-----------|------|
| `auth.spec.ts` | `e2e/auth.spec.ts` |
| `vitest.config.ts` | `frontend/vitest.config.ts` |

---

## 6. How to Navigate

1. **Interactive D3 Map** — open `graph.html` to explore node connections visually.
2. **Knowledge Graph Queries** — use MCP tools (`graph_query`, `graph_explain_node`, `graph_impact_radius`).
