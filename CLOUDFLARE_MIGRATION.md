# Cloudflare Pages 移行手順

Netlify 無料枠が帯域上限に達した場合の代替ホスティング。Cloudflare Pages は **無料で帯域無制限**。

所要時間：**約20分**。

---

## ステップ1：Cloudflareアカウント作成（5分）

1. https://dash.cloudflare.com/sign-up にアクセス
2. メールアドレスとパスワードで登録
3. メール認証を済ませる
4. ダッシュボードにログイン

---

## ステップ2：Pages プロジェクトを作成（5分）

1. 左サイドバー → **Workers & Pages** をクリック
2. **Create application** → **Pages** タブ → **Connect to Git** をクリック
3. GitHub アカウントを連携（OAuth で許可）
4. リポジトリ `rainybrainch/pediatric-cancer-support` を選択 → **Begin setup**
5. **Set up builds and deployments** 画面：
   - **Project name**: `aya-health-quest`（任意・後でURLになる）
   - **Production branch**: `main`
   - **Build command**: 空欄でOK（静的サイトなので）
   - **Build output directory**: `/`（リポジトリ直下）
6. **Save and Deploy** をクリック
7. 1〜2分でビルド完了 → `https://aya-health-quest.pages.dev` でアクセス可能

---

## ステップ3：環境変数 `GEMINI_API_KEY` を設定（3分）

1. プロジェクト画面 → **Settings** タブ
2. **Environment variables** セクション
3. **Add variable**：
   - Variable name: `GEMINI_API_KEY`
   - Value: Gemini APIキー（既に取得済みのものを再利用）
   - Environment: **Production**（必要なら Preview にも追加）
4. **Save**

---

## ステップ4：再デプロイ（1分）

環境変数を反映させるため再ビルドが必要：

1. **Deployments** タブ
2. 一番上のデプロイの右側 **「・・・」** メニュー
3. **Retry deployment** をクリック

---

## ステップ5：動作確認（2分）

1. `https://aya-health-quest.pages.dev/game.html` にアクセス
2. ログイン → ルナと話してみる
3. ルナが正常に応答すれば成功 ✓

---

## 補足

### カスタムドメインを使いたい場合

- プロジェクト → **Custom domains** → **Set up a custom domain**
- `aya-health-quest.netlify.app` のままにしたい場合は使えない（Netlifyの所有）
- 独自ドメインを取得済みの場合は CNAME 設定で接続可能

### Netlify はどうする？

- **そのまま放置でOK**（無料プランは 月初リセット）
- 6/1 に帯域がリセットされ自動再開
- Cloudflare に完全移行する場合は Netlify サイトを削除しても可

### Cloudflare Pages の制限

- **帯域: 無制限**
- **リクエスト: 無制限**
- **ビルド: 500回/月**（充分）
- **Functions（Workers）: 100,000リクエスト/日**（無料）
- **ビルド時間: 20分/回**

研究プロジェクト規模なら全て無料枠で収まります。

---

## 既存の Netlify 設定はそのまま残してある

`netlify.toml`、`netlify/functions/*.js`、`_redirects` はそのままです。
Netlify 復活後にどちらでもデプロイできます。

クライアント側のURLは `/api/gemini-coach` `/api/gemini-vision` で統一されており、
Cloudflare では `functions/api/*.js` がネイティブで応答、Netlify では `_redirects` で `/.netlify/functions/*` に転送されます。
