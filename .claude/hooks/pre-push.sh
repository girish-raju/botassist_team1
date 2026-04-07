#!/bin/bash
# Block force push
if echo "$@" | grep -q "\-f\|--force"; then
  echo "ERROR: Force push is not allowed. Use regular push."
  exit 2
fi
exit 0
