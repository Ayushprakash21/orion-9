# Data Quality & 3-Way Match Reconciliation

## Automated 3-Way Match
The Finance Matching Center (`src/components/FinanceMatchingCenter.tsx`) executes automated 3-way matching before supplier payment release:

$$\text{Match Status} = \begin{cases} \text{APPROVED} & \text{if } |\Delta Q| \le 0.005 \land |\Delta P| \le 0.002 \\ \text{EXCEPTION} & \text{otherwise} \end{cases}$$

## Data Quality Rules
- **Missing Attribute Quarantine**: Incomplete orders (missing HS codes, invalid tax IDs) are blocked from warehouse release.
- **Duplicate Detection**: Real-time fuzzy matching across invoice numbers and bill-of-lading codes.
- **Referential Integrity**: Guarantees every shipment references a valid Purchase Order and active supplier.
