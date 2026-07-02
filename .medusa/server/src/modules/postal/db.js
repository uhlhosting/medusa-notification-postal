"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveOptionalPgConnection = void 0;
const utils_1 = require("@medusajs/framework/utils");
const PG_CONNECTION_KEYS = [
    utils_1.ContainerRegistrationKeys.PG_CONNECTION,
    "pgConnection",
    "__pg_connection__",
    "manager",
];
const resolveOptionalPgConnection = (container) => {
    for (const key of PG_CONNECTION_KEYS) {
        try {
            const connection = container.resolve(key);
            if (connection &&
                (typeof connection.raw === "function" ||
                    typeof connection.query === "function")) {
                return connection;
            }
        }
        catch {
            // Try the next registered connection alias.
        }
    }
    return null;
};
exports.resolveOptionalPgConnection = resolveOptionalPgConnection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wb3N0YWwvZGIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQXFFO0FBTXJFLE1BQU0sa0JBQWtCLEdBQUc7SUFDekIsaUNBQXlCLENBQUMsYUFBYTtJQUN2QyxjQUFjO0lBQ2QsbUJBQW1CO0lBQ25CLFNBQVM7Q0FDRCxDQUFBO0FBRUgsTUFBTSwyQkFBMkIsR0FBRyxDQUFDLFNBQXdCLEVBQUUsRUFBRTtJQUN0RSxLQUFLLE1BQU0sR0FBRyxJQUFJLGtCQUFrQixFQUFFLENBQUM7UUFDckMsSUFBSSxDQUFDO1lBQ0gsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUN6QyxJQUNFLFVBQVU7Z0JBQ1YsQ0FBQyxPQUFRLFVBQWtCLENBQUMsR0FBRyxLQUFLLFVBQVU7b0JBQzVDLE9BQVEsVUFBa0IsQ0FBQyxLQUFLLEtBQUssVUFBVSxDQUFDLEVBQ2xELENBQUM7Z0JBQ0QsT0FBTyxVQUFVLENBQUE7WUFDbkIsQ0FBQztRQUNILENBQUM7UUFBQyxNQUFNLENBQUM7WUFDUCw0Q0FBNEM7UUFDOUMsQ0FBQztJQUNILENBQUM7SUFFRCxPQUFPLElBQUksQ0FBQTtBQUNiLENBQUMsQ0FBQTtBQWpCWSxRQUFBLDJCQUEyQiwrQkFpQnZDIn0=