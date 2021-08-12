#!/bin/bash

# commit the snapshots to the specified branch and repository

set -xeuo pipefail

echo "snapshot directory: ${SNAPSHOT_DIR:=$1}"
echo "repo              : ${SNAPSHOT_REPO:=$2}"
echo "branch            : ${SNAPSHOT_BRANCH:=$3}"
echo "Github user       : ${SNAPSHOT_USER:=${GITHUB_ACTOR-}}"
echo "Github email      : ${SNAPSHOT_EMAIL:=$SNAPSHOT_USER@users.noreply.github.com}"

git clone "$SNAPSHOT_REPO" dest-repo --single-branch --branch "$SNAPSHOT_BRANCH"
cp -rT "$SNAPSHOT_DIR" dest-repo
cd dest-repo
if [[ $SNAPSHOT_USER ]]; then
    git config user.name "$SNAPSHOT_USER"
    git config user.email "$SNAPSHOT_EMAIL"
fi
git add .
git commit -m "snapshot commit"

