FROM rockylinux:9

LABEL maintainer="milton@lajollalabs.com"

# Use bash as default shell so we can 'source' nvm properly when needed
SHELL ["/bin/bash", "-lc"]

RUN dnf -y update && \
    dnf -y install wget vim nginx && \
    dnf clean all



WORKDIR /ljlos2

# Install NVM and Node.js using NVM
ENV NVM_DIR=/root/.nvm
ENV NODE_VERSION=22.12.0

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash \
    && source "$NVM_DIR/nvm.sh" \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION

# Add the NVM-installed Node to PATH (note: directory is v22.12.0, not vv22.12)
ENV PATH="$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH"

RUN echo " --- "
RUN echo " --- "

# Optional: sanity check – this should print Node 22.12.x, not 16.x
RUN node -v && npm -v

# Build Angular app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm install -g @angular/cli
RUN ng build --base-href / --configuration production

# Nginx configuration
RUN mkdir -p /etc/nginx/ssl
RUN mkdir /eln
RUN cp -r ./dist/* /eln/

RUN chown -R nginx:nginx .

# TODO: provide a real nginx.conf here
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 443

CMD ["/bin/sh", "-c", "./copy_env_config.sh && nginx -g 'daemon off;'"]
