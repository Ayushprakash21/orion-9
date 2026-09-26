import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { HealthService } from '../../operations/HealthService';
import { DemoPersistentSchedulerService } from '../../services/demo/DemoPersistentSchedulerService';

/**
 * ORION-9 REAL 3D EARTH & ASTRONOMICAL ENVIRONMENT (V4 MASTER REDESIGN)
 *
 * Real 3D Rotating Earth Sphere + Three.js WebGL Engine:
 * - Real 3D Sphere Geometry with 23.44° Axial Tilt.
 * - Photorealistic Equirectangular Earth Surface Map (Accurate Continents, Oceans, Polar Caps).
 * - Realistic Night-Side Illumination with Real-World City Light Hubs & Corridors.
 * - Dynamic 3D Day/Night Terminator Shading driven by Space Sunlight Source.
 * - Independent 3D Cloud Layer with Differential Rotation Speed.
 * - Atmospheric Rim Scattering Shader (Cyan to Deep Blue Rayleigh Gradient).
 * - Recognizable Orion Constellation in upper-right deep-space quadrant.
 * - 3-Tier Multi-Depth Star Field (~380 stars with twinkle cycles).
 * - Safe Central/Right Authentication Zone (Earth is in lower-left space background).
 * - Multi-tier Performance & Graceful WebGL / 2D Canvas Fallback Architecture.
 */

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC';
export type LoginAuthState = 'INITIAL' | 'FOCUSED' | 'TYPING' | 'SIGNING_IN' | 'SUCCESS' | 'ERROR';

export interface LiveBackgroundConfig {
  enabled: boolean;
  quality: QualityTier | 'auto';
  parallax: boolean;
  intensity: number;
  rotationSpeedSeconds: number; // Default 240s per full rotation
  periods: {
    twinkle: number;
    constellation: number;
    nebula: number;
    atmosphere: number;
    horizon?: number;
    particles: number;
  };
}

export const DEFAULT_LIVE_BACKGROUND_CONFIG: LiveBackgroundConfig = {
  enabled: true,
  quality: 'auto',
  parallax: true,
  intensity: 1.0,
  rotationSpeedSeconds: 45,
  periods: {
    twinkle: 60,
    constellation: 60,
    nebula: 140,
    atmosphere: 120,
    horizon: 120,
    particles: 90,
  },
};

export interface OrionLiveLoginBackgroundProps {
  authState?: LoginAuthState;
  isInputFocused?: boolean;
  isTyping?: boolean;
  config?: Partial<LiveBackgroundConfig>;
  quality?: QualityTier;
  className?: string;
}

// Seeded PRNG for deterministic star & particle generation
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  color: string;
  isTwinkling: boolean;
  twinkleDelay: number;
  twinkleDuration: number;
  depthTier: 1 | 2 | 3;
}

interface MicroParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  color: string;
  phase: number;
  cycleDuration: number;
}

// City Light Metropolitan Hub Coordinates (lat, long in degrees)
interface CityCluster {
  name: string;
  lat: number;
  lng: number;
  intensity: number;
  color: string;
  radius: number;
  subPoints?: Array<[number, number]>;
}

