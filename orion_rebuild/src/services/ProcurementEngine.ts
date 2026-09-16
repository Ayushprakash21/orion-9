import { PurchaseOrder } from '../types';

export class ProcurementEngine {
  static calculateMetrics(pos: PurchaseOrder[]) {
    const totalPos = pos.length;
    const openPos = pos.filter(po => !['Received', 'Cancelled', 'Closed'].includes(po.status));
    const overduePos = pos.filter(po => po.status === 'Overdue');
    const openValue = openPos.reduce((sum, po) => sum + po.totalValue, 0);
    
    return {
      totalPos,
      openPos: openPos.length,
      overduePos: overduePos.length,
      openValue
    };
  }
}
