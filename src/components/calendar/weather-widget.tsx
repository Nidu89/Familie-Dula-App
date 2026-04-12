"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Loader2,
  MapPin,
  Droplets,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

// ── Types ────────────────────────────────────────────────────

interface CurrentWeather {
  temperature: number
  weatherCode: number
}

interface HourlyForecast {
  time: string
  temperature: number
  weatherCode: number
}

interface DailyForecast {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
  precipProbability: number
}

interface WeatherState {
  current: CurrentWeather
  hourly: HourlyForecast[]
  daily: DailyForecast[]
  locationName: string | null
}

interface CachedLocation {
  lat: number
  lon: number
  name: string | null
  timestamp: number
}

// ── Constants ────────────────────────────────────────────────

const FALLBACK_LAT = 46.95
const FALLBACK_LON = 7.45
const LOCATION_CACHE_KEY = "weather-location"
const LOCATION_CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

// ── Helpers ──────────────────────────────────────────────────

function getWeatherIcon(code: number): LucideIcon {
  if (code === 0) return Sun
  if (code <= 3) return Cloud
  if (code <= 48) return CloudFog
  if (code <= 55) return CloudDrizzle
  if (code <= 67) return CloudRain
  if (code <= 77) return CloudSnow
  if (code <= 82) return CloudRain
  if (code <= 86) return CloudSnow
  if (code <= 99) return CloudLightning
  return Cloud
}

function getWeatherLabelKey(code: number): string {
  if (code === 0) return "clear"
  if (code <= 3) return "cloudy"
  if (code <= 48) return "foggy"
  if (code <= 55) return "drizzle"
  if (code <= 67) return "rain"
  if (code <= 77) return "snow"
  if (code <= 82) return "rainShower"
  if (code <= 86) return "snowShower"
  if (code <= 99) return "thunderstorm"
  return "unknown"
}

function getWeatherMessageKey(code: number): string {
  if (code === 0) return "msgClear"
  if (code <= 3) return "msgCloudy"
  if (code <= 48) return "msgFoggy"
  if (code <= 67) return "msgRain"
  if (code <= 77) return "msgSnow"
  if (code <= 86) return "msgSnowShower"
  if (code <= 99) return "msgThunderstorm"
  return "msgClear"
}

function getCachedLocation(): CachedLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY)
    if (!raw) return null
    const cached: CachedLocation = JSON.parse(raw)
    if (Date.now() - cached.timestamp > LOCATION_CACHE_TTL) {
      localStorage.removeItem(LOCATION_CACHE_KEY)
      return null
    }
    return cached
  } catch {
    return null
  }
}

