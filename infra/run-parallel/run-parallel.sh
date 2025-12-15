#!/usr/bin/env bash
# Reusable parallel command runner with grouped, colored output
#
# Usage: run-parallel.sh <yaml-config>
# Example: run-parallel.sh tasks/format.yaml
#
# YAML format:
# tasks:
#   - name: Elm
#     cmd: elm-format view/src/ --yes
#   - name: Rust
#     cmd: find platform/src -name '*.rs' -exec rustfmt {} +

CONFIG_FILE="$1"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Config file not found: $CONFIG_FILE"
  exit 1
fi

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

FAILED=0
TMP_DIR=$(mktemp -d)
PIDS=()
NAMES=()
CMDS=()

# Parse YAML (using yq or simple grep approach)
# For now, use simple parsing that works with our format
INDEX=0
while IFS= read -r line; do
  if [[ "$line" =~ ^[[:space:]]*-[[:space:]]*name:[[:space:]]*(.*) ]]; then
    NAMES+=("${BASH_REMATCH[1]}")
  elif [[ "$line" =~ ^[[:space:]]*cmd:[[:space:]]*(.*) ]]; then
    CMDS+=("${BASH_REMATCH[1]}")
  fi
done < "$CONFIG_FILE"

# Start all commands in parallel
for i in "${!NAMES[@]}"; do
  (
    echo -e "${BLUE}${BOLD}=== ${NAMES[$i]} ===${RESET}" > "$TMP_DIR/$i.log"
    if eval "${CMDS[$i]}" >> "$TMP_DIR/$i.log" 2>&1; then
      echo 0 > "$TMP_DIR/$i.exit"
    else
      echo 1 > "$TMP_DIR/$i.exit"
    fi
  ) &
  PIDS+=($!)
done

# Wait for all to complete
wait "${PIDS[@]}"

# Print outputs in order with success/failure markers
for i in "${!NAMES[@]}"; do
  cat "$TMP_DIR/$i.log"
  if [ "$(cat "$TMP_DIR/$i.exit")" = "0" ]; then
    echo -e "${GREEN}✓ ${NAMES[$i]} completed${RESET}"
  else
    echo -e "${RED}✗ ${NAMES[$i]} failed${RESET}"
    FAILED=1
  fi
  echo
done

# Cleanup
rm -rf "$TMP_DIR"

# Final result
if [ $FAILED -eq 0 ]; then
  echo -e "${CYAN}${BOLD}✓✓✓ All tasks completed successfully!${RESET}"
  exit 0
else
  echo -e "${RED}${BOLD}✗✗✗ Some tasks failed${RESET}"
  exit 1
fi