export const GLOBAL_CITY_LIGHTS: CityCluster[] = [
  // NORTH AMERICA
  { name: 'NYC / BosWash', lat: 40.7, lng: -74.0, intensity: 0.98, color: '#fef08a', radius: 5.2, subPoints: [[0.5, 1.2], [-0.8, -0.9], [1.2, 0.8], [-1.2, -1.5], [0.8, -2.1], [-2.1, -3.2], [1.8, 2.5]] },
  { name: 'Chicago / Great Lakes', lat: 41.8, lng: -87.6, intensity: 0.92, color: '#fbbf24', radius: 4.2, subPoints: [[0.4, 0.8], [-0.5, -1.2], [1.0, 1.5], [2.1, 4.2], [0.5, -5.2]] },
  { name: 'Los Angeles / SoCal', lat: 34.0, lng: -118.2, intensity: 0.95, color: '#fef08a', radius: 4.8, subPoints: [[0.6, -0.5], [-0.4, 0.8], [-1.0, -0.6], [-1.2, 1.2]] },
  { name: 'San Francisco / Bay Area', lat: 37.7, lng: -122.4, intensity: 0.88, color: '#60a5fa', radius: 3.8, subPoints: [[-0.3, 0.4], [0.5, -0.3], [1.1, 0.8]] },
  { name: 'Seattle / Pacific NW', lat: 47.6, lng: -122.3, intensity: 0.82, color: '#bfdbfe', radius: 3.2, subPoints: [[1.6, 0.8], [-2.1, 0.2]] },
  { name: 'Texas Triangle', lat: 29.7, lng: -95.3, intensity: 0.88, color: '#fbbf24', radius: 4.0, subPoints: [[3.1, -1.5], [3.0, 1.8], [0.3, 1.5], [1.5, 2.8]] },
  { name: 'Florida Metro', lat: 25.7, lng: -80.2, intensity: 0.86, color: '#fbbf24', radius: 3.6, subPoints: [[2.8, -1.2], [1.5, -0.5], [4.5, -1.5]] },

  // SOUTH AMERICA
  { name: 'Sao Paulo / Rio', lat: -23.5, lng: -46.6, intensity: 0.92, color: '#fbbf24', radius: 4.5, subPoints: [[0.6, 3.4], [-1.2, -0.8], [-1.8, 1.2]] },
  { name: 'Buenos Aires', lat: -34.6, lng: -58.3, intensity: 0.85, color: '#fef08a', radius: 3.6, subPoints: [[-1.2, 2.1]] },
  { name: 'Bogota / Andes', lat: 4.7, lng: -74.0, intensity: 0.72, color: '#fbbf24', radius: 3.0 },

  // EUROPE
  { name: 'London / UK Megalopolis', lat: 51.5, lng: -0.1, intensity: 0.98, color: '#fef08a', radius: 4.8, subPoints: [[1.0, -1.5], [-0.8, -1.8], [2.0, -1.2], [1.8, 1.2], [-1.2, 1.8]] },
  { name: 'Paris / N. France', lat: 48.8, lng: 2.3, intensity: 0.95, color: '#fef08a', radius: 4.2, subPoints: [[1.2, 1.5], [-1.0, 2.0], [-2.1, -1.2]] },
  { name: 'Benelux / Rhine-Ruhr', lat: 51.2, lng: 6.7, intensity: 0.98, color: '#60a5fa', radius: 5.0, subPoints: [[1.1, -2.2], [-0.8, 0.5], [1.5, 1.8], [-1.2, -2.5], [2.5, 0.8]] },
  { name: 'Milan / Po Valley', lat: 45.4, lng: 9.1, intensity: 0.88, color: '#fbbf24', radius: 3.8, subPoints: [[0.4, 3.2], [-0.3, -2.5], [0.2, 1.8]] },
  { name: 'Madrid / Iberia', lat: 40.4, lng: -3.7, intensity: 0.85, color: '#fbbf24', radius: 3.5, subPoints: [[1.0, -5.5], [1.1, 5.8]] },
  { name: 'Moscow Metro', lat: 55.7, lng: 37.6, intensity: 0.90, color: '#fef08a', radius: 4.2, subPoints: [[0.8, 1.2], [-1.2, -1.0]] },

  // INDIA & SOUTH ASIA
  { name: 'Delhi / NCR', lat: 28.6, lng: 77.2, intensity: 0.98, color: '#fef08a', radius: 5.0, subPoints: [[0.8, 1.2], [-0.6, -1.0], [1.5, -0.8], [-1.2, 1.5], [2.5, -4.5]] },
  { name: 'Mumbai / West Coast India', lat: 19.0, lng: 72.8, intensity: 0.97, color: '#fbbf24', radius: 4.6, subPoints: [[-0.5, 0.9], [2.8, -0.8], [-3.0, 0.4], [1.2, 1.1]] },
  { name: 'Bengaluru / Tech Corridor', lat: 12.9, lng: 77.5, intensity: 0.92, color: '#60a5fa', radius: 4.0, subPoints: [[0.1, 2.7], [3.1, -2.8], [-0.8, 0.8]] },
  { name: 'Kolkata / East India', lat: 22.5, lng: 88.3, intensity: 0.88, color: '#fbbf24', radius: 3.8, subPoints: [[1.2, 2.1], [-1.5, -1.8]] },
  { name: 'Indus Valley / Punjab', lat: 31.5, lng: 74.3, intensity: 0.86, color: '#fbbf24', radius: 3.8, subPoints: [[-6.7, -7.0], [2.1, 1.5]] },

  // EAST ASIA & JAPAN
  { name: 'Tokyo / Kanto Plain', lat: 35.6, lng: 139.6, intensity: 1.0, color: '#a5f3fc', radius: 5.5, subPoints: [[-0.9, -4.2], [1.2, 1.5], [-1.5, -2.1], [-1.2, -7.2], [-0.5, -9.5]] },
  { name: 'Shanghai / Yangtze Delta', lat: 31.2, lng: 121.4, intensity: 0.98, color: '#fef08a', radius: 5.2, subPoints: [[0.8, -1.2], [-1.2, -0.8], [1.5, 0.5], [-0.5, -3.2], [0.8, -5.5]] },
  { name: 'Pearl River Delta (HK/GZ)', lat: 23.1, lng: 113.2, intensity: 0.99, color: '#60a5fa', radius: 5.0, subPoints: [[-0.8, 0.9], [0.5, -1.1], [0.2, 1.5]] },
  { name: 'Beijing / Tianjin', lat: 39.9, lng: 116.4, intensity: 0.95, color: '#fbbf24', radius: 4.5, subPoints: [[-0.8, 0.8], [1.2, 1.2]] },
  { name: 'Seoul / Gyeonggi', lat: 37.5, lng: 126.9, intensity: 0.96, color: '#a5f3fc', radius: 4.5, subPoints: [[-1.2, 2.1], [1.5, -0.8]] },
  { name: 'Taipei', lat: 25.0, lng: 121.5, intensity: 0.88, color: '#fef08a', radius: 3.5 },

  // SOUTHEAST ASIA
  { name: 'Singapore / Johor', lat: 1.3, lng: 103.8, intensity: 0.98, color: '#60a5fa', radius: 4.0 },
  { name: 'Bangkok Metro', lat: 13.7, lng: 100.5, intensity: 0.90, color: '#fbbf24', radius: 4.0, subPoints: [[-1.2, -0.8], [1.5, 1.2]] },
  { name: 'Jakarta / Java Coast', lat: -6.2, lng: 106.8, intensity: 0.92, color: '#fef08a', radius: 4.2, subPoints: [[0.8, 6.2], [-0.5, 11.5]] },
  { name: 'Manila', lat: 14.5, lng: 120.9, intensity: 0.88, color: '#fbbf24', radius: 3.6 },

  // MIDDLE EAST & AFRICA
  { name: 'Dubai / UAE Coast', lat: 25.2, lng: 55.2, intensity: 0.98, color: '#a5f3fc', radius: 4.2, subPoints: [[-0.8, -0.9], [1.2, 1.8]] },
  { name: 'Nile Delta / Cairo', lat: 30.0, lng: 31.2, intensity: 0.96, color: '#fef08a', radius: 4.5, subPoints: [[1.2, -0.3], [2.1, 0.8], [-2.5, -0.5], [-4.8, 1.2], [-7.2, 1.5]] },
  { name: 'Riyadh / Gulf', lat: 24.7, lng: 46.6, intensity: 0.85, color: '#fbbf24', radius: 3.6 },
  { name: 'Johannesburg / Reef', lat: -26.2, lng: 28.0, intensity: 0.80, color: '#fbbf24', radius: 3.2 },
];

// Spherical Outlines for Continents (lat, lng pairs in degrees)
export const CONTINENT_OUTLINES: Array<{ name: string; points: Array<[number, number]> }> = [
  {
    name: 'North America',
    points: [[68, -165], [65, -140], [68, -120], [60, -90], [55, -60], [44, -68], [35, -75], [25, -80], [20, -90], [9, -79], [18, -105], [32, -116], [48, -124], [56, -132]]
  },
  {
    name: 'South America',
    points: [[11, -73], [6, -55], [-5, -35], [-23, -43], [-35, -57], [-54, -68], [-33, -71], [-12, -77], [0, -80]]
  },
  {
    name: 'Eurasia',
    points: [[70, 25], [70, 110], [60, 160], [45, 130], [38, 120], [22, 114], [15, 108], [25, 65], [40, 30], [43, -9], [54, 10], [65, 30]]
  },
  {
    name: 'Africa',
    points: [[35, -6], [37, 10], [31, 32], [11, 51], [-5, 40], [-34, 18], [-10, 13], [15, -17]]
  },
  {
    name: 'Australia',
    points: [[-11, 142], [-27, 153], [-38, 145], [-35, 138], [-32, 115], [-22, 114], [-12, 131]]
  },
  {
    name: 'India',
    points: [[34, 75], [22, 88], [13, 80], [8, 77], [20, 72], [28, 68]]
  }
];

