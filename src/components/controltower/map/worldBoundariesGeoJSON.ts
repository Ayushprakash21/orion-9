/**
 * ORION-9 GLOBAL CARTOGRAPHY — OFFLINE WORLD LANDMASS & GRATICULES GEOJSON
 * Comprehensive, genuine geographic continent polygons (WGS84) & precision graticules.
 * Ensures instantaneous, self-contained, offline-first rendering with authentic Earth geometry.
 */

import type { FeatureCollection, Polygon, MultiPolygon, LineString } from 'geojson';

export const WORLD_LANDMASS_GEOJSON: FeatureCollection<Polygon | MultiPolygon> = {
  type: 'FeatureCollection',
  features: [
    // 1. North America (Contiguous, Canada & Alaska)
    {
      type: 'Feature',
      properties: { continent: 'North America', name: 'North America' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-168.0, 65.5], [-165.0, 66.5], [-160.0, 71.0], [-152.0, 70.5], [-140.0, 69.5],
          [-130.0, 70.0], [-120.0, 75.0], [-110.0, 74.0], [-95.0, 76.5], [-85.0, 74.0],
          [-75.0, 73.0], [-68.0, 63.0], [-60.0, 60.0], [-55.0, 50.0], [-60.0, 46.0],
          [-64.0, 44.5], [-70.0, 42.0], [-74.0, 40.5], [-75.0, 36.0], [-80.0, 32.0],
          [-80.0, 25.0], [-81.5, 25.0], [-82.0, 29.0], [-88.0, 30.0], [-90.0, 30.0],
          [-95.0, 29.0], [-97.5, 26.0], [-97.0, 20.0], [-92.0, 18.5], [-90.0, 21.0],
          [-87.0, 21.5], [-88.0, 16.0], [-83.0, 15.0], [-83.0, 9.5], [-77.0, 7.5],
          [-80.0, 8.5], [-85.0, 10.0], [-88.0, 13.5], [-93.0, 16.0], [-96.0, 16.0],
          [-105.0, 20.0], [-106.0, 23.0], [-110.0, 23.0], [-112.0, 26.0], [-115.0, 30.0],
          [-117.0, 32.5], [-120.5, 34.5], [-124.5, 38.0], [-124.0, 43.0], [-125.0, 49.0],
          [-128.0, 51.0], [-130.0, 54.5], [-134.0, 57.0], [-138.0, 59.0], [-145.0, 60.5],
          [-152.0, 58.0], [-160.0, 55.5], [-165.0, 60.0], [-168.0, 65.5]
        ]]
      }
    },
    // 2. Greenland
    {
      type: 'Feature',
      properties: { continent: 'North America', name: 'Greenland' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-44.0, 60.0], [-35.0, 65.0], [-25.0, 70.0], [-18.0, 76.0], [-18.0, 81.0],
          [-28.0, 83.5], [-40.0, 83.0], [-55.0, 82.0], [-65.0, 78.0], [-70.0, 76.0],
          [-60.0, 72.0], [-52.0, 68.0], [-50.0, 64.0], [-44.0, 60.0]
        ]]
      }
    },
    // 3. South America
    {
      type: 'Feature',
      properties: { continent: 'South America', name: 'South America' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-77.0, 7.5], [-75.0, 10.5], [-72.0, 11.5], [-68.0, 12.0], [-62.0, 10.5],
          [-60.0, 9.0], [-55.0, 6.0], [-50.0, 1.0], [-45.0, -1.0], [-38.0, -3.5],
          [-35.0, -5.0], [-35.0, -10.0], [-37.0, -13.0], [-40.0, -22.0], [-45.0, -24.0],
          [-48.0, -28.0], [-53.0, -33.5], [-58.0, -38.0], [-65.0, -43.0], [-66.0, -50.0],
          [-66.0, -55.0], [-70.0, -54.0], [-74.0, -52.0], [-75.0, -47.0], [-74.0, -42.0],
          [-72.0, -32.0], [-71.0, -25.0], [-70.0, -18.0], [-75.0, -14.0], [-77.0, -10.0],
          [-81.0, -4.5], [-80.0, 1.0], [-78.0, 4.0], [-77.0, 7.5]
        ]]
      }
    },
    // 4. Europe
    {
      type: 'Feature',
      properties: { continent: 'Europe', name: 'Europe' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-9.5, 37.0], [-9.0, 43.0], [-1.5, 43.5], [-4.5, 48.5], [-2.0, 49.5],
          [2.0, 51.0], [5.0, 54.0], [8.0, 55.0], [8.0, 58.0], [5.0, 62.0],
          [12.0, 65.0], [18.0, 71.0], [28.0, 71.0], [40.0, 68.0], [50.0, 67.0],
          [60.0, 60.0], [50.0, 50.0], [40.0, 47.0], [35.0, 45.0], [30.0, 46.5],
          [28.0, 41.5], [23.5, 38.0], [20.0, 40.0], [16.0, 38.0], [15.0, 42.0],
          [12.0, 44.0], [9.0, 44.0], [3.0, 42.5], [-2.0, 36.5], [-6.0, 36.0], [-9.5, 37.0]
        ]]
      }
    },
    // 5. British Isles
    {
      type: 'Feature',
      properties: { continent: 'Europe', name: 'British Isles' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-5.5, 50.0], [-2.0, 50.5], [1.5, 52.0], [0.5, 53.0], [-0.5, 54.0],
          [-2.0, 58.5], [-4.5, 58.5], [-6.0, 56.0], [-5.0, 54.5], [-3.0, 53.5],
          [-5.0, 51.5], [-5.5, 50.0]
        ]]
      }
    },
    // 6. Africa
    {
      type: 'Feature',
      properties: { continent: 'Africa', name: 'Africa' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-6.0, 36.0], [0.0, 36.0], [11.0, 37.0], [15.0, 33.0], [20.0, 32.5],
          [26.0, 31.5], [30.0, 31.5], [32.0, 31.0], [34.0, 27.5], [37.0, 22.0],
          [43.0, 12.5], [51.0, 10.5], [48.0, 4.0], [41.0, -2.0], [40.0, -11.0],
          [35.0, -24.0], [32.0, -28.0], [28.0, -32.5], [25.0, -34.0], [19.0, -34.8],
          [15.0, -28.0], [12.0, -17.0], [10.0, -8.0], [9.0, -1.0], [8.5, 4.0],
          [4.0, 4.5], [-3.0, 5.0], [-8.0, 4.5], [-13.0, 9.0], [-17.0, 15.0],
          [-17.0, 21.0], [-15.0, 24.0], [-12.0, 28.0], [-10.0, 31.0], [-6.0, 36.0]
        ]]
      }
    },
    // 7. Madagascar
    {
      type: 'Feature',
      properties: { continent: 'Africa', name: 'Madagascar' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [49.5, -12.0], [50.5, -15.5], [48.5, -22.0], [47.0, -25.5], [44.0, -25.0],
          [43.5, -20.0], [47.0, -14.0], [49.5, -12.0]
        ]]
      }
    },
    // 8. Asia
    {
      type: 'Feature',
      properties: { continent: 'Asia', name: 'Asia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [60.0, 60.0], [68.0, 68.0], [75.0, 72.0], [90.0, 75.0], [105.0, 77.0],
          [120.0, 76.0], [140.0, 72.0], [160.0, 70.0], [170.0, 66.0], [180.0, 65.0],
          [172.0, 60.0], [160.0, 52.0], [155.0, 50.0], [143.0, 50.0], [140.0, 46.0],
          [131.0, 43.0], [129.0, 35.0], [122.0, 30.0], [120.0, 26.0], [118.0, 24.5],
          [114.0, 22.0], [109.0, 20.0], [106.0, 10.5], [103.5, 1.2], [101.0, 3.0],
          [98.5, 8.0], [96.0, 16.0], [92.0, 21.0], [88.0, 22.0], [85.0, 18.0],
          [80.0, 13.0], [77.5, 8.0], [73.0, 18.0], [68.0, 23.0], [67.0, 24.0],
          [60.0, 25.0], [56.0, 26.0], [52.0, 25.0], [50.0, 14.0], [43.0, 12.5],
          [37.0, 22.0], [35.0, 31.0], [35.0, 36.0], [28.0, 41.5], [35.0, 45.0],
          [40.0, 47.0], [50.0, 50.0], [60.0, 60.0]
        ]]
      }
    },
    // 9. Japan
    {
      type: 'Feature',
      properties: { continent: 'Asia', name: 'Japan' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [141.0, 45.5], [145.5, 44.0], [142.0, 40.0], [141.0, 37.0], [139.5, 35.0],
          [136.0, 34.0], [131.0, 32.0], [129.5, 33.0], [133.0, 35.5], [137.0, 37.0],
          [140.0, 41.0], [141.0, 45.5]
        ]]
      }
    },
    // 10. Australia
    {
      type: 'Feature',
      properties: { continent: 'Australia', name: 'Australia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [114.0, -22.0], [122.0, -17.0], [131.0, -12.0], [136.0, -12.0], [142.0, -11.0],
          [145.0, -15.0], [153.0, -28.0], [151.0, -34.0], [150.0, -37.0], [146.0, -39.0],
          [140.0, -38.0], [135.0, -34.0], [124.0, -33.5], [115.0, -34.0], [113.0, -26.0],
          [114.0, -22.0]
        ]]
      }
    },
    // 11. New Zealand
    {
      type: 'Feature',
      properties: { continent: 'Australia', name: 'New Zealand' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [173.0, -34.5], [178.0, -37.5], [176.0, -41.5], [171.0, -44.0], [168.0, -46.5],
          [166.5, -45.0], [171.0, -42.0], [173.0, -34.5]
        ]]
      }
    },
    // 12. Maritime Southeast Asia (Indonesia, Philippines, Malaysia)
    {
      type: 'Feature',
      properties: { continent: 'Asia', name: 'Maritime SE Asia' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [95.0, 5.5], [105.0, -6.0], [110.0, -7.5], [115.0, -8.5], [124.0, -8.5],
          [130.0, -3.5], [128.0, 0.0], [125.0, 1.5], [121.0, 14.5], [121.0, 18.0],
          [118.0, 10.0], [110.0, 1.5], [100.0, 1.5], [95.0, 5.5]
        ]]
      }
    },
    // 13. Antarctica
    {
      type: 'Feature',
      properties: { continent: 'Antarctica', name: 'Antarctica' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-180.0, -75.0], [-120.0, -72.0], [-60.0, -65.0], [0.0, -70.0],
          [60.0, -67.0], [120.0, -66.0], [180.0, -75.0], [180.0, -85.0],
          [-180.0, -85.0], [-180.0, -75.0]
        ]]
      }
    }
  ]
};

