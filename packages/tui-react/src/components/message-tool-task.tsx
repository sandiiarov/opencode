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

function subtitle(part: ToolPart) {
  const input = part.state.input as {
    description?: string
    subagent_type?: string
    command?: string
  }

  return [input.description, input.subagent_type, input.command].filter(Boolean).join(" · ")
}

export function MessageToolTask(props: { message: AssistantEntry; part: ToolPart }) {
  const state = props.part.state
  const text =
    "output" in state ? state.output : state.status === "error" ? state.error : JSON.stringify(state.input, null, 2)

  return (
    <Message color={theme.accent.info} onPress={() => {}}>
      <MessageHeader>
        <MessageIcon color={theme.accent.info} isLoading={props.part.state.status === "running"}>
          {icons.task}
        </MessageIcon>
        <MessageTitle>Task</MessageTitle>
        {subtitle(props.part) ? <MessageSubtitle>{subtitle(props.part)}</MessageSubtitle> : null}
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
