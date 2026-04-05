import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useTimer } from "./use-timer"

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts in idle state", () => {
    const { result } = renderHook(() => useTimer())

    expect(result.current.state.status).toBe("idle")
    expect(result.current.state.totalSeconds).toBe(0)
    expect(result.current.state.remainingSeconds).toBe(0)
  })

  it("starts a timer with given duration", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(300) // 5 minutes
    })

    expect(result.current.state.status).toBe("running")
    expect(result.current.state.totalSeconds).toBe(300)
    expect(result.current.state.remainingSeconds).toBe(300)
  })

  it("counts down over time", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(60)
    })

    // Advance 10 seconds (40 ticks at 250ms)
    act(() => {
      vi.advanceTimersByTime(10000)
    })

    // remainingSeconds should be approximately 50
    expect(result.current.state.remainingSeconds).toBeLessThanOrEqual(50)
    expect(result.current.state.remainingSeconds).toBeGreaterThanOrEqual(49)
    expect(result.current.state.status).toBe("running")
  })

  it("pauses the timer", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(120)
    })

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    act(() => {
      result.current.pause()
    })

    expect(result.current.state.status).toBe("paused")
    const pausedRemaining = result.current.state.remainingSeconds

    // Advance more time — remaining should not change
    act(() => {
      vi.advanceTimersByTime(10000)
    })

    expect(result.current.state.remainingSeconds).toBe(pausedRemaining)
    expect(result.current.state.status).toBe("paused")
  })

  it("resumes the timer after pause", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(120)
    })

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    act(() => {
      result.current.pause()
    })

    const pausedRemaining = result.current.state.remainingSeconds

    act(() => {
      result.current.resume()
    })

    expect(result.current.state.status).toBe("running")

    // After resume and advancing 5 more seconds
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.state.remainingSeconds).toBeLessThan(pausedRemaining)
  })

  it("resets the timer to idle", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(60)
    })

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.state.status).toBe("idle")
    expect(result.current.state.totalSeconds).toBe(0)
    expect(result.current.state.remainingSeconds).toBe(0)
  })

  it("transitions to finished when timer reaches zero", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(3) // 3 seconds
    })

    act(() => {
      vi.advanceTimersByTime(4000) // Advance past the end
    })

    expect(result.current.state.status).toBe("finished")
    expect(result.current.state.remainingSeconds).toBe(0)
  })

  it("can reset from finished state", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(2)
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.state.status).toBe("finished")

    act(() => {
      result.current.reset()
    })

    expect(result.current.state.status).toBe("idle")
    expect(result.current.state.remainingSeconds).toBe(0)
  })

  it("can start a new timer while one is running (replaces it)", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.start(120)
    })

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    act(() => {
      result.current.start(60) // Start a new timer
    })

    expect(result.current.state.status).toBe("running")
    expect(result.current.state.totalSeconds).toBe(60)
    expect(result.current.state.remainingSeconds).toBe(60)
  })

  it("does not resume when paused remaining is zero", () => {
    const { result } = renderHook(() => useTimer())

    // Try to resume without ever starting
    act(() => {
      result.current.resume()
    })

    expect(result.current.state.status).toBe("idle")
  })

  it("does not pause when not running", () => {
    const { result } = renderHook(() => useTimer())

    act(() => {
      result.current.pause()
    })

    // Should still be idle — no crash
    expect(result.current.state.status).toBe("idle")
  })

  it("cleans up interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval")
    const { result, unmount } = renderHook(() => useTimer())

    act(() => {
      result.current.start(60)
    })

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
