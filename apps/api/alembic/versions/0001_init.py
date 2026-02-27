"""init

Revision ID: 0001_init
Revises:
Create Date: 2026-02-27T20:46:29.914545Z
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "workspaces",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("owner_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "workspace_members",
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="owner"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "standards_sets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("version_label", sa.String(length=64), nullable=False, server_default="v1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_standards_sets_workspace_id", "standards_sets", ["workspace_id"])

    op.create_table(
        "standards",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("standards_set_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("standards_sets.id"), nullable=False),
        sa.Column("code", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
    )
    op.create_index("ix_standards_standards_set_id", "standards", ["standards_set_id"])
    op.create_index("ix_standards_code", "standards", ["code"])

    op.create_table(
        "materials",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_materials_workspace_id", "materials", ["workspace_id"])

    op.create_table(
        "lesson_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("workspaces.id"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("overview", sa.Text(), nullable=False, server_default=""),
        sa.Column("primary_grade", sa.String(length=32), nullable=False, server_default=""),
        sa.Column("subject", sa.String(length=64), nullable=False, server_default=""),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="45"),
        sa.Column("content", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_lesson_plans_workspace_id", "lesson_plans", ["workspace_id"])
    op.create_index("ix_lesson_plans_title", "lesson_plans", ["title"])

    op.create_table(
        "lesson_plan_standards",
        sa.Column("lesson_plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lesson_plans.id"), primary_key=True),
        sa.Column("standard_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("standards.id"), primary_key=True),
    )

    op.create_table(
        "lesson_plan_materials",
        sa.Column("lesson_plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lesson_plans.id"), primary_key=True),
        sa.Column("material_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("materials.id"), primary_key=True),
        sa.Column("quantity_note", sa.String(length=128), nullable=False, server_default=""),
        sa.Column("prep_note", sa.String(length=255), nullable=False, server_default=""),
    )

    op.create_table(
        "lesson_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lesson_plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lesson_plans.id"), nullable=False),
        sa.Column("taught_on", sa.Date(), nullable=False),
        sa.Column("grade", sa.String(length=32), nullable=False, server_default=""),
        sa.Column("class_period", sa.String(length=32), nullable=False, server_default=""),
        sa.Column("duration_actual_minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notes_quick", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_lesson_runs_lesson_plan_id", "lesson_runs", ["lesson_plan_id"])
    op.create_index("ix_lesson_runs_taught_on", "lesson_runs", ["taught_on"])

    op.create_table(
        "lesson_reflections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("lesson_run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("lesson_runs.id"), nullable=False, unique=True),
        sa.Column("effectiveness_rating", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("worked_well", sa.Text(), nullable=False, server_default=""),
        sa.Column("did_not_work", sa.Text(), nullable=False, server_default=""),
        sa.Column("misconceptions", sa.Text(), nullable=False, server_default=""),
        sa.Column("changes_next_time", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

def downgrade() -> None:
    op.drop_table("lesson_reflections")
    op.drop_index("ix_lesson_runs_taught_on", table_name="lesson_runs")
    op.drop_index("ix_lesson_runs_lesson_plan_id", table_name="lesson_runs")
    op.drop_table("lesson_runs")
    op.drop_table("lesson_plan_materials")
    op.drop_table("lesson_plan_standards")
    op.drop_index("ix_lesson_plans_title", table_name="lesson_plans")
    op.drop_index("ix_lesson_plans_workspace_id", table_name="lesson_plans")
    op.drop_table("lesson_plans")
    op.drop_index("ix_materials_workspace_id", table_name="materials")
    op.drop_table("materials")
    op.drop_index("ix_standards_code", table_name="standards")
    op.drop_index("ix_standards_standards_set_id", table_name="standards")
    op.drop_table("standards")
    op.drop_index("ix_standards_sets_workspace_id", table_name="standards_sets")
    op.drop_table("standards_sets")
    op.drop_table("workspace_members")
    op.drop_table("workspaces")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
