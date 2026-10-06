/**
 * ORION-9 COPILOT PROMPT GALLERY & CONTEXTUAL FOLLOW-UP SYSTEM
 *
 * Centralized, reusable prompt configurations, category galleries,
 * and intelligent contextual follow-up prompt generators.
 */

export interface CopilotPrompt {
  id: string;
  category: PromptCategoryKey;
  text: string;
  description?: string;
}

export type PromptCategoryKey =
  | 'CONTROL TOWER'
  | 'INVENTORY'
  | 'PROCUREMENT'
  | 'SUPPLIERS'
  | 'SHIPMENTS'
  | 'EXCEPTIONS'
  | 'DECISIONS'
  | 'FORECAST'
  | 'TRANSPORTATION';

export interface PromptCategory {
  key: PromptCategoryKey;
  label: string;
  description: string;
  prompts: string[];
}

export const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    key: 'CONTROL TOWER',
    label: 'Control Tower',
    description: 'Executive summaries, enterprise risk, and priority overviews',
    prompts: [
      'What needs attention right now?',
      'Give me an executive summary of the current operation.',
      'What are the highest-priority operational risks?',
      'What should I investigate next?'
    ]
  },
  {
    key: 'INVENTORY',
    label: 'Inventory',
    description: 'Stockout risks, safety stock variances, and inventory health',
    prompts: [
      'What is the current inventory position?',
      'Show current inventory risks.',
      'Which SKUs are below safety stock?',
      'Identify potential stockouts.',
      'Analyze inventory optimization opportunities.',
      'Which inventory items require immediate attention?'
    ]
  },
  {
    key: 'PROCUREMENT',
    label: 'Procurement',
    description: 'Purchase orders, lead time delays, and purchasing exposure',
    prompts: [
      'Show overdue purchase orders.',
      'Which POs require intervention?',
      'Analyze procurement exposure.',
      'Which suppliers are causing procurement risk?'
    ]
  },
  {
    key: 'SUPPLIERS',
    label: 'Suppliers',
    description: 'Vendor OTIF metrics, rating scorecards, and defect rates',
    prompts: [
      'How are suppliers performing?',
      'Show supplier performance.',
      'Which suppliers require attention?',
      'Compare supplier performance.',
      'Identify supplier risks.'
    ]
  },
  {
    key: 'SHIPMENTS',
    label: 'Shipments',
    description: 'Inbound freight status, carrier delays, and logistics corridors',
    prompts: [
      'Show delayed shipments.',
      'Which shipments are at risk?',
      'Analyze inbound logistics risk.',
      'Which shipments require intervention?'
    ]
  },
  {
    key: 'EXCEPTIONS',
    label: 'Exceptions',
    description: 'Critical operational alerts, variances, and financial exposure',
    prompts: [
      'Show active exceptions.',
      'Which exceptions are critical?',
      'Prioritize current exceptions.',
      'Explain exception root causes.'
    ]
  },
  {
    key: 'DECISIONS',
    label: 'Decisions',
    description: 'Pending operational decisions staged for authorized action',
    prompts: [
      'What decisions are pending?',
      'Show decisions awaiting review.',
      'Which decisions need immediate attention?',
      'Prioritize pending decisions.'
    ]
  },
  {
    key: 'FORECAST',
    label: 'Demand Forecast',
    description: '30-day projected demand, uncertainty, and baseline trends',
    prompts: [
      'What is the demand forecast?',
      'Show current demand forecasts.',
      'Identify forecast risks.',
      'Which products have demand uncertainty?'
    ]
  },
  {
    key: 'TRANSPORTATION',
    label: 'Transportation',
    description: 'Route optimization, carrier bottlenecks, and transit plans',
    prompts: [
      'Show current transportation risks.',
      'Identify transportation bottlenecks.',
      'Analyze transportation plans.'
    ]
  }
];

/**
 * Returns initial quick prompt chips to display under the Copilot input field
 */
export const getQuickPrompts = (): string[] => [
  'What needs attention right now?',
  'Which SKUs are below safety stock?',
  'Show delayed shipments',
  'Which POs are overdue?',
  'How are suppliers performing?',
  'What decisions are pending?'
];

/**
 * Dynamically generates 2-4 contextually relevant follow-up prompts
 * based on the topic and content of the last assistant response.
 */
export const getContextualFollowUps = (lastResponseText?: string, lastPrompt?: string): string[] => {
  if (!lastResponseText && !lastPrompt) {
    return [
      'What needs attention right now?',
      'Which SKUs are below safety stock?',
      'Show delayed shipments',
      'Give me an executive summary'
    ];
  }

  const text = (lastResponseText || '').toLowerCase();
  const prompt = (lastPrompt || '').toLowerCase();

  // 1. INVENTORY / STOCKOUT TOPIC
  if (text.includes('sku') || text.includes('inventory') || text.includes('stockout') || prompt.includes('inventory') || prompt.includes('stock')) {
    return [
      'Show affected SKUs',
      'Explain the root cause',
      'Compare against safety stock',
      'What should I investigate next?'
    ];
  }

  // 2. SUPPLIER / VENDOR TOPIC
  if (text.includes('supplier') || text.includes('vendor') || text.includes('otif') || prompt.includes('supplier') || prompt.includes('vendor')) {
    return [
      'Compare suppliers',
      'Show supplier issues',
      'Explain performance drivers',
      'Which supplier needs attention?'
    ];
  }

  // 3. SHIPMENT / LOGISTICS TOPIC
  if (text.includes('shipment') || text.includes('carrier') || text.includes('transit') || prompt.includes('shipment') || prompt.includes('carrier')) {
    return [
      'Show shipment details',
      'Explain the root cause',
      'Show downstream impact',
      'What should I investigate next?'
    ];
  }

  // 4. PURCHASE ORDER TOPIC
  if (text.includes('purchase order') || text.includes('po-') || text.includes('overdue po') || prompt.includes('po') || prompt.includes('procurement')) {
    return [
      'Show overdue PO details',
      'Draft supplier status escalation',
      'Explain lead time variance',
      'What should I investigate next?'
    ];
  }

  // 5. EXCEPTION TOPIC
  if (text.includes('exception') || text.includes('alert') || prompt.includes('exception')) {
    return [
      'Which exceptions are critical?',
      'Explain exception root causes',
      'Estimate financial value at risk',
      'What should I investigate next?'
    ];
  }

  // 6. DECISION TOPIC
  if (text.includes('decision') || text.includes('review') || prompt.includes('decision')) {
    return [
      'Which decisions need immediate attention?',
      'Prioritize pending decisions',
      'Execute top recommended action',
      'What should I investigate next?'
    ];
  }

  // DEFAULT / CONTROL TOWER
  return [
    'What needs attention right now?',
    'Which SKUs are below safety stock?',
    'Show delayed shipments',
    'Give me an executive summary'
  ];
};
