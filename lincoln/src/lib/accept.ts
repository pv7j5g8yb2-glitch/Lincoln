// Every kind of file Lincoln reads, for the file pickers: PDFs, photos and scans, Word, Excel and PowerPoint (old and
// new), OpenDocument, Apple Pages, Keynote and Numbers, WordPerfect, text, RTF and web pages, saved emails and zips.
export const READABLE = [
  "application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/tiff", ".heic", ".tif", ".tiff",
  ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".doc", "application/msword",
  ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".csv", "text/csv",
  "text/plain", ".txt", ".rtf", ".md", ".html", ".htm", ".eml", "message/rfc822", ".msg", "application/vnd.ms-outlook", ".zip", "application/zip",
  ".pptx", ".ppt", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", ".xls", "application/vnd.ms-excel",
  ".odt", ".ods", ".odp", ".pages", ".key", ".numbers", ".wpd", ".wp", ".wp5", ".wp6", ".gif", ".bmp", ".avif",
].join(",");
