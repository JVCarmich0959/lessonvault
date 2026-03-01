import { apiFetch } from "@/lib/api";

export const LINK_SOURCE = "learningcom";

export type ClassSummary = {
  id: string;
  workspace_id: string;
  name: string;
  grade_label: string;
  created_at: string;
};

export type StudentSummary = {
  student_id: string;
  display_name: string;
  email: string | null;
};

export type ExternalStudentSummary = {
  external_student_id: string;
  display_name: string;
  external_key: string;
};

export type LinkStatus = {
  class_id: string;
  source: string;
  roster_count: number;
  external_count: number;
  linked_count: number;
  coverage_rate: number;
  unlinked_roster: StudentSummary[];
  unlinked_external: ExternalStudentSummary[];
};

export type LinkSuggestion = {
  student: StudentSummary;
  suggestion: ExternalStudentSummary | null;
  confidence: "high" | "medium" | "low";
  method: "exact" | "normalized" | "fuzzy";
  alternatives: ExternalStudentSummary[];
  reason: string;
};

export type StudentLink = {
  id: string;
  workspace_id: string;
  student_id: string;
  source: string;
  external_student_id: string;
  confidence: "high" | "medium" | "low";
  method: "exact" | "normalized" | "fuzzy";
  verified_by_user: boolean;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
};

export type ClassRosterKPI = {
  student_id: string;
  display_name: string;
  email: string | null;
  linked: boolean;
  external_student_id: string | null;
  progress_pct_avg: number | null;
  score_pct_avg: number | null;
  attempts_count: number;
  status: "unlinked" | "linked" | "linked-no-data";
};

export type ClassKpis = {
  class_id: string;
  source: string;
  roster_count: number;
  linked_count: number;
  coverage_rate: number;
  average_progress_pct: number | null;
  average_score_pct: number | null;
  roster: ClassRosterKPI[];
};

export async function listClasses(): Promise<ClassSummary[]> {
  return apiFetch("/api/v1/classes");
}

export async function createClass(payload: { name: string; grade_label?: string }): Promise<ClassSummary> {
  return apiFetch("/api/v1/classes", { method: "POST", body: JSON.stringify(payload) });
}

export async function getClass(classId: string): Promise<ClassSummary> {
  return apiFetch(`/api/v1/classes/${classId}`);
}

export async function getClassKpis(classId: string, source = LINK_SOURCE): Promise<ClassKpis> {
  const query = new URLSearchParams({ source });
  return apiFetch(`/api/v1/classes/${classId}/kpis?${query.toString()}`);
}

export async function getLinkStatus(classId: string, source = LINK_SOURCE): Promise<LinkStatus> {
  const query = new URLSearchParams({ source });
  return apiFetch(`/api/v1/classes/${classId}/link-status?${query.toString()}`);
}

export async function getLinkSuggestions(classId: string, source = LINK_SOURCE): Promise<LinkSuggestion[]> {
  const query = new URLSearchParams({ source });
  return apiFetch(`/api/v1/classes/${classId}/link-suggestions?${query.toString()}`);
}

export async function listExternalStudents(
  classId: string,
  source = LINK_SOURCE,
  q?: string
): Promise<ExternalStudentSummary[]> {
  const query = new URLSearchParams({ source });
  if (q?.trim()) query.set("q", q.trim());
  return apiFetch(`/api/v1/classes/${classId}/external-students?${query.toString()}`);
}

export async function createStudentLink(payload: {
  source: string;
  student_id: string;
  external_student_id: string;
  verified_by_user: boolean;
  notes?: string;
}, options?: { force?: boolean }): Promise<StudentLink> {
  const query = new URLSearchParams();
  if (options?.force) query.set("force", "true");
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiFetch(`/api/v1/student-links${suffix}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function bulkCreateStudentLinks(
  links: Array<{
    source: string;
    student_id: string;
    external_student_id: string;
    verified_by_user: boolean;
    notes?: string;
  }>,
  options?: { force?: boolean }
): Promise<StudentLink[]> {
  const query = new URLSearchParams();
  if (options?.force) query.set("force", "true");
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return apiFetch(`/api/v1/student-links/bulk${suffix}`, {
    method: "POST",
    body: JSON.stringify({ links })
  });
}

export async function deleteStudentLink(linkId: string): Promise<void> {
  await apiFetch(`/api/v1/student-links/${linkId}`, { method: "DELETE" });
}

export async function importHomeroomRows(
  classId: string,
  rows: Array<{ email: string; display_name: string }>
): Promise<{ rows_processed: number }> {
  return apiFetch(`/api/v1/classes/${classId}/imports/homeroom`, {
    method: "POST",
    body: JSON.stringify({ rows })
  });
}

export async function importLearningComRows(
  classId: string,
  rows: Array<{
    external_key: string;
    display_name: string;
    activity_name?: string;
    score_pct?: number;
    progress_pct?: number;
    attempts_count?: number;
    attempted_at?: string;
  }>
): Promise<{ rows_processed: number }> {
  return apiFetch(`/api/v1/classes/${classId}/imports/learningcom`, {
    method: "POST",
    body: JSON.stringify({ rows })
  });
}
