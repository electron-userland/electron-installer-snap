sudo docker build -f ci/Dockerfile . -t electron-installer-snap-ci
sudo docker run -it electron-installer-snap-ci ci/docker.sh
