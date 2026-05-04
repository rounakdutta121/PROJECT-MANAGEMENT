interface SendTaskAssignedEmailOptions {
  to: string;
  taskTitle: string;
  taskDescription?: string;
  deadline: string;
  assignedByName: string;
  appUrl: string;
}

export async function sendTaskAssignedEmail({
  to,
  taskTitle,
  taskDescription,
  deadline,
  assignedByName,
  appUrl,
}: SendTaskAssignedEmailOptions) {
  const webhookUrl = process.env.APPS_SCRIPT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("APPS_SCRIPT_WEBHOOK_URL is not set");
    return { success: false, error: { message: "Webhook URL missing" } };
  }

  try {
    const result = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        subject: `New task assigned: ${taskTitle}`,
        taskTitle,
        taskDescription: taskDescription || "",
        deadline,
        assignedByName,
        appUrl,
      }),
    });

    const data = await result.json();

    if (!result.ok || !data.success) {
      console.error("Apps Script error:", data);
      return {
        success: false,
        error: { message: data.error || "Failed to send" },
      };
    }

    console.log("Email sent successfully to:", to);
    return data;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}
