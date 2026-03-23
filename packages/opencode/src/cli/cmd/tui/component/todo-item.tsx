import { useTheme } from "../context/theme"

export interface TodoItemProps {
  status: string
  content: string
  tone?: "default" | "tool"
  style?: "default" | "sidebar"
}

export function TodoItem(props: TodoItemProps) {
  const { theme } = useTheme()
  const fg =
    props.status === "in_progress" ? theme.warning : props.status === "completed" ? theme.textMuted : theme.textMuted
  const icon = props.status === "completed" ? "" : props.status === "in_progress" ? "" : ""

  return (
    <box flexDirection="row" gap={0}>
      <text flexShrink={0} style={{ fg }}>
        {icon}{" "}
      </text>
      <text flexGrow={1} wrapMode="word" style={{ fg }}>
        {props.content}
      </text>
    </box>
  )
}
