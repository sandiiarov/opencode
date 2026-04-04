import { type CliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { MessageAssistant } from "./components/message-assistant"
import { MessageThinking } from "./components/message-thinking"
import { MessageToolGlob } from "./components/message-tool-glob"
import { MessageToolGrep } from "./components/message-tool-grep"
import { MessageToolRead } from "./components/message-tool-read"
import { MessageToolTodowrite } from "./components/message-tool-todowrite"
import { MessageUser } from "./components/message-user"
import { mockMessages } from "./mock-data"
import { isAssistantMessage, isReasoningPart, isTextPart, isToolPart, isUserMessage } from "./mock-types"

function Screen() {
  return (
    <box width="100%" height="100%" padding={1}>
      <box flexDirection="column" gap={1} width="100%">
        {mockMessages.flatMap((entry) => {
          if (isUserMessage(entry)) {
            return [<MessageUser key={entry.info.id} message={entry} />]
          }

          if (!isAssistantMessage(entry)) return []

          const message = entry
          return entry.parts.flatMap((part) => {
            if (isReasoningPart(part)) return [<MessageThinking key={part.id} message={message} part={part} />]
            if (isTextPart(part) && !part.synthetic)
              return [<MessageAssistant key={part.id} message={message} part={part} />]
            if (!isToolPart(part)) return []

            switch (part.tool) {
              case "todowrite":
                return [<MessageToolTodowrite key={part.id} message={message} part={part} />]
              case "read":
                return [<MessageToolRead key={part.id} message={message} part={part} />]
              case "glob":
                return [<MessageToolGlob key={part.id} message={message} part={part} />]
              case "grep":
                return [<MessageToolGrep key={part.id} message={message} part={part} />]
              default:
                return []
            }
          })
        })}
      </box>
    </box>
  )
}

export function mount(renderer: CliRenderer) {
  createRoot(renderer).render(<Screen />)
}
