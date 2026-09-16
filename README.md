# together

Watch the same film at the same moment as your friends, wherever they are.

Peer to peer and end-to-end encrypted. No server to run, no accounts, nothing to configure.
Start a room, send the invite, and everyone's player stays on the same frame: when anyone
plays, pauses or seeks, everyone follows.

## In a browser

Open **[temporaryfix.github.io/together-releases](https://temporaryfix.github.io/together-releases/)**.
There's nothing to install. Drop a video on the screen to start a room, or open an invite a
friend sent you.

## In a terminal

**macOS and Linux:**

```sh
curl -fsSL https://github.com/temporaryfix/together-releases/releases/latest/download/install.sh | sh
```

**Windows**, in PowerShell:

```powershell
irm https://github.com/temporaryfix/together-releases/releases/latest/download/install.ps1 | iex
```

Both check the download against its published checksum. You'll also need a video player:
[mpv](https://mpv.io/installation), [IINA](https://iina.io) or [VLC](https://www.videolan.org/vlc).
On Windows the installer sets up VLC for you if you don't have one.

```sh
together film.mkv                          # start a room, and get an invite to send
together watchafl6szz…uygryc25             # join, streaming the film from the room
together watchafl6szz…uygryc25 film.mkv    # join with your own copy
```

When everyone's ready, press **r**. Once the whole room has, the film starts on a countdown.

Invites work in both the browser and the terminal, so friends can use whichever they like.

## Good to know

- **Nobody learns what you're watching.** File names and sizes never leave your machine.
- **Films never go through the public relays.** If there's no direct connection to whoever has
  the film, use your own copy, or a relay you run yourself (`--relay <url>`, or `?relay=<url>` in
  the browser). Browsers always connect through a relay, so streaming in a browser needs your own.
- **Each person shows how you're connected to them:** direct, or through which relay.

This repository holds the releases and the browser app. The
[latest release](https://github.com/temporaryfix/together-releases/releases/latest) has every
download, including `together-web.zip` if you want to host the browser app yourself.
