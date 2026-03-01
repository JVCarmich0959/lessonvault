import re
import uuid
from datetime import datetime, timezone
from typing import Any, Iterable

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.models.classes import (
    ActivityAttempt,
    ClassEnrollment,
    ClassRoom,
    ExternalStudent,
    LinkConfidence,
    LinkMethod,
    Student,
    StudentLink,
)


SOURCE_LEARNING_COM = "learningcom"

_PUNCT_RE = re.compile(r"[.,'`-]")
_SPACE_RE = re.compile(r"\s+")
_SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}


class ConflictError(Exception):
    pass


def _clean(value: str) -> str:
    normalized = _PUNCT_RE.sub(" ", value.lower())
    normalized = _SPACE_RE.sub(" ", normalized).strip()
    return normalized


def split_display_name(display_name: str) -> tuple[str, str]:
    raw = _SPACE_RE.sub(" ", display_name.strip())
    if not raw:
        return "", ""

    if "," in raw:
        parts = [part.strip() for part in raw.split(",", 1)]
        last_raw = parts[0]
        first_raw = parts[1] if len(parts) > 1 else ""
        first_tokens = first_raw.split(" ")
        first = first_tokens[0] if first_tokens else ""
        last = last_raw.split(" ")[0] if last_raw else ""
        return first, last

    tokens = raw.split(" ")
    if len(tokens) == 1:
        return tokens[0], ""
    if len(tokens) == 2:
        return tokens[0], tokens[1]
    return tokens[0], tokens[-1]


def normalized_name(first_name: str | None, last_name: str | None, display_name: str) -> tuple[str, str, str]:
    first, last = first_name or "", last_name or ""
    if not first and not last:
        parsed_first, parsed_last = split_display_name(display_name)
        first, last = parsed_first, parsed_last

    first_norm = _clean(first)
    last_norm = _clean(last)

    last_tokens = [token for token in last_norm.split(" ") if token]
    if last_tokens and last_tokens[-1] in _SUFFIXES:
        last_tokens = last_tokens[:-1]
        last_norm = " ".join(last_tokens)

    full_norm = f"{first_norm} {last_norm}".strip()
    return first_norm, last_norm, full_norm


def _starts_with_either(a: str, b: str) -> bool:
    if not a or not b:
        return False
    return a.startswith(b) or b.startswith(a)


def _first_initial(first: str) -> str:
    return first[:1] if first else ""


def _candidate_score(roster_name: tuple[str, str, str], external_name: tuple[str, str, str]) -> int:
    roster_first, roster_last, roster_full = roster_name
    external_first, external_last, external_full = external_name

    score = 0
    if roster_last and roster_last == external_last:
        score += 5
    if roster_first and roster_first == external_first:
        score += 4
    if _starts_with_either(roster_first, external_first):
        score += 2
    if _first_initial(roster_first) and _first_initial(roster_first) == _first_initial(external_first):
        score += 1
    if roster_full and roster_full == external_full:
        score += 4
    return score


def list_classes(db: Session, workspace_id: uuid.UUID) -> list[ClassRoom]:
    stmt = select(ClassRoom).where(ClassRoom.workspace_id == workspace_id).order_by(ClassRoom.name.asc())
    return db.execute(stmt).scalars().all()


def create_class(db: Session, workspace_id: uuid.UUID, name: str, grade_label: str = "") -> ClassRoom:
    classroom = ClassRoom(workspace_id=workspace_id, name=name.strip(), grade_label=grade_label.strip())
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom


def get_class(db: Session, workspace_id: uuid.UUID, class_id: uuid.UUID) -> ClassRoom | None:
    stmt = select(ClassRoom).where(ClassRoom.id == class_id, ClassRoom.workspace_id == workspace_id)
    return db.execute(stmt).scalar_one_or_none()


def _class_students(db: Session, workspace_id: uuid.UUID, class_id: uuid.UUID) -> list[Student]:
    stmt = (
        select(Student)
        .join(ClassEnrollment, ClassEnrollment.student_id == Student.id)
        .where(
            ClassEnrollment.workspace_id == workspace_id,
            ClassEnrollment.class_id == class_id,
            Student.workspace_id == workspace_id,
        )
        .order_by(Student.display_name.asc())
    )
    return db.execute(stmt).scalars().all()


