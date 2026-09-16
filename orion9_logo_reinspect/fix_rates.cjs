const fs = require('fs');
let code = fs.readFileSync('src/services/FXRateService.ts', 'utf8');

const regex = /static async getRate\(base: string, quote: string\): Promise<FXRate \| null> \{[\s\S]*?catch \(e\) \{\s*console\.warn\(`Failed to fetch rate \$\{base\} -> \$\{quote\}`\, e\);\s*return cached \? cached\.data : null; \/\/ Return cached if available, else null\s*\}\s*\}/;

const newRate = `static async getRate(base: string, quote: string): Promise<FXRate | null> {
    if (base === quote) {
      return {
        base, quote, rate: 1, date: new Date().toISOString().split('T')[0], source: 'Direct', lastUpdated: Date.now()
      };
    }
    const cacheKey = \`\${CACHE_KEY_RATES}_\${base}_\${quote}\`;
    const cached = await this.getCachedItem<FXRate>(cacheKey);
    
    // Check if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return cached ? cached.data : null;
    }
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const params = new URLSearchParams({
        base: base,
        quotes: quote
      });

      const res = await fetch(\`\${API_BASE}/rates?\${params.toString()}\`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(\`API failed: \${res.status}\`);
      const data = await res.json();
      
      let rateObj: FXRate | null = null;
      
      if (Array.isArray(data) && data.length > 0) {
        // v2 structure: [{"date":"2026-09-08","base":"INR","quote":"USD","rate":0.01059}]
        const match = data.find((r: any) => r.base === base && r.quote === quote);
        if (match) {
          rateObj = {
            base,
            quote,
            rate: match.rate,
            date: match.date,
            source: 'Frankfurter',
            lastUpdated: Date.now()
          };
        }
      } else if (data && data.rates && data.rates[quote]) {
        // Fallback for some v1-style objects if returned
        rateObj = {
          base,
          quote,
          rate: data.rates[quote],
          date: data.date,
          source: 'Frankfurter',
          lastUpdated: Date.now()
        };
      }

      if (!rateObj) throw new Error('Rate not found in response');

      await this.setCachedItem(cacheKey, rateObj);
      return rateObj;
    } catch (e) {
      console.warn(\`Failed to fetch rate \${base} -> \${quote}\`, e);
      return cached ? cached.data : null; // Return cached if available, else null
    }
  }`;

code = code.replace(regex, newRate);
fs.writeFileSync('src/services/FXRateService.ts', code);