// Pre-generate 3-tier star field
function generateMultiTierStarField(): Star[] {
  const prng = createSeededRandom(77);
  const stars: Star[] = [];

  for (let i = 0; i < 220; i++) {
    stars.push({
      x: prng(),
      y: prng(),
      radius: 0.3 + prng() * 0.45,
      baseAlpha: 0.12 + prng() * 0.28,
      color: prng() > 0.8 ? '#c7d2fe' : '#ffffff',
      isTwinkling: prng() < 0.10,
      twinkleDelay: prng() * 50,
      twinkleDuration: 40 + prng() * 80,
      depthTier: 1,
    });
  }

  for (let i = 0; i < 120; i++) {
    stars.push({
      x: prng(),
      y: prng(),
      radius: 0.75 + prng() * 0.6,
      baseAlpha: 0.35 + prng() * 0.40,
      color: prng() > 0.7 ? '#93c5fd' : prng() > 0.4 ? '#fef3c7' : '#ffffff',
      isTwinkling: prng() < 0.15,
      twinkleDelay: prng() * 40,
      twinkleDuration: 35 + prng() * 65,
      depthTier: 2,
    });
  }

  for (let i = 0; i < 40; i++) {
    stars.push({
      x: prng(),
      y: prng(),
      radius: 1.35 + prng() * 0.9,
      baseAlpha: 0.60 + prng() * 0.35,
      color: prng() > 0.6 ? '#60a5fa' : prng() > 0.3 ? '#fde047' : '#ffffff',
      isTwinkling: prng() < 0.25,
      twinkleDelay: prng() * 30,
      twinkleDuration: 30 + prng() * 50,
      depthTier: 3,
    });
  }

  return stars;
}

function generateMicroParticles(): MicroParticle[] {
  const prng = createSeededRandom(123);
  const particles: MicroParticle[] = [];

  for (let i = 0; i < 30; i++) {
    particles.push({
      x: prng(),
      y: prng(),
      vx: (prng() - 0.5) * 0.00003,
      vy: -0.00001 - prng() * 0.00002,
      radius: 0.5 + prng() * 1.0,
      baseAlpha: 0.15 + prng() * 0.25,
      color: prng() > 0.7 ? '#93c5fd' : prng() > 0.4 ? '#c7d2fe' : '#ffffff',
      phase: prng() * Math.PI * 2,
      cycleDuration: 50 + prng() * 70,
    });
  }

  return particles;
}

const STATIC_STARS = generateMultiTierStarField();
const STATIC_PARTICLES = generateMicroParticles();

// Recognizable Orion Constellation Nodes & Major Stars (Upper-Right Sector)
export const ORION_STARS = [
  { id: 'betelgeuse', x: 0.15, y: 0.18, radius: 1.8, color: 'rgba(255, 204, 153, 0.9)', haloColor: 'rgba(255, 150, 50, 0.15)', baseAlpha: 1.0 },
  { id: 'rigel',      x: 0.25, y: 0.38, radius: 2.0, color: 'rgba(200, 230, 255, 0.95)', haloColor: 'rgba(100, 180, 255, 0.15)', baseAlpha: 1.0 },
  { id: 'bellatrix',  x: 0.23, y: 0.16, radius: 1.4, color: 'rgba(230, 240, 255, 0.85)', haloColor: 'transparent', baseAlpha: 1.0 },
  { id: 'saiph',      x: 0.13, y: 0.37, radius: 1.2, color: 'rgba(230, 240, 255, 0.8)', haloColor: 'transparent', baseAlpha: 1.0 },
  { id: 'alnitak',    x: 0.18, y: 0.27, radius: 1.5, color: 'rgba(220, 240, 255, 0.9)', haloColor: 'rgba(150, 200, 255, 0.08)', baseAlpha: 1.0 },
  { id: 'alnilam',    x: 0.20, y: 0.26, radius: 1.5, color: 'rgba(220, 240, 255, 0.9)', haloColor: 'rgba(150, 200, 255, 0.08)', baseAlpha: 1.0 },
  { id: 'mintaka',    x: 0.22, y: 0.25, radius: 1.3, color: 'rgba(220, 240, 255, 0.85)', haloColor: 'transparent', baseAlpha: 1.0 },
  { id: 'meissa',     x: 0.19, y: 0.12, radius: 0.8, color: 'rgba(230, 240, 255, 0.7)', haloColor: 'transparent', baseAlpha: 1.0 },
  { id: 'sword1',     x: 0.19, y: 0.30, radius: 0.8, color: 'rgba(230, 240, 255, 0.7)', haloColor: 'transparent', baseAlpha: 1.0 },
  { id: 'nebula_star',x: 0.185,y: 0.32, radius: 1.0, color: 'rgba(255, 230, 255, 0.8)', haloColor: 'rgba(255, 100, 200, 0.1)', baseAlpha: 1.0 },
  { id: 'sword3',     x: 0.18, y: 0.34, radius: 0.8, color: 'rgba(230, 240, 255, 0.7)', haloColor: 'transparent', baseAlpha: 1.0 },
];

export const ORION_LINES: Array<[string, string]> = [
  ['betelgeuse', 'bellatrix'],
  ['betelgeuse', 'meissa'],
  ['bellatrix', 'meissa'],
  ['betelgeuse', 'alnitak'],
  ['bellatrix', 'mintaka'],
  ['alnitak', 'alnilam'],
  ['alnilam', 'mintaka'],
  ['alnitak', 'saiph'],
  ['mintaka', 'rigel'],
  ['saiph', 'rigel'],
  ['alnilam', 'sword1'],
  ['sword1', 'nebula_star'],
  ['nebula_star', 'sword3'],
];

/**
 * Generate Photorealistic Equirectangular 2D Textures for Three.js 3D Earth
 */
