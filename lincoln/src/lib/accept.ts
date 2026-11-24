// Every kind of file Lincoln reads, for the file pickers: PDFs, photos and scans (TIFF), Word (old and new), Excel and
// CSV, text and RTF, saved emails (.eml, Outlook .msg) and zips of any of these.
export const READABLE = [
  "application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/tiff", ".heic", ".tif", ".tiff",
  ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".doc", "application/msword",
  ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".csv", "text/csv",
  "text/plain", ".txt", ".rtf", ".md", ".eml", "message/rfc822", ".msg", "application/vnd.ms-outlook", ".zip", "application/zip",
].join(",");