def _class_external_students(db: Session, workspace_id: uuid.UUID, class_id: uuid.UUID, source: str) -> list[ExternalStudent]:
    external_ids_stmt = (
        select(ActivityAttempt.external_student_id)
        .where(
            ActivityAttempt.workspace_id == workspace_id,
            ActivityAttempt.class_id == class_id,
            ActivityAttempt.source == source,
        )
        .distinct()
    )
    external_ids = [row[0] for row in db.execute(external_ids_stmt).all()]
    if not external_ids:
        return []

    stmt = (
        select(ExternalStudent)
        .where(
            ExternalStudent.workspace_id == workspace_id,
            ExternalStudent.source == source,
            ExternalStudent.id.in_(external_ids),
        )
        .order_by(ExternalStudent.display_name.asc())
    )
    return db.execute(stmt).scalars().all()


def _links_for_students(
    db: Session,
    workspace_id: uuid.UUID,
    source: str,
    student_ids: Iterable[uuid.UUID],
) -> dict[uuid.UUID, StudentLink]:
    student_ids_list = list(student_ids)
    if not student_ids_list:
        return {}
    stmt = select(StudentLink).where(
        StudentLink.workspace_id == workspace_id,
        StudentLink.source == source,
        StudentLink.student_id.in_(student_ids_list),
    )
    links = db.execute(stmt).scalars().all()
    return {link.student_id: link for link in links}


def _links_for_external_students(
    db: Session,
    workspace_id: uuid.UUID,
    source: str,
    external_ids: Iterable[uuid.UUID],
) -> dict[uuid.UUID, StudentLink]:
    external_ids_list = list(external_ids)
    if not external_ids_list:
        return {}
    stmt = select(StudentLink).where(
        StudentLink.workspace_id == workspace_id,
        StudentLink.source == source,
        StudentLink.external_student_id.in_(external_ids_list),
    )
    links = db.execute(stmt).scalars().all()
    return {link.external_student_id: link for link in links}


def get_link_status(db: Session, workspace_id: uuid.UUID, class_id: uuid.UUID, source: str) -> dict[str, Any]:
    roster_students = _class_students(db, workspace_id, class_id)
    external_students = _class_external_students(db, workspace_id, class_id, source)

    student_links = _links_for_students(db, workspace_id, source, [student.id for student in roster_students])
    external_links = _links_for_external_students(
        db,
        workspace_id,
        source,
        [external_student.id for external_student in external_students],
    )

    unlinked_roster = [
        {
            "student_id": student.id,
            "display_name": student.display_name,
            "email": student.email,
        }
        for student in roster_students
        if student.id not in student_links
    ]

    unlinked_external = [
        {
            "external_student_id": external_student.id,
            "display_name": external_student.display_name,
            "external_key": external_student.external_key,
        }
        for external_student in external_students
        if external_student.id not in external_links
    ]

    linked_count = len(student_links)
    roster_count = len(roster_students)
    coverage_rate = (linked_count / roster_count) if roster_count else 0.0

    return {
        "class_id": class_id,
        "source": source,
        "roster_count": roster_count,
        "external_count": len(external_students),
        "linked_count": linked_count,
        "coverage_rate": round(coverage_rate, 4),
        "unlinked_roster": unlinked_roster,
        "unlinked_external": unlinked_external,
    }


