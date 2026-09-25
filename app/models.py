from datetime import datetime
#v1.CmQKHHN0YXRpY2tleS1lMDBuNXBjbnZyNmJrd3BwNHASIXNlcnZpY2VhY2NvdW50LWUwMGs1NXh3NXhqbjlxd2YzOTIMCKiqztUGEMHxg_UCOgwIp63moAcQwKu4oQJAAloDZTAw.AAAAAAAAAAFKX0KpD1gQH8YBDL2QwnJh4_Aw6qQxv5DwhHSEMK_Rc_mFIAACJ1gwtfy5PGSbiNnxsedELMIaj4KDSwCX8CQC

#v1.CmIKHHN0YXRpY2tleS1lMDBudGg3ZDA0eWZqdnZocnASIXNlcnZpY2VhY2NvdW50LWUwMGs4OXZocHB4dms5OWdmZTILCPmBz9UGELmI10Q6Cwj4hOegBxDAgcVRQAJaA2UwMA.AAAAAAAAAAGX9VdLbwHk6rGYR8hbwCE5fNCmMnB6qktWCmTDUYsIopfOFOKfJYy3B4e8BaCEIGI9uhvQLIFOLUxhyJOz5vEB
from sqlalchemy import String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )
    sync_id: Mapped[str] = mapped_column(
    String(255),
    nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="PENDING"
    )
    
    extracted_data: Mapped[dict] = mapped_column(
        JSONB,
        default=dict
    )

    '''
    LOCAL
SYNC_PENDING
UPLOADING
PROCESSING
NEEDS_REVIEW
CONFIRMED
SYNCED
FAILED
    '''
    '''extraction_status : Mapped[str] = mapped_column(
        String(50),
        default="PENDING"
    )'''


    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    documents: Mapped[list["LoanDocument"]] = relationship(
        back_populates="loan",
        cascade="all, delete-orphan"
    )


class LoanDocument(Base):
    __tablename__ = "loan_documents"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    loan_id: Mapped[int] = mapped_column(
        ForeignKey("loans.id"),
        nullable=False
    )

    filename: Mapped[str] = mapped_column(
        String(255)
    )

    storage_path: Mapped[str] = mapped_column(
        String(500)
    )

    content_type: Mapped[str] = mapped_column(
        String(100)
    )

    file_size: Mapped[int] = mapped_column(
        Integer
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    loan: Mapped["Loan"] = relationship(
        back_populates="documents"
    )