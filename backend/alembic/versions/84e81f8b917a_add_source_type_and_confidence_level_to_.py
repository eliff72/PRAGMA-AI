"""add source_type and confidence_level to faq_entries

Revision ID: 84e81f8b917a
Revises: da4a5076d6e5
Create Date: 2026-08-25 09:23:36.614775

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '84e81f8b917a'
down_revision: Union[str, None] = 'da4a5076d6e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('faq_entries', sa.Column('source_type', sa.Text(), server_default='auto_from_chat', nullable=False))
    op.add_column('faq_entries', sa.Column('confidence_level', sa.Text(), server_default='pending_review', nullable=False))
    op.create_check_constraint(
        'ck_faq_entries_source_type',
        'faq_entries',
        "source_type IN ('manual_entry', 'auto_from_chat', 'document_extracted')",
    )
    op.create_check_constraint(
        'ck_faq_entries_confidence_level',
        'faq_entries',
        "confidence_level IN ('verified', 'pending_review')",
    )


def downgrade() -> None:
    op.drop_constraint('ck_faq_entries_confidence_level', 'faq_entries', type_='check')
    op.drop_constraint('ck_faq_entries_source_type', 'faq_entries', type_='check')
    op.drop_column('faq_entries', 'confidence_level')
    op.drop_column('faq_entries', 'source_type')
