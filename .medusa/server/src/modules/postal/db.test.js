"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const db_1 = require("./db");
(0, node_test_1.default)("resolveOptionalPgConnection prefers the first usable connection alias", () => {
    const preferred = { raw: () => ({}) };
    const container = {
        resolve: (key) => {
            if (key === "pgConnection") {
                return preferred;
            }
            throw new Error(`missing ${key}`);
        },
    };
    strict_1.default.equal((0, db_1.resolveOptionalPgConnection)(container), preferred);
});
(0, node_test_1.default)("resolveOptionalPgConnection falls back to query-capable aliases and returns null otherwise", () => {
    const queried = { query: () => ({}) };
    const container = {
        resolve: (key) => {
            if (key === "__pg_connection__") {
                return queried;
            }
            throw new Error(`missing ${key}`);
        },
    };
    strict_1.default.equal((0, db_1.resolveOptionalPgConnection)(container), queried);
    strict_1.default.equal((0, db_1.resolveOptionalPgConnection)({ resolve: () => null }), null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGIudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3Bvc3RhbC9kYi50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsMERBQTRCO0FBQzVCLGdFQUF1QztBQUN2Qyw2QkFBa0Q7QUFFbEQsSUFBQSxtQkFBSSxFQUFDLHVFQUF1RSxFQUFFLEdBQUcsRUFBRTtJQUNqRixNQUFNLFNBQVMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUE7SUFDckMsTUFBTSxTQUFTLEdBQUc7UUFDaEIsT0FBTyxFQUFFLENBQUMsR0FBVyxFQUFFLEVBQUU7WUFDdkIsSUFBSSxHQUFHLEtBQUssY0FBYyxFQUFFLENBQUM7Z0JBQzNCLE9BQU8sU0FBUyxDQUFBO1lBQ2xCLENBQUM7WUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUMsQ0FBQTtRQUNuQyxDQUFDO0tBQ0YsQ0FBQTtJQUVELGdCQUFNLENBQUMsS0FBSyxDQUFDLElBQUEsZ0NBQTJCLEVBQUMsU0FBa0IsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQzFFLENBQUMsQ0FBQyxDQUFBO0FBRUYsSUFBQSxtQkFBSSxFQUFDLDRGQUE0RixFQUFFLEdBQUcsRUFBRTtJQUN0RyxNQUFNLE9BQU8sR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUE7SUFDckMsTUFBTSxTQUFTLEdBQUc7UUFDaEIsT0FBTyxFQUFFLENBQUMsR0FBVyxFQUFFLEVBQUU7WUFDdkIsSUFBSSxHQUFHLEtBQUssbUJBQW1CLEVBQUUsQ0FBQztnQkFDaEMsT0FBTyxPQUFPLENBQUE7WUFDaEIsQ0FBQztZQUVELE1BQU0sSUFBSSxLQUFLLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQyxDQUFBO1FBQ25DLENBQUM7S0FDRixDQUFBO0lBRUQsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsSUFBQSxnQ0FBMkIsRUFBQyxTQUFrQixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDdEUsZ0JBQU0sQ0FBQyxLQUFLLENBQUMsSUFBQSxnQ0FBMkIsRUFBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQVcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO0FBQ25GLENBQUMsQ0FBQyxDQUFBIn0=