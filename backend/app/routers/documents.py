from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_employee
from app.database import get_db
from app.models.document import Document, DocumentVersion
from app.models.master import Employee
from app.models.tenant import Tenant
from app.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
    DocumentVersionCreate,
    DocumentVersionResponse,
    DocumentWithContentResponse,
)
from app.tenant import get_current_tenant

router = APIRouter(prefix="/api/v1/documents", tags=["ドキュメント管理"])


@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    skip: int = 0,
    limit: int = 100,
    q: str | None = None,
    category: str | None = None,
    status: str | None = None,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[Document]:
    query = db.query(Document).filter(Document.tenant_id == tenant.id)
    if q:
        escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        query = query.filter(Document.title.ilike(f"%{escaped}%", escape="\\"))
    if category:
        query = query.filter(Document.category == category)
    if status:
        query = query.filter(Document.status == status)
    return list(query.order_by(Document.updated_at.desc()).offset(skip).limit(limit).all())


@router.post("/", response_model=DocumentResponse, status_code=201)
def create_document(
    data: DocumentCreate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Document:
    doc = Document(
        tenant_id=tenant.id,
        title=data.title,
        category=data.category,
        status=data.status,
        current_version=1,
    )
    db.add(doc)
    db.flush()

    version = DocumentVersion(
        document_id=doc.id,
        version=1,
        content=data.content,
        change_summary="初版作成",
    )
    db.add(version)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{document_id}", response_model=DocumentWithContentResponse)
def get_document(
    document_id: int,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Document:
    doc = db.query(Document).filter(Document.id == document_id, Document.tenant_id == tenant.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ドキュメントが見つかりません")
    return doc


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    data: DocumentUpdate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Document:
    doc = db.query(Document).filter(Document.id == document_id, Document.tenant_id == tenant.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ドキュメントが見つかりません")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(doc, key, value)
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/{document_id}/versions", response_model=DocumentVersionResponse, status_code=201)
def create_document_version(
    document_id: int,
    data: DocumentVersionCreate,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> DocumentVersion:
    doc = db.query(Document).filter(Document.id == document_id, Document.tenant_id == tenant.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ドキュメントが見つかりません")

    new_version_number = doc.current_version + 1
    version = DocumentVersion(
        document_id=doc.id,
        version=new_version_number,
        content=data.content,
        change_summary=data.change_summary,
    )
    db.add(version)
    doc.current_version = new_version_number
    db.commit()
    db.refresh(version)
    return version


@router.get("/{document_id}/versions", response_model=list[DocumentVersionResponse])
def list_document_versions(
    document_id: int,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> list[DocumentVersion]:
    doc = db.query(Document).filter(Document.id == document_id, Document.tenant_id == tenant.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ドキュメントが見つかりません")
    return list(
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.version.desc())
        .all()
    )


@router.get("/{document_id}/versions/{version_number}", response_model=DocumentVersionResponse)
def get_document_version(
    document_id: int,
    version_number: int,
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> DocumentVersion:
    doc = db.query(Document).filter(Document.id == document_id, Document.tenant_id == tenant.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ドキュメントが見つかりません")
    version = (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == document_id, DocumentVersion.version == version_number)
        .first()
    )
    if not version:
        raise HTTPException(status_code=404, detail="このバージョンが見つかりません")
    return version


@router.post("/{document_id}/approve", response_model=DocumentResponse)
def approve_document(
    document_id: int,
    approved_by: int,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> Document:
    doc = db.query(Document).filter(Document.id == document_id, Document.tenant_id == tenant.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ドキュメントが見つかりません")
    doc.status = "approved"  # type: ignore[assignment]
    doc.approved_by = approved_by
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{document_id}", status_code=204)
def delete_document(
    document_id: int,
    current_employee: Employee = Depends(get_current_employee),
    tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
) -> None:
    doc = db.query(Document).filter(Document.id == document_id, Document.tenant_id == tenant.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ドキュメントが見つかりません")
    db.delete(doc)
    db.commit()