def get_link_suggestions(db: Session, workspace_id: uuid.UUID, class_id: uuid.UUID, source: str) -> list[dict[str, Any]]:
    status = get_link_status(db, workspace_id, class_id, source)
    roster_students = status["unlinked_roster"]

    candidate_external_students = _class_external_students(db, workspace_id, class_id, source)
    linked_externals = _links_for_external_students(
        db,
        workspace_id,
        source,
        [external_student.id for external_student in candidate_external_students],
    )
    available_external = [ext for ext in candidate_external_students if ext.id not in linked_externals]

    external_name_index = {
        ext.id: normalized_name(ext.first_name, ext.last_name, ext.display_name) for ext in available_external
    }

    suggestions: list[dict[str, Any]] = []

    for roster_student in roster_students:
        student_name = normalized_name(None, None, roster_student["display_name"])
        roster_first, roster_last, roster_full = student_name

        exact_candidates = [
            ext
            for ext in available_external
            if external_name_index[ext.id][2] and external_name_index[ext.id][2] == roster_full
        ]

        if len(exact_candidates) == 1:
            ext = exact_candidates[0]
            suggestions.append(
                {
                    "student": roster_student,
                    "suggestion": {
                        "external_student_id": ext.id,
                        "display_name": ext.display_name,
                        "external_key": ext.external_key,
                    },
                    "confidence": LinkConfidence.high.value,
                    "method": LinkMethod.normalized.value,
                    "alternatives": [],
                    "reason": "unique exact normalized match",
                }
            )
            continue

        medium_candidates = [
            ext
            for ext in available_external
            if roster_last
            and external_name_index[ext.id][1] == roster_last
            and _starts_with_either(roster_first, external_name_index[ext.id][0])
        ]

        if len(medium_candidates) == 1:
            ext = medium_candidates[0]
            suggestions.append(
                {
                    "student": roster_student,
                    "suggestion": {
                        "external_student_id": ext.id,
                        "display_name": ext.display_name,
                        "external_key": ext.external_key,
                    },
                    "confidence": LinkConfidence.medium.value,
                    "method": LinkMethod.fuzzy.value,
                    "alternatives": [],
                    "reason": "last name match; first name prefix",
                }
            )
            continue

        scored = sorted(
            available_external,
            key=lambda ext: _candidate_score(student_name, external_name_index[ext.id]),
            reverse=True,
        )
        alternatives = [
            {
                "external_student_id": ext.id,
                "display_name": ext.display_name,
                "external_key": ext.external_key,
            }
            for ext in scored
            if _candidate_score(student_name, external_name_index[ext.id]) > 0
        ][:5]

        ambiguous_count = len(medium_candidates) if medium_candidates else len(exact_candidates)
        reason = "no reliable candidate"
        if ambiguous_count > 1:
            reason = f"ambiguous: {ambiguous_count} candidates"
        elif alternatives:
            reason = "low confidence candidate; manual review required"

        suggestions.append(
            {
                "student": roster_student,
                "suggestion": alternatives[0] if len(alternatives) == 1 else None,
                "confidence": LinkConfidence.low.value,
                "method": LinkMethod.fuzzy.value,
                "alternatives": alternatives,
                "reason": reason,
            }
        )

    return suggestions


def _get_student(db: Session, workspace_id: uuid.UUID, student_id: uuid.UUID) -> Student | None:
    stmt = select(Student).where(Student.id == student_id, Student.workspace_id == workspace_id)
    return db.execute(stmt).scalar_one_or_none()


def _get_external_student(
    db: Session,
    workspace_id: uuid.UUID,
    external_student_id: uuid.UUID,
    source: str,
) -> ExternalStudent | None:
    stmt = select(ExternalStudent).where(
        ExternalStudent.id == external_student_id,
        ExternalStudent.workspace_id == workspace_id,
        ExternalStudent.source == source,
    )
    return db.execute(stmt).scalar_one_or_none()


def _unlink_attempts_for_external(
    db: Session,
    workspace_id: uuid.UUID,
    source: str,
    external_student_id: uuid.UUID,
) -> None:
    stmt = (
        update(ActivityAttempt)
        .where(
            ActivityAttempt.workspace_id == workspace_id,
            ActivityAttempt.source == source,
            ActivityAttempt.external_student_id == external_student_id,
        )
        .values(student_id=None)
    )
    db.execute(stmt)


def _link_attempts_for_external(
    db: Session,
    workspace_id: uuid.UUID,
    source: str,
    external_student_id: uuid.UUID,
    student_id: uuid.UUID,
) -> None:
    stmt = (
        update(ActivityAttempt)
        .where(
            ActivityAttempt.workspace_id == workspace_id,
            ActivityAttempt.source == source,
            ActivityAttempt.external_student_id == external_student_id,
        )
        .values(student_id=student_id)
    )
    db.execute(stmt)


def create_student_link(
    db: Session,
    *,
    workspace_id: uuid.UUID,
    source: str,
    student_id: uuid.UUID,
    external_student_id: uuid.UUID,
    verified_by_user: bool,
    notes: str | None,
    force: bool = False,
    confidence: str = LinkConfidence.medium.value,
    method: str = LinkMethod.normalized.value,
    commit: bool = True,
) -> StudentLink:
    student = _get_student(db, workspace_id, student_id)
    if not student:
        raise ValueError("Student not found")

    external_student = _get_external_student(db, workspace_id, external_student_id, source)
    if not external_student:
        raise ValueError("External student not found for source")

    existing_for_student = db.execute(
        select(StudentLink).where(
            StudentLink.workspace_id == workspace_id,
            StudentLink.source == source,
            StudentLink.student_id == student_id,
        )
    ).scalar_one_or_none()

    existing_for_external = db.execute(
        select(StudentLink).where(
            StudentLink.workspace_id == workspace_id,
            StudentLink.source == source,
            StudentLink.external_student_id == external_student_id,
        )
    ).scalar_one_or_none()

    if not force:
        if existing_for_student:
            raise ConflictError("Student is already linked for this source")
        if existing_for_external:
            raise ConflictError("External student is already linked for this source")
    else:
        to_unlink_external_ids: list[uuid.UUID] = []
        if existing_for_student:
            to_unlink_external_ids.append(existing_for_student.external_student_id)
            db.execute(delete(StudentLink).where(StudentLink.id == existing_for_student.id))
        if existing_for_external and (
            not existing_for_student or existing_for_external.id != existing_for_student.id
        ):
            to_unlink_external_ids.append(existing_for_external.external_student_id)
            db.execute(delete(StudentLink).where(StudentLink.id == existing_for_external.id))

        for old_external_id in to_unlink_external_ids:
            _unlink_attempts_for_external(db, workspace_id, source, old_external_id)

    link = StudentLink(
        workspace_id=workspace_id,
        source=source,
        student_id=student_id,
        external_student_id=external_student_id,
        confidence=confidence,
        method=method,
        verified_by_user=verified_by_user,
        verified_at=datetime.now(timezone.utc) if verified_by_user else None,
        notes=notes,
    )
    db.add(link)
    _link_attempts_for_external(db, workspace_id, source, external_student_id, student_id)
    if commit:
        db.commit()
        db.refresh(link)
    else:
        db.flush()
    return link


