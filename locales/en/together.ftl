# Room event notices. Domain errors remain structured in together-core.
extension-description = Watch any video on the web in sync with friends, wherever they are. Peer to peer and end-to-end encrypted.
name-unknown = Someone
name-local = You
member-joined = { $name } joined
member-joined-screen = { $name } joined (TV)
member-joined-remote = { $name } joined (remote)
member-left = { $name } left
changed-play = { $name } pressed play at { $at }
changed-pause = { $name } paused at { $at }
changed-seek = { $name } jumped to { $at }
changed-load = { $name } opened a video
media-mismatch = { $name } seems to be playing a different file
ready-local = You're ready
not-ready-local = You're not ready any more
ready-peer = { $name } is ready
not-ready-peer = { $name } isn't ready any more
holding-local = Everyone's waiting for your player to catch up
holding-ad-local = Everyone's waiting for your ad to finish
holding-peer = Waiting for { $name } to catch up
holding-ad-peer = Waiting for { $name }'s ad
starting = Everyone's ready
starting-terminal = Everyone's ready. Starting…
resuming = Picking up where we stopped
resuming-terminal = Carrying on…
gave-up-local = The room carried on without you
gave-up-peer = Carrying on without { $name }
program-loading = Opening the video…
program-off = Can't play the room's video here
program-unsupported = Update to follow this room.
program-unsupported-terminal = Update to follow this room: { $install }
room-left = You left the room
refused-newer = { $name } has a newer Together.
refused-newer-terminal = { $name } has a newer Together. Update: { $install }
refused-unknown-name = Someone here
refused-not-member = That invite no longer works.
refused-full = The room is full.
refused-other = Couldn't join the room.
media-mismatch-browser = { $name } may be watching a different video
program-off-browser = Can’t play this video here.
refused-other-browser = Couldn’t join the room.
ready-button = I’m ready
not-ready-button = Not ready
ready-button-key = I’m ready (R)
not-ready-button-key = Not ready after all (R)
ready-title = Ready to watch?
ready-title-mine = You’re ready
ready-instructions = It starts for everyone once you’re all ready.
ready-count = { $count } of { $total } ready

# Holds and readiness, shared by native and browser presentation.
names-list = { $rest } and { $last }
wait-ready = Ready when you are
wait-others = Waiting for the others
wait-names = Waiting for { $names }
wait-stalled = Waiting for { $names } to catch up
wait-ad = Waiting for { $names }'s ad
wait-ads = Waiting for ads: { $names }
wait-resuming = Picking up again
wait-ready-terminal = press r when you're ready
wait-others-terminal = waiting for the others
wait-names-ready-terminal = ready — waiting for { $names }
wait-names-terminal = waiting for { $names }
wait-ad-terminal = waiting for { $names }'s ad
wait-ads-terminal = waiting for ads: { $names }
wait-resuming-terminal = picking up again
wait-starting-terminal = starting in { $seconds }
wait-started-terminal = here we go

# Shared roster and accessible timing descriptions.
person-you = { $name } (you)
sync-click = needs a click
sync-click-detail = Waiting for a click to start playback
sync-measuring = syncing…
sync-measuring-detail = Measuring sync
person-tune = { " " }· tune { $timing }
person-ready = { " " }· ready to start
person-relayed = { " " }· through a relay
person-direct = { " " }· direct
person-indirect = { " " }· through the others
person-tv = { " " }(TV)
person-remote = { " " }(remote)
person-round-trip = { " " }· { $milliseconds } ms round trip
person-detail = { $name }{ $role }: { $sync }{ $ready }{ $trip }{ $via }
people-alone = Just you, so far
people-count = { $count } in the room