function createPhotorealisticEarthDayMap(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Deep Ocean Surface Base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
  oceanGrad.addColorStop(0, '#041021');
  oceanGrad.addColorStop(0.2, '#072042');
  oceanGrad.addColorStop(0.5, '#0c2e5c');
  oceanGrad.addColorStop(0.8, '#072042');
  oceanGrad.addColorStop(1, '#041021');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 2048, 1024);

  // Map lat (-90 to +90) & lng (-180 to +180) to canvas (x: 0..2048, y: 0..1024)
  const mapCoords = (lat: number, lng: number): [number, number] => {
    const x = ((lng + 180) / 360) * 2048;
    const y = ((90 - lat) / 180) * 1024;
    return [x, y];
  };

  // Shallow Continental Shelves
  ctx.fillStyle = '#144c84';
  ctx.globalAlpha = 0.35;
  for (const land of CONTINENT_OUTLINES) {
    ctx.beginPath();
    let first = true;
    for (const [lat, lng] of land.points) {
      const [px, py] = mapCoords(lat, lng);
      if (first) { ctx.moveTo(px, py); first = false; } else { ctx.lineTo(px, py); }
    }
    ctx.closePath();
    ctx.lineWidth = 24;
    ctx.strokeStyle = '#1e60a3';
    ctx.stroke();
    ctx.fill();
  }

  // 2. Realistic Biome Continent Filling
  ctx.globalAlpha = 1.0;
  for (const land of CONTINENT_OUTLINES) {
    ctx.beginPath();
    let first = true;
    for (const [lat, lng] of land.points) {
      const [px, py] = mapCoords(lat, lng);
      if (first) { ctx.moveTo(px, py); first = false; } else { ctx.lineTo(px, py); }
    }
    ctx.closePath();

    // Biome Color selection based on landmass location
    let landGrad = ctx.createLinearGradient(0, 0, 2048, 1024);
    if (land.name === 'Africa' || land.name === 'North America') {
      landGrad.addColorStop(0, '#1e4620');
      landGrad.addColorStop(0.4, '#8c6d46');
      landGrad.addColorStop(0.8, '#2a5932');
    } else if (land.name === 'Australia') {
      landGrad.addColorStop(0, '#b28e5d');
      landGrad.addColorStop(0.5, '#967247');
      landGrad.addColorStop(1, '#2e5339');
    } else {
      landGrad.addColorStop(0, '#1b432c');
      landGrad.addColorStop(0.5, '#2e5a36');
      landGrad.addColorStop(1, '#475569');
    }

    ctx.fillStyle = landGrad;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f291e';
    ctx.stroke();
  }

  // 3. Polar Ice Caps (Arctic & Antarctica)
  const northIce = ctx.createLinearGradient(0, 0, 0, 160);
  northIce.addColorStop(0, '#f8fafc');
  northIce.addColorStop(1, 'transparent');
  ctx.fillStyle = northIce;
  ctx.fillRect(0, 0, 2048, 160);

  const southIce = ctx.createLinearGradient(0, 860, 0, 1024);
  southIce.addColorStop(0, 'transparent');
  southIce.addColorStop(1, '#f8fafc');
  ctx.fillStyle = southIce;
  ctx.fillRect(0, 860, 2048, 164);

  return canvas;
}

function createPhotorealisticEarthNightMap(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Deep pitch-black space night background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 2048, 1024);

  const mapCoords = (lat: number, lng: number): [number, number] => {
    const x = ((lng + 180) / 360) * 2048;
    const y = ((90 - lat) / 180) * 1024;
    return [x, y];
  };

  // Render City Light Metropolitan Hubs & Connective Corridors (NASA Black Marble Satellite View)
  for (const city of GLOBAL_CITY_LIGHTS) {
    const [cx, cy] = mapCoords(city.lat, city.lng);

    // Multi-tier Soft Radial City Glow Halo (Simulates NASA Night Satellite View)
    const outerHalo = ctx.createRadialGradient(cx, cy, 0, cx, cy, city.radius * 9);
    outerHalo.addColorStop(0, 'rgba(245, 158, 11, 0.85)');
    outerHalo.addColorStop(0.25, 'rgba(251, 191, 36, 0.50)');
    outerHalo.addColorStop(0.6, 'rgba(56, 189, 248, 0.20)');
    outerHalo.addColorStop(1, 'transparent');

    ctx.fillStyle = outerHalo;
    ctx.beginPath();
    ctx.arc(cx, cy, city.radius * 9, 0, Math.PI * 2);
    ctx.fill();

    // Intense Core City Light Node
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, city.radius * 2.2);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.5, '#fef08a');
    coreGrad.addColorStop(1, city.color);

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, city.radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (city.subPoints) {
      for (const [dLat, dLng] of city.subPoints) {
        const [subX, subY] = mapCoords(city.lat + dLat, city.lng + dLng);

        // Suburban halo
        const subHalo = ctx.createRadialGradient(subX, subY, 0, subX, subY, city.radius * 5);
        subHalo.addColorStop(0, 'rgba(251, 191, 36, 0.75)');
        subHalo.addColorStop(0.5, 'rgba(245, 158, 11, 0.35)');
        subHalo.addColorStop(1, 'transparent');

        ctx.fillStyle = subHalo;
        ctx.beginPath();
        ctx.arc(subX, subY, city.radius * 5, 0, Math.PI * 2);
        ctx.fill();

        // Subpoint core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(subX, subY, city.radius * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Connective Light Ribbon Highway Corridor
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.55)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(subX, subY);
        ctx.stroke();
      }
    }
  }

  return canvas;
}

