/**
 * ORION-9 GLOBAL CARTOGRAPHY — OFFLINE WORLD LANDMASS GEOJSON
 * Highly optimized, genuine geographic continent polygons (WGS84).
 * Ensures instantaneous, self-contained rendering with zero external dependencies.
 */

import type { FeatureCollection, Polygon, MultiPolygon } from 'geojson';

export const WORLD_LANDMASS_GEOJSON: FeatureCollection<Polygon | MultiPolygon> = {
  type: 'FeatureCollection',
  features: [
    // North America
    {
      type: 'Feature',
      properties: { continent: 'North America', name: 'North America' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-168.0, 65.5], [-160.0, 71.0], [-140.0, 69.5], [-120.0, 75.0], [-95.0, 76.5],
          [-75.0, 73.0], [-60.0, 60.0], [-55.0, 50.0], [-64.0, 44.5], [-70.0, 42.0],
          [-75.0, 36.0], [-80.0, 25.0], [-82.0, 29.0], [-90.0, 30.0], [-97.5, 26.0],
          [-97.0, 20.0], [-90.0, 16.0], [-83.0, 8.5], [-77.0, 7.5], [-80.0, 8.5],
          [-88.0, 13.5], [-96.0, 16.0], [-105.0, 20.0], [-110.0, 23.0], [-115.0, 30.0],
          [-124.5, 38.0], [-125.0, 49.0], [-130.0, 54.5], [-138.0, 59.0], [-152.0, 58.0],
          [-165.0, 60.0], [-168.0, 65.5]
        ]]
      }
    },
    // South America
    {
      type: 'Feature',
      properties: { continent: 'South America', name: 'South America' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-77.0, 7.5], [-72.0, 11.5], [-60.0, 9.0], [-50.0, 1.0], [-35.0, -5.0],
          [-35.0, -10.0], [-40.0, -22.0], [-48.0, -28.0], [-53.0, -33.5], [-58.0, -38.0],
          [-65.0, -43.0], [-66.0, -55.0], [-74.0, -52.0], [-74.0, -42.0], [-72.0, -32.0],
          [-70.0, -18.0], [-77.0, -10.0], [-81.0, -4.5], [-80.0, 1.0], [-77.0, 7.5]
        ]]
      }
    },
    // Europe
    {
      type: 'Feature',
      properties: { continent: 'Europe', name: 'Europe' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-9.5, 37.0], [-9.0, 43.0], [-1.5, 43.5], [-4.5, 48.5], [2.0, 51.0],
          [5.0, 54.0], [8.0, 58.0], [5.0, 62.0], [18.0, 71.0], [28.0, 71.0],
          [40.0, 68.0], [50.0, 67.0], [60.0, 60.0], [50.0, 50.0], [40.0, 47.0],
          [35.0, 45.0], [28.0, 41.5], [23.5, 38.0], [20.0, 40.0], [16.0, 38.0],
          [12.0, 44.0], [9.0, 44.0], [3.0, 42.5], [-2.0, 36.5], [-6.0, 36.0], [-9.5, 37.0]
        ]]
      }
    },
    // Africa
    {
      type: 'Feature',
      properties: { continent: 'Africa', name: 'Africa' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-6.0, 36.0], [11.0, 37.0], [20.0, 32.5], [30.0, 31.5], [34.0, 27.5],
          [37.0, 22.0], [43.0, 12.5], [51.0, 10.5], [41.0, -2.0], [40.0, -11.0],
          [35.0, -24.0], [32.0, -28.0], [28.0, -32.5], [19.0, -34.8], [15.0, -28.0],
          [12.0, -17.0], [9.0, -1.0], [4.0, 4.5], [-3.0, 5.0], [-13.0, 9.0],
          [-17.0, 15.0], [-17.0, 21.0], [-12.0, 28.0], [-6.0, 36.0]
        ]]
      }
    },
    // Asia
    {
      type: 'Feature',
      properties: { continent: 'Asia', name: 'Asia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [60.0, 60.0], [75.0, 72.0], [105.0, 77.0], [140.0, 72.0], [170.0, 66.0],
          [180.0, 65.0], [172.0, 60.0], [160.0, 52.0], [143.0, 50.0], [131.0, 43.0],
          [129.0, 35.0], [122.0, 30.0], [118.0, 24.5], [109.0, 20.0], [106.0, 10.5],
          [101.0, 3.0], [98.5, 8.0], [92.0, 21.0], [88.0, 22.0], [80.0, 13.0],
          [77.5, 8.0], [73.0, 18.0], [67.0, 24.0], [60.0, 25.0], [52.0, 25.0],
          [50.0, 14.0], [43.0, 12.5], [37.0, 22.0], [35.0, 31.0], [35.0, 36.0],
          [28.0, 41.5], [40.0, 47.0], [50.0, 50.0], [60.0, 60.0]
        ]]
      }
    },
    // Australia & Oceania
    {
      type: 'Feature',
      properties: { continent: 'Australia', name: 'Australia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [114.0, -22.0], [122.0, -17.0], [131.0, -12.0], [136.0, -12.0], [142.0, -11.0],
          [145.0, -15.0], [153.0, -28.0], [150.0, -37.0], [140.0, -38.0], [135.0, -34.0],
          [124.0, -33.5], [115.0, -34.0], [113.0, -26.0], [114.0, -22.0]
        ]]
      }
    },
    // Japan
    {
      type: 'Feature',
      properties: { continent: 'Asia', name: 'Japan' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [140.0, 45.5], [145.5, 44.0], [142.0, 40.0], [141.0, 37.0], [139.5, 35.0],
          [136.0, 34.0], [131.0, 32.0], [129.5, 33.0], [133.0, 35.5], [137.0, 37.0],
          [140.0, 41.0], [140.0, 45.5]
        ]]
      }
    },
    // United Kingdom & Ireland
    {
      type: 'Feature',
      properties: { continent: 'Europe', name: 'British Isles' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-5.0, 50.0], [1.5, 52.0], [-0.5, 54.0], [-2.0, 58.5], [-5.0, 58.5],
          [-6.0, 56.0], [-3.0, 53.5], [-5.0, 50.0]
        ]]
      }
    },
    // Southeast Asian Archipelago (Indonesia, Philippines, etc.)
    {
      type: 'Feature',
      properties: { continent: 'Asia', name: 'Maritime SE Asia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [95.0, 5.5], [105.0, -6.0], [115.0, -8.5], [124.0, -8.5], [130.0, -3.5],
          [125.0, 1.5], [121.0, 14.5], [121.0, 18.0], [118.0, 10.0], [110.0, 1.5],
          [100.0, 1.5], [95.0, 5.5]
        ]]
      }
    }
  ]
};
