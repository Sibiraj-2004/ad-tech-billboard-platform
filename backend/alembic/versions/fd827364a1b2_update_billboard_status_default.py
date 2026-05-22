"""update billboard status default

Revision ID: fd827364a1b2
Revises: ac92853a8408
Create Date: 2026-04-10 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd827364a1b2'
down_revision: Union[str, None] = 'ac92853a8408'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update existing 'pending' billboards to 'active'
    op.execute("UPDATE billboards SET status = 'active' WHERE status = 'pending'")
    
    # Set server-side default for new rows
    op.alter_column('billboards', 'status', server_default='active')


def downgrade() -> None:
    # Revert server-side default
    op.alter_column('billboards', 'status', server_default='pending')
