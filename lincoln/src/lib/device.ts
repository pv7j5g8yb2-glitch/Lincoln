/** A plain name for a browser from its user agent, such as "Safari on iPhone or iPad". */
export function deviceName(ua: string | null) {
  const u = ua ?? "";
  const os = /iPhone|iPad/.test(u) ? "iPhone or iPad" : /Android/.test(u) ? "Android" : /Mac OS X/.test(u) ? "Mac" : /Windows/.test(u) ? "Windows" : /Linux/.test(u) ? "Linux" : "Unknown device";
  const br = /Edg\//.test(u) ? "Edge" : /Chrome\//.test(u) ? "Chrome" : /Firefox\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : "";
  return br ? `${br} on ${os}` : os;
}
