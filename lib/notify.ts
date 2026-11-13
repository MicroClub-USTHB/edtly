type NotifyAction = { label: string; onClick: () => void };

export async function notify(
  kind: "success" | "error",
  message: string,
  action?: NotifyAction,
) {
  const { toast } = await import("sonner");
  toast[kind](message, action ? { action } : undefined);
}
