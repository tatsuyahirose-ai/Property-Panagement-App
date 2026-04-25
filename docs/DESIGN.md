# 不動産業向け業務管理システム - 設計ドキュメント

## 1. システム概要

不動産業に特化したマルチテナント型統合業務管理システム。賃貸仲介・売買仲介・賃貸管理を含む幅広い業務領域をカバーし、財務会計、社員管理、KPI分析、業務フロー管理、仕様書・ドキュメント管理を一元的に提供する。

### 設計思想

- **マルチテナント**: テナント（不動産会社）ごとにデータを完全分離（Row-Level Security）
- **モジュラー設計**: 各機能は独立したモジュールとして実装し、疎結合を維持
- **日本の不動産業特化**: 宅建業法に準拠した業務フロー、日本の会計基準に対応
- **設計のブレ防止**: 仕様書・ドキュメント管理機能により、要件定義・設計思想・ルールをバージョン管理

## 2. 技術スタック

| レイヤー | 技術 | 備考 |
|---------|------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript | Tailwind CSS + shadcn/ui |
| バックエンド | FastAPI (Python 3.12) | 非同期処理対応 |
| データベース | PostgreSQL 16 | SQLAlchemy ORM + Alembic |
| 認証 | NextAuth.js | JWT + セッション管理 |
| API通信 | REST API | OpenAPI (Swagger) 自動生成 |
| マルチテナント | Row-Level Security | 全テーブルに tenant_id |

## 3. マルチテナントアーキテクチャ

### データ分離方式

Row-Level Security (RLS) 方式を採用。全てのビジネスデータテーブルに `tenant_id` カラムを持ち、APIレイヤーでテナントIDによるフィルタリングを実施。

```
┌──────────────────────────────────────────────────┐
│                  クライアント                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ テナントA    │  │ テナントB    │  │ テナントC    │ │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘ │
└─────────┼───────────────┼───────────────┼────────┘
          │               │               │
          ▼               ▼               ▼
┌──────────────────────────────────────────────────┐
│           API Gateway (FastAPI)                   │
│  ┌────────────────────────────────────────────┐  │
│  │ X-Tenant-Id ヘッダーによるテナント識別       │  │
│  │ → get_current_tenant() 依存関数             │  │
│  │ → 全クエリに tenant_id フィルター自動適用    │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────┐
│           PostgreSQL (共有データベース)             │
│  ┌─────────────────────────────────────────────┐ │
│  │ 全テーブルに tenant_id (FK → tenants.id)      │ │
│  │ tenant_id + id による複合インデックス          │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### テナントモデル

```python
class Tenant:
    id: int           # テナントID
    name: str         # 会社名
    slug: str         # URLスラッグ（一意）
    domain: str       # カスタムドメイン
    plan: str         # 契約プラン（free/standard/premium）
    is_active: bool   # 有効/無効
    settings: str     # テナント固有設定（JSON）
```

## 4. モジュール構成

### 4.1 マスターデータ管理

| マスター | 主要フィールド | 説明 |
|---------|-------------|------|
| テナントマスター | テナントID, 名称, スラッグ, ドメイン, プラン | マルチテナント管理 |
| 物件マスター | 物件ID, テナントID, 名称, 所在地, 種別, 構造, 築年, 面積, 賃料/価格 | 賃貸・売買物件の基本情報 |
| 顧客マスター | 顧客ID, テナントID, 氏名, 連絡先, 種別(個人/法人), ステータス | 入居者・購入者・オーナー |
| 取引先マスター | 取引先ID, テナントID, 名称, 種別, 連絡先, 口座情報 | 管理会社, 工事業者, 金融機関 |
| 社員マスター | 社員ID, テナントID, 氏名, 部署, 役職, 入社日, 資格 | 宅建士資格なども管理 |
| 部署マスター | 部署ID, テナントID, 名称, 上位部署, 管理者 | 組織階層 |

### 4.2 財務会計基盤

| 機能 | 説明 |
|------|------|
| 勘定科目管理 | 不動産業向け勘定科目体系（テナントごとにカスタマイズ可能） |
| 仕訳入力 | 借方・貸方の仕訳登録、承認フロー |
| 仕訳帳 | 仕訳の一覧・検索・フィルタリング |
| 試算表 | 勘定科目別の残高一覧 |
| 月次決算 | 月次の締め処理 |
| 消費税管理 | 課税・非課税・免税区分の管理 |

#### 勘定科目体系（不動産業向け）

```
【資産】
  現金及び預金
    ├ 現金
    ├ 普通預金
    └ 当座預金
  売掛金
  前払費用
  建物
  土地

