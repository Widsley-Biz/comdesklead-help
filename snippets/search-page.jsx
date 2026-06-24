export const SearchPage = ({ domain, apiKey, pageSize = 50, perPage = 5 }) => {
  // TODO(owner): domain と apiKey を Mintlify ダッシュボードの値に置き換えてください。
  //   domain  : your-domain.mintlify.app の identifier（app.mintlify.com の URL 末尾）
  //   apiKey  : "mint_dsc_" で始まる assistant key（public なのでクライアントに置いて安全）
  //   pageSize: API から取得する候補件数（1〜50、既定 50）。表示は関連度フィルタ後 perPage 件ずつ。
  // 注意: Search API はスコアを返さず scoreThreshold も無視するため、常に上位 pageSize 件を返す。
  //   そのままだと無関係な語でも結果が出るので、下記でキーワード一致による関連度フィルタを行う。
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | empty | error
  const [submitted, setSubmitted] = useState("");
  const [page, setPage] = useState(0); // クライアント側ページネーション
  const [usingMock, setUsingMock] = useState(false);

  const size = Math.min(50, Math.max(1, pageSize || 50));

  // ローカル確認用サンプル（リポジトリの全ページ frontmatter から自動生成・本物の API レスポンスと同じ形）
  const MOCK = [
    { path: "/file-3", content: "統一されたエラーエンベロープ、すべてのエラーコード、X-Request-ID を用いたデバッグ方法。", metadata: { title: "エラー" } },
    { path: "/ivr", content: "IVR 通話フローをプログラムからトリガーします。", metadata: { title: "IVR" } },
    { path: "/webhook", content: "リアルタイムイベントの購読、署名検証、リプレイ対策、再送スケジュールを理解します。", metadata: { title: "Webhook" } },
    { path: "/intro", content: "Comdesk Lead 上に連携を構築 — 発信、通話履歴の同期、顧客管理、リアルタイム Webhook の受信を、自社システムから実現します。", metadata: { title: "はじめに" } },
    { path: "/quickstart", content: "ゼロから約 5 分で、最初の認証付き Comdesk Open API リクエストを実行します。", metadata: { title: "クイックスタート" } },
    { path: "/customer", content: "顧客の登録・一括インポート・一覧・取得・更新を行い、external_id で相互参照します。", metadata: { title: "顧客" } },
    { path: "/report", content: "BI ツール向けに集計済みの通話統計を取得 — サマリー、通話別、ユーザー別レポート。", metadata: { title: "レポート" } },
    { path: "/authentication", content: "API キーによる認証、スコープ、キーの種類、IP 許可リストを理解します。", metadata: { title: "認証" } },
    { path: "/call", content: "発信の実行と、AI 文字起こし・要約・音声分析を含む通話履歴の取得。", metadata: { title: "通話" } },
    { path: "/webhook-api", content: "Webhook サブスクリプションの登録・一覧・更新・削除・テスト。", metadata: { title: "Webhook API" } },
    { path: "/index", content: "Comdesk Lead のご利用ガイドへようこそ", metadata: { title: "Comdesk ヘルプ" } },
    { path: "/rate", content: "テナント単位のレート制限、日次・月次容量、429 レスポンス、正しいバックオフ方法。", metadata: { title: "レート制限と容量" } },
    { path: "/guide/index", content: "Comdesk Lead のログインから基本操作、推奨環境、管理者向けの設定まで、初めての方に必要な情報をまとめています。", metadata: { title: "はじめてガイド" } },
    { path: "/guide/admin/14779799780249", content: "Comdesk Lead MobileClientアプリのインストールは、Play ストアからのインストールが可能です。", metadata: { title: "端末に任意のアプリをインストールする" } },
    { path: "/guide/admin/49187200013337", content: "1. 画面左側のTeamsアイコンを選択し、活動履歴を選択してください。![](../../.gitbook/assets/49187200013337_0.png)", metadata: { title: "活動履歴で通話履歴を確認する" } },
    { path: "/guide/admin/16132024933529", content: "リスト情報は、以下のような構成で保管されます。", metadata: { title: "（完了させる）1/3 ワークグループとは" } },
    { path: "/guide/admin/48874434650521", content: "同一プロジェクトに対して複数ユーザーが一斉に架電する場合は、配布コールモードをご利用ください。", metadata: { title: "同じプロジェクトに複数人で同時に架電したい（配布コールモード）" } },
    { path: "/guide/admin/13357181138201", content: "弊社より貸与しているAndroid携帯端末に入っている電話帳アプリとComdesk Leadは、連動しておりません。", metadata: { title: "携帯電話内にある電話帳とComdesk Leadは連動していますか" } },
    { path: "/guide/admin/13356730125337", content: "CallServerアプリの接続が切れてしまう原因として考えられるのは以下の通りです。", metadata: { title: "CallServerアプリとの接続が切れてしまう" } },
    { path: "/guide/admin/21610979714073", content: "活動履歴画面での編集についてご説明します。", metadata: { title: "活動履歴の編集" } },
    { path: "/guide/admin/12758876873241", content: "下記３ステップで着信に関する各種設定が簡単にできます。", metadata: { title: "PBX Manager 着信設定をする" } },
    { path: "/guide/admin/12754662466073", content: "1. PBX Managerを開き「ユーザー管理」画面を開きます。", metadata: { title: "IP回線 ユーザー名・内線番号の編集方法" } },
    { path: "/guide/admin/20057981460761", content: "ユーザー種別：「システム管理者」「マネージャー」", metadata: { title: "ユーザー管理" } },
    { path: "/guide/admin/12814709914777", content: "CallServerのアンインストール方法についてご説明いたします。", metadata: { title: "CallServerのアンインストール" } },
    { path: "/guide/admin/12907898836249", content: "**リスト項目の種類**", metadata: { title: "リスト項目設定で標準項目の表示を設定する" } },
    { path: "/guide/admin/51300937666457", content: "ホーム＞「外部アプリケーション」をクイック検索＞設定＞", metadata: { title: "SF連携マニュアル（SF側の設定）" } },
    { path: "/guide/admin/17383778302105", content: "ライセンス追加時のユーザーに対する設定内容をご説明します。", metadata: { title: "ライセンス追加時の設定内容" } },
    { path: "/guide/admin/49788079724185", content: "この記事では、通常コール画面上の顧客リストが、どのような表示順になっているかをご説明します。", metadata: { title: "通常コール画面で表示される顧客リストの表示順" } },
    { path: "/guide/admin/12777882592153", content: "CallServerのインストール方法についてご説明いたします。", metadata: { title: "CallServerのインストール" } },
    { path: "/guide/admin/38163997751705", content: "電話番号に対しての着信において、設定が必要になります。", metadata: { title: "PBX着信設定の概要" } },
    { path: "/guide/admin/14998470295577", content: "Comdesk Leadではなく、携帯端末にプリインストールされている電話アプリで架電した場合の、コール数、レポートの説明をいたします。", metadata: { title: "（完了させる）1/3 携帯端末の電話アプリで架電した際のコール数とレポート" } },
    { path: "/guide/admin/14772528016537", content: "架電禁止リストの登録解除方法を説明します。", metadata: { title: "（完了させる）1/3 禁止リストを解除する" } },
    { path: "/guide/admin/14780248732825", content: "マスターデータ管理の活用方法をご案内いたします。", metadata: { title: "（techから禁止番号に関する仕様待ち）マスターデータ管理でできること（まとめ）" } },
    { path: "/guide/admin/32552560954649", content: "0人がフォロー中", metadata: { title: "リストのインポートができない（更新用）" } },
    { path: "/guide/admin/51300972471961", content: "SF連携マニュアル（Comdesk Lead側の設定）", metadata: { title: "SF連携マニュアル（Comdesk Lead側の設定）" } },
    { path: "/guide/admin/12736179273497", content: "各ワークグループ毎に表示させたいリスト項目や応対者、ステータスを変えることができます。", metadata: { title: "ワークグループ作成" } },
    { path: "/guide/admin/13896301861017", content: "ー関連記事ー", metadata: { title: "配布状況の確認" } },
    { path: "/guide/admin/12772717065753", content: "レポート機能でユーザーの架電結果の確認、分析ができます。", metadata: { title: "レポートを閲覧する" } },
    { path: "/guide/admin/12738156781721", content: "リスト項目には2種類あります。", metadata: { title: "リスト項目設定でカスタム項目を作成する" } },
    { path: "/guide/admin/48875330254617", content: "見込み顧客を「Mybox」に登録することで、ご自身しかそのリストに架電できなくなる機能です。他のユーザーには、そのリストが表示されなくなると同時に、架電を行おうとしても架電できなく", metadata: { title: "見込み顧客をMyboxに登録する" } },
    { path: "/guide/admin/12741114939545", content: "目次", metadata: { title: "ワークグループ設定をする" } },
    { path: "/guide/admin/12743928066585", content: "Comdesk Leadでは、下記の構成となっています。", metadata: { title: "リストをプロジェクトにインポート" } },
    { path: "/guide/admin/12755256165145", content: "ユーザーが架電する際の発信元となる電話番号を設定することです。", metadata: { title: "PBX Manager 発信許可設定をする" } },
    { path: "/guide/admin/14972981317785", content: "通話の録音機能を活用事例をご紹介します。", metadata: { title: "録音機能の活用について" } },
    { path: "/guide/admin/12740334296345", content: "リストに架電した際のアクティビティ結果を、ご運用に合わせて自由に作成・追加していただくことが可能です。", metadata: { title: "アクティビティ結果の項目を設定する" } },
    { path: "/guide/admin/13357753043097", content: "Comdesk LeadのSMS送受信機能のうち、SMS送信はパソコンでもスマートフォンでもご利用可能ですが、SNS受信はスマートフォンでのみ可能です。", metadata: { title: "受信したSMSメッセージを活動履歴で確認できるか" } },
    { path: "/guide/admin/16562691982617", content: "CSV形式のファイルをExcelで開く際の操作手順をご説明します。", metadata: { title: "CSV形式のファイルをExcelで開く" } },
    { path: "/guide/admin/14776227377433", content: "Comdesk Lead以外のシステムや、Excel・スプレッドシート等で管理されている顧客情報をComdesk Leadにインポートする際の注意点を説明します。", metadata: { title: "Comdesk Lead以外で管理しているリストをComdesk Leadにインポートする" } },
    { path: "/guide/user/24414426270745", content: "CallServerのアンインストール方法についてご説明いたします。", metadata: { title: "CallServerのアンインストール（AQUOS Wish）" } },
    { path: "/guide/user/12750855872025", content: "* 応対者", metadata: { title: "架電終了後に結果を保存する" } },
    { path: "/guide/user/12815344287769", content: "成約済み企業やクレーム案件のリストを「禁止顧客」登録することで、誤って架電してしまうことを防ぐことができます。", metadata: { title: "架電禁止顧客を禁止顧客リストに登録・解除する" } },
    { path: "/guide/user/12745769763609", content: "本記事ではコール画面での架電方法についてご説明します。", metadata: { title: "リストに対して架電する" } },
    { path: "/guide/user/12744354427033", content: "**携帯電話発信を制御するモバイルアプリ**", metadata: { title: "携帯回線発信制御アプリ（CallServer）のログイン・ログアウト" } },
    { path: "/guide/user/13293513317401", content: "Comdesk Leadは、携帯回線とIP回線から架電が可能です。", metadata: { title: "携帯回線での架電方法" } },
    { path: "/guide/user/12735918031513", content: "1. Comdesk Leadにログインします。", metadata: { title: "Comdesk Leadにログインする" } },
    { path: "/guide/user/13556859672217", content: "ー関連記事ー", metadata: { title: "MyboxのリストをMyboxから解除する" } },
    { path: "/guide/user/12753517305753", content: "1. 画面左側のTeamsアイコンを選択し、活動履歴を選択してください。![](../../.gitbook/assets/12753517305753_0.png)", metadata: { title: "活動履歴で通話履歴を確認する" } },
    { path: "/guide/user/32814562359449", content: "本記事では、弊社サポートチームへのお問い合わせ方法をご案内します。", metadata: { title: "サポートチームへのお問い合わせ方法" } },
    { path: "/guide/user/12773908516505", content: "目次", metadata: { title: "IP回線での架電方法" } },
    { path: "/guide/user/12751011749529", content: "見込み顧客を「Mybox」に登録することで、ご自身しかそのリストに架電できなくなる機能です。他のユーザーには、そのリストが表示されなくなると同時に、架電を行おうとしても架電できなく", metadata: { title: "見込み顧客をMyboxに登録する" } },
    { path: "/guide/user/49110114430745", content: "ー関連記事ー", metadata: { title: "Mybox担当（担当営業者）を変更したい" } },
    { path: "/guide/user/13557435667993", content: "ー関連記事ー", metadata: { title: "Mybox担当（担当営業者）を変更したい" } },
    { path: "/guide/user/13356462685337", content: "弊社より貸与しているAndroid携帯端末に入っている電話アプリを使用して架電すると、", metadata: { title: "携帯端末に入っている電話アプリで架電した場合の履歴・録音の残り方" } },
    { path: "/guide/user/13356116024601", content: "同一プロジェクトに対して複数ユーザーが一斉に架電する場合は、配布コールモードをご利用ください。", metadata: { title: "同じプロジェクトに複数人で同時に架電したい（配布コールモード）" } },
    { path: "/guide/user/12750140603545", content: "リストについて追加情報を入手した場合に、リスト情報の更新ができます。", metadata: { title: "リスト情報を更新する" } },
    { path: "/guide/env/13177022553241", content: "当サービスを快適にご利用いただくために、以下の環境でのご利用を推奨いたします。", metadata: { title: "サイトの推奨環境について" } },
    { path: "/guide/env/23954722459545", content: "IP回線をご利用いただく際の推奨環境をご案内いたします。", metadata: { title: "IP回線ご使用の際の推奨環境" } },
    { path: "/guide/env/18406808922649", content: "弊社からご提供しております携帯電話端末に関しては、下記ヘッドセットで問題なくご利用いただけることを動作確認済みでございます。", metadata: { title: "動作確認済みのヘッドセットのご紹介" } },
    { path: "/guide/env/14826252461721", content: "Wi-Fiをご利用の場合、接続させている端末数の増加やルーターとの距離（障害物の有無）、その他機器との電波干渉等によって、通話品質に影響が出る場合がございます。", metadata: { title: "携帯回線ご利用の際の推奨環境" } },
    { path: "/features/index", content: "各機能の詳細な使い方と活用方法を、基本ガイドと活用ガイドに分けて説明しています。", metadata: { title: "機能一覧" } },
    { path: "/features/advanced/13902826185113", content: "ー関連記事ー", metadata: { title: "再コールリストの表示内容・検索" } },
    { path: "/features/advanced/30384685631897", content: "2024/04/30夜間のアップデートにて、再コールの一部機能がアップデートされます。", metadata: { title: "再コール機能アップデート（2024/04/30）" } },
    { path: "/features/advanced/13449936049305", content: "ー関連記事ー", metadata: { title: "ステータス削除後の過去のヒストリーや活動履歴での表示について" } },
    { path: "/features/advanced/12775436693273", content: "切電後にアクティビティ結果を保存すると、次のリストへ自動的に架電することが可能になる機能です。オートコールモードが使用できるのは、次のコールモードです。", metadata: { title: "オートコールモード" } },
    { path: "/features/advanced/38902832219289", content: "**hubspot側の設定**", metadata: { title: "Hubspot連携方法" } },
    { path: "/features/advanced/31681875230617", content: "**ユーザー種別ごと**に設定できる新規機能となります。", metadata: { title: "電話番号下4桁マスク表示・電話番号編集制限機能" } },
    { path: "/features/advanced/14511324902169", content: "ComDesk Phone（Desktop App）でのキーパッド・保留機能をご説明します。", metadata: { title: "ComDesk Phone 各種機能について（キーパッド・保留・内線）" } },
    { path: "/features/advanced/13931672300825", content: "ー関連記事ー", metadata: { title: "再コールリストの解除" } },
    { path: "/features/advanced/12882387147161", content: "通常コールモード画面と配布コールモード画面で、リスト検索ができます。", metadata: { title: "コールモードでのリスト操作" } },
    { path: "/features/advanced/12780399157657", content: "コール画面の、顧客情報を表示するスペースの高さを変更できます。", metadata: { title: "コール画面で顧客情報表示する画面の高さを変える" } },
    { path: "/features/advanced/12819542587929", content: "マスターデータからデータをエクスポートし、特定のデータを変更後にインポートし上書きする手順をご説明します。", metadata: { title: "リストを特定して上書きインポートをする" } },
    { path: "/features/advanced/28818276745625", content: "再コールリストを開くと、対応状況がキャンセルを除く「予約中/経過未対応/コール済み」が表示されます。", metadata: { title: "再コールリスト内での条件検索・条件検索後の検索（アップデート後）" } },
    { path: "/features/advanced/12780022937753", content: "架電終了時にポップアップが表示され、アクティビティ結果を登録することができます。", metadata: { title: "架電終了時の結果保存画面をポップアップで出す" } },
    { path: "/features/advanced/12789493399193", content: "注意", metadata: { title: "SMS送信方法" } },
    { path: "/features/advanced/18606023446937", content: "ComDesk Phoneを使った携帯回線の発信方法をご案内いたします。", metadata: { title: "ComDesk Phone（デスクトップアプリ）を使った携帯回線の発信方法" } },
    { path: "/features/advanced/31660507633305", content: "従来はテナント設定にて、「テナント全体」「同一のワークグループのみ」の選択が可能となっておりましたが", metadata: { title: "禁止顧客の登録・解除方法（アップデート後）" } },
    { path: "/features/advanced/12822412835481", content: "名前、電話番号、住所のいずれかが重複しているデータを上書きインポートをする方法をご説明します。", metadata: { title: "重複したデータについて上書きインポートをする" } },
    { path: "/features/advanced/23421626752665", content: "Webページに記載されている番号をクリックするだけで発信できる機能がChrome拡張機能です。", metadata: { title: "Chrome拡張機能のインストール方法" } },
    { path: "/features/advanced/12790339370521", content: "ー関連記事ー", metadata: { title: "ユーザーをオフィス・ユニットに割り当てる" } },
    { path: "/features/advanced/33158703176089", content: "2024/6/5の夜間アップデートにて、活動履歴の表示と検索方法が変更になります。", metadata: { title: "活動履歴の表示と検索方法（アップデート後）" } },
    { path: "/features/advanced/33161563899673", content: "From,To,Andの条件で電話番号を指定し、その条件に当てはまった状態での会話の録音ファイルを自動的に削除し、他のユーザーに聞かれないようにできる新機能です。", metadata: { title: "録音ファイルを自動的に削除する" } },
    { path: "/features/advanced/38665828794009", content: "KintoneとComdesk leadを繋ぐ設定になります。", metadata: { title: "KIntone（new）設定方法" } },
    { path: "/features/advanced/16037534896921", content: "再コール設定がされているリストが削除されると、再コール設定も一緒に削除されます。", metadata: { title: "リスト削除時やプロジェクト変更時の再コール設定の紐付けについて" } },
    { path: "/features/advanced/31661378212633", content: "2024/04/30の夜間のアップデートにて、禁止番号の適用範囲が変更になります。", metadata: { title: "禁止番号の登録・解除方法（アップデート後）" } },
    { path: "/features/advanced/12774269711129", content: "デフォルトではTel1へ発信するようになっていますが、", metadata: { title: "発信電話番号の選択（Tel2〜4へ発信）" } },
    { path: "/features/advanced/14724383882009", content: "発信番号の選択", metadata: { title: "（完了させる）その他の機能について（発信回線番号の選択・マイクとスピーカーのテスト・離席モード・携帯電話で発信する・UDPアクセス・Click-to-call発信先番号の事前表示）" } },
    { path: "/features/advanced/14430869382809", content: "1. IP回線着信時に、Comdesk Lead画面中央にポップアップが表示されます。", metadata: { title: "IP回線利用時の受電方法" } },
    { path: "/features/advanced/13593393817881", content: "本記事では、ユーザーにオフィス・ユニットを割り当てた場合の、再コールリストの表示についてご説明します。", metadata: { title: "再コールリストの表示" } },
    { path: "/features/advanced/14508506030489", content: "IP回線利用時に使用できる", metadata: { title: "Comdesk Phone（デスクトップアプリ） アプリインストール macOS" } },
    { path: "/features/advanced/13592844626329", content: "本記事では、レートの機能と設定方法についてご説明します。", metadata: { title: "レートの設定" } },
    { path: "/features/advanced/21626725259545", content: "条件検索（ポップアップ）で検索条件を「テンプレート」として保存することができます。", metadata: { title: "検索条件の保存方法" } },
    { path: "/features/advanced/39402369133209", content: "SalesforceとComdesk Leadを連携方法をご説明します。", metadata: { title: "salesforce連携設定方法" } },
    { path: "/features/advanced/12777071015833", content: "Comdesk Leadのログインにおけるパスワードの変更方法をご案内いたします。", metadata: { title: "Comdesk Lead ログインパスワード変更方法" } },
    { path: "/features/advanced/33006613337369", content: "初期の6つのユーザー種別に加え、権限をカスタムし新たにユーザー種別を作成できる新機能となります。", metadata: { title: "カスタムユーザー種別機能の作成・削除方法" } },
    { path: "/features/advanced/12790321037081", content: "登録してあるユーザーを、オフィスやユニットごとに管理することができます。", metadata: { title: "オフィス・ユニット作成" } },
    { path: "/features/advanced/33020535814553", content: "こちらの記事でご説明した作成したカスタムユーザー種別を、実際のユーザーに適用する方法をご説明します。", metadata: { title: "作成したカスタムユーザー種別をユーザーへの適用方法" } },
    { path: "/features/advanced/12787129797529", content: "リストを削除する手順をご説明いたします。", metadata: { title: "リストを削除する" } },
    { path: "/features/advanced/14508548645657", content: "ComDesk Phoneの発信方法をご説明します。", metadata: { title: "ComDesk Phone 発信方法" } },
    { path: "/features/advanced/28724742098969", content: "コールモード（通常/自動配布/新規）もしくは再コールリストの画面を開いている場合", metadata: { title: "再コール設定したリストへの再コール" } },
    { path: "/features/advanced/33159356356505", content: "文字起こしされた文章の中に設定したキーワードが出た場合、設定したメールアドレスに通知が送られる新機能となります。", metadata: { title: "設定したキーワードを検知しメール通知する" } },
    { path: "/features/advanced/13598452522009", content: "ー関連記事ー", metadata: { title: "Myboxの仕様について" } },
    { path: "/features/advanced/14430641437209", content: "新規コールモードで架電しようとしたら、", metadata: { title: "（完了させる）新規コールモードで架電時に既存リストとの運用の仕方" } },
    { path: "/features/advanced/14511279774745", content: "ComDesk Phone（Desktop App）での着信方法をご説明します。", metadata: { title: "ComDesk Phone 着信方法" } },
    { path: "/features/advanced/13593474385817", content: "コール画面にある保存ボタンは2つあります。（赤枠）", metadata: { title: "コールモード上に設置してある2つの保存ボタンの違い" } },
    { path: "/features/advanced/13592765186841", content: "この記事では、通常コール画面上の顧客リストが、どのような表示順になっているかをご説明します。", metadata: { title: "通常コール画面で表示される顧客リストの表示順" } },
    { path: "/features/advanced/13571673053977", content: "**禁止番号と、重複と、重複なしの内容で記載できるとGoodです。（Haruka22/12/25）**", metadata: { title: "（統合先の記事確認次第削除） プロジェクト登録の重複チェックとは" } },
    { path: "/features/advanced/13445521958937", content: "[活動履歴の各アイコン・項目について](13254863281305)", metadata: { title: "一旦一致させる→（techと合わせて調査が必要のため当分公開禁止）活動履歴CSVファイルの確認方法" } },
    { path: "/features/advanced/12787126154649", content: "1. 画面左側のCustomerを選択し、マスターデータ管理をクリックします。", metadata: { title: "リストを移動する" } },
    { path: "/features/advanced/13456364301465", content: "ー関連記事ー", metadata: { title: "既存アクティビティ結果項目編集後の過去のヒストリーや活動履歴での表示について" } },
    { path: "/features/advanced/56333140546585", content: "Comdesk Leadのオプション機能となり、1分以上の通話を対象に通話内容を自動で要約し、結果を活動履歴に保存します。", metadata: { title: "要約プロンプト機能について" } },
    { path: "/features/advanced/13778980866329", content: "本記事では、既存のリストを別のプロジェクトへ所属変更する（一括追加後、一括削除する）方法をご説明します。", metadata: { title: "既存リストのプロジェクト変更（一括追加・一括削除）" } },
    { path: "/features/advanced/12776069385113", content: "コール画面で架電後に登録したヒストリーを修正する方法をご説明します。", metadata: { title: "ヒストリーの修正" } },
    { path: "/features/advanced/13254863281305", content: "[活動履歴CSVファイルの確認方法](13445521958937)", metadata: { title: "一旦一致させる→（techと合わせて調査が必要のため当分公開禁止）活動履歴の各アイコン・項目について" } },
    { path: "/features/advanced/39428333399065", content: "HubSpotとの連携設定には、Comdesk Lead側での設定とHubSpot側の設定の両方が必要となります。", metadata: { title: "Comdesk LeadとHubSpotの連携設定方法" } },
    { path: "/features/advanced/14511326811033", content: "ComDesk Phoneの内線機能（モニタリング・ささやき・内線）をご説明します。", metadata: { title: "ComDesk Phone機能（モニタリング・ささやき）" } },
    { path: "/features/advanced/salesforce-integration", content: "Comdesk LeadとSalesforceを連携し、通話履歴をSalesforceのToDo（活動）として自動連携するための設定手順", metadata: { title: "Salesforce連携設定マニュアル" } },
    { path: "/features/advanced/38547369260697", content: "KintoneとComdesk leadを繋ぐ設定になります。", metadata: { title: "Kintone連携設定方法" } },
    { path: "/features/advanced/28725840847385", content: "1. 再コールを設定している日時になると「再コール詳細内容」のポップアップが表示されます。", metadata: { title: "再コール時間の再設定（アップデート後）" } },
    { path: "/features/advanced/14502240732825", content: "IP回線利用時に使用できる", metadata: { title: "ComDesk Phone（デスクトップアプリ） アプリインストール WindowsOS" } },
    { path: "/features/advanced/12876176090905", content: "活動履歴では検索をして絞り込むことが可能です。", metadata: { title: "活動履歴を検索する" } },
    { path: "/features/advanced/12777051460249", content: "Comdesk Leadでのユーザー種別についてご説明します。", metadata: { title: "ユーザー種別について" } },
    { path: "/features/advanced/13593294000153", content: "この記事では、再コール時間の再設定方法を2つご説明します。", metadata: { title: "再コール時間の再設定" } },
    { path: "/features/advanced/12788722729625", content: "アクティビティ結果設定では、コール画面に表示させる「応対者」「ステータス」「リスト項目」の設定ができますが、そのうち「応対者」と「ステータス」は親子関係を作成することができます。", metadata: { title: "アクティビティ結果設定で親子関係を作成" } },
    { path: "/features/advanced/12778734555545", content: "1. マスターデータ管理を開きます。", metadata: { title: "リストをエクスポートする" } },
    { path: "/features/advanced/28719815819545", content: "再コールリストを開きます。", metadata: { title: "再コールリストの表示内容（アップデート後）" } },
    { path: "/features/advanced/12881790560281", content: "画面下部に表示されるリスト項目名の右側にある ↕︎（上下矢印）を選択すると、表示順を変えることができます。", metadata: { title: "通常コールモード/配布コールモードで並び替えや検索をする" } },
    { path: "/features/advanced/12789002610329", content: "注意", metadata: { title: "SMSテンプレート作成" } },
    { path: "/features/advanced/13486825686681", content: "Comdesk Leadの新機能です。（リリース：2022年12月15日）", metadata: { title: "パイプライン機能とは" } },
    { path: "/features/advanced/14511290248601", content: "ComDesk Phone（Desktop App）で保留をし、他のユーザーに取り次ぐ方法をご説明します。", metadata: { title: "ComDesk Phone 保留（取次）の操作手順" } },
    { path: "/features/advanced/13382232672025", content: "マスターデータ管理画面の機能を説明いたします。", metadata: { title: "（まとめ記事として完成させる）マスターデータ管理" } },
    { path: "/features/advanced/14939716072345", content: "架電した顧客へのアポイントが取れた場合のアポイント登録方法について説明します。", metadata: { title: "アポイント登録機能について" } },
    { path: "/features/advanced/14508544705177", content: "ComDesk Phoneのログイン方法をご說明します。", metadata: { title: "ComDesk Phone ログイン方法" } },
    { path: "/features/basic/49208420929945", content: "弊社より貸与しているAndroid携帯端末に入っている電話アプリを使用して架電すると、", metadata: { title: "携帯端末に入っている電話アプリで架電した場合の履歴・録音の残り方" } },
    { path: "/features/basic/14501560329113", content: "もばくらのログアウト方法", metadata: { title: "（完了させる）MobileClient ログアウト" } },
    { path: "/features/basic/14698240513049", content: "移動させたい取引をドラッグ＆ドロップでステージ移動させることができます。", metadata: { title: "パイプライン機能：取引を移動する（ステージ移動・パイプライン間移動）" } },
    { path: "/features/basic/14501355033241", content: "MobileClientアプリのインストール方法をご説明します。", metadata: { title: "MobileClient インストール" } },
    { path: "/features/basic/13538915677209", content: "編集したいパイプラインの横の鉛筆マークから、現在選択されているパイプライン設定の編集ができます。", metadata: { title: "パイプライン機能：パイプラインを編集する" } },
    { path: "/features/basic/14502119820057", content: "MobileClientの新規コールモードでの操作方法をご説明します。", metadata: { title: "（完了させる）MobileClient 新規コールモード" } },
    { path: "/features/basic/14502179018649", content: "もばくらの配布コールモードの使いかた", metadata: { title: "（完了させる）MobileClient 配布コールモード" } },
    { path: "/features/basic/14501187664665", content: "下記URLから画像を拝借しているので、これは社外には出せないですね。", metadata: { title: "（完了させる）音声認識について" } },
    { path: "/features/basic/13537810091033", content: "1. パイプラインのアイコンをクリックし（①）、プルダウンメニュー（②）から「パイプライン新規作成」をクリックします（③）。", metadata: { title: "パイプライン機能：パイプラインを新規作成する" } },
    { path: "/features/basic/13571479765529", content: "ー関連記事ー", metadata: { title: "ワークグループ管理で編集した内容はどこに反映されるのか" } },
    { path: "/features/basic/13940816117785", content: "本記事では、パイプラインで管理する取引（リード）で表示する項目の設定方法をご説明します。", metadata: { title: "パイプライン機能：取引情報の項目を設定する" } },
    { path: "/features/basic/14501673318681", content: "MobileClientの通常コールモードでの操作方法をご説明します。", metadata: { title: "MobileClient 通常コールモード" } },
    { path: "/features/basic/14501428133145", content: "Comdesk Lead MobileClientアプリのアンインストール方法をご説明します。", metadata: { title: "MobileClient アンインストール" } },
    { path: "/features/basic/31336370476825", content: "2024/04/30の夜間のアップデートにて、IP回線利用時の受電方法が変更となります。", metadata: { title: "IP回線利用時の受電方法（アップデート後）" } },
    { path: "/features/basic/13703755500697", content: "目次", metadata: { title: "プロジェクトの配布リセット" } },
    { path: "/features/basic/12752074297497", content: "レポート機能ではユーザーの架電結果・現在の架電状況の確認ができます。", metadata: { title: "レポートを確認する" } },
    { path: "/features/basic/13704005152665", content: "本記事では、プロジェクト内のリストを分割する方法をご説明します。", metadata: { title: "プロジェクトの分割" } },
    { path: "/features/basic/14661328574105", content: "パイプラインで管理する取引を作成します。", metadata: { title: "パイプライン機能：取引を作成する" } },
    { path: "/features/basic/13703831936537", content: "本記事では、不要となったプロジェクトの削除方法をご説明します。", metadata: { title: "プロジェクトの削除" } },
    { path: "/features/basic/31271118374681", content: "てすと", metadata: { title: "禁止の登録方法" } },
    { path: "/features/basic/12750509438233", content: "活動履歴では発信・着信の履歴を閲覧・条件での絞り込みが行えます。", metadata: { title: "活動履歴の確認" } },
    { path: "/features/basic/14501557173529", content: "MobileClientのログイン方法をご説明します。", metadata: { title: "MobileClient ログイン方法" } },
    { path: "/features/basic/47658828092313", content: "・CSVダウンロード方式の変更", metadata: { title: "活動履歴のCSVダウンロード" } },
    { path: "/features/basic/13378846043161", content: "本記事では、既存プロジェクトの編集について説明いたします。", metadata: { title: "プロジェクトの編集" } },
    { path: "/features/basic/31329221418521", content: "**・コール画面から番号を禁止登録**", metadata: { title: "禁止リストの登録・インポート方法（アップデート後）" } },
    { path: "/features/basic/14500396520729", content: "通話だけではなく、お客様と繋がれるツールの1つです。", metadata: { title: "SMSとは" } },
    { path: "/plan/index", content: "ご契約内容やライセンス、課金に関する情報です。", metadata: { title: "製品・プランについて" } },
    { path: "/plan/contract/44886821987609", content: "追加", metadata: { title: "各種フォーム" } },
    { path: "/plan/contract/15078375756825", content: "ライセンスの変更については、フォームでのご依頼をお願いいたします。", metadata: { title: "ご利用中ライセンスの変更のご依頼について" } },
    { path: "/plan/contract/14613903837209", content: "解約をご検討いただいている方は弊社担当者までご連絡ください。", metadata: { title: "解約のご連絡について" } },
    { path: "/plan/contract/14661490212761", content: "ライセンス/端末の削減に関するお問い合わせに関しては、弊社担当者、もしくは", metadata: { title: "ライセンス/端末の削減の反映について" } },
    { path: "/plan/contract/13599353160089", content: "キャリア録音番号とユーザーの紐付けを変更したい場合は、フォームまたは[サポートチームへお問い合わせ](../../troubleshoot/support/128289375330", metadata: { title: "キャリア録音番号とユーザーの紐付けを変更したい" } },
    { path: "/plan/contract/14614549439897", content: "ご請求月の月初に発行しメールにてお知らせいたしますので、その月の月末までにお支払いください。", metadata: { title: "請求について" } },
    { path: "/plan/contract/14656797845145", content: "弊社では、ID・携帯端末・回線の追加や変更のご依頼は各種フォームを通じて承っております。", metadata: { title: "ライセンス・携帯端末・IP回線の追加や変更のご依頼方法" } },
    { path: "/plan/contract/14727329027865", content: "ご契約いただいている社名や住所等に変更があった場合には、下記フォームよりご連絡をお願いいたします。", metadata: { title: "社名・住所・請求先情報の変更について" } },
    { path: "/plan/contract/14614863335833", content: "個人情報のお取り扱いについては下記をご確認ください。", metadata: { title: "個人情報のお取り扱いについて" } },
    { path: "/plan/contract/14499858965529", content: "ライセンスの追加については、フォームでのご依頼をお願いいたします。", metadata: { title: "ライセンス追加のご依頼について" } },
    { path: "/plan/contract/14725260004633", content: "■ご依頼フォーム", metadata: { title: "ご契約サービスの削減について" } },
    { path: "/plan/contract/14943281306009", content: "利用規約については下記をご確認ください。", metadata: { title: "利用規約を確認する" } },
    { path: "/plan/contract/14499993910425", content: "携帯端末の追加については、フォームでのご依頼をお願いいたします。", metadata: { title: "携帯端末追加のご依頼について" } },
    { path: "/plan/contract/14874003961881", content: "※（2023年1月現在）", metadata: { title: "デポジットについて" } },
    { path: "/plan/contract/14725147995801", content: "IP回線・チャネルの追加については、フォームでのご依頼をお願いいいたします。", metadata: { title: "IP回線・チャネル数の追加のご依頼について" } },
    { path: "/hardware/index", content: "弊社貸出端末の確認方法や、ハードウェアに関する各種ご依頼の手順を説明しています。", metadata: { title: "ハードウェアについて" } },
    { path: "/hardware/request/12716432501017", content: "機種変更をご希望の場合は、**フォーム**にてご依頼をお願いいたします。", metadata: { title: "機種変更に関して" } },
    { path: "/hardware/request/12716442994713", content: "弊社貸し出しの携帯端末を紛失してしまった場合、フォームにてご依頼をお願いいたします。", metadata: { title: "携帯端末紛失について" } },
    { path: "/hardware/request/12824269643033", content: "My SoftBankのパスワードを忘れてしまった場合や、他アプリ使用時に年齢認証を求められた場合、フォームでのご依頼をお願いいたします。", metadata: { title: "My SoftBankのパスワード" } },
    { path: "/hardware/request/12716510369177", content: "電話番号変更をご希望される場合は、フォームにてご依頼をお願いいたします。", metadata: { title: "電話番号変更について" } },
    { path: "/hardware/request/12825710609945", content: "オプションの加入や解除をご希望の場合、フォームでのご依頼をお願いいたします。", metadata: { title: "携帯端末のオプションについて" } },
    { path: "/hardware/request/12716488998169", content: "「電源が落ちる」「電源が入らない」「充電ができない」「セーフモードになる」「声が聞こえない」などの、携帯端末の不具合が発生した場合の対応方法についてご説明致します。", metadata: { title: "携帯端末の故障に関して" } },
    { path: "/hardware/device/12785391736345", content: "* [**DIGNO® BX2 オンラインマニュアル（取扱説明書）**](https://www.softbank.jp/mobile/support/manual/smartph", metadata: { title: "画面点灯時間を設定する" } },
    { path: "/hardware/device/24496226652313", content: "携帯端末を発信専用でご利用になる場合、着信規制の設定が可能です。", metadata: { title: "携帯電話での着信規制設定" } },
    { path: "/hardware/device/12781943797273", content: "「IMEI」とは端末識別番号で、「国際移動体装置識別番号（International Mobile Equipment Identifier）」の頭文字です。", metadata: { title: "IMEIの確認方法" } },
    { path: "/hardware/device/12783772852121", content: "ICCIDとは、SIMカードの固有識別番号です。", metadata: { title: "ICCIDの確認方法" } },
    { path: "/hardware/device/12783813577113", content: "本記事では、お手持ちのスマートフォンのSIM番号を確認する方法をご案内いたします。", metadata: { title: "携帯番号（SIM番号）の確認方法" } },
    { path: "/hardware/device/24532190641305", content: "携帯電話への着信を他の番号に転送する場合の設定方法をご案内します。", metadata: { title: "携帯電話からの転送設定" } },
    { path: "/hardware/device/14912837687321", content: "弊社からご提供しているソフトバンクの携帯端末については、ビジネス・コンシェルジュ・デバイスマネジメント（MDM）のサービス提供対象外となります。", metadata: { title: "ソフトバンク社のビジネス・コンシェル・デバイスマネジメント（MDM）の利用について" } },
    { path: "/troubleshoot/index", content: "エラーが発生した際の解決方法と、サポートへのお問い合わせ方法をまとめています。", metadata: { title: "トラブルシューティング" } },
    { path: "/troubleshoot/support/12927370479257", content: "本記事では、初めての弊社サポートチームへのお問い合わせ方法をご案内します。", metadata: { title: "はじめてのサポートチームへのお問い合わせ方法" } },
    { path: "/troubleshoot/support/14909482856473", content: "カスタマーサポートの対応時間は以下の通りです。", metadata: { title: "カスタマーサポートの対応時間" } },
    { path: "/troubleshoot/support/12941407647001", content: "ヘルプセンターログイン時のパスワードを忘れてしまった際の再設定方法についてご説明します。", metadata: { title: "ヘルプセンターログイン時のパスワードを忘れてしまった" } },
    { path: "/troubleshoot/support/12828937533081", content: "本記事では、弊社サポートチームへのお問い合わせ方法をご案内します。", metadata: { title: "サポートチームへのお問い合わせ方法" } },
    { path: "/troubleshoot/error/12714594027801", content: "目次", metadata: { title: "「架電に失敗しました」というエラーメッセージが表示された（携帯回線ご利用の場合）" } },
    { path: "/troubleshoot/error/41011546135577", content: "【目次】", metadata: { title: "携帯音声品質不具合" } },
    { path: "/troubleshoot/error/12753378290841", content: "配布し終わったリストを再配布するには、以下2種類の方法があります。", metadata: { title: "配布し終わったリストを再配布したい" } },
    { path: "/troubleshoot/error/15131156225689", content: "MobileClientアプリを立ち上げても画面が真っ白になってしまう場合は、下記をご確認ください。", metadata: { title: "MobileClientアプリの画面が真っ白になってしまう" } },
    { path: "/troubleshoot/error/15324719452441", content: "携帯回線で音声が聞き取りづらい・途切れるという場合の確認事項をご紹介します。", metadata: { title: "通話時にノイズが入ったり、途切れたりする（携帯回線）" } },
    { path: "/troubleshoot/error/14937971613337", content: "特定の端末でのみ画面のレイアウトが正しく表示されずレイアウトが崩れている場合には、ブラウザのキャッシュのクリアをお試しください。", metadata: { title: "画面が正常に表示されない（レイアウトが崩れている）" } },
    { path: "/troubleshoot/error/13238648936729", content: "目次", metadata: { title: "（統合先の記事確認次第削除） ログインができない" } },
    { path: "/troubleshoot/error/12884976793369", content: "スマートフォンの電話アプリの設定で、通話後録音をONに設定するとオートコールモードがご利用いただけません。", metadata: { title: "通話後録音をOFFにする" } },
    { path: "/troubleshoot/error/40012167463961", content: "SMSで送受信ができない件について、確認事項をご紹介します。", metadata: { title: "携帯SMSで送受信ができない" } },
    { path: "/troubleshoot/error/13247426326681", content: "目次", metadata: { title: "「架電に失敗しました」というエラーメッセージが表示された（IP回線ご利用の場合）" } },
    { path: "/troubleshoot/error/13420921169561", content: "目次", metadata: { title: "【携帯回線】通話録音が上がってこない" } },
    { path: "/troubleshoot/error/19604944062873", content: "プロジェクトを削除してもそのプロジェクトに所属していたリストは「プロジェクト未所属」の状態で残っています。先にリストを削除してからプロジェクトを削除してください。", metadata: { title: "リストを削除する前にプロジェクトを削除してしまった" } },
    { path: "/troubleshoot/error/38087817217561", content: "**目次**", metadata: { title: "リストのインポートができない（更新用）" } },
    { path: "/troubleshoot/error/12752349997465", content: "**目次**", metadata: { title: "リストのインポートができない" } },
    { path: "/troubleshoot/error/41011307886105", content: "IPで音声が聞こえない", metadata: { title: "IP回線で音声が聞こえない・聞こえづらい" } },
    { path: "/troubleshoot/error/25582785855513", content: "* 「リスト項目設定」で対象の項目がOFFになっている", metadata: { title: "【作成中】リスト項目がコール画面で表示されない" } },
    { path: "/troubleshoot/error/13251456522905", content: "エラーが表示された際、エラーの詳細を把握するためにコンソールログの取得のご協力をお願いすることがございます。", metadata: { title: "コンソールログの取得方法" } },
    { path: "/troubleshoot/error/38087587368857", content: "Comdesk Leadでは、下記の構成となっています。", metadata: { title: "リストをプロジェクトにインポート（更新用）" } },
    { path: "/troubleshoot/error/12759146997145", content: "インポートしたリストが表示されない場合は、以下の2点をご確認ください。", metadata: { title: "インポートしたリストが表示されない" } },
    { path: "/troubleshoot/error/24655117919001", content: "一度でもプロジェクトが所属した履歴のあるワークグループは、そのワークグループ内の全てのプロジェクトを削除してもそのワークグループは削除ができない仕様となっております。", metadata: { title: "ワークグループが削除できない" } },
    { path: "/troubleshoot/error/24656417938329", content: "同一プロジェクト内で、「配布コールモード」での架電と「通常コールモード」での架電が混在してしまっていると考えられます。", metadata: { title: "配布コールモードで架電しているのに初回の配布で架電済みのリストが配布された" } },
    { path: "/troubleshoot/error/42611012166681", content: "1.[ネット環境・貴社利用状況の確認](#ネット環境・貴社利用状況の確認)", metadata: { title: "音声品質不良の確認事項（IP回線）" } },
    { path: "/troubleshoot/error/25598196148249", content: "* IP回線が選択されていない", metadata: { title: "作成中【IP回線】画面右下にComdesk Phoneが表示されない" } },
    { path: "/troubleshoot/error/14497070753945", content: "携帯回線で架電時に、 * *「SIMを選択してください」 * *とポップアップが表示され、", metadata: { title: "携帯回線で架電時にsim選択の画面が表示される" } },
    { path: "/troubleshoot/error/12746234437529", content: "アクティビティ結果が保存できない場合、下記をご確認ください。", metadata: { title: "アクティビティ結果が保存できない" } },
    { path: "/troubleshoot/error/14873284280729", content: "正しい（桁数）電話番号を入力していない場合、以下のような事象が発生します。", metadata: { title: "端末側に「有効な番号を入力して下さい」と通知が表示され、発信ができない" } },
    { path: "/troubleshoot/error/13317591236889", content: "この記事はIP回線をご利用中のお客様に役立つ記事です。", metadata: { title: "Comdesk Phoneのヘッダーを非表示にしたい" } },
    { path: "/troubleshoot/error/14868042438809", content: "IP回線で音声が聞き取りづらい・途切れるという場合の確認事項をご紹介します。", metadata: { title: "通話時にノイズが入ったり、途切れたりする（IP回線）" } },
    { path: "/developer/api/overview", content: "任意のシステムにComdesk Leadから**活動履歴のデータ**をWebhookを用いて連携が可能です。", metadata: { title: "Webhook概要" } },
    { path: "/release/index", content: "最新のアップデート情報と、Widsleyからのお知らせをご覧いただけます。", metadata: { title: "リリースノート・お知らせ" } },
    { path: "/release/news/41028124522649", content: "平素は弊社サービスをご利用いただき、誠にありがとうございます。", metadata: { title: "2025年1月12日（日）サーバーメンテナンス作業に関するお知らせ" } },
    { path: "/release/news/53393514630169", content: "平素より格別のご愛顧を賜り、厚く御礼申し上げます。", metadata: { title: "株式会社Widsley 2025-2026 年末年始休業のお知らせ" } },
    { path: "/release/news/44994785538713", content: "平素より大変お世話になっております。Widsley Supportでございます。", metadata: { title: "2025/03/26 メンテナンスのお知らせ" } },
    { path: "/release/news/13291087887001", content: "平素より大変お世話になっております。Widsley Supportでございます。", metadata: { title: "株式会社Widsley 2022-2023 年末年始休業のお知らせ" } },
    { path: "/release/news/49777910691609", content: "平素より大変お世話になっております。Widsley Supportでございます。", metadata: { title: "【重要】携帯端末に係る一部手数料改定のお知らせ" } },
    { path: "/release/news/25038627282969", content: "平素より大変お世話になっております。", metadata: { title: "2023/11/10 KDDI回線側での障害報告" } },
    { path: "/release/news/41282561428761", content: "平素より格別の御愛顧を賜り厚くお礼申し上げます。", metadata: { title: "株式会社Widsley 2024-2025 年末年始休業のお知らせ" } },
    { path: "/release/news/42183815551769", content: "平素は弊社サービスをご利用いただき、誠にありがとうございます。", metadata: { title: "【再掲】2025年1月12日（日）サーバーメンテナンス作業に関するお知らせ（アップデート情報追加）" } },
    { path: "/release/notes/widsley-support-2025-12-22-16-45-17-00-comdesk-lead-cs-widsley-comdesk-lead", content: "平素より大変お世話になっております。", metadata: { title: "【復旧済み】Comdesk Lead 一時的な不具合について（2026年06月15日）" } },
    { path: "/release/notes/untitled-page", content: "平素より大変お世話になっております。Widsley Supportでございます。", metadata: { title: "2026/06/10 Comdesk Lead夜間リリースのお知らせ" } },
    { path: "/release/notes/56339041242521", content: "平素より大変お世話になっております。Widsley Supportでございます。", metadata: { title: "2026/03/25 Comdesk Lead夜間リリースのお知らせ" } },
  ];

  const runSearch = async (qOverride) => {
    const q = (typeof qOverride === "string" ? qOverride : query).trim();
    if (!q) return;
    setStatus("loading");
    setSubmitted(q);
    setPage(0);

    // domain/apiKey が未設定（プレースホルダー）ならモックを返す（ローカル確認用）。
    // 本物の値を入れると自動で実 API を呼ぶ。
    if (!domain || domain === "YOUR_DOMAIN" || !apiKey || apiKey.indexOf("XXXX") !== -1) {
      const ql0 = q.toLowerCase();
      const terms0 = ql0.split(/\s+/).filter(Boolean);
      const hit = MOCK.filter((m) => {
        const hay = (m.content + " " + m.metadata.title + " " + m.path).toLowerCase();
        return hay.indexOf(ql0) >= 0 || terms0.every((t) => hay.indexOf(t) >= 0);
      });
      const lm = hit.length ? hit : MOCK;
      setUsingMock(true);
      setResults(lm);
      setStatus(lm.length === 0 ? "empty" : "idle");
      return;
    }

    try {
      const res = await fetch(
        `https://api.mintlify.com/discovery/v1/search/${domain}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: q, pageSize: size }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const all = Array.isArray(data) ? data : [];
      // 関連度フィルタ: キーワードが content / title / path に実際に含まれる結果だけ残す。
      // 全語一致(terms.every) または クエリ全体一致。無関係な語は 0 件になる。
      const ql = q.toLowerCase();
      const terms = ql.split(/\s+/).filter(Boolean);
      setUsingMock(false);
      const list = all.filter((item) => {
        const hay = `${item.content || ""} ${(item.metadata && item.metadata.title) || ""} ${item.path || ""}`.toLowerCase();
        return hay.includes(ql) || terms.every((t) => hay.includes(t));
      });
      setResults(list);
      setStatus(list.length === 0 ? "empty" : "idle");
    } catch (e) {
      setResults([]);
      setStatus("error");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  };

  // URL の ?q= を読んで自動検索（ナビバー検索ボックスからのリダイレクト先として機能）。
  useEffect(() => {
    try {
      var q = new URLSearchParams(window.location.search).get("q");
      if (q) {
        setQuery(q);
        runSearch(q);
      }
    } catch (e) {}
  }, []);

  // path から表示用の情報を導出（防御的に処理）
  const cleanPath = (path) => String(path || "").split(/[?#]/)[0];

  const deriveTitle = (item) => {
    const metaTitle = item && item.metadata && item.metadata.title;
    if (metaTitle) return String(metaTitle);
    const segs = cleanPath(item && item.path)
      .split("/")
      .filter(Boolean);
    return segs.length ? segs[segs.length - 1] : "(無題)";
  };

  const deriveBreadcrumb = (item) => {
    const segs = cleanPath(item && item.path)
      .split("/")
      .filter(Boolean);
    return segs.length ? segs.join(" › ") : "";
  };

  // キーワードをハイライト（正規表現をエスケープ・大文字小文字無視）
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const highlight = (text) => {
    const t = String(text || "");
    const q = submitted.trim();
    if (!q) return t;
    const parts = t.split(new RegExp(`(${escapeRe(q)})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark
          key={i}
          style={{ background: "rgba(0, 188, 212, 0.28)", color: "inherit" }}
        >
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const linkBlue = "#00BCD4"; // Comdesk ブランドカラー（docs.json colors.primary と統一）
  const inputBorder = "1px solid rgba(128,128,128,0.35)";
  const per = Math.max(1, perPage || 5);
  const totalPages = Math.ceil(results.length / per);
  const pageItems = results.slice(page * per, page * per + per);

  // 本文を一定長で切り詰め、続きがあれば「続きを読む」リンクを付ける
  const SNIPPET_LEN = 140;
  const renderSnippet = (item) => {
    const full = String(item.content || "");
    const truncated = full.length > SNIPPET_LEN;
    const shown = truncated ? full.slice(0, SNIPPET_LEN).trimEnd() : full;
    return (
      <span>
        {highlight(shown)}
        {truncated ? "…" : ""}{" "}
        <a
          href={cleanPath(item.path)}
          style={{ color: linkBlue, textDecoration: "none", whiteSpace: "nowrap" }}
        >
          続きを読む
        </a>
      </span>
    );
  };

  // ページ送りボタン（«/ 前へ / 次へ / »）。該当しないときは表示しない（disabled ではなく非表示）。
  // 色・スタイルは従来のブランド色（linkBlue）を維持。
  const pgBtn = (label, onClick, show, wide) =>
    show ? (
      <button
        onClick={onClick}
        style={{
          padding: wide ? "8px 18px" : "8px 12px",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "14px",
          background: linkBlue,
          color: "#fff",
        }}
      >
        {label}
      </button>
    ) : null;

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="キーワードを入力…"
          spellCheck={false}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: inputBorder,
            borderRadius: "8px",
            background: "transparent",
            color: "inherit",
            fontSize: "16px",
          }}
        />
        <button
          onClick={runSearch}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            background: "#00BCD4",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          検索
        </button>
      </div>

      {status === "loading" && <p style={{ opacity: 0.7 }}>検索中…</p>}

      {status === "error" && (
        <p style={{ color: "#e5484d" }}>検索中にエラーが発生しました。</p>
      )}

      {status === "empty" && (
        <p style={{ opacity: 0.7 }}>
          「{submitted}」に一致する結果が見つかりませんでした。
        </p>
      )}

      {status === "idle" && results.length > 0 && (
        <div>
          <p style={{ opacity: 0.7, marginBottom: "24px", fontSize: "14px" }}>
            {results.length} 件の結果（「{submitted}」）
            {usingMock && (
              <span style={{ color: "#d97706" }}>　※ サンプル結果（ローカル確認用）</span>
            )}
          </p>

          {pageItems.map((item, i) => (
            <div
              key={i}
              style={{
                border: "1px solid rgba(128,128,128,0.25)",
                borderRadius: "10px",
                padding: "16px 18px",
                marginBottom: "14px",
                background: "rgba(128,128,128,0.03)",
              }}
            >
              <a
                href={cleanPath(item.path)}
                style={{
                  color: linkBlue,
                  fontSize: "19px",
                  fontWeight: 600,
                  textDecoration: "none",
                  lineHeight: 1.4,
                  display: "inline-block",
                  marginBottom: "6px",
                }}
              >
                {deriveTitle(item)}
              </a>
              <div
                style={{
                  fontSize: "13px",
                  opacity: 0.55,
                  wordBreak: "break-all",
                  marginBottom: "10px",
                }}
              >
                {cleanPath(item.path)}
              </div>
              <div style={{ fontSize: "15px", lineHeight: 1.7, opacity: 0.9 }}>
                {renderSnippet(item)}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              {pgBtn("«", () => setPage(0), page > 0, false)}
              {pgBtn("‹ 前へ", () => setPage((p) => Math.max(0, p - 1)), page > 0, true)}
              {pgBtn("次へ ›", () => setPage((p) => Math.min(totalPages - 1, p + 1)), page < totalPages - 1, true)}
              {pgBtn("»", () => setPage(totalPages - 1), page < totalPages - 1, false)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
