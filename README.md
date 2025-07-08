# GitJournal

GitHubアクティビティと連携する開発者向けの日報・ジャーナル管理アプリケーション

## 概要

GitJournalは、GitHub Discussionsを活用して日々の作業記録を管理するWebアプリケーションです。前日のGitHubアクティビティを自動的に収集し、構造化されたテンプレートで日報を作成・管理できます。

## 主な機能

- 🔄 **GitHubアクティビティの自動収集**: 前日のコミット、PR、Issue等のアクティビティを自動取得
- 📝 **構造化されたジャーナル**: カスタマイズ可能なテンプレートで日報を作成
- 💾 **GitHub Discussionsでの保存**: バージョン管理と永続性を確保
- ✏️ **リアルタイム編集**: Markdownサポートでセクション単位の編集が可能
- 🔐 **GitHub認証**: OAuth認証によるセキュアなアクセス

## 技術スタック

### フロントエンド (`/web`)
- **Framework**: Next.js 15.0.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **UI Components**: React 19

### バックエンド (`/api`)
- **Language**: Go
- **Platform**: Vercel Serverless Functions
- **Library**: github-nippou (GitHubアクティビティ収集)

## セットアップ

### 前提条件
- Node.js 18以上
- Go 1.19以上
- GitHubアカウント
- GitHub OAuth App（認証用）

### インストール手順

1. リポジトリをクローン
```bash
git clone https://github.com/NoritakaIkeda/GitJournal.git
cd GitJournal
```

2. 依存関係のインストール
```bash
cd web
npm install
```

3. 環境変数の設定
`.env.local`ファイルを作成し、以下の変数を設定:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
```

4. 開発サーバーの起動
```bash
npm run dev
```

アプリケーションは http://localhost:3000 でアクセス可能になります。

## 使い方

1. **ログイン**: GitHubアカウントでログイン
2. **日報作成**: 「Create New Journal」から新規日報を作成
3. **GitHubアクティビティの取得**: 前日のアクティビティが自動的に取得される
4. **編集**: 各セクションの編集ボタンから内容を編集
5. **保存**: 変更はGitHub Discussionsに自動保存される

## プロジェクト構成

```
GitJournal/
├── web/                    # Next.js フロントエンド
│   ├── src/
│   │   ├── app/           # App Router
│   │   │   ├── api/       # API routes
│   │   │   └── feature/   # 機能コンポーネント
│   │   └── lib/           # ユーティリティ
│   └── public/            # 静的アセット
├── api/                    # Go バックエンド
│   └── index.go           # メインハンドラー
└── README.md              # このファイル
```

## 開発

### ローカル開発
```bash
# フロントエンド開発
cd web
npm run dev

# ビルド
npm run build

# Linting
npm run lint
```

### API開発（Goバックエンド）
```bash
cd api
go mod download
vercel dev
```

## デプロイ

このプロジェクトはVercelでのデプロイに最適化されています。

1. Vercelにプロジェクトをインポート
2. 環境変数を設定
3. デプロイ実行

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## クレジット

このプロジェクトは以下のプロジェクトに影響を受けています：
- [@masutaka](https://github.com/masutaka)氏の[github-nippou](https://github.com/masutaka/github-nippou)
- [@MH4GF](https://github.com/MH4GF)氏の[github-nippou-web](https://github.com/MH4GF/github-nippou-web)

## 貢献

Issue報告やPull Requestは歓迎します。貢献する際は以下をご確認ください：

1. Issueを作成して問題や提案を共有
2. Forkしてfeatureブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチをPush (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## サポート

問題や質問がある場合は、[Issues](https://github.com/NoritakaIkeda/GitJournal/issues)で報告してください。