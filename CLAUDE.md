# CLAUDE.md

このリポジトリは **Mintlify** で構築された Comdesk Lead のヘルプドキュメントサイトです。
記事の作成・編集を行う際は、**必ず本ファイルのルールに従ってください。**

## プロジェクト概要

- ドキュメントエンジン: **Mintlify**（設定は `docs.json`）
- 言語: 日本語（`docs.json` の `locale: "ja"`）
- ナビゲーション: `docs.json` の `navigation.tabs[].groups[].pages[]` で定義
- 記事ディレクトリ:
  - `guide/` … はじめてガイド（user / env / admin）
  - `features/basic/`, `features/advanced/` … 機能一覧（基本ガイド / 活用ガイド）
  - `troubleshoot/` … トラブルシューティング（error / support）
  - `hardware/` … ハードウェア（device / request）
  - `release/notes/`, `release/news/` … リリースノート・お知らせ
  - `plan/contract/` … 製品・プランについて
- 画像アセット: `.gitbook/assets/` にフラットに配置（命名は `<記事ID>_<連番>.png` などスラッグ付き）

## 記事作成・編集の必須ルール

### ファイル形式

1. **新規記事・編集記事は必ず `.mdx` 形式で作成する**（Mintlify コンポーネントを使うため）。
   - 既存の `.md` を本格的に編集する場合も `.mdx` に変換する。
2. **フロントマター**を必ず付ける:
   ```yaml
   ---
   title: "記事タイトル"
   description: "一覧やSEOに使われる1行の説明"
   ---
   ```
   - 公開前の下書きや一覧に出したくないページは `hidden: true` を付ける。

### Mintlify コンポーネントを使う

本文は素の Markdown だけで書かず、以下の Mintlify コンポーネントを適切に使う:

| 用途 | コンポーネント |
| --- | --- |
| 手順（順序あり） | `<Steps>` / `<Step title="...">` |
| 注記・補足 | `<Note>` |
| 警告・エラー注意 | `<Warning>` |
| 前提・お役立ち情報 | `<Info>` / `<Tip>` |
| 画像 | `<Frame caption="...">` + `<img>` |
| 折りたたみ（補足・詳細） | `<Accordion>` / `<AccordionGroup>` |
| リンクカード | `<Card>` / `<CardGroup>` |
| 複数言語のコード | `<CodeGroup>` |

- **引用ブロック（`>`）で注記を書かない。** 代わりに `<Note>` / `<Warning>` / `<Info>` を使う。
- 長い「補足」「詳細表」「エラー一覧」は `<Accordion>` に入れてページを整理する。

### 画像

- 画像は必ず `<Frame>` でラップし、**ルート絶対パス**で参照する:
  ```mdx
  <Frame caption="画像の説明">
    <img src="/.gitbook/assets/<ファイル名>.png" alt="代替テキスト" />
  </Frame>
  ```
- 相対パス（`../../.gitbook/assets/...`）は使わない（既存の旧 `.md` 記事の名残であり、新規では使わない）。
- 画像ファイルは `.gitbook/assets/` に置く。

### Markdown / MDX の記法上の注意

- **テーブルのセル内改行は `<br />`（自己閉じタグ）**を使う。`<br>` は MDX でエラーになる。
- 日本語見出しへのアンカーリンク（`#見出し名`）は**壊れやすいので避ける**。リンクではなく太字テキストでセクション名を参照する。
- JSX として解釈されるため、`{` `}` `<` `>` などはそのまま書くと崩れることがある。必要に応じてコード表記やエスケープを使う。

### ナビゲーション登録（重要）

- **新規ページは必ず `docs.json` の適切なグループの `pages` に登録する。**
  - パスは**拡張子なし**で書く（例: `"features/advanced/salesforce-integration"`）。Mintlify が `.md` / `.mdx` 両方を解決する。
- **ページを削除したら、`docs.json` から該当する参照行も必ず削除する。**
  - 参照が残っていると存在しないページを指し、ビルド／リンクが壊れる。
- 変更後は `docs.json` が**有効な JSON か必ず検証**する:
  ```bash
  py -3 -c "import json;json.load(open('docs.json',encoding='utf-8'));print('OK')"
  ```

## 作業環境・ツールの注意点

### PDF からの記事化

- **`pdftotext` は日本語本文を抽出できないことがある**（CID フォントで ToUnicode 情報が無い PDF。英数字・URL・表の一部のみ抽出され、日本語が空になる）。
- その場合は **PyMuPDF（`fitz`）でページを画像化し、画像を視覚的に読み取る**:
  ```bash
  py -3 -c "import fitz; doc=fitz.open('file.pdf'); [doc[i].get_pixmap(matrix=fitz.Matrix(2,2)).save(f'out_{i+1:02d}.png') for i in range(doc.page_count)]"
  ```
  - 小さな表は `matrix` を上げる、`clip` で該当領域を切り出すと読みやすい。
  - `MuPDF error: ... structure tree` の警告は無害（画像は正しく生成される）。

### Windows / シェル環境

- このマシンは Windows + Git Bash + Windows Python（`py -3`）。
- **Windows Python は Git Bash の `/tmp` パスを解決できない。** 一時ファイルは `/tmp` ではなく**リポジトリ内の相対パス**に置く。
- 画像生成・JSON 操作には Python（`py -3`、PyMuPDF 利用可）が使える。

## Git / プッシュ運用

- このリポジトリは **`main` ブランチに直接コミット**する運用（直近の履歴も `main` 直接）。
- プッシュが `non-fast-forward` で拒否されたら `git pull --rebase origin main` してから再プッシュする。
- **`_incoming/` はソース素材置き場でコミットしない**（PDF 等の元ファイル）。`git add` 時は対象ファイルを明示的に指定する。
- コミットメッセージ末尾に共著者表記を付ける:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
