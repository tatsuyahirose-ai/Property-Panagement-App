# 不動産業向け統合業務管理システム

不動産業に特化したマルチテナント型 SaaS アプリケーション。賃貸仲介・売買仲介・賃貸管理の業務を一元管理します。

## 機能

- **マスターデータ管理** - 物件、顧客、取引先、社員、部署
- **財務会計基盤** - 勘定科目、仕訳入力・承認、試算表
- **社員統括** - 社員管理、部署管理、ロールベースアクセス制御
- **KPI管理** - 売上目標達成率、成約率、入居率などの指標管理
- **業務フロー** - 案件パイプライン（賃貸仲介・売買仲介・管理）
- **ドキュメント管理** - 設計書・要件定義・ルール・設計思想のバージョン管理
- **マルチテナント** - テナント（不動産会社）ごとのデータ分離

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| バックエンド | FastAPI (Python 3.12) |
| データベース | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 + Alembic |

## プロジェクト構成

```
├── backend/           # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py          # アプリケーションエントリポイント
│   │   ├── config.py        # 設定
│   │   ├── database.py      # DB接続
│   │   ├── tenant.py        # マルチテナント依存関数
│   │   ├── models/          # SQLAlchemy モデル
│   │   ├── schemas/         # Pydantic スキーマ
│   │   └── routers/         # APIルーター
│   └── pyproject.toml
├── frontend/          # Next.js フロントエンド
│   ├── src/
│   │   ├── app/             # App Router ページ
│   │   └── components/      # 共通コンポーネント
│   └── package.json
└── docs/
    └── DESIGN.md      # 設計ドキュメント
```

## セットアップ

### バックエンド

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

### 環境変数

```bash
# backend/.env
DATABASE_URL=postgresql://user:pass@localhost:5432/real_estate
SECRET_KEY=your-secret-key
```

## API

API ドキュメント: `http://localhost:8000/docs` (Swagger UI)

全てのAPIリクエスト（テナント管理・ヘルスチェック除く）には `X-Tenant-Id` ヘッダーが必要です。

## 設計ドキュメント

詳細な設計は [docs/DESIGN.md](docs/DESIGN.md) を参照してください。
