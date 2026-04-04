import {
  Message,
  MessageContent,
  MessageDebug,
  MessageFooter,
  MessageHeader,
  MessageIcon,
  MessageTitle,
} from "./message"
import { type AssistantMessage, type TextPart } from "../mock-types"
import { theme } from "../lib/theme"

export function MessageAssistant(props: { message: AssistantMessage; part: TextPart }) {
  return (
    <Message color={theme.accent.success} onPress={() => {}}>
      <MessageHeader>
        <MessageIcon color={theme.accent.success} isLoading={false}>
          
        </MessageIcon>
        <box flexDirection="column" flexGrow={1}>
          <MessageTitle>Assistant</MessageTitle>
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
