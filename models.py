from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Institution(Base):
    __tablename__ = "institutions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    type = Column(String(50), nullable=False)
    accreditation_body = Column(String(50), nullable=False)
    email_domain = Column(String(255), nullable=False)
    approved = Column(Boolean, default=False)

    users = relationship("User", back_populates="institution", cascade="all,delete-orphan")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), nullable=False)  # "superadmin","admin","coordinator","hod","faculty"
    is_active = Column(Boolean, default=True)

    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True)
    institution = relationship("Institution", back_populates="users")