def delete_student_link(db: Session, workspace_id: uuid.UUID, link_id: uuid.UUID) -> bool:
    link = db.execute(
        select(StudentLink).where(StudentLink.id == link_id, StudentLink.workspace_id == workspace_id)
    ).scalar_one_or_none()
    if not link:
        return False

    _unlink_attempts_for_external(db, workspace_id, link.source, link.external_student_id)
    db.execute(delete(StudentLink).where(StudentLink.id == link.id))
    db.commit()
    return True


def list_external_students_for_class(
    db: Session,
    workspace_id: uuid.UUID,
    class_id: uuid.UUID,
    source: str,
    query: str | None = None,
) -> list[ExternalStudent]:
    candidates = _class_external_students(db, workspace_id, class_id, source)
    if not query:
        return candidates

    q = _clean(query)
    if not q:
        return candidates

    filtered = []
    for ext in candidates:
        if q in _clean(ext.display_name) or q in _clean(ext.external_key):
            filtered.append(ext)
    return filtered


def bulk_create_student_links(
    db: Session,
    workspace_id: uuid.UUID,
    links: list[dict[str, Any]],
    force: bool = False,
) -> list[StudentLink]:
    created: list[StudentLink] = []
    for payload in links:
        created.append(
            create_student_link(
                db,
                workspace_id=workspace_id,
                source=payload["source"],
                student_id=payload["student_id"],
                external_student_id=payload["external_student_id"],
                verified_by_user=payload.get("verified_by_user", True),
                notes=payload.get("notes"),
                force=force,
                commit=False,
            )
        )
    db.commit()
    for link in created:
        db.refresh(link)
    return created


def import_roster_rows(
    db: Session,
    workspace_id: uuid.UUID,
    class_id: uuid.UUID,
    rows: list[dict[str, str]],
) -> dict[str, Any]:
    processed = 0
    for row in rows:
        email = row["email"].strip().lower()
        display_name = row["display_name"].strip()
        if not email or not display_name:
            continue
        first_name, last_name = split_display_name(display_name)

        student = db.execute(
            select(Student).where(Student.workspace_id == workspace_id, Student.email == email)
        ).scalar_one_or_none()
        if not student:
            student = Student(
                workspace_id=workspace_id,
                email=email,
                display_name=display_name,
                first_name=first_name or None,
                last_name=last_name or None,
            )
            db.add(student)
            db.flush()
        else:
            student.display_name = display_name
            student.first_name = first_name or None
            student.last_name = last_name or None

        enrollment = db.execute(
            select(ClassEnrollment).where(
                ClassEnrollment.workspace_id == workspace_id,
                ClassEnrollment.class_id == class_id,
                ClassEnrollment.student_id == student.id,
            )
        ).scalar_one_or_none()
        if not enrollment:
            db.add(
                ClassEnrollment(
                    workspace_id=workspace_id,
                    class_id=class_id,
                    student_id=student.id,
                )
            )

        processed += 1

    db.commit()
    return {
        "class_id": class_id,
        "source": "homeroom",
        "rows_received": len(rows),
        "rows_processed": processed,
    }


