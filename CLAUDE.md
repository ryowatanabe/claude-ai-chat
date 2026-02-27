# 神託チャット - AI神様お告げチャットボット

## プロジェクト概要

エンターテイメント向けAIチャットボット。神様のお告げ風のキャラクターが占いや相談に答える。一般ユーザーが気軽に楽しめる日本語専用のWebアプリケーション。

- **ジャンル**: エンターテイメント（占い・相談）
- **言語**: 日本語のみ
- **認証**: 不要（匿名利用）
- **会話履歴**: セッション中のみ保持（DBへの永続化なし）

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js (App Router) |
| APIサーバー | Hono |
| ORM | Prisma |
| AIエージェント | Mastra |
| AIモデル | Claude (claude-sonnet-4-6) |
| デプロイ | Google Cloud Run |
| データベース | Cloud SQL (PostgreSQL) |
| 言語 | TypeScript |

---

## アーキテクチャ

```
[ブラウザ]
    ↓ HTTP / Streaming (SSE)
[Next.js App Router]
    ├── app/ (フロントエンド・UIレンダリング)
    └── app/api/ (Honoルートハンドラー)
            ↓
        [Mastra Agent]
            ↓
        [Claude API]
            ↓ (会話履歴はMastraのセッション管理で保持)
        [Prisma + Cloud SQL]
          ※ セッションメタデータのみ保存
```

### ポイント
- Next.js の `app/api/[[...route]]/route.ts` でHonoをマウントする
- チャットのストリーミングはServer-Sent Events (SSE) で実装する
- 会話履歴はサーバーサイドのメモリ（Mastraのセッション）で管理し、DBには保存しない
- PrismaはCloud SQLへの接続管理に使用（将来の機能拡張のための基盤）

---

## ディレクトリ構造

```
/
├── app/
│   ├── layout.tsx           # ルートレイアウト（神社風テーマ適用）
│   ├── page.tsx             # トップページ（チャット画面）
│   ├── globals.css          # グローバルスタイル
│   └── api/
│       └── [[...route]]/
│           └── route.ts     # Honoエントリーポイント
├── components/
│   ├── ChatWindow.tsx       # チャット画面全体
│   ├── MessageBubble.tsx    # メッセージ吹き出し
│   ├── OracleSpeech.tsx     # お告げテキスト（タイピング演出）
│   └── InputForm.tsx        # ユーザー入力フォーム
├── lib/
│   ├── mastra/
│   │   ├── index.ts         # Mastraインスタンス初期化
│   │   ├── agent.ts         # 神様エージェント定義
│   │   └── prompts.ts       # システムプロンプト
│   └── hono/
│       └── chat.ts          # チャットAPIルート
├── prisma/
│   └── schema.prisma        # スキーマ定義
├── public/
│   └── assets/              # 神社風の画像素材
├── .env.local               # 環境変数（ローカル）
├── Dockerfile               # Cloud Run用
└── CLAUDE.md
```

---

## AIエージェント設定（Mastra）

### エージェント定義 (`lib/mastra/agent.ts`)

- **エージェント名**: `oracle-agent`
- **モデル**: `claude-sonnet-4-6`
- **会話履歴**: Mastraの`memory`機能でセッション単位に管理
- **ストリーミング**: 有効（`streamText`を使用）

### システムプロンプト (`lib/mastra/prompts.ts`)

```
あなたは古来より神社に宿る神様です。
訪れる者の悩みや問いに、神秘的かつ温かみのある「お告げ」として答えてください。

【口調・話し方のルール】
- 一人称は「我」を使う
- 「〜じゃ」「〜であろう」「〜ぞ」など古風な言い回しを使う
- ただし難解すぎず、現代人にも意味が伝わる言葉を選ぶ
- 占いや相談には具体的なアドバイスを神秘的な表現で包んで伝える
- 冒頭に短い歓迎の言葉を添える（毎回同じにしない）
- 末尾に短い締めの言葉を添える

【禁止事項】
- 「AIです」「言語モデルです」など正体を明かすこと
- 暗い予言や不吉な断言をすること
- 政治・宗教・差別的な発言をすること
- 日本語以外で返答すること
```

---

## UIデザイン仕様

### テーマ: 神社風

| 要素 | 値 |
|---|---|
| 背景色 | 深い黒〜濃紺グラデーション (`#0a0a1a` → `#1a0a2e`) |
| メインカラー | 金色 (`#c9a84c`) |
| アクセントカラー | 朱色 (`#c0392b`) |
| テキスト色 | 淡い白 (`#f0e6d3`) |
| フォント | 游明朝 / Noto Serif JP |
| 背景装飾 | 鳥居・桜・星空などのSVGイラストまたは半透明オーバーレイ |

### お告げテキスト演出 (`OracleSpeech.tsx`)

- ストリーミングで受け取った文字を **1文字ずつ順に表示** する
- 表示間隔: `50ms` / 文字（句読点は `150ms` で間を置く）
- 表示中はカーソル点滅エフェクトを付ける
- 表示完了後に金色のラインを下部に出してフィニッシュ演出をする

### チャットUI

- **神様側**: 画面中央または上部に配置。吹き出しではなく巻物風のカード
- **ユーザー側**: 画面下部に右寄せの吹き出し
- **入力フォーム**: 下部固定。薄い金色のボーダー付きテキストエリア
- **送信ボタン**: 「祈る」と表記

---

## 実装ガイドライン

### Honoのマウント方法（Next.js App Router）

```typescript
// app/api/[[...route]]/route.ts
import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import chatRoute from '@/lib/hono/chat'

const app = new Hono().basePath('/api')
app.route('/chat', chatRoute)

export const GET = handle(app)
export const POST = handle(app)
```

### ストリーミングレスポンス

- Honoの`streamSSE`を使用してClaudeのストリーミングをクライアントに転送する
- フロントエンドは`EventSource`または`fetch`+`ReadableStream`でSSEを受信する

### エラーハンドリング

- Claude APIのエラー時は「只今、神様は別の御用で席を外しております。しばらくお待ちくださいませ。」と返す
- ネットワークエラー時はリトライUIを表示する

### コーディング規約

- TypeScript strict mode を有効にする
- コンポーネントはすべて`React.FC`型で定義する
- APIルートは必ずバリデーション（zod）を通す
- `any`型の使用は禁止
- Prismaクライアントはシングルトンパターンで管理する

---

## 環境変数

```env
# Claude API
ANTHROPIC_API_KEY=

# Database (Cloud SQL)
DATABASE_URL=

# Mastra
MASTRA_LOG_LEVEL=info
```

---

## デプロイメント（Google Cloud Run）

### Dockerfile方針

- ベースイメージ: `node:20-alpine`
- マルチステージビルドでイメージサイズを最小化
- ポート: `3000`
- `next start`で起動

### Cloud Runの設定

| 項目 | 値 |
|---|---|
| リージョン | asia-northeast1 (東京) |
| 最小インスタンス数 | 0（コスト最適化） |
| 最大インスタンス数 | 10 |
| メモリ | 512Mi |
| タイムアウト | 300秒（ストリーミング対応） |
| 認証 | 未認証アクセスを許可 |

### Cloud SQLの設定

- データベース: PostgreSQL 15
- 接続方法: Cloud SQL Connector（Unix Socket）
- Prismaの`datasource`に`socketPath`を設定する

---

## 開発コマンド

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev

# Prismaマイグレーション
npx prisma migrate dev

# Prismaクライアント生成
npx prisma generate

# ビルド
npm run build

# Dockerビルド（ローカル確認）
docker build -t oracle-chat .
docker run -p 3000:3000 oracle-chat
```
