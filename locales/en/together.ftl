# Room event notices. Domain errors remain structured in together-core.
extension-description = Watch any video on the web in sync with friends, wherever they are. Peer to peer and end-to-end encrypted.
name-unknown = Someone
name-local = You
member-joined = { $name } joined
member-joined-screen = { $name } joined (TV)
member-joined-remote = { $name } joined (remote)
member-left = { $name } left
member-reconnecting = { $name } is reconnecting…
changed-play = { $name } pressed play
changed-pause = { $name } paused
changed-seek = { $name } jumped to { $at }
changed-load = { $name } opened a video
media-mismatch = { $name } seems to be playing a different file
holding-local = Everyone’s waiting for your player to catch up
holding-ad-local = Everyone’s waiting for your ad to finish
holding-peer = Waiting for { $name } to catch up
holding-ad-peer = Waiting for { $name }’s ad
starting = Starting…
resuming = Picking up where we stopped
gave-up-local = The room carried on without you
gave-up-peer = Carrying on without { $name }
program-loading = Opening the video…
program-off = Can’t play the room’s video here
program-unsupported = Update to follow this room.
program-unsupported-terminal = Update to follow this room: { $install }
room-left = You left the room
room-reconnecting = Reconnecting…
room-presence-retrying = Updating the room. Retrying automatically…
room-presence-unconfirmed = Couldn’t update the room. Keep Together open.
room-reconnected = Back with everyone
room-ended = The room has ended
room-rejoin-restart = Close Together and reopen it to rejoin.
refused-newer = { $name } has a newer Together.
refused-newer-terminal = { $name } has a newer Together. Update: { $install }
refused-unknown-name = Someone here
refused-not-member = That invite no longer works.
refused-full = The room is full.
refused-other = Couldn’t join the room.
media-mismatch-browser = { $name } may be watching a different video
program-off-browser = Can’t play this video here.
refused-other-browser = Couldn’t join the room.
ready-count = { $count } of { $total } ready

# Holds and readiness, shared by native and browser presentation.
names-list = { $rest } and { $last }
# $names is the first two names, comma-separated; $count is the remaining count.
names-and-others = { $count ->
    [one] { $names } and { $count } other
   *[other] { $names } and { $count } others
    }
wait-stalled = Waiting for { $names } to catch up
wait-ad = Waiting for { $names }’s ad
wait-ads = Waiting for ads: { $names }
wait-resuming = Picking up again
wait-names-terminal = waiting for { $names }
wait-ad-terminal = waiting for { $names }’s ad
wait-ads-terminal = waiting for ads: { $names }
wait-resuming-terminal = picking up again
wait-starting-terminal = starting in { $seconds }
wait-started-terminal = here we go

# Shared roster and accessible timing descriptions.
person-you = { $name } (you)
ui-click-to-play = Click to play
sync-measuring = syncing…
sync-measuring-detail = Measuring sync
person-tune = { " " }· tune { $timing }
person-detail = { $name }{ $role }: { $sync }{ $ready }{ $trip }{ $via }
people-alone = Just you, so far
people-count = { $count } in the room

# Browser and extension entry screens and accessible controls.
ui-together = Together
ui-watch-together-wherever-you-are = Together, wherever.
ui-start-a-room = Start a room
ui-open-a-video = Open a video
ui-choose-a-video-or-drop-one-anywhere = Choose a video, or drop one anywhere.
ui-invite-link = Invite link
ui-paste-an-invite-or-video-link = Paste an invite or video link
ui-join = Join
ui-sound-early-or-late = Sound early or late?
ui-tune-the-sound = Tune the sound
ui-microphone-level = Microphone level
ui-microphone = Microphone
ui-this-computer = This computer
ui-the-video = The video
tune-microphone-loud = The microphone is up very loud. If this comes out wrong, turn its input volume down and tune again.
ui-you-re-invited-to-watch-together = You’re invited to watch together.
ui-join-the-room = Join the room
ui-use-my-copy = Use my copy
invite-own-copy = Everyone plays their own copy. Drop yours anywhere.
ui-join-on-the-site = Join on the site
invite-on-site = Your friend is watching on { $site }.
invite-extension-instructions = It joins through the Together extension, in Chrome or Safari.
ui-install-the-extension = Install the extension
ui-open-the-video = Open the video
ui-people-in-the-room = People in the room
ui-show-timings = Show timings
ui-invite = Invite
ui-leave = Leave room
ui-dismiss = Dismiss
ui-seek = Seek
ui-play = Play
ui-play-space = Play (Space)
ui-mute = Mute
ui-mute-m = Mute (M)
ui-volume = Volume
ui-full-screen = Full screen
ui-full-screen-f = Full screen (F)
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
ui-opening-the-room = Opening the room…
ui-nothing-playing = Nothing’s playing yet
tv-empty-room-choice = Choose a video on your phone.
ui-watching = Watching
ui-reconnect-to-the-video = Reconnect to the video
ui-show-qr-code = Show QR code
invite-site-hint = Anyone with the link can join. It opens this video for them.
ui-scan-to-join-on-another-device = Scan to join on another device.
ui-in-the-room = In the room

