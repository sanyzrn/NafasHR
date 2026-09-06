"""Persian text ordering using PostgreSQL's existing ICU collation."""
from sqlalchemy import func


def persian_text(column):
    return func.translate(func.trim(column), "يك", "یک").collate("fa-x-icu")
