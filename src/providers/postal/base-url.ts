import net from "node:net"

/*
  SSRF guard for the Postal base_url, which an admin can edit.

  A base_url that is a literal IP address must be globally reachable. The
  blocked ranges are every IANA special-purpose block marked "not globally
  reachable" (RFC 6890 registries), plus multicast and the reserved 240/4:
  private, loopback, link-local, shared CGNAT (100.64/10), benchmarking,
  documentation and protocol-assignment ranges. Postal is reached by hostname
  in practice, so refusing these literals costs nothing legitimate.

  192.0.0.0/24 and 2001::/23 are refused whole. IANA lists a few anycast
  service addresses inside them as globally reachable (192.0.0.9, 192.0.0.10,
  2001:1::1-3, AMT 2001:3::/32, AS112 2001:4:112::/48, ORCHIDv2 and DRIP
  identifiers); none can host Postal, so the over-block is deliberate.

  The guard checks only the configured base_url. fetchPostalApi must keep
  refusing to follow redirects, or a Location header would reach any host.

  Hostnames are not resolved here: names that resolve to internal addresses
  (DNS rebinding, split-horizon DNS) stay out of scope, because resolving in
  the guard would break legitimate internal Postal hosts. `localhost` and
  `*.localhost` are refused by name (RFC 6761).
*/

const NON_PUBLIC_ADDRESSES = new net.BlockList()

for (const [network, prefix] of [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // shared address space (carrier-grade NAT)
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation (TEST-NET-1)
  ["192.88.99.0", 24], // deprecated 6to4 relay anycast
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation (TEST-NET-2)
  ["203.0.113.0", 24], // documentation (TEST-NET-3)
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, including 255.255.255.255
] as const) {
  NON_PUBLIC_ADDRESSES.addSubnet(network, prefix, "ipv4")
}

for (const [network, prefix] of [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["64:ff9b:1::", 48], // local-use IPv4/IPv6 translation
  ["100::", 64], // discard-only
  ["100:0:0:1::", 64], // dummy prefix (RFC 9780)
  ["2001::", 23], // IETF protocol assignments (Teredo, ORCHID, ...)
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4
  ["3fff::", 20], // documentation
  ["5f00::", 16], // SRv6 SIDs
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["fec0::", 10], // deprecated site-local
  ["ff00::", 8], // multicast
] as const) {
  NON_PUBLIC_ADDRESSES.addSubnet(network, prefix, "ipv6")
}

// Expands an IPv6 literal into its eight 16-bit groups. Accepts the forms
// `net.isIPv6` accepts, including a trailing dotted IPv4 part.
const expandIPv6 = (address: string): number[] | null => {
  let text = address
  const groups: number[] = []

  const dotted = text.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/)
  let tail: number[] = []
  if (dotted) {
    if (!net.isIPv4(dotted[2])) {
      return null
    }
    const [a, b, c, d] = dotted[2].split(".").map(Number)
    tail = [(a << 8) | b, (c << 8) | d]
    text = dotted[1].endsWith("::") ? dotted[1] : dotted[1].slice(0, -1)
  }

  const parse = (part: string) =>
    part ? part.split(":").map((group) => parseInt(group, 16)) : []
  const halves = text.split("::")
  if (halves.length > 2) {
    return null
  }
  const head = parse(halves[0] ?? "")
  const rest = halves.length === 2 ? parse(halves[1] ?? "") : []
  const missing = 8 - head.length - rest.length - tail.length
  if (missing < 0 || (halves.length === 1 && missing !== 0)) {
    return null
  }

  groups.push(...head, ...new Array(missing).fill(0), ...rest, ...tail)
  return groups.length === 8 && groups.every((g) => g >= 0 && g <= 0xffff)
    ? groups
    : null
}

// IPv6 forms that carry an IPv4 address in their last 32 bits and reach it:
// IPv4-compatible (::/96), IPv4-mapped (::ffff:0:0/96), IPv4-translated
// (::ffff:0:0:0/96) and the NAT64 well-known prefix (64:ff9b::/96).
const embeddedIPv4 = (groups: number[]): string | null => {
  const zeros = (from: number, to: number) =>
    groups.slice(from, to).every((group) => group === 0)
  const carriesIPv4 =
    zeros(0, 6) ||
    (zeros(0, 5) && groups[5] === 0xffff) ||
    (zeros(0, 4) && groups[4] === 0xffff && groups[5] === 0) ||
    (groups[0] === 0x64 && groups[1] === 0xff9b && zeros(2, 6))
  if (!carriesIPv4) {
    return null
  }

  const high = groups[6]!
  const low = groups[7]!
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".")
}

/**
 * True when `hostname` is a name other than localhost, or a literal IP
 * address that is globally reachable. Accepts `URL#hostname` as is: the
 * brackets around an IPv6 literal and trailing dots are ignored.
 */
export const isPublicPostalHost = (hostname: string): boolean => {
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.+$/, "")

  if (!host || host === "localhost" || host.endsWith(".localhost")) {
    return false
  }

  if (net.isIPv4(host)) {
    return !NON_PUBLIC_ADDRESSES.check(host, "ipv4")
  }

  if (net.isIPv6(host)) {
    const groups = expandIPv6(host)
    if (!groups) {
      return false
    }
    const ipv4 = embeddedIPv4(groups)
    if (ipv4 !== null) {
      return !NON_PUBLIC_ADDRESSES.check(ipv4, "ipv4")
    }
    return !NON_PUBLIC_ADDRESSES.check(host, "ipv6")
  }

  return true
}

/**
 * True when `value` is an absolute http(s) URL whose host passes
 * isPublicPostalHost. The WHATWG URL parser has already normalised decimal,
 * hex, octal and shortened IPv4 forms (`2130706433`, `0x7f.1`, `127.1`) to a
 * dotted quad and IPv6 literals to compressed lowercase hex.
 */
export const isPublicPostalBaseUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false
    }
    return isPublicPostalHost(url.hostname)
  } catch {
    return false
  }
}
