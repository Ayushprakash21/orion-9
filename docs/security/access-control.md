# Access Control & Security Rules

## Cloud Firestore Security Rules
All database access is governed by `firestore.rules`. Sample enforcement:
```javascript
match /purchase_orders/{poId} {
  allow read: if request.auth != null && request.auth.token.tenantId == resource.data.tenantId;
  allow create: if request.auth != null && request.auth.token.tenantId == request.resource.data.tenantId
                && request.auth.token.role in ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'SCM_OPERATOR'];
  allow update, delete: if request.auth != null && request.auth.token.role == 'PLATFORM_ADMIN';
}
```