# Browser and extension entry screens and accessible controls.
ui-together = Together
ui-watch-together-wherever-you-are = Watch together, wherever you are.
ui-start-a-room = Start a room
ui-choose-a-video-or-drop-one-anywhere = Choose a video, or drop one anywhere.
ui-invite-link = Invite link
ui-have-an-invite-link-paste-it-here = Have an invite link? Paste it here
ui-join = Join
ui-sound-early-or-late = Sound early or late?
ui-tune-it = Tune it
tune-instructions = It plays a short rising tone and listens with your microphone, about 8 seconds.
ui-microphone-level = Microphone level
ui-microphone = Microphone
ui-this-computer = This computer
ui-the-video = The video
tune-microphone-loud = The microphone is up very loud. If this comes out wrong, turn its input volume down and tune again.
ui-you-re-invited-to-watch-together = You’re invited to watch together.
ui-join-the-room = Join the room
ui-join-with-your-copy = Join with your copy
invite-own-copy = Everyone plays their own copy. Drop yours anywhere.
ui-join-on-the-site = Join on the site
invite-extension-instructions = It joins through the Together extension, in Chrome, Firefox or Safari.
ui-install-the-extension = Install the extension
ui-open-the-video = Open the video
ui-people-in-the-room = People in the room
ui-show-timings = Show timings
ui-ms = ms
ui-invite = Invite
ui-leave = Leave
ui-dismiss = Dismiss
ui-seek = Seek
ui-play = Play
ui-play-space = Play (Space)
ui-mute = Mute
ui-mute-m = Mute (M)
ui-volume = Volume
ui-full-screen = Full screen
ui-full-screen-f = Full screen (F)
ui-invite-friends = Invite friends
ui-qr-code-of-the-invite-link = QR code of the invite link
ui-copy-link = Copy link
ui-anyone-with-the-link-can-join = Anyone with the link can join.
ui-in-a-terminal = In a terminal:
ui-hide-together = Hide Together
ui-hide = Hide
ui-you-re-in-a-room-in-another-tab = You’re in a room in another tab
ui-go-there = Go there
ui-this-tab = This tab
ui-your-name = Your name
ui-or-join-a-friend-s-room = Or join a friend’s room
ui-paste-their-invite-link = Paste their invite link
ui-opening-the-room = Opening the room…
ui-watching = Watching
ui-reconnect-to-the-video = Reconnect to the video
playback-click-tab = The browser stopped the video starting. Click the video in the tab to let it play.
ui-show-qr-code = Show QR code
invite-site-hint = Anyone with the link can join. It opens this video for them.
ui-scan-to-join-on-another-device = Scan to join on another device.
ui-in-the-room = In the room

