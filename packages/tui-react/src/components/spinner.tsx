import { useFrames } from "../hooks/use-frames"

interface SpinnerProps {
  color: string
}

export function Spinner(props: SpinnerProps) {
  const frame = useFrames(["⣷", "⣯", "⣟", "⡿", "⢿", "⣻", "⣽", "⣾"], 80)

  return <text fg={props.color}>{frame}</text>
}
