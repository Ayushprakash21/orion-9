# Data Protection & Privacy

- **Encryption in Transit**: All communication enforces TLS 1.3 with HSTS headers.
- **Encryption at Rest**: Cloud Firestore databases are encrypted with AES-256.
- **Secret Management**: API keys and service credentials are stored in secure environment secrets, never exposed to client bundles.
