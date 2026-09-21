# Gridiron GM streamer kit

Everything a streamer needs to show Gridiron GM on stream. Open `index.html`
for the download page (logos, overlay link builder, scenes), or use the files
directly. The live page is at https://seantomaslynch-cell.github.io/gridiron-gm/streamers/

## What is here

| Folder or file | What it is |
|---|---|
| `drop-in/` | The easy way: transparent screen-size PNGs with the card already in a corner (1080p and vertical for phone streams), plus two animated transparent WebM loops |
| `logos/` | Transparent PNGs of the football mark and the logo (horizontal and stacked, light and dark text), the app icon, a QR code, and the mark as an SVG |
| `overlay.html` | The promo overlay for OBS. A small card slides in every so often with the game name, a one-line pitch and a QR code |
| `scenes.html` | Live starting, break and ending scenes, with your own QR code and an optional countdown |
| `scenes/` | The same three scenes as 1920x1080 PNGs |
| `previews/` | Pictures of the overlay and logos |

## Fastest way: add a drop-in file as a layer

Open `drop-in/`, pick a file, and add it over your game capture.

- OBS Studio: Sources, add Image (a PNG), or Media Source for a WebM with Loop ticked.
- Streamlabs, Twitch Studio, TikTok LIVE Studio: add an Image layer and stretch it to the full canvas.
- Phone streams: use the vertical files and set the image overlay to full screen.

The 1080p files are 1920x1080, so they line up with the screen without any positioning. The QR code in them links to the App Store page with the plain `stream` tag. Use the browser-source overlay below if you want your own channel name in the link.

## Set up the browser-source overlay in OBS

1. Sources, add Browser.
2. URL: the address of `overlay.html`, with your channel name added: `overlay.html?tag=yourname`.
3. Width 1920, height 1080. Leave "Shutdown source when not visible" off so the timer keeps running.
4. The background is transparent, so it sits over your game capture.

Your channel name ends up in the App Store link as a campaign tag
(`ct=stream-yourname`), so installs from your stream can be counted under your
name in App Store Connect analytics.

Options, all optional, added with `&`:

| Option | What it does | Default |
|---|---|---|
| `pos=br` | Corner: `bl`, `br`, `tl`, `tr` | `bl` |
| `interval=120` | Seconds between appearances | 75 |
| `show=10` | Seconds each card stays up | 12 |
| `badge=0` | Hide the small corner tag between cards | on |
| `scale=0.8` | Make everything smaller or larger | 1 |
| `demo=1` | Show cards right away, for testing the layout | off |

## Chat command

Paste this as the reply for `!gridiron` in Nightbot, StreamElements or Streamlabs,
with your own link from the download page:

```
Gridiron GM is a free pro football GM sim for iPhone. Real salary cap, made-up teams, every deal has a price. https://apps.apple.com/app/id6807910129?pt=129118166&ct=stream-yourname&mt=8
```

## Copy rules

Keep the disclaimer on the scenes: the teams and players are fictional and the
game is not affiliated with any professional football league. The App Store
link uses text, not Apple's badge. If you want the official badge, get it from
Apple's marketing resources.
