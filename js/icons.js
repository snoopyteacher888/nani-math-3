/* 自己畫的圖示（老師要求：表情符號在每台電腦、手機長得不一樣，換成每台都一樣的圖）。
   畫面上出現下面這些表情符號時，自動換成同樣大小的小圖；題目內容裡的人物、食物等不換。
   這個檔案在各年級國語、數學網站都一樣。 */
(function () {
  var O = '#E07A2E', D = '#B85E1C', K = '#2B2A28', Y = '#F7B955', G = '#4CAF6A', R = '#E5534B', B = '#4A8FD6';
  function svg(body) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + body + '</svg>'; }
  var star = svg('<path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="' + Y + '" stroke="#C58A1F" stroke-width="1.4" stroke-linejoin="round"/>');
  var check = svg('<path d="M4 12.5l5 5L20 6" fill="none" stroke="' + G + '" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>');
  var lock = svg('<rect x="5" y="10.5" width="14" height="10.5" rx="2.5" fill="' + Y + '" stroke="#C58A1F" stroke-width="1.4"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="' + K + '" stroke-width="2"/><circle cx="12" cy="15.5" r="1.6" fill="' + K + '"/>');
  var pencil = svg('<path d="M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19z" fill="' + Y + '" stroke="' + D + '" stroke-width="1.4" stroke-linejoin="round"/><path d="M14 7l3.5 3.5" stroke="' + D + '" stroke-width="1.4"/><path d="M4 20l1-4.5 3.5 3.5z" fill="#FFE2C6"/><path d="M16 4.5l3.5 3.5 1-1a1.5 1.5 0 0 0 0-2.1l-1.4-1.4a1.5 1.5 0 0 0-2.1 0z" fill="#F28B82"/>');
  var replay = svg('<path d="M19 12a7 7 0 1 1-2.1-5" fill="none" stroke="' + B + '" stroke-width="2.8" stroke-linecap="round"/><path d="M19.5 3.5v5h-5z" fill="' + B + '" stroke="' + B + '" stroke-width="1" stroke-linejoin="round"/>');
  var cross = svg('<path d="M6 6l12 12M18 6L6 18" stroke="' + R + '" stroke-width="3.6" stroke-linecap="round"/>');
  var point = svg('<path d="M3 12h11" stroke="' + O + '" stroke-width="3.2" stroke-linecap="round"/><path d="M12 6l7 6-7 6z" fill="' + O + '" stroke="' + O + '" stroke-width="1.5" stroke-linejoin="round"/>');
  var ICONS = {
    '🔊': svg('<path d="M3 9h4l5-4v14l-5-4H3z" fill="' + O + '" stroke="' + O + '" stroke-width="1.2" stroke-linejoin="round"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="' + B + '" stroke-width="2.2" stroke-linecap="round"/>'),
    '💡': svg('<path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.8.6 1.3 1.5 1.3 2.5h5c0-1 .5-1.9 1.3-2.5A6.5 6.5 0 0 0 12 2.5z" fill="#FFD966" stroke="#C58A1F" stroke-width="1.4"/><path d="M9.5 18.5h5M10 21h4" stroke="' + K + '" stroke-width="1.8" stroke-linecap="round"/><path d="M10 9.5l2 2 2-2" fill="none" stroke="#C58A1F" stroke-width="1.2"/>'),
    '✔': check, '✅': svg('<rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="' + G + '"/><path d="M7 12.5l3.5 3.5L17 8.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'), '✓': check,
    '❌': cross, '✕': cross, '✖': cross,
    '🔁': replay, '🔄': replay, '↩': replay,
    '🎉': svg('<path d="M3 21l4.5-12 7.5 7.5z" fill="' + O + '" stroke="' + D + '" stroke-width="1.2" stroke-linejoin="round"/><path d="M5 15.5l3.5 3.5" stroke="' + Y + '" stroke-width="1.6"/><circle cx="15" cy="5" r="1.4" fill="' + R + '"/><circle cx="19.5" cy="9" r="1.4" fill="' + B + '"/><circle cx="11.5" cy="3.5" r="1.1" fill="' + G + '"/><path d="M13 9.5c1.5-2 3.5-2.5 5-1.5M14.5 12c2-.5 3.5.3 4.5 2" fill="none" stroke="#C9A0DC" stroke-width="1.6" stroke-linecap="round"/>'),
    '📖': svg('<path d="M12 6.5C9.5 4.8 6.5 4.5 3 5v13.5c3.5-.5 6.5-.2 9 1.5z" fill="#FFE2C6" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 6.5c2.5-1.7 5.5-2 9-1.5v13.5c-3.5-.5-6.5-.2-9 1.5z" fill="#FFF3E6" stroke="' + O + '" stroke-width="1.6" stroke-linejoin="round"/>'),
    '📚': svg('<rect x="3" y="15" width="18" height="5" rx="1" fill="' + B + '" stroke="' + K + '" stroke-width="1.2"/><rect x="4.5" y="10" width="16" height="5" rx="1" fill="#8ED38F" stroke="' + K + '" stroke-width="1.2"/><rect x="3.5" y="5" width="15" height="5" rx="1" fill="#F28B82" stroke="' + K + '" stroke-width="1.2"/>'),
    '✏': pencil, '✍': pencil, '📝': svg('<rect x="4" y="3" width="13" height="18" rx="2" fill="#fff" stroke="' + D + '" stroke-width="1.5"/><path d="M7 8h7M7 11.5h7M7 15h4" stroke="#F0B987" stroke-width="1.5" stroke-linecap="round"/><path d="M13 20l.7-3 6-6 2.3 2.3-6 6z" fill="' + Y + '" stroke="' + D + '" stroke-width="1.2" stroke-linejoin="round"/>'),
    '🎤': svg('<rect x="8.5" y="2.5" width="7" height="11" rx="3.5" fill="' + O + '" stroke="' + D + '" stroke-width="1.3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="' + K + '" stroke-width="1.8" stroke-linecap="round"/>'),
    '⭐': star, '★': star, '☆': svg('<path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#F1ECE2" stroke="#C9C0AE" stroke-width="1.4" stroke-linejoin="round"/>'),
    '🔒': lock, '🔐': lock,
    '⚙': svg('<path d="M12 2.5l1.6 2.3 2.7-.6.6 2.7 2.3 1.6-1.2 2.5 1.2 2.5-2.3 1.6-.6 2.7-2.7-.6L12 21.5l-1.6-2.3-2.7.6-.6-2.7-2.3-1.6 1.2-2.5L4.8 10.5 7.1 8.9l.6-2.7 2.7.6z" fill="#9A958C" stroke="' + K + '" stroke-width="1.2" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.2" fill="#F8F6F0" stroke="' + K + '" stroke-width="1.2"/>'),
    '🖨': svg('<rect x="6.5" y="3" width="11" height="6" fill="#fff" stroke="' + K + '" stroke-width="1.4"/><rect x="2.5" y="8.5" width="19" height="9" rx="2" fill="' + B + '" stroke="' + K + '" stroke-width="1.4"/><rect x="6.5" y="14" width="11" height="7" fill="#fff" stroke="' + K + '" stroke-width="1.4"/><circle cx="18" cy="11.5" r="1" fill="' + Y + '"/>'),
    '🔍': svg('<circle cx="10" cy="10" r="6" fill="#E3EEFA" stroke="' + B + '" stroke-width="2.4"/><path d="M14.5 14.5L20.5 20.5" stroke="' + D + '" stroke-width="3.2" stroke-linecap="round"/>'),
    '🗑': svg('<path d="M5 7h14l-1.3 13.5H6.3z" fill="#9A958C" stroke="' + K + '" stroke-width="1.4" stroke-linejoin="round"/><path d="M3.5 7h17M9.5 7V4h5v3M10 11v6M14 11v6" fill="none" stroke="' + K + '" stroke-width="1.4" stroke-linecap="round"/>'),
    '👍': svg('<path d="M7 10.5h-3v10h3z" fill="' + B + '" stroke="' + K + '" stroke-width="1.3" stroke-linejoin="round"/><path d="M7 10.5l4-7c1.6 0 2.5 1.2 2 3l-.8 3h6a2 2 0 0 1 2 2.3l-1.2 6.5a2 2 0 0 1-2 1.7H7z" fill="#FFD3A8" stroke="' + K + '" stroke-width="1.3" stroke-linejoin="round"/>'),
    '👉': point, '➡': point,
    '🧩': svg('<path d="M4 8h4a2.5 2.5 0 1 1 5 0h4v4a2.5 2.5 0 1 1 0 5v4H4v-4a2.5 2.5 0 1 0 0-5z" fill="#8ED38F" stroke="#2D8A57" stroke-width="1.4" stroke-linejoin="round"/>'),
    '🏅': svg('<path d="M7 2.5h4l2 6h-4zM17 2.5h-4l-2 6h4z" fill="' + B + '"/><circle cx="12" cy="15" r="6.5" fill="' + Y + '" stroke="#C58A1F" stroke-width="1.5"/><path d="M12 11.5l1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" fill="#fff"/>'),
    '❓': svg('<circle cx="12" cy="12" r="9.5" fill="' + B + '"/><path d="M9 9.5a3 3 0 1 1 4.2 2.8c-.8.4-1.2 1-1.2 1.9v.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.5" r="1.4" fill="#fff"/>'),
    '💬': svg('<path d="M4 4.5h16a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-9l-5 4v-4H4A1.5 1.5 0 0 1 2.5 16V6A1.5 1.5 0 0 1 4 4.5z" fill="#fff" stroke="' + B + '" stroke-width="1.6" stroke-linejoin="round"/><circle cx="8" cy="11" r="1.3" fill="' + B + '"/><circle cx="12" cy="11" r="1.3" fill="' + B + '"/><circle cx="16" cy="11" r="1.3" fill="' + B + '"/>'),
    '⚠': svg('<path d="M12 3l10 17.5H2z" fill="' + Y + '" stroke="#C58A1F" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 9.5v5" stroke="' + K + '" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="17.5" r="1.3" fill="' + K + '"/>'),
    '🏫': svg('<path d="M3 21V11l9-6 9 6v10z" fill="#FFF3E6" stroke="' + D + '" stroke-width="1.5" stroke-linejoin="round"/><path d="M2 11.5l10-7 10 7" fill="none" stroke="' + O + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="10" y="15" width="4" height="6" fill="' + O + '"/><circle cx="12" cy="10.5" r="2" fill="#fff" stroke="' + D + '" stroke-width="1.2"/>'),
    '👂': svg('<path d="M7 9a5 5 0 0 1 10 0c0 3-2.5 4-3 6.5-.4 2.2-1.8 3.5-3.6 3.5A3 3 0 0 1 7.5 16" fill="#FFD3A8" stroke="' + D + '" stroke-width="1.6" stroke-linecap="round"/><path d="M10 9.5a2 2 0 0 1 4 0c0 1.3-1.5 1.8-1.5 3" fill="none" stroke="' + D + '" stroke-width="1.4" stroke-linecap="round"/>'),
    '📱': svg('<rect x="6.5" y="2" width="11" height="20" rx="2.5" fill="' + K + '"/><rect x="8" y="4.5" width="8" height="14" rx="1" fill="#7FB8E8"/><circle cx="12" cy="20.2" r=".9" fill="#fff"/>'),
    '💻': svg('<rect x="4" y="4.5" width="16" height="11" rx="1.5" fill="' + K + '"/><rect x="5.5" y="6" width="13" height="8" fill="#7FB8E8"/><path d="M1.5 17h21l-1.5 2.5H3z" fill="#9A958C" stroke="' + K + '" stroke-width="1" stroke-linejoin="round"/>'),
    '🎵': svg('<path d="M9 17.5V5l10-2v12" fill="none" stroke="' + K + '" stroke-width="2"/><ellipse cx="6.5" cy="17.5" rx="3" ry="2.4" fill="' + O + '"/><ellipse cx="16.5" cy="15" rx="3" ry="2.4" fill="' + O + '"/>'),
    '🎧': svg('<path d="M4 15v-3a8 8 0 0 1 16 0v3" fill="none" stroke="' + K + '" stroke-width="2"/><rect x="2.5" y="13" width="5" height="8" rx="2" fill="' + O + '"/><rect x="16.5" y="13" width="5" height="8" rx="2" fill="' + O + '"/>')
  };
  var keys = Object.keys(ICONS).sort(function (a, b) { return b.length - a.length; });
  var RE = new RegExp('(' + keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')️?', 'g');
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, OPTION: 1, TITLE: 1, SELECT: 1 };
  function fixText(t) {
    var s = t.nodeValue;
    if (!s || !(RE.lastIndex = 0, RE.test(s))) return;
    var p = t.parentNode;
    if (!p || SKIP[p.nodeName] || (p.closest && p.closest('[data-noicon],.ws-paper,svg,.emo'))) return;
    var frag = document.createDocumentFragment(), last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(s))) {
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      var sp = document.createElement('span'); sp.className = 'emo';
      /* 原本的字留著（看不到），複製文字、念出來、程式比對都跟原來一樣 */
      sp.innerHTML = ICONS[m[1]]; var tx = document.createElement('span'); tx.className = 'emo-t'; tx.textContent = m[0]; sp.appendChild(tx); frag.appendChild(sp);
      last = m.index + m[0].length;
    }
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    p.replaceChild(frag, t);
  }
  function scan(n) {
    if (n.nodeType === 3) return fixText(n);
    if (n.nodeType !== 1 || SKIP[n.nodeName]) return;
    var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT, null), list = [], x;
    while ((x = w.nextNode())) list.push(x);
    list.forEach(fixText);
  }
  var css = document.createElement('style');
  css.textContent = '.emo{display:inline-block;width:1.1em;height:1.1em;vertical-align:-.18em;line-height:1}.emo{position:relative}.emo svg{width:100%;height:100%;display:block}.emo-t{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}';
  document.head.appendChild(css);
  function start() {
    scan(document.body);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') fixText(m.target);
        else m.addedNodes.forEach(scan);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
