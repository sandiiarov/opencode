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
import { formatTime } from "../lib/format"
import { isFilePart, isTextPart, type TextPart, type UserMessage } from "../mock-types"
import { theme } from "../lib/theme"

function attachments(message: UserMessage) {
  const files = message.parts.filter(isFilePart)
  if (files.length === 0) return ""
  return files.map((file) => file.filename ?? file.mime).join(" · ")
}

export function MessageUser(props: { message: UserMessage }) {
  const text = props.message.parts.find((part): part is TextPart => isTextPart(part) && !part.synthetic)
  const files = props.message.parts.filter(isFilePart)

  if (!text) return null

  return (
    <Message color={theme.accent.primary} onPress={() => {}}>
      <MessageHeader>
        <MessageIcon color={theme.accent.primary} isLoading={false}>
          
        </MessageIcon>
        <box flexDirection="column" flexGrow={1}>
          <MessageTitle>User</MessageTitle>
          {attachments(props.message) ? <MessageSubtitle>{attachments(props.message)}</MessageSubtitle> : null}
        </box>
      </MessageHeader>
      <MessageContent>
        <text>{text.text}</text>
        {files.length > 0 ? (
          <box flexDirection="row" gap={1} flexWrap="wrap">
            {files.map((file) => (
              <text key={file.id}>
                <span style={{ bg: theme.surface.muted, fg: theme.text.base }}> {file.filename ?? file.mime} </span>
              </text>
            ))}
          </box>
        ) : null}
      </MessageContent>
      <MessageFooter>
        <MessageSubtitle>{formatTime(props.message.info.time.created)}</MessageSubtitle>
        <MessageDebug onPress={() => {}}>[i]</MessageDebug>
      </MessageFooter>
    </Message>
  )
}