【負債】
  買掛金
  未払金
  預り金（敷金・保証金）
  借入金

【収益】
  売上高
    ├ 仲介手数料収入
    ├ 管理費収入
    ├ 賃料収入
    └ その他収入

【費用】
  人件費
    ├ 給与手当
    ├ 法定福利費
    └ 福利厚生費
  営業費
    ├ 広告宣伝費
    ├ 旅費交通費
    └ 通信費
  管理費
    ├ 修繕費
    ├ 水道光熱費
    └ 保険料
```

### 4.3 社員統括

| 機能 | 説明 |
|------|------|
| 社員管理 | 社員情報の登録・更新・退職処理 |
| 部署管理 | 部署の作成・変更・組織図表示 |
| 権限管理 | ロールベースアクセス制御（RBAC） |
| 資格管理 | 宅地建物取引士等の資格情報管理 |

#### 権限ロール

| ロール | 権限 |
|-------|------|
| admin | 全機能アクセス可 |
| manager | 部署内データの閲覧・編集、承認 |
| staff | 担当データの閲覧・編集 |
| viewer | 閲覧のみ |

### 4.4 KPI管理

| KPI | 計算方法 | 対象 |
|-----|---------|------|
| 売上目標達成率 | 実績売上 / 目標売上 × 100 | 個人/部署/全社 |
| 成約率 | 成約数 / 案件数 × 100 | 個人/部署 |
| 顧客獲得コスト（CAC） | 営業費用 / 新規顧客数 | 全社 |
| 平均成約期間 | 案件開始〜成約までの平均日数 | 個人/部署 |
| 物件稼働率 | 入居中物件数 / 管理物件数 × 100 | 管理物件 |
| 入居率 | 入居中戸数 / 総戸数 × 100 | 管理物件 |
| 家賃回収率 | 回収家賃 / 請求家賃 × 100 | 管理物件 |

### 4.5 業務フロー

#### 賃貸仲介フロー
```
顧客問合せ → 物件案内 → 申込受付 → 審査 → 契約 → 鍵渡し → 入居
```

#### 売買仲介フロー
```
物件査定 → 媒介契約 → 販売活動 → 購入申込 → 重説・契約 → 決済・引渡
```

#### 賃貸管理フロー
```
入居管理 → 家賃管理 → 修繕対応 → 退去管理 → 原状回復 → 精算
```

### 4.6 仕様書・ドキュメント管理

設計思想・要件定義・ルールがブレないようにバージョン管理付きで保存・参照できる機能。

| 機能 | 説明 |
|------|------|
| ドキュメント作成 | カテゴリ分類（設計書、要件定義、ルール、設計思想、仕様書、マニュアル） |
| バージョン管理 | 変更履歴をバージョン番号で管理、任意のバージョンに遡って参照可能 |
| 承認フロー | ドラフト → レビュー → 承認 → アーカイブの状態管理 |
| 変更理由記録 | 各バージョンに変更概要を記録し、なぜ変更されたかを追跡 |
| テナント分離 | テナントごとに独立したドキュメント体系 |

#### ドキュメントカテゴリ

| カテゴリ | 用途 |
|---------|------|
| design | 設計書（システム設計、画面設計、DB設計） |
| requirements | 要件定義書 |
| rules | 業務ルール、コーディング規約 |
| philosophy | 設計思想、アーキテクチャ方針 |
| specification | 機能仕様書 |
| manual | 操作マニュアル |

## 5. データベース設計 (ER図概要)

### コアテーブル

```sql
-- テナント（マルチテナント）
tenants (
  id, name, slug, domain, plan, is_active,
  settings, created_at, updated_at
)

-- 物件マスター
properties (
  id, tenant_id, name, address, property_type,
  structure_type, built_year, floor_area, rent_price,
  sale_price, status, owner_id, created_at, updated_at
)

-- 顧客マスター
customers (
  id, tenant_id, name, email, phone,
  customer_type, status, assigned_staff_id,
  created_at, updated_at
)

-- 取引先マスター
business_partners (
  id, tenant_id, name, partner_type, contact_person,
  phone, email, bank_info, created_at, updated_at
)

-- 社員マスター
employees (
  id, tenant_id, name, email, department_id,
  position, hire_date, role, license_info,
  status, created_at, updated_at
)

-- 部署マスター
departments (
  id, tenant_id, name, parent_id, manager_id,
  created_at, updated_at
)

-- 勘定科目
accounts (
  id, tenant_id, code, name, account_type,
  parent_id, tax_category, is_active, created_at
)

-- 仕訳
journal_entries (
  id, tenant_id, entry_date, description, status,
  created_by, approved_by, created_at
)

