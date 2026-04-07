import { MessageAssistant } from "./message-assistant"
import { MessageThinking } from "./message-thinking"
import { MessageToolBash } from "./message-tool-bash"
import { MessageToolEdit } from "./message-tool-edit"
import { MessageToolGlob } from "./message-tool-glob"
import { MessageToolGrep } from "./message-tool-grep"
import { MessageToolRead } from "./message-tool-read"
import { MessageToolSkill } from "./message-tool-skill"
import { MessageToolTask } from "./message-tool-task"
import { MessageToolTodo } from "./message-tool-todo"
import { MessageToolWrite } from "./message-tool-write"
import { MessageUser } from "./message-user"
import { type Entry, isAssistantMessage, isReasoningPart, isTextPart, isToolPart, isUserMessage } from "../mock-types"

export function Session(props: { messages: Entry[] }) {
  return (
    <scrollbox width="100%" height="100%" stickyScroll stickyStart="bottom">
      <box flexDirection="column" gap={1} width="100%">
        {props.messages.flatMap((message) => {
          if (isUserMessage(message)) {
            return [<MessageUser key={message.info.id} message={message} />]
          }

          if (!isAssistantMessage(message)) return []

          return message.parts.flatMap((part) => {
            if (isReasoningPart(part)) return [<MessageThinking key={part.id} message={message} part={part} />]
            if (isTextPart(part) && !part.synthetic) {
              return [<MessageAssistant key={part.id} message={message} part={part} />]
            }
            if (!isToolPart(part)) return []

            switch (part.tool) {
              case "bash":
                return [<MessageToolBash key={part.id} message={message} part={part} />]
              case "edit":
                return [<MessageToolEdit key={part.id} message={message} part={part} />]
              case "glob":
                return [<MessageToolGlob key={part.id} message={message} part={part} />]
              case "grep":
                return [<MessageToolGrep key={part.id} message={message} part={part} />]
              case "read":
                return [<MessageToolRead key={part.id} message={message} part={part} />]
              case "skill":
                return [<MessageToolSkill key={part.id} message={message} part={part} />]
              case "task":
                return [<MessageToolTask key={part.id} message={message} part={part} />]
              case "todoread":
              case "todowrite":
                return [<MessageToolTodo key={part.id} message={message} part={part} />]
              case "write":
                return [<MessageToolWrite key={part.id} message={message} part={part} />]
              default:
                return []
            }
          })
        })}
      </box>
    </scrollbox>
  )
}
