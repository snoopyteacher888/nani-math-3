#!/usr/bin/env bash
# 把共用的程式從 nani-math-3 複製到五、六年級的網站（hanlin-math-5、hanlin-math-6）。
# 用法：在 nani-math-3 資料夾執行  bash tools/sync.sh
# 每個網站自己的 js/site.js（年級）和 README.md 不會被覆蓋。
set -e
here="$(cd "$(dirname "$0")/.." && pwd)"
for g in 5 6; do
  dst="$here/../hanlin-math-$g"
  [ -d "$dst" ] || { echo "找不到 $dst，略過"; continue; }
  mkdir -p "$dst/js" "$dst/tests" "$dst/tools"
  cp "$here/index.html" "$here/style.css" "$here/.gitignore" "$dst/"
  for f in "$here"/js/*.js; do [ "$(basename "$f")" = site.js ] || cp "$f" "$dst/js/"; done
  cp "$here"/tests/*.js "$dst/tests/"
  cp "$here"/tools/sync.sh "$dst/tools/"
  rm -rf "$dst/fonts" "$dst/images"; cp -r "$here/fonts" "$here/images" "$dst/"
  [ -f "$dst/js/site.js" ] || printf "/* 這個網站是幾年級（三個數學網站共用同一套程式，只有這個檔案不一樣） */\nwindow.SITE_GRADE = '%s';\n" "$g" > "$dst/js/site.js"
  echo "已更新 hanlin-math-$g"
done
