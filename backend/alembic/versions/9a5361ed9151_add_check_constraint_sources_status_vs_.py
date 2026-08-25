"""add check constraint sources status vs superseded_by_id

Revision ID: 9a5361ed9151
Revises: 84e81f8b917a
Create Date: 2026-08-25 09:46:07.247902

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a5361ed9151'
down_revision: Union[str, None] = '84e81f8b917a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Bir kaynak hem "yerine biri gecti" (superseded_by_id dolu) hem
    # "hala aktif" (status='active') olamaz — bu ikisi atomik olarak
    # tutarli olmali. DB seviyesinde zorlamak, ileride bu alani set edecek
    # HERHANGI BIR koddan (henuz yazilmamis olsa da) bagimsiz garanti verir.
    op.create_check_constraint(
        "ck_sources_active_not_superseded",
        "sources",
        "NOT (status = 'active' AND superseded_by_id IS NOT NULL)",
    )


def downgrade() -> None:
    op.drop_constraint("ck_sources_active_not_superseded", "sources", type_="check")
