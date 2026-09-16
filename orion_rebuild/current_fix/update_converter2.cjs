const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsCurrencyConverter.tsx', 'utf8');

code = code.replace(/interface SettingsCurrencyConverterProps \{/g, `interface SettingsCurrencyConverterProps {\n  defaultCurrency?: string;`);

code = code.replace(/export const SettingsCurrencyConverter: React\.FC<SettingsCurrencyConverterProps> = \(\{ currencyOptions \}\) => \{/g, `export const SettingsCurrencyConverter: React.FC<SettingsCurrencyConverterProps> = ({ currencyOptions, defaultCurrency = 'INR' }) => {`);

code = code.replace(/const \[sourceCurrency, setSourceCurrency\] = useState<string>\('INR'\);/g, `const [sourceCurrency, setSourceCurrency] = useState<string>(defaultCurrency);
  useEffect(() => {
    if (defaultCurrency && sourceCurrency === 'INR' && defaultCurrency !== 'INR') {
      setSourceCurrency(defaultCurrency);
    }
  }, [defaultCurrency]);`);

fs.writeFileSync('src/components/SettingsCurrencyConverter.tsx', code);
