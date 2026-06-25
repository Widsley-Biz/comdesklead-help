// ナビバー検索ボックス（Ask Assistant の隣）。
// - 入力するとオートコンプリート候補をドロップダウン表示（タイトル＋パンくず、6件/ページ・ページ送り）
// - Enter / 候補クリック → /search?q=... へ遷移（search.mdx の検索ページを再利用）
// 検索ロジックは search.mdx (snippets/search-page.jsx) と同じ：Search API + キーワード一致フィルタ。
(function () {
  // TODO(owner): search.mdx と同じ値に。domain=Mintlify識別子、apiKey="mint_dsc_..."（public）。
  var DOMAIN = "comdesk";
  var API_KEY = "mint_dsc_FHVBqXjEdvxEVygDpnwXsW";
  var FETCH = 50;   // API から取得する候補数
  var PER = 6;      // ドロップダウン 1ページの表示数

  var css = document.createElement("style");
  css.textContent = [
    "#cd-search{position:relative;display:inline-flex;align-items:center;margin-right:8px}",
    "#cd-search .cd-ic{position:absolute;left:13px;opacity:.55;pointer-events:none}",
    "#cd-search input{height:36px;width:300px;max-width:40vw;padding:0 14px 0 38px;border:1px solid rgba(128,128,128,.4);border-radius:18px;background:transparent;color:inherit;font-size:14px;outline:none}",
    "#cd-search input:focus{border-color:#00BCD4}",
    "@media(max-width:1180px){#cd-search input{width:170px}}",
    "@media(max-width:640px){#cd-search input{width:120px;padding-left:34px}}",
    "#cd-sug{position:absolute;top:44px;right:0;width:420px;max-width:92vw;background:#fff;color:#111;border:1px solid rgba(128,128,128,.22);border-radius:14px;box-shadow:0 10px 34px rgba(0,0,0,.18);overflow:hidden;z-index:10000;display:none}",
    "#cd-sug.open{display:block}",
    ".cd-item{display:block;padding:11px 16px;border-bottom:1px solid rgba(128,128,128,.14);text-decoration:none}",
    ".cd-item:hover{background:rgba(0,188,212,.08)}",
    ".cd-item .cd-t{color:#0a66c2;font-weight:600;font-size:14px;line-height:1.35}",
    ".cd-item .cd-b{color:#777;font-size:12px;margin-top:3px}",
    ".cd-foot{display:flex;justify-content:space-between;align-items:center;padding:8px 14px;font-size:13px;color:#555}",
    ".cd-foot button{border:none;background:rgba(128,128,128,.16);border-radius:6px;padding:5px 12px;cursor:pointer;font-size:13px}",
    ".cd-foot button[disabled]{opacity:.4;cursor:default}",
    ".cd-msg{padding:14px 16px;color:#777;font-size:13px}",
    ".cd-more{display:block;padding:10px 16px;text-align:center;color:#0a66c2;font-size:13px;font-weight:600;text-decoration:none;background:rgba(0,188,212,.06)}",
    ".cd-more:hover{background:rgba(0,188,212,.12)}"
  ].join("");
  document.head.appendChild(css);

  var wrap = document.createElement("div");
  wrap.id = "cd-search";
  wrap.innerHTML =
    '<svg class="cd-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>' +
    '<input type="text" placeholder="検索…" aria-label="検索" spellcheck="false" autocomplete="off">' +
    '<div id="cd-sug" role="listbox"></div>';
  var input = wrap.querySelector("input");
  var sug = wrap.querySelector("#cd-sug");

  var results = [], page = 0, q = "", reqId = 0;

  function cleanPath(p) { return String(p || "").split(/[?#]/)[0]; }
  function titleOf(it) {
    var m = it.metadata && it.metadata.title;
    if (m) return String(m);
    var s = cleanPath(it.path).split("/").filter(Boolean);
    return s.length ? s[s.length - 1] : "(無題)";
  }
  function crumbOf(it) {
    var s = cleanPath(it.path).split("/").filter(Boolean);
    return s.join(" › ");
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function render() {
    if (!q) { sug.classList.remove("open"); return; }
    if (!results.length) {
      sug.innerHTML = '<div class="cd-msg">「' + esc(q) + '」に一致する結果が見つかりませんでした。</div>';
      sug.classList.add("open");
      return;
    }
    // ページネーションは一旦無効（top PER 件のみ表示）。Enter で /search 全結果へ。
    var items = results.slice(0, PER);
    var html = items.map(function (it) {
      return '<a class="cd-item" href="' + esc(cleanPath(it.path)) + '">' +
        '<div class="cd-t">' + esc(titleOf(it)) + '</div>' +
        '<div class="cd-b">' + esc(crumbOf(it)) + '</div></a>';
    }).join("");
    if (results.length > PER) {
      html += '<a class="cd-more" href="/search?q=' + encodeURIComponent(q) + '">すべての結果を見る（' + results.length + '件）›</a>';
    }
    sug.innerHTML = html;
    sug.classList.add("open");
  }

  function doFetch() {
    var qq = q, myReq = ++reqId;
    fetch("https://api.mintlify.com/discovery/v1/search/" + DOMAIN, {
      method: "POST",
      headers: { Authorization: "Bearer " + API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ query: qq, pageSize: FETCH })
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (d) {
        if (myReq !== reqId) return; // 古いレスポンスは無視
        var all = Array.isArray(d) ? d : [];
        var ql = qq.toLowerCase(), terms = ql.split(/\s+/).filter(Boolean);
        results = all.filter(function (it) {
          var hay = ((it.content || "") + " " + ((it.metadata && it.metadata.title) || "") + " " + (it.path || "")).toLowerCase();
          return hay.indexOf(ql) >= 0 || terms.every(function (t) { return hay.indexOf(t) >= 0; });
        });
        page = 0;
        render();
      })
      .catch(function () { if (myReq === reqId) { results = []; render(); } });
  }

  var timer = null;
  input.addEventListener("input", function () {
    q = input.value.trim();
    page = 0;
    clearTimeout(timer);
    if (!q) { sug.classList.remove("open"); return; }
    timer = setTimeout(doFetch, 250);
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      var v = input.value.trim();
      if (v) window.location.href = "/search?q=" + encodeURIComponent(v);
    } else if (e.key === "Escape") {
      sug.classList.remove("open");
    }
  });
  sug.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button[data-p]");
    if (b) {
      e.preventDefault();
      e.stopPropagation(); // 「外側クリック→閉じる」ハンドラに伝播させない（render後に target が外れて誤判定するため）
      page += (b.getAttribute("data-p") === "next" ? 1 : -1);
      render();
    }
  });
  document.addEventListener("click", function (e) {
    if (!wrap.contains(e.target)) sug.classList.remove("open");
  });

  // ナビバーへ注入（Ask Assistant の隣）。React 再描画で外れたら貼り直す。既に居れば触らない。
  // 表示されている要素だけ返す（モバイルでは desktop 版 Ask Assistant が hidden になる）。
  function vis(el) { return el && el.offsetParent !== null ? el : null; }
  function ensure() {
    var anchor = vis(document.getElementById("assistant-entry")) ||
                 vis(document.getElementById("assistant-entry-mobile")) ||
                 vis(document.querySelector('[data-component-name="theme-toggle"]')) ||
                 vis(document.querySelector('[aria-label="Toggle dark mode"]'));
    // 見えている Ask Assistant の「左隣」に配置（お問い合わせは右隣に入るので奪い合わない）。
    if (anchor && anchor.parentNode && wrap.nextElementSibling !== anchor) {
      anchor.parentNode.insertBefore(wrap, anchor);
    }
  }
  ensure();
  if (window.MutationObserver && document.body) {
    new MutationObserver(ensure).observe(document.body, { childList: true, subtree: true });
  }
  window.addEventListener("resize", ensure); // ブレークポイント切替で anchor が変わるため
  setInterval(ensure, 1500);
}());