def import_learningcom_rows(
    db: Session,
    workspace_id: uuid.UUID,
    class_id: uuid.UUID,
    rows: list[dict[str, Any]],
    source: str = SOURCE_LEARNING_COM,
) -> dict[str, Any]:
    processed = 0
    for row in rows:
        external_key = str(row["external_key"]).strip()
        display_name = str(row["display_name"]).strip()
        if not external_key or not display_name:
            continue

        first_name, last_name = split_display_name(display_name)
        external_student = db.execute(
            select(ExternalStudent).where(
                ExternalStudent.workspace_id == workspace_id,
                ExternalStudent.source == source,
                ExternalStudent.external_key == external_key,
            )
        ).scalar_one_or_none()
        if not external_student:
            external_student = ExternalStudent(
                workspace_id=workspace_id,
                source=source,
                external_key=external_key,
                display_name=display_name,
                first_name=first_name or None,
                last_name=last_name or None,
            )
            db.add(external_student)
            db.flush()
        else:
            external_student.display_name = display_name
            external_student.first_name = first_name or None
            external_student.last_name = last_name or None

        link = db.execute(
            select(StudentLink).where(
                StudentLink.workspace_id == workspace_id,
                StudentLink.source == source,
                StudentLink.external_student_id == external_student.id,
            )
        ).scalar_one_or_none()

        db.add(
            ActivityAttempt(
                workspace_id=workspace_id,
                class_id=class_id,
                source=source,
                external_student_id=external_student.id,
                student_id=link.student_id if link else None,
                activity_name=str(row.get("activity_name") or "").strip(),
                score_pct=row.get("score_pct"),
                progress_pct=row.get("progress_pct"),
                attempts_count=row.get("attempts_count"),
                attempted_at=row.get("attempted_at"),
                raw=row,
            )
        )
        processed += 1

    db.commit()
    return {
        "class_id": class_id,
        "source": source,
        "rows_received": len(rows),
        "rows_processed": processed,
    }


def class_kpis(db: Session, workspace_id: uuid.UUID, class_id: uuid.UUID, source: str) -> dict[str, Any]:
    roster_students = _class_students(db, workspace_id, class_id)
    student_links = _links_for_students(db, workspace_id, source, [student.id for student in roster_students])

    attempt_stats = {
        row[0]: {
            "progress_pct_avg": float(row[1]) if row[1] is not None else None,
            "score_pct_avg": float(row[2]) if row[2] is not None else None,
            "attempts_count": int(row[3]) if row[3] is not None else 0,
        }
        for row in db.execute(
            select(
                ActivityAttempt.external_student_id,
                func.avg(ActivityAttempt.progress_pct),
                func.avg(ActivityAttempt.score_pct),
                func.count(ActivityAttempt.id),
            ).where(
                ActivityAttempt.workspace_id == workspace_id,
                ActivityAttempt.class_id == class_id,
                ActivityAttempt.source == source,
            )
            .group_by(ActivityAttempt.external_student_id)
        ).all()
    }

    roster_rows: list[dict[str, Any]] = []
    avg_progress_values: list[float] = []
    avg_score_values: list[float] = []

    for student in roster_students:
        link = student_links.get(student.id)
        if not link:
            roster_rows.append(
                {
                    "student_id": student.id,
                    "display_name": student.display_name,
                    "email": student.email,
                    "linked": False,
                    "external_student_id": None,
                    "progress_pct_avg": None,
                    "score_pct_avg": None,
                    "attempts_count": 0,
                    "status": "unlinked",
                }
            )
            continue

        stats = attempt_stats.get(link.external_student_id)
        progress_pct = stats["progress_pct_avg"] if stats else None
        score_pct = stats["score_pct_avg"] if stats else None
        attempts_count = stats["attempts_count"] if stats else 0

        if progress_pct is not None:
            avg_progress_values.append(progress_pct)
        if score_pct is not None:
            avg_score_values.append(score_pct)

        roster_rows.append(
            {
                "student_id": student.id,
                "display_name": student.display_name,
                "email": student.email,
                "linked": True,
                "external_student_id": link.external_student_id,
                "progress_pct_avg": progress_pct,
                "score_pct_avg": score_pct,
                "attempts_count": attempts_count,
                "status": "linked" if attempts_count > 0 else "linked-no-data",
            }
        )

    linked_count = len(student_links)
    roster_count = len(roster_students)
    coverage_rate = linked_count / roster_count if roster_count else 0.0

    return {
        "class_id": class_id,
        "source": source,
        "roster_count": roster_count,
        "linked_count": linked_count,
        "coverage_rate": round(coverage_rate, 4),
        "average_progress_pct": round(sum(avg_progress_values) / len(avg_progress_values), 2) if avg_progress_values else None,
        "average_score_pct": round(sum(avg_score_values) / len(avg_score_values), 2) if avg_score_values else None,
        "roster": roster_rows,
    }
