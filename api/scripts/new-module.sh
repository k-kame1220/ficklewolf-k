#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

NAME="${1:-}"
WITH_API="${2:-}"

if [[ ! "$NAME" =~ ^[a-z][a-z0-9]*$ ]]; then
  echo "使い方: $0 <小文字の英数字の名前> [--with-api]" >&2
  exit 1
fi
if [[ -e "modules/$NAME" ]]; then
  echo "modules/$NAME はもうあります" >&2
  exit 1
fi

CLASS="${NAME^}"
PKG="com/ficklewolf/k/$NAME"
BASE="modules/$NAME"

# api（契約）: 他のモジュールから使われるときだけ
if [[ "$WITH_API" == "--with-api" ]]; then
  mkdir -p "$BASE/api/src/main/kotlin/$PKG/api"
  cat > "$BASE/api/build.gradle.kts" <<EOF
plugins {
    id("k.kotlin-core")
}

dependencies {
    api(project(":shared:kernel"))
}
EOF
  CORE_DEPS="    api(project(\":modules:$NAME:api\"))"
else
  CORE_DEPS="    api(project(\":shared:kernel\"))"
fi

# core: domain + application（純粋な Kotlin）
mkdir -p "$BASE/core/src/main/kotlin/$PKG/domain" \
         "$BASE/core/src/main/kotlin/$PKG/application" \
         "$BASE/core/src/test/kotlin/$PKG/domain" \
         "$BASE/core/src/test/kotlin/$PKG/application"
cat > "$BASE/core/build.gradle.kts" <<EOF
plugins {
    id("k.kotlin-core")
}

dependencies {
$CORE_DEPS
}
EOF

# adapter: web + persistence（Spring）
mkdir -p "$BASE/adapter/src/main/kotlin/$PKG/adapter/web" \
         "$BASE/adapter/src/main/kotlin/$PKG/adapter/persistence"
cat > "$BASE/adapter/build.gradle.kts" <<EOF
plugins {
    id("k.spring-adapter")
}

dependencies {
    implementation(project(":platform:web"))
    implementation(project(":modules:$NAME:core"))
}
EOF
cat > "$BASE/adapter/src/main/kotlin/$PKG/adapter/${CLASS}Configuration.kt" <<EOF
package com.ficklewolf.k.$NAME.adapter

import org.springframework.context.annotation.Configuration

@Configuration
class ${CLASS}Configuration
EOF

# bootstrap に adapter を足す（最後の modules の行の下に入れる）
BOOT="bootstrap/build.gradle.kts"
LINE="    implementation(project(\":modules:$NAME:adapter\"))"
LAST=$(grep -n 'project(":modules:' "$BOOT" | tail -1 | cut -d: -f1)
sed -i "${LAST}a\\
$LINE" "$BOOT"

echo "作った: $BASE"
find "$BASE" -name '*.kts' -o -name '*.kt' | sort
echo "bootstrap に追加: $LINE"
if ! grep -q 'listFiles' settings.gradle.kts; then
  echo "※ settings.gradle.kts の include に、作ったモジュールを足してください"
fi
