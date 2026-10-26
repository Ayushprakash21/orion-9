# Predictions & Demand Forecasting Engine

## Forecasting Methodology
The Predictions module (`src/components/Predictions.tsx`) applies deterministic time-series analysis and ML demand lift models to historical consumption, POS sell-through data, and macroeconomic leading indicators.

## Forecast Metrics
- **Mean Absolute Percentage Error (MAPE)**: Real-time accuracy scoring per SKU category.
- **Promotional & Seasonal Lift**: Quantifies expected demand surges based on holiday calendars and marketing campaigns.
- **Confidence Intervals**: 80%, 90%, and 95% certainty bounds to establish safety stock buffers without over-allocating capital.
