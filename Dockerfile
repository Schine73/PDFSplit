FROM tiangolo/uwsgi-nginx-flask:python3.8-alpine
RUN apk --update add bash nano poppler-utils openrc avahi dbus
ENV STATIC_URL /static
ENV STATIC_PATH /app/static
COPY ./requirements.txt /var/www/requirements.txt
RUN pip install -r /var/www/requirements.txt

RUN rc-update add avahi-daemon
RUN service avahi-daemon start
