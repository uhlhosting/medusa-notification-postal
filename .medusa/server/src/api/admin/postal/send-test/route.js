"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const send_postal_email_1 = require("../../../../workflows/send-postal-email");
const POST = async (req, res) => {
    const body = req.validatedBody;
    const runId = `postal-test-${Date.now()}`;
    const { result } = await (0, send_postal_email_1.sendPostalEmailWorkflow)(req.scope).run({
        input: {
            to: body.to,
            from: body.from,
            from_name: body.from_name,
            reply_to: body.reply_to,
            template: body.template || "postal-test",
            provider_data: {
                from: body.from,
                from_name: body.from_name,
                reply_to: body.reply_to,
                subject: body.subject,
                html: body.html || "",
                text: body.text || "",
                cc: body.cc,
                bcc: body.bcc,
                headers: body.headers || {},
                custom_args: body.custom_args || {},
                metadata: body.metadata || {},
                workflow_event: "postal.admin.test_send",
                workflow_run_id: runId,
            },
        },
    });
    return res.status(200).json({
        success: true,
        workflow_run_id: runId,
        delivery: result.delivery,
    });
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Bvc3RhbC9zZW5kLXRlc3Qvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBSUEsK0VBQWlGO0FBa0IxRSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQ3ZCLEdBQTZDLEVBQzdDLEdBQW1CLEVBQ25CLEVBQUU7SUFDRixNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFBO0lBRTlCLE1BQU0sS0FBSyxHQUFHLGVBQWUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUE7SUFFekMsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sSUFBQSwyQ0FBdUIsRUFBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQzlELEtBQUssRUFBRTtZQUNMLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTtZQUNYLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztZQUN6QixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksYUFBYTtZQUN4QyxhQUFhLEVBQUU7Z0JBQ2IsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2dCQUNmLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztnQkFDekIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87Z0JBQ3JCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7Z0JBQ3JCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUU7Z0JBQ3JCLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRTtnQkFDWCxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7Z0JBQ2IsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLElBQUksRUFBRTtnQkFDM0IsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXLElBQUksRUFBRTtnQkFDbkMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRTtnQkFDN0IsY0FBYyxFQUFFLHdCQUF3QjtnQkFDeEMsZUFBZSxFQUFFLEtBQUs7YUFDdkI7U0FDRjtLQUNGLENBQUMsQ0FBQTtJQUVGLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDMUIsT0FBTyxFQUFFLElBQUk7UUFDYixlQUFlLEVBQUUsS0FBSztRQUN0QixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7S0FDMUIsQ0FBQyxDQUFBO0FBQ0osQ0FBQyxDQUFBO0FBdENZLFFBQUEsSUFBSSxRQXNDaEIifQ==