from datetime import datetime

from pydantic import BaseModel

from app.models.document import DocumentCategory, DocumentStatus


class DocumentVersionBase(BaseModel):
    content: str
    change_summary: str | None = None


class DocumentVersionCreate(DocumentVersionBase):
    pass


class DocumentVersionResponse(DocumentVersionBase):
    id: int
    document_id: int
    version: int
    created_by: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentBase(BaseModel):
    title: str
    category: DocumentCategory
    status: DocumentStatus = DocumentStatus.DRAFT


class DocumentCreate(DocumentBase):
    content: str


class DocumentUpdate(BaseModel):
    title: str | None = None
    category: DocumentCategory | None = None
    status: DocumentStatus | None = None


class DocumentResponse(DocumentBase):
    id: int
    tenant_id: int
    current_version: int
    created_by: int | None = None
    approved_by: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentWithContentResponse(DocumentResponse):
    versions: list[DocumentVersionResponse] = []
