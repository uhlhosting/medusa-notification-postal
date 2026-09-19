// RFC 5321 caps a forward path at 256 octets including the angle brackets.
const MAX_ADDRESS_LENGTH = 254

// One bare address: local part, "@", a domain with at least one dot. No
// display name, no list separators, no quoting and no whitespace, so the value
// can go into a mail header as it is.
const SINGLE_ADDRESS =
  /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]+$/

/**
 * True when every character is printable ASCII (0x21 to 0x7E). This refuses
 * C0 and C1 control characters (CR, LF, NUL, NEL), Unicode line and paragraph
 * separators, and zero-width and bidirectional formatting characters, all of
 * which can break or disguise a header, before the pattern runs.
 */
const isPrintableAscii = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 0x21 || code > 0x7e) {
      return false
    }
  }
  return true
}

/**
 * True for exactly one plain ASCII email address that is safe to place in a
 * `Reply-To` header. Anything else (a list, a display name, a CR/LF
 * header-injection attempt, a non-ASCII or invisible character) is refused
 * rather than repaired.
 */
export const isSingleEmailAddress = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false
  }
  if (!value || value.length > MAX_ADDRESS_LENGTH) {
    return false
  }
  if (!isPrintableAscii(value)) {
    return false
  }
  return SINGLE_ADDRESS.test(value)
}
