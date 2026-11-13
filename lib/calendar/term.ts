export function termEnd(academicYear: string, semester: 1 | 2) {
  const year = academicYear.match(/^\d{4}\/(\d{4})$/)?.[1];
  if (!year) return null;
  return semester === 1 ? `${year}-01-31` : `${year}-06-30`;
}
