export interface SystemSettings {
  // Display & Experience
  theme?: 'dark';
  brightness?: number; // 20 - 100
  reducedMotion?: boolean;
  displayScale?: number; // Windows-style UI scale: 100, 125, 150, 175, 200
  textSize?: number; // Independent text size: 90 - 140%
  fontFamily?: 'ROBOTO' | 'LATO' | 'ARIAL';
  
  // Audio
  soundEnabled?: boolean;
  soundVolume?: number; // 0 - 100
  
  

  // Operational Thresholds
  criticalStockOutDays: number;
  lowStockDays: number;
  excessInventoryDays: number;
  supplierLowRiskThreshold: number;
  supplierHighRiskThreshold: number;
  supplierHighRiskOtif?: number; // alias for supplierHighRiskThreshold
  shipmentDelayAlertDays: number;
  supplierQualityThreshold: number;

  // Health Scoring Weights (%)
  healthWeightInventory: number;
  inventoryHealthWeight?: number; // alias
  healthWeightSuppliers: number;
  supplierHealthWeight?: number; // alias
  healthWeightShipments: number;
  logisticsHealthWeight?: number; // alias
  procurementHealthWeight: number;

  // Supplier Risk & Performance Weights
  supplierWeightOtif: number;
  supplierWeightQuality: number;
  supplierWeightLeadTime: number;
  supplierWeightRisk: number;

  // Demand & Forecast
  demandSpikeThreshold: number;

  // Localization
  currency: string;
  dateFormat: string;
  timezone: string;
  locale: string;
  numberFormat: string;
  applicationName: string;
  applicationTagline: string;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  theme: 'dark',
  brightness: 100,
  reducedMotion: false,
  displayScale: 100,
  textSize: 100,
  fontFamily: 'ROBOTO',
  soundEnabled: true,
  soundVolume: 75,
  
  
  criticalStockOutDays: 5,
  lowStockDays: 14,
  excessInventoryDays: 60,
  supplierLowRiskThreshold: 90,
  supplierHighRiskThreshold: 70,
  supplierHighRiskOtif: 70,
  shipmentDelayAlertDays: 2,
  supplierQualityThreshold: 90,
  healthWeightInventory: 30,
  inventoryHealthWeight: 30,
  healthWeightSuppliers: 25,
  supplierHealthWeight: 25,
  healthWeightShipments: 25,
  logisticsHealthWeight: 25,
  procurementHealthWeight: 20,
  supplierWeightOtif: 40,
  supplierWeightQuality: 30,
  supplierWeightLeadTime: 15,
  supplierWeightRisk: 15,
  demandSpikeThreshold: 1.5,
  currency: 'INR',
  dateFormat: 'DD MMM YYYY',
  timezone: 'Asia/Kolkata',
  locale: 'en-IN',
  numberFormat: 'standard',
  applicationName: 'ORION-9',
  applicationTagline: 'AI Supply Chain Operating System'
};

