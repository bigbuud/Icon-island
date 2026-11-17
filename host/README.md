# Icon Island Windows host

A C# / .NET Framework and WebView2 program that attaches the theme pages behind the Windows desktop icon layer.

## Build and run

```powershell
powershell -ExecutionPolicy Bypass -File host\build.ps1
host\bin\IconIsland.exe
```

The build script uses the C# compiler that ships with Windows and downloads a pinned WebView2 SDK from NuGet on first use. Dependencies are stored in `host/lib/` and output goes to `host/bin/`; neither is committed.

## Command line

| Argument | Behaviour |
| --- | --- |
| none | Start the wallpaper and open Settings; opens Settings if already running |
| `--autostart` | Start in the background without opening Settings |
| `--settings` | Open Settings |
| `--menu` | Open the tray menu |
| `--exit` | Exit cleanly and restore the system wallpaper |
| `--exit-installed` | Used by the installer: only exits the instance running from the current executable path |

## Behaviour and data

- Themes come from `prototype/themes.json`; only themes with status `ready` are loaded.
- Desktop icon positions are polled every 400 ms; the theme page is notified only when they change.
- Animation pauses while a foreground window is maximized or fullscreen (the wallpaper itself, invisible and cloaked windows are ignored). The tray menu can pause and resume manually.
- Windows 11 24H2 and later use a layered child window of Progman; older systems use WorkerW.
- One wallpaper window per monitor (tray menu "Use all monitors" toggles this). Each window only receives the icons that sit on its own monitor. A monitor layout change rebuilds the windows. A wallpaper slideshow or Windows Spotlight can cause a brief flash when the image changes.
- Settings are saved to `%LOCALAPPDATA%\IconIsland\settings.json`; the log is `host.log` in the same folder.
- There is no account sign-in, purchase or automatic update check; the program does not go online on startup or when opening Settings.
- Sharing only uses icon positions: the theme page draws sample icons and colour blocks instead of capturing desktop windows.
- After editing a theme page use tray "Reload". Changes to the C# host require exiting and rebuilding.

For install testing, set the absolute-path environment variable `ICON_ISLAND_PROFILE_DIR` to isolate settings, WebView2 cache and single-instance events. This mode skips legacy data migration and disables writing autostart entries.

## Page messaging

The settings page sends `hello`, `set`, `reset`, `theme`, `lang`, `autostart` and sharing messages; the host sends the initial settings, icon rectangles and sharing results.

After a theme page sends `ready`, the host sends settings and icon positions, then parameter changes, icon changes and pause state. Settings and theme pages are loaded from a local virtual host name.
