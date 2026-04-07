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
import { icons } from "../lib/icons"
import { type AssistantEntry, type ToolPart } from "../mock-types"
import { theme } from "../lib/theme"

function subtitle(message: AssistantEntry) {
  const duration = message.info.time.completed
    ? `${((message.info.time.completed - message.info.time.created) / 1000).toFixed(1)}s`
    : "streaming"
  return `${message.info.agent} · ${message.info.modelID} · ${duration}`
}

export function MessageToolWrite(props: { message: AssistantEntry; part: ToolPart }) {
  const state = props.part.state
  const text =
    "output" in state
      ? `${state.output}\n\nInput:\n${JSON.stringify(state.input, null, 2)}`
      : state.status === "error"
        ? `${state.error}\n\nInput:\n${JSON.stringify(state.input, null, 2)}`
        : JSON.stringify(state.input, null, 2)

  return (
    <Message color={theme.accent.warning} onPress={() => {}}>
      <MessageHeader>
        <MessageIcon color={theme.accent.warning} isLoading={props.part.state.status === "running"}>
          {icons.write}
        </MessageIcon>
        <MessageTitle>Write</MessageTitle>
        <MessageSubtitle>{subtitle(props.message)}</MessageSubtitle>
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
