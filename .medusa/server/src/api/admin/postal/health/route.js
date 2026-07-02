"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = void 0;
const GET = async (req, res) => {
    let authType = "api";
    let mode = "api";
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
        code: "postal_provider_active",
        type: "postal_health_status",
        status: "ok",
        message: "Postal notification provider is active",
        auth_type: authType,
        mode,
        timestamp: new Date().toISOString(),
    });
};
exports.GET = GET;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Bvc3RhbC9oZWFsdGgvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBS08sTUFBTSxHQUFHLEdBQUcsS0FBSyxFQUN0QixHQUErQixFQUMvQixHQUFtQixFQUNuQixFQUFFO0lBQ0YsSUFBSSxRQUFRLEdBQUcsS0FBSyxDQUFBO0lBQ3BCLElBQUksSUFBSSxHQUFHLEtBQUssQ0FBQTtJQUVoQixJQUFJLENBQUM7UUFDSCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBUSxDQUFBO1FBQy9ELE1BQU0sT0FBTyxHQUFHLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxFQUFFLENBQUE7UUFDOUMsSUFBSSxPQUFPLEVBQUUsU0FBUyxJQUFJLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUN4QyxRQUFRLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQTtZQUM1QixJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQTtRQUNyQixDQUFDO0lBQ0gsQ0FBQztJQUFDLE1BQU0sQ0FBQztRQUNQLG9EQUFvRDtJQUN0RCxDQUFDO0lBRUQsR0FBRyxDQUFDLElBQUksQ0FBQztRQUNQLElBQUksRUFBRSx3QkFBd0I7UUFDOUIsSUFBSSxFQUFFLHNCQUFzQjtRQUM1QixNQUFNLEVBQUUsSUFBSTtRQUNaLE9BQU8sRUFBRSx3Q0FBd0M7UUFDakQsU0FBUyxFQUFFLFFBQVE7UUFDbkIsSUFBSTtRQUNKLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtLQUNwQyxDQUFDLENBQUE7QUFDSixDQUFDLENBQUE7QUEzQlksUUFBQSxHQUFHLE9BMkJmIn0=