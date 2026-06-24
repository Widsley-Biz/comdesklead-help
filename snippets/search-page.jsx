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

  const size = Math.min(50, Math.max(1, pageSize || 50));

  const runSearch = async (qOverride) => {
    const q = (typeof qOverride === "string" ? qOverride : query).trim();
    if (!q) return;
    setStatus("loading");
    setSubmitted(q);
    setPage(0);

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

  const navBtn = (label, onClick, disabled, primary) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 18px",
        borderRadius: "6px",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        fontWeight: 600,
        fontSize: "14px",
        opacity: disabled ? 0.5 : 1,
        background: primary ? linkBlue : "rgba(128,128,128,0.2)",
        color: primary ? "#fff" : "inherit",
      }}
    >
      {label}
    </button>
  );

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
                gap: "16px",
                marginTop: "8px",
              }}
            >
              {navBtn("‹ 前へ", () => setPage((p) => Math.max(0, p - 1)), page === 0, false)}
              <span style={{ fontSize: "14px", opacity: 0.7, minWidth: "80px", textAlign: "center" }}>
                ページ {page + 1} / {totalPages}
              </span>
              {navBtn("次へ ›", () => setPage((p) => Math.min(totalPages - 1, p + 1)), page >= totalPages - 1, true)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
