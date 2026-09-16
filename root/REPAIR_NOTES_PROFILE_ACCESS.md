# ORION-9 USER PROFILE ACCESS REPAIR

Fixed in this build:
- Account Menu -> Profile now opens the `profile` application instead of the Settings application.
- Removed the duplicate user-side Admin Panel menu item.
- User Profile supports editing full name, display name, job title, department, phone, profile picture, and profile organization name.
- Profile picture upload rejects files over 5 MB.
- Email is write-once in the user profile UI: if an email already exists it is displayed locked; if it is blank, the user can enter it once and save it.
- Profile and organization application mappings were preserved.

No existing application registry IDs or routes were removed.
