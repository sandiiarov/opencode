const HASHLINE_ERROR = "Use updated {line_number}#{hash_id} references below"
const HASHLINE_SUMMARY = /^\d+ line(?:s)? ha(?:s|ve) changed since last read/

export function summarizeToolError(error?: string) {
  if (!error) return error
  if (error.includes(HASHLINE_ERROR)) return error.match(HASHLINE_SUMMARY)?.[0] ?? error.split("\n")[0]
  return error
}
