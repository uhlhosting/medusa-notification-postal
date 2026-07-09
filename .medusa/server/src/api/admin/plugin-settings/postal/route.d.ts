import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { type PostalSettingsInput } from "../../../../modules/postal/settings";
import { type PostalAdminTestBody } from "./test-payload";
type PostalPostBody = PostalAdminTestBody & {
    action?: "save" | "test";
    settings?: PostalSettingsInput;
};
export declare function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse): Promise<void>;
export declare function POST(req: AuthenticatedMedusaRequest<PostalPostBody>, res: MedusaResponse): Promise<MedusaResponse>;
export {};
