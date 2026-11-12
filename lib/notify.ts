export async function notify(kind: "success" | "error", message: string) {
  const { toast } = await import("sonner");
  toast[kind](message);
}
