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

function subtitle(message: AssistantMessage) {
  const { info } = message
  const duration = info.time.completed
    ? `${((info.time.completed - info.time.created) / 1000).toFixed(1)}s`
    : "streaming"
  return `${info.agent} · ${info.modelID} · ${duration}`
}

export function MessageToolWrite(props: { message: AssistantMessage; part: ToolPart }) {
  const text =
    props.part.state.status === "running"
      ? JSON.stringify(props.part.state.input, null, 2)
      : `${props.part.state.output}\n\nInput:\n${JSON.stringify(props.part.state.input, null, 2)}`

  return (
    <Message color={theme.accent.warning} onPress={() => {}}>
      <MessageHeader>
        <MessageIcon color={theme.accent.warning} isLoading={props.part.state.status === "running"}>
          
        </MessageIcon>
        <box flexDirection="column" flexGrow={1}>
          <MessageTitle>Write</MessageTitle>
          <MessageSubtitle>{subtitle(props.message)}</MessageSubtitle>
        </box>
      </MessageHeader>
      <MessageContent>
        <text>{text}</text>
      </MessageContent>
      <MessageFooter>
        <MessageSubtitle>{props.part.tool}</MessageSubtitle>
        <MessageDebug onPress={() => {}}>[i]</MessageDebug>
      </MessageFooter>
    </Message>
  )
}
