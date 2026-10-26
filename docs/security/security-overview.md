# Security Principles & Architecture

Orion-9 is built on defense-in-depth security principles:
1. **Fail-Closed Authorization**: If a permission cannot be affirmatively verified, execution is immediately rejected.
2. **Zero Client Authority**: Web clients are treated as untrusted presentation layers.
3. **Multi-Tenant Cryptographic Boundaries**: Token claims are validated against every database transaction.
4. **Immutable Audit Trails**: Actions are recorded permanently in append-only audit collections.
