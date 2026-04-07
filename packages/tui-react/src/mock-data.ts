import { type Entry } from "./mock-types"

const sessionID = "ses_2a69915deffejnLrVNFs7thazo"
const cwd = "/Users/alexsandiiarov/Documents/dotfiles/kx"
const snap = "37038143fb181e6cbbb981d8d7b5ec0c2415c5d4"

export const mockMessages: Entry[] = [
  {
    info: {
      role: "user",
      time: {
        created: 1775321439638,
      },
      summary: {
        diffs: [],
      },
      agent: "delegate",
      model: {
        providerID: "openai",
        modelID: "gpt-5.4",
      },
      variant: "medium",
      id: "msg_d59675d8f001YBpr9s1T30q0tI",
      sessionID,
    },
    parts: [
      {
        type: "text",
        text: "delegate those tasks",
        id: "prt_d59675d90001T4dxayYlOHm05W",
        sessionID,
        messageID: "msg_d59675d8f001YBpr9s1T30q0tI",
      },
    ],
  },
  {
    info: {
      role: "assistant",
      time: {
        created: 1775321443898,
        completed: 1775321638230,
      },
      parentID: "msg_d59675d8f001YBpr9s1T30q0tI",
      modelID: "gpt-5.4",
      providerID: "openai",
      mode: "delegate",
      agent: "delegate",
      path: {
        cwd,
        root: cwd,
      },
      cost: 0,
      tokens: {
        total: 15830,
        input: 157,
        output: 825,
        reasoning: 0,
        cache: {
          read: 14848,
          write: 0,
        },
      },
      variant: "medium",
      finish: "tool-calls",
      id: "msg_d59676e3a001xanQW6IO9xgopk",
      sessionID,
    },
    parts: [
      {
        type: "step-start",
        snapshot: snap,
        id: "prt_d596770d7001g4cfm3ankGJHzm",
        sessionID,
        messageID: "msg_d59676e3a001xanQW6IO9xgopk",
      },
      {
        type: "tool",
        callID: "call_Mdmmgj42UtC1JHxj3EuzobZI",
        tool: "task",
        state: {
          status: "completed",
          input: {
            description: "Research Reuters Iran",
            subagent_type: "execute",
            prompt:
              "DELEGATION TYPE: RESEARCH\n\nYOUR TASK:\nResearch the latest Iran news using Reuters coverage from April 2026, with emphasis on direct facts reported today or in the last 2-3 days.",
          },
          output:
            "task_id: ses_2a6985290ffeaiYf49c85Nrzyd\n\n<task_result>\n## Summary\nReuters coverage from Apr. 1-4, 2026 points to a sharp escalation around Iran.\n\n## Results\n- Military developments: Iran said a new air-defence system was used against a U.S. fighter jet.\n- Strait of Hormuz / shipping: U.S. intelligence assessed Iran was unlikely to reopen Hormuz soon.\n- Confidence: Medium\n</task_result>",
          title: "Research Reuters Iran",
          metadata: {
            sessionId: "ses_2a6985290ffeaiYf49c85Nrzyd",
            model: {
              modelID: "gpt-5.4",
              providerID: "openai",
            },
            truncated: false,
          },
          time: {
            start: 1775321460077,
            end: 1775321585417,
          },
        },
        metadata: {
          openai: {
            itemId: "fc_0a28a6eac73e91c60169d14173d92481998476b4fd57a177fb",
          },
        },
        id: "prt_d5967ad69001I5hSQAWpBw4nL3",
        sessionID,
        messageID: "msg_d59676e3a001xanQW6IO9xgopk",
      },
      {
        type: "tool",
        callID: "call_XFlo4Ffy6aqqKD6KmVKzCpLT",
        tool: "task",
        state: {
          status: "completed",
          input: {
            description: "Research AP Iran",
            subagent_type: "execute",
            prompt:
              "DELEGATION TYPE: RESEARCH\n\nYOUR TASK:\nResearch the latest Iran news using AP coverage from April 2026, with emphasis on reported battlefield developments, missing crew reports, regional spillover, and oil impacts.",
          },
          output:
            "task_id: ses_2a6985286ffe9wyutWRcjtxcGT\n\n<task_result>\n## Summary\nAP's latest Iran coverage from Apr. 2-4, 2026 centers on a sharp battlefield escalation.\n\n## Results\n- Battlefield: AP reported two U.S. aircraft shot down and at least one crew member missing.\n- Economic / oil impacts: Iraq's oil hub had slowed to a crawl as Hormuz shutdown strangled exports.\n- Confidence: High\n</task_result>",
          title: "Research AP Iran",
          metadata: {
            sessionId: "ses_2a6985286ffe9wyutWRcjtxcGT",
            model: {
              modelID: "gpt-5.4",
              providerID: "openai",
            },
            truncated: false,
          },
          time: {
            start: 1775321460089,
            end: 1775321638140,
          },
        },
        metadata: {
          openai: {
            itemId: "fc_0a28a6eac73e91c60169d14173d93881998ec61d7c41318eae",
          },
        },
        id: "prt_d5967ad720013euu17PNLD6qsx",
        sessionID,
        messageID: "msg_d59676e3a001xanQW6IO9xgopk",
      },
      {
        type: "tool",
        callID: "call_36gPNY0US1QjCUpTeKtMXEue",
        tool: "task",
        state: {
          status: "completed",
          input: {
            description: "Research BBC Iran",
            subagent_type: "execute",
            prompt:
              "DELEGATION TYPE: RESEARCH\n\nYOUR TASK:\nResearch the latest Iran news using BBC or another major international outlet, focused on April 2026 developments and humanitarian impact.",
          },
          output:
            "task_id: ses_2a698527effe3nhnhWxrxXDn7Z\n\n<task_result>\n## Summary\nBBC's April 2026 Iran coverage is heavily framed around civilian fear, infrastructure strikes, legal scrutiny, and blackout-driven uncertainty.\n\n## Results\n- Humanitarian / civilian impact: BBC reported eight killed and almost 100 injured at the Karaj bridge.\n- Legal scrutiny: international law experts warned of serious harm to civilians.\n- Confidence: Medium\n</task_result>",
          title: "Research BBC Iran",
          metadata: {
            sessionId: "ses_2a698527effe3nhnhWxrxXDn7Z",
            model: {
              modelID: "gpt-5.4",
              providerID: "openai",
            },
            truncated: false,
          },
          time: {
            start: 1775321460097,
            end: 1775321541473,
          },
        },
        metadata: {
          openai: {
            itemId: "fc_0a28a6eac73e91c60169d14173d94081999d6bb92ca2950e1a",
          },
        },
        id: "prt_d5967ad7a002LTwkH6W433JPMX",
        sessionID,
        messageID: "msg_d59676e3a001xanQW6IO9xgopk",
      },
      {
        type: "step-finish",
        reason: "tool-calls",
        snapshot: snap,
        cost: 0,
        tokens: {
          total: 15830,
          input: 157,
          output: 825,
          reasoning: 0,
          cache: {
            read: 14848,
            write: 0,
          },
        },
        id: "prt_d596a64fd001TOzPMh7Rl6e7ee",
        sessionID,
        messageID: "msg_d59676e3a001xanQW6IO9xgopk",
      },
    ],
  },
  {
    info: {
      role: "assistant",
      time: {
        created: 1775321640055,
        completed: 1775321647361,
      },
      parentID: "msg_d59675d8f001YBpr9s1T30q0tI",
      modelID: "gpt-5.4",
      providerID: "openai",
      mode: "delegate",
      agent: "delegate",
      path: {
        cwd,
        root: cwd,
      },
      cost: 0,
      tokens: {
        total: 18974,
        input: 452,
        output: 346,
        reasoning: 25,
        cache: {
          read: 18176,
          write: 0,
        },
      },
      variant: "medium",
      finish: "stop",
      id: "msg_d596a6c77001XOvrvdRHxLly1M",
      sessionID,
    },
    parts: [
      {
        type: "step-start",
        snapshot: snap,
        id: "prt_d596a6f2e00198aG3TsAPpSnsi",
        sessionID,
        messageID: "msg_d596a6c77001XOvrvdRHxLly1M",
      },
      {
        type: "reasoning",
        text: "**Summarizing delegated tasks**\n\nI need to reply concisely, highlight the delegated work, mention the sources used, and note that reporting is still evolving.",
        metadata: {
          openai: {
            itemId: "rs_0e24d5306e2e98200169d14228ee4c819ab67bdfe43a57ea8f",
          },
        },
        time: {
          start: 1775321641200,
          end: 1775321645200,
        },
        id: "prt_d596a7080001b2Yx9vK4YH7mLM",
        sessionID,
        messageID: "msg_d596a6c77001XOvrvdRHxLly1M",
      },
      {
        type: "text",
        text: "Yes - I delegated the research and pulled back a broader picture.\n\nWhat I found:\n- Military: Reuters and AP both report a major escalation, including two U.S. aircraft reportedly shot down.\n- Shipping and oil: Reuters and AP both point to continued Hormuz pressure and energy disruption.\n- Humanitarian impact: BBC and the Guardian emphasize civilian fear, infrastructure damage, and legal scrutiny.\n\nReporting is still moving quickly, so some details may change as coverage updates.",
        metadata: {
          openai: {
            itemId: "msg_0e24d5306e2e98200169d14229098c8198f000f1ff26e2ba0cc",
          },
        },
        time: {
          start: 1775321645200,
          end: 1775321647361,
        },
        id: "prt_d596a7219001Jv5mb9vM0Kv3B9",
        sessionID,
        messageID: "msg_d596a6c77001XOvrvdRHxLly1M",
      },
      {
        type: "step-finish",
        reason: "stop",
        snapshot: snap,
        cost: 0,
        tokens: {
          total: 18974,
          input: 452,
          output: 346,
          reasoning: 25,
          cache: {
            read: 18176,
            write: 0,
          },
        },
        id: "prt_d596a7220001w03iV7ko9YJwls",
        sessionID,
        messageID: "msg_d596a6c77001XOvrvdRHxLly1M",
      },
    ],
  },
  {
    info: {
      role: "user",
      time: {
        created: 1775321651024,
      },
      summary: {
        diffs: [],
      },
      agent: "build",
      model: {
        providerID: "openai",
        modelID: "gpt-5.4",
      },
      variant: "medium",
      id: "msg_d596aa1890014bO5Vhk9rJ8t2Q",
      sessionID,
    },
    parts: [
      {
        type: "text",
        text: "can you review these generated files too?",
        id: "prt_d596aa195001u8j5WZf9fT2mSx",
        sessionID,
        messageID: "msg_d596aa1890014bO5Vhk9rJ8t2Q",
      },
      {
        type: "file",
        mime: "text/typescript",
        filename: "packages/sdk/js/src/v2/gen/types.gen.ts",
        url: "file:///Users/alexsandiiarov/Documents/dotfiles/kx/packages/sdk/js/src/v2/gen/types.gen.ts",
        source: {
          type: "file",
          path: "packages/sdk/js/src/v2/gen/types.gen.ts",
          text: {
            value: "export type Part = ...",
            start: 497,
            end: 509,
          },
        },
        id: "prt_d596aa19f002Y4rD6uYk7eNh3L",
        sessionID,
        messageID: "msg_d596aa1890014bO5Vhk9rJ8t2Q",
      },
    ],
  },
  {
    info: {
      role: "assistant",
      time: {
        created: 1775321652400,
        completed: 1775321666400,
      },
      parentID: "msg_d596aa1890014bO5Vhk9rJ8t2Q",
      modelID: "gpt-5.4",
      providerID: "openai",
      mode: "build",
      agent: "build",
      path: {
        cwd,
        root: cwd,
      },
      cost: 0.02,
      tokens: {
        total: 2430,
        input: 812,
        output: 1194,
        reasoning: 184,
        cache: {
          read: 240,
          write: 0,
        },
      },
      variant: "medium",
      finish: "stop",
      id: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      sessionID,
    },
    parts: [
      {
        type: "step-start",
        snapshot: snap,
        id: "prt_d596aa2c2001Lwq9o1AsXv4dFe",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "subtask",
        prompt: "Inspect generated SDK output and compare it with the session renderer needs.",
        description: "Inspect generated types",
        agent: "explore",
        model: {
          providerID: "openai",
          modelID: "gpt-5.4",
        },
        command: "/inspect packages/sdk/js/src/v2/gen/types.gen.ts",
        id: "prt_d596aa2d00017u7M8v0nJc4bWy",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "reasoning",
        text: "I need examples for every part variant so the TUI can be checked against real-looking session data.",
        time: {
          start: 1775321653200,
          end: 1775321654100,
        },
        id: "prt_d596aa2db0012x5iBvQ7Np1sKr",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "tool",
        callID: "call_P7V9sT10eY2kLm4Nq8rUwX1a",
        tool: "read",
        state: {
          status: "pending",
          input: {
            filePath: "packages/sdk/js/src/v2/gen/types.gen.ts",
          },
          raw: "read packages/sdk/js/src/v2/gen/types.gen.ts",
        },
        id: "prt_d596aa2e4001uP3m8xQkV9fLsC",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "tool",
        callID: "call_H3mNp9sT2vWx6Yz1Qa4Bc7De",
        tool: "glob",
        state: {
          status: "running",
          input: {
            pattern: "**/*.tsx",
            path: "packages/tui-react/src",
          },
          title: "Find UI components",
          metadata: {
            batch: "session-render",
          },
          time: {
            start: 1775321654300,
          },
        },
        id: "prt_d596aa2ec001Qj6rLw3uPm8aKt",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "tool",
        callID: "call_J8rTy4Ui7Op2As5Df9Gh1Klz",
        tool: "edit",
        state: {
          status: "error",
          input: {
            filePath: "packages/tui-react/src/mock-data.ts",
            edits: 2,
          },
          error: "Fresh line ids are required before editing this file.",
          metadata: {
            code: "stale_ids",
          },
          time: {
            start: 1775321654500,
            end: 1775321654820,
          },
        },
        id: "prt_d596aa2f3001dN4xVb8mQj2sHp",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "tool",
        callID: "call_Q2wEr5Ty8Ui1Op4As7Df0GhJ",
        tool: "write",
        state: {
          status: "completed",
          input: {
            filePath: "packages/tui-react/src/mock-data.ts",
          },
          output: "Expanded mock data with missing part variants.",
          title: "Write updated mock data",
          metadata: {
            lines: 120,
          },
          time: {
            start: 1775321655000,
            end: 1775321656200,
            compacted: 1775321659900,
          },
          attachments: [
            {
              type: "file",
              mime: "text/markdown",
              filename: "notes.md",
              url: "file:///Users/alexsandiiarov/Documents/dotfiles/kx/notes.md",
              source: {
                type: "resource",
                clientName: "workspace",
                uri: "workspace://notes/mock-data",
                text: {
                  value: "Added examples for snapshot, patch, retry, and agent parts.",
                  start: 1,
                  end: 1,
                },
              },
              id: "prt_d596aa302001jR5cXm9vLq6dNs",
              sessionID,
              messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
            },
          ],
        },
        id: "prt_d596aa3000013f9QnV2mPk7sLd",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "file",
        mime: "text/typescript",
        filename: "session.tsx",
        url: "file:///Users/alexsandiiarov/Documents/dotfiles/kx/packages/tui-react/src/components/session.tsx",
        source: {
          type: "symbol",
          path: "packages/tui-react/src/components/session.tsx",
          name: "Session",
          kind: 12,
          range: {
            start: {
              line: 15,
              character: 0,
            },
            end: {
              line: 61,
              character: 1,
            },
          },
          text: {
            value: "export function Session(props: { messages: Entry[] }) { ... }",
            start: 15,
            end: 61,
          },
        },
        id: "prt_d596aa30a001wK8m3sVnDq5xLp",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "snapshot",
        snapshot: "a6dbe5ef2f8226c65a6c2f2c2101aeb2d8d9410a",
        id: "prt_d596aa311001oG4vQm8sLc2nYp",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "patch",
        hash: "sha256:4d9f715b1e5b9d7acfe2b26df4aa81e91f1f1db5c08bfb16c58e0f5e1c7d2ef3",
        files: ["packages/tui-react/src/mock-data.ts", "packages/tui-react/src/components/session.tsx"],
        id: "prt_d596aa318001kC1xNv6pQm4sLd",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "agent",
        name: "frontend-design",
        source: {
          value: "Loaded to shape a better demo for the TUI.",
          start: 1,
          end: 1,
        },
        id: "prt_d596aa321001cX7qLp4mNs9vRb",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "retry",
        attempt: 2,
        error: {
          name: "APIError",
          data: {
            message: "Upstream timed out while streaming tool updates.",
            statusCode: 504,
            isRetryable: true,
            responseHeaders: {
              "x-request-id": "req_mock_retry_01",
            },
            responseBody: "gateway timeout",
            metadata: {
              provider: "openai",
            },
          },
        },
        time: {
          created: 1775321657000,
        },
        id: "prt_d596aa329001vH3sQn6mLp8xDc",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "compaction",
        auto: true,
        overflow: false,
        id: "prt_d596aa333001rM8vQk2nLs5xWp",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "text",
        synthetic: true,
        text: "Internal summary: all message part variants now have a mock example.",
        id: "prt_d596aa33c0019nT4vQp7mLs2xKd",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "text",
        text: "I added mock entries for the missing part variants so the session demo covers more realistic states.",
        id: "prt_d596aa344001tP6xNm3qLs8vKd",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
      {
        type: "step-finish",
        reason: "stop",
        snapshot: snap,
        cost: 0.02,
        tokens: {
          total: 2430,
          input: 812,
          output: 1194,
          reasoning: 184,
          cache: {
            read: 240,
            write: 0,
          },
        },
        id: "prt_d596aa34d001bW5mQp8vLs2xNc",
        sessionID,
        messageID: "msg_d596aa2be001pY8X9Jr7sC2mLu",
      },
    ],
  },
]
