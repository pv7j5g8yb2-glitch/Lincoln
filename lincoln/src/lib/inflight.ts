// Chat replies being written, by chat. A reply runs on the server to the end even when the app is closed;
// reopening the chat shows it as it is written, and Stop ends it from any page.
export type Flight = { userId: string; text: string; ctl: AbortController };
const g = globalThis as unknown as { lincolnFlights?: Map<string, Flight> };
export const flights = (g.lincolnFlights ??= new Map<string, Flight>());
export const flightFor = (threadId: string, userId: string) => {
  const f = flights.get(threadId);
  return f && f.userId === userId ? f : null;
};