# Browser recovery, controls and tuning notices.
ui-add-your-name-first = Add your name first.
ui-drop-your-copy = Drop your copy
ui-leave-the-room-to-change-the-video = Leave the room to change the video
ui-drop-to-watch = Drop to watch
ui-that-s-not-a-video = That’s not a video
ui-that-file-isn-t-a-video = That file isn’t a video.
ui-your-name-2 = Your name:
ui-paste-the-invite-link-a-friend-sent-you = Paste the invite link a friend sent you.
ui-opening-in-together = Opening in Together…
ui-a-microphone-can-t-hear-inside-headphones = A microphone can’t hear inside headphones.
ui-tune-again = Tune again
backend-load-failed = Together couldn’t load. Reload the page to try again.
ui-that-file-couldn-t-be-opened = That file couldn’t be opened.
ui-couldn-t-open-the-room = Couldn’t open the room.
ui-check-you-both-opened-the-same-file = Check you both opened the same file.
ui-open-my-own-copy = Open my own copy
ui-back-to-start = Back to start
ui-click-to-join-in = Click to join in
ui-couldn-t-play-the-room-s-video = Couldn’t play the room’s video
ui-update-to-join = Update to join
ui-the-room-is-full = The room is full
ui-can-t-join-this-room = Can’t join this room
join-taking-time = Still trying. Is the person who invited you still in the room?
ui-can-t-stream-to-this-browser = Can’t stream to this browser
ui-open-your-own-copy-of-the-video-to-watch = Open your own copy of the video to watch.
ui-nobody-s-sharing-the-video = Nobody’s sharing the video
ui-getting-the-video = Getting the video…
ui-carries-on-after-the-ad = Carries on after the ad.
ui-carries-on-by-itself = Carries on by itself.
ui-everyone-else-left = Everyone else left
ui-invite-a-friend = Invite a friend
ui-send-them-the-link-you-ll-start-together = Send them the link. You’ll start together.
ui-exit-full-screen = Exit full screen
ui-exit-full-screen-f = Exit full screen (F)
ui-hide-timings = Hide timings
ui-link-copied = Link copied
ui-pause-space = Pause (Space)
ui-finding-the-video = Finding the video…
ui-joining-the-room = Joining the room…
ui-no-video-here-yet-open-one-then-start-or-join = No video here yet. Open one, then start or join.
extension-choose-tab = Click Together in the toolbar while on the tab you want to watch.
ui-you-re-invited-to-watch-on = You’re invited to watch on
ui-join-and-together-opens-the-video-here = Join, and Together opens the video here.
invite-incomplete = This link isn’t a whole invite. Ask for it again.
ui-waiting-for-the-tab-s-video = Waiting for the tab’s video…
ui-play-for-everyone = Play for everyone
ui-pause-for-everyone = Pause for everyone
invite-paste-whole = That isn’t a Together invite link. Copy the whole link, and paste it again.
ui-copy-the-link-from-the-box = Copy the link from the box.
ui-sound-tuned-on-time = Sound tuned: on time.
ui-tune-from-the-film = Tune from the film
ui-play-the-film-first-tuning-listens-to-it = Play the film first: tuning listens to it.
ui-listening-to-the-film = Listening to the film…
tune-tab-permission = Tuning from the film needs to hear this tab. Allow it, then try again.
tune-tab-no-sound = Chrome shared the tab without its sound. Try again and leave “Also share tab audio” on.
ui-sound-tuned-from-the-film-on-time = Sound tuned from the film: on time.
tune-learn-microphone = Together learns this microphone once, with a short rising tone. After that, the film does it.
tune-microphone-permission = Tuning needs the microphone. Tune it once to allow it.
tune-film-quiet = The film was too quiet to hear. Try again in a louder moment.
tune-film-unclear = Couldn’t hear the film clearly. Is the sound up? (A microphone can’t hear inside headphones.)
ui-this-browser-can-t-tune-from-the-film = This browser can’t tune from the film.
ui-tuning-from-the-film-stopped-try-again = Tuning from the film stopped. Try again.

countdown-starting = Starting in { $seconds }…
countdown-resuming = Carrying on in { $seconds }…
copy-done = Copied

safari-quit = Quit
safari-settings = Open Safari Settings
safari-on = Together is on in Safari.
safari-off = Turn Together on in Safari to watch with friends.
safari-unknown = Turn Together on in Safari’s Extensions settings.

# Invite recovery is a presentation concern; protocol errors remain structured.
invite-invalid-browser = That invite isn’t complete. Copy the whole link.
invite-invalid-terminal = That isn’t a Together invite link. Check it was copied whole.
invite-older = This invite is from Together 0.6. Ask the sender to update to 0.7.
invite-newer = This invite needs a newer Together.
invite-newer-terminal = Update to join: { $install }
invite-relay = via { $host } (the room’s relay)
program-youtube-off = YouTube plays on a TV for now.
program-preparing = Preparing the video…

sync-remote = remote
sync-remote-detail = A remote: controls playback, plays nothing
sync-off = not on this video
sync-off-detail = Not on the room’s video
sync-opening = opening…
sync-opening-detail = Opening the room’s video
sync-good = in sync
sync-fair = catching up
sync-poor = out of sync
sync-offset = { $side ->
    [ahead] { $amount } ahead of the room
   *[behind] { $amount } behind the room
    }
sync-uncertainty = give or take { $error }
sync-tv = TV · ±{ $error }
sync-tv-detail = TV, { sync-offset }, { sync-uncertainty }
sync-aligned-detail = In sync with the room, { sync-uncertainty }
sync-good-detail = In sync: { sync-offset }, { sync-uncertainty }
sync-offset-detail = { sync-offset }, { sync-uncertainty }

