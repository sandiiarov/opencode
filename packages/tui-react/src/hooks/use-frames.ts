import { useEffect, useState } from "react"

export function useFrames(frames: string[], delay: number) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((value) => (value + 1) % frames.length)
    }, delay)
    return () => clearInterval(id)
  }, [delay, frames])

  return frames[frame] ?? frames[0] ?? ""
}
