from pathlib import Path
p=Path('src/components/layout/AccountMenu.tsx')
s=p.read_text()
assert s.count('Admin Panel') == 1
admin_idx=s.index('Admin Panel')
assert '{isAdmin && (' in s[:admin_idx]
assert 'navigate(\'/admin\')' in s[admin_idx:admin_idx+300]
assert 'navigate(\'/admin-login\')' not in s
assert 'Organization' not in s
print('PASS: user account menu has no Admin Panel/Organization; admin panel is admin-gated.')
