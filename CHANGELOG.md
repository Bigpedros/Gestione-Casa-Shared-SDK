# Changelog - `@gestione-casa/shared-sdk`

## [0.4.0] - 2026-08-08

### Added
- New activation contract module `@gestione-casa/shared-sdk/activation`.
- Added activation, validation, and deactivation request and response contracts and envelope builders.
- Added `SignedLicenseDocument` shared contract definitions.
- Implemented `buildCanonicalLicensePayloadV1` guaranteeing byte-level canonical payload compatibility with License Manager 2.6.A.
- Added envelope serialization, deserialization, and validator utilities (`ActivationValidator`).
- Added full Golden Vectors V1 contract tests (Vectors A, B, C, D) verifying byte lengths and SHA-256 hashes.
- Full browser safety with zero runtime dependencies.

## [0.3.0] - 2026-08-01
- Previous release with licensing, customers, and contact-requests modules.
