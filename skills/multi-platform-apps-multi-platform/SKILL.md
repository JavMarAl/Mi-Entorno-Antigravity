---
name: multi-platform-apps-multi-platform
description: "Build and deploy the same feature consistently across web, mobile, and desktop platforms using API-first architecture and parallel implementation strategies."
risk: safe
source: community
date_added: "2026-03-11"
---

# Multi-Platform Feature Development Workflow

Build and deploy features consistently across web, mobile, and desktop platforms using API-first architecture and parallel implementation strategies.

## Workflow Phases

### Phase 1: Architecture and API Design
1. **Define API Contracts**: Create OpenAPI/GraphQL specs with a focus on shared data models.
2. **Design System**: Establish UI/UX consistency across Material Design, iOS HIG, and Fluent patterns.
3. **Shared Business Logic**: Design platform-agnostic domain models and state management (e.g., KMP or shared TS).

### Phase 2: Parallel Implementation
- **Web**: React 18+ / Next.js 14+ with Tailwind CSS.
- **iOS**: SwiftUI with async/await and Core Data/SwiftData.
- **Android**: Jetpack Compose (Material 3) with Kotlin Flow and Room.
- **Desktop**: Tauri 2.0 or Electron leveraging web components and native OS integration.

### Phase 3: Integration and Validation
1. **API Documentation**: Interactive Swagger/SDK examples and platform integration guides.
2. **Cross-Platform Testing**: Functional parity matrix, UI consistency, and performance benchmarks.
3. **Platform Optimizations**: Bundle size, launch time, memory usage, and battery life tuning while maintaining parity.

## Success Criteria
- API contract validated before implementation.
- Feature parity across platforms with <5% variance.
- Accessibility standards met (WCAG 2.2 AA).
- Code reuse >40% where applicable.
- Platform-native look and feel preserved.

## Resources
- **resources/implementation-playbook.md**: Detailed guides for each platform stack.
- **resources/cross-platform-checklists.md**: Verification steps for feature parity and parity matrix.
- **templates/**: Boilerplate configurations for cross-platform project synchronization.
