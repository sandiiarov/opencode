import {
  Message,
  MessageContent,
  MessageDebug,
  MessageFooter,
  MessageHeader,
  MessageIcon,
  MessageSubtitle,
  MessageTitle,
} from "./message"
import { type AssistantMessage, type ToolPart } from "../mock-types"
import { theme } from "../lib/theme"

function subtitle(part: ToolPart) {
  return Object.entries(part.state.input)
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" · ")
}

export function MessageToolGrep(props: { message: AssistantMessage; part: ToolPart }) {
  const text =
    props.part.state.status === "running"
      ? JSON.stringify(props.part.state.input, null, 2)
      : `${props.part.state.output}\n\nInput:\n${JSON.stringify(props.part.state.input, null, 2)}`

  return (
    <Message color={theme.accent.focus} onPress={() => {}}>
      <MessageHeader>
        <MessageIcon color={theme.accent.focus} isLoading={props.part.state.status === "running"}>
          󰱼
        </MessageIcon>
        <box flexDirection="column" flexGrow={1}>
          <MessageTitle>Grep</MessageTitle>
          <MessageSubtitle>{subtitle(props.part)}</MessageSubtitle>
        </box>
      </MessageHeader>
      <MessageContent>
        <text>{text}</text>
      </MessageContent>
      <MessageFooter>
        <MessageDebug onPress={() => {}}>[i]</MessageDebug>
      </MessageFooter>
    </Message>
  )
}
