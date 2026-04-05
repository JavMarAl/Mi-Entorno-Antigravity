---
name: fp-backend
description: "Functional programming patterns for Node.js/Deno backend development using fp-ts, ReaderTaskEither, and functional dependency injection"
risk: safe
source: community
date_added: "2026-03-11"
---

# fp-ts Backend Patterns

Functional programming patterns for building type-safe, testable backend services using `fp-ts`.

## Core Concepts

### ReaderTaskEither (RTE)
The `ReaderTaskEither<R, E, A>` type is the backbone:
- **R** (Reader): Dependencies (DB, config, logger).
- **E** (Either left): Error type.
- **A** (Either right): Success value.

## Service Layer Patterns

Structure services as modules exporting RTE functions:
- **Composition**: Use `pipe` and `flow` for clean logic chains.
- **Validation**: Integrate with Zod or io-ts for boundary validation.

## Functional Dependency Injection
- **Layered Container**: Build dependencies in layers (Config -> Infra -> Services).
- **AppDeps type**: Define a single type for all global dependencies.

## Database & Transactions
- **Prisma Wrappers**: Convert Prisma errors into Domain Errors.
- **withTransaction**: HOD (Higher Order Dependency) to wrap RTE functions in transactions.

## Middleware & Errors
- **Express/Hono Bridges**: Convert RTE handlers into standard middleware.
- **Typed Errors**: Use a tagged union for domain-specific error handling.

## Testing
- **Mocking**: Provide simple mock objects satisfying the dependency interfaces.
- **Property-based**: Use fast-check for validating domain logic invariants.

## Resources
- **lib/service-template.ts**: Boilerplate for a new functional service.
- **lib/deps-container.ts**: Pattern for dependency injection container.
- **lib/prisma-wrapper.ts**: Type-safe error handling for Prisma.
