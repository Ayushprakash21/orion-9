# Dynamic Island Capsule & Activity Telemetry

## Purpose & Behavior
Positioned in the top-center of the screen, the Dynamic Island (`src/os/components/dynamicIsland/DynamicIslandCapsule.tsx`) is an interactive status pill that provides ambient awareness without interrupting active work.

```
[ ● Corridor Nominal | 42.8k sig/s  —  2 Critical Exceptions ]
```

## Progressive Disclosure States
1. **Compact Idle**: Pill showing real-time system pulse and active alert indicator.
2. **Active Alert**: Glows amber or red when an exception or disruption is detected. Clicking expands into an incident summary.
3. **Task Progress**: Shows active background job progress (e.g. EDI batch sync or ML forecast run).
4. **Expanded Command**: Hovering or clicking reveals a detailed HUD with direct jump links to the affected shipment or order.