-- 仕訳明細
journal_entry_lines (
  id, journal_entry_id, account_id,
  debit_amount, credit_amount, description
)

-- 案件（業務フロー）
deals (
  id, tenant_id, deal_type, property_id,
  customer_id, assigned_staff_id, status, stage,
  expected_revenue, actual_revenue,
  started_at, closed_at, created_at, updated_at
)

-- KPI目標
kpi_targets (
  id, tenant_id, employee_id, department_id,
  period, kpi_type, target_value, actual_value,
  created_at, updated_at
)

-- ドキュメント（仕様書・設計書管理）
documents (
  id, tenant_id, title, category, status,
  current_version, created_by, approved_by,
  created_at, updated_at
)

-- ドキュメントバージョン
document_versions (
  id, document_id, version, content,
  change_summary, created_by, created_at
)
```

## 6. API設計

### 共通ヘッダー

全てのAPI（テナント管理・ヘルスチェック除く）にはマルチテナント識別用のヘッダーが必要:

```
X-Tenant-Id: {テナントID}
```

### エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| **テナント** | | |
| GET/POST | `/api/v1/tenants` | テナント一覧/登録 |
| GET/PUT | `/api/v1/tenants/{id}` | テナント詳細/更新 |
| **マスター** | | |
| GET/POST | `/api/v1/properties` | 物件一覧/登録 |
| GET/PUT/DELETE | `/api/v1/properties/{id}` | 物件詳細/更新/削除 |
| GET/POST | `/api/v1/customers` | 顧客一覧/登録 |
| GET/PUT/DELETE | `/api/v1/customers/{id}` | 顧客詳細/更新/削除 |
| GET/POST | `/api/v1/partners` | 取引先一覧/登録 |
| **社員** | | |
| GET/POST | `/api/v1/employees` | 社員一覧/登録 |
| GET/PUT | `/api/v1/employees/{id}` | 社員詳細/更新 |
| GET/POST | `/api/v1/departments` | 部署一覧/登録 |
| **会計** | | |
| GET/POST | `/api/v1/accounts` | 勘定科目一覧/登録 |
| GET/POST | `/api/v1/journal-entries` | 仕訳一覧/登録 |
| POST | `/api/v1/journal-entries/{id}/approve` | 仕訳承認 |
| GET | `/api/v1/reports/trial-balance` | 試算表 |
| **KPI** | | |
| GET/POST | `/api/v1/kpi/targets` | KPI目標一覧/登録 |
| GET | `/api/v1/kpi/dashboard` | KPIダッシュボード |
| **業務フロー** | | |
| GET/POST | `/api/v1/deals` | 案件一覧/登録 |
| PUT | `/api/v1/deals/{id}/stage` | ステージ更新 |
| **ドキュメント** | | |
| GET/POST | `/api/v1/documents` | ドキュメント一覧/登録 |
| GET/PUT/DELETE | `/api/v1/documents/{id}` | ドキュメント詳細/更新/削除 |
| POST | `/api/v1/documents/{id}/versions` | 新バージョン作成 |
| GET | `/api/v1/documents/{id}/versions` | バージョン一覧 |
| GET | `/api/v1/documents/{id}/versions/{ver}` | 特定バージョン取得 |
| POST | `/api/v1/documents/{id}/approve` | ドキュメント承認 |

## 7. 画面構成

```
/                           → ダッシュボード（KPIサマリー、通知）
/properties                 → 物件一覧
/properties/[id]            → 物件詳細
/properties/new             → 物件登録
/customers                  → 顧客一覧
/customers/[id]             → 顧客詳細
/partners                   → 取引先一覧
/employees                  → 社員一覧
/employees/[id]             → 社員詳細
/departments                → 部署管理
/accounting/accounts        → 勘定科目一覧
/accounting/journals        → 仕訳帳
/accounting/journals/new    → 仕訳入力
/accounting/trial-balance   → 試算表
/kpi                        → KPIダッシュボード
/kpi/targets                → KPI目標設定
/deals                      → 案件一覧（パイプライン）
/deals/[id]                 → 案件詳細
/documents                  → ドキュメント一覧
/documents/[id]             → ドキュメント詳細（バージョン履歴付き）
/documents/new              → ドキュメント作成
/settings                   → システム設定
/settings/tenant            → テナント設定
```

## 8. 今後の拡張予定

- 帳票出力（PDF）: 契約書、重要事項説明書
- メール連携: 顧客への自動通知
- 外部API連携: SUUMO、HOME'S等のポータル連携
- 電子契約: 電子署名との連携
- AI機能: 物件査定、顧客マッチング
- 監査ログ: 全操作の監査証跡記録
- マルチ言語対応: 英語対応
