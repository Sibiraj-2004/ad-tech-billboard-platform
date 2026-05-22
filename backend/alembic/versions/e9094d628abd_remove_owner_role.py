"""remove_owner_role

Revision ID: e9094d628abd
Revises: fd827364a1b2
Create Date: 2026-04-10 04:54:07.052701
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e9094d628abd'
down_revision: Union[str, None] = 'fd827364a1b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    op.execute("UPDATE users SET role = 'admin' WHERE role = 'owner'")


def downgrade() -> None:
    """Downgrade database schema."""
    pass
