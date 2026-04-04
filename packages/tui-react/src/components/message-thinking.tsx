import {
  Message,
  MessageContent,
  MessageDebug,
  MessageFooter,
  MessageHeader,
  MessageIcon,
  MessageTitle,
} from "./message"
import { type AssistantMessage, type ReasoningPart } from "../mock-types"
import { theme } from "../lib/theme"

export function MessageThinking(props: { message: AssistantMessage; part: ReasoningPart }) {
  return (
    <Message color={theme.accent.secondary} onPress={() => {}}>
      <MessageHeader>
        <MessageIcon color={theme.accent.secondary} isLoading={false}>
          󰔟
        </MessageIcon>
        <box flexDirection="column" flexGrow={1}>
          <MessageTitle>Thinking</MessageTitle>
        </box>
      </MessageHeader>
      <MessageContent>
        <text>{props.part.text}</text>
      </MessageContent>
      <MessageFooter>
        <MessageDebug onPress={() => {}}>[i]</MessageDebug>
      </MessageFooter>
    </Message>
  )
}
