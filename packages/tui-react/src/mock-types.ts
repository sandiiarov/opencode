export type UserInfo = {
  id: string
  sessionID: string
  role: "user"
  time: {
    created: number
  }
  agent: string
  model: {
    providerID: string
    modelID: string
  }
}

export type AssistantInfo = {
  id: string
  sessionID: string
  role: "assistant"
  parentID: string
  time: {
    created: number
    completed?: number
  }
  providerID: string
  modelID: string
  agent: string
  mode: string
  path: {
    cwd: string
    root: string
  }
  cost: number
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
    total?: number
  }
  finish?: string
}

export type TextPart = {
  id: string
  sessionID: string
  messageID: string
  type: "text"
  text: string
  synthetic?: boolean
}

export type ReasoningPart = {
  id: string
  sessionID: string
  messageID: string
  type: "reasoning"
  text: string
  time: {
    start: number
    end?: number
  }
}

export type FilePart = {
  id: string
  sessionID: string
  messageID: string
  type: "file"
  mime: string
  filename?: string
  url: string
}

export type ToolStateRunning = {
  status: "running"
  input: Record<string, unknown>
  title?: string
  metadata?: Record<string, unknown>
  time: {
    start: number
  }
}

export type ToolStateCompleted = {
  status: "completed"
  input: Record<string, unknown>
  output: string
  title: string
  metadata: Record<string, unknown>
  time: {
    start: number
    end: number
  }
}

export type ToolPart = {
  id: string
  sessionID: string
  messageID: string
  type: "tool"
  callID: string
  tool: string
  state: ToolStateRunning | ToolStateCompleted
}

export type Part = TextPart | ReasoningPart | FilePart | ToolPart
export type Info = UserInfo | AssistantInfo
export type Entry = {
  info: Info
  parts: Part[]
}

export type UserMessage = {
  info: UserInfo
  parts: Part[]
}

export type AssistantMessage = {
  info: AssistantInfo
  parts: Part[]
}

export function isUserMessage(message: Entry): message is UserMessage {
  return message.info.role === "user"
}

export function isAssistantMessage(message: Entry): message is AssistantMessage {
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
