#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/opt/magnat-professional}"
DB_CONTAINER="${DB_CONTAINER:-supabase-db}"
STORAGE_CONTAINER="${STORAGE_CONTAINER:-supabase-storage}"
DB_VOLUME="${DB_VOLUME:-magnat-professional_db-data}"
STORAGE_VOLUME="${STORAGE_VOLUME:-magnat-professional_storage-data}"
COMPOSE_SERVICES="${COMPOSE_SERVICES:-backend frontend}"

cd "$APP_DIR"

for required_file in docker-compose.yml supabase/.env package-lock.json backend/package-lock.json; do
  if [[ ! -f "$required_file" ]]; then
    echo "Missing production file: $APP_DIR/$required_file" >&2
    exit 1
  fi
done

command -v docker >/dev/null 2>&1 || {
  echo "Docker is not installed on this server." >&2
  exit 1
}

docker compose version >/dev/null 2>&1 || {
  echo "Docker Compose v2 is not available on this server." >&2
  exit 1
}

check_container_mount() {
  local container="$1"
  local destination="$2"
  local expected="$3"
  local actual=""

  if ! docker inspect "$container" >/dev/null 2>&1; then
    return 0
  fi

  actual="$(
    docker inspect "$container" \
      --format "{{range .Mounts}}{{if eq .Destination \"$destination\"}}{{if .Name}}{{.Name}}{{else}}{{.Source}}{{end}}{{end}}{{end}}"
  )"

  if [[ "$actual" != "$expected" ]]; then
    echo "Unexpected production mount for $container:$destination" >&2
    echo "  actual:   ${actual:-<empty>}" >&2
    echo "  expected: $expected" >&2
    echo "Refusing deploy because production Supabase data must stay on the expected Docker volume." >&2
    exit 1
  fi
}

check_container_mount "$DB_CONTAINER" "/var/lib/postgresql/data" "$DB_VOLUME"
check_container_mount "$STORAGE_CONTAINER" "/var/lib/storage" "$STORAGE_VOLUME"

compose() {
  env -i PATH="$PATH" HOME="${HOME:-/root}" docker compose "$@"
}

read -r -a services <<< "$COMPOSE_SERVICES"

compose up -d --build "${services[@]}"
compose ps "${services[@]}"
