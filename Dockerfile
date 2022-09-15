# docker build --tag ziti-webhook-action-builder .
# docker run --rm --volume ${PWD}:/mnt ziti-webhook-action-builder
FROM node:14.20.0
RUN npm install --global @vercel/ncc
WORKDIR /mnt
ENTRYPOINT ["./linux-build.sh"]
