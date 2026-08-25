"""add status to faq_entries

Revision ID: 980593ac6ada
Revises: 9a5361ed9151
Create Date: 2026-08-25 09:47:37.934022

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '980593ac6ada'
down_revision: Union[str, None] = '9a5361ed9151'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('faq_entries', sa.Column('status', sa.Text(), server_default='active', nullable=False))
    op.create_check_constraint(
        'ck_faq_entries_status',
        'faq_entries',
        "status IN ('active', 'inactive')",
    )


def downgrade() -> None:
    op.drop_constraint('ck_faq_entries_status', 'faq_entries', type_='check')
    op.drop_column('faq_entries', 'status')
