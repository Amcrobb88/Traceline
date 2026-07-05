# TRACELINE

A small local oscilloscope for live audio input, styled like a late-80s green CRT bench scope.

Open the live GitHub Pages build here:

```text
https://amcrobb88.github.io/Traceline/
```

## Run

Double-click `TRACELINE.cmd` to open the app in an Edge/Chrome app-style window. It opens the local `index.html` directly and does not need the local server.

To make a real desktop shortcut with the TRACELINE icon, right-click `Create-TRACELINE-Desktop-Shortcut.ps1`, choose `Run with PowerShell`, and allow it to create `TRACELINE.lnk` on the desktop.

## Sharing

Send people the GitHub Pages link:

```text
https://amcrobb88.github.io/Traceline/
```

The app is static HTML/CSS/JS, so it runs directly from GitHub Pages over HTTPS. Browser audio input still requires the person opening it to press `START` and allow microphone/input access.

For an offline copy, send the whole folder or `TRACELINE-portable.zip` if you have built the zip. The receiver should unzip it somewhere normal, such as Documents, then double-click `TRACELINE.cmd`.

The server is optional. Keep it as a fallback if a browser permission behaves differently from a local file URL:

```powershell
cd C:\path\to\crt-oscilloscope-v2
.\server.ps1
```

If PowerShell blocks scripts, use the included `run-oscilloscope.cmd`.

Then open:

```text
http://127.0.0.1:5179/
```

You can also double-click `run-oscilloscope.cmd`.

## Audio Notes

The app uses the browser's Web Audio input API. Browsers do not expose ASIO directly, so ASIO4ALL is not needed here. Your Focusrite Scarlett 2i2 should appear as a Windows audio input after you press `START` and allow microphone/input access.

Direct Monitor on the Scarlett only controls what you hear in the headphones/outputs. It does not stop apps from reading the inputs, so this scope can still use the incoming audio device.

To scope audio from another webpage in Chrome or Edge, set `SOURCE` to `Browser tab / system audio`, press `START`, choose the synth tab in the browser picker, and enable audio sharing in that picker. Some browsers and window/screen sharing modes do not provide audio; if no audio track is shared, the scope will show `NO AUDIO SHARED`.

For a guaranteed work-PC demo without audio hardware or browser tab capture, set `SOURCE` to `Built-in demo synth`. It uses two oscillators with adjustable detune, followed by a simple 24 dB/oct low-pass filter.

## Controls

- `SOURCE`: choose hardware audio input, browser tab/system audio capture, or the built-in demo synth.
- `INPUT`: choose the Scarlett input once device labels are available.
- `DUAL WAVE`, `PITCH`, `DETUNE`, `FILTER`, `MONITOR`, and `SPACE`: shape and hear the built-in demo synth when that source is selected.
- `SPACE: MONITOR` / `SPACE: TRACE TOO`: keep the plate reverb audible only, or also feed the wet plate into the displayed trace.
- `AUTO`: fit gain and position, set the trigger level, and choose a timebase from the recent signal.
- `MODE`: switch between sweep scope, dual-trace scope, and XY mode.
- `CHANNEL`: sweep-mode source; view left, right, summed stereo, or difference.
- `CH1` and `CH2`: dual-trace channel controls with independent source, gain, Y position, invert, and on/off buttons.
- `X AXIS` and `Y AXIS`: XY-mode source routing.
- `INV X` and `INV Y`: flip either XY axis for oscilloscope music patches.
- `TIME/DIV`: horizontal scale.
- `INPUT GAIN` and `Y POS`: signal fit.
- `TRIGGER`, `SLOPE`, and the fine `LEVEL` control: stabilize repeating waveforms.
- Trigger `LEVEL` is clamped to the visible screen height for the current gain and Y position.
- `TRIGGER POS X`: move the locked trigger point left or right on the sweep.
- Trigger `FILTER`: continuously adjusts a four-stage low-pass on the detector only, so complex signals can lock to their broader shape while the displayed trace stays raw.
- `TRIG SEEK`: use `Edge` for threshold crossings, `Long line` to lock onto the longest clean ramp, or `Peak` to estimate the period from repeated high/low peaks.
- `SRC`: choose the trigger detector source from the display trace, CH1, CH2, or stereo mix.
- `DETECTOR`: overlays the filtered trigger detector signal as a dim amber service trace.
- Peak `OFFSET`: shifts the sweep anchor through the detected period, so `0%` sits on the selected peak and `50%` sits halfway to the next one.
- `PERSIST`: sets the phosphor decay from off through short smears to roughly five seconds.
- `TRACE`, `GRID`, and `FOCUS`: CRT trace and graticule feel.
- The small chevron in the status plate hides or restores the control panel.

Slider units are display-oriented rather than lab-calibrated: browser audio arrives as normalized full-scale samples, so gain is shown in dB, trigger level in `% FS`, and vertical offset in screen divisions.

Hover a slider and use the mouse wheel for fine adjustment. Hold `Shift` while wheeling for a bigger jump. On `DETUNE`, hold `Ctrl` while wheeling for 0.1 cent moves.

## Latency

The scope captures into a short live ring buffer and draws from the newest audio available. `Free run` is the lowest-latency view. `Auto` and `Normal` trigger modes wait for enough post-trigger samples to draw a stable sweep, so very slow `TIME/DIV` settings can still feel delayed by part of the displayed sweep length.
