import type { Metadata } from "next";
import { locale as rootLocale } from "next/root-params";
import { TimetableScreen } from "@/components/timetable/timetable-screen";
import { getSectionParams } from "@/lib/timetable/data";
import { timetableMetadata } from "@/lib/timetable/metadata";

type Props = PageProps<"/[locale]/[system]/[level]/[speciality]/[section]">;

export const unstable_paramMatching = {
  system: "not-found",
  level: "not-found",
  speciality: "not-found",
  section: "not-found",
} as const;

export function generateStaticParams() {
  return getSectionParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return timetableMetadata(await rootLocale(), await params);
}

export default async function SectionPage({ params }: Props) {
  return <TimetableScreen {...await params} />;
}
