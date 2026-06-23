// Zendesk Contact Form Modal - Comdesk Help
(function () {
  var style = document.createElement('style');
  style.textContent = [
    // 右上フローティング配置（ナビバー右側の領域に重ねる。DOM 注入しないので React 再描画に強い）。
    // 位置は top / right の値で微調整可能。テーマ切替ボタンに重なる場合は right を増やす。
    '#zd-btn{position:fixed;top:13px;right:110px;z-index:9998;display:flex;align-items:center;gap:8px;background:#00BCD4;color:#fff;border:none;border-radius:20px;padding:9px 16px;font-size:14px;font-weight:600;font-family:system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,188,212,.35);transition:background .2s,transform .15s}',
    '#zd-btn:hover{background:#00a5bb;transform:translateY(-1px)}',
    '#zd-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(2px)}',
    '#zd-overlay.open{display:flex}',
    '#zd-modal{background:#fff;border-radius:16px;padding:32px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2);font-family:system-ui,sans-serif;position:relative;margin:16px}',
    '#zd-modal h2{margin:0 0 6px;font-size:20px;font-weight:700;color:#111}',
    '#zd-modal>p{margin:0 0 24px;font-size:14px;color:#666}',
    '#zd-close{position:absolute;top:16px;right:16px;background:none;border:none;cursor:pointer;color:#999;font-size:20px;line-height:1;padding:4px 8px;border-radius:6px}',
    '#zd-close:hover{background:#f5f5f5;color:#333}',
    '.zd-row{margin-bottom:16px}',
    '.zd-row label{display:block;font-size:13px;font-weight:600;color:#333;margin-bottom:6px}',
    '.zd-row input,.zd-row select,.zd-row textarea{width:100%;box-sizing:border-box;border:1.5px solid #e0e0e0;border-radius:8px;padding:10px 12px;font-size:14px;font-family:system-ui,sans-serif;color:#111;outline:none;transition:border .15s}',
    '.zd-row input:focus,.zd-row select:focus,.zd-row textarea:focus{border-color:#00BCD4}',
    '.zd-row textarea{resize:vertical;min-height:100px}',
    '#zd-submit{width:100%;background:#00BCD4;color:#fff;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:700;font-family:system-ui,sans-serif;cursor:pointer;margin-top:4px;transition:background .2s}',
    '#zd-submit:hover{background:#00a5bb}',
    '#zd-submit:disabled{background:#bbb;cursor:not-allowed}',
    '#zd-sent{display:none;text-align:center;padding:16px 0}',
    '#zd-sent .zd-check{width:56px;height:56px;background:#e0f7fa;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}',
    '#zd-sent h3{margin:0 0 8px;font-size:18px;color:#111}',
    '#zd-sent p{margin:0;color:#666;font-size:14px}',
    '#zd-error{display:none;background:#fff3f3;border:1px solid #ffcdd2;border-radius:8px;padding:10px 14px;margin-top:12px;font-size:13px;color:#c62828}',
  ].join('');
  document.head.appendChild(style);

  // 該当箇所の選択肢
  var LOCATIONS = [
    ['ログイン画面', '/login'],
    ['コール画面（通常・新規・配布）', '/call'],
    ['ショートメッセージ送信（SMS）', 'ショートメッセージ送信（sms）'],
    ['活動履歴', '/call_log'],
    ['条件検索フォーム・フィルター', 'search_filter'],
    ['マスターデータ管理・プロジェクト管理（インポート）', '/manage/master'],
    ['レポート', '/report/my_self'],
    ['パイプライン', '/pipeline'],
    ['Mybox管理', '/manage/mybox'],
    ['禁止番号管理', '/manage/prohibit'],
    ['再コールリスト', '/recall'],
    ['リスト項目設定・アクティビティ結果設定', 'manage/property_setting'],
    ['PBX Manager設定', 'pbx_manager'],
    ['IP回線音声品質', 'leadpbx_ip_voice_quality'],
    ['Mobile App', 'mobile_app'],
    ['携帯端末', 'mobile'],
    ['アカウント', 'account'],
    ['その他', 'other'],
  ];

  var locationOptions = LOCATIONS.map(function(o) {
    return '<option value="' + o[1] + '">' + o[0] + '</option>';
  }).join('');

  var html = [
    '<button id="zd-btn">',
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      'お問い合わせ',
    '</button>',
    '<div id="zd-overlay">',
      '<div id="zd-modal">',
        '<button id="zd-close" aria-label="閉じる">&times;</button>',
        '<div id="zd-form-wrap">',
          '<h2>お問い合わせ</h2>',
          '<p>内容をお送りいただけると、サポートチームがご対応します。</p>',
          '<form id="zd-form" novalidate>',
            '<div class="zd-row"><label>お名前 <span style="color:#e53">※</span></label><input id="zd-name" type="text" placeholder="山田 太郎" required></div>',
            '<div class="zd-row"><label>メールアドレス <span style="color:#e53">※</span></label><input id="zd-email" type="email" placeholder="taro@example.com" required></div>',
            '<div class="zd-row"><label>テナント名（会社名） <span style="color:#e53">※</span></label><input id="zd-tenant" type="text" placeholder="株式会社○○" required></div>',
            '<div class="zd-row"><label>該当箇所 <span style="color:#e53">※</span></label>',
              '<select id="zd-location" required>',
                '<option value="">選択してください</option>',
                locationOptions,
              '</select>',
            '</div>',
            '<div class="zd-row"><label>件名 <span style="color:#e53">※</span></label><input id="zd-subject" type="text" placeholder="お問い合わせの件名" required></div>',
            '<div class="zd-row"><label>内容 <span style="color:#e53">※</span></label><textarea id="zd-body" placeholder="お問い合わせ内容をご記入ください" required></textarea></div>',
            '<div id="zd-error"></div>',
            '<button type="submit" id="zd-submit">送信する</button>',
          '</form>',
        '</div>',
        '<div id="zd-sent">',
          '<div class="zd-check"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00BCD4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>',
          '<h3>送信が完了しました！</h3>',
          '<p>内容を確認し、担当者からご連絡いたします。<br>しばらくお待ちください。</p>',
        '</div>',
      '</div>',
    '</div>'
  ].join('');

  function addUI() {
    if (document.getElementById('zd-btn')) return;
    if (!document.body) return;
    var div = document.createElement('div');
    div.innerHTML = html;
    while (div.firstChild) document.body.appendChild(div.firstChild);

    var overlay  = document.getElementById('zd-overlay');
    var formWrap = document.getElementById('zd-form-wrap');
    var sent     = document.getElementById('zd-sent');
    var form     = document.getElementById('zd-form');
    var errEl    = document.getElementById('zd-error');

    document.getElementById('zd-btn').addEventListener('click', function () {
      formWrap.style.display = '';
      sent.style.display = 'none';
      form.reset();
      errEl.style.display = 'none';
      overlay.classList.add('open');
    });
    document.getElementById('zd-close').addEventListener('click', function () { overlay.classList.remove('open'); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') overlay.classList.remove('open'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name     = document.getElementById('zd-name').value.trim();
      var email    = document.getElementById('zd-email').value.trim();
      var tenant   = document.getElementById('zd-tenant').value.trim();
      var location = document.getElementById('zd-location').value;
      var subject  = document.getElementById('zd-subject').value.trim();
      var body     = document.getElementById('zd-body').value.trim();

      if (!name || !email || !tenant || !location || !subject || !body) {
        errEl.textContent = 'すべての必須項目を入力・選択してください。';
        errEl.style.display = 'block';
        return;
      }

      var submitBtn = document.getElementById('zd-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = '送信中…';
      errEl.style.display = 'none';

      fetch('https://comdesklead.zendesk.com/api/v2/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request: {
            ticket_form_id: 900000059466,
            subject: subject,
            comment: { body: body },
            requester: { name: name, email: email },
            custom_fields: [
              { id: 900011874466,   value: name },
              { id: 900012751123,   value: tenant },
              { id: 14843259561625, value: 'question' },
              { id: 14843373880729, value: 'add' },
              { id: 14843482847897, value: 'situation_check' },
              { id: 14843650824985, value: location },
            ]
          }
        })
      })
      .then(function (res) {
        if (!res.ok) return res.text().then(function(t){ throw new Error(t); });
        return res.json();
      })
      .then(function () {
        formWrap.style.display = 'none';
        sent.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = '送信する';
      })
      .catch(function (err) {
        console.error('Zendesk API error:', err.message);
        errEl.textContent = '送信に失敗しました。しばらくしてから再度お試しください。';
        errEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = '送信する';
      });
    });
  }


  // Delegate: any <a href="#contact"> opens the contact modal (replaces legacy Zendesk request form links)
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href$="#contact"]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href !== '#contact' && !/#contact$/.test(href)) return;
    e.preventDefault();
    var btn = document.getElementById('zd-btn');
    if (btn) btn.click();
  });

  if (document.body) addUI();
  setTimeout(addUI, 100);
  setTimeout(addUI, 600);
  setTimeout(addUI, 1500);
  
  // Assistant パネル（右側のチャット）が開いている間は お問い合わせ ボタンを隠す（重なり防止）。
  function syncBtnVisibility() {
    var btn = document.getElementById('zd-btn');
    if (!btn) return;
    var panel = document.getElementById('chat-assistant-sheet') ||
                document.getElementById('chat-assistant-textarea') ||
                document.getElementById('chat-assistant-input');
    var open = !!(panel && panel.offsetParent !== null);
    btn.style.visibility = open ? 'hidden' : '';
  }
  syncBtnVisibility();
  if (window.MutationObserver && document.body) {
    new MutationObserver(syncBtnVisibility).observe(document.body, { childList: true, subtree: true });
  }
}());
