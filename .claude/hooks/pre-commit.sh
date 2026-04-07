#!/bin/bash
# Block commits with hardcoded secrets
if grep -r "sk-ant-\|botassist-admin\|API_KEY.*=.*['\"][a-zA-Z0-9_-]\{20,\}" --include="*.py" --include="*.js" --include="*.jsx" backend/app/ frontend/src/ 2>/dev/null | grep -v ".env" | grep -v "config.py.*environ"; then
  echo "ERROR: Possible hardcoded secret detected. Use environment variables."
  exit 2
fi
echo "Pre-commit check passed"
exit 0
