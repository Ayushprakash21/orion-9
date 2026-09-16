# ORION-9 Login / Animation / Wallpaper Regression Repair

## Fixed
1. Restored SHUT DOWN control on User Login.
2. Restored SHUT DOWN control on Admin Login.
3. Both controls call the existing AuthContext `triggerShutdown` lifecycle; no duplicate shutdown implementation was introduced.
4. Restored the VVIP/live-wallpaper procedural globe/network implementation in the active root application.
5. Preserved the existing OrionBootSequence v2 and OrionWorldEntrySequence v2 cinematic flow rather than replacing them with an older animation.
6. Preserved existing authentication, admin role restrictions, autonomous operations, navigation, and manuals.

## Validation
- Static assertions: PASS
- Modified TS/TSX transpilation: see QA output
- No unrelated module deletion/replacement performed.
