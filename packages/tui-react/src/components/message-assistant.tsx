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
import { type AssistantEntry, type TextPart } from "../mock-types"
import { theme } from "../lib/theme"

export function MessageAssistant(props: { message: AssistantEntry; part: TextPart }) {
  return (
    <Message color={theme.text.base} onPress={() => {}}>
      <MessageHeader>
        <MessageIcon color={theme.text.base} isLoading={false}>
          {icons.assistant}
        </MessageIcon>
        <MessageTitle color={theme.text.base}>assistant</MessageTitle>
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
