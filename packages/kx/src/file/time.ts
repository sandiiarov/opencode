import { DateTime, Effect, Layer, Semaphore, ServiceMap } from "effect"
import { InstanceState } from "@/effect/instance-state"
import { makeRunPromise } from "@/effect/run-service"
import { Flag } from "@/flag/flag"
import type { SessionID } from "@/session/schema"
import { Filesystem } from "../util/filesystem"
import { Log } from "../util/log"

export namespace FileTime {
  const log = Log.create({ service: "file.time" })

  export type Stamp = {
    readonly read: Date
    readonly mtime: number | undefined
    readonly ctime: number | undefined
    readonly size: number | undefined
  }

  export type Version = string

  const stamp = Effect.fnUntraced(function* (file: string) {
    const stat = Filesystem.stat(file)
    const size = typeof stat?.size === "bigint" ? Number(stat.size) : stat?.size
    return {
      read: yield* DateTime.nowAsDate,
      mtime: stat?.mtime?.getTime(),
      ctime: stat?.ctime?.getTime(),
      size,
    }
  })

  function encode(stamp: Stamp) {
    return [stamp.mtime ?? "", stamp.ctime ?? "", stamp.size ?? ""].join(":")
  }

  const session = (reads: Map<SessionID, Map<string, Stamp>>, sessionID: SessionID) => {
    const value = reads.get(sessionID)
    if (value) return value

    const next = new Map<string, Stamp>()
    reads.set(sessionID, next)
    return next
  }

  interface State {
    reads: Map<SessionID, Map<string, Stamp>>
    locks: Map<string, Semaphore.Semaphore>
  }

  export interface Interface {
    readonly read: (sessionID: SessionID, file: string) => Effect.Effect<Version>
    readonly get: (sessionID: SessionID, file: string) => Effect.Effect<Date | undefined>
    readonly version: (file: string) => Effect.Effect<Version>
    readonly assert: (sessionID: SessionID, filepath: string, expected?: Version) => Effect.Effect<Version>
    readonly withLock: <T>(filepath: string, fn: () => Promise<T>) => Effect.Effect<T>
  }

  export class Service extends ServiceMap.Service<Service, Interface>()("@kx/FileTime") {}

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      const disableCheck = yield* Flag.KX_DISABLE_FILETIME_CHECK
      const state = yield* InstanceState.make<State>(
        Effect.fn("FileTime.state")(() =>
          Effect.succeed({
            reads: new Map<SessionID, Map<string, Stamp>>(),
            locks: new Map<string, Semaphore.Semaphore>(),
          }),
        ),
      )

      const getLock = Effect.fn("FileTime.lock")(function* (filepath: string) {
        const locks = (yield* InstanceState.get(state)).locks
        const lock = locks.get(filepath)
        if (lock) return lock

        const next = Semaphore.makeUnsafe(1)
        locks.set(filepath, next)
        return next
      })

      const read = Effect.fn("FileTime.read")(function* (sessionID: SessionID, file: string) {
        const reads = (yield* InstanceState.get(state)).reads
        log.info("read", { sessionID, file })
        const next = yield* stamp(file)
        session(reads, sessionID).set(file, next)
        return encode(next)
      })

      const get = Effect.fn("FileTime.get")(function* (sessionID: SessionID, file: string) {
        const reads = (yield* InstanceState.get(state)).reads
        return reads.get(sessionID)?.get(file)?.read
      })

      const current = Effect.fn("FileTime.version")(function* (file: string) {
        return encode(yield* stamp(file))
      })

      const assert = Effect.fn("FileTime.assert")(function* (
        sessionID: SessionID,
        filepath: string,
        expected?: Version,
      ) {
        if (disableCheck) return yield* current(filepath)

        const reads = (yield* InstanceState.get(state)).reads
        const next = yield* stamp(filepath)
        const nextVersion = encode(next)
        if (expected !== undefined) {
          if (expected === nextVersion) return nextVersion
          throw new Error(
            `File ${filepath} has changed since the provided version was captured.\nCurrent version: ${nextVersion}\nExpected version: ${expected}\n\nPlease read the file again to get fresh anchors and version metadata before modifying it.`,
          )
        }

        const time = reads.get(sessionID)?.get(filepath)
        if (!time) {
          throw new Error(
            `You must read file ${filepath} before overwriting it, or reuse a fresh expectedVersion from a prior read, grep, edit, or write result.`,
          )
        }

        const changed = next.mtime !== time.mtime || next.ctime !== time.ctime || next.size !== time.size
        if (!changed) return nextVersion

        throw new Error(
          `File ${filepath} has been modified since it was last read.\nLast modification: ${new Date(next.mtime ?? next.read.getTime()).toISOString()}\nLast read: ${time.read.toISOString()}\n\nPlease read the file again to get fresh anchors and version metadata before modifying it.`,
        )
      })

      const withLock = Effect.fn("FileTime.withLock")(function* <T>(filepath: string, fn: () => Promise<T>) {
        return yield* Effect.promise(fn).pipe((yield* getLock(filepath)).withPermits(1))
      })

      return Service.of({ read, get, version: current, assert, withLock })
    }),
  ).pipe(Layer.orDie)

  const runPromise = makeRunPromise(Service, layer)

  export function read(sessionID: SessionID, file: string) {
    return runPromise((s) => s.read(sessionID, file))
  }

  export function get(sessionID: SessionID, file: string) {
    return runPromise((s) => s.get(sessionID, file))
  }

  export function version(file: string) {
    return runPromise((s) => s.version(file))
  }

  export async function assert(sessionID: SessionID, filepath: string, expected?: Version) {
    return runPromise((s) => s.assert(sessionID, filepath, expected))
  }

  export async function withLock<T>(filepath: string, fn: () => Promise<T>): Promise<T> {
    return runPromise((s) => s.withLock(filepath, fn))
  }
}
