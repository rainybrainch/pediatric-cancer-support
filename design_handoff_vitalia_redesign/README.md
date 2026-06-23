# Handoff: ヴィタリア転生録 — リサーチHP & ゲームUI モダン化

研究プロジェクト「小児がん経験者 健康行動継続支援研究」のフロントエンド全体を、現代的なガラスモーフィズム / 異世界転生RPGトーンでブラッシュアップしたデザインの引き継ぎパッケージです。

---

## About the Design Files

このフォルダに含まれる `index.html` / `game.html` / `settings.html` は **HTMLで作成されたデザインリファレンス（プロトタイプ）** です。プロダクションコードとしてそのままコピーするためのものではありません。

ターゲットコードベース（既存の Cloudflare Workers / Netlify Functions + プレーンHTML/JS構成）の規約に沿って、これらのデザインを**そのまま既存ファイルに統合する形**で実装してください（現プロジェクトは React/Vue 等のフレームワークを採用していないため、純粋なHTML/CSS/JSとして統合可能です）。

## Fidelity

**High-fidelity (hifi)**：色・タイポ・スペーシング・インタラクション・アニメーションまで仕上げ済みのモックアップです。CSS 値・アニメーション・トランジションは可能な限り正確に反映してください。

---

## デザインシステム（共通）

