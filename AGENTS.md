# Icon Island development notes

- Communicate in the language the project owner uses (Dutch or English).
- This fork is completely free: nine themes (Beach, Meadow, Aurora, Sky, Pasture, Forest, Lotus pond, Winter, Zen Garden) are all available. There are no locked themes, purchase UI or license checks. New themes are built on `prototype/kit.js` (the contract is described at the top of that file).
- Multi-monitor: one `WallpaperForm` per monitor (primary first). Icons are assigned to the monitor that contains their centre point. A monitor layout change rebuilds all windows. The tray item "Use all monitors" switches back to primary-only.
- The UI is English only.
- No account sign-in, purchase restore or automatic update checks; no licensing service, update manifest or store integration.
- Keep `themes.json`, parameter defaults (the `params` object in each theme's JS) and `i18n/en.json` consistent.
- After changing a theme, check icon movement, preview, pause and sharing. Canvases draw at actual pixel size and with fractional display sizes.
- The wallpaper runs permanently in the background; target 30 fps on integrated graphics. Cache static drawing, use local layers for small objects, and do not compute many objects per pixel in full-screen shaders.
- `prototype/thumbs/` holds the theme thumbnails.
- Build: `powershell -ExecutionPolicy Bypass -File host\build.ps1` produces `host/bin/IconIsland.exe`. A GitHub Actions workflow (`.github/workflows/build-windows.yml`) builds the installer and publishes it as the "latest" release.
- Browser preview: `node prototype\serve.mjs`, then open `http://localhost:5178/settings.html`.
- The Windows host is `host/DesktopHost.cs`. Changing theme HTML/JS does not require recompiling; use tray "Reload".
- Product name is `Icon Island`; data lives in `%LOCALAPPDATA%\IconIsland`, the install folder is `Programs\Icon Island`.
- Do not commit `host/bin/`, `host/lib/`, personal data, credentials or local paths.
- License: see `LICENSE`. Name and icon notes: `TRADEMARKS.md`.
