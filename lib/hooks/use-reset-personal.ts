import { useTranslations } from "next-intl";
import { notify } from "@/lib/notify";
import { resetPersonal, updatePersonal } from "@/lib/stores/personal-store";

export function useResetPersonal(path: string) {
  const t = useTranslations("Personal");

  return () => {
    const previous = resetPersonal(path);
    void notify("success", t("resetDone"), {
      label: t("undo"),
      onClick: () => updatePersonal(path, () => previous),
    });
  };
}
