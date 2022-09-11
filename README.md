# About

Highly customizable and ergonomic chatbot made for Twitch.tv.

## Name

The bot is named after a Montenegrin mountain of the same name (Lovćen - Ловћен
(lôːʋtɕen)).

# Stack

This particular instance is made in Deno, a JavaScript runtime utilizing the V8
engine, built with Rust.

## main components

- **tmi.js** Twitch IRC client
- **MongoDB** database (additional DBs might be available in the future)

# Run yourself

## Supported platforms

⚠⚠Linux-only⚠⚠ (for now, anyways)

```bash
$ git clone https://github.com/dynamo58/deno-ttv-bot
$ cd deno-ttv-bot
```

Now rename the `.env.example` file to `.env` and populate it with your
information. Then inspect the `src/main.example.ts` and modify it.

The last step is to setup the database, the MongoDB (currently only DB
supported) schema is the following

- `data`
  - `live_notif_subscribers`
  - `lurkers`
  - `reminders`
  - `stats`
  - `uptime_stats`
- `testing`
  - `live_notif_subscribers`
  - `lurkers`
  - `reminders`
  - `stats`
  - `uptime_stats`

, where `data` is used for live development and `testing` for when testing, so
that the two never collide.

Then all that is left is to run the bot

```bash
$ TESTING=1 LOCAL=1 PORT=3000 deno run --allow-read --allow-net --allow-env
--allow-run src/main.example.ts
```

## What is up with all these environment variables?

- **PORT** specifies which port the bot should be listening on for Twitch
  WebHook EventSub (and if there is more web-based interactions in the future,
  for that also)
- **LOCAL** when enabled, the bot will use `ngrok` as a proxy for Twitch WebHook
  EventSub
- **TESTING** the bot has mechanisms to update/restart itself during runtime;
  when done locally, the TESTING var should be set and the bot will just use the
  shell do restart itself; however, when using production, a Linux environment
  with **systemd** is assumed

### systemd schema

1. Create the service file

```bash
$ cat /etc/systemd/system/lovcen.service

[Unit]
Description=Run lovcen TTV bot

[Service]
User=root
WorkingDirectory=<path to code>
ExecStart=/bin/bash -c 'PORT=3006 deno run -A src/main.prod.ts'
Restart=always

[Install]
WantedBy=multi-user.target
```

2. Enable the service

```bash
$ sudo systemctl enable lovcen.service
$ sudo systemctl daemon-reload
$ sudo systemctl status lovcen.service
● lovcen.service - Run lovcen bot
     Loaded: loaded (/etc/systemd/system/lovcen.service; enabled; vendor preset: enabled)
     Active: active (running) since Sun 2022-09-11 09:08:35 UTC; 1h 14min ago
     ...
Sep 11 09:08:35 ubuntu systemd[1]: Started Run lovcen bot.
```

If the `Active: ...` part is different, then you've probably done something
wrong.