### ファイル間の差別化方針
- **`index.html`（研究HP）**：知的・誠実なトーン。**インディゴ(#1f4dc4) → バイオレット(#6a4ae0)** のグラデーション。アンビエントなパステル背景（青紫＋ベージュ）にソフトグラスサーフェスを乗せる。
- **`game.html`（ゲーム）**：異世界転生RPGの没入感。**シアン(#5fd0e8) ＋ ゴールド(#f0d48a)** のペア。明るめの水色ナイト背景にオーロラリボン・流れ星・浮遊する撃破モンスターのシルエット。
- **`settings.html`（設定）**：game.html と同系。深紺ガラスのセクションカード。

### カラートークン

| 用途 | HP（index.html） | ゲーム（game.html / settings.html） |
|---|---|---|
| 背景ベース | `linear-gradient(180deg, #eff3ff, #fafcff, #fff8ee)` | `linear-gradient(180deg, #0c2240, #103458, #1a4870)` |
| アクセント1 | `#1f4dc4`（インディゴ） | `#5fd0e8`（シアン） |
| アクセント2 | `#6a4ae0`（バイオレット） | `#f0d48a`（ゴールド） |
| テキスト主 | `#0e1838` | `#e4f0fc` / `#d4e4f4` |
| テキスト副 | `#5b6a96` | `#88a4c8` |
| サクセス | `#1a7c48` | `#4ec98a` / `#1f7d4d` |
| エラー | `#a83030` | `#e05c5c` / `#b53a3a` |
| カイト（運動） | — | `#e08a3c` |
| セラ（栄養） | — | `#4ec98a` |
| ルナ（コーチ） | — | `#9c72e0` |

### サーフェス（カード）共通パターン

**HP のソフトグラスカード（白系）**:
```css
background: rgba(255,255,255,.78);
backdrop-filter: blur(14px);
border: 1px solid rgba(80,100,160,.14);
border-radius: 20px;
box-shadow:
  inset 0 1px 0 rgba(255,255,255,.8),
  0 1px 3px rgba(20,40,100,.04),
  0 12px 28px -10px rgba(20,40,100,.14);
```

**ゲームのクリスタルガラスカード（深紺系）**:
```css
background:
  radial-gradient(140% 70% at 50% 0%, rgba(95,208,232,.10), transparent 70%),
  linear-gradient(160deg, rgba(20,40,70,.75), rgba(10,20,44,.88));
border: 1.5px solid rgba(95,208,232,.22);
border-radius: 18px;
backdrop-filter: blur(14px);
box-shadow:
  inset 0 1px 0 rgba(180,220,250,.12),
  inset 0 0 0 1px rgba(95,208,232,.06),
  0 14px 32px -12px rgba(0,12,30,.55);
```

### タイポグラフィ
- **フォント**: `Noto Serif JP`（見出し）+ `Zen Kaku Gothic New`（本文）
- **タイトルグラデ（HP）**: `linear-gradient(135deg, #1f4dc4 0%, #6a4ae0 100%)` を `background-clip: text` で透過
- **タイトルグラデ（ゲーム）**: `linear-gradient(135deg, #f0d48a, #5fd0e8, #f0d48a)` ＋ `background-size: 200% auto` で**シマーアニメーション**（8s ease-in-out infinite）
- **見出しサイズ**: `clamp(1.4rem, 4vw, 2.4rem)` をベースに、各セクションで調整

### スペーシング
- セクションパディング（PC）: 100px 0
- セクションパディング（タブレット〜）: 64px 0
- セクションパディング（モバイル）: 52px 0
- カード内パディング: 22-32px
- カード間ギャップ: 14-24px

---

## 改修ファイル

### 1. `index.html`（リサーチHP）

#### 主要改善ポイント
- **背景アンビエント**: 3層のラジアルグラデ（青／紫／ベージュ）＋ドットグリッド（28×28px, 7% 透明度）
- **ナビゲーション**: `rgba(255,255,255,.78) + backdrop-filter: blur(22px)` のソフトグラス
- **カード類**（試練・キャラ・統計・研究デザイン・FAQ・強み）: 統一したソフトグラスパターン
- **ボタン階層**: `btn-primary`（インディゴグラデ）/ `btn-ghost`（ガラス）/ `btn-study-cta`（緑グラデ）
- **暗色セクション**（ギャップ・七大罪）: 既存の世界観維持しつつ、影と内側ハイライトを洗練

#### レスポンシブ
- `min-width: 901px and max-width: 1100px`（iPad / 中型タブレット）の新ブレイクポイント
- `max-width: 900px`：ナビ調整・モバイルメニュー位置調整・Hero縦並び・3列→1列
- `max-width: 600px`：Hero ボタン縦積み・Hero stats 縦並び・キャラ2列・FAQ整理
- `max-width: 400px`：キャラ1列

#### 主要セクション
1. ヒーロー（バッジ・タイトル・コピー・CTA・スマホモック）
2. アプリスクリーンショット展示（5機種・横スクロール）
3. プロローグ（研究背景）
4. 研究概要（3枚統計カード・3枚研究デザインカード・参加フロー3ステップ・倫理ボックス）
5. ギャップセクション（暗色・問題提起）→ 集約矢印 →「本研究の3つの解で応える」
6. 研究の強み（4枚カード）
7. 3つの試練（運動・栄養・コーチング）
8. キャラクター（4キャラ・表情スプライト・引用）
9. 七大罪セクション（暗色・モンスター7体＋ラスボス候補）
10. なぜルナと話すと続くか（5+1枚カード）
11. GROWステップ（4ステップ）
12. 研究者メッセージ
13. FAQ（アコーディオン）
14. CTA

---

### 2. `game.html`（ゲーム ホーム＋ログイン）

#### 主要改善ポイント

##### A. ログイン画面のオーロラエフェクト
背景の上に `<div class="aurora-stage">` を配置し、以下のレイヤーを重畳：
- **オーロラリボン 5本**：シアン×バイオレット×緑×ゴールドの帯が異速度（18-30s）で漂う
- **きらめき星 23個**：通常 ＋ 大きな star。`vg-star-twinkle 3s` で点滅
- **流れ星 7本**：`vg-shooting 18s` で間隔2.5秒ごとに連続落下、200px の発光する尾を引く
- **浮遊するきらめき粒子 6個**：`vg-sparkle-rise 15s` で下から上へ
- **倒した敵キャラのシルエット**：`localStorage.vitalia_defeated_foes` から読み込み、cyan/violet グローで霊体感を演出（ホーム画面でのみ表示、ログイン画面では非表示）

##### B. ログインフォームのアニメーション
- `.lp-title` シマー（金→シアン→金 8s ループ）
- `.lp-char` 中央ルナの浮遊（4.5s）＋ ✦スパークル（位置違い時間差）
- `.lp-ch`（3キャラ立ち絵）時間差ふんわり浮遊（5s, 0.1/0.4/0.7s ディレイ）
- セクション順次フェードアップ（0.05s刻みのディレイ）
- 背景オーロラの18秒ドリフト

##### C. 認証フロー拡張
**ユーザー名でのログイン対応**：
- ログイン欄ラベル：「メールアドレス または ユーザー名」
- 入力に `@.` を含むなら**メール**として認証
- 含まないなら**ユーザー名**として Firestore の `usernames/{username}` コレクションから `emailForAuth` を引いて認証

**新規登録 メール任意**：
- ユーザー名（必須・半角英数3-20文字）
- メールアドレス（**任意**・パスワードリセット用）
- パスワード（6文字以上）
- メール省略時：`{username}@vitalia.local` の擬似メールを内部生成して Firebase Auth を通す
- Firestore に保存するフィールド：`{email, emailForAuth, hasRealEmail, uid, username, created_at}`

##### D. プレイヤーカード強化
- 76px の大きなアバター＋シアンの脈動オーラ（`vg-avatar-pulse 3.5s`）＋4.5s 浮遊
- Lvバッジ：シアン×ゴールドの結晶風＋光沢スイープ（`vg-lv-shimmer 4s`）
- 12px の太い XPバー（シアン→ゴールドグラデ＋シマー光沢）
- スタッツ数字（連続週・実績・記録週）: 1.85rem のゴールドグラデ文字
- 上部バー：金→シアンの輝くプログレスバー

##### E. メイン画面のセクション構成（上から）
1. **ヘッダー**（ロゴ＋マイページ・設定・退場）
2. **プレイヤーカード**（アバター・Lv・XP・スタッツ）
3. **QOLトレンドカード**（今週の調子）
4. **3キャラ立ち絵バナー**（カイト=運動 / セラ=栄養 / ルナ=AIコーチ）
5. **3大記録ボタン**（運動・食事・QOL ※「ルナと話す」は hc-luna-card に統合済み・display:none）
6. **1行サマリー**（今週進捗・12週進捗バー）
7. **冒険プログレス / 今日のミッション**（任意表示）
8. **フッターボタン行**（全メニュー・詳細表示・相談窓口）
9. **下部メニューバー**（ホーム・運動・栄養・冒険・仲間・マイ）
10. **ジャンプFAB**（右下フローティング・44pxシアン丸ボタン・タップで展開）

##### F. body 状態切替
- `body:not(.app-active)`：ログイン画面（メニューバー・FAB非表示・オーロラ全開）
- `body.app-active`：ホーム画面（メニューバー表示・オーロラ35%透明度・撃破モンスター25%透明度）

---

### 3. `settings.html`（設定画面）

#### 新規追加：アカウント情報セクション
ページ上部に `<div class="section" id="account-section">` を追加：
- **ユーザー名**: Firestore の `usernames` を `where('uid','==',user.uid)` で検索して取得
- **冒険者ID**: Firebase UID の先頭16文字
- **メールアドレス**:
  - 実メール登録済み（`hasRealEmail: true`）: 緑文字で表示
  - 未設定（`@vitalia.local` 擬似メール）: オレンジ「未設定」＋登録フォーム展開

#### メール登録フォーム
- 新メールアドレス入力
- 現パスワード入力（本人確認）
- フロー：
  1. `EmailAuthProvider.credential(currentEmail, password)` で credential 生成
  2. `reauthenticateWithCredential` で再認証
  3. `updateEmail(user, newEmail)` で Firebase Auth 更新
  4. Firestore `usernames/{username}` を `{email, emailForAuth, hasRealEmail: true, updated_at}` で更新
  5. UI 更新（フォーム消失・緑文字メール表示）

---

## アニメーション仕様

### 共通キーフレーム

```css
@keyframes vg-fade-up{
  from{ opacity: 0; transform: translateY(24px); }
  to{ opacity: 1; transform: translateY(0); }
}
@keyframes vg-float{
  0%, 100%{ transform: translateY(0) rotate(0deg); }
  50%{ transform: translateY(-12px) rotate(0.5deg); }
}
@keyframes vg-shooting{
  0%       { opacity: 0; transform: translate(0, 0) rotate(18deg); }
  4%       { opacity: 1; }
  18%      { opacity: 1; transform: translate(-500px, 150px) rotate(18deg); }
  20%, 100%{ opacity: 0; transform: translate(-500px, 150px) rotate(18deg); }
}
@keyframes vg-star-twinkle{
  0%, 100%{ opacity: .3; transform: scale(0.9); }
  50%    { opacity: 1;  transform: scale(1.15); }
}
@keyframes vg-sparkle-rise{
  0%   { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(.6); }
  10%  { opacity: 1; }
  100% { opacity: 0; transform: translate(20px, -110vh) rotate(360deg) scale(1.2); }
}
```

### アクセシビリティ
- `@media (prefers-reduced-motion: reduce)` でアニメーションをすべて停止
- フォーカスリング：`outline: 2px solid rgba(95,208,232,.6); outline-offset: 3px;`

---

## 撃破モンスター連動の仕組み

ゲーム内で敵キャラを倒したら、ログイン後のホーム画面背景にシルエットが浮遊するシステム：

### 撃破リストの保存形式
```js
localStorage.setItem('vitalia_defeated_foes',
  JSON.stringify([
    './image/A1-Photoroom.png',  // スロウス
    './image/A4-Photoroom.png',  // 強欲
    // ...最大7体
  ])
);
```

### 表示ロジック（既に game.html 末尾に実装済み）
- DOMContentLoaded で localStorage 読込
- 空ならデモで A1・A4 を表示
- 7スロット（f1〜f7）に順次配置、24s 周期で浮遊（時差つき）
- グレースケール40% + シアン/紫グロー + ✦撃破マーク

### 拡張：実装時に追加するもの
- 戦闘 / クエスト完了画面で `vitaliaDefeatFoe(idx)` グローバル関数を呼び出すフック
- Firestore 連携（複数デバイス間で撃破リストを同期）

---

## 残作業（次のステップ）

1. **quest.html / nutrition.html** に水色×ゴールドの異世界トーンを展開
2. **adventure.html / party.html / collection.html / shop.html** など他ゲームページのトーン統一
3. **メイン画面の続き改善**:
   - QOLトレンドカードの強化
   - 3キャラ立ち絵バナーのキャラ感アップ
   - 1行サマリーの視覚化
4. **撃破モンスター連動**:
   - quest 完了 / 週次目標達成時に `vitaliaDefeatFoe()` をフック
   - Firestore 同期実装
5. **ユーザー名→メール解決の Firestore Security Rules 整備**

---

## 既存ファイル構成（プロジェクトルート）

```
小児がん/
├── index.html        ← 改修済み（リサーチHP）
├── game.html         ← 改修済み（ゲーム ホーム＋ログイン）
├── settings.html     ← 改修済み（アカウント情報セクション追加）
├── quest.html        ← 未改修（運動クエスト）
├── nutrition.html    ← 未改修（栄養クエスト）
├── adventure.html    ← 未改修（冒険画面）
├── party.html, collection.html, shop.html, ... など多数
├── app-safety.js     ← MutationObserver の null 対策パッチ済み
├── gamification.js
├── quest-enhance.js
├── image/            ← キャラ画像・モンスター画像
├── data/
├── netlify/functions/
└── ...
```

## Files in this Handoff

このフォルダには改修済みの3ファイルが含まれます：

- `index.html` — リサーチHP
- `game.html` — ゲームのホーム＋ログイン
- `settings.html` — 設定（アカウント情報セクション付き）
- `app-safety.js` — MutationObserver 初期化タイミングのパッチ

開発者は対象コードベースの該当ファイルを **これらの内容で置き換える**、または差分をマージしてください。CSS / HTML / インライン JS / `<script type="module">` を含む完全なファイルです。
