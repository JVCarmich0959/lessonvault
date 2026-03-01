"""student linking

Revision ID: 0002_student_linking
Revises: 0001_init
Create Date: 2026-03-01T00:00:00.000000Z
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0002_student_linking"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "classes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("grade_label", sa.String(length=32), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_classes_workspace_id", "classes", ["workspace_id"])

    op.create_table(
        "students",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=True),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=128), nullable=True),
        sa.Column("last_name", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_students_workspace_id", "students", ["workspace_id"])
    op.create_index("ix_students_email", "students", ["email"], unique=True)

    op.create_table(
        "class_enrollments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("classes.id"), nullable=False),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("class_id", "student_id", name="uq_class_enrollments_class_student"),
    )
    op.create_index("ix_class_enrollments_workspace_id", "class_enrollments", ["workspace_id"])
    op.create_index("ix_class_enrollments_class_id", "class_enrollments", ["class_id"])
    op.create_index("ix_class_enrollments_student_id", "class_enrollments", ["student_id"])

    op.create_table(
        "external_students",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column("external_key", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=128), nullable=True),
        sa.Column("last_name", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint(
            "workspace_id",
            "source",
            "external_key",
            name="uq_external_students_workspace_source_key",
        ),
    )
    op.create_index("ix_external_students_workspace_id", "external_students", ["workspace_id"])

    op.create_table(
        "student_links",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column(
            "external_student_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("external_students.id"),
            nullable=False,
        ),
        sa.Column("confidence", sa.String(length=16), nullable=False, server_default="medium"),
        sa.Column("method", sa.String(length=16), nullable=False, server_default="normalized"),
        sa.Column("verified_by_user", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint(
            "workspace_id",
            "student_id",
            "source",
            name="uq_student_links_workspace_student_source",
        ),
        sa.UniqueConstraint(
            "workspace_id",
            "external_student_id",
            "source",
            name="uq_student_links_workspace_external_source",
        ),
    )
    op.create_index("ix_student_links_workspace_id", "student_links", ["workspace_id"])
    op.create_index("ix_student_links_student_id", "student_links", ["student_id"])
    op.create_index("ix_student_links_external_student_id", "student_links", ["external_student_id"])

    op.create_table(
        "activity_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("class_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("classes.id"), nullable=False),
        sa.Column("source", sa.String(length=64), nullable=False),
        sa.Column(
            "external_student_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("external_students.id"),
            nullable=False,
        ),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("students.id"), nullable=True),
        sa.Column("activity_name", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("score_pct", sa.Float(), nullable=True),
        sa.Column("progress_pct", sa.Float(), nullable=True),
        sa.Column("attempts_count", sa.Integer(), nullable=True),
        sa.Column("attempted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("raw", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_activity_attempts_workspace_id", "activity_attempts", ["workspace_id"])
    op.create_index("ix_activity_attempts_class_id", "activity_attempts", ["class_id"])
    op.create_index("ix_activity_attempts_external_student_id", "activity_attempts", ["external_student_id"])
    op.create_index("ix_activity_attempts_student_id", "activity_attempts", ["student_id"])


def downgrade() -> None:
    op.drop_index("ix_activity_attempts_student_id", table_name="activity_attempts")
    op.drop_index("ix_activity_attempts_external_student_id", table_name="activity_attempts")
    op.drop_index("ix_activity_attempts_class_id", table_name="activity_attempts")
    op.drop_index("ix_activity_attempts_workspace_id", table_name="activity_attempts")
    op.drop_table("activity_attempts")

    op.drop_index("ix_student_links_external_student_id", table_name="student_links")
    op.drop_index("ix_student_links_student_id", table_name="student_links")
    op.drop_index("ix_student_links_workspace_id", table_name="student_links")
    op.drop_table("student_links")

    op.drop_index("ix_external_students_workspace_id", table_name="external_students")
    op.drop_table("external_students")

    op.drop_index("ix_class_enrollments_student_id", table_name="class_enrollments")
    op.drop_index("ix_class_enrollments_class_id", table_name="class_enrollments")
    op.drop_index("ix_class_enrollments_workspace_id", table_name="class_enrollments")
    op.drop_table("class_enrollments")

    op.drop_index("ix_students_email", table_name="students")
    op.drop_index("ix_students_workspace_id", table_name="students")
    op.drop_table("students")

    op.drop_index("ix_classes_workspace_id", table_name="classes")
    op.drop_table("classes")
