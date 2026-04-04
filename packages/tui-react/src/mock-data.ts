import { type Entry } from "./mock-types"

const sessionID = "ses_2a9f3f0e4ffebDx8xd0s6xirSe"

export const mockMessages: Entry[] = [
  {
    info: {
      id: "msg_d560c0f1e001z5KhsdCuWiVsvA",
      sessionID,
      role: "user",
      time: {
        created: 1775265124134,
      },
      agent: "build",
      model: {
        providerID: "openai",
        modelID: "gpt-5.4",
      },
    },
    parts: [
      {
        id: "prt_d560c0f1f001yQ3MXkfgUmUnqa",
        sessionID,
        messageID: "msg_d560c0f1e001z5KhsdCuWiVsvA",
        type: "text",
        text: "@packages/kx/src/session/message.ts \n\n@plan-solit-to-react-tui-plan.md \n\nI want to create message component first.\n\nIt should have the same left border, bg color, change bg on hover.\nMessage should be compaund component.\n\nMessage\nMessageHeader\nMessageIcon (children is icon, isLoading)\nMessageTitle\nMessageSubtitle\nMessageContent\nMessageFooter\nMessageDebug (it should be a button with text [icon] Debug ctrl+d)",
      },
      {
        id: "prt_d560c0f1f002R9EE0jbtYeOMhx",
        sessionID,
        messageID: "msg_d560c0f1e001z5KhsdCuWiVsvA",
        type: "file",
        mime: "text/plain",
        filename: "packages/kx/src/session/message.ts",
        url: "file:///Users/alexsandiiarov/Documents/dotfiles/kx/packages/kx/src/session/message.ts",
      },
      {
        id: "prt_d560c0f1f003Ic1R7U542NIkjE",
        sessionID,
        messageID: "msg_d560c0f1e001z5KhsdCuWiVsvA",
        type: "file",
        mime: "text/plain",
        filename: "plan-solit-to-react-tui-plan.md",
        url: "file:///Users/alexsandiiarov/Documents/dotfiles/kx/plan-solit-to-react-tui-plan.md",
      },
    ],
  },
  {
    info: {
      id: "msg_d560c0f34001q5iPeS8xmjZYAy",
      sessionID,
      role: "assistant",
      parentID: "msg_d560c0f1e001z5KhsdCuWiVsvA",
      time: {
        created: 1775265124148,
        completed: 1775265129074,
      },
      providerID: "openai",
      modelID: "gpt-5.4",
      agent: "build",
      mode: "build",
      path: {
        cwd: "/Users/alexsandiiarov/Documents/dotfiles/kx",
        root: "/Users/alexsandiiarov/Documents/dotfiles/kx",
      },
      cost: 0,
      tokens: {
        total: 29532,
        input: 29393,
        output: 139,
        reasoning: 45,
        cache: {
          read: 0,
          write: 0,
        },
      },
      finish: "tool-calls",
    },
    parts: [
      {
        id: "prt_d560c16a50017ja4fHPu7HGUTr",
        sessionID,
        messageID: "msg_d560c0f34001q5iPeS8xmjZYAy",
        type: "reasoning",
        text: "**Inspecting components for implementation**\n\nI need to check the repository for the existing `tui-react` components, especially looking for a message compound component that might be lurking around in the packages. This feels like a multi-step process, which suggests I should create a to-do list to keep track. I'll start by finding the relevant files to get a clearer idea of what needs to be done. Searching is definitely the first step!",
        time: {
          start: 1775265126053,
          end: 1775265128793,
        },
      },
      {
        id: "prt_d560c215b001cI5p3YeEfA25jZ",
        sessionID,
        messageID: "msg_d560c0f34001q5iPeS8xmjZYAy",
        type: "tool",
        callID: "call_rwW63UfuKO4qjqJmQaTW88WL",
        tool: "todowrite",
        state: {
          status: "completed",
          input: {
            todos: [
              {
                content: "Inspect existing React TUI message-related components and styling primitives",
                status: "in_progress",
                priority: "high",
              },
              {
                content:
                  "Implement compound `Message` component and subcomponents with matching border/background/hover behavior",
                status: "pending",
                priority: "high",
              },
              {
                content: "Run package typecheck or targeted verification for the new component",
                status: "pending",
                priority: "medium",
              },
            ],
          },
          output:
            '[\n  {\n    "content": "Inspect existing React TUI message-related components and styling primitives",\n    "status": "in_progress",\n    "priority": "high"\n  },\n  {\n    "content": "Implement compound `Message` component and subcomponents with matching border/background/hover behavior",\n    "status": "pending",\n    "priority": "high"\n  },\n  {\n    "content": "Run package typecheck or targeted verification for the new component",\n    "status": "pending",\n    "priority": "medium"\n  }\n]',
          title: "3 todos",
          metadata: {
            truncated: false,
          },
          time: {
            start: 1775265128963,
            end: 1775265128965,
          },
        },
      },
    ],
  },
  {
    info: {
      id: "msg_d560c2273001lLjWRrHf3SnYTs",
      sessionID,
      role: "assistant",
      parentID: "msg_d560c0f1e001z5KhsdCuWiVsvA",
      time: {
        created: 1775265129075,
        completed: 1775265132956,
      },
      providerID: "openai",
      modelID: "gpt-5.4",
      agent: "build",
      mode: "build",
      path: {
        cwd: "/Users/alexsandiiarov/Documents/dotfiles/kx",
        root: "/Users/alexsandiiarov/Documents/dotfiles/kx",
      },
      cost: 0,
      tokens: {
        total: 29808,
        input: 218,
        output: 150,
        reasoning: 0,
        cache: {
          read: 29440,
          write: 0,
        },
      },
      finish: "tool-calls",
    },
    parts: [
      {
        id: "prt_d560c3126001vnLV2kEfonNArN",
        sessionID,
        messageID: "msg_d560c2273001lLjWRrHf3SnYTs",
        type: "tool",
        callID: "call_dFcBD4MvfxUwhqQSgboqdVoS",
        tool: "glob",
        state: {
          status: "completed",
          input: {
            pattern: "packages/tui-react/src/**/*.{ts,tsx}",
            path: "/Users/alexsandiiarov/Documents/dotfiles/kx",
          },
          output:
            "/Users/alexsandiiarov/Documents/dotfiles/kx/packages/tui-react/src/app.tsx\n/Users/alexsandiiarov/Documents/dotfiles/kx/packages/tui-react/src/components/message.tsx\n/Users/alexsandiiarov/Documents/dotfiles/kx/packages/tui-react/src/index.ts",
          title: "",
          metadata: {
            count: 3,
            truncated: false,
          },
          time: {
            start: 1775265132842,
            end: 1775265132863,
          },
        },
      },
      {
        id: "prt_d560c312c001fha7hSZHSnjgpG",
        sessionID,
        messageID: "msg_d560c2273001lLjWRrHf3SnYTs",
        type: "tool",
        callID: "call_1OFuSSLS6LEMZzA0SsJES3aN",
        tool: "grep",
        state: {
          status: "completed",
          input: {
            pattern: "message|Message",
            path: "/Users/alexsandiiarov/Documents/dotfiles/kx/packages/tui-react/src",
            include: "*.tsx",
          },
          output: "No files found",
          title: "message|Message",
          metadata: {
            matches: 0,
            truncated: false,
          },
          time: {
            start: 1775265132846,
            end: 1775265132858,
          },
        },
      },
    ],
  },
  {
    info: {
      id: "msg_d56109185001PiTdHiBUeaZUg7",
      sessionID,
      role: "user",
      time: {
        created: 1775265419664,
      },
      agent: "build",
      model: {
        providerID: "openai",
        modelID: "gpt-5.4",
      },
    },
    parts: [
      {
        id: "prt_d56109186001MHA2OAd9T6CNlD",
        sessionID,
        messageID: "msg_d56109185001PiTdHiBUeaZUg7",
        type: "text",
        text: "add mock data and render a few messages in app.tsx",
      },
    ],
  },
  {
    info: {
      id: "msg_d56109198001wGdE7Y7Rn7Af6k",
      sessionID,
      role: "assistant",
      parentID: "msg_d56109185001PiTdHiBUeaZUg7",
      time: {
        created: 1775265419672,
        completed: 1775265423454,
      },
      providerID: "openai",
      modelID: "gpt-5.4",
      agent: "build",
      mode: "build",
      path: {
        cwd: "/Users/alexsandiiarov/Documents/dotfiles/kx",
        root: "/Users/alexsandiiarov/Documents/dotfiles/kx",
      },
      cost: 0,
      tokens: {
        total: 60244,
        input: 2443,
        output: 73,
        reasoning: 24,
        cache: {
          read: 57728,
          write: 0,
        },
      },
      finish: "tool-calls",
    },
    parts: [
      {
        id: "prt_d5610969a001811i87m3rFCDMe",
        sessionID,
        messageID: "msg_d56109198001wGdE7Y7Rn7Af6k",
        type: "reasoning",
        text: "**Considering changes in app.tsx**\n\nI think I need to edit the app.tsx file and possibly import Message. It seems straightforward and might be a small change, so I'm wondering if I really need to create a todo for this. It feels manageable, so I’m thinking it’s best just to get on with it and do it! I'll make the changes and see how it all works out.",
        time: {
          start: 1775265420954,
          end: 1775265423187,
        },
      },
      {
        id: "prt_d5610969b001...read",
        sessionID,
        messageID: "msg_d56109198001wGdE7Y7Rn7Af6k",
        type: "tool",
        callID: "call_2LmXBANdJhZHlxfBqk25v2Uo",
        tool: "read",
        state: {
          status: "completed",
          input: {
            filePath: "/Users/alexsandiiarov/Documents/dotfiles/kx/packages/tui-react/src/app.tsx",
            offset: 1,
            limit: 200,
          },
          output:
            '<path>/Users/alexsandiiarov/Documents/dotfiles/kx/packages/tui-react/src/app.tsx</path>\n<type>file</type>\n<content>9qt2|1 import { type CliRenderer } from "@opentui/core"\n8rdd|2 import { createRoot } from "@opentui/react"\ni5lv|3 \n7o74|4 function Screen() {\neecs|5   return (\np3c4|6     <box width="100%" height="100%" padding={1}>\n7c0c|7       <text>Hello</text>\nis6l|8     </box>\n41vk|9   )\n3s2q|10 }\n03ln|11 \nz6ff|12 export function mount(renderer: CliRenderer) {\n8kzl|13   createRoot(renderer).render(<Screen />)\n1q03|14 }\n\n(End of file - total 14 lines)\n</content>',
          title: "packages/tui-react/src/app.tsx",
          metadata: {
            truncated: false,
          },
          time: {
            start: 1775265423308,
            end: 1775265423311,
          },
        },
      },
    ],
  },
  {
    info: {
      id: "msg_d561023b6001EBUrgC3qDocWp5",
      sessionID,
      role: "assistant",
      parentID: "msg_d560f6722001otOrVnARbdOw7V",
      time: {
        created: 1775265397491,
        completed: 1775265397491,
      },
      providerID: "openai",
      modelID: "gpt-5.4",
      agent: "build",
      mode: "build",
      path: {
        cwd: "/Users/alexsandiiarov/Documents/dotfiles/kx",
        root: "/Users/alexsandiiarov/Documents/dotfiles/kx",
      },
      cost: 0,
      tokens: {
        total: 60246,
        input: 288,
        output: 182,
        reasoning: 0,
        cache: {
          read: 59776,
          write: 0,
        },
      },
      finish: "stop",
    },
    parts: [
      {
        id: "prt_d56102ec1001y0YQQUw1v3Qqkk",
        sessionID,
        messageID: "msg_d561023b6001EBUrgC3qDocWp5",
        type: "text",
        text: "Updated the API to match what you want in `packages/tui-react/src/components/message.tsx`.\n\n- Removed `backgroundColor`, `hoverBackgroundColor`, `textColor`, and `mutedColor`\n- Renamed `borderColor` to `color`\n- Kept the shared left border, panel background, and hover background behavior\n- Left the compound API in place: `Message`, `MessageHeader`, `MessageIcon`, `MessageTitle`, `MessageSubtitle`, `MessageContent`, `MessageFooter`, `MessageDebug`\n- Re-exported the component from `packages/tui-react/src/index.ts`\n\nVerified with `bun typecheck` in `packages/tui-react`.\n\nNatural next steps:\n1. Wire `Message` into `packages/tui-react/src/app.tsx` with a sample layout\n2. Add the first real session message renderer on top of this compound component",
      },
    ],
  },
]
