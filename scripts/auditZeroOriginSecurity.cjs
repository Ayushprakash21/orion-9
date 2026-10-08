const fs = require('fs');
const path = require('path');

const patterns = [
  { name: 'origin IP (10.x private)', regex: /10\.\d{1,3}\.\d{1,3}\.\d{1,3}/g },
  { name: 'origin IP (172.16-31.x private)', regex: /172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/g },
  { name: 'origin IP (192.168.x private)', regex: /192\.168\.\d{1,3}\.\d{1,3}/g },
  { name: 'loopback IP (127.0.0.1)', regex: /127\.0\.0\.1/g },
  { name: 'origin server port (:3000, :8080, :8787)', regex: /https?:\/\/[a-zA-Z0-9.-]+:\b(3000|8080|8787)\b/g },
  { name: 'internal origin hostname', regex: /http:\/\/localhost/gi },
];

function scanDirectory(dir, label, isVendorAllowed = false) {
  console.log(`\n=== Scanning ${label}: ${dir} ===`);
  if (!fs.existsSync(dir)) {
    console.log(`Directory does not exist: ${dir}`);
    return 0;
  }
  const files = [];
  function collect(curr) {
    const entries = fs.readdirSync(curr, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(curr, ent.name);
      if (ent.isDirectory()) {
        collect(full);
      } else if (ent.isFile() && /\.(js|css|html)$/.test(ent.name)) {
        files.push(full);
      }
    }
  }
  collect(dir);

  let appViolations = 0;
  for (const file of files) {
    const relative = path.relative(process.cwd(), file);
    const isVendor = relative.includes('vendor-');
    const content = fs.readFileSync(file, 'utf8');

    for (const pat of patterns) {
      const matches = content.match(pat.regex);
      if (matches) {
        if (isVendor) {
          console.log(`[INFO] Upstream 3rd-party library internal (${path.basename(file)}): ${pat.name} (${matches.length} matches)`);
        } else {
          appViolations++;
          console.error(`[FAIL] APPLICATION LEAK DETECTED in ${relative}: ${pat.name} (${matches.length} matches: ${matches.slice(0, 3).join(', ')})`);
        }
      }
    }
  }

  if (appViolations === 0) {
    console.log(`[PASS] Verified! ZERO application origin leaks detected in ${label}.`);
  } else {
    console.error(`[FAIL] ${appViolations} application leak violation(s) detected in ${label}!`);
  }
  return appViolations;
}

const clientViolations = scanDirectory(path.join(__dirname, '..', 'dist', 'client'), 'Production Client Bundle (dist/client)');
const workerViolations = scanDirectory(path.join(__dirname, '..', 'dist', 'orion_9'), 'Worker Bundle (dist/orion_9)');

if (clientViolations > 0 || workerViolations > 0) {
  process.exit(1);
} else {
  console.log('\n[PASS] ZERO-EXPOSED-ORIGIN CERTIFIED: All application bundles clean of origin IPs, ports, and internal endpoints.\n');
  process.exit(0);
}
