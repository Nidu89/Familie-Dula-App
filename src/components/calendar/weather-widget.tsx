"use client"

import { useState, useEffect } from "react"
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Loader2,
  type LucideIcon,
} from "lucide-react"

interface WeatherData {
  temperature: number
  weatherCode: number
}

// Bern, Schweiz
const FALLBACK_LAT = 46.95
const FALLBACK_LON = 7.45

// WMO Weather interpretation codes → label + icon
function getWeatherInfo(code: number): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Klar", Icon: Sun }
  if (code <= 3) return { label: "Bewoelkt", Icon: Cloud }
  if (code <= 48) return { label: "Nebelig", Icon: CloudFog }
  if (code <= 55) return { label: "Nieselregen", Icon: CloudDrizzle }
  if (code <= 67) return { label: "Regen", Icon: CloudRain }
  if (code <= 77) return { label: "Schnee", Icon: CloudSnow }
  if (code <= 82) return { label: "Regenschauer", Icon: CloudRain }
  if (code <= 86) return { label: "Schneeschauer", Icon: CloudSnow }
  if (code <= 99) return { label: "Gewitter", Icon: CloudLightning }
  return { label: "Unbekannt", Icon: Cloud }
}

function getWeatherMessage(code: number): string {
  if (code === 0) return "Perfektes Wetter fuer draussen!"
  if (code <= 3) return "Ein paar Wolken, aber angenehm."
  if (code <= 48) return "Vorsicht, schlechte Sicht!"
  if (code <= 67) return "Regenschirm nicht vergessen!"
  if (code <= 77) return "Warm anziehen, es schneit!"
  if (code <= 86) return "Schneeschauer moeglich."
  if (code <= 99) return "Besser drinnen bleiben!"
  return ""
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
    )
    if (!res.ok) return null
    const data = await res.json()
    return {
      temperature: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
    }
  } catch {
    return null
  }
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load immediately with fallback location
    fetchWeather(FALLBACK_LAT, FALLBACK_LON).then((data) => {
      if (data) setWeather(data)
      setLoading(false)
    })

    // Then try to upgrade with real geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude).then((data) => {
            if (data) setWeather(data)
          })
        },
        () => {}, // Already have fallback data, ignore error
        { timeout: 5000 }
      )
    }
  }, [])

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-secondary p-6 text-white">
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />

      <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
        Lokales Wetter
      </p>

      {loading || !weather ? (
        <div className="mt-4 flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-white/50" />
          <p className="text-sm text-white/50">Wird geladen...</p>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="font-display text-5xl font-extrabold">
                {weather.temperature}°
              </p>
              <p className="mt-1 font-display text-lg font-bold">
                {getWeatherInfo(weather.weatherCode).label}
              </p>
            </div>
            {(() => {
              const { Icon } = getWeatherInfo(weather.weatherCode)
              return <Icon className="h-14 w-14 text-white/80" strokeWidth={1.5} />
            })()}
          </div>

          <p className="mt-3 text-sm text-white/70">
            {getWeatherMessage(weather.weatherCode)}
          </p>
        </>
      )}
    </div>
  )
}
