"""fix is_active server default

Revision ID: 31151163f987
Revises: d680d119276e
Create Date: 2026-03-22 20:10:38.303767

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "31151163f987"
down_revision: Union[str, Sequence[str], None] = "d680d119276e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE users SET is_active = true WHERE is_active IS NULL")
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.Boolean(),
        server_default="true",
        nullable=False,
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.Boolean(),
        server_default=None,
        nullable=True,
    )