# Browser recovery, controls and tuning notices.
ui-add-your-name-first = Add your name first.
ui-leave-the-room-to-change-the-video = Leave the room to change the video
ui-drop-to-watch = Drop to watch
ui-that-s-not-a-video = That’s not a video
ui-that-file-isn-t-a-video = That file isn’t a video.
ui-your-name-2 = Your name:
ui-opening-in-together = Opening in Together…
ui-a-microphone-can-t-hear-inside-headphones = A microphone can’t hear inside headphones.
backend-load-failed = Together couldn’t load. Reload the page to try again.
ui-that-file-couldn-t-be-opened = That file couldn’t be opened.
ui-couldn-t-open-the-room = Couldn’t open the room.
room-open-failed = Couldn’t open the room. Check your connection and try again.
media-unsupported = This browser can’t play that video. MP4 (H.264) and WebM work everywhere.
media-unreadable = That video couldn’t be opened. Try another copy.
stream-insecure = This browser can only stream over a secure connection. Use your copy instead.
stream-no-start = Streaming didn’t start. Reload and try again, or use your copy.
stream-failed = The room’s copy stopped coming through. Use your copy to keep watching.
playback-failed = The video stopped playing on this computer. Open it again to carry on.
ui-check-you-both-opened-the-same-file = Check you both opened the same file.
ui-back-to-start = Back to start
ui-rejoin-the-room = Rejoin
own-copy-slow = That file took too long to check. Try another copy.
own-copy-other = That’s a different video from the room’s. Choose the same video to watch together.
own-copy-unknown = The room isn’t showing a video that file could be checked against.
own-copy-local = Playing from your own copy.
own-copy-changed = The room changed videos while your copy was checked. Choose it again if it’s the one.
own-copy-not-switched = Your copy couldn’t take over playback, so the room’s copy plays on.
ui-couldn-t-play-the-room-s-video = Couldn’t play the room’s video
ui-update-to-join = Update to join
ui-the-room-is-full = The room is full
ui-can-t-join-this-room = Can’t join this room
join-taking-time = Still trying. Is the person who invited you still in the room?
ui-can-t-stream-to-this-browser = Can’t stream to this browser
ui-open-your-own-copy-of-the-video-to-watch = Use your copy of the video to watch.
ui-nobody-s-sharing-the-video = Nobody’s sharing the video
ui-getting-the-video = Getting the video…
ui-everyone-else-left = Everyone else left
ui-send-them-the-link-you-ll-start-together = Send them the link. You’ll start together.
ui-exit-full-screen = Exit full screen
ui-exit-full-screen-f = Exit full screen (F)
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
ui-pause = Pause
invite-paste-whole = That isn’t a Together invite link. Copy the whole link, and paste it again.
ui-copy-the-link-from-the-box = Copy the link from the box.
ui-sound-tuned-on-time = Sound tuned: on time.
tune-listening-video = Listening to the video…
tune-tab-permission = Tuning from the video needs to hear this tab. Allow it, then try again.
tune-video-on-time = Sound tuned from the video: on time.
tune-microphone-permission = Tuning needs the microphone. Tune the sound once to allow it.
tune-video-stopped = Tuning from the video stopped. Try again.

countdown-starting = Starting in { $seconds }…
copy-done = Link copied

safari-quit = Quit
settings-safari-turn-on = Turn on…
safari-on = Together is on in Safari.
safari-off = Turn Together on in Safari to watch with friends.
safari-unknown = Turn Together on in Safari’s Extensions settings.
ios-enable-title = Turn on Together
ios-settings-modern = Settings › Apps › Safari
ios-settings-legacy = Settings › Safari
ios-settings-extension = Extensions › Together
ios-video-title = Choose a video
ios-video = In Safari’s page menu, tap Together. Allow access to the website.
ios-room = Share the invite link. Press Play to begin.
ios-open = Open Together
ios-foreground = Keep Safari open while you watch.

# Invite recovery is a presentation concern; protocol errors remain structured.
invite-invalid-browser = That invite isn’t complete. Copy the whole link.
invite-invalid-terminal = That isn’t a Together invite link. Check it was copied whole.
invite-older = This invite is from Together 0.6 or earlier. Ask whoever sent it to update.
invite-newer = This invite needs a newer Together.
invite-newer-terminal = Update to join: { $install }
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
terminal-off = not on the room’s video
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
room-connecting = Connecting…
room-joining = Joining…
ui-unmute = Unmute

# Tuning progress, results and recovery on both browser surfaces.
tune-play-denied = The browser didn’t let the video play. Try again.
tune-asking-microphone = Asking for the microphone…
tune-microphone-denied = Allow the microphone for this site in your browser’s website settings, then try again.
tune-microphone-missing = Connect a microphone, then try again.
tune-microphone-busy = Another app is using the microphone. Close it, then try again.
tune-microphone-failed = The microphone couldn’t start. Check that it works in your browser, then try again.
tune-no-samples = The microphone gave nothing. Try again.
tune-checking-microphone = Checking the microphone…
tune-silent-microphone = The microphone isn’t hearing anything at all. Check it isn’t muted, then try again.
tune-listening-reference = Listening for this computer…
tune-listening-again = Listening again — that didn’t come through…
tune-reference-unheard = The microphone didn’t hear { $output }. Turn that up and try again.
tune-computer-unheard = The microphone didn’t hear this computer’s own sound. Turn the sound up and try again.
tune-video-unheard = The microphone didn’t hear the video. Turn the sound up and try again.
tune-noisy-room = The room muddled the sound. Try again somewhere quieter.
tune-failed = Tuning didn’t finish. Try again.
tune-storage-failed = Couldn’t reach the saved tune. Reload and try again.
tune-microphone-level = Microphone level { $percent }%
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
terminal-own-relay = Room messages use the chosen relay where there’s no direct path.
terminal-offline = Can’t reach the internet yet. Friends elsewhere may not get through.
terminal-tv-playing = Your TV plays the room’s video. Together keeps it in time.
terminal-wait-sharing = Waiting for someone to share the video…
terminal-wrong-file = The room’s video is a different file from yours.
terminal-no-sharer = Nobody’s sharing the video. Use your copy: together <invite> video.mkv
terminal-other-file = The room is watching a different file from yours.
terminal-streaming = Streaming the video from the room…
terminal-youtube-hint = This room is watching YouTube. Join with your paired YouTube TV: together <invite> --youtube-tv
terminal-cannot-open = This player can’t open the room’s video.
terminal-file-missing = couldn’t find “{ $path }”
terminal-youtube-title = a YouTube video
terminal-joining-title = joining a room
terminal-tuned-output = Tuned for { $output }: sound { $milliseconds } ms from what the player says
terminal-playback-keys = Press { $playKey } to play, { $pauseKey } to pause, or { $leaveKey } to leave.
terminal-share-failed = Couldn’t share the video ({ $error }). Friends will need their own copy.
terminal-relay-blocked = You can’t receive this video: your connection uses a relay that isn’t enabled for video. Open your own copy to watch.

