import { type ReactNode, type PropsWithChildren, useState } from "react"
import { Spinner } from "./spinner"
import { icons } from "../lib/icons"
import { theme } from "../lib/theme"

export interface MessageProps extends PropsWithChildren {
  color: string
  onPress: () => void
}

export function Message(props: MessageProps) {
  const [hover, setHover] = useState(false)

  return (
    <box
      border={["left"]}
      borderColor={props.color}
      customBorderChars={{
        topLeft: "",
        topRight: "",
        bottomLeft: "",
        bottomRight: "",
        horizontal: " ",
        vertical: "┃",
        topT: "",
        bottomT: "",
        leftT: "",
        rightT: "",
        cross: "",
      }}
    >
      <box
        flexDirection="column"
        backgroundColor={hover ? theme.surface.background : theme.surface.panel}
        onMouseOver={() => setHover(true)}
        onMouseOut={() => setHover(false)}
        onMouseUp={props.onPress}
      >
        {props.children}
      </box>
    </box>
  )
}

export interface MessageHeaderProps {
  children: ReactNode
}

export function MessageHeader(props: MessageHeaderProps) {
  return (
    <box flexDirection="row" width="100%" gap={2} paddingY={1} paddingX={2}>
      {props.children}
    </box>
  )
}

export interface MessageIconProps extends PropsWithChildren {
  isLoading: boolean
  color: string
}

export function MessageIcon(props: MessageIconProps) {
  return props.isLoading ? <Spinner color={props.color} /> : <text fg={props.color}>{props.children}</text>
}

export interface MessageTitleProps extends PropsWithChildren {
  color: string
}

export function MessageTitle(props: MessageTitleProps) {
  return (
    <text fg={props.color}>
      <b>{props.children}</b>
    </text>
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MessageSubtitleProps extends PropsWithChildren {}

export function MessageSubtitle(props: MessageSubtitleProps) {
  return <text fg={theme.text.muted}>{props.children}</text>
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MessageContentProps extends PropsWithChildren {}

export function MessageContent(props: MessageContentProps) {
  return (
    <box flexDirection="column" gap={1} paddingY={1} paddingX={2}>
      {props.children}
    </box>
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MessageFooterProps extends PropsWithChildren {}

export function MessageFooter(props: MessageFooterProps) {
  return (
    <box flexDirection="row" justifyContent="flex-end" gap={1} paddingY={1} paddingX={2}>
      {props.children}
    </box>
  )
}

export interface MessageDebugProps extends PropsWithChildren {
  onPress: () => void
}

export function MessageDebug(props: MessageDebugProps) {
  return (
    <box flexDirection="row" gap={1} onMouseUp={props.onPress}>
      <text fg={theme.text.muted}>{icons.debug}</text>
      <text fg={theme.text.muted}>Log</text>
    </box>
  )
}