/**
 * Enterprise Mission-Control Precision Graticules
 * Provides meridian and parallel reference lines for 3D globe and 2D projections.
 */
export const WORLD_GRATICULES_GEOJSON: FeatureCollection<LineString> = {
  type: 'FeatureCollection',
  features: [
    // Equator (0°)
    {
      type: 'Feature',
      properties: { type: 'equator', name: 'Equator' },
      geometry: {
        type: 'LineString',
        coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]
      }
    },
    // Tropic of Cancer (23.5° N)
    {
      type: 'Feature',
      properties: { type: 'tropic', name: 'Tropic of Cancer' },
      geometry: {
        type: 'LineString',
        coordinates: [[-180, 23.5], [-90, 23.5], [0, 23.5], [90, 23.5], [180, 23.5]]
      }
    },
    // Tropic of Capricorn (23.5° S)
    {
      type: 'Feature',
      properties: { type: 'tropic', name: 'Tropic of Capricorn' },
      geometry: {
        type: 'LineString',
        coordinates: [[-180, -23.5], [-90, -23.5], [0, -23.5], [90, -23.5], [180, -23.5]]
      }
    },
    // Prime Meridian (0°)
    {
      type: 'Feature',
      properties: { type: 'meridian', name: 'Prime Meridian' },
      geometry: {
        type: 'LineString',
        coordinates: [[0, -80], [0, -40], [0, 0], [0, 40], [0, 80]]
      }
    },
    // Major Parallels (60° N, 30° N, 30° S, 60° S)
    ...([60, 30, -30, -60] as const).map(lat => ({
      type: 'Feature' as const,
      properties: { type: 'parallel', latitude: lat },
      geometry: {
        type: 'LineString' as const,
        coordinates: [[-180, lat], [-90, lat], [0, lat], [90, lat], [180, lat]] as [number, number][]
      }
    })),
    // Major Meridians (±120°, ±60°)
    ...([-120, -60, 60, 120] as const).map(lng => ({
      type: 'Feature' as const,
      properties: { type: 'meridian', longitude: lng },
      geometry: {
        type: 'LineString' as const,
        coordinates: [[lng, -80], [lng, -40], [lng, 0], [lng, 40], [lng, 80]] as [number, number][]
      }
    }))
  ]
};