# Command-line help. Command syntax and option names are never translated.
cli-help-target = A video file or YouTube link to start a room with, or an invite link to join.
cli-help-file = When joining: your copy of the video.
cli-help-name = The name others see.
cli-help-help = Show help.
cli-help-player = Which video player to use.
cli-help-tv = Play YouTube on your paired TV.
cli-help-relay = A relay address for room messages and voice. Choosing a relay does not enable film or camera video.
cli-help-output-delay = Extra delay of your sound that the system can’t see, in milliseconds: an HDMI receiver, Bluetooth headphones. The player is kept that far ahead, so what you hear is in time with everyone else rather than what the player’s clock says.
cli-help-verbose = Show debug logs.
cli-help-player-args = Extra options for the player.
cli-start-card =
    { "  together film.mkv          Start a room" }
    { "  together <link> [film.mkv]  Join a room" }
    { "  together setup             Choose your player and browsers" }
    { "  together tune              Tune your sound" }
cli-examples = Examples:
    { cli-start-card }
cli-no-player = No video player found. Install one, then run together setup:
    { "  mpv   https://mpv.io/installation" }
    { "  IINA  https://iina.io (macOS)" }
    { "  VLC   https://www.videolan.org/vlc" }
cli-player-missing = Couldn’t find { $player }. Is it installed?

cli-about = Watch videos in sync with friends. Peer-to-peer, no server, no accounts.
setup-help-player = Which player rooms should use, instead of being asked.
setup-help-yes = Take the obvious answer to everything, and ask nothing.
setup-help-no-extension = Only choose the player; leave the browsers alone.
setup-help-version = Which release’s extension to install (default: this build’s).
setup-about = Set this computer up: the browser extension everywhere it can go, and which player rooms use.
setup-help = Run it again whenever you install another browser or player. It never asks twice about anything you’ve answered.
tune-cli-help-video = A video whose container to tune for (VLC’s timing depends on it).
tune-cli-help-player = Which video player to tune.
tune-cli-help-show = Show what’s been measured.
tune-cli-help-forget = Forget every measurement.
tune-cli-about = Measure how late your player’s sound is, with your computer’s microphone, and keep it for rooms.
tune-cli-help = Run it where you watch, with the speakers you watch with. It plays a short rising tone and listens with your microphone, about 11 seconds (about 20 with VLC).
    With VLC, pass the film: VLC’s timing depends on the file’s container.
    For your TV (--player tv), put the computer near the TV: the TV plays a tuning video.

