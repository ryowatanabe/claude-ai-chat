# 神託チャット - 実装TODO

## Phase 1: プロジェクト初期設定

- [x] Next.js プロジェクト作成
  - `npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir=false --import-alias="@/*"`
- [x] 追加パッケージのインストール
  - `hono` `@hono/node-server`
  - `@mastra/core` `@ai-sdk/anthropic`
  - `@prisma/client` `prisma`
  - `zod`
  - Noto Serif JP: Next.js組み込みのGoogle Fonts機能を使用
- [x] `tsconfig.json` で strict mode が有効になっていることを確認
- [x] `.env.local` を作成し、必要な環境変数のキーを記載（値は空でOK）
  ```
  ANTHROPIC_API_KEY=
  DATABASE_URL=
  MASTRA_LOG_LEVEL=info
  ```
- [x] `.gitignore` に `.env.local` が含まれていることを確認（`.env*` で対応済み）

---

## Phase 2: データベース・Prisma設定

- [x] Prisma 初期化
  - `npx prisma init` 実行済み（Prisma 7: 設定は `prisma.config.ts` に集約）
- [x] `prisma/schema.prisma` にスキーマを定義
  - `Session` モデル（id, createdAt, updatedAt）
- [x] Prismaクライアントのシングルトンを実装
  - `lib/prisma.ts` を作成し、`PrismaClient` をシングルトンで管理
- [ ] ローカル開発用DBを用意し、マイグレーションを実行
  - `DATABASE_URL` を設定後に `npx prisma migrate dev --name init` を実行すること

---

## Phase 3: AIエージェント実装（Mastra）

- [ ] システムプロンプトを定義
  - `lib/mastra/prompts.ts` を作成
  - 神様キャラクターのプロンプトを文字列定数としてエクスポート
- [ ] Mastraエージェントを定義
  - `lib/mastra/agent.ts` を作成
  - `oracle-agent` を定義（モデル: `claude-sonnet-4-6`）
  - Mastraの `memory` でセッション単位の会話履歴管理を設定
  - `streamText` でストリーミングを有効化
- [ ] Mastraインスタンスを初期化
  - `lib/mastra/index.ts` を作成
  - エージェントを登録してエクスポート

---

## Phase 4: APIサーバー実装（Hono）

- [ ] チャットAPIルートを実装
  - `lib/hono/chat.ts` を作成
  - `POST /chat` エンドポイントを定義
  - Zodでリクエストボディをバリデーション（`message: string`, `sessionId: string`）
  - Mastraエージェントを呼び出し、SSEでストリーミングレスポンスを返す
  - エラー時は神様キャラのエラーメッセージを返す
- [ ] Honoをマウントするエントリーポイントを作成
  - `app/api/[[...route]]/route.ts` を作成
  - Honoアプリを `/api` にマウント
  - `GET` / `POST` ハンドラーをエクスポート

---

## Phase 5: フロントエンド実装

### スタイル・レイアウト

- [ ] グローバルスタイルを設定
  - `app/globals.css` に神社風カラーパレットをCSS変数として定義
  - 背景グラデーション（`#0a0a1a` → `#1a0a2e`）
  - Noto Serif JP フォントの読み込み設定
- [ ] ルートレイアウトを実装
  - `app/layout.tsx` でフォントとテーマを適用
  - メタデータ（title, description）を日本語で設定

### コンポーネント

- [ ] `components/OracleSpeech.tsx` を実装（最優先）
  - propsでストリーミングテキストを受け取る
  - 1文字ずつ表示（通常50ms、句読点150ms）
  - カーソル点滅エフェクト（CSS animation）
  - 表示完了後に金色の区切りラインを表示

- [ ] `components/MessageBubble.tsx` を実装
  - ユーザーメッセージ用の右寄せ吹き出しコンポーネント
  - 神様メッセージは `OracleSpeech` を使用するためここでは扱わない

- [ ] `components/InputForm.tsx` を実装
  - テキストエリア（金色ボーダー）
  - 「祈る」送信ボタン
  - ストリーミング中は入力・送信を無効化
  - Enterキーで送信（Shift+Enterで改行）

- [ ] `components/ChatWindow.tsx` を実装
  - セッションIDの生成・管理（`crypto.randomUUID()`）
  - メッセージ一覧の状態管理
  - SSE受信処理（`fetch` + `ReadableStream`）
  - スクロール制御（新メッセージで自動スクロール）
  - ネットワークエラー時のリトライUI表示

### ページ

- [ ] `app/page.tsx` を実装
  - `ChatWindow` を配置
  - 背景装飾（SVGまたは半透明オーバーレイ）を適用

---

## Phase 6: 統合・動作確認

- [ ] ローカルで開発サーバーを起動して動作確認
  - `npm run dev`
- [ ] チャットの基本動作確認（メッセージ送受信）
- [ ] ストリーミング・タイピング演出の確認
- [ ] 会話履歴の継続性確認（同一セッション内で文脈が保たれるか）
- [ ] エラーハンドリングの確認（APIキー未設定時など）
- [ ] レスポンシブ対応の確認（スマートフォン表示）

---

## Phase 7: デプロイ準備

- [ ] `Dockerfile` を作成
  - マルチステージビルド（builder / runner）
  - ベースイメージ: `node:20-alpine`
  - ポート `3000` で `next start`
- [ ] Dockerイメージのローカルビルド・動作確認
  - `docker build -t oracle-chat .`
  - `docker run -p 3000:3000 oracle-chat`

### Google Cloud 設定

- [ ] Google Cloud プロジェクトを作成（または既存を利用）
- [ ] 必要なAPIを有効化
  - Cloud Run API
  - Cloud SQL Admin API
  - Artifact Registry API
- [ ] Cloud SQL インスタンスを作成
  - PostgreSQL 15、リージョン: `asia-northeast1`
  - DBとユーザーを作成
- [ ] Artifact Registry にリポジトリを作成してDockerイメージをプッシュ
- [ ] Cloud Run サービスをデプロイ
  - リージョン: `asia-northeast1`
  - 最小インスタンス: 0、最大: 10
  - メモリ: 512Mi、タイムアウト: 300秒
  - 未認証アクセスを許可
- [ ] Cloud Run の環境変数・シークレットを設定
  - `ANTHROPIC_API_KEY`（Secret Manager経由）
  - `DATABASE_URL`（Cloud SQL Connectorのソケットパス）
- [ ] 本番環境での動作確認
