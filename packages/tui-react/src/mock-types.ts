import {
  type AssistantMessage as AssistantInfo,
  type FilePart,
  type Message,
  type Part,
  type ReasoningPart,
  type TextPart,
  type ToolPart,
  type UserMessage as UserInfo,
} from "@kx/sdk/v2"

export type Info = Message
export type Entry = {
  info: Info
  parts: Part[]
}

export type UserEntry = Entry & {
  info: UserInfo
}

export type AssistantEntry = Entry & {
  info: AssistantInfo
}

export { type FilePart, type Part, type ReasoningPart, type TextPart, type ToolPart, type UserInfo, type AssistantInfo }

export function isUserMessage(message: Entry): message is UserEntry {
  return message.info.role === "user"
}

export function isAssistantMessage(message: Entry): message is AssistantEntry {
  return message.info.role === "assistant"
}

export function isTextPart(part: Part): part is TextPart {
  return part.type === "text"
}

export function isReasoningPart(part: Part): part is ReasoningPart {
  return part.type === "reasoning"
}

export function isToolPart(part: Part): part is ToolPart {
  return part.type === "tool"
}

export function isFilePart(part: Part): part is FilePart {
  return part.type === "file"
}