# Native setup journey.
setup-heading = Together { $version } setup
setup-sound = Sound
setup-sound-hint = together tune measures how late your sound is, with the microphone, and rooms steer it out.
setup-start-hint = Start a room with: together video.mkv
setup-player = Player
setup-player-selected = Rooms use { $player }.
setup-other-players = Also installed: { $players }. Change with: together setup --player <name>
setup-player-missing = No video player found. Install one, then run together setup again:
setup-choose-player = Which player should rooms use? { $players }
setup-install-macos = brew install mpv    (or IINA from https://iina.io, or VLC)
setup-install-windows = winget install mpv  (or VLC from https://videolan.org/vlc)
setup-install-linux = sudo apt install mpv    (or your distribution’s mpv or vlc package)
setup-browsers = Browsers
setup-no-browsers = None found that the extension runs in.
setup-browser-failed = couldn’t: { $error }
setup-browsers-incomplete = Browser setup failed for { $names }. Successful installations were kept. Run together setup to try again.
setup-safari-intel-unsupported = The Together Mac app requires Apple Silicon. Use the Together CLI or Chrome on this Intel Mac.
setup-firefox-unsupported = Firefox is not supported in Together 0.11; use Chrome or Safari
browser-open-link = Link to open in another browser
browser-firefox-unsupported-title = Firefox is not supported in Together 0.11
browser-firefox-unsupported = Open this link in Chrome or Safari to watch together. Firefox support may return in a future release.
setup-safari-opened = installed { $path } and opened it. Tick Together in Safari’s Settings → Extensions
setup-chromium-opened = extensions page open. Turn on Developer mode, press “Load unpacked”, and pick:
    { "               " }{ $path }{ $copied ->
        [yes] { "  (copied — ⌘V or Ctrl+V in the file box)" }
       *[no] { "" }
    }

# Native tuning journey.
tune-forgot-all = Forgot every tuning.
tune-none-kept = Nothing tuned yet. Run: together tune
tune-cli-listening = Tuning { $player } on { $output }, listening with { $microphone }.
tune-cli-instructions = It plays a short rising tone and listens with your microphone, about { $seconds } seconds. Keep the volume where you watch, and the room quiet.
tune-cli-reference-heard = Heard this computer’s own tone: { $microphone } and { $output } work.
tune-cli-player-stopped = { $player } opened but never reported playing the tone
tune-cli-measured = { $player }’s sound is { $delay } ms from what it reports (±{ $error } ms).
tune-cli-kept = Kept for rooms with { $player } on { $output }. See them with: together tune --show
tune-cli-stored = { $player } on { $output } ({ $container }): { $delay } ms, ±{ $error } ms, { $when }
tune-tv-scattered = The TV’s tones didn’t agree, { $spread } ms apart: try again somewhere quieter
tune-permission-macos = (The first time, macOS asks to let your terminal use the microphone.)
tune-permission-windows = (If nothing is heard, allow microphone access for desktop apps in Settings, Privacy, Microphone.)
tune-reference-windows = Timed by the microphone’s own clock: a headset or Bluetooth microphone may add a little.
tune-reference-missing = No built-in speakers to measure the microphone by: this may be a few ms out.
tune-forget-failed = Couldn’t forget the saved tuning
site-unknown = a website
ui-change = Change
ui-reload = Reload
cli-browser-room = This room is watching { $host } in a browser. Open the invite link in a browser with Together to join.
cli-target-not-invite = “{ $path }” isn’t an invite. To join, run: together <invite> [your copy of the video]
cli-target-missing = couldn’t find “{ $path }”. Pass a video file to start a room, or an invite to join one.
cli-tv-needs-youtube = YouTube TV plays YouTube, not files: together <invite> --youtube-tv, or together <YouTube link>

# TV status, pairing and recovery.
tv-connecting = TV connecting
tv-reconnecting = TV reconnecting
tv-connected = TV connected
tv-ad = TV showing an ad
tv-loading = TV loading
tv-ended = TV at the end
tv-precision = TV ±{ $milliseconds } ms
tv-about = Use your TV’s YouTube app as your player.
tv-help-pair = Pair with a TV. On the TV, open YouTube, then Settings, then Link with TV code.
tv-help-code = The code the TV shows.
tv-help-refresh = Get a fresh token for the paired TV.
tv-help-forget = Forget the paired TV.
tv-paired = Paired with { $name }.
tv-join-hint = Join a room with it: together <invite> --youtube-tv
tv-pair-first = YouTube plays on your TV. Pair it once: together youtube-tv pair <code>
tv-refreshed = Refreshed the pairing with { $name }.
tv-forgot = Forgot { $name }.
tv-none = No TV paired.
tv-online = on
tv-offline = off or not reachable
tv-unreachable = not reachable just now
tv-paired-status = Paired with { $name } ({ $state }).
tv-invalid-code = “{ $code }” isn’t a TV code. On the TV, open YouTube, then Settings, then Link with TV code.
tv-rejected-code = The TV didn’t accept that code. Codes change often: check the one on the TV now.
tv-pair-failed = YouTube couldn’t pair with the TV just now ({ $status }). Try again in a moment.
tv-pair-expired = The TV’s pairing has expired. Pair it again: together youtube-tv pair <code>
tv-refresh-failed = Couldn’t refresh the TV’s pairing ({ $status })

# Native media controls; shared room labels above are reused.
ios-player-position = Playback position
ios-player-audio = Audio track
ios-player-subtitles = Subtitles
ios-player-fit = Fit video
ios-player-fill = Fill screen
ios-track-audio-unavailable = This video doesn’t have audio in your language. Playing its usual track.
ios-track-audio-unlabelled = This video doesn’t label its audio languages. Playing its usual track.
ios-track-audio-unplayable = Audio in your language can’t play here. Playing the video’s usual track.
ios-track-audio-description-unavailable = This video has audio in your language, but no audio description. Playing its usual track.
ios-track-audio-ordinary-unavailable = This video has your language only as audio description. Playing its usual track.
ios-track-audio-changed = This video’s audio track can no longer be read, so it stopped rather than switch language.
ios-track-subtitles-unavailable = This video doesn’t have subtitles in your language.
ios-track-subtitles-unlabelled = This video doesn’t label its subtitle languages.
ios-track-subtitles-unplayable = These subtitles can’t be shown on this device.
ios-track-subtitles-off = Off
ios-track-audio-choice-unplayable = That audio track can’t play here.
movie-track-number = Track %1$ld
ios-track-audio-description = Audio description

# Private programme audio on this device, independent of TV and voice sound.
private-audio-listen = Listen on this device
private-audio-preparing = Preparing headphone audio…
private-audio-headphones = Sound on headphones
private-audio-stop = Stop listening here
private-audio-destination-required = Connect your headphones, then choose to listen here again. TV sound stays as it is.
private-audio-unavailable = Couldn’t play this video’s audio on your headphones. Choose to listen here again when they are connected.
private-audio-cleanup-pending = Couldn’t finish stopping headphone audio.
ios-player-open = Open link
ios-player-file = Open file
ios-player-safari = Open in Safari
ios-player-busy = The player is busy. Try again.
ios-player-importing = Opening your file…

ios-player-licenses = Open-source licenses

ios-player-share-https = Use an HTTPS link or open a file to share this video.

tv-back-ten = Back 10 seconds
tv-forward-ten = Forward 10 seconds
tv-back-seconds = Back %1$ld seconds
tv-forward-seconds = Forward %1$ld seconds
tv-page-on-phone = Open this video’s page on your phone or computer.

# Device pairing is independent of joining or controlling a room.
settings-phones = Phones
screen-pair-instructions = Compare this code with the one on your TV, then approve it on the TV.
screen-compare-identity = Approve only if this code matches the one on your phone.
screen-awaiting-approval = Connecting to your TV…
screen-approved = Your phone is approved for this TV.
screen-pair-failed = Could not connect. Scan again to retry.
screen-pair-session = The TV can approve this session or remember your phone.
screen-approve = Approve phone
screen-deny = Decline
screen-revoke = Remove phone access
screen-close = Close
screen-tv-unavailable = Phone connections are unavailable.
screen-retry = Try again
screen-watch-tv = Watch on TV

screen-remember = Remember this phone
screen-remembered = Remembered phone
screen-storage-failed = Couldn’t save phone access. Try again.
screen-approval-options = Approve for this TV session, or remember this phone for next time.

screen-tv = TV
screen-phone = Phone
screen-tablet = Tablet
screen-computer = Computer
screen-browser = Browser
screen-device = Device
screen-nearby-title = Nearby TVs
screen-searching = Looking for TVs…
screen-discovery-failed = Couldn’t look for TVs. Check local network access in Settings, or scan the code on your TV.
screen-none-nearby = No TVs found nearby.
screen-recent-title = Recent TVs
screen-forget = Remove from recent TVs
screen-not-nearby = Not found nearby
screen-choose-another = Choose another TV
screen-discovery-help = Open Together on your TV, or scan its QR code with your phone’s camera.
screen-choose-watching = Choose what to watch
screen-replace-warning = This TV is already in a room. Replace what it is watching?
screen-replace-confirm = Replace TV playback
screen-moving = Getting the TV ready…
screen-source-foreground = If this phone is sharing a file, keep Together open and the phone awake while watching.
screen-move-failed = Couldn’t move playback. Your phone is still available; try again.
screen-move-uncertain = The TV has not confirmed the switch. This phone stays silent to avoid playing twice.
screen-move-complete = Watching on TV. Use this phone to control the room.


ios-player-relay-blocked = Waiting for a video connection. Trying again…

# One entry flow accepts a whole message; recognition does not claim source readiness.
entry-input-too-long = That message is too long. Paste the part containing the link.
entry-too-many-choices = There are too many links. Paste the one you want to open.
entry-no-choice = That isn't an invite or a video link.
entry-choose = Choose the link you want to open.
entry-invite = Join a room
entry-video-link = Video link
entry-photos = Photos
entry-files = Files
entry-source-needs-preparation = This link needs to be checked before it can play. You can open it in your browser.
entry-source-checking = Checking the video…
entry-source-receiving = Receiving the video…
entry-source-browser = This link needs to be opened in your browser.
entry-source-live = This live video can’t play here yet. You can open it in your browser.
entry-source-protected = This video requires access. Open it in your browser.
entry-source-not-found = This video couldn’t be found. Check the link or open it in your browser.
entry-source-expired = This video link has expired. Get a new link or open it in your browser.
entry-source-unavailable = This video is unavailable right now. Try again or open it in your browser.
entry-source-access = This link can’t be opened here. You can open it in your browser.
entry-source-too-large = This video is too large to prepare here. You can open it in your browser.
entry-source-timeout = The video took too long to prepare. Try again or open it in your browser.
entry-source-format = This video format can’t play here. You can open it in your browser.
entry-source-storage = The video couldn’t be saved. Check available space and try again.
entry-source-cancelled = Video preparation was cancelled.
entry-source-failed = The video couldn’t be prepared. Try again or open it in your browser.
entry-source-copy-mismatch = This copy doesn’t match the room’s video. Choose the same video or stream from the room.
entry-qr-image-invalid = That image couldn’t be opened. Try another image.
entry-qr-image-too-large = That image is too large. Choose a smaller image.
entry-qr-no-code = No QR code was found. Try another image.
entry-placeholder = Paste an invite or video link…
entry-open-qr-image = Open QR image
entry-scan-qr-code = Scan QR code
entry-qr-camera-help = Point the camera at a room or TV QR code.
entry-qr-zoom = Zoom
entry-qr-zoom-hint = Far from the screen? Zoom in, or pinch.
entry-qr-camera-denied = Allow camera access in Settings to scan a QR code, or open a saved QR image.
entry-qr-camera-unavailable = Camera scanning is unavailable on this device. You can open a saved QR image.
camera-permission-purpose = Together uses your camera when you turn on participant video or choose to scan a room or TV QR code.
entry-open-settings = Open Settings
entry-open-another = Open another link or file…
entry-cancel = Cancel
entry-checking-video = Checking the video…
entry-replace-question = Leave this room and join the prepared room?
entry-replace = Join this room
ui-more = More
ui-about = About Together
settings-about-title = About
about-version = Version
remote-testing-allow = Allow remote testing
av-sync-settings-pending = Your settings are saved. Waiting for the player to apply them.
screen-sharing-keeps-awake = Keeping the screen on while you share this video
remote-testing-badge = Testing
remote-testing-developer-mode = Developer mode
diagnostic-knock = Knock
diagnostic-skew = Skew
diagnostic-sample = Sample
diagnostic-rate-matrix = Rate matrix

# macOS uses native menus for setup and credits, keeping the watching surface quiet.
mac-about = About Together
ui-options = Options
ui-room = Room
mac-open-another = Open another link or file…
mac-open-video = Open Video…
mac-open-link = Open Link…
mac-playback = Playback
mac-play-pause = Play/Pause
mac-entry-placeholder = Paste an invite or video link…
mac-cancel = Cancel
mac-replace-question = Leave this room and join the prepared room?
mac-replace = Join this room

# Approved compact identity phrase boundaries. Keep punctuation and translate
# these with the complete tagline; apps never split a translation by spaces.
brand-tagline-together = Together,
brand-tagline-wherever = wherever.

# Native TV surfaces
tv-open-link = Open a link
# TV Home polish
tv-first-run-title = Together
tv-first-run-line = Scan the code with your iPhone, and this TV joins in.
tv-home-hint = Open a video or an invite on your iPhone. It plays here.
tv-open-link-phone = Your iPhone is faster. Open it there and it plays here.
tv-rename-hint = Left and right choose · Select keeps it · Back cancels
tv-room-living-room = Living Room
tv-room-bedroom = Bedroom
tv-room-kitchen = Kitchen
tv-room-den = Den
tv-room-office = Office
tv-room-studio = Studio
tv-approve-title = Let %1$@’s iPhone control this TV?
tv-approve-body = %1$@ joined with the room’s code. Allowing lets them choose what plays here and change subtitles and sound.
tv-approve-everyone = Everyone in the room can already watch, talk, play and pause.
tv-approve-tonight = Just for Tonight
tv-approve-always = Always Allow
tv-approve-deny = Don’t Allow
tv-approve-this-phone = this phone
tv-connect-phone = Scan to watch on this TV
tv-link-label = Invite or video link
tv-link-hint = Type a link
tv-link-phone-hint = Type faster on your iPhone: tap the Apple TV Keyboard notification.


screen-camera-open = Open Together to connect to this TV. You’ll approve the connection on the TV.
screen-open-app = Open Together
screen-download-app = Get Together for your phone
screen-download-unavailable = A public phone download isn’t available yet.
screen-after-install = After installing, return here and open Together, or scan the TV again.
screen-camera-invalid = This TV link is invalid. Scan the current code on the TV again.
screen-enable-javascript = Enable JavaScript to open this TV in Together.

tv-show-controls = Show playback controls

# Incoming Share saves an owned batch; continuing in Together is explicit.
share-save = Save to Together
share-introduction = Save this link, message or video, then open Together to continue.
share-saving = Saving to Together…
share-saved = Saved. Open Together to choose what to open.
share-save-uncertain = This share was saved, but storage hasn’t confirmed it. Open Together to check before sharing it again.
share-inbox-full = Together has too many unopened shares. Open Together and use or remove one, then try again.
share-too-large = This video is too large to save. Choose a smaller video.
share-storage = There isn’t enough storage to save this video. Free some space, then try again.
share-timeout = Saving took too long. Try again when the item is available.
share-invalid = Share up to 16 links, messages or videos at a time. Keep shared text under 64 KB.
share-unsupported = This item couldn’t be saved. Share a link, message or video file.
share-unavailable = Together couldn’t save this share. Try again.
share-saved-items = Saved to Together
share-open = Open
share-saved-items-unavailable = Together couldn’t open saved shares. Try opening Together again.
share-open-unavailable = Saved to Together, but the app couldn’t open. Open Together and choose the item in Saved to Together.
share-remove = Remove
share-remove-failed = This share couldn’t be removed. Try again.
share-empty = No unopened shares.
share-damaged = This saved share couldn’t be read. You can remove it and share the item again.

# Explicit CLI entry; automatic file, invite and YouTube forms remain available.
cli-host-about = Start a room with a video file.
cli-join-about = Join a room with an invite link.
cli-host-file = The video file to share. Use ./-name for a filename starting with a dash.
cli-join-invite = The invite link for the room.
cli-invalid-environment = { $name } has an invalid value. Change it or pass the matching command-line option.

# Local private-file retirement; no filenames or private paths are displayed.
import-cleanup-pending = Some imported files still need cleanup.
import-cleanup-retry = Retry file cleanup
import-cleanup-waiting-for-output = Cleanup is waiting for playback to stop.

# Room conversation. Admission describes only the local outgoing queues.
ui-messages = Messages
conversation-close = Close messages
conversation-unread = Messages, unread messages
conversation-message = Message
conversation-send = Send
conversation-write-on-phone = Write messages from the Together app on your phone.
conversation-truncated = Earlier messages are no longer in this room’s history.
conversation-unavailable = Messages aren’t available right now.
conversation-ready = Ready to write
conversation-pending = Sending…
conversation-refused = No connected device accepted this message. Your text is kept below.
conversation-no-recipients = No one else in this room can receive messages yet. Invite someone using Together to chat.
conversation-unsupported = A connected device doesn’t support Messages. Update Together on that device, then send again.
conversation-connecting = Messages are still connecting to the other devices. Your text is kept below.
conversation-view-changed = The video changed before this message could be sent. Check your text, then send again.
conversation-invalid-text = This message contains unsupported characters. Edit it, then send again.
conversation-too-long = This message is too long. Shorten it, then send again.
conversation-queued = On its way.
conversation-alone = No one else is here yet, so this wasn’t sent.
conversation-waiting-for-video = Messages open once the video is ready on this device.
conversation-unknown-author = Someone
conversation-full = Too many messages are waiting to send. This one wasn’t sent.

# Safari native file hosting. Native consent and retirement remain authoritative.
native-host-cancel = Stop sharing
native-host-refresh = Check again
ui-open-a-file = Open a file…
native-host-unavailable = Couldn’t open Together. Open it, then try again.
native-host-reconnect = Open Together, then check again.
native-host-consent = Choose a file in Together.
native-host-hosting = Sharing the file.
native-host-stopping = Stopping…
native-host-cancelled = Cancelled.
native-host-expired = Choose the file again.
native-host-ended = Sharing ended.

# Voice belongs to the current watching room and starts only by explicit choice.
room-voice-talk = Talk
room-voice-joining = Starting Talk…
room-voice-microphone-live = Microphone on
room-voice-listening = Listening; microphone unavailable
room-voice-headphones = Connect headphones to use room Talk.
room-voice-unavailable = Talk unavailable

# Participant camera: capture remains explicit and demand-driven.
camera-title = Camera
camera-state-off = Camera off
camera-state-asking = Waiting for camera permission
camera-state-on = Camera on
camera-state-unavailable = Camera unavailable
camera-relay-blocked = Camera video needs a direct connection: this relay isn’t enabled for video.
camera-your-preview = You
camera-participant = Participant
camera-show-portraits = Show portraits
camera-hide-portraits = Hide portraits
room-voice-off = Talk off
room-voice-browser-unavailable = Talk is unavailable in this browser.
room-voice-output-unavailable = Talk paused. Choose Resume to hear and talk again.
room-voice-leaving = Turning Talk off…
room-voice-microphone-off = Talk is on; microphone off


# Safari's retained original room owner.
owner-title = Together
owner-tab-title = { $count ->
    [one] Together: 1 room
   *[other] Together: { $count } rooms
    }
owner-lifetime = Together keeps your room connected in this pinned tab. Return to your video to watch.
owner-running = Your rooms are running in this tab.
owner-empty = No rooms yet. Start or join a room from the Together popup.
owner-return = Return to { $title }
owner-untitled = watched tab
owner-tab-gone = That watched tab is no longer available.
owner-unavailable = This room owner could not connect. Close this tab and try again from the Together popup.

extension-voice-preparing = Preparing Talk controls…
extension-voice-policy-unavailable = Talk needs a qualified browser profile. You can keep watching together.
live-label = Live
live-go-live = Go live
live-position-unavailable = This position is no longer available.
live-earliest = Earliest available

lab-badge = Lab
lab-leave = Leave lab

# Local Developer-mode lab admission. These are observed on this device only.
lab-admission-finish-entry = Finish choosing a video or room to join the lab.
lab-admission-closing = Waiting for the previous room to close.
lab-admission-cleanup-failed = The previous video could not close. Check the cleanup message before joining the lab.
lab-admission-retry = The lab is unavailable. Trying again soon.
lab-admission-open-link = Open the lab link once on this device to join automatically.
lab-admission-invalid-link = The saved lab invitation is invalid. Open the lab link again.
lab-admission-read-failed = The saved lab invitation could not be read. Open the lab link again.
# Apple adjustable playback position; changes the shared room programme.
playback-position-of-duration = %1$@ of %2$@
playback-duration-unavailable = Duration unavailable
playback-accessible-seek-hint = Adjust by ten seconds for everyone in the room.

quit-in-progress = Together is leaving. Keep this window open, then choose Quit again.
quit-wait-expired = Leaving is taking longer than expected. Keep this window open while cleanup finishes, then choose Quit again.
quit-leave-failed = Together could not finish leaving. Keep the app open or use the Mac’s Force Quit.

# Exact room interruption offer; votes count present attribution holders, paired Screen/Remote once.
interruption-audio = audio was interrupted
interruption-headphones = headphones disconnected
interruption-offer = Paused for { $name }: { $reason }. Resume: { $votes } of { $needed } votes.

interruption-origin-left = { $name } left, so anyone can resume.

background-output-cleanup-pending = Playback is still stopping. Return to the room after it finishes, or leave.
background-voice-recovery-pending = Playback has stopped. Talk is still recovering. Leave the room if it does not recover.

# Local Developer-mode owner parameters. Whole seconds; compiled defaults are unchanged.
developer-apple-owners = Apple owner parameters
settings-title = Settings
settings-name = Name
settings-tvs = TVs
settings-safari = Together in Safari
settings-sound = Sound
settings-tune-sound-action = Tune the sound…
settings-safari-on = On
settings-safari-off = Off
settings-safari-checking = Checking…
settings-safari-unavailable = Unavailable
settings-tv-tune-phone = Hold your phone where you sit to tune the TV’s sound.
developer-progressWaitSeconds = Progress wait
developer-cameraPermissionWaitSeconds = Camera permission wait
developer-backgroundAllowanceSeconds = Background allowance
developer-orderedQuitWaitSeconds = Quit wait
developer-accessibleSeekStepSeconds = VoiceOver seek step
developer-tvSeekStepSeconds = TV seek step
developer-owner-seconds = %1$ld seconds
developer-owner-busy = Finish the active test and try changing the value again.
developer-owner-done = Done

system-audio-route = Choose audio output
system-audio-tv-volume = Use the TV or its remote to change TV volume.

# TV Back confirmation. Actual default focus is independently qualified.
tv-leave-room-title = Leave room?
ui-stay = Stay

# Original operation UI deadline; work and cleanup remain with their owner.
progress-room-timeout = Trying again
progress-source-timeout = Opening this source is taking longer than expected. Cancel and try opening it again.
progress-import-timeout = Opening this file is taking longer than expected. Cancel before trying again.
progress-playback-preparing = Getting the video ready…
progress-playback-timeout = Trying again
progress-entry-timeout = Opening this room is taking longer than expected. Cancel and try joining again.

playback-command-unavailable = Playback controls are unavailable. Open the room and try again.
playback-control-retry = Playback changed before this control arrived. Try the control again.

entry-qr-camera-checking = Waiting for camera permission…
entry-qr-camera-wait = Camera permission is still pending. Answer the system prompt, open a QR image, or close the scanner.

interruption-resume = Resume

progress-private-timeout = Preparing headphone audio is taking longer than expected. Stop listening here before trying again.

system-audio-receiver-volume = Use the selected device or its remote to change volume.

# Voice is explicit; the microphone button joins, then toggles capture while listening continues.
room-voice-cancel = Cancel
room-voice-retry-microphone = Try microphone again
room-voice-retry-output = Resume
room-voice-permission-denied = Microphone blocked. Allow microphone access in your browser, then try again. You can still listen.
room-voice-microphone-missing = No microphone found. Connect one, then try again. You can still listen.
room-voice-microphone-busy = Microphone in use. Close the other app, then try again. You can still listen.
room-voice-microphone-lost = Microphone disconnected. Connect it, then try again. You can still listen.
room-voice-reconnecting = Reconnecting Talk… Check your connection.
voice-permission-requesting = Allow microphone access to talk.
voice-permission-denied = Microphone blocked. Allow microphone access in your browser, then choose Talk again.
room-voice-microphone-unavailable = Couldn’t open the microphone. Check microphone access, then try again. You can still listen.

settings-developer = Developer
settings-forget-lab = Forget lab
settings-forget-lab-question = Forget the saved lab?
settings-join-lab-question = Turn on Developer mode and join the lab?
settings-join-lab = Join lab
settings-tune-sound = Tune the sound
settings-tune-pausing = Pausing the room before tuning…
settings-tune-pause-failed = The room could not pause. Try again when playback is ready.
settings-tune-cancel = Cancel tuning
settings-tune-diagnostics = Diagnostics
settings-sound-late = Sound tuned: %.2f ms late, allowed for.
settings-sound-early = Sound tuned: %.2f ms early, allowed for.
settings-tv-tune-connect = Needs a connected phone
settings-tv-tune-unavailable = The connected phone is not ready to tune. Open Together on your phone and try again.


# One video Options sheet on iPhone and iPad.
movie-audio = Audio
movie-picture = Picture
movie-picture-fit = Fit
movie-picture-fill = Fill
movie-no-subtitles = No subtitles in this video

room-video-title = Video
room-invite-qr-unavailable = The QR code couldn’t be made. You can copy the invite link instead.

extension-rate-conflict = This site keeps changing playback speed. Set its speed to Normal, then rejoin the room.
extension-no-video = There’s no video playing in this tab. Start the video, then try again.
extension-page-unreachable = Together can’t reach this page. Click the Together button on the tab, or try another page.

entry-tv-use-phone = That’s a TV code. Open Together on your phone to connect to the TV.

# Plans: the browser invite and reply card.
plan-invited-by = { $name } invited you
plan-updated-by = Updated by { $name }
plan-programme = Programme
plan-then = then
plan-your-time = Your time. { $times } for { $name }.
plan-going = Going
plan-cant-make-it = Can’t make it
plan-colour = Your colour
plan-colour-orange = Orange
plan-colour-purple = Purple
plan-colour-indigo = Indigo
plan-colour-yellow = Yellow
plan-colour-blue = Blue
plan-colour-green = Green
plan-colour-pink = Pink
plan-youre-going = You’re going, as { $name }
plan-you-cant = You can’t make it, as { $name }
plan-change-reply = Change reply
plan-reply-unsent = Not sent yet
plan-reply-shared = Shared with { $name }
plan-reply-copied = Copied: paste it to { $name }
plan-send-reply = Send your reply to { $name }
plan-send-again = Send again
plan-preparing = Saving your reply…
plan-reply-failed = Your reply couldn’t be saved. Try again.
plan-share-failed = Your reply wasn’t shared. Try again, or copy the link.
plan-copy-failed = The reply link couldn’t be copied.
plan-copy-instead = Copy this link and send it to the person who invited you.
plan-reply-link = Sealed reply link
plan-calendar-failed = The calendar file couldn’t be opened. Try again.
plan-add-calendar = Add to calendar
plan-opens-at = Opens here at { $time }
plan-join-at = Join here at { $time }
plan-wait-room = Waiting for the room
plan-starts-in = Starts in { $time }
plan-cancelled = This plan was cancelled.
plan-no-app = No app needed. It plays in this browser, in sync with everyone.
plan-keep-link = Keep this tab, or the message the link came in: the plan lives in them, not on a server.
plan-other-platforms = Together is also on iPhone, Mac and Apple TV.
plan-get-it = Get it

tv-link-cannot-play = This link can’t play on this TV. Open it on your iPhone.

program-retrying = Couldn’t open the video. Trying again…

# TV: display of the shared Rust start/readiness snapshot.
play-for-everyone = Play for everyone
start-waiting-outputs = Waiting for { $names } · { $seconds }s
start-without-them = Start without them
start-countdown-without = Starting without { $names }
start-cancel = Cancel
ad-playing = Ad playing
tv-start-waiting-video = Waiting for the video · { $seconds }s
tv-readiness-unknown = Checking playback…
tv-not-watching = Not watching on this screen
tv-output-lost = Playback disconnected
tv-readiness-buffering = Buffering…
tv-readiness-positioning = Syncing playback…
tv-readiness-ended = Video ended
tv-readiness-away = Away
tv-readiness-interrupted = Playback interrupted
tv-readiness-unavailable = Can’t play this video here
start-peer-opening = { $count ->
    [one] { $names } is getting the video…
   *[other] { $names } are getting the video…
    }
start-wait-expiry = Then it starts without them. They'll join when their video opens.

# Member captions are selected by Core; the UI only interpolates typed display arguments.
member-caption-getting-video = Getting the video…
member-caption-catching-up = Catching up…
member-caption-behind = { $seconds } s behind the room
member-caption-ahead = { $seconds } s ahead of the room
member-caption-watching = Watching · { $position }
member-caption-live-together = Live · everyone { $seconds } s behind, together
member-caption-away = Away
member-caption-not-watching = Not watching here

member-caption-behind-short = { $seconds } s behind
member-caption-ahead-short = { $seconds } s ahead

# Separate supplied-state words for Reduce Motion/detail; optional captions stay independent.
member-state-syncing = Syncing
member-state-in-step = In step
member-state-talking = Talking

plan-opening = Opening the plan…
plan-link-failed = This plan link couldn’t be opened. Ask the person who invited you for a new link.
plan-reply-needs-plan = Open the plan’s invitation on this device, then open this reply link again.
plan-reply-imported = Reply from { $name } saved on this device.
plan-view-only = You can reply here. Open Together to watch.
plan-reply-old = { $name } replied to an earlier version of this plan.
plan-notes-by = Notes by { $name }
plan-notes-label = Notes
plan-add-notes = Add notes
plan-edit-notes = Edit notes
plan-save-notes = Save notes
plan-notes-shorten = Shorten the notes and try again.
plan-notes-failed = The notes couldn’t be saved. Try again.
plan-start-now = Start now
plan-started-by = Started by { $name }
plan-start-failed = The plan couldn’t be started. Try again.
plan-cancel-notes = Cancel

# The TV room panel; first focus returns to the film.
tv-room-title = In This Room
tv-room-done = Done

# Plans: messages used by the accepted Apple support and timing surfaces.
plan-section-plans = Plans
plan-when-header = When
plan-source-from = from { $time }
plan-from = From { $name }
plan-going-header = Going
plan-made-the-plan = made the plan
plan-in-time = in { $time }
plan-today = Today
plan-tomorrow = Tomorrow
plan-in-calendar = In your calendar
plan-in-calendar-moves = Together moves it if the plan moves
plan-footer-maker = { $name } can change this plan. Reminders come 15 minutes before and at each source.
plan-reminder-soon = In 15 minutes · { $source } on { $service }
plan-reminder-now = Now · Join
plan-cancelled-by = Cancelled by { $name }
plan-opens-in = Opens in { $time }
plan-join = Join
plan-share = Share the plan
plan-edit = Edit
plan-add-calendar-apple = Add to Calendar
plan-change-refused = The plan didn’t accept that change. Open the newest link and try again.
plan-identity-unavailable = Together couldn’t sign this on your device. Try again.
plan-name-required = Set your name in Settings first.
plan-not-saved = The plans on this device couldn’t be saved. Try again.
plan-unavailable = Together can’t do that yet.
plan-open-room = Open the room
plan-maker-opens = { $name }’s phone opens the room at { $time }. Join works once it’s open.
plan-reminder-now-maker = Now · Open the room
plan-reminder-soon-title-only = In 15 minutes · { $source }
plan-live-join = LIVE · Join

# Plans: messages used by the Apple plan screens.
plan-new = New plan
plan-title-new = New Plan
plan-title-edit = Edit Plan
plan-done = Done
plan-cancel-edit = Cancel
plan-title-placeholder = Title
plan-starts = Starts
plan-starts-now = Now
plan-starts-later = Later
plan-date = Date
plan-ends = Ends
plan-repeat = Repeat
plan-repeat-never = Never
plan-what-header = What
plan-add-source = Add a source
plan-remove-source = Remove
plan-switch-sentence = Everyone switches to { $source } on { $service } at { $time }. Anyone in the room can switch earlier, or back.
plan-who-header = Who
plan-can-change-it = Can change it
plan-can-change-you-and = You and { $names }
plan-invite-after = Invite people after. Whoever opens the link holds the plan.
plan-going-names = { $count ->
    [one] { $names } is going
   *[other] { $names } are going
    }
plan-plays-for-everyone = Plays for everyone at { $time }
plan-share-subject = { $title } · { $when }
plan-cancel = Cancel plan
plan-cancel-confirm = Cancel this plan for everyone?
plan-repeat-daily = Daily
plan-repeat-weekly = Weekly
plan-repeat-fortnightly = Fortnightly
plan-every-day = every day
plan-every-weekday = every { $days }
plan-every-other-weekday = every other { $days }
plan-source-link = Paste a link
plan-source-stream = A stream
plan-ends-none = No end

tv-settings-explanation-name = Change the name saved for this TV.
tv-settings-explanation-connections = Manage phone connections to this TV.
tv-settings-explanation-about = View Together’s version and software licences.
tv-settings-explanation-developer = Show developer controls in Together.
tv-settings-explanation-remote = Turn remote testing on or off for this TV.
tv-settings-explanation-apple-owners = Adjust developer timing and seek-step parameters.
tv-settings-explanation-forget-lab = Remove the saved lab from this TV.
