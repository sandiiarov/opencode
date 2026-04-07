import {
  Message,
  MessageContent,
  MessageDebug,
  MessageFooter,
  MessageHeader,
  MessageIcon,
  MessageTitle,
} from "./message"
import { icons } from "../lib/icons"
import { type AssistantEntry, type ReasoningPart } from "../mock-types"
import { theme } from "../lib/theme"

export function MessageThinking(props: { message: AssistantEntry; part: ReasoningPart }) {
  return (
    <Message color={theme.text.muted} onPress={() => {}}>
      <MessageHeader>
        <MessageIcon color={theme.text.muted} isLoading={false}>
          {icons.think}
        </MessageIcon>
        <MessageTitle color={theme.text.muted}>Thinking</MessageTitle>
      </MessageHeader>
      <MessageContent>
        <text fg={theme.text.muted}>{props.part.text}</text>
      </MessageContent>
      <MessageFooter>
        <MessageDebug onPress={() => {}}>[i]</MessageDebug>
      </MessageFooter>
    </Message>
  )
}
