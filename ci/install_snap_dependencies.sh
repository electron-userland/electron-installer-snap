#!/bin/bash -xe

sudo apt update

mkdir -p fakesnap/snap
cp ci/snapcraft.yaml fakesnap/snap/
pushd fakesnap
snapcraft pull desktop-gtk3 electron-deps
sed -i -e s:desktop-gtk3:desktop-gtk2:g snap/snapcraft.yaml
snapcraft pull desktop-gtk2
popd
rm -r fakesnap