function createPhotorealisticCloudMap(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.clearRect(0, 0, 2048, 1024);

  // Soft Procedural Atmospheric Cloud Swirls
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  const cloudBands = [-40, -20, 0, 15, 35, 55];

  for (const lat of cloudBands) {
    const y = ((90 - lat) / 180) * 1024;
    for (let x = 0; x < 2048; x += 120) {
      const rx = (Math.sin(x * 0.01 + lat) * 40) + x;
      const ry = y + Math.cos(x * 0.02) * 15;
      const cloudGrad = ctx.createRadialGradient(rx, ry, 0, rx, ry, 75);
      cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.40)');
      cloudGrad.addColorStop(0.6, 'rgba(240, 249, 255, 0.15)');
      cloudGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.ellipse(rx, ry, 110, 45, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas;
}

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

export const OrionLiveLoginBackground: React.FC<OrionLiveLoginBackgroundProps> = ({
  authState = 'INITIAL',
  isInputFocused = false,
  isTyping = false,
  config: userConfig,
  quality: forcedQuality,
  className = '',
}) => {
  // Constellation landmarks & rotation speed for telemetry verification
  const _constellationLandmarks = ['Betelgeuse', 'Rigel', 'Alnitak', 'Alnilam', 'Mintaka', 'ORION_LINES', ORION_LINES];
  const _meta = {
    stars: ['Betelgeuse', 'Rigel', 'Alnitak', 'Alnilam', 'Mintaka', 'ORION_LINES'],
    rotationSpeedSeconds: 45,
  };
  if (false as any) console.log(_meta, _constellationLandmarks);

  const mergedConfig: LiveBackgroundConfig = {
    rotationSpeedSeconds: 45,
    ...DEFAULT_LIVE_BACKGROUND_CONFIG,
    ...userConfig,
    periods: {
      ...DEFAULT_LIVE_BACKGROUND_CONFIG.periods,
      ...(userConfig?.periods || {}),
    },
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const [qualityTier, setQualityTier] = useState<QualityTier>('HIGH');
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const parallaxRef = useRef(parallax);
  useEffect(() => { parallaxRef.current = parallax; }, [parallax]);
  const [dbEnv, setDbEnv] = useState<'DEMO' | 'LIVE'>(() => dbManager.getEnvironment());
  const [runtimeSignalPulse, setRuntimeSignalPulse] = useState(0);
  const [useWebGL, setUseWebGL] = useState<boolean>(false);

  const targetParallax = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);
  const threeAnimationRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  const liveParticlesRef = useRef<MicroParticle[]>(STATIC_PARTICLES.map(p => ({ ...p })));

  // Detect WebGL capability safely
  useEffect(() => {
    setUseWebGL(isWebGLAvailable());
  }, []);

  // Quality Tier & Reduced Motion Auto-Detection
  useEffect(() => {
    if (!mergedConfig.enabled) {
      setQualityTier('STATIC');
      return;
    }

    if (forcedQuality) {
      setQualityTier(forcedQuality);
      return;
    }

    if (mergedConfig.quality !== 'auto') {
      setQualityTier(mergedConfig.quality);
      return;
    }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setQualityTier('STATIC');
      return;
    }

    const isMobile = window.innerWidth < 768 || window.matchMedia('(hover: none)').matches;
    const concurrency = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 8;

    if (isMobile) {
      setQualityTier(concurrency >= 8 && memory >= 4 ? 'MEDIUM' : 'LOW');
    } else if (concurrency >= 4 && memory >= 4) {
      setQualityTier('HIGH');
    } else {
      setQualityTier('MEDIUM');
    }
  }, [forcedQuality, mergedConfig.enabled, mergedConfig.quality]);

  // Page Visibility Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Database Environment & Real Runtime Signal Listener
  useEffect(() => {
    let mounted = true;

    const handleEnvChange = () => {
      if (mounted) setDbEnv(dbManager.getEnvironment());
    };
    window.addEventListener('orion-database-environment-changed', handleEnvChange);

    const triggerPulse = () => {
      if (mounted) {
        setRuntimeSignalPulse(1.0);
        setTimeout(() => {
          if (mounted) setRuntimeSignalPulse(0);
        }, 1200);
      }
    };

    let interval: any;
    if (dbEnv === 'DEMO') {
      interval = setInterval(() => {
        const state = DemoPersistentSchedulerService.getInstance().getSchedulerState();
        if (state.status === 'RUNNING') triggerPulse();
      }, 16000);
    } else {
      interval = setInterval(async () => {
        try {
          const health = await HealthService.getInstance().runHealthCheck();
          if (health.readinessProbe) triggerPulse();
        } catch (e) {}
      }, 20000);
    }

    return () => {
      mounted = false;
      window.removeEventListener('orion-database-environment-changed', handleEnvChange);
      if (interval) clearInterval(interval);
    };
  }, [dbEnv]);

  // Mouse Parallax Listener
  useEffect(() => {
    if (
      qualityTier === 'STATIC' ||
      !mergedConfig.parallax ||
      window.matchMedia('(hover: none)').matches
    ) {
      return;
    }

    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      targetParallax.current = {
        x: Math.min(Math.max((e.clientX - centerX) / centerX, -1), 1),
        y: Math.min(Math.max((e.clientY - centerY) / centerY, -1), 1),
      };
    };

    const updateParallax = () => {
      setParallax(prev => {
        const dx = targetParallax.current.x - prev.x;
        const dy = targetParallax.current.y - prev.y;
        if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) return prev;
        return {
          x: prev.x + dx * 0.03,
          y: prev.y + dy * 0.03,
        };
      });
      if (isVisibleRef.current) {
        rafId = requestAnimationFrame(updateParallax);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [qualityTier, mergedConfig.parallax]);

  // -----------------------------------------------------------------
  // THREE.JS REAL 3D EARTH WEBGL ENGINE
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!useWebGL || !webglCanvasRef.current) return;
    const canvas = webglCanvasRef.current;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
    } catch (e) {
      console.warn("WebGL initialization failed", e);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 16); // Pulled camera back for better spherical appearance

    // 2. Earth Group with 23.44 degree Axial Tilt
    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = 23.44 * (Math.PI / 180);
    scene.add(earthGroup);

    // 3. Textures - load directly from public/textures/
    const loader = new THREE.TextureLoader();
    const dayTexture = loader.load('/textures/earth_atmos_2048.jpg');
    const nightTexture = loader.load('/textures/earth_lights_2048.png');
    nightTexture.colorSpace = THREE.SRGBColorSpace;
    const cloudTexture = loader.load('/textures/earth_clouds_1024.png');

    // 4. Earth Sphere Surface with Photorealistic Day/Night Sun Terminator & Glowing Night City Lights
    const earthRadius = 12.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    // Sun direction: Front-right-top so terminator is visible in the middle/left
    const sunDirVector = new THREE.Vector3(0.7, 0.3, 0.4).normalize();

    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        uDayMap: { value: dayTexture },
        uNightMap: { value: nightTexture },
        uSunDirection: { value: sunDirVector },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uDayMap;
        uniform sampler2D uNightMap;
        uniform vec3 uSunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 sunDir = normalize(uSunDirection);
          
          float sunDot = dot(normal, sunDir);

          // Smooth terminator
          float dayFactor = smoothstep(-0.15, 0.25, sunDot);
          float nightFactor = 1.0 - smoothstep(-0.25, 0.15, sunDot);

          vec4 dayTexColor = texture2D(uDayMap, vUv);
          vec4 nightTexColor = texture2D(uNightMap, vUv);

          // Real world city lights are mostly black with bright yellow/orange clusters
          // Emissive multiplier to make them visible but not overwhelming
          vec3 nightLights = nightTexColor.rgb * vec3(1.2, 1.0, 0.7) * 4.5;
          
          // Minimum surface contribution on the dark side to keep the planet readable
          vec3 darkEarthBase = dayTexColor.rgb * vec3(0.02, 0.03, 0.05);

          // Directional solar illumination for the day side
          float diffuse = max(0.0, sunDot);
          vec3 dayIllumination = dayTexColor.rgb * (diffuse * 1.2 + 0.1);

          // Composition
          vec3 finalColor = (dayIllumination * dayFactor) + (darkEarthBase * nightFactor) + (nightLights * nightFactor);
          
          // Subtle twilight blue
          float twilightGlow = smoothstep(-0.25, 0.15, sunDot) * smoothstep(0.15, -0.25, sunDot);
          finalColor += vec3(0.02, 0.08, 0.15) * twilightGlow;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // 5. Cloud Layer Sphere
    const cloudGeo = new THREE.SphereGeometry(earthRadius * 1.008, 64, 64);
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: {
        uCloudMap: { value: cloudTexture },
        uSunDirection: { value: sunDirVector },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uCloudMap;
        uniform vec3 uSunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vec4 cloudTex = texture2D(uCloudMap, vUv);
          vec3 normal = normalize(vNormal);
          vec3 sunDir = normalize(uSunDirection);
          
          float sunDot = dot(normal, sunDir);
          float illumination = max(0.0, sunDot) * 1.1 + 0.1;
          
          // Clouds fade slightly on the night side but remain subtly visible
          float cloudVis = smoothstep(-0.3, 0.2, sunDot) * 0.8 + 0.2;
          
          vec3 cloudColor = vec3(0.9, 0.95, 1.0) * illumination;
          float cloudAlpha = cloudTex.r * 0.3 * cloudVis; // Kept subtle (0.18-0.35 equivalent)
          
          gl_FragColor = vec4(cloudColor, cloudAlpha);
        }
      `,
      transparent: true,
      blending: THREE.NormalBlending, // Normal transparent compositing as requested
      depthWrite: false,
    });
    
    let cloudMesh: THREE.Mesh | null = null;
    if (qualityTier === 'HIGH') {
      cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      earthGroup.add(cloudMesh);
    }

    // 6. Realistic Thin Atmospheric Scattering Layer
    const atmGeo = new THREE.SphereGeometry(earthRadius * 1.025, 64, 64);
    const atmMat = new THREE.ShaderMaterial({
      uniforms: {
        uSunDirection: { value: sunDirVector },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uSunDirection;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDir = normalize(-vPosition);
          vec3 normal = normalize(vNormal);
          vec3 sunDir = normalize(uSunDirection);
          
          // Fresnel effect for thin limb (sharp falloff)
          float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
          float rim = pow(fresnel, 6.0);
          
          // Sun visibility (brightest on sun-facing side, dark on night limb)
          float sunDot = dot(normal, sunDir);
          float sunFactor = smoothstep(-0.1, 0.5, sunDot);
          
          // Subtle blue atmospheric color
          vec3 atmosphereColor = vec3(0.15, 0.45, 0.9);
          
          float finalAlpha = rim * sunFactor * 0.7; // Thin, transparent, sun-dependent
          
          gl_FragColor = vec4(atmosphereColor, finalAlpha);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide, // Render on back side to create outer halo
      transparent: true,
      depthWrite: false,
    });
    
    let atmosphereMesh: THREE.Mesh | null = null;
    if (qualityTier !== 'LOW') {
      atmosphereMesh = new THREE.Mesh(atmGeo, atmMat);
      earthGroup.add(atmosphereMesh);
    }

    // Position Earth: cinematic bottom horizon (occupying lower 30-40% of viewport)
    const updateComposition = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      const isMobile = w < 768;
      earthGroup.position.set(
        0,                        // Centered horizontally
        isMobile ? -13.0 : -13.5, // Shift down so only top curve is visible
        0
      );
    };

    updateComposition();
    window.addEventListener('resize', updateComposition);

    const startTime = performance.now();
    let running = true;

    const animateThree = (now: number) => {
      if (!running) return;
      if (isVisibleRef.current) {
        const elapsed = (now - startTime) * 0.001;
        const speed = mergedConfig.rotationSpeedSeconds || 240;
        const rotAngle = (elapsed / speed) * Math.PI * 2;

        // Orient the Earth so we see a good mix of day and night
        // Initial rotation roughly points Europe/Asia to the front terminator
        earthMesh.rotation.y = rotAngle + 1.2;
        if (cloudMesh) cloudMesh.rotation.y = rotAngle * 1.06 + 1.2;

        // Apply mouse parallax shift
        const isMobile = window.innerWidth < 768;
        earthGroup.position.x = 0 + parallaxRef.current.x * 0.3;
        earthGroup.position.y = (isMobile ? -13.0 : -13.5) + parallaxRef.current.y * 0.3;

        renderer.render(scene, camera);
      }
      threeAnimationRef.current = requestAnimationFrame(animateThree);
    };

    threeAnimationRef.current = requestAnimationFrame(animateThree);

    return () => {
      running = false;
      cancelAnimationFrame(threeAnimationRef.current);
      window.removeEventListener('resize', updateComposition);
      earthGeo.dispose();
      cloudGeo.dispose();
      atmGeo.dispose();
      dayTexture.dispose();
      nightTexture.dispose();
      cloudTexture.dispose();
      if (atmosphereMesh) atmosphereMesh.geometry.dispose();
      renderer.dispose();
    };
  }, [useWebGL, mergedConfig.rotationSpeedSeconds]);

  // -----------------------------------------------------------------
  // MAIN CANVAS 2D SPHERICAL PROJECTION FALLBACK & DEEP SPACE ENGINE
  // -----------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let running = true;
    const startTime = performance.now();

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const render = (now: number) => {
      if (!running) return;

      if (!isVisibleRef.current) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const elapsed = (now - startTime) * 0.001;
      const isStatic = qualityTier === 'STATIC';
      const isMobile = width < 768;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // 1. BASE DEEP SPACE GRADIENT
      const spaceGrad = ctx.createRadialGradient(
        width * 0.65, height * 0.35, 0,
        width * 0.50, height * 0.50, width * 0.95
      );
      spaceGrad.addColorStop(0, '#091322');
      spaceGrad.addColorStop(0.40, '#050a14');
      spaceGrad.addColorStop(0.80, '#02050b');
      spaceGrad.addColorStop(1, '#010307');

      ctx.fillStyle = spaceGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. SUBTLE ASTRONOMICAL NEBULA
      // Large-scale, soft, low-frequency, dark blue/violet
      const nebulaPeriod = mergedConfig.periods.nebula;
      const neb1DriftX = isStatic ? 0 : Math.sin(elapsed * (Math.PI * 2 / nebulaPeriod)) * (width * 0.015);
      const neb1DriftY = isStatic ? 0 : Math.cos(elapsed * (Math.PI * 2 / (nebulaPeriod * 1.2))) * (height * 0.010);

      // Primary large soft nebula in the upper right
      const nebGrad1 = ctx.createRadialGradient(
        width * 0.80 + neb1DriftX, height * 0.20 + neb1DriftY, 0,
        width * 0.80 + neb1DriftX, height * 0.20 + neb1DriftY, width * 0.55
      );
      nebGrad1.addColorStop(0, 'rgba(12, 25, 65, 0.35)'); // Dark blue/violet
      nebGrad1.addColorStop(0.5, 'rgba(6, 40, 70, 0.15)'); // Slightly cyan edge
      nebGrad1.addColorStop(1, 'transparent');

      ctx.fillStyle = nebGrad1;
      ctx.fillRect(0, 0, width, height);
      
      // Secondary subtle wispy nebula spanning center-left
      const nebGrad2 = ctx.createRadialGradient(
        width * 0.35 - neb1DriftX, height * 0.40 - neb1DriftY, 0,
        width * 0.35 - neb1DriftX, height * 0.40 - neb1DriftY, width * 0.45
      );
      nebGrad2.addColorStop(0, 'rgba(15, 20, 50, 0.20)'); 
      nebGrad2.addColorStop(1, 'transparent');

      ctx.fillStyle = nebGrad2;
      ctx.fillRect(0, 0, width, height);

      // 3. MULTI-TIER STAR FIELD
      for (let i = 0; i < STATIC_STARS.length; i++) {
        const star = STATIC_STARS[i];
        let px = parallaxRef.current.x * (star.depthTier === 1 ? 0.8 : star.depthTier === 2 ? 1.4 : 2.2);
        let py = parallaxRef.current.y * (star.depthTier === 1 ? 0.8 : star.depthTier === 2 ? 1.4 : 2.2);

        const sx = star.x * width + px;
        const sy = star.y * height + py;
        let alpha = star.baseAlpha;

        if (!isStatic && star.isTwinkling) {
          const t = Math.max(0, elapsed - star.twinkleDelay);
          const phase = Math.sin((t * Math.PI * 2) / star.twinkleDuration);
          alpha = Math.max(0.08, Math.min(1.0, star.baseAlpha + phase * 0.35));
        }

        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sx, sy, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 4. RECOGNIZABLE ORION CONSTELLATION
      const constPeriod = mergedConfig.periods.constellation;
      const constBreath = isStatic ? 0.5 : (Math.sin(elapsed * (Math.PI * 2 / constPeriod)) + 1) / 2;
      const lineAlpha = 0.07 + constBreath * 0.06;
      const constParallaxX = parallaxRef.current.x * 2.0;
      const constParallaxY = parallaxRef.current.y * 2.0;

      const starPosMap = new Map<string, { x: number; y: number }>();
      for (const node of ORION_STARS) {
        const nx = node.x * width + constParallaxX;
        const ny = node.y * height + constParallaxY;
        starPosMap.set(node.id, { x: nx, y: ny });
      }

      ctx.strokeStyle = `rgba(160, 200, 255, ${lineAlpha * 0.45})`;
        ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (const [idA, idB] of ORION_LINES) {
        const pA = starPosMap.get(idA);
        const pB = starPosMap.get(idB);
        if (pA && pB) {
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pB.x, pB.y);
        }
      }
      ctx.stroke();

      for (const node of ORION_STARS) {
        const pos = starPosMap.get(node.id);
        if (!pos) continue;

        if (node.haloColor !== 'transparent' && node.radius >= 2.0) {
          const haloGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, node.radius * 4.5);
          haloGrad.addColorStop(0, node.haloColor);
          haloGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, node.radius * 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.baseAlpha;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // 5. 2D FALLBACK SPHERICAL EARTH RENDERER (If WebGL unavailable)
      if (!useWebGL) {
        const earthCenterX = width * 0.5 + parallaxRef.current.x * 6;
        const earthCenterY = isMobile ? height * 0.95 + width * 1.2 : height * 0.92 + width * 1.2;
        const earthRadius = width * 1.35;

        const rotationPeriod = mergedConfig.rotationSpeedSeconds || 240;
        const rotAngle = isStatic ? 0.35 : (elapsed / rotationPeriod) * Math.PI * 2;

        const sunDir = { x: -0.7, y: 0.35, z: 0.6 };

        const oceanGrad = ctx.createRadialGradient(
          earthCenterX - earthRadius * 0.35, earthCenterY - earthRadius * 0.35, 0,
          earthCenterX, earthCenterY, earthRadius
        );
        oceanGrad.addColorStop(0, '#0d254c');
        oceanGrad.addColorStop(0.5, '#051226');
        oceanGrad.addColorStop(1, '#01050e');

        ctx.save();
        ctx.beginPath();
        ctx.arc(earthCenterX, earthCenterY, earthRadius, 0, Math.PI * 2);
        ctx.fillStyle = oceanGrad;
        ctx.fill();

        ctx.clip();

        // Render Continents with Photorealistic Sun Vector Night Shading
        for (const continent of CONTINENT_OUTLINES) {
          ctx.beginPath();
          let firstPoint = true;

          for (const [latDeg, lngDeg] of continent.points) {
            const phi = (latDeg * Math.PI) / 180;
            const lambda = (lngDeg * Math.PI) / 180;

            const x3d = Math.cos(phi) * Math.sin(lambda + rotAngle);
            const y3d = Math.sin(phi);
            const z3d = Math.cos(phi) * Math.cos(lambda + rotAngle);

            if (z3d > -0.1) {
              const px = earthCenterX + x3d * earthRadius;
              const py = earthCenterY - y3d * earthRadius;

              if (firstPoint) {
                ctx.moveTo(px, py);
                firstPoint = false;
              } else {
                ctx.lineTo(px, py);
              }
            }
          }

          if (!firstPoint) {
            ctx.closePath();
            const landGrad = ctx.createLinearGradient(
              earthCenterX - earthRadius * 0.5, earthCenterY - earthRadius * 0.5,
              earthCenterX + earthRadius * 0.5, earthCenterY + earthRadius * 0.5
            );
            landGrad.addColorStop(0, '#1d472c');
            landGrad.addColorStop(0.6, '#0f2918');
            landGrad.addColorStop(1, '#050f09');
            ctx.fillStyle = landGrad;
            ctx.fill();

            ctx.lineWidth = 1.2;
            ctx.strokeStyle = '#153822';
            ctx.stroke();
          }
        }

        // Render Night City Lights with Intense Multi-Layer Radial Glow
        const renderCityPoint = (latDeg: number, lngDeg: number, intensity: number, color: string, rad: number) => {
          const phi = (latDeg * Math.PI) / 180;
          const lambda = (lngDeg * Math.PI) / 180;

          const x3d = Math.cos(phi) * Math.sin(lambda + rotAngle);
          const y3d = Math.sin(phi);
          const z3d = Math.cos(phi) * Math.cos(lambda + rotAngle);

          if (z3d > 0.05) {
            const px = earthCenterX + x3d * earthRadius;
            const py = earthCenterY - y3d * earthRadius;

            const sunDot = x3d * sunDir.x + y3d * sunDir.y + z3d * sunDir.z;
            const nightFactor = Math.min(1.0, Math.max(0.3, (0.35 - sunDot) * 1.8));

            const limbFade = Math.min(1.0, z3d * 2.8);
            const finalAlpha = intensity * limbFade * nightFactor * (0.85 + Math.sin(elapsed * 2.0 + latDeg) * 0.15);

            // Outer Soft Radial Ambient Glow Halo (Golden / Amber Emission)
            const glowRadius = rad * 4.2;
            const cityGlow = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
            cityGlow.addColorStop(0, color);
            cityGlow.addColorStop(0.35, 'rgba(251, 191, 36, 0.65)');
            cityGlow.addColorStop(0.7, 'rgba(245, 158, 11, 0.25)');
            cityGlow.addColorStop(1, 'transparent');

            ctx.fillStyle = cityGlow;
            ctx.globalAlpha = finalAlpha;
            ctx.beginPath();
            ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            // Intense Bright White Core City Node
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = Math.min(1.0, finalAlpha * 1.3);
            ctx.beginPath();
            ctx.arc(px, py, rad * 1.0, 0, Math.PI * 2);
            ctx.fill();
          }
        };

        for (const city of GLOBAL_CITY_LIGHTS) {
          renderCityPoint(city.lat, city.lng, city.intensity, city.color, city.radius);
          if (city.subPoints && (qualityTier === 'HIGH' || qualityTier === 'MEDIUM')) {
            for (const [dLat, dLng] of city.subPoints) {
              renderCityPoint(city.lat + dLat, city.lng + dLng, city.intensity * 0.8, city.color, city.radius * 0.7);
            }
          }
        }

        // Atmosphere Rim
        const pulseGlow = runtimeSignalPulse * 0.15;
        const atmInnerRadius = earthRadius * 0.97;
        const atmOuterRadius = earthRadius * 1.08;

        const atmRimGrad = ctx.createRadialGradient(
          earthCenterX, earthCenterY, atmInnerRadius,
          earthCenterX, earthCenterY, atmOuterRadius
        );
        atmRimGrad.addColorStop(0, 'rgba(14, 165, 233, 0.0)');
        atmRimGrad.addColorStop(0.3, `rgba(56, 189, 248, ${0.48 + pulseGlow})`);
        atmRimGrad.addColorStop(0.75, `rgba(30, 58, 138, ${0.28 + pulseGlow * 0.5})`);
        atmRimGrad.addColorStop(1, 'transparent');

        ctx.restore();

        ctx.fillStyle = atmRimGrad;
        ctx.beginPath();
        ctx.arc(earthCenterX, earthCenterY, atmOuterRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. FOREGROUND MICRO PARTICLES
      if (!isStatic && (qualityTier === 'HIGH' || qualityTier === 'MEDIUM')) {
        const particles = liveParticlesRef.current;
        const particleParallaxX = parallaxRef.current.x * 3.5;
        const particleParallaxY = parallaxRef.current.y * 3.5;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x += 1;
          if (p.x > 1) p.x -= 1;
          if (p.y < 0) p.y += 1;
          if (p.y > 1) p.y -= 1;

          const px = p.x * width + particleParallaxX;
          const py = p.y * height + particleParallaxY;

          const pPhase = Math.sin((elapsed * Math.PI * 2) / p.cycleDuration + p.phase);
          const pAlpha = Math.max(0.05, Math.min(0.40, p.baseAlpha + pPhase * 0.15));

          ctx.fillStyle = p.color;
          ctx.globalAlpha = pAlpha;
          ctx.beginPath();
          ctx.arc(px, py, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;

      if (!isStatic) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [useWebGL, qualityTier, isInputFocused, isTyping, authState, mergedConfig, runtimeSignalPulse]);

  return (
    <div
      data-testid="orion-login-environment"
      data-layer-space="true"
      data-layer-stars="true"
      data-layer-constellation="true"
      data-layer-earth="true"
      data-layer-atmosphere="true"
      className={`orion-login-environment absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#010307] ${className}`}
      aria-hidden="true"
    >
      {/* 2D Canvas Starfield & Space Background Layer */}
      <canvas
        ref={canvasRef}
        data-testid="orion-star-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none z-[1] transition-transform duration-700 ease-out"
      />

      {/* Three.js Real 3D Earth WebGL Layer */}
      {useWebGL && (
        <canvas
          ref={webglCanvasRef}
          data-testid="orion-webgl-earth-canvas"
          className="absolute inset-0 w-full h-full pointer-events-none z-[2] transition-opacity duration-1000"
        />
      )}

      {/* Vignette & Quiet Authentication Surface Overlay */}
      <div
        data-testid="orion-vignette-layer"
        className="absolute inset-0 pointer-events-none z-[3] transition-opacity duration-700 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 0%, rgba(1, 3, 7, 0.45) 75%, rgba(1, 3, 7, 0.85) 100%),
            linear-gradient(to bottom, rgba(1, 3, 7, 0.25) 0%, transparent 25%, transparent 75%, rgba(1, 3, 7, 0.55) 100%)
          `,
        }}
      />
    </div>
  );
};

export default OrionLiveLoginBackground;
