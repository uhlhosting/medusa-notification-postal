import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  res.sendStatus(200);
}
