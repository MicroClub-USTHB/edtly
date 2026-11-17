import { useSectionLabel } from "@/lib/hooks/use-section-label";
import { useMode } from "@/lib/stores/mode-store";
import { usePersonal } from "@/lib/stores/personal-store";
import { useRemoteSections } from "@/lib/stores/section-store";
import { sectionPath } from "@/lib/timetable/paths";
import {
  personalSessions,
  type RemoteSection,
} from "@/lib/timetable/personal";
import type { Session } from "@/lib/timetable/types";

export function usePersonalTimetable(
  path: string,
  sessions: Session[],
  mainGroup: string | null,
  tpGroup: string | null,
) {
  const label = useSectionLabel();
  const mode = useMode();
  const personal = usePersonal(path);
  const paths = [...new Set(personal.extras.map(sectionPath))];
  const entries = useRemoteSections(paths);

  const remote = new Map<string, RemoteSection>();
  for (const remotePath of paths) {
    const entry = entries.get(remotePath);
    if (entry?.status !== "ready") continue;
    const { programme, section } = entry.data;
    remote.set(remotePath, {
      label: label({
        level: programme.level,
        specialityName: programme.speciality.name,
        sectionName: section.name,
        sectionCount: programme.sectionCount,
      }),
      url: programme.sourceUrl,
      sessions: section.sessions,
    });
  }

  return {
    mode,
    personal,
    entries,
    mySessions: personalSessions(
      sessions,
      personal,
      mainGroup,
      remote,
      tpGroup,
    ),
  };
}