export function normalizeSettings(raw?: Partial<SystemSettings> | Record<string, any> | null): SystemSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS };
  }

  const crit = Number(raw.criticalStockOutDays);
  const low = Number(raw.lowStockDays);
  const excess = Number(raw.excessInventoryDays);
  const supLow = Number(raw.supplierLowRiskThreshold);
  const supHigh = Number(raw.supplierHighRiskThreshold ?? raw.supplierHighRiskOtif);
  const delay = Number(raw.shipmentDelayAlertDays);
  const qual = Number(raw.supplierQualityThreshold);

  const wInv = Number(raw.healthWeightInventory ?? raw.inventoryHealthWeight);
  const wSup = Number(raw.healthWeightSuppliers ?? raw.supplierHealthWeight);
  const wShip = Number(raw.healthWeightShipments ?? raw.logisticsHealthWeight);
  const wProc = Number(raw.procurementHealthWeight);

  const wOtif = Number(raw.supplierWeightOtif);
  const wQual = Number(raw.supplierWeightQuality);
  const wLead = Number(raw.supplierWeightLeadTime);
  const wRisk = Number(raw.supplierWeightRisk);

  const spike = Number(raw.demandSpikeThreshold);
  
  const currencyVal = (raw.currency && typeof raw.currency === 'string' && raw.currency.trim())
    ? raw.currency.trim()
    : DEFAULT_SETTINGS.currency;

  const validCrit = !isNaN(crit) && crit > 0 ? Math.round(crit) : DEFAULT_SETTINGS.criticalStockOutDays;
  const validLow = !isNaN(low) && low > 0 ? Math.round(low) : DEFAULT_SETTINGS.lowStockDays;
  const validExcess = !isNaN(excess) && excess > 0 ? Math.round(excess) : DEFAULT_SETTINGS.excessInventoryDays;
  
  const validSupLow = !isNaN(supLow) && supLow >= 0 ? Math.round(supLow) : DEFAULT_SETTINGS.supplierLowRiskThreshold;
  const validSupHigh = !isNaN(supHigh) && supHigh >= 0 ? Math.round(supHigh) : DEFAULT_SETTINGS.supplierHighRiskThreshold;
  const validDelay = !isNaN(delay) && delay >= 0 ? Math.round(delay) : DEFAULT_SETTINGS.shipmentDelayAlertDays;
  const validQual = !isNaN(qual) && qual >= 0 ? Math.round(qual) : DEFAULT_SETTINGS.supplierQualityThreshold;
  
  const validWInv = !isNaN(wInv) && wInv >= 0 ? Math.round(wInv) : DEFAULT_SETTINGS.healthWeightInventory;
  const validWSup = !isNaN(wSup) && wSup >= 0 ? Math.round(wSup) : DEFAULT_SETTINGS.healthWeightSuppliers;
  const validWShip = !isNaN(wShip) && wShip >= 0 ? Math.round(wShip) : DEFAULT_SETTINGS.healthWeightShipments;
  const validWProc = !isNaN(wProc) && wProc >= 0 ? Math.round(wProc) : DEFAULT_SETTINGS.procurementHealthWeight;

  const validWOtif = !isNaN(wOtif) && wOtif >= 0 ? Math.round(wOtif) : DEFAULT_SETTINGS.supplierWeightOtif;
  const validWQual = !isNaN(wQual) && wQual >= 0 ? Math.round(wQual) : DEFAULT_SETTINGS.supplierWeightQuality;
  const validWLead = !isNaN(wLead) && wLead >= 0 ? Math.round(wLead) : DEFAULT_SETTINGS.supplierWeightLeadTime;
  const validWRisk = !isNaN(wRisk) && wRisk >= 0 ? Math.round(wRisk) : DEFAULT_SETTINGS.supplierWeightRisk;

  const validSpike = !isNaN(spike) && spike > 0 ? Number(spike.toFixed(2)) : DEFAULT_SETTINGS.demandSpikeThreshold;

  // Display and Audio defaults
  const validDisplayScale = [100,125,150,175,200].includes(Number(raw.displayScale)) ? Number(raw.displayScale) : DEFAULT_SETTINGS.displayScale;
  const validTextSize = [90,100,110,120,130,140].includes(Number(raw.textSize)) ? Number(raw.textSize) : DEFAULT_SETTINGS.textSize;
  const validFontFamily = ['ROBOTO','LATO','ARIAL'].includes(String(raw.fontFamily).toUpperCase()) ? String(raw.fontFamily).toUpperCase() as SystemSettings['fontFamily'] : DEFAULT_SETTINGS.fontFamily;

  const validBrightness = raw.brightness !== undefined && !isNaN(Number(raw.brightness)) 
    ? Math.max(20, Math.min(100, Number(raw.brightness))) 
    : DEFAULT_SETTINGS.brightness;
    
   
     
    

  return {
    criticalStockOutDays: validCrit,
    lowStockDays: validLow,
    excessInventoryDays: validExcess,
    supplierLowRiskThreshold: validSupLow,
    supplierHighRiskThreshold: validSupHigh,
    supplierHighRiskOtif: validSupHigh,
    shipmentDelayAlertDays: validDelay,
    supplierQualityThreshold: validQual,
    healthWeightInventory: validWInv,
    inventoryHealthWeight: validWInv,
    healthWeightSuppliers: validWSup,
    supplierHealthWeight: validWSup,
    healthWeightShipments: validWShip,
    logisticsHealthWeight: validWShip,
    procurementHealthWeight: validWProc,
    supplierWeightOtif: validWOtif,
    supplierWeightQuality: validWQual,
    supplierWeightLeadTime: validWLead,
    supplierWeightRisk: validWRisk,
    demandSpikeThreshold: validSpike,
    currency: currencyVal,
    dateFormat: raw.dateFormat || DEFAULT_SETTINGS.dateFormat,
    timezone: raw.timezone || DEFAULT_SETTINGS.timezone,
    locale: raw.locale || DEFAULT_SETTINGS.locale,
    numberFormat: raw.numberFormat || DEFAULT_SETTINGS.numberFormat,
    applicationName: raw.applicationName || DEFAULT_SETTINGS.applicationName,
    applicationTagline: raw.applicationTagline || DEFAULT_SETTINGS.applicationTagline,
    
    theme: 'dark', // Force dark theme
    brightness: validBrightness as number,
    displayScale: validDisplayScale,
    textSize: validTextSize,
    fontFamily: validFontFamily,
    reducedMotion: raw.reducedMotion !== undefined ? !!raw.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
    
    
  };
}

export const DEFAULT_SYSTEM_SETTINGS = DEFAULT_SETTINGS;
