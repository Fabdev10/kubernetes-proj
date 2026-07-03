FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY index.html ./index.html
COPY app.js ./app.js
COPY config.js ./config.js
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && chown -R nginx:nginx /usr/share/nginx/html
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