# Terminal status, with compact units left to the renderer.
terminal-opening = opening
terminal-ad = ad
terminal-buffering = buffering
terminal-tv-error = TV ±{ $error }
terminal-indirect = through the others
terminal-relayed = through a relay
terminal-about-to-play = about to play
terminal-held = held
terminal-paused = paused
terminal-playing = playing
terminal-waiting = waiting for friends
terminal-watching = { $count } watching
terminal-one-tv = { " " }+ TV
terminal-many-tvs = { " " }+ { $count } TVs
terminal-one-remote = { " " }+ remote
terminal-many-remotes = { " " }+ { $count } remotes
terminal-off = not on the room's video
terminal-loading = opening the video
terminal-starting-player = starting player
terminal-in-sync = in sync ({ $timing })
terminal-syncing = syncing ({ $timing })
terminal-catching-up = catching up ({ $timing })
terminal-invite-copied = Invite link (copied)

tune-output-untuned = { $output } hasn’t been tuned.
tune-output-on-time = Sound tuned for { $output }: on time.
tune-adjustment = { $side ->
    [late] { $milliseconds } ms late, allowed for.
   *[early] { $milliseconds } ms early, allowed for.
    }
tune-adjusted = Sound tuned: { tune-adjustment }
tune-output-adjusted = Sound tuned for { $output }: { tune-adjustment }
room-disconnected = Disconnected
room-connecting = Connecting…
room-joining = Joining…
ui-pause = Pause
ui-unmute = Unmute

# Tuning progress, results and recovery on both browser surfaces.
tune-play-denied = The browser didn't let the video play. Try again.
tune-asking-microphone = Asking for the microphone…
tune-microphone-denied = Tuning needs the microphone. Allow it, then try again.
tune-no-samples = The microphone gave nothing. Try again.
tune-checking-microphone = Checking the microphone…
tune-silent-microphone = The microphone isn’t hearing anything at all. Check it isn’t muted, then try again.
tune-listening-reference = Listening for this computer…
tune-listening-again = Listening again — that didn’t come through…
tune-reference-unheard = The microphone didn't hear { $output }. Turn that up and try again.
tune-computer-unheard = The microphone didn't hear this computer's own sound. Turn the sound up and try again.
tune-listening-video = Listening to the video…
tune-video-stopped = The video didn't play. Try again.
tune-video-unheard = The microphone didn't hear the video. Turn the sound up and try again.
tune-noisy-room = The room muddled the sound. Try again somewhere quieter.
tune-microphone-level = Microphone level { $percent }%
tune-run = Tune
tune-playing-output = Playing out of { $output }
tune-this-browser = This browser, now
tune-not-yet = Not tuned yet
tune-device-unmeasured = Rooms allow for nothing until this one is measured. Every speaker and headset is late by its own amount, so a tune of another one would be a guess.
tune-on-time = The sound is on time
tune-result = { $side ->
    [late] The sound is { $milliseconds } ms late
   *[early] The sound is { $milliseconds } ms early
    }
tune-measured = Measured { $when }, give or take { $error } ms.
tune-measured-matched = Rooms allow for it. { tune-measured }
tune-measured-unknown = Rooms allow for it, though the browser won’t say which output this is. { tune-measured }
tune-page-title = Tune the sound · Together
tune-title = Tune the sound
tune-explanation = Every browser and every speaker plays a video’s sound a little early or late. Together can measure yours and allow for it, so everyone in a room hears the same moment.
tune-privacy-instructions = It plays a short rising tone and listens with your microphone, about 8 seconds. Use the speakers you watch with, and turn the sound up. A microphone can’t hear inside headphones, so they can’t be tuned. Nothing is recorded or sent anywhere: the sound is measured here, then thrown away.
tune-forget = Forget it

# Terminal room entry and recovery.
terminal-vlc-tune = With VLC, the sound can be up to 60 ms out between screens. `together tune` fixes that.
terminal-own-relay = Through the room's own relay, where there's no direct path.
terminal-offline = Can't reach the internet yet. Friends elsewhere may not get through.
terminal-tv-playing = Your TV plays the room's video. Together keeps it in time.
terminal-wait-sharing = Waiting for someone to share the video…
terminal-wrong-file = The room's video is a different file from yours.
terminal-no-sharer = Nobody's sharing the video. Join with your own copy: together <invite> film.mkv
terminal-other-file = The room is watching a different file from yours.
terminal-streaming = Streaming the film from the room…
terminal-youtube-hint = This room is watching YouTube, which plays on a TV: together <invite> --tv
terminal-cannot-open = This player can't open the room's video.
terminal-file-missing = couldn't find “{ $path }”
terminal-youtube-title = a YouTube video
terminal-joining-title = joining a room
terminal-tuned-output = Tuned for { $output }: sound { $milliseconds } ms from what the player says
terminal-ready-keys = Press { $readyKey } when you're ready. It starts once everyone is.  { $leaveKey } to leave
terminal-share-failed = Couldn't share the video ({ $error }). Friends will need their own copy.
terminal-relay-blocked = Can't stream the video: films don't go through the public relay. Join with your own copy, or use your own relay (--relay).

