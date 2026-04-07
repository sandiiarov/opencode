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
  return Object.entries(part.state.input)
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" · ")
}

export function MessageToolSkill(props: { message: AssistantEntry; part: ToolPart }) {
  const state = props.part.state
  const text =
    "output" in state
      ? `${state.output}\n\nInput:\n${JSON.stringify(state.input, null, 2)}`
      : state.status === "error"
        ? `${state.error}\n\nInput:\n${JSON.stringify(state.input, null, 2)}`
        : JSON.stringify(state.input, null, 2)

  return (
    <Message color={theme.accent.info} onPress={() => {}}>
      <MessageHeader>
        <MessageIcon color={theme.accent.info} isLoading={props.part.state.status === "running"}>
          {icons.skill}
        </MessageIcon>
        <MessageTitle>Skill</MessageTitle>
        <MessageSubtitle>{subtitle(props.part)}</MessageSubtitle>
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
