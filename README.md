# TRACELINE

TRACELINE is a browser-based audio oscilloscope with a late-1980s green CRT look. It displays live audio from a hardware input or the built-in demo synth, with experimental support for browser tab/system audio capture.

Open the live build:

```text
https://amcrobb88.github.io/Traceline/
```

## What It Does

- Displays live audio as a CRT-style sweep scope.
- Supports single sweep, dual-trace, and XY display modes.
- Can use left, right, summed stereo, or stereo difference signals.
- Includes trigger controls, detector filtering, phosphor persistence, grid brightness, focus, and trace intensity.
- Includes a simple two-oscillator demo synth with detune, filtering, and plate-style reverb for testing without external audio hardware.

## Browser Permissions

TRACELINE uses standard browser audio APIs. Press `START` and allow microphone/input access when the browser asks.

Browsers do not expose ASIO devices directly, so ASIO4ALL is not required. A class-compliant USB audio interface should appear as an available input once permission is granted. On Windows, select the interface from the `INPUT` menu after device labels become available.

The app runs fully in the browser. It does not upload, record, or store incoming audio.

## Audio Sources

- `Audio input`: uses a microphone, line input, USB interface, or other browser-visible input device.
- `Tab / system audio beta`: attempts to capture audio from a shared browser tab or supported screen/window source.
- `Built-in demo synth`: generates a test signal inside the app for quick setup, demos, and trigger experiments.

Tab/system capture is browser-dependent and less reliable than direct audio input. Chrome and Edge generally have the best support. It usually requires selecting a browser tab or screen source that offers an audio checkbox, then enabling audio sharing in the browser picker. If no audio track is shared, TRACELINE shows `NO AUDIO SHARED`.

## Controls

- `SOURCE`: choose audio input, tab/system capture beta, or the built-in demo synth.
- `INPUT`: select the browser-visible input device.
- `DUAL WAVE`, `PITCH`, `DETUNE`, `FILTER`, `MONITOR`, and `SPACE`: shape and monitor the built-in demo synth.
- `SPACE: MONITOR` / `SPACE: TRACE TOO`: keep reverb audible only, or also feed the wet reverb into the displayed trace.
- `AUTO`: fit gain and position, set the trigger level, and choose a useful timebase from the recent signal.
- `MODE`: switch between sweep, dual-trace, and XY displays.
- `CHANNEL`: select the sweep-mode signal source.
- `CH1` and `CH2`: configure independent dual-trace sources, gain, vertical position, inversion, and visibility.
- `X AXIS` and `Y AXIS`: choose XY-mode routing.
- `INV X` and `INV Y`: flip either XY axis.
- `TIME/DIV`: set the horizontal scale.
- `INPUT GAIN` and `Y POS`: fit the signal vertically.
- `TRIGGER`, `SLOPE`, and `LEVEL`: stabilize repeating waveforms.
- `TRIGGER POS X`: move the trigger position across the sweep.
- `TRIG SEEK`: choose edge, long-line, or peak-based trigger seeking.
- `FILTER`: low-pass filter for the trigger detector only. The displayed trace remains raw.
- `SRC`: choose the trigger detector source.
- `DETECTOR`: overlay the filtered trigger detector signal as a dim amber trace.
- `PERSIST`: control phosphor decay.
- `TRACE`, `GRID`, and `FOCUS`: adjust the CRT display feel.
- The chevron in the status plate hides or restores the control panel.

Slider units are display-oriented rather than lab-calibrated. Browser audio arrives as normalized full-scale samples, so gain is shown in dB, trigger level in `% FS`, and vertical offset in screen divisions.

Hover a slider and use the mouse wheel for fine adjustment. Hold `Shift` while wheeling for a bigger jump. On `DETUNE`, hold `Ctrl` while wheeling for 0.1 cent moves.

## Local Use

The hosted GitHub Pages version is the simplest way to run TRACELINE. For offline use, download the repository and open `index.html` in a modern browser.

Windows helper scripts are included for convenience:

- `TRACELINE.cmd`: opens the app in an Edge/Chrome app-style window.
- `Create-TRACELINE-Desktop-Shortcut.ps1`: creates a desktop shortcut with the TRACELINE icon.
- `server.ps1` or `run-oscilloscope.cmd`: starts a small local server if a browser behaves differently with local files.

If using the local server, open:

```text
http://127.0.0.1:5179/
```

## Latency

TRACELINE captures into a short live ring buffer and draws from the newest audio available. `Free run` is the lowest-latency view. `Auto` and `Normal` trigger modes wait for enough post-trigger samples to draw a stable sweep, so slow `TIME/DIV` settings can feel delayed by part of the displayed sweep length.

## Notes

This is a visual audio tool rather than a calibrated measurement instrument. It is designed for signal inspection, synth patches, oscilloscope music, stereo shape experiments, and general audio tinkering.