# Command-line help. Command syntax and option names are never translated.
cli-help-target = A video file or YouTube link to start a room with, or an invite link to join.
cli-help-file = When joining: your copy of the video.
cli-help-name = The name others see.
cli-help-player = Which video player to use.
cli-help-tv = Use your paired TV as the player: the same as --player tv.
cli-help-relay = A relay server of your own, for when there is no direct path to a friend. Films never go through the public relays, so without a direct path this is what lets you stream.
cli-help-output-delay = Extra delay of your sound that the system can't see, in milliseconds: an HDMI receiver, Bluetooth headphones. The player is kept that far ahead, so what you hear is in time with everyone else rather than what the player's clock says.
cli-help-verbose = Show debug logs.
cli-help-player-args = Extra options for the player.
cli-examples = Examples:
    { "  together film.mkv                 Start a room, and get a link to invite friends" }
    { "  together <link>                   Join a friend's room from their invite link" }
    { "  together <link> film.mkv          Join with your own copy of the video" }
    { "  together film.mkv -- --fs         Pass options to the player after --" }
    { "  together https://youtu.be/… --tv  Start a room on a YouTube video, played on your TV" }
    { "  together <link> --tv              Join with your TV as the player" }

    { "More:" }
    { "  together setup                    Choose your video player and add Together to your browsers" }
    { "  together tune                     Measure how late your sound is, with your microphone" }
    { "  together tv pair 123456789012     Pair with your TV's YouTube app (Settings, Link with TV code)" }

