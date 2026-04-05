---
name: database-migration
description: "Execute database migrations across ORMs and platforms with zero-downtime strategies, data transformation, and rollback procedures. Use when migrating databases, changing schemas, performing data transformations, or implementing deployments."
risk: unknown
source: community
date_added: "2026-02-27"
---

# Database Migration

Master database schema and data migrations across ORMs (Sequelize, TypeORM, Prisma), including rollback strategies and zero-downtime deployments.

## Use this skill when

- Migrating between different ORMs
- Performing schema transformations
- Moving data between databases
- Implementing rollback procedures
- Zero-downtime deployments
- Database version upgrades
- Data model refactoring

## ORM Quick Reference

### Sequelize
- **Run**: `npx sequelize-cli db:migrate`
- **Rollback**: `npx sequelize-cli db:migrate:undo`

### TypeORM
- **Run**: `npm run typeorm migration:run`
- **Rollback**: `npm run typeorm migration:revert`

### Prisma
- **Generate**: `npx prisma migrate dev --name <name>`
- **Apply**: `npx prisma migrate deploy`

## Zero-Downtime Strategy (Expand-Contract)

1. **Phase 1 (Expand)**: Add new column/table. Database supports both old and new code.
2. **Phase 2 (Double Write)**: Deploy code that writes to BOTH old and new locations.
3. **Phase 3 (Backfill)**: Copy existing data from old to new.
4. **Phase 4 (Switch)**: Deploy code that READS from the new location.
5. **Phase 5 (Contract)**: Remove old column/table.

## Best Practices

1. **Always Provide Rollback**: Every `up()` needs a `down()`.
2. **Use Transactions**: Ensure migrations are atomic.
3. **Backup First**: Never migrate without a fresh snapshot.
4. **Test on Staging**: Mirror production data volume if possible.
5. **Idempotency**: Migrations should be safe to run multiple times.

## Resources

- **references/orm-switching.md**: ORM migration guides.
- **references/rollback-strategies.md**: Rollback procedures.
- **assets/schema-migration-template.sql**: SQL templates.
- **scripts/test-migration.sh**: Testing utilities.