function saveCachedLocation(lat: number, lon: number, name: string | null) {
  try {
    const data: CachedLocation = { lat, lon, name, timestamp: Date.now() }
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable — ignore
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=de`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.address?.city || data.address?.town || data.address?.village || data.display_name?.split(",")[0] || null
  } catch {
    return null
  }
}

async function fetchFullWeather(lat: number, lon: number): Promise<Omit<WeatherState, "locationName"> | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&hourly=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
      `&forecast_days=7&timezone=auto`
    )
    if (!res.ok) return null
    const data = await res.json()

    // Current
    const current: CurrentWeather = {
      temperature: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
    }

    // Hourly: next 24h from now
    const nowHour = new Date().getHours()
    const hourly: HourlyForecast[] = data.hourly.time
      .map((time: string, i: number) => ({
        time,
        temperature: Math.round(data.hourly.temperature_2m[i]),
        weatherCode: data.hourly.weather_code[i],
      }))
      .slice(nowHour, nowHour + 24)

    // Daily: 7 days
    const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
      date,
      maxTemp: Math.round(data.daily.temperature_2m_max[i]),
      minTemp: Math.round(data.daily.temperature_2m_min[i]),
      weatherCode: data.daily.weather_code[i],
      precipProbability: data.daily.precipitation_probability_max[i],
    }))

    return { current, hourly, daily }
  } catch {
    return null
  }
}

// ── Component ────────────────────────────────────────────────

export function WeatherWidget() {
  const t = useTranslations("calendar.weather")
  const [weather, setWeather] = useState<WeatherState | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const loadWeather = useCallback(async (lat: number, lon: number, locationName: string | null) => {
    const data = await fetchFullWeather(lat, lon)
    if (data) {
      setWeather({ ...data, locationName })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // 1. Check localStorage cache
    const cached = getCachedLocation()

    if (cached) {
      // Use cached location — no browser prompt
      loadWeather(cached.lat, cached.lon, cached.name)
    } else {
      // Load fallback immediately
      loadWeather(FALLBACK_LAT, FALLBACK_LON, null)
    }

    // 2. Try geolocation (only if no cache — avoids repeated prompts)
    if (!cached && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          const name = await reverseGeocode(latitude, longitude)
          saveCachedLocation(latitude, longitude, name)
          loadWeather(latitude, longitude, name)
        },
        () => {
          // Denied or error — cache fallback so we don't ask again
          reverseGeocode(FALLBACK_LAT, FALLBACK_LON).then((name) => {
            saveCachedLocation(FALLBACK_LAT, FALLBACK_LON, name)
            setWeather((prev) => prev ? { ...prev, locationName: name } : prev)
          })
        },
        { timeout: 5000 }
      )
    }
  }, [loadWeather])

  if (loading || !weather) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-secondary p-6 text-white">
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
          {t("title")}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-white/50" />
          <p className="text-sm text-white/50">{t("loading")}</p>
        </div>
      </div>
    )
  }

  const { current, hourly, daily } = weather
  const CurrentIcon = getWeatherIcon(current.weatherCode)
  const todayForecast = daily[0]

  function formatHour(timeStr: string) {
    return new Date(timeStr).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  }

  function formatDay(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00")
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === now.toDateString()) return t("today")
    if (date.toDateString() === tomorrow.toDateString()) return t("tomorrow")
    return date.toLocaleDateString(undefined, { weekday: "short" })
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-secondary text-white">
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />

      {/* ── Current Weather ─────────────────────────── */}
      <div className="p-6 pb-4">
        {/* Location */}
        {weather.locationName && (
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="h-3 w-3 text-white/60" />
            <p className="text-xs font-medium text-white/70">{weather.locationName}</p>
          </div>
        )}
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
          {t("title")}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="font-display text-3xl sm:text-5xl font-extrabold">
              {current.temperature}°
            </p>
            <p className="mt-1 font-display text-lg font-bold">
              {t(getWeatherLabelKey(current.weatherCode))}
            </p>
            {todayForecast && (
              <p className="mt-0.5 text-xs text-white/60">
                {t("highLow", { high: todayForecast.maxTemp, low: todayForecast.minTemp })}
              </p>
            )}
          </div>
          <CurrentIcon className="h-14 w-14 text-white/80" strokeWidth={1.5} />
        </div>

        <p className="mt-3 text-sm text-white/70">
          {t(getWeatherMessageKey(current.weatherCode))}
        </p>
      </div>

      {/* ── Expand Toggle ───────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-1 py-2 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white/80 transition-colors"
      >
        {expanded ? t("showLess") : t("showMore")}
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {/* ── Expanded: Hourly + 7-Day ────────────────── */}
      {expanded && (
        <div className="px-6 pb-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Hourly forecast — next 12 hours */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">
              {t("hourlyTitle")}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
              {hourly.slice(0, 12).map((h) => {
                const HourIcon = getWeatherIcon(h.weatherCode)
                return (
                  <div key={h.time} className="flex shrink-0 flex-col items-center gap-1.5">
                    <p className="text-[10px] text-white/50">{formatHour(h.time)}</p>
                    <HourIcon className="h-4 w-4 text-white/70" strokeWidth={1.5} />
                    <p className="text-xs font-bold">{h.temperature}°</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 7-day forecast */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-3">
              {t("weekTitle")}
            </p>
            <div className="space-y-2">
              {daily.map((d) => {
                const DayIcon = getWeatherIcon(d.weatherCode)
                return (
                  <div key={d.date} className="flex items-center gap-3">
                    <p className="w-10 text-xs font-medium text-white/70 shrink-0">
                      {formatDay(d.date)}
                    </p>
                    <DayIcon className="h-4 w-4 text-white/60 shrink-0" strokeWidth={1.5} />
                    {d.precipProbability > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-blue-300 shrink-0 w-10">
                        <Droplets className="h-3 w-3" />
                        {d.precipProbability}%
                      </span>
                    )}
                    {d.precipProbability === 0 && <span className="w-10 shrink-0" />}
                    <div className="flex-1 flex items-center gap-2 justify-end">
                      <span className="text-xs text-white/50">{d.minTemp}°</span>
                      <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-300 to-amber-300"
                          style={{
                            marginLeft: `${Math.max(0, ((d.minTemp + 10) / 50) * 100)}%`,
                            width: `${Math.max(10, ((d.maxTemp - d.minTemp) / 30) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold">{d.maxTemp}°</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