cli-about = Watch videos in sync with friends. Peer-to-peer, no server, no accounts.
setup-help-player = Which player rooms should use, instead of being asked.
setup-help-yes = Take the obvious answer to everything, and ask nothing.
setup-help-no-extension = Only choose the player; leave the browsers alone.
setup-help-version = Which release's extension to install (default: this build's).
setup-about = Set this computer up: the browser extension everywhere it can go, and which player rooms use.
setup-help = Run it again whenever you install another browser or player. It never asks twice about anything you've answered.
tune-cli-help-film = A film whose container to tune for (VLC's timing depends on it).
tune-cli-help-player = Which video player to tune.
tune-cli-help-show = Show what's been measured.
tune-cli-help-forget = Forget every measurement.
tune-cli-about = Measure how late your player's sound is, with your computer's microphone, and keep it for rooms.
tune-cli-help = Run it where you watch, with the speakers you watch with. It plays a short rising tone and listens with your microphone, about 10 seconds (about 20 with VLC).
    With VLC, pass the film: VLC's timing depends on the file's container.
    For your TV (--player tv), put the computer near the TV: the TV plays a tuning video.

# Native setup journey.
setup-heading = Together { $version } setup
setup-sound = Sound
setup-sound-hint = together tune measures how late your sound is, with the microphone, and rooms steer it out.
setup-start-hint = Start a room with: together film.mkv
setup-player = Player
setup-player-selected = Rooms use { $player }.
setup-other-players = Also installed: { $players }. Change with: together setup --player <name>
setup-player-missing = No video player found. Install one, then run together setup again:
setup-choose-player = Which player should rooms use? { $players }
setup-install-macos = brew install mpv    (or IINA from https://iina.io, or VLC)
setup-install-windows = winget install mpv  (or VLC from https://videolan.org/vlc)
setup-install-linux = sudo apt install mpv    (or your distribution's mpv or vlc package)
setup-browsers = Browsers
setup-no-browsers = None found that the extension runs in.
setup-browser-failed = couldn't: { $error }
setup-firefox-waiting = waiting on Mozilla's signature; nothing to install yet
setup-firefox-opened = handed the package to Firefox; press “Add” when it asks
setup-safari-opened = installed { $path } and opened it. Tick Together in Safari's Settings → Extensions
setup-chromium-opened = extensions page open. Turn on Developer mode, press “Load unpacked”, and pick:
    { "               " }{ $path }{ $copied ->
        [yes] { "  (copied — ⌘V or Ctrl+V in the file box)" }
       *[no] { "" }
    }

# Native tuning journey.
tune-forgot-all = Forgot every tuning.
tune-none-kept = Nothing tuned yet. Run: together tune
tune-tv-instructions = Put this computer near the TV, where you sit. The TV plays the tuning video.
tune-cli-listening = Tuning { $player } on { $output }, listening with { $microphone }.
tune-cli-instructions = It plays a short rising tone and listens with your microphone, about { $seconds } seconds. Keep the volume where you watch, and the room quiet.
tune-cli-reference-heard = Heard this computer's own tone: { $microphone } and { $output } work.
tune-cli-player-stopped = { $player } opened but never reported playing the tone
tune-cli-measured = { $player }'s sound is { $delay } ms from what it reports (±{ $error } ms).
tune-cli-kept = Kept for rooms with { $player } on { $output }. See them with: together tune --show
tune-cli-stored = { $player } on { $output } ({ $container }): { $delay } ms, ±{ $error } ms, { $when }
tune-tv-scattered = The TV's tones didn't agree, { $spread } ms apart: try again somewhere quieter
tune-permission-macos = (The first time, macOS asks to let your terminal use the microphone.)
tune-permission-windows = (If nothing is heard, allow microphone access for desktop apps in Settings, Privacy, Microphone.)
tune-reference-windows = Timed by the microphone's own clock: a headset or Bluetooth microphone may add a little.
tune-reference-missing = No built-in speakers to measure the microphone by: this may be a few ms out.
tune-forget-failed = Couldn't forget the saved tuning
extension-allow-in = Let Together in
site-unknown = a website
ui-change = Change
ui-reload = Reload
cli-browser-room = This room is watching { $host } in a browser. Open the invite link in a browser with Together to join.
cli-target-not-invite = “{ $path }” isn't an invite. To join, run: together <invite> [your copy of the video]
cli-target-missing = couldn't find “{ $path }”. Pass a video file to start a room, or an invite to join one.
cli-tv-needs-youtube = A TV plays YouTube, not files: together <invite> --tv, or together <youtube link> --tv

# TV status, pairing and recovery.
tv-connecting = TV connecting
tv-reconnecting = TV reconnecting
tv-connected = TV connected
tv-ad = TV showing an ad
tv-loading = TV loading
tv-ended = TV at the end
tv-precision = TV ±{ $milliseconds } ms
tv-about = Use your TV's YouTube app as your player.
tv-help-pair = Pair with a TV. On the TV, open YouTube, then Settings, then Link with TV code.
tv-help-code = The code the TV shows.
tv-help-refresh = Get a fresh token for the paired TV.
tv-help-forget = Forget the paired TV.
tv-paired = Paired with { $name }.
tv-join-hint = Join a room with it: together <invite> --tv
tv-pair-first = No TV paired yet. Pair one: together tv pair <code>
tv-refreshed = Refreshed the pairing with { $name }.
tv-forgot = Forgot { $name }.
tv-none = No TV paired.
tv-online = on
tv-offline = off or not reachable
tv-unreachable = not reachable just now
tv-paired-status = Paired with { $name } ({ $state }).
tv-invalid-code = “{ $code }” isn't a TV code. On the TV, open YouTube, then Settings, then Link with TV code.
tv-rejected-code = The TV didn't accept that code. Codes change often: check the one on the TV now.
tv-pair-failed = YouTube couldn't pair with the TV just now ({ $status }). Try again in a moment.
tv-pair-expired = The TV's pairing has expired. Pair it again: together tv pair <code>
tv-refresh-failed = Couldn't refresh the TV's pairing ({ $status })
