import { ReturnWorkflow } from "@medusajs/framework/workflows-sdk";
import type { PostalSettingsSnapshot, PostalSettingsInput } from "../modules/postal/settings";
export type SavePostalSettingsWorkflowInput = PostalSettingsInput;
export declare const savePostalSettingsWorkflow: ReturnWorkflow<SavePostalSettingsWorkflowInput, PostalSettingsSnapshot, [
]>;
