const fs = require('fs');
let code = fs.readFileSync('src/components/DataCenter.tsx', 'utf8');

// We need to add state for manual entity selection if detection fails
const stateInsertPos = code.indexOf('const [importPreview');
code = code.substring(0, stateInsertPos) + 
`  const [manualEntitySelection, setManualEntitySelection] = useState<{ rawData: any[], headers: string[], filename: string } | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
` + code.substring(stateInsertPos);

// Then update handleFileUpload
const handleFileUploadReplace = `  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setStatusMsg({ message: 'Parsing file...', type: 'info' });
    
    try {
      const rawData = await DataImporter.parseFile(file);
      if (rawData.length === 0) throw new Error('File is empty.');
      
      const headers = Object.keys(rawData[0]);
      const entityType = DataImporter.detectEntityType(headers);
      
      if (entityType === 'unknown') {
        setManualEntitySelection({ rawData, headers, filename: file.name });
        setStatusMsg({ message: 'Entity type could not be detected automatically.', type: 'info' });
      } else {
        processImportData(rawData, entityType, file.name);
      }
    } catch (error: any) {
      setStatusMsg({ message: \`Failed to read file: \${error.message}\`, type: 'error' });
    } finally {
      setIsImporting(false);
      if (event.target) event.target.value = ''; // Reset input
    }
  };

  const processImportData = (rawData: any[], entityType: string, filename: string) => {
    let parsed: { valid: any[], errors: any[] } = { valid: [], errors: [] };
    
    if (entityType === 'inventory') parsed = DataImporter.normalizeInventory(rawData);
    else if (entityType === 'suppliers') parsed = DataImporter.normalizeSuppliers(rawData);
    else if (entityType === 'purchaseOrders') parsed = DataImporter.normalizePurchaseOrders(rawData);
    else if (entityType === 'shipments') parsed = DataImporter.normalizeShipments(rawData);
    else if (entityType === 'products') parsed = DataImporter.normalizeProducts(rawData);
    else if (entityType === 'warehouses') parsed = DataImporter.normalizeWarehouses(rawData);
    else throw new Error('Unknown entity type.');
    
    setImportPreview({
      entityType,
      filename,
      validData: parsed.valid,
      errors: parsed.errors,
      headers: Object.keys(rawData[0])
    });
    setManualEntitySelection(null);
    setStatusMsg(null);
  };
  
  const handleManualEntityConfirm = () => {
    if (!manualEntitySelection || !selectedEntityType) return;
    processImportData(manualEntitySelection.rawData, selectedEntityType, manualEntitySelection.filename);
  };`;

// replace old handleFileUpload
const uploadStart = code.indexOf('const handleFileUpload = async');
const uploadEnd = code.indexOf('const confirmImport = async', uploadStart);
code = code.substring(0, uploadStart) + handleFileUploadReplace + '\n\n  ' + code.substring(uploadEnd);

// update import preview type
code = code.replace(`errors: any[];
  } | null>(null);`, `errors: any[];
    headers: string[];
  } | null>(null);`);

fs.writeFileSync('src/components/DataCenter.tsx', code);
