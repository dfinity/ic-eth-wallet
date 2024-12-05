#!/usr/bin/env bash

[[ "${1:-}" != "--help" ]] || {
  cat <<-EOF
	Generates candid files and bindings.

	Prerequisites:
	- Git is clean.  This is to ensure that the automated code changes are easy to audit.
	  - Note: It is recommended also to have the code formatted before generating bindings.
	- Deploy all canisters to the 'local' network.  Or otherwise ensure that:
	  - Wasm for each canister is at: '.dfx/local/canisters/$CANISTER/$CANISTER.wasm.gz'
	    Note: You may need to set '"gzip": true' for canisters in 'dfx.json'.
	  - Candid for each canister is at: '.dfx/local/canisters/$CANISTER/$CANISTER.did'

	Usage:
	$(basename "$0") [--check]
	  Generates bindings.  Optionally checks whether the bindings have changed.
	EOF

  exit 0
}

# Ensure that git is clean
if git status --porcelain --untracked-files=no | grep -q .; then
  echo "ERROR: Git is not clean.  Please commit all changes before automated code generation."
  exit 1
fi
# Generate bindings
scripts/bind/rust.sh
# Format
scripts/format.sh
# Check whether any files have changed.
[[ "${1:-}" != "--check" ]] || {
  if git status --porcelain --untracked-files=no | grep -q .; then
    echo "ERROR: Bindings are not up to date.  Please run: '$0'"
    exit 1
  fi
}
