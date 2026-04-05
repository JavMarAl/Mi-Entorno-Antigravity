---
name: frontend-dev-guidelines
description: "Opinionated frontend development standards for modern React + TypeScript applications. Covers Suspense-first data fetching, lazy loading, feature-based architecture, MUI v7 styling, and TanStack Router."
risk: safe
source: community
date_added: "2026-03-11"
---

# Frontend Development Guidelines

**(React · TypeScript · Suspense-First · Production-Grade)**

Build scalable, predictable, and maintainable React applications using strict architectural and performance standards.

## 1. Frontend Feasibility & Complexity Index (FFCI)
Assess feasibility before implementation. 
`FFCI = (Architectural Fit + Reusability + Performance) − (Complexity + Maintenance Cost)`
- **10–15**: Proceed
- **6–9**: Acceptable
- **3–5**: Risky
- **≤ 2**: Redesign

## 2. Core Architectural Doctrine
- **Suspense is Default**: Use `useSuspenseQuery`. No early-return spinners or `isLoading` flags.
- **Lazy Load Everything**: Routes, heavy features, charts, and large dialogs.
- **Feature-Based Organization**: Logic lives in `features/`, primitives in `components/`. No cross-feature coupling.
- **Strict TypeScript**: No `any`, explicit return types, `import type` always.

## 3. Implementation Workflow
1. **Define Interface**: Types first.
2. **API Layer**: Isolate fetching in `features/{feature}/api/`.
3. **Component Structure**: Props -> Hooks -> Derived -> Handlers -> Render.
4. **Safety**: Wrap in `<SuspenseLoader>` and error boundaries.

## 4. Best Practices
- **MUI v7**: Use `sx` for <100 lines, `{Component}.styles.ts` for larger. Use new `Grid` size syntax.
- **Performance**: `useMemo`/`useCallback` for expensive derivations/handlers. Cleanup effects.
- **Feedback**: Use `useMuiSnackbar` for standardized notifications.

## Resources
- **templates/component-template.tsx**: Canonical React.FC structure.
- **docs/ffci-calculator.md**: Guided tool for assessing feature feasibility.
