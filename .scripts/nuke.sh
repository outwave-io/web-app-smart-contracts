#!/usr/bin/env bash

# This script removes all transient directories (node_modules and build results)
# To only be used after you've stopped all servers

NUKE_DIRS="node_modules cache artifacts/*"

# Ask for confirmation
echo "This command will delete: n$NUKE_DIRS"
read -n1 -p "Are you sure? Please type 'y': "
echo

# Nuke
case $REPLY in
   y)
   echo "This may take a couple seconds..."
   rm -rf $NUKE_DIRS
   echo "Transient directory removed..."
   echo "to reinstall, run: yarn install & yarn build"
   ;;
   * )
   echo "Aborting, no directory was removed"
   ;;
esac

