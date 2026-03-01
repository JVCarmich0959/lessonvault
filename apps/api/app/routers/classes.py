import uuid
import csv
from io import StringIO

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import CurrentUser, get_current_user, get_or_create_default_workspace, require_workspace_roles
from app.db.session import get_db
from app.schemas.classes import (
    ClassCreateIn,
    ClassKPIOut,
    ClassOut,
    ExternalStudentSummaryOut,
    ImportResultOut,
    LearningComImportIn,
    LinkStatusOut,
    LinkSuggestionOut,
    RosterImportIn,
    StudentLinkBulkIn,
    StudentLinkCreateIn,
    StudentLinkOut,
)
from app.services.classes_service import (
    ConflictError,
    SOURCE_LEARNING_COM,
    bulk_create_student_links,
    class_kpis,
    create_class,
    create_student_link,
    delete_student_link,
    get_class,
    get_link_status,
    get_link_suggestions,
    import_learningcom_rows,
    import_roster_rows,
    list_classes,
    list_external_students_for_class,
)

router = APIRouter(dependencies=[Depends(get_current_user)])


def _require_class(db: Session, workspace_id: uuid.UUID, class_id: uuid.UUID):
    classroom = get_class(db, workspace_id, class_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found")
    return classroom


def _clean_row_key(value: str) -> str:
    return value.strip().lower().replace(" ", "_")


def _parse_roster_csv(csv_text: str) -> list[dict[str, str]]:
    reader = csv.DictReader(StringIO(csv_text))
    rows: list[dict[str, str]] = []
    for raw_row in reader:
        normalized = {_clean_row_key(key): (value or "").strip() for key, value in raw_row.items() if key}
        email = normalized.get("email", "")
        display_name = normalized.get("display_name") or normalized.get("student") or normalized.get("name") or ""
        if not email or not display_name:
            continue
        rows.append({"email": email, "display_name": display_name})
    return rows


def _to_float(value: str) -> float | None:
    raw = value.strip()
    if not raw:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def _to_int(value: str) -> int | None:
    raw = value.strip()
    if not raw:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def _parse_learningcom_csv(csv_text: str) -> list[dict[str, object]]:
    reader = csv.DictReader(StringIO(csv_text))
    rows: list[dict[str, object]] = []
    for raw_row in reader:
        normalized = {_clean_row_key(key): (value or "").strip() for key, value in raw_row.items() if key}
        external_key = (
            normalized.get("sis_student_id")
            or normalized.get("student_id")
            or normalized.get("external_key")
            or ""
        )
        display_name = normalized.get("student") or normalized.get("display_name") or normalized.get("name") or ""
        if not external_key or not display_name:
            continue
        rows.append(
            {
                "external_key": external_key,
                "display_name": display_name,
                "activity_name": normalized.get("activity") or normalized.get("activity_name") or "",
                "score_pct": _to_float(normalized.get("score_pct", "")),
                "progress_pct": _to_float(normalized.get("progress_pct", "")),
                "attempts_count": _to_int(normalized.get("attempts_count", "")),
            }
        )
    return rows


@router.get("/classes", response_model=list[ClassOut])
def list_classes_route(user: CurrentUser, db: Session = Depends(get_db)):
    workspace = get_or_create_default_workspace(db, user)
    return list_classes(db, workspace.id)


@router.post("/classes", response_model=ClassOut, dependencies=[Depends(require_workspace_roles("owner"))])
def create_class_route(payload: ClassCreateIn, user: CurrentUser, db: Session = Depends(get_db)):
    workspace = get_or_create_default_workspace(db, user)
    return create_class(db, workspace.id, payload.name, payload.grade_label)


@router.get("/classes/{class_id}", response_model=ClassOut)
def get_class_route(class_id: uuid.UUID, user: CurrentUser, db: Session = Depends(get_db)):
    workspace = get_or_create_default_workspace(db, user)
    return _require_class(db, workspace.id, class_id)


@router.post(
    "/classes/{class_id}/imports/homeroom",
    response_model=ImportResultOut,
    dependencies=[Depends(require_workspace_roles("owner"))],
)
def import_homeroom_route(
    class_id: uuid.UUID,
    payload: RosterImportIn,
    user: CurrentUser,
    db: Session = Depends(get_db),
):
    workspace = get_or_create_default_workspace(db, user)
    _require_class(db, workspace.id, class_id)
    rows = [row.model_dump() for row in payload.rows]
    if not rows and payload.csv_text:
        rows = _parse_roster_csv(payload.csv_text)
    if not rows:
        raise HTTPException(status_code=400, detail="No valid roster rows were provided")
    return import_roster_rows(
        db,
        workspace.id,
        class_id,
        rows=rows,
    )


@router.post(
    "/classes/{class_id}/imports/learningcom",
    response_model=ImportResultOut,
    dependencies=[Depends(require_workspace_roles("owner"))],
)
def import_learningcom_route(
    class_id: uuid.UUID,
    payload: LearningComImportIn,
    user: CurrentUser,
    db: Session = Depends(get_db),
):
    workspace = get_or_create_default_workspace(db, user)
    _require_class(db, workspace.id, class_id)
    rows = [row.model_dump() for row in payload.rows]
    if not rows and payload.csv_text:
        rows = _parse_learningcom_csv(payload.csv_text)
    if not rows:
        raise HTTPException(status_code=400, detail="No valid learning export rows were provided")
    return import_learningcom_rows(
        db,
        workspace.id,
        class_id,
        rows=rows,
        source=SOURCE_LEARNING_COM,
    )


@router.get("/classes/{class_id}/kpis", response_model=ClassKPIOut)
def class_kpis_route(
    class_id: uuid.UUID,
    user: CurrentUser,
    source: str = Query(default=SOURCE_LEARNING_COM),
    db: Session = Depends(get_db),
):
    workspace = get_or_create_default_workspace(db, user)
    _require_class(db, workspace.id, class_id)
    return class_kpis(db, workspace.id, class_id, source)


@router.get("/classes/{class_id}/link-status", response_model=LinkStatusOut)
def link_status_route(
    class_id: uuid.UUID,
    user: CurrentUser,
    source: str = Query(default=SOURCE_LEARNING_COM),
    db: Session = Depends(get_db),
):
    workspace = get_or_create_default_workspace(db, user)
    _require_class(db, workspace.id, class_id)
    return get_link_status(db, workspace.id, class_id, source)


@router.get("/classes/{class_id}/link-suggestions", response_model=list[LinkSuggestionOut])
def link_suggestions_route(
    class_id: uuid.UUID,
    user: CurrentUser,
    source: str = Query(default=SOURCE_LEARNING_COM),
    db: Session = Depends(get_db),
):
    workspace = get_or_create_default_workspace(db, user)
    _require_class(db, workspace.id, class_id)
    return get_link_suggestions(db, workspace.id, class_id, source)


@router.get("/classes/{class_id}/external-students", response_model=list[ExternalStudentSummaryOut])
def external_students_route(
    class_id: uuid.UUID,
    user: CurrentUser,
    source: str = Query(default=SOURCE_LEARNING_COM),
    q: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    workspace = get_or_create_default_workspace(db, user)
    _require_class(db, workspace.id, class_id)
    students = list_external_students_for_class(db, workspace.id, class_id, source, q)
    return [
        {
            "external_student_id": student.id,
            "display_name": student.display_name,
            "external_key": student.external_key,
        }
        for student in students
    ]


@router.post("/student-links", response_model=StudentLinkOut, dependencies=[Depends(require_workspace_roles("owner"))])
def create_student_link_route(
    payload: StudentLinkCreateIn,
    user: CurrentUser,
    force: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    workspace = get_or_create_default_workspace(db, user)
    try:
        return create_student_link(
            db,
            workspace_id=workspace.id,
            source=payload.source,
            student_id=payload.student_id,
            external_student_id=payload.external_student_id,
            verified_by_user=payload.verified_by_user,
            notes=payload.notes,
            force=force,
        )
    except ConflictError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc))


@router.post(
    "/student-links/bulk",
    response_model=list[StudentLinkOut],
    dependencies=[Depends(require_workspace_roles("owner"))],
)
def bulk_student_link_route(
    payload: StudentLinkBulkIn,
    user: CurrentUser,
    force: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    workspace = get_or_create_default_workspace(db, user)
    try:
        return bulk_create_student_links(
            db,
            workspace_id=workspace.id,
            links=[link.model_dump() for link in payload.links],
            force=force,
        )
    except ConflictError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=str(exc))
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/student-links/{link_id}", status_code=204, dependencies=[Depends(require_workspace_roles("owner"))])
def delete_student_link_route(link_id: uuid.UUID, user: CurrentUser, db: Session = Depends(get_db)):
    workspace = get_or_create_default_workspace(db, user)
    deleted = delete_student_link(db, workspace.id, link_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Link not found")
