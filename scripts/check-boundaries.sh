#!/usr/bin/env bash
set -euo pipefail

# Prevent lib/** from importing UI components
if grep -R -n --include='*.ts' --include='*.tsx' -E "from ['\"]@/components" lib >/dev/null; then
  echo "Boundary violation: lib/** must not import from @/components"
  echo "Offending imports:"
  grep -R -n --include='*.ts' --include='*.tsx' -E "from ['\"]@/components" lib || true
  exit 1
fi

echo "Boundary check passed"

