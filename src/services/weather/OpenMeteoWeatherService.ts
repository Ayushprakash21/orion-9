/**
 * OPEN-METEO WEATHER SERVICE
 * Production-grade client for live weather conditions using Open-Meteo REST API.
 * Free, open, zero-API-key service with caching, geo-resolution, and fail-safe states.
 */

export interface WeatherCondition {
  temperatureC: number;
  temperatureF: number;
  weatherCode: number;
  description: string;
  isDay: boolean;
  highC?: number;
  lowC?: number;
  city: string;
  updatedAt: string;
  isStale?: boolean;
}

export interface WeatherLocationConfig {
  city: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export const DEFAULT_WEATHER_LOCATIONS: WeatherLocationConfig[] = [
  { city: 'New York', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { city: 'London', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { city: 'Tokyo', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { city: 'Frankfurt', latitude: 50.1109, longitude: 8.6821, timezone: 'Europe/Berlin' },
  { city: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },
  { city: 'Sydney', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
];

/**
 * WMO Weather interpretation codes (WW) to human readable description
 */
export function interpretWmoCode(code: number): string {
  switch (code) {
    case 0: return 'Clear sky';
    case 1: return 'Mainly clear';
    case 2: return 'Partly cloudy';
    case 3: return 'Overcast';
    case 45: return 'Fog';
    case 48: return 'Depositing rime fog';
    case 51: return 'Light drizzle';
    case 53: return 'Moderate drizzle';
    case 55: return 'Dense drizzle';
    case 61: return 'Slight rain';
    case 63: return 'Moderate rain';
    case 65: return 'Heavy rain';
    case 71: return 'Slight snowfall';
    case 73: return 'Moderate snowfall';
    case 75: return 'Heavy snowfall';
    case 77: return 'Snow grains';
    case 80: return 'Slight rain showers';
    case 81: return 'Moderate rain showers';
    case 82: return 'Violent rain showers';
    case 85: return 'Slight snow showers';
    case 86: return 'Heavy snow showers';
    case 95: return 'Thunderstorm';
    case 96: return 'Thunderstorm with slight hail';
    case 99: return 'Thunderstorm with heavy hail';
    default: return 'Clear';
  }
}

class OpenMeteoWeatherService {
  private static instance: OpenMeteoWeatherService;
  private cache: Map<string, { data: WeatherCondition; expiry: number }> = new Map();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes cache
  private activeLocation: WeatherLocationConfig = DEFAULT_WEATHER_LOCATIONS[0];

  private constructor() {
    this.restoreLocationPreference();
  }

  public static getInstance(): OpenMeteoWeatherService {
    if (!OpenMeteoWeatherService.instance) {
      OpenMeteoWeatherService.instance = new OpenMeteoWeatherService();
    }
    return OpenMeteoWeatherService.instance;
  }

  private restoreLocationPreference(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('orion-weather-location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
            this.activeLocation = parsed;
          }
        }
      } catch {}
    }
  }

  public setLocation(location: WeatherLocationConfig): void {
    this.activeLocation = location;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('orion-weather-location', JSON.stringify(location));
        window.dispatchEvent(new CustomEvent('orion-weather-location-changed', { detail: location }));
      } catch {}
    }
  }

  public getLocation(): WeatherLocationConfig {
    return this.activeLocation;
  }

  /**
   * Fetches live current weather conditions from Open-Meteo REST API.
   * If offline or error occurs, falls back to recent cache or returns null.
   */
  public async fetchCurrentWeather(loc?: WeatherLocationConfig): Promise<WeatherCondition | null> {
    const target = loc || this.activeLocation;
    const cacheKey = `${target.latitude.toFixed(2)}:${target.longitude.toFixed(2)}`;

    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiry > now) {
      return cached.data;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${target.latitude}&longitude=${target.longitude}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Open-Meteo API returned status ${response.status}`);
      }

      const json = await response.json();
      if (!json || !json.current) {
        throw new Error('Malformed Open-Meteo response payload');
      }

      const current = json.current;
      const daily = json.daily || {};
      const tempC = Math.round(current.temperature_2m);
      const tempF = Math.round((tempC * 9) / 5 + 32);
      const weatherCode = current.weather_code ?? 0;
      const description = interpretWmoCode(weatherCode);
      const isDay = current.is_day === 1;

      const highC = Array.isArray(daily.temperature_2m_max) && daily.temperature_2m_max.length > 0
        ? Math.round(daily.temperature_2m_max[0])
        : undefined;
      const lowC = Array.isArray(daily.temperature_2m_min) && daily.temperature_2m_min.length > 0
        ? Math.round(daily.temperature_2m_min[0])
        : undefined;

      const condition: WeatherCondition = {
        temperatureC: tempC,
        temperatureF: tempF,
        weatherCode,
        description,
        isDay,
        highC,
        lowC,
        city: target.city,
        updatedAt: new Date().toISOString(),
        isStale: false
      };

      this.cache.set(cacheKey, {
        data: condition,
        expiry: now + this.CACHE_TTL_MS
      });

      return condition;
    } catch (err) {
      console.warn(`[WEATHER-SERVICE] Live fetch failed for ${target.city}:`, err);
      if (cached) {
        return {
          ...cached.data,
          isStale: true
        };
      }
      return null;
    }
  }
}

export const weatherService = OpenMeteoWeatherService.getInstance();
