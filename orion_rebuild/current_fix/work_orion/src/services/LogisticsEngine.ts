import { Shipment } from '../types';

export class LogisticsEngine {
  static calculateMetrics(shipments: Shipment[]) {
    const totalShipments = shipments.length;
    const activeShipments = shipments.filter(s => ['Booked', 'Planned', 'Picked Up', 'In Transit'].includes(s.status));
    const delayedShipments = shipments.filter(s => s.delayDays > 0);
    
    return {
      totalShipments,
      activeShipments: activeShipments.length,
      delayedShipments: delayedShipments.length
    };
  }
}
