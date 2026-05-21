"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const GET = async (req, res) => {
    let authType = process.env.POSTAL_AUTH_TYPE || "smtp-api";
    let mode = authType === "smtp-api"
        ? "http-api"
        : authType === "smtp-ip"
            ? "smtp-ip-allowlist"
            : "smtp-auth";
    try {
        const service = req.scope.resolve("notification-postal");
        const runtime = service?.getHealthSnapshot?.();
        if (runtime?.auth_type && runtime?.mode) {
            authType = runtime.auth_type;
            mode = runtime.mode;
        }
    }
    catch {
        // Keep env fallback for health endpoint resilience.
    }
    res.json({
        status: "ok",
        message: "Postal notification provider is active",
        auth_type: authType,
        mode,
        timestamp: new Date().toISOString()
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Bvc3RhbC9oZWFsdGgvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRU8sTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUN0QixHQUFrQixFQUNsQixHQUFtQixFQUNuQixFQUFFO0lBQ0YsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsSUFBSSxVQUFVLENBQUE7SUFDekQsSUFBSSxJQUFJLEdBQ04sUUFBUSxLQUFLLFVBQVU7UUFDckIsQ0FBQyxDQUFDLFVBQVU7UUFDWixDQUFDLENBQUMsUUFBUSxLQUFLLFNBQVM7WUFDdEIsQ0FBQyxDQUFDLG1CQUFtQjtZQUNyQixDQUFDLENBQUMsV0FBVyxDQUFBO0lBRW5CLElBQUksQ0FBQztRQUNILE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFRLENBQUE7UUFDL0QsTUFBTSxPQUFPLEdBQUcsT0FBTyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsQ0FBQTtRQUM5QyxJQUFJLE9BQU8sRUFBRSxTQUFTLElBQUksT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO1lBQ3hDLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFBO1lBQzVCLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFBO1FBQ3JCLENBQUM7SUFDSCxDQUFDO0lBQUMsTUFBTSxDQUFDO1FBQ1Asb0RBQW9EO0lBQ3RELENBQUM7SUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDO1FBQ1AsTUFBTSxFQUFFLElBQUk7UUFDWixPQUFPLEVBQUUsd0NBQXdDO1FBQ2pELFNBQVMsRUFBRSxRQUFRO1FBQ25CLElBQUk7UUFDSixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7S0FDcEMsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBO0FBOUJZLFFBQUEsR0FBRyxPQThCZiJ9