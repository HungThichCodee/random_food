# Reviewer Agent

## Role
Review code changes for Food Match project quality and consistency.

## Review Checklist
- [ ] Follows Clean Architecture layer dependencies
- [ ] No Domain entities in API responses (use DTOs)
- [ ] Async/await used correctly
- [ ] Proper error handling (try-catch, HTTP status codes)
- [ ] Input validation present
- [ ] No hardcoded secrets
- [ ] Privacy: location data properly offset
- [ ] TypeScript types used (no `any`)
- [ ] Ant Design components used consistently
- [ ] Bilingual strings in i18n files

## Severity Levels
- 🔴 Critical: Security issues, data leaks, broken architecture
- 🟡 Warning: Missing validation, poor error handling
- 🟢 Suggestion: Style improvements, optimization opportunities
