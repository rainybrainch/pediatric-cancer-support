# ヴィタリア転生録 — 手動セットアップ手順

研究運用前に必要な3つの手動設定。所要時間 **約15分**。

---

## ① Netlify 環境変数 `GEMINI_API_KEY`（必須・5分）

### 1-A. Gemini API キーを発行

1. https://aistudio.google.com/app/apikey にアクセス
2. Googleアカウントでログイン
3. **「Create API key」** → **「Create API key in new project」** を選択
4. 表示されたキー（`AIzaSy...` で始まる文字列）を **コピー**

> 無料枠：60req/分・1日1500件（Gemini 1.5 Flash）。研究規模なら充分。

### 1-B. Netlify に登録

1. https://app.netlify.com/ → 該当サイト（aya-health-quest）を開く
2. **Site configuration** → **Environment variables**
3. **Add a variable**
   - Key: `GEMINI_API_KEY`
   - Values: コピーしたキーを貼付け
   - Scopes: All scopes（デフォルトのまま）
4. **Create variable** で保存

### 1-C. 再デプロイ

1. **Deploys** タブ
2. **Trigger deploy** → **Deploy site** をクリック
3. 約1〜2分でビルド完了

### 動作確認

- `https://aya-health-quest.netlify.app/game.html` にログイン
- ルナのカードをタップ → メッセージ送信
- ルナが返答すれば成功 ✓

---

## ② Firestore セキュリティルール（必須・3分）

### 2-A. ルール公開

1. https://console.firebase.google.com/project/shounigann/firestore/rules
2. リポジトリの `firestore.rules` の中身を全コピペで上書き
3. 右上の **公開** ボタン
4. 公開完了通知が出れば成功

### 動作確認

- 一般ユーザーでログイン → クエスト記録ができる
- 別アカウントで他人のデータ読み取り不可（権限エラー）

---

## ③ 研究者アカウント登録（必須・5分）

管理者ダッシュボード `admin.html` を使うために必要。

### 3-A. Firebase Authentication で登録

1. Firebase Console → **Authentication** → **Users** タブ
2. **Add user**
   - Email: `fukuisho0603@gmail.com`（または研究者本人のメール）
   - Password: 任意の強パスワード
3. **Add user** で登録

### 3-B. admins コレクションに追加

1. Firebase Console → **Firestore Database**
2. **+コレクションを開始**
3. コレクションID: `admins`
4. 最初のドキュメント:
   - ドキュメントID: `fukuisho0603@gmail.com`（メアドそのまま）
   - フィールド: なし（空ドキュメントでOK）
5. **保存**

### 動作確認

- `https://aya-health-quest.netlify.app/admin.html` にアクセス
- 上記メアドでログイン
- 管理者ダッシュボードが表示される ✓
- 全データ・コーチ会話・GROWヒートマップが見える

### 追加の研究者を登録する場合

上記の3-A・3-Bを繰り返すだけ。

---

## 補足

### Netlify環境変数を変更したら必ず再デプロイ

環境変数の追加・変更は自動反映されない。**Trigger deploy** で再ビルド必須。

### Firestore Rules を試す（任意）

Firebase Console の **ルール** タブには **シミュレーター** がある。匿名／認証ユーザー／管理者で読み書きをシミュレートできる。

### PWA アイコン

`icon.svg` を使用中（軽量・スケーラブル）。よりリッチにしたい場合は 192x192・512x512 のPNGを作成して `icon-192.png` `icon-512.png` として直下に配置し、`manifest.json` を元の参照に戻す。
