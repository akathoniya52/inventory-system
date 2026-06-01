from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: str | None = Field(None, max_length=40)
    company: str | None = Field(None, max_length=255)


class CustomerCreate(CustomerBase):
    pass


class CustomerOut(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
