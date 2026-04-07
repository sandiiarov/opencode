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
import { icons, pathlabel } from "../lib/icons"
import { isFilePart, isTextPart, type TextPart, type UserEntry } from "../mock-types"
import { theme } from "../lib/theme"

function attachments(message: UserEntry) {
  const files = message.parts.filter(isFilePart)
  if (files.length === 0) return ""
  return files.map((file) => file.filename ?? file.mime).join(" · ")
}

export function MessageUser(props: { message: UserEntry }) {
  const text = props.message.parts.find((part): part is TextPart => isTextPart(part) && !part.synthetic)
  const files = props.message.parts.filter(isFilePart)

  if (!text) return null

  return (
    <Message color={theme.accent.primary} onPress={() => {}}>
      <MessageHeader>
        <MessageIcon color={theme.accent.primary} isLoading={false}>
          {icons.user}
        </MessageIcon>
        <MessageTitle>User</MessageTitle>
        {attachments(props.message) ? <MessageSubtitle>{attachments(props.message)}</MessageSubtitle> : null}
      </MessageHeader>
      <MessageContent>
        <text>{text.text}</text>
        {files.map((file) => (
          <text key={file.id}>
            <span style={{ bg: theme.surface.muted, fg: theme.text.base }}>
              {" "}
              {pathlabel(file.filename ?? file.mime)}{" "}
            </span>
          </text>
        ))}
      </MessageContent>
      <MessageFooter>
        <MessageSubtitle>{formatTime(props.message.info.time.created)}</MessageSubtitle>
        <MessageDebug onPress={() => {}}>[i]</MessageDebug>
      </MessageFooter>
    </Message>
  )
}
