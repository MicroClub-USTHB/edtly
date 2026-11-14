type NotifyAction = { label: string; onClick: () => void };

export async function notify(
  kind: "success" | "error",
  message: string,
  action?: NotifyAction,
  secondary?: NotifyAction,
) {
  const { toast } = await import("sonner");
  toast[kind](message, {
    ...(action ? { action } : {}),
    ...(secondary
      ? {
          cancel: secondary,
          duration: 7000,
          classNames: { content: "basis-[calc(100%-2.5rem)]" },
        }
      : {}),
  });
}
