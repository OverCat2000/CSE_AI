"""restore_is_active_server_default

Revision ID: 89b3324fd83b
Revises: 534afd522627
Create Date: 2026-05-09 11:24:34.597745

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "89b3324fd83b"
down_revision: Union[str, Sequence[str], None] = "534afd522627"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.BOOLEAN(),
        server_default="true",
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.BOOLEAN(),
        server_default=None,
        nullable=False,
    )
