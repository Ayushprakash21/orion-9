# Global Multi-Echelon Inventory Engine

## Purpose & Capabilities
The Inventory module (`src/components/Inventory.tsx`) tracks stock positions across all global manufacturing plants, regional distribution centers, third-party logistics (3PL) warehouses, and retail transit hubs.

## Deterministic Stock Calculations
The inventory engine evaluates the following formulas in real time:
- **Available-to-Promise (ATP)**:
  $$\text{ATP} = \text{Stock On Hand} - \text{Allocated Orders} + \text{Scheduled Receipts} - \text{Safety Stock}$$
- **Reorder Point (ROP)**:
  $$\text{ROP} = (\text{Average Daily Usage} \times \text{Lead Time Days}) + \text{Safety Stock}$$
- **Days of Inventory Outstanding (DIO)**:
  $$\text{DIO} = \frac{\text{Average Inventory Value}}{\text{Cost of Goods Sold (COGS)}} \times 365$$

## Actions & Controls
- **Stock Transfer**: Initiate inter-facility reallocation with automated transit lead-time calculation.
- **Cycle Count Adjustment**: Discrepancy logging with required supervisor approval for material adjustments.
- **Consignment Tracking**: Segregated views for Vendor-Managed Inventory (VMI) vs enterprise-owned stock.
