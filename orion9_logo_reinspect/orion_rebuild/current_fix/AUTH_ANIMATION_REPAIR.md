ORION-9 AUTH + CINEMATIC ENTRY REPAIR
========================================
Source: latest user ZIP orion-9(5)(1).zip

Repairs:
1. User login portal now explicitly accepts only non-privileged roles.
   Platform Admin / Organization Admin credentials are rejected on /login.
2. Admin login continues to require platform_admin or organization_admin.
3. Replaced post-login animation with OrionWorldEntrySequence v2:
   - no white flash
   - no edge flash
   - no scale/zoom-in or scale/zoom-out
   - staged world/mesh/core/system-fabric construction
   - distinct visual treatment for user vs admin
   - quiet fade handoff to the destination
4. Replaced power-on initialization animation with OrionBootSequence v2:
   - no flash
   - no zoom
   - independent from post-login animation
   - progressive system/fabric/network construction
5. Synchronized the three duplicated source trees in current_fix so stale
   copies do not restore the previous login animation/auth behavior.

Validation:
- ZIP extracted successfully.
- New animation components contain no scale() transforms.
- User Login contains requiredRoles restriction.
- Admin Login retains requiredRoles restriction.
- TypeScript compiler was invoked, but dependency packages are not installed
  in this extracted ZIP; resulting diagnostics are missing-module errors,
  not validated source-level build errors.
