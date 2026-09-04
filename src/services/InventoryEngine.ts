import { Inventory, PurchaseOrder, Shipment, Supplier } from '../types';

export class InventoryEngine {
  static calculateMetrics(inv: Inventory, pos: PurchaseOrder[] = [], shipments: Shipment[] = [], suppliers: Supplier[] = []) {
    if (!inv) return null;
    const onHand = Math.max(0, inv.onHand || 0);
    const reserved = Math.max(0, inv.reserved || 0);
    const available = Math.max(0, onHand - reserved);
    const safetyStock = Math.max(0, inv.safetyStock || 0);
    const reorderPoint = Math.max(0, inv.reorderPoint || 0);
    const dailyDemand = Math.max(0, inv.averageDailyDemand || 0);
    const unitCost = Math.max(0, inv.unitCost || 0);
    const inventoryValue = onHand * unitCost;

    const daysOfSupply = dailyDemand > 0 ? available / dailyDemand : null;

    // Collect incoming supply
    const incomingSupply: { date: Date, qty: number }[] = [];
    pos.forEach(po => {
      if (['Received', 'Cancelled', 'Draft'].includes(po.status)) return;
      
      let poTotalForSku = 0;
      po.lines.forEach(l => {
        if (l.productId === inv.productId) {
          poTotalForSku += Math.max(0, l.quantity - l.receivedQuantity);
        }
      });
      if (poTotalForSku > 0) {
        // Find if this PO is on any shipment
        const relatedShipments = shipments.filter(s => s.poId === po.id && !['Delivered', 'Cancelled'].includes(s.status));
        if (relatedShipments.length > 0) {
          // It's on a shipment, use shipment expected arrival + delay
          relatedShipments.forEach(s => {
            const arr = new Date(s.expectedArrival);
            if (s.delayDays > 0) arr.setDate(arr.getDate() + s.delayDays);
            incomingSupply.push({ date: arr, qty: poTotalForSku / relatedShipments.length }); // Simplified split
          });
        } else {
          // No shipment yet, use PO expected delivery
          // Could add supplier lead time logic here if expectedDelivery is missing, but usually POs have expectedDelivery
          let arr = new Date(po.expectedDelivery);
          incomingSupply.push({ date: arr, qty: poTotalForSku });
        }
      }
    });

    incomingSupply.sort((a, b) => a.date.getTime() - b.date.getTime());
    const incoming = incomingSupply.reduce((sum, s) => sum + s.qty, 0);

    let stockOutDate: string | null = null;
    let shortageQuantity = 0;
    let daysBelowSafetyStock = 0;
    let daysBelowReorderPoint = 0;
    let inventoryRecoveryDate: string | null = null;
    let projectedShortage = 0;

    let currentStock = available;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Project up to 365 days
    const horizon = 365;
    let hasStockedOut = false;
    let hasRecovered = false;

    for (let day = 0; day < horizon; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);

      // Add incoming supply for this day
      const supplyToday = incomingSupply.filter(s => {
        const sDate = new Date(s.date);
        sDate.setHours(0, 0, 0, 0);
        return sDate.getTime() === currentDate.getTime();
      }).reduce((sum, s) => sum + s.qty, 0);
      
      currentStock += supplyToday;

      // Subtract demand
      currentStock -= dailyDemand;

      if (currentStock < safetyStock) {
        daysBelowSafetyStock++;
      }
      if (currentStock < reorderPoint) {
        daysBelowReorderPoint++;
      }

      if (currentStock <= 0) {
        if (!hasStockedOut) {
          stockOutDate = currentDate.toISOString();
          hasStockedOut = true;
        }
        if (day === horizon - 1 || incomingSupply.length === 0) {
           projectedShortage = Math.abs(currentStock);
        }
      } else {
        if (hasStockedOut && !hasRecovered) {
          inventoryRecoveryDate = currentDate.toISOString();
          hasRecovered = true;
        }
      }
    }
    
    // For legacy compatibility, simple shortage calculation if we have safety stock but not enough available
    shortageQuantity = available < safetyStock ? safetyStock - available : 0;
    const excessQuantity = dailyDemand > 0 && available > dailyDemand * 60 ? available - (dailyDemand * 60) : 0;

    return {
      onHand,
      reserved,
      available,
      incoming,
      safetyStock,
      reorderPoint,
      dailyDemand,
      daysOfSupply,
      stockOutDate,
      shortageQuantity,
      excessQuantity,
      inventoryValue,
      projectedShortage,
      daysBelowSafetyStock,
      daysBelowReorderPoint,
      inventoryRecoveryDate
    };
  }
}
