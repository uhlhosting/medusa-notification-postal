import test from "node:test"
import assert from "node:assert/strict"
import { isPublicPostalBaseUrl, isPublicPostalHost } from "./base-url"

const refused = [
  // names
  "http://localhost",
  "http://localhost.",
  "http://LOCALHOST.:8080",
  "http://api.localhost",
  // IPv4, including the encodings the URL parser normalises
  "http://0.0.0.0",
  "http://0",
  "http://10.1.2.3",
  "http://100.64.0.1",
  "http://100.127.255.254",
  "http://127.0.0.1",
  "http://127.0.0.1.",
  "http://127.1",
  "http://2130706433",
  "http://0x7f.0.0.1",
  "http://017700000001",
  "http://169.254.169.254",
  "http://172.16.0.1",
  "http://172.31.255.254",
  "http://192.0.0.8",
  "http://192.0.2.1",
  "http://192.88.99.1",
  "http://192.168.1.5",
  "http://198.18.0.1",
  "http://198.19.255.254",
  "http://198.51.100.7",
  "http://203.0.113.10",
  "http://224.0.0.1",
  "http://239.255.255.250",
  "http://240.0.0.1",
  "http://255.255.255.255",
  // IPv6
  "http://[::]",
  "http://[::1]",
  "http://[0:0:0:0:0:0:0:1]",
  "http://[::127.0.0.1]",
  "http://[::ffff:127.0.0.1]",
  "http://[::ffff:10.0.0.1]",
  "http://[::ffff:100.64.0.1]",
  "http://[::ffff:0:a00:1]",
  "http://[64:ff9b::a00:1]",
  "http://[64:ff9b::7f00:1]",
  "http://[64:ff9b:1::1]",
  "http://[100::1]",
  "http://[2001::1]",
  "http://[2001:db8::1]",
  "http://[2002:c0a8:101::1]",
  "http://[3fff::1]",
  "http://[5f00::1]",
  "http://[fc00::1]",
  "http://[fd12:3456::1]",
  "http://[fe80::1]",
  "http://[febf::1]",
  "http://[fec0::1]",
  "http://[ff02::1]",
  // not http(s), or not a URL
  "ftp://postal.example.com",
  "file:///etc/passwd",
  "postal.example.com",
  "",
]

const allowed = [
  "https://postal.example.com",
  "https://postal.example.com:8443/base",
  "https://localhost.example.com",
  "https://my-localhost",
  "http://1.1.1.1",
  "http://8.8.8.8",
  "http://100.63.255.255",
  "http://100.128.0.1",
  "http://172.15.255.255",
  "http://172.32.0.1",
  "http://192.0.1.1",
  "http://198.17.255.255",
  "http://198.20.0.1",
  "http://223.255.255.254",
  "http://[2606:4700:4700::1111]",
  "http://[2001:4860:4860::8888]",
  "http://[2001:200::1]",
  "http://[::ffff:8.8.8.8]",
  "http://[64:ff9b::808:808]",
  // Not unique-local or link-local: the first group is 0x00fd / 0x0fe8.
  "http://[fd::1]",
  "http://[fe8::1]",
]

for (const value of refused) {
  test(`isPublicPostalBaseUrl refuses ${JSON.stringify(value)}`, () => {
    assert.equal(isPublicPostalBaseUrl(value), false)
  })
}

for (const value of allowed) {
  test(`isPublicPostalBaseUrl allows ${value}`, () => {
    assert.equal(isPublicPostalBaseUrl(value), true)
  })
}

test("isPublicPostalHost reads raw IPv6 forms, including a dotted IPv4 tail", () => {
  assert.equal(isPublicPostalHost("::ffff:192.168.0.1"), false)
  assert.equal(isPublicPostalHost("0:0:0:0:0:ffff:7f00:1"), false)
  assert.equal(isPublicPostalHost("::ffff:0:192.168.0.1"), false)
  assert.equal(isPublicPostalHost("64:ff9b::10.0.0.1"), false)
  assert.equal(isPublicPostalHost("64:ff9b::8.8.8.8"), true)
  assert.equal(isPublicPostalHost("[2606:4700:4700::1111]"), true)
  assert.equal(isPublicPostalHost(""), false)
})
