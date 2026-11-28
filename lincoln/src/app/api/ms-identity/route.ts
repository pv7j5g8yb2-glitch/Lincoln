// Microsoft's publisher domain check reads /.well-known/microsoft-identity-association.json on the
// domain; next.config.mjs points that path here. It names the app registration this domain belongs to.
export const dynamic = "force-dynamic";

export function GET() {
  const id = process.env.MICROSOFT_CLIENT_ID;
  if (!id) return new Response("Not found", { status: 404 });
  return Response.json({ associatedApplications: [{ applicationId: id }] });
}
