// WordPerfect (.wpd, .wp, .wp5, .wp6), still used for pleadings and letters in some law firms. Lincoln reads the
// words: plain characters are kept, line and page breaks become new lines, formatting codes are stepped over.

const u16 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u32 = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

// WordPerfect's Multinational character set (set 1): the accented letters names are written with.
const LATIN: Record<number, string> = {
  23: "ß", 24: "Ç", 25: "ç", 26: "Ñ", 27: "ñ", 28: "Ä", 29: "ä", 30: "Ë", 31: "ë", 32: "Ï", 33: "ï", 34: "Ö", 35: "ö", 36: "Ü", 37: "ü",
  38: "Á", 39: "á", 40: "Â", 41: "â", 42: "À", 43: "à", 44: "Å", 45: "å", 46: "Æ", 47: "æ", 48: "É", 49: "é", 50: "Ê", 51: "ê", 52: "È", 53: "è",
  54: "Í", 55: "í", 56: "Î", 57: "î", 58: "Ì", 59: "ì", 60: "Ó", 61: "ó", 62: "Ô", 63: "ô", 64: "Ò", 65: "ò", 66: "Ú", 67: "ú", 68: "Û", 69: "û",
  70: "Ù", 71: "ù", 72: "Ÿ", 73: "ÿ", 74: "Ã", 75: "ã", 76: "Đ", 77: "đ", 78: "Ø", 79: "ø", 80: "Õ", 81: "õ", 82: "Ý", 83: "ý", 84: "Ð", 85: "ð",
  86: "Þ", 87: "þ",
};
// Set 4, typographic symbols: quotes, dashes and the section sign that pleadings use.
const TYPO: Record<number, string> = { 0: "•", 2: "▪", 5: "¶", 6: "§", 7: "¡", 8: "¿", 9: "«", 10: "»", 11: "£", 12: "¥", 17: "½", 18: "¼", 19: "¢", 22: "©", 23: "®", 28: '"', 29: '"', 30: "'", 31: "'", 32: '"', 33: "-", 34: "-" };

function extended(set: number, n: number) {
  // In set 1 the marks below 23 stand alone; 9, 11 and 13 are the apostrophes typists used.
  if (set === 1) return n === 9 || n === 11 || n === 13 ? "'" : LATIN[n] ?? "";
  if (set === 4) return TYPO[n] ?? "";
  return "";
}

/** The words of a WordPerfect file, or "" when it is password protected or not one. */
export function wpdText(b: Uint8Array): string {
  if (b.length < 16 || b[0] !== 0xff || String.fromCharCode(b[1], b[2], b[3]) !== "WPC") return "";
  if (u16(b, 12) !== 0) return ""; // encrypted
  const major = b[10];
  let i = u32(b, 4);
  let out = "";
  const nl = () => { out += "\n"; };
  if (major >= 0x02) {
    // WordPerfect 6 and later (6, 7, 8, 9, 10, X3 to X9 share this format).
    while (i < b.length) {
      const c = b[i];
      if (c >= 0x20 && c <= 0x7f) { out += String.fromCharCode(c); i++; }
      else if (c >= 0x01 && c <= 0x1f) i++; // default extended characters, rarely used in US documents
      else if (c === 0x80 || c === 0x81) { out += " "; i++; }
      else if (c === 0x84 || c === 0x82 || c === 0x83) { out += "-"; i++; }
      else if (c >= 0xc7 && c <= 0xcf || c === 0xcc) { nl(); i++; } // hard and soft returns, page and column breaks
      else if (c >= 0x80 && c <= 0xcf) i++;
      else if (c >= 0xd0 && c <= 0xef) { const size = u16(b, i + 2); if (size < 4) break; i += size; } // variable length group
      else if (c === 0xf0) { out += extended(b[i + 2], b[i + 1]); i += 4; } // extended character: F0 char set F0
      else if (c >= 0xf1) { const end = b.indexOf(c, i + 1); i = end > i && end - i < 64 ? end + 1 : i + 1; }
      else i++;
    }
  } else {
    // WordPerfect 5.0 and 5.1.
    const fixed: Record<number, number> = { 0xc0: 4, 0xc1: 9, 0xc2: 11, 0xc3: 3, 0xc4: 3, 0xc5: 5, 0xc6: 6, 0xc7: 7 };
    while (i < b.length) {
      const c = b[i];
      if (c >= 0x20 && c <= 0x7e) { out += String.fromCharCode(c); i++; }
      else if (c === 0x0a || c === 0x0c) { nl(); i++; } // hard return, hard page
      else if (c === 0x0d || c === 0x0b) { out += " "; i++; } // soft return, soft page: the line simply wraps
      else if (c === 0x09) { out += "\t"; i++; }
      else if (c === 0xa9 || c === 0xaa || c === 0xab) { out += "-"; i++; }
      else if (c === 0xc0) { out += extended(b[i + 2], b[i + 1]); i += 4; }
      else if (fixed[c]) i += fixed[c];
      else if (c >= 0xd0) { const len = u16(b, i + 2); i += 4 + len; }
      else i++;
    }
  }
  return out.replace(/[ \t]+\n/g, "\n").replace(/ {2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
