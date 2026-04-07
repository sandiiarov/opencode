import { afterEach, expect, mock, test } from "bun:test"
import path from "path"
import { ModelsDev } from "../../src/provider/models"
import { tmpdir } from "../fixture/fixture"

const originalFetch = globalThis.fetch
const originalModelsPath = process.env["KX_MODELS_PATH"]
const originalModelsUrl = process.env["KX_MODELS_URL"]

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalModelsPath === undefined) delete process.env["KX_MODELS_PATH"]
  else process.env["KX_MODELS_PATH"] = originalModelsPath
  if (originalModelsUrl === undefined) delete process.env["KX_MODELS_URL"]
  else process.env["KX_MODELS_URL"] = originalModelsUrl
  ModelsDev.Data.reset()
})

test("refresh skips a fresh cache unless forced", async () => {
  ModelsDev.Data.reset()
  await using tmp = await tmpdir()
  const file = path.join(tmp.path, "models.json")
  await Bun.write(file, JSON.stringify({ cached: { id: "cached", name: "Cached", env: [], models: {} } }))

  process.env["KX_MODELS_PATH"] = file
  process.env["KX_MODELS_URL"] = "https://models.example.test"

  const fetch = mock(() =>
    Promise.resolve(
      new Response(JSON.stringify({ fetched: { id: "fetched", name: "Fetched", env: [], models: {} } }), {
        status: 200,
      }),
    ),
  )
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch

  await ModelsDev.refresh()
  expect(fetch).toHaveBeenCalledTimes(0)

  await ModelsDev.refresh(true)
  expect(fetch).toHaveBeenCalledTimes(1)
})

test("get reuses an in-flight refresh fetch", async () => {
  ModelsDev.Data.reset()
  await using tmp = await tmpdir()
  const file = path.join(tmp.path, "models.json")
  const body = {
    fetched: {
      id: "fetched",
      name: "Fetched",
      env: ["TEST_KEY"],
      models: {},
    },
  }

  process.env["KX_MODELS_PATH"] = file
  process.env["KX_MODELS_URL"] = "https://models.example.test"

  const fetch = mock(async () => {
    await Bun.sleep(25)
    return new Response(JSON.stringify(body), { status: 200 })
  })
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch

  const refresh = ModelsDev.refresh(true)
  const data = ModelsDev.get()
  const [, result] = await Promise.all([refresh, data])
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(result.fetched.id).toBe("fetched")
  expect(result.fetched.name).toBe("Fetched")
})
