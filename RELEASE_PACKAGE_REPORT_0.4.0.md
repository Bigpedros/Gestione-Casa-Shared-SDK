# Release Package Report - `@gestione-casa/shared-sdk` v0.4.0

**Date**: 2026-08-08
**Release Phase**: FASE 2.6.B1 - Pubblicazione Ufficiale

## Package Metadata
- **Package Name**: `@gestione-casa/shared-sdk`
- **Version**: `0.4.0`
- **TGZ Filename**: `gestione-casa-shared-sdk-0.4.0.tgz`
- **File Size**: 35,993 bytes (36.0 kB)
- **SHA-256 Hash**: `42ed3262569663d1596094f4886069859b02bdc6c45410f66bc7180adb77e6e0`
- **Total Files**: 111
- **Unpacked Size**: 220.2 kB
- **Runtime Dependencies**: 0 (zero runtime dependencies)

## Core Capabilities & Activation Contract
- **New Activation Module**: `@gestione-casa/shared-sdk/activation`
- **Signed License Document Contract**: `SignedLicenseDocument` shared contract definitions
- **Canonical Payload V1**: Byte-compatible with License Manager 2.6.A (`buildCanonicalLicensePayloadV1`)
- **Validation & Serialization**: Activation, Validation, and Deactivation requests and responses with Ed25519 signatures
- **Browser Safety**: Fully browser-safe runtime, zero Node.js native standard library dependencies in production code

## Golden Vector V1 Verification Results
- **Golden Vector A**:
  - Bytes (UTF-8): 301
  - Canonical String: `{"checksum":"8","customerId":"CUS-GOLDEN-001","deviceId":"DEV-GOLDEN-001","engineVersion":"2.1","expiresAt":"2027-12-31T23:59:59.000Z","generatedAt":"2026-01-01T10:00:00.000Z","id":"LIC-GOLDEN-001","licenseCode":"A1B2-C3D4-E5F6-G7H8","licenseType":"Professional","schemaVersion":1,"status":"assigned"}`
  - SHA-256: `072d4bf56f2f468ab719279224c14f2ebb3369847082a23e40c36d21a525e24f` -> **PASS**
- **Golden Vector B**:
  - Bytes (UTF-8): 287
  - SHA-256: `36b4fd320af4220610b126511e2625c692f5fb6b9e1ede0e9b9f217e1484e17c` -> **PASS**
- **Golden Vector C**:
  - Bytes (UTF-8): 308
  - SHA-256: `7f7f0629bb566dca82ee68a6b7cb0165fc4c1810761ec1e0cd8575cc212afa3f` -> **PASS**
- **Golden Vector D**:
  - Bytes (UTF-8): 267
  - SHA-256: `265e1051c8cad71a46ec3a584a17c7a387b47fd6b144d74653f9908577f7da21` -> **PASS**

## Quality Gate Summary
- **Typecheck**: PASS
- **Build**: PASS
- **Unit & Contract Tests**: 82 / 82 PASS
- **Pack Check**: PASS
- **Security Scan**: PASS (0 secrets, 0 private keys)
