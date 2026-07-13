"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const resolve_provider_1 = require("../../../../providers/postal/resolve-provider");
const GET = async (req, res) => {
    try {
        const service = (0, resolve_provider_1.resolvePostalProvider)(req.scope);
        const runtime = service.getHealthSnapshot();
        return res.status(200).json({
            code: "postal_provider_active",
            type: "postal_health_status",
            status: "ok",
            message: "Postal notification provider is active",
            auth_type: runtime.auth_type,
            mode: runtime.mode,
            timestamp: new Date().toISOString(),
        });
    }
    catch {
        return res.status(503).json({
            code: "postal_provider_unavailable",
            type: "postal_health_status",
            status: "error",
            message: "Postal notification provider is not loaded",
            timestamp: new Date().toISOString(),
        });
    }
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Bvc3RhbC9oZWFsdGgvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBSUEsb0ZBQXFGO0FBRTlFLE1BQU0sR0FBRyxHQUFHLEtBQUssRUFDdEIsR0FBK0IsRUFDL0IsR0FBbUIsRUFDbkIsRUFBRTtJQUNGLElBQUksQ0FBQztRQUNILE1BQU0sT0FBTyxHQUFHLElBQUEsd0NBQXFCLEVBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ2hELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFBO1FBRTNDLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDMUIsSUFBSSxFQUFFLHdCQUF3QjtZQUM5QixJQUFJLEVBQUUsc0JBQXNCO1lBQzVCLE1BQU0sRUFBRSxJQUFJO1lBQ1osT0FBTyxFQUFFLHdDQUF3QztZQUNqRCxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7WUFDNUIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1lBQ2xCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBQUMsTUFBTSxDQUFDO1FBQ1AsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUMxQixJQUFJLEVBQUUsNkJBQTZCO1lBQ25DLElBQUksRUFBRSxzQkFBc0I7WUFDNUIsTUFBTSxFQUFFLE9BQU87WUFDZixPQUFPLEVBQUUsNENBQTRDO1lBQ3JELFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDLENBQUE7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBMUJZLFFBQUEsR0FBRyxPQTBCZiJ9