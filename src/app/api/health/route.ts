import { databaseMode } from "@/db/client";
import { integrationReport } from "@/lib/config";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(integrationReport(databaseMode()));
}
