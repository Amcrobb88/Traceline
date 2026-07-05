(() => {
  const gridCanvas = document.getElementById("gridCanvas");
  const gridCtx = gridCanvas.getContext("2d", { alpha: false });
  const persistCanvas = document.getElementById("persistCanvas");
  const persistCtx = persistCanvas.getContext("2d");
  const canvas = document.getElementById("scopeCanvas");
  const ctx = canvas.getContext("2d");

  const timeOptionsMs = [0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
  const synthCaptureGain = 0.22;
  const synthMonitorMaxGain = 0.55;
  const synthDisplayFallbackGain = 3.2;
  const triggerScreenLimit = 0.5 / 0.36;
  const sweepPointDensity = 1.35;
  const dualPointDensity = 0.95;
  const xyPointDensity = 1.1;
  const maxTracePoints = 1800;
  const supportLayerPixelRatio = 1;
  const persistenceCleanupInterval = 4;
  const persistenceCleanupSlices = 16;
  const enablePersistenceFloorCleanup = true;
  const state = {
    isCapturing: false,
    isHeld: false,
    timeDivMs: 5,
    gain: 2.5,
    offset: 0,
    triggerLevel: 0,
    triggerPosition: 0.5,
    triggerMode: "auto",
    triggerSlope: "rising",
    triggerFilter: 0.35,
    triggerSeek: "edge",
    triggerPeakMode: "high",
    triggerPeakOffset: 0,
    sourceMode: "input",
    synthWave: "sawtooth",
    synthPitch: 110,
    synthDetune: 0,
    synthFilter: 70,
    synthMonitor: 55,
    synthSpace: 100,
    synthSpaceToTrace: false,
    displayMode: "dual",
    channelMode: "mix",
    ch1Enabled: true,
    ch2Enabled: true,
    ch1Mode: "left",
    ch2Mode: "right",
    ch1Gain: 1,
    ch2Gain: 1,
    ch1Offset: 0.55,
    ch2Offset: -0.55,
    ch1Invert: false,
    ch2Invert: false,
    xChannelMode: "left",
    yChannelMode: "right",
    xInvert: false,
    yInvert: false,
    triggerSource: "display",
    detectorOverlay: false,
    persistence: 0.68,
    brightness: 0.9,
    gridBrightness: 0.48,
    focus: 0.62,
    sampleRate: 0
  };

  const els = {
    statusLight: document.getElementById("statusLight"),
    statusText: document.getElementById("statusText"),
    sampleRateReadout: document.getElementById("sampleRateReadout"),
    startButton: document.getElementById("startButton"),
    holdButton: document.getElementById("holdButton"),
    autoButton: document.getElementById("autoButton"),
    controlsToggle: document.getElementById("controlsToggle"),
    sourceSelect: document.getElementById("sourceSelect"),
    inputField: document.getElementById("inputField"),
    inputSelect: document.getElementById("inputSelect"),
    synthWave: document.getElementById("synthWave"),
    synthPitch: document.getElementById("synthPitch"),
    synthPitchLabel: document.getElementById("synthPitchLabel"),
    synthDetune: document.getElementById("synthDetune"),
    synthDetuneLabel: document.getElementById("synthDetuneLabel"),
    synthFilter: document.getElementById("synthFilter"),
    synthFilterLabel: document.getElementById("synthFilterLabel"),
    synthMonitor: document.getElementById("synthMonitor"),
    synthMonitorLabel: document.getElementById("synthMonitorLabel"),
    synthSpace: document.getElementById("synthSpace"),
    synthSpaceLabel: document.getElementById("synthSpaceLabel"),
    synthSpaceToTrace: document.getElementById("synthSpaceToTrace"),
    displayMode: document.getElementById("displayMode"),
    channelSelect: document.getElementById("channelSelect"),
    ch1Toggle: document.getElementById("ch1Toggle"),
    ch2Toggle: document.getElementById("ch2Toggle"),
    ch1Select: document.getElementById("ch1Select"),
    ch2Select: document.getElementById("ch2Select"),
    ch1Gain: document.getElementById("ch1Gain"),
    ch2Gain: document.getElementById("ch2Gain"),
    ch1GainLabel: document.getElementById("ch1GainLabel"),
    ch2GainLabel: document.getElementById("ch2GainLabel"),
    ch1Offset: document.getElementById("ch1Offset"),
    ch2Offset: document.getElementById("ch2Offset"),
    ch1OffsetLabel: document.getElementById("ch1OffsetLabel"),
    ch2OffsetLabel: document.getElementById("ch2OffsetLabel"),
    ch1Invert: document.getElementById("ch1Invert"),
    ch2Invert: document.getElementById("ch2Invert"),
    xChannelSelect: document.getElementById("xChannelSelect"),
    yChannelSelect: document.getElementById("yChannelSelect"),
    xInvert: document.getElementById("xInvert"),
    yInvert: document.getElementById("yInvert"),
    triggerMode: document.getElementById("triggerMode"),
    triggerSlope: document.getElementById("triggerSlope"),
    triggerFilter: document.getElementById("triggerFilter"),
    triggerFilterLabel: document.getElementById("triggerFilterLabel"),
    triggerSeek: document.getElementById("triggerSeek"),
    triggerPeakMode: document.getElementById("triggerPeakMode"),
    triggerPeakOffset: document.getElementById("triggerPeakOffset"),
    triggerPeakOffsetLabel: document.getElementById("triggerPeakOffsetLabel"),
    triggerSource: document.getElementById("triggerSource"),
    detectorOverlay: document.getElementById("detectorOverlay"),
    timeSlider: document.getElementById("timeSlider"),
    gainSlider: document.getElementById("gainSlider"),
    offsetSlider: document.getElementById("offsetSlider"),
    triggerSlider: document.getElementById("triggerSlider"),
    triggerPosSlider: document.getElementById("triggerPosSlider"),
    persistSlider: document.getElementById("persistSlider"),
    brightSlider: document.getElementById("brightSlider"),
    gridSlider: document.getElementById("gridSlider"),
    focusSlider: document.getElementById("focusSlider"),
    timeReadout: document.getElementById("timeReadout"),
    gainReadout: document.getElementById("gainReadout"),
    rmsReadout: document.getElementById("rmsReadout"),
    peakReadout: document.getElementById("peakReadout"),
    freqReadout: document.getElementById("freqReadout"),
    timeSliderLabel: document.getElementById("timeSliderLabel"),
    gainSliderLabel: document.getElementById("gainSliderLabel"),
    offsetSliderLabel: document.getElementById("offsetSliderLabel"),
    triggerSliderLabel: document.getElementById("triggerSliderLabel"),
    triggerPosSliderLabel: document.getElementById("triggerPosSliderLabel"),
    persistSliderLabel: document.getElementById("persistSliderLabel"),
    brightSliderLabel: document.getElementById("brightSliderLabel"),
    gridSliderLabel: document.getElementById("gridSliderLabel"),
    focusSliderLabel: document.getElementById("focusSliderLabel")
  };

  let audioContext = null;
  let mediaStream = null;
  let sourceNode = null;
  let captureNode = null;
  let monitorGain = null;
  let synthOscillatorA = null;
  let synthOscillatorB = null;
  let synthGain = null;
  let synthFilterA = null;
  let synthFilterB = null;
  let synthDryGain = null;
  let synthReverb = null;
  let synthReverbInputGain = null;
  let synthReverbWetGain = null;
  let synthReverbTraceGain = null;
  let ringLeft = null;
  let ringRight = null;
  let ringWriteIndex = 0;
  let ringSamplesWritten = 0;
  let recentMixed = null;
  let triggerBuffer = null;
  let workingTrace = null;
  let lastTrace = null;
  let widthCss = 0;
  let heightCss = 0;
  let pixelRatio = 1;
  let firstFrame = true;
  let lastFrameTime = null;
  let captureGeneration = 0;
  let peakPeriodEstimate = 0;
  let synthAutoScaleTimer = null;
  let persistenceCleanupFrame = 0;
  let persistenceCleanupSlice = 0;
  let screenBaseSignature = "";

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setStatus(text, mode = "standby") {
    els.statusText.textContent = text;
    els.statusLight.classList.toggle("live", mode === "live");
    els.statusLight.classList.toggle("warn", mode === "warn");
    els.statusLight.classList.toggle("error", mode === "error");
  }

  function setSampleRate(value) {
    state.sampleRate = value || 0;
    els.sampleRateReadout.textContent = value ? `${(value / 1000).toFixed(1)} kHz` : "-- kHz";
  }

  function buildAudioConstraints() {
    const audio = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: { ideal: 2 },
      sampleRate: { ideal: 48000 }
    };

    if (els.inputSelect.value) {
      audio.deviceId = { exact: els.inputSelect.value };
    }

    return { audio, video: false };
  }

  async function refreshDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }

    const selected = els.inputSelect.value;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter((device) => device.kind === "audioinput");

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Default audio input";
    els.inputSelect.replaceChildren(defaultOption);

    inputs.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.textContent = device.label || `Audio input ${index + 1}`;
      els.inputSelect.append(option);
    });

    const hasSelected = inputs.some((device) => device.deviceId === selected);
    els.inputSelect.value = hasSelected ? selected : "";
  }

  async function startCapture() {
    const sourceMode = state.sourceMode;

    if (sourceMode !== "synth" && !navigator.mediaDevices) {
      setStatus("NO INPUT API", "error");
      return;
    }

    if (sourceMode === "input" && !navigator.mediaDevices.getUserMedia) {
      setStatus("NO INPUT API", "error");
      return;
    }

    if (sourceMode === "display" && !navigator.mediaDevices.getDisplayMedia) {
      setStatus("NO SHARE API", "error");
      return;
    }

    const generation = ++captureGeneration;
    stopCapture(false, false);
    setStatus(captureRequestLabel(sourceMode), "warn");

    try {
      if (sourceMode === "synth") {
        await startSynthCapture(generation);
      } else {
        const stream = sourceMode === "display"
          ? await startDisplayCapture()
          : await navigator.mediaDevices.getUserMedia(buildAudioConstraints());

        if (generation !== captureGeneration) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        mediaStream = stream;
        await connectCaptureStream(stream, generation, sourceMode);
      }
    } catch (error) {
      if (generation !== captureGeneration) {
        return;
      }

      console.error(error);
      stopCapture(false, false);
      setStatus(readableCaptureError(error), "error");
      syncButtons();
    }
  }

  function captureRequestLabel(sourceMode = state.sourceMode) {
    if (sourceMode === "display") {
      return "REQUESTING SHARE";
    }

    if (sourceMode === "synth") {
      return "STARTING SYNTH";
    }

    return "REQUESTING INPUT";
  }

  async function startDisplayCapture() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error("NO_SHARE_API");
    }

    const captureOptions = [
      {
        video: true,
        audio: true,
        systemAudio: "include",
        windowAudio: "system",
        surfaceSwitching: "include",
        selfBrowserSurface: "include"
      },
      {
        video: true,
        audio: true
      }
    ];
    let stream = null;
    let lastError = null;

    for (const options of captureOptions) {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia(options);
        break;
      } catch (error) {
        lastError = error;
        if (!error || error.name !== "TypeError") {
          throw error;
        }
      }
    }

    if (!stream) {
      if (lastError) {
        throw lastError;
      }

      throw new Error("NO_SHARE_API");
    }

    if (!stream.getAudioTracks().some((track) => track.readyState === "live")) {
      stream.getTracks().forEach((track) => track.stop());
      throw new Error("NO_SHARED_AUDIO");
    }

    return stream;
  }

  function audioOnlyStream(stream, emptyError = "NO_SHARED_AUDIO") {
    const audioTracks = stream.getAudioTracks().filter((track) => track.readyState === "live");
    if (!audioTracks.length) {
      throw new Error(emptyError);
    }

    if (typeof MediaStream === "undefined") {
      return stream;
    }

    return new MediaStream(audioTracks);
  }

  async function startSynthCapture(generation) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextCtor({ latencyHint: "interactive" });
    await context.resume();

    if (generation !== captureGeneration) {
      await context.close();
      return;
    }

    audioContext = context;

    synthOscillatorA = audioContext.createOscillator();
    synthOscillatorB = audioContext.createOscillator();
    synthGain = audioContext.createGain();
    synthFilterA = audioContext.createBiquadFilter();
    synthFilterB = audioContext.createBiquadFilter();
    synthDryGain = audioContext.createGain();
    synthReverb = audioContext.createConvolver();
    synthReverbInputGain = audioContext.createGain();
    synthReverbWetGain = audioContext.createGain();
    synthReverbTraceGain = audioContext.createGain();
    captureNode = audioContext.createScriptProcessor(1024, 2, 1);
    monitorGain = audioContext.createGain();

    synthOscillatorA.type = state.synthWave;
    synthOscillatorB.type = state.synthWave;
    synthOscillatorA.frequency.value = state.synthPitch;
    synthOscillatorB.frequency.value = state.synthPitch;
    synthOscillatorB.detune.value = state.synthDetune;
    synthGain.gain.value = synthCaptureGain;
    synthFilterA.type = "lowpass";
    synthFilterB.type = "lowpass";
    synthFilterA.Q.value = 0.5412;
    synthFilterB.Q.value = 1.3065;
    synthReverb.buffer = createPlateImpulse(audioContext);
    monitorGain.gain.value = synthMonitorGain();

    setupRingBuffer(audioContext.sampleRate);
    captureNode.onaudioprocess = handleAudioProcess;

    synthOscillatorA.connect(synthGain);
    synthOscillatorB.connect(synthGain);
    synthGain.connect(synthFilterA);
    synthFilterA.connect(synthFilterB);
    synthFilterB.connect(captureNode);
    synthFilterB.connect(synthDryGain);
    synthFilterB.connect(synthReverbInputGain);
    synthReverbInputGain.connect(synthReverb);
    synthReverb.connect(synthReverbWetGain);
    synthReverb.connect(synthReverbTraceGain);
    synthDryGain.connect(monitorGain);
    synthReverbWetGain.connect(monitorGain);
    synthReverbTraceGain.connect(captureNode);
    captureNode.connect(monitorGain);
    monitorGain.connect(audioContext.destination);
    updateSynthSource();
    synthOscillatorA.start();
    synthOscillatorB.start();

    workingTrace = null;
    lastTrace = null;

    setSampleRate(audioContext.sampleRate);
    state.isCapturing = true;
    firstFrame = true;
    syncButtons();
    setStatus("LIVE DEMO SYNTH", "live");
    queueSynthAutoScale();
  }

  function updateSynthSource() {
    if (synthOscillatorA && synthOscillatorB && audioContext) {
      synthOscillatorA.type = state.synthWave;
      synthOscillatorB.type = state.synthWave;
      synthOscillatorA.frequency.setTargetAtTime(state.synthPitch, audioContext.currentTime, 0.012);
      synthOscillatorB.frequency.setTargetAtTime(state.synthPitch, audioContext.currentTime, 0.012);
      synthOscillatorB.detune.setTargetAtTime(state.synthDetune, audioContext.currentTime, 0.012);
    }

    if (synthFilterA && synthFilterB && audioContext) {
      const cutoff = synthFilterCutoff();
      synthFilterA.frequency.setTargetAtTime(cutoff, audioContext.currentTime, 0.018);
      synthFilterB.frequency.setTargetAtTime(cutoff, audioContext.currentTime, 0.018);
    }

    if (monitorGain && audioContext && state.sourceMode === "synth") {
      monitorGain.gain.setTargetAtTime(synthMonitorGain(), audioContext.currentTime, 0.012);
    }

    updateSynthSpace();
  }

  function synthFilterCutoff() {
    const minHz = 80;
    const maxHz = 12000;
    return minHz * Math.pow(maxHz / minHz, state.synthFilter / 100);
  }

  function synthMonitorGain() {
    return (clamp(state.synthMonitor, 0, 100) / 100) * synthMonitorMaxGain;
  }

  function synthSpaceAmount() {
    return clamp(state.synthSpace, 0, 100) / 100;
  }

  function updateSynthSpace() {
    if (!audioContext || !synthDryGain || !synthReverbInputGain || !synthReverbWetGain || !synthReverbTraceGain) {
      return;
    }

    const amount = synthSpaceAmount();
    const wet = Math.pow(amount, 1.2);
    const now = audioContext.currentTime;
    synthDryGain.gain.setTargetAtTime(1 - wet * 0.34, now, 0.02);
    synthReverbInputGain.gain.setTargetAtTime(wet * 0.85, now, 0.02);
    synthReverbWetGain.gain.setTargetAtTime(wet * 0.72, now, 0.02);
    synthReverbTraceGain.gain.setTargetAtTime(state.synthSpaceToTrace ? wet * 0.72 : 0, now, 0.02);
  }

  function createPlateImpulse(context) {
    const sampleRate = context.sampleRate || 48000;
    const duration = 4.8;
    const length = Math.max(1, Math.round(sampleRate * duration));
    const impulse = context.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      let lowPassed = 0;

      for (let i = 0; i < length; i += 1) {
        const t = i / length;
        const envelope = Math.pow(1 - t, 2.35) * Math.exp(-t * 2.2);
        const diffusion = 0.66 + 0.34 * Math.sin(i * 0.013 + channel * 1.91);
        lowPassed += ((Math.random() * 2 - 1) - lowPassed) * (0.16 + 0.12 * (1 - t));
        data[i] = lowPassed * envelope * diffusion;
      }
    }

    return impulse;
  }

  async function connectCaptureStream(stream, generation, sourceMode) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextCtor({ latencyHint: "interactive" });
    await context.resume();

    if (generation !== captureGeneration) {
      stream.getTracks().forEach((track) => track.stop());
      await context.close();
      return;
    }

    audioContext = context;

    const webAudioStream = audioOnlyStream(stream, sourceMode === "display" ? "NO_SHARED_AUDIO" : "NO_INPUT_FOUND");
    sourceNode = audioContext.createMediaStreamSource(webAudioStream);
    captureNode = audioContext.createScriptProcessor(1024, 2, 1);
    monitorGain = audioContext.createGain();
    monitorGain.gain.value = 0;
    setupRingBuffer(audioContext.sampleRate);
    captureNode.onaudioprocess = handleAudioProcess;

    sourceNode.connect(captureNode);
    captureNode.connect(monitorGain);
    monitorGain.connect(audioContext.destination);

    workingTrace = null;
    lastTrace = null;

    setSampleRate(audioContext.sampleRate);
    state.isCapturing = true;
    firstFrame = true;
    syncButtons();

    stream.getTracks().forEach((track) => {
      track.addEventListener("ended", () => {
        if (generation === captureGeneration) {
          stopCapture(true);
        }
      }, { once: true });
    });

    if (sourceMode === "input") {
      await refreshDevices();
    }

    if (generation !== captureGeneration) {
      return;
    }

    const audioTrack = stream.getAudioTracks()[0];
    const label = audioTrack && audioTrack.label ? audioTrack.label : null;
    const fallback = sourceMode === "display" ? "SHARED AUDIO" : "LIVE INPUT";
    setStatus(label ? `LIVE ${label}` : fallback, "live");
  }

  function readableCaptureError(error) {
    if (error && error.message === "NO_SHARE_API") {
      return "NO SHARE API";
    }

    if (error && error.message === "NO_SHARED_AUDIO") {
      return "NO AUDIO SHARED";
    }

    if (error && error.message === "NO_INPUT_FOUND") {
      return "NO INPUT FOUND";
    }

    if (!error || !error.name) {
      return "INPUT ERROR";
    }

    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "INPUT BLOCKED";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "NO INPUT FOUND";
    }

    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "INPUT BUSY";
    }

    return error.name.toUpperCase();
  }

  function stopCapture(updateStatus = true, invalidatePending = true) {
    if (invalidatePending) {
      captureGeneration += 1;
    }

    if (synthAutoScaleTimer) {
      window.clearTimeout(synthAutoScaleTimer);
      synthAutoScaleTimer = null;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    [synthOscillatorA, synthOscillatorB].forEach((oscillator) => {
      if (!oscillator) {
        return;
      }

      try {
        oscillator.stop();
      } catch {
        // The oscillator may already have ended during rapid source switching.
      }
      oscillator.disconnect();
    });

    if (synthGain) {
      synthGain.disconnect();
    }

    if (synthFilterA) {
      synthFilterA.disconnect();
    }

    if (synthFilterB) {
      synthFilterB.disconnect();
    }

    if (synthDryGain) {
      synthDryGain.disconnect();
    }

    if (synthReverbInputGain) {
      synthReverbInputGain.disconnect();
    }

    if (synthReverb) {
      synthReverb.disconnect();
    }

    if (synthReverbWetGain) {
      synthReverbWetGain.disconnect();
    }

    if (synthReverbTraceGain) {
      synthReverbTraceGain.disconnect();
    }

    if (audioContext && audioContext.state !== "closed") {
      audioContext.close().catch(() => {});
    }

    mediaStream = null;
    audioContext = null;
    sourceNode = null;
    captureNode = null;
    monitorGain = null;
    synthOscillatorA = null;
    synthOscillatorB = null;
    synthGain = null;
    synthFilterA = null;
    synthFilterB = null;
    synthDryGain = null;
    synthReverb = null;
    synthReverbInputGain = null;
    synthReverbWetGain = null;
    synthReverbTraceGain = null;
    ringLeft = null;
    ringRight = null;
    ringWriteIndex = 0;
    ringSamplesWritten = 0;
    recentMixed = null;
    triggerBuffer = null;
    peakPeriodEstimate = 0;
    workingTrace = null;
    lastTrace = null;
    state.isCapturing = false;
    setSampleRate(0);
    firstFrame = true;

    if (updateStatus) {
      setStatus("STANDBY", "standby");
    }

    syncButtons();
    updateMeters(null);
  }

  function syncButtons() {
    const led = els.startButton.querySelector(".button-led");
    const label = els.startButton.lastElementChild;
    led.classList.toggle("live", state.isCapturing);
    label.textContent = state.isCapturing ? "STOP" : "START";
    els.holdButton.setAttribute("aria-pressed", state.isHeld ? "true" : "false");
    els.autoButton.disabled = !state.isCapturing;
  }

  function applySynthDisplayDefaults() {
    els.gainSlider.value = synthDisplayFallbackGain.toFixed(1);
    els.offsetSlider.value = "0";
    els.triggerSlider.value = "0";
  }

  function syncTriggerSliderRange() {
    const globalGain = Math.max(0.001, Number(els.gainSlider.value) || state.gain || 1);
    let gain = globalGain;
    let offset = Number(els.offsetSlider.value) || 0;

    if (els.displayMode.value === "dual") {
      if (els.triggerSource.value === "ch2") {
        gain = globalGain * Math.max(0.001, Number(els.ch2Gain.value) || 1);
        offset = Number(els.ch2Offset.value) || 0;
      } else if (els.triggerSource.value === "mix") {
        gain = globalGain;
        offset = 0;
      } else {
        gain = globalGain * Math.max(0.001, Number(els.ch1Gain.value) || 1);
        offset = Number(els.ch1Offset.value) || 0;
      }
    }

    const min = (-triggerScreenLimit - offset) / gain;
    const max = (triggerScreenLimit - offset) / gain;
    const next = clamp(Number(els.triggerSlider.value) || 0, min, max);

    els.triggerSlider.min = min.toFixed(3);
    els.triggerSlider.max = max.toFixed(3);
    els.triggerSlider.value = next.toFixed(3);
  }

  function queueSynthAutoScale() {
    if (synthAutoScaleTimer) {
      window.clearTimeout(synthAutoScaleTimer);
    }

    synthAutoScaleTimer = window.setTimeout(() => {
      synthAutoScaleTimer = null;
      if (state.isCapturing && state.sourceMode === "synth") {
        autoSetScope({ quiet: true });
      }
    }, 180);
  }

  function syncControls() {
    const previousDisplayMode = state.displayMode;
    const previousSourceMode = state.sourceMode;
    const timeIndex = Number(els.timeSlider.value);
    state.timeDivMs = timeOptionsMs[timeIndex] || 5;
    state.gain = Number(els.gainSlider.value);
    state.offset = Number(els.offsetSlider.value);
    syncTriggerSliderRange();
    state.triggerLevel = Number(els.triggerSlider.value);
    state.triggerPosition = Number(els.triggerPosSlider.value) / 100;
    state.persistence = Number(els.persistSlider.value) / 100;
    state.brightness = Number(els.brightSlider.value) / 100;
    state.gridBrightness = Number(els.gridSlider.value) / 100;
    state.focus = Number(els.focusSlider.value) / 100;
    state.sourceMode = els.sourceSelect.value;
    if (previousSourceMode !== "synth" && state.sourceMode === "synth") {
      applySynthDisplayDefaults();
      state.gain = Number(els.gainSlider.value);
      state.offset = Number(els.offsetSlider.value);
      state.triggerLevel = Number(els.triggerSlider.value);
    }
    state.synthWave = els.synthWave.value;
    state.synthPitch = Number(els.synthPitch.value);
    state.synthDetune = Number(els.synthDetune.value);
    state.synthFilter = Number(els.synthFilter.value);
    state.synthMonitor = Number(els.synthMonitor.value);
    state.synthSpace = Number(els.synthSpace.value);
    state.synthSpaceToTrace = els.synthSpaceToTrace.getAttribute("aria-pressed") === "true";
    state.displayMode = els.displayMode.value;
    state.channelMode = els.channelSelect.value;
    state.ch1Enabled = els.ch1Toggle.getAttribute("aria-pressed") === "true";
    state.ch2Enabled = els.ch2Toggle.getAttribute("aria-pressed") === "true";
    state.ch1Mode = els.ch1Select.value;
    state.ch2Mode = els.ch2Select.value;
    state.ch1Gain = Number(els.ch1Gain.value);
    state.ch2Gain = Number(els.ch2Gain.value);
    state.ch1Offset = Number(els.ch1Offset.value);
    state.ch2Offset = Number(els.ch2Offset.value);
    state.ch1Invert = els.ch1Invert.checked;
    state.ch2Invert = els.ch2Invert.checked;
    state.xChannelMode = els.xChannelSelect.value;
    state.yChannelMode = els.yChannelSelect.value;
    state.xInvert = els.xInvert.checked;
    state.yInvert = els.yInvert.checked;
    state.triggerMode = els.triggerMode.value;
    state.triggerSlope = els.triggerSlope.value;
    state.triggerFilter = Number(els.triggerFilter.value) / 100;
    state.triggerSeek = els.triggerSeek.value;
    state.triggerPeakMode = els.triggerPeakMode.value;
    state.triggerPeakOffset = Number(els.triggerPeakOffset.value) / 100;
    state.triggerSource = els.triggerSource.value;
    state.detectorOverlay = els.detectorOverlay.getAttribute("aria-pressed") === "true";
    if (previousDisplayMode !== state.displayMode) {
      lastTrace = null;
      workingTrace = null;
      firstFrame = true;
    }

    document.body.classList.toggle("xy-mode", state.displayMode === "xy");
    document.body.classList.toggle("dual-mode", state.displayMode === "dual");
    document.body.classList.toggle("peak-trigger", state.triggerSeek === "peak");
    els.inputField.classList.toggle("is-disabled", state.sourceMode !== "input");
    els.inputSelect.disabled = state.sourceMode !== "input";
    document.body.classList.toggle("synth-mode", state.sourceMode === "synth");
    updateSynthSource();

    const timeLabel = formatTimeDiv(state.timeDivMs);
    els.timeReadout.textContent = `${timeLabel}/DIV`;
    els.timeSliderLabel.textContent = timeLabel;
    els.gainReadout.textContent = `${state.gain.toFixed(1)}x`;
    els.gainSliderLabel.textContent = formatGainDb(state.gain);
    els.offsetSliderLabel.textContent = formatVerticalDivs(state.offset);
    els.ch1GainLabel.textContent = `${state.ch1Gain.toFixed(1)}x`;
    els.ch2GainLabel.textContent = `${state.ch2Gain.toFixed(1)}x`;
    els.ch1OffsetLabel.textContent = formatVerticalDivs(state.ch1Offset);
    els.ch2OffsetLabel.textContent = formatVerticalDivs(state.ch2Offset);
    els.ch1Toggle.textContent = state.ch1Enabled ? "CH1 ON" : "CH1 OFF";
    els.ch2Toggle.textContent = state.ch2Enabled ? "CH2 ON" : "CH2 OFF";
    els.triggerSliderLabel.textContent = formatFullScalePercent(state.triggerLevel);
    els.triggerPosSliderLabel.textContent = `${Math.round(state.triggerPosition * 100)}%`;
    els.triggerPeakOffsetLabel.textContent = `${Math.round(state.triggerPeakOffset * 100)}%`;
    els.persistSliderLabel.textContent = formatPersistence(state.persistence);
    els.brightSliderLabel.textContent = `${Math.round(state.brightness * 100)}%`;
    els.gridSliderLabel.textContent = `${Math.round(state.gridBrightness * 100)}%`;
    els.focusSliderLabel.textContent = `${Math.round(state.focus * 100)}%`;
    els.synthPitchLabel.textContent = `${Math.round(state.synthPitch)} Hz`;
    els.synthDetuneLabel.textContent = `${state.synthDetune >= 0 ? "+" : ""}${state.synthDetune.toFixed(1)} cents`;
    els.synthFilterLabel.textContent = formatFrequency(synthFilterCutoff());
    els.synthMonitorLabel.textContent = `${Math.round(state.synthMonitor)}%`;
    els.synthSpaceLabel.textContent = `${Math.round(state.synthSpace)}%`;
    els.synthSpaceToTrace.textContent = state.synthSpaceToTrace ? "SPACE: TRACE TOO" : "SPACE: MONITOR";
    els.detectorOverlay.textContent = state.detectorOverlay ? "DETECTOR: ON" : "DETECTOR: OFF";
    els.triggerFilterLabel.textContent = state.triggerFilter <= 0.001
      ? "OFF"
      : formatFrequency(triggerFilterCutoff());
  }

  function formatTimeDiv(ms) {
    return ms < 1 ? `${ms.toFixed(1)} ms` : `${ms.toFixed(0)} ms`;
  }

  function formatGainDb(gain) {
    const db = 20 * Math.log10(Math.max(0.001, gain));
    return `${db >= 0 ? "+" : ""}${db.toFixed(1)} dB`;
  }

  function formatVerticalDivs(value) {
    const divisions = value * 2.88;
    return `${divisions >= 0 ? "+" : ""}${divisions.toFixed(1)} div`;
  }

  function formatFullScalePercent(value) {
    const percent = value * 100;
    return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}% FS`;
  }

  function formatFrequency(value) {
    return value >= 1000 ? `${(value / 1000).toFixed(1)} kHz` : `${Math.round(value)} Hz`;
  }

  function persistenceSeconds(value = state.persistence) {
    return value <= 0 ? 0 : 0.025 * Math.pow(200, value);
  }

  function formatPersistence(value) {
    const seconds = persistenceSeconds(value);
    if (!seconds) {
      return "OFF";
    }

    return seconds < 1 ? `${Math.round(seconds * 1000)} ms` : `${seconds.toFixed(1)} s`;
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.max(280, Math.round(rect.width));
    const nextHeight = Math.max(210, Math.round(rect.height));
    const nextRatio = Math.min(window.devicePixelRatio || 1, 2);

    if (
      nextWidth !== widthCss ||
      nextHeight !== heightCss ||
      nextRatio !== pixelRatio
    ) {
      widthCss = nextWidth;
      heightCss = nextHeight;
      pixelRatio = nextRatio;
      gridCanvas.width = Math.round(widthCss * supportLayerPixelRatio);
      gridCanvas.height = Math.round(heightCss * supportLayerPixelRatio);
      persistCanvas.width = Math.round(widthCss * supportLayerPixelRatio);
      persistCanvas.height = Math.round(heightCss * supportLayerPixelRatio);
      canvas.width = Math.round(widthCss * pixelRatio);
      canvas.height = Math.round(heightCss * pixelRatio);
      gridCtx.setTransform(supportLayerPixelRatio, 0, 0, supportLayerPixelRatio, 0, 0);
      persistCtx.setTransform(supportLayerPixelRatio, 0, 0, supportLayerPixelRatio, 0, 0);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      firstFrame = true;
      persistenceCleanupFrame = 0;
      persistenceCleanupSlice = 0;
      screenBaseSignature = "";
    }
  }

  function setupRingBuffer(sampleRate) {
    const seconds = 3;
    const length = Math.ceil(sampleRate * seconds);
    ringLeft = new Float32Array(length);
    ringRight = new Float32Array(length);
    ringWriteIndex = 0;
    ringSamplesWritten = 0;
    recentMixed = null;
    triggerBuffer = null;
  }

  function handleAudioProcess(event) {
    if (!ringLeft || !ringRight) {
      return;
    }

    const input = event.inputBuffer;
    const output = event.outputBuffer;
    const left = input.getChannelData(0);
    const right = input.numberOfChannels > 1 ? input.getChannelData(1) : left;
    const out = output.getChannelData(0);
    out.fill(0);

    for (let i = 0; i < left.length; i += 1) {
      ringLeft[ringWriteIndex] = left[i] || 0;
      ringRight[ringWriteIndex] = right[i] || 0;
      ringWriteIndex = (ringWriteIndex + 1) % ringLeft.length;
      ringSamplesWritten += 1;
    }
  }

  function availableRingSamples() {
    return ringLeft ? Math.min(ringSamplesWritten, ringLeft.length) : 0;
  }

  function channelValue(left, right, mode) {
    if (mode === "left") {
      return left;
    }

    if (mode === "right") {
      return right;
    }

    if (mode === "difference") {
      return (left - right) * 0.5;
    }

    return (left + right) * 0.5;
  }

  function getRecentMixedSamples(count, mode = state.channelMode) {
    const available = availableRingSamples();
    const sampleCount = clamp(Math.floor(count), 0, available);

    if (!ringLeft || !ringRight || sampleCount <= 0) {
      return null;
    }

    if (!recentMixed || recentMixed.length !== sampleCount) {
      recentMixed = new Float32Array(sampleCount);
    }

    const start = (ringWriteIndex - sampleCount + ringLeft.length) % ringLeft.length;
    for (let i = 0; i < sampleCount; i += 1) {
      const ringIndex = (start + i) % ringLeft.length;
      const left = ringLeft[ringIndex] || 0;
      const right = ringRight[ringIndex] || 0;
      recentMixed[i] = channelValue(left, right, mode);
    }

    return recentMixed;
  }

  function updateTraceFromAudio() {
    const available = availableRingSamples();
    if (available < 48) {
      return;
    }

    if (state.displayMode === "xy") {
      lastTrace = buildXYTrace();
    } else if (state.displayMode === "dual") {
      lastTrace = buildDualTrace();
    } else {
      lastTrace = buildTriggeredTrace();
    }

    const meterMode = state.displayMode === "xy"
      ? state.yChannelMode
      : state.displayMode === "dual"
        ? state.ch1Mode
        : state.channelMode;
    updateMeters(getRecentMixedSamples(Math.min(available, 4096), meterMode));
  }

  function buildTriggeredTrace() {
    const sampleRate = state.sampleRate || 48000;
    const targetSamples = Math.round(sampleRate * (state.timeDivMs * 10 / 1000));
    const available = availableRingSamples();
    const sampleCount = clamp(targetSamples, 48, available);
    const searchSeconds = state.triggerSeek === "peak" ? 0.18 : 0.08;
    const searchPad = Math.min(available - sampleCount, Math.max(sampleCount, Math.round(sampleRate * searchSeconds)));
    const searchCount = sampleCount + searchPad;
    const samples = getRecentMixedSamples(searchCount, state.channelMode);
    const triggerSamples = getRecentMixedSamples(searchCount, triggerChannelMode());

    if (!samples || !triggerSamples || samples.length < sampleCount || triggerSamples.length < sampleCount) {
      return lastTrace && lastTrace.mode === "sweep" ? lastTrace : null;
    }

    const triggerWindow = resolveTriggeredWindow(triggerSamples, sampleCount, sampleRate);
    if (!triggerWindow.foundTrigger && state.triggerMode === "normal" && lastTrace) {
      return lastTrace.mode === "sweep" ? lastTrace : null;
    }

    const pointCount = tracePointCount(sampleCount);
    const values = sampleTraceValues(samples, triggerWindow.start, sampleCount, pointCount);
    const detector = buildDetectorOverlay(triggerWindow, sampleCount, pointCount, sweepTransform());

    return { mode: "sweep", values, detector };
  }

  function buildDualTrace() {
    const sampleRate = state.sampleRate || 48000;
    const targetSamples = Math.round(sampleRate * (state.timeDivMs * 10 / 1000));
    const available = availableRingSamples();
    const sampleCount = clamp(targetSamples, 48, available);
    const searchSeconds = state.triggerSeek === "peak" ? 0.18 : 0.08;
    const searchPad = Math.min(available - sampleCount, Math.max(sampleCount, Math.round(sampleRate * searchSeconds)));
    const searchCount = sampleCount + searchPad;
    const triggerSamples = getRecentMixedSamples(searchCount, triggerChannelMode());
    const ch1Samples = getRecentMixedSamples(searchCount, state.ch1Mode);
    const ch2Samples = getRecentMixedSamples(searchCount, state.ch2Mode);

    if (!triggerSamples || !ch1Samples || !ch2Samples || triggerSamples.length < sampleCount) {
      return lastTrace && lastTrace.mode === "dual" ? lastTrace : null;
    }

    const triggerWindow = resolveTriggeredWindow(triggerSamples, sampleCount, sampleRate);
    if (!triggerWindow.foundTrigger && state.triggerMode === "normal" && lastTrace) {
      return lastTrace.mode === "dual" ? lastTrace : null;
    }

    const pointCount = tracePointCount(sampleCount, dualPointDensity);
    const ch1 = {
      enabled: state.ch1Enabled,
      values: sampleTraceValues(ch1Samples, triggerWindow.start, sampleCount, pointCount),
      transform: ch1Transform(),
      label: "CH1"
    };
    const ch2 = {
      enabled: state.ch2Enabled,
      values: sampleTraceValues(ch2Samples, triggerWindow.start, sampleCount, pointCount),
      transform: ch2Transform(),
      label: "CH2"
    };
    const detector = buildDetectorOverlay(triggerWindow, sampleCount, pointCount, detectorTransformForDual());

    return { mode: "dual", ch1, ch2, detector };
  }

  function resolveTriggeredWindow(samples, sampleCount, sampleRate) {
    const preTrigger = Math.floor(sampleCount * state.triggerPosition);
    const result = {
      start: samples.length - sampleCount,
      foundTrigger: state.triggerMode === "free",
      detectorSamples: null
    };

    if (state.triggerMode === "free") {
      return result;
    }

    result.detectorSamples = buildTriggerSamples(samples, sampleRate);
    const minIndex = preTrigger + 1;
    const maxIndex = samples.length - (sampleCount - preTrigger);
    let triggerIndex = -1;

    if (minIndex <= maxIndex) {
      if (state.triggerSeek === "peak") {
        triggerIndex = findPeakTriggerIndex(result.detectorSamples, minIndex, maxIndex, sampleRate);
      } else if (state.triggerSeek === "line") {
        triggerIndex = findLongLineTriggerIndex(result.detectorSamples, minIndex, maxIndex, sampleRate);
      } else {
        triggerIndex = findTriggerIndex(result.detectorSamples, minIndex, maxIndex);
      }
    }

    if (triggerIndex !== -1) {
      result.start = triggerIndex - preTrigger;
      result.foundTrigger = true;
    }

    return result;
  }

  function buildDetectorOverlay(triggerWindow, sampleCount, pointCount, transform) {
    if (!state.detectorOverlay || !triggerWindow.detectorSamples || state.triggerMode === "free") {
      return null;
    }

    return {
      values: sampleTraceValues(triggerWindow.detectorSamples, triggerWindow.start, sampleCount, pointCount),
      transform
    };
  }

  function tracePointCount(sampleCount, density = sweepPointDensity) {
    return Math.max(90, Math.min(sampleCount, maxTracePoints, Math.floor((widthCss || 640) * density)));
  }

  function sampleTraceValues(samples, start, sampleCount, pointCount) {
    const values = new Float32Array(pointCount);
    for (let point = 0; point < pointCount; point += 1) {
      const ratio = pointCount === 1 ? 0 : point / (pointCount - 1);
      const index = start + ratio * (sampleCount - 1);
      values[point] = sampleLinear(samples, index);
    }
    return values;
  }

  function triggerChannelMode() {
    if (state.triggerSource === "ch1") {
      return state.ch1Mode;
    }

    if (state.triggerSource === "ch2") {
      return state.ch2Mode;
    }

    if (state.triggerSource === "mix") {
      return "mix";
    }

    if (state.displayMode === "dual") {
      return state.ch1Mode;
    }

    if (state.displayMode === "xy") {
      return state.yChannelMode;
    }

    return state.channelMode;
  }

  function sweepTransform() {
    return {
      gain: state.gain,
      offset: state.offset,
      invert: false
    };
  }

  function ch1Transform() {
    return {
      gain: state.gain * state.ch1Gain,
      offset: state.ch1Offset,
      invert: state.ch1Invert
    };
  }

  function ch2Transform() {
    return {
      gain: state.gain * state.ch2Gain,
      offset: state.ch2Offset,
      invert: state.ch2Invert
    };
  }

  function detectorTransformForDual() {
    if (state.triggerSource === "ch2") {
      return ch2Transform();
    }

    if (state.triggerSource === "mix") {
      return {
        gain: state.gain,
        offset: 0,
        invert: false
      };
    }

    return ch1Transform();
  }

  function buildTriggerSamples(samples, sampleRate) {
    const cutoff = triggerFilterCutoff();
    if (!cutoff) {
      return samples;
    }

    if (!triggerBuffer || triggerBuffer.length !== samples.length) {
      triggerBuffer = new Float32Array(samples.length);
    }

    const dt = 1 / Math.max(1, sampleRate);
    const rc = 1 / (2 * Math.PI * cutoff);
    const alpha = dt / (rc + dt);
    let stageA = samples[0] || 0;
    let stageB = stageA;
    let stageC = stageA;
    let stageD = stageA;

    for (let i = 0; i < samples.length; i += 1) {
      stageA += alpha * ((samples[i] || 0) - stageA);
      stageB += alpha * (stageA - stageB);
      stageC += alpha * (stageB - stageC);
      stageD += alpha * (stageC - stageD);
      triggerBuffer[i] = stageD;
    }

    return triggerBuffer;
  }

  function findTriggerIndex(samples, minIndex, maxIndex) {
    const hysteresis = triggerHysteresis();
    const low = state.triggerLevel - hysteresis;
    const high = state.triggerLevel + hysteresis;
    let latest = -1;

    if (state.triggerSlope === "falling") {
      let armed = (samples[minIndex - 1] || 0) >= high;
      for (let i = minIndex; i <= maxIndex; i += 1) {
        const value = samples[i] || 0;
        if (armed && value <= low) {
          latest = findInterpolatedCrossing(samples, i, "falling");
          armed = false;
        } else if (value >= high) {
          armed = true;
        }
      }
      return latest;
    }

    let armed = (samples[minIndex - 1] || 0) <= low;
    for (let i = minIndex; i <= maxIndex; i += 1) {
      const value = samples[i] || 0;
      if (armed && value >= high) {
        latest = findInterpolatedCrossing(samples, i, "rising");
        armed = false;
      } else if (value <= low) {
        armed = true;
      }
    }

    return latest;
  }

  function findLongLineTriggerIndex(samples, minIndex, maxIndex, sampleRate) {
    const minRunSamples = Math.max(8, Math.round(sampleRate * 0.00028));
    const minStep = Math.max(0.00008, triggerHysteresis() * 0.05);
    let runStart = minIndex;
    let runSign = 0;
    let flatAllowance = 0;
    let best = null;

    function scoreRun(endIndex) {
      if (!runSign) {
        return;
      }

      const length = endIndex - runStart + 1;
      if (length < minRunSamples) {
        return;
      }

      const startValue = samples[runStart] || 0;
      const endValue = samples[endIndex] || 0;
      const amplitude = Math.abs(endValue - startValue);
      if (amplitude < triggerHysteresis() * 1.5) {
        return;
      }

      const crossesLevel = state.triggerLevel >= Math.min(startValue, endValue) &&
        state.triggerLevel <= Math.max(startValue, endValue);
      const slopeMatches = (runSign > 0 && state.triggerSlope === "rising") ||
        (runSign < 0 && state.triggerSlope === "falling");
      const crossBoost = crossesLevel ? 2.8 : 1;
      const slopeBoost = slopeMatches ? 1.18 : 1;
      const score = length * amplitude * crossBoost * slopeBoost;
      const anchor = crossesLevel
        ? findLevelCrossingInRun(samples, runStart, endIndex, runSign)
        : Math.round((runStart + endIndex) * 0.5);

      if (!best || score >= best.score) {
        best = { score, anchor };
      }
    }

    for (let i = minIndex + 1; i <= maxIndex; i += 1) {
      const delta = (samples[i] || 0) - (samples[i - 1] || 0);
      const sign = Math.abs(delta) >= minStep ? Math.sign(delta) : 0;

      if (!sign) {
        flatAllowance += 1;
        if (flatAllowance <= 2) {
          continue;
        }

        scoreRun(i - flatAllowance);
        runStart = i;
        runSign = 0;
        flatAllowance = 0;
        continue;
      }

      if (!runSign) {
        runStart = i - 1;
        runSign = sign;
        flatAllowance = 0;
        continue;
      }

      if (sign !== runSign) {
        scoreRun(i - 1);
        runStart = i - 1;
        runSign = sign;
      }

      flatAllowance = 0;
    }

    scoreRun(maxIndex);
    return best ? best.anchor : findTriggerIndex(samples, minIndex, maxIndex);
  }

  function findPeakTriggerIndex(samples, minIndex, maxIndex, sampleRate) {
    const peaks = findPeakCandidates(samples, sampleRate, state.triggerPeakMode);
    const period = estimatePeakPeriodSamples(peaks, sampleRate);

    if (!period) {
      peakPeriodEstimate = 0;
      return findTriggerIndex(samples, minIndex, maxIndex);
    }

    const smoothedPeriod = peakPeriodEstimate &&
      period > peakPeriodEstimate * 0.55 &&
      period < peakPeriodEstimate * 1.8
      ? peakPeriodEstimate * 0.68 + period * 0.32
      : period;
    peakPeriodEstimate = smoothedPeriod;

    const phaseOffset = clamp(state.triggerPeakOffset, 0, 1) * smoothedPeriod;
    for (let i = peaks.length - 1; i >= 0; i -= 1) {
      let anchor = peaks[i].index + phaseOffset;

      while (anchor > maxIndex) {
        anchor -= smoothedPeriod;
      }

      while (anchor < minIndex) {
        anchor += smoothedPeriod;
      }

      if (anchor >= minIndex && anchor <= maxIndex) {
        return anchor;
      }
    }

    return findTriggerIndex(samples, minIndex, maxIndex);
  }

  function findPeakCandidates(samples, sampleRate, mode) {
    if (!samples || samples.length < 8) {
      return [];
    }

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < samples.length; i += 1) {
      const value = samples[i] || 0;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }

    const range = max - min;
    if (range < Math.max(0.004, triggerHysteresis() * 1.5)) {
      return [];
    }

    const center = (max + min) * 0.5;
    const threshold = Math.max(range * 0.12, triggerHysteresis() * 1.2);
    const minGap = Math.max(4, Math.round(sampleRate / 12000));
    const highPeaks = mode !== "low";
    const peaks = [];

    for (let i = 2; i < samples.length - 2; i += 1) {
      const previous = samples[i - 1] || 0;
      const value = samples[i] || 0;
      const next = samples[i + 1] || 0;
      const isPeak = highPeaks
        ? value >= previous && value > next && value >= center + threshold
        : value <= previous && value < next && value <= center - threshold;

      if (!isPeak) {
        continue;
      }

      const last = peaks[peaks.length - 1];
      if (last && i - last.index < minGap) {
        const stronger = highPeaks ? value > last.value : value < last.value;
        if (stronger) {
          last.index = i;
          last.value = value;
        }
        continue;
      }

      peaks.push({ index: i, value });
    }

    return peaks;
  }

  function estimatePeakPeriodSamples(peaks, sampleRate) {
    if (!peaks || peaks.length < 3) {
      return 0;
    }

    const minPeriod = Math.max(4, sampleRate / 12000);
    const maxPeriod = sampleRate / 8;
    const gaps = [];
    for (let i = 1; i < peaks.length; i += 1) {
      const gap = peaks[i].index - peaks[i - 1].index;
      if (gap >= minPeriod && gap <= maxPeriod) {
        gaps.push(gap);
      }
    }

    if (gaps.length < 2) {
      return 0;
    }

    const sorted = [...gaps].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length * 0.5)];
    const stable = gaps.filter((gap) => gap >= median * 0.58 && gap <= median * 1.72);
    const recent = (stable.length >= 2 ? stable : gaps).slice(-8);
    const average = recent.reduce((total, gap) => total + gap, 0) / recent.length;
    const frequency = sampleRate / average;

    return frequency >= 8 && frequency <= 12000 ? average : 0;
  }

  function findLevelCrossingInRun(samples, startIndex, endIndex, sign) {
    if (sign < 0) {
      for (let i = startIndex + 1; i <= endIndex; i += 1) {
        if ((samples[i - 1] || 0) >= state.triggerLevel && (samples[i] || 0) <= state.triggerLevel) {
          return interpolateCrossing(samples, i, state.triggerLevel);
        }
      }
      return endIndex;
    }

    for (let i = startIndex + 1; i <= endIndex; i += 1) {
      if ((samples[i - 1] || 0) <= state.triggerLevel && (samples[i] || 0) >= state.triggerLevel) {
        return interpolateCrossing(samples, i, state.triggerLevel);
      }
    }

    return endIndex;
  }

  function findInterpolatedCrossing(samples, endIndex, slope) {
    let index = endIndex;
    if (slope === "falling") {
      while (index > 0 && (samples[index - 1] || 0) < state.triggerLevel) {
        index -= 1;
      }
    } else {
      while (index > 0 && (samples[index - 1] || 0) > state.triggerLevel) {
        index -= 1;
      }
    }

    return interpolateCrossing(samples, index, state.triggerLevel);
  }

  function interpolateCrossing(samples, index, level) {
    const leftIndex = clamp(index - 1, 0, samples.length - 1);
    const rightIndex = clamp(index, 0, samples.length - 1);
    const left = samples[leftIndex] || 0;
    const right = samples[rightIndex] || 0;
    const delta = right - left;
    const fraction = Math.abs(delta) > 0.0000001 ? clamp((level - left) / delta, 0, 1) : 1;
    return leftIndex + fraction;
  }

  function sampleLinear(samples, index) {
    const leftIndex = clamp(Math.floor(index), 0, samples.length - 1);
    const rightIndex = clamp(leftIndex + 1, 0, samples.length - 1);
    const fraction = clamp(index - leftIndex, 0, 1);
    return (samples[leftIndex] || 0) * (1 - fraction) + (samples[rightIndex] || 0) * fraction;
  }

  function triggerFilterCutoff() {
    const amount = clamp(state.triggerFilter, 0, 1);
    if (amount <= 0.001 && (state.triggerSeek === "line" || state.triggerSeek === "peak")) {
      return 1400;
    }

    if (amount <= 0.001) {
      return 0;
    }

    const minHz = 120;
    const maxHz = 12000;
    return maxHz * Math.pow(minHz / maxHz, amount);
  }

  function triggerHysteresis() {
    return 0.004 + Math.pow(clamp(state.triggerFilter, 0, 1), 1.6) * 0.028;
  }

  function buildXYTrace() {
    const sampleRate = state.sampleRate || 48000;
    const targetSamples = Math.round(sampleRate * (state.timeDivMs * 10 / 1000));
    const available = availableRingSamples();
    const sampleCount = clamp(targetSamples, 48, available);

    if (!ringLeft || !ringRight || sampleCount < 48) {
      return lastTrace && lastTrace.mode === "xy" ? lastTrace : null;
    }

    const pointCount = tracePointCount(sampleCount, xyPointDensity);
    const targetLength = pointCount * 2;
    if (!workingTrace || workingTrace.length !== targetLength) {
      workingTrace = new Float32Array(targetLength);
    }

    const start = (ringWriteIndex - sampleCount + ringLeft.length) % ringLeft.length;
    for (let point = 0; point < pointCount; point += 1) {
      const ratio = pointCount === 1 ? 0 : point / (pointCount - 1);
      const ringOffset = Math.floor(ratio * (sampleCount - 1));
      const ringIndex = (start + ringOffset) % ringLeft.length;
      const left = ringLeft[ringIndex] || 0;
      const right = ringRight[ringIndex] || 0;
      const x = channelValue(left, right, state.xChannelMode);
      const y = channelValue(left, right, state.yChannelMode);

      workingTrace[point * 2] = state.xInvert ? -x : x;
      workingTrace[point * 2 + 1] = state.yInvert ? -y : y;
    }

    return { mode: "xy", values: workingTrace };
  }

  function updateMeters(samples) {
    if (!samples || !state.isCapturing) {
      els.rmsReadout.textContent = "RMS --";
      els.peakReadout.textContent = "PK --";
      els.freqReadout.textContent = "-- Hz";
      return;
    }

    const count = Math.min(samples.length, 4096);
    const start = samples.length - count;
    let sum = 0;
    let peak = 0;

    for (let i = start; i < samples.length; i += 1) {
      const value = samples[i] || 0;
      sum += value * value;
      peak = Math.max(peak, Math.abs(value));
    }

    const rms = Math.sqrt(sum / count);
    const freq = estimateFrequency(samples, start, count);
    els.rmsReadout.textContent = `RMS ${rms.toFixed(3)}`;
    els.peakReadout.textContent = `PK ${peak.toFixed(3)}`;
    els.freqReadout.textContent = freq ? `${freq.toFixed(freq < 100 ? 1 : 0)} Hz` : "-- Hz";
  }

  function estimateFrequency(samples, start, count) {
    const crossings = [];
    const end = start + count;

    for (let i = start + 1; i < end; i += 1) {
      const previous = samples[i - 1];
      const current = samples[i];
      if (previous < 0 && current >= 0) {
        crossings.push(i);
      }
    }

    if (crossings.length < 2 || !state.sampleRate) {
      return null;
    }

    const period = (crossings[crossings.length - 1] - crossings[0]) / (crossings.length - 1);
    if (period <= 0) {
      return null;
    }

    const frequency = state.sampleRate / period;
    return frequency >= 15 && frequency <= 20000 ? frequency : null;
  }

  function autoSetScope(options = {}) {
    const quiet = Boolean(options && options.quiet);
    const available = availableRingSamples();
    if (!state.isCapturing || available < 128) {
      if (!quiet) {
        flashStatus("AUTO: NO SIGNAL", "warn");
      }
      return false;
    }

    const sampleCount = Math.min(available, Math.max(4096, Math.round((state.sampleRate || 48000) * 0.25)));
    const yMode = state.displayMode === "xy"
      ? state.yChannelMode
      : state.displayMode === "dual"
        ? state.ch1Mode
        : state.channelMode;
    const yStats = analyseChannel(sampleCount, yMode);
    const xStats = state.displayMode === "xy" ? analyseChannel(sampleCount, state.xChannelMode) : null;
    const ch2Stats = state.displayMode === "dual" ? analyseChannel(sampleCount, state.ch2Mode) : null;
    const yAmplitude = Math.max(0.000001, (yStats.max - yStats.min) * 0.5);
    const xAmplitude = xStats ? Math.max(0.000001, (xStats.max - xStats.min) * 0.5) : 0;
    const ch2Amplitude = ch2Stats ? Math.max(0.000001, (ch2Stats.max - ch2Stats.min) * 0.5) : 0;
    const amplitude = Math.max(yAmplitude, xAmplitude, ch2Amplitude);

    if (amplitude < 0.00025) {
      if (!quiet) {
        flashStatus("AUTO: NO SIGNAL", "warn");
      }
      return false;
    }

    const targetGain = clamp(1.05 / amplitude, Number(els.gainSlider.min), Number(els.gainSlider.max));
    els.gainSlider.value = targetGain.toFixed(1);

    if (state.displayMode === "sweep") {
      const center = (yStats.max + yStats.min) * 0.5;
      els.offsetSlider.value = clamp(-center * targetGain, Number(els.offsetSlider.min), Number(els.offsetSlider.max)).toFixed(2);
      els.triggerSlider.value = clamp(center, Number(els.triggerSlider.min), Number(els.triggerSlider.max)).toFixed(3);
      els.triggerMode.value = "auto";
    }

    const frequencySamples = getRecentMixedSamples(sampleCount, yMode);
    const frequency = frequencySamples ? estimateFrequency(frequencySamples, 0, frequencySamples.length) : null;
    if (frequency) {
      const targetTimeDiv = 300 / frequency;
      let bestIndex = 0;
      let bestDistance = Infinity;
      timeOptionsMs.forEach((option, index) => {
        const distance = Math.abs(Math.log(option / targetTimeDiv));
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      els.timeSlider.value = String(bestIndex);
    }

    syncControls();
    firstFrame = true;
    if (!quiet) {
      flashStatus("AUTO SET", "live");
    }
    return true;
  }

  function analyseChannel(count, mode) {
    const samples = getRecentMixedSamples(count, mode);
    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < samples.length; i += 1) {
      min = Math.min(min, samples[i]);
      max = Math.max(max, samples[i]);
    }

    return { min, max };
  }

  function flashStatus(text, mode) {
    const previousText = els.statusText.textContent;
    const previousMode = els.statusLight.classList.contains("live")
      ? "live"
      : els.statusLight.classList.contains("error")
        ? "error"
        : els.statusLight.classList.contains("warn")
          ? "warn"
          : "standby";

    setStatus(text, mode);
    window.setTimeout(() => {
      if (els.statusText.textContent === text) {
        setStatus(previousText, previousMode);
      }
    }, 900);
  }

  function drawFrame(deltaSeconds) {
    const w = widthCss;
    const h = heightCss;
    const clearAlpha = firstFrame ? 1 : persistenceFadeAlpha(deltaSeconds);

    drawScreenBase(w, h);
    fadePersistence(clearAlpha, w, h);
    ctx.clearRect(0, 0, w, h);

    if (lastTrace && lastTrace.mode === "xy") {
      drawXYPersistence(lastTrace.values, w, h);
      drawXYTrace(lastTrace.values, w, h);
    } else if (lastTrace && lastTrace.mode === "dual") {
      drawDualPersistence(lastTrace, w, h);
      drawDetectorTrace(lastTrace.detector, w, h);
      drawDualTrace(lastTrace, w, h);
    } else if (lastTrace && lastTrace.mode === "sweep") {
      drawTracePersistence(lastTrace.values, w, h);
      drawDetectorTrace(lastTrace.detector, w, h);
      drawTrace(lastTrace.values, w, h);
    } else {
      drawCenterLine(w, h);
    }

    if (!state.isCapturing) {
      drawStandbyText(w, h);
    }

    firstFrame = false;
  }

  function persistenceFadeAlpha(deltaSeconds) {
    const seconds = persistenceSeconds();
    if (!seconds) {
      return 1;
    }

    return clamp(1 - Math.exp(-deltaSeconds / seconds), 0.001, 1);
  }

  function fadePersistence(alpha, w, h) {
    if (firstFrame || alpha >= 0.99) {
      persistCtx.clearRect(0, 0, w, h);
      persistenceCleanupFrame = 0;
      persistenceCleanupSlice = 0;
      return;
    }

    persistCtx.save();
    persistCtx.globalCompositeOperation = "destination-out";
    persistCtx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    persistCtx.fillRect(0, 0, w, h);
    persistCtx.restore();
    cleanupPersistenceFloor();
  }

  function cleanupPersistenceFloor() {
    if (!enablePersistenceFloorCleanup || state.persistence <= 0.01 || !persistCanvas.width || !persistCanvas.height) {
      return;
    }

    persistenceCleanupFrame = (persistenceCleanupFrame + 1) % persistenceCleanupInterval;
    if (persistenceCleanupFrame !== 0) {
      return;
    }

    const sliceCount = Math.max(1, Math.min(persistenceCleanupSlices, persistCanvas.width));
    const sliceWidth = Math.ceil(persistCanvas.width / sliceCount);
    const x = Math.min(persistenceCleanupSlice * sliceWidth, persistCanvas.width - 1);
    const width = Math.min(sliceWidth, persistCanvas.width - x);
    persistenceCleanupSlice = (persistenceCleanupSlice + 1) % sliceCount;

    const image = persistCtx.getImageData(x, 0, width, persistCanvas.height);
    const data = image.data;
    const alphaCutoff = Math.round(2 + (1 - state.persistence) * 8);
    let changed = false;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] <= alphaCutoff) {
        if (data[i + 3]) {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 0;
          changed = true;
        }
      }
    }

    if (changed) {
      persistCtx.putImageData(image, x, 0);
    }
  }

  function drawScreenBase(w, h) {
    const triggerTransform = state.displayMode === "dual" ? detectorTransformForDual() : sweepTransform();
    const signature = [
      Math.round(w),
      Math.round(h),
      state.gridBrightness.toFixed(3),
      state.triggerMode,
      state.displayMode,
      state.triggerSeek,
      state.triggerLevel.toFixed(4),
      state.triggerPosition.toFixed(4),
      state.triggerSource,
      triggerTransform.gain.toFixed(4),
      triggerTransform.offset.toFixed(4),
      triggerTransform.invert ? "1" : "0"
    ].join("|");

    if (signature === screenBaseSignature) {
      return;
    }

    screenBaseSignature = signature;
    const glow = gridCtx.createRadialGradient(w * 0.5, h * 0.46, 0, w * 0.5, h * 0.46, Math.max(w, h) * 0.72);
    glow.addColorStop(0, "#07220e");
    glow.addColorStop(0.56, "#041308");
    glow.addColorStop(1, "#010502");

    gridCtx.fillStyle = glow;
    gridCtx.fillRect(0, 0, w, h);
    drawGrid(w, h);
    drawTriggerLevel(w, h);
  }

  function drawGrid(w, h) {
    const gridAlpha = clamp(state.gridBrightness, 0, 1);

    gridCtx.save();
    gridCtx.lineCap = "butt";
    gridCtx.lineJoin = "miter";

    gridCtx.strokeStyle = `rgba(71, 255, 122, ${0.08 * gridAlpha})`;
    gridCtx.lineWidth = 1;
    gridCtx.beginPath();
    for (let x = 0; x <= 50; x += 1) {
      const px = (x / 50) * w;
      gridCtx.moveTo(px, 0);
      gridCtx.lineTo(px, h);
    }
    for (let y = 0; y <= 40; y += 1) {
      const py = (y / 40) * h;
      gridCtx.moveTo(0, py);
      gridCtx.lineTo(w, py);
    }
    gridCtx.stroke();

    gridCtx.strokeStyle = `rgba(121, 255, 151, ${0.28 * gridAlpha})`;
    gridCtx.lineWidth = 1.1;
    gridCtx.beginPath();
    for (let x = 0; x <= 10; x += 1) {
      const px = (x / 10) * w;
      gridCtx.moveTo(px, 0);
      gridCtx.lineTo(px, h);
    }
    for (let y = 0; y <= 8; y += 1) {
      const py = (y / 8) * h;
      gridCtx.moveTo(0, py);
      gridCtx.lineTo(w, py);
    }
    gridCtx.stroke();

    gridCtx.strokeStyle = `rgba(188, 255, 197, ${0.48 * gridAlpha})`;
    gridCtx.lineWidth = 1.4;
    gridCtx.beginPath();
    gridCtx.moveTo(w * 0.5, 0);
    gridCtx.lineTo(w * 0.5, h);
    gridCtx.moveTo(0, h * 0.5);
    gridCtx.lineTo(w, h * 0.5);
    gridCtx.stroke();

    gridCtx.restore();
  }

  function drawTriggerLevel(w, h) {
    if (state.triggerMode === "free" || state.displayMode === "xy") {
      return;
    }

    const triggerTransform = state.displayMode === "dual" ? detectorTransformForDual() : sweepTransform();
    const y = signalToYWithTransform(state.triggerLevel, h, triggerTransform);
    const x = w * state.triggerPosition;
    gridCtx.save();
    gridCtx.setLineDash([8, 7]);
    gridCtx.shadowColor = "rgba(255, 177, 59, 0.8)";
    gridCtx.shadowBlur = 7;
    gridCtx.strokeStyle = "rgba(255, 189, 77, 0.86)";
    gridCtx.lineWidth = 1.6;

    if (state.triggerSeek !== "peak") {
      gridCtx.beginPath();
      gridCtx.moveTo(0, y);
      gridCtx.lineTo(w, y);
      gridCtx.stroke();
    }

    gridCtx.beginPath();
    gridCtx.moveTo(x, 0);
    gridCtx.lineTo(x, h);
    gridCtx.stroke();
    gridCtx.setLineDash([]);
    gridCtx.fillStyle = "rgba(255, 189, 77, 0.9)";
    if (state.triggerSeek !== "peak") {
      gridCtx.beginPath();
      gridCtx.moveTo(8, y);
      gridCtx.lineTo(0, y - 5);
      gridCtx.lineTo(0, y + 5);
      gridCtx.closePath();
      gridCtx.fill();
      gridCtx.beginPath();
      gridCtx.moveTo(w - 8, y);
      gridCtx.lineTo(w, y - 5);
      gridCtx.lineTo(w, y + 5);
      gridCtx.closePath();
      gridCtx.fill();
    }

    gridCtx.beginPath();
    gridCtx.moveTo(x, 8);
    gridCtx.lineTo(x - 5, 0);
    gridCtx.lineTo(x + 5, 0);
    gridCtx.closePath();
    gridCtx.fill();
    gridCtx.beginPath();
    gridCtx.moveTo(x, h - 8);
    gridCtx.lineTo(x - 5, h);
    gridCtx.lineTo(x + 5, h);
    gridCtx.closePath();
    gridCtx.fill();
    gridCtx.restore();
  }

  function drawTrace(trace, w, h) {
    drawStyledTrace(trace, w, h, sweepTransform(), {
      glow: "71, 255, 122",
      core: "175, 255, 188",
      glowAlpha: 0.16,
      coreAlpha: 0.82,
      shadowAlpha: 0.65,
      widthBoost: 2
    });
  }

  function drawDualTrace(trace, w, h) {
    if (trace.ch1 && trace.ch1.enabled) {
      drawStyledTrace(trace.ch1.values, w, h, trace.ch1.transform, {
        glow: "71, 255, 122",
        core: "175, 255, 188",
        glowAlpha: 0.15,
        coreAlpha: 0.78,
        shadowAlpha: 0.58,
        widthBoost: 1.8
      });
    }

    if (trace.ch2 && trace.ch2.enabled) {
      drawStyledTrace(trace.ch2.values, w, h, trace.ch2.transform, {
        glow: "83, 235, 184",
        core: "152, 255, 216",
        glowAlpha: 0.13,
        coreAlpha: 0.72,
        shadowAlpha: 0.5,
        widthBoost: 1.6
      });
    }
  }

  function drawStyledTrace(trace, w, h, transform, style) {
    const blur = 2 + (1 - state.focus) * 24;
    const coreWidth = 1 + (1 - state.focus) * 3.8;
    const glowWidth = coreWidth + style.widthBoost + (1 - state.focus) * 7;
    const alpha = clamp(state.brightness, 0.25, 1.4);
    const glowAlpha = clamp(style.glowAlpha * alpha, 0, 1);
    const coreAlpha = clamp(style.coreAlpha * alpha, 0, 1);
    const shadowAlpha = clamp(style.shadowAlpha * alpha, 0, 1);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    tracePathOn(ctx, trace, w, h, transform);
    ctx.shadowColor = `rgba(${style.glow}, ${shadowAlpha})`;
    ctx.shadowBlur = blur + 8;
    ctx.strokeStyle = `rgba(${style.glow}, ${glowAlpha})`;
    ctx.lineWidth = glowWidth;
    ctx.stroke();

    tracePathOn(ctx, trace, w, h, transform);
    ctx.shadowBlur = blur;
    ctx.strokeStyle = `rgba(${style.core}, ${coreAlpha})`;
    ctx.lineWidth = coreWidth;
    ctx.stroke();
    ctx.restore();
  }

  function drawTracePersistence(trace, w, h) {
    drawPersistenceTrace(trace, w, h, sweepTransform(), "71, 255, 122", 0.007, 0.03, 0.045);
  }

  function drawDualPersistence(trace, w, h) {
    if (trace.ch1 && trace.ch1.enabled) {
      drawPersistenceTrace(trace.ch1.values, w, h, trace.ch1.transform, "71, 255, 122", 0.006, 0.026, 0.04);
    }

    if (trace.ch2 && trace.ch2.enabled) {
      drawPersistenceTrace(trace.ch2.values, w, h, trace.ch2.transform, "83, 235, 184", 0.005, 0.024, 0.036);
    }
  }

  function drawPersistenceTrace(trace, w, h, transform, rgb, baseAlpha, persistenceBoost, maxAlpha) {
    if (state.persistence <= 0.01) {
      return;
    }

    const alpha = clamp(state.brightness, 0.25, 1.4);
    const persistenceAlpha = clamp((baseAlpha + persistenceBoost * (1 - state.persistence)) * alpha, 0.004, maxAlpha);
    const blur = 6 + (1 - state.focus) * 28;
    const lineWidth = 2.8 + (1 - state.focus) * 6;

    persistCtx.save();
    persistCtx.lineCap = "round";
    persistCtx.lineJoin = "round";
    persistCtx.globalCompositeOperation = "lighter";

    tracePathOn(persistCtx, trace, w, h, transform);
    persistCtx.shadowColor = `rgba(${rgb}, ${persistenceAlpha})`;
    persistCtx.shadowBlur = blur;
    persistCtx.strokeStyle = `rgba(${rgb}, ${persistenceAlpha})`;
    persistCtx.lineWidth = lineWidth;
    persistCtx.stroke();
    persistCtx.restore();
  }

  function drawDetectorTrace(detector, w, h) {
    if (!detector || !detector.values) {
      return;
    }

    const alpha = clamp(state.brightness, 0.25, 1.4);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([5, 5]);
    tracePathOn(ctx, detector.values, w, h, detector.transform);
    ctx.shadowColor = `rgba(255, 188, 78, ${0.34 * alpha})`;
    ctx.shadowBlur = 7 + (1 - state.focus) * 10;
    ctx.strokeStyle = `rgba(255, 196, 93, ${0.42 * alpha})`;
    ctx.lineWidth = 1.2 + (1 - state.focus) * 1.6;
    ctx.stroke();
    ctx.restore();
  }

  function drawXYTrace(points, w, h) {
    const blur = 2 + (1 - state.focus) * 24;
    const coreWidth = 1 + (1 - state.focus) * 3.8;
    const glowWidth = coreWidth + 2.5 + (1 - state.focus) * 7;
    const alpha = clamp(state.brightness, 0.25, 1.4);
    const glowAlpha = clamp(0.18 * alpha, 0, 1);
    const coreAlpha = clamp(0.88 * alpha, 0, 1);
    const shadowAlpha = clamp(0.72 * alpha, 0, 1);

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    xyPathOn(ctx, points, w, h);
    ctx.shadowColor = `rgba(71, 255, 122, ${shadowAlpha})`;
    ctx.shadowBlur = blur + 10;
    ctx.strokeStyle = `rgba(71, 255, 122, ${glowAlpha})`;
    ctx.lineWidth = glowWidth;
    ctx.stroke();

    xyPathOn(ctx, points, w, h);
    ctx.shadowBlur = blur;
    ctx.strokeStyle = `rgba(180, 255, 192, ${coreAlpha})`;
    ctx.lineWidth = coreWidth;
    ctx.stroke();
    ctx.restore();
  }

  function drawXYPersistence(points, w, h) {
    if (state.persistence <= 0.01) {
      return;
    }

    const alpha = clamp(state.brightness, 0.25, 1.4);
    const persistenceAlpha = clamp((0.006 + 0.028 * (1 - state.persistence)) * alpha, 0.004, 0.042);
    const blur = 6 + (1 - state.focus) * 28;
    const lineWidth = 3 + (1 - state.focus) * 6;

    persistCtx.save();
    persistCtx.lineCap = "round";
    persistCtx.lineJoin = "round";
    persistCtx.globalCompositeOperation = "lighter";

    xyPathOn(persistCtx, points, w, h);
    persistCtx.shadowColor = `rgba(71, 255, 122, ${persistenceAlpha})`;
    persistCtx.shadowBlur = blur;
    persistCtx.strokeStyle = `rgba(71, 255, 122, ${persistenceAlpha})`;
    persistCtx.lineWidth = lineWidth;
    persistCtx.stroke();
    persistCtx.restore();
  }

  function tracePathOn(target, trace, w, h, transform = sweepTransform()) {
    target.beginPath();
    for (let i = 0; i < trace.length; i += 1) {
      const x = trace.length === 1 ? 0 : (i / (trace.length - 1)) * w;
      const y = signalToYWithTransform(trace[i], h, transform);
      if (i === 0) {
        target.moveTo(x, y);
      } else {
        target.lineTo(x, y);
      }
    }
  }

  function xyPathOn(target, points, w, h) {
    target.beginPath();
    for (let i = 0; i < points.length; i += 2) {
      const x = signalToX(points[i], w);
      const y = signalToY(points[i + 1], w, h, false);
      if (i === 0) {
        target.moveTo(x, y);
      } else {
        target.lineTo(x, y);
      }
    }
  }

  function signalToX(value, w) {
    const scaled = value * state.gain;
    return clamp(w * 0.5 + scaled * w * 0.38, -w * 0.12, w * 1.12);
  }

  function signalToY(value, w, h, useOffset = true) {
    const scaled = value * state.gain + (useOffset ? state.offset : 0);
    return clamp(h * 0.5 - scaled * h * 0.36, -h * 0.12, h * 1.12);
  }

  function signalToYWithTransform(value, h, transform) {
    const raw = transform && transform.invert ? -value : value;
    const gain = transform && Number.isFinite(transform.gain) ? transform.gain : state.gain;
    const offset = transform && Number.isFinite(transform.offset) ? transform.offset : state.offset;
    const scaled = raw * gain + offset;
    return clamp(h * 0.5 - scaled * h * 0.36, -h * 0.12, h * 1.12);
  }

  function drawCenterLine(w, h) {
    ctx.save();
    ctx.strokeStyle = "rgba(128, 255, 154, 0.45)";
    ctx.shadowColor = "rgba(71, 255, 122, 0.6)";
    ctx.shadowBlur = 9;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
    ctx.restore();
  }

  function drawStandbyText(w, h) {
    ctx.save();
    ctx.fillStyle = "rgba(162, 255, 178, 0.38)";
    ctx.shadowColor = "rgba(71, 255, 122, 0.7)";
    ctx.shadowBlur = 8;
    ctx.font = `${Math.max(11, Math.round(w / 64))}px Lucida Console, Consolas, monospace`;
    ctx.textAlign = "center";
    ctx.fillText("STANDBY", w * 0.5, h * 0.55);
    ctx.restore();
  }

  function render(timestamp = 0) {
    const deltaSeconds = lastFrameTime === null
      ? 1 / 60
      : clamp((timestamp - lastFrameTime) / 1000, 1 / 240, 0.1);
    lastFrameTime = timestamp;
    resizeCanvas();

    if (state.isCapturing && !state.isHeld) {
      updateTraceFromAudio();
    }

    drawFrame(deltaSeconds);
    window.requestAnimationFrame(render);
  }

  els.startButton.addEventListener("click", () => {
    if (state.isCapturing) {
      stopCapture(true);
    } else {
      startCapture();
    }
  });

  els.holdButton.addEventListener("click", () => {
    state.isHeld = !state.isHeld;
    syncButtons();
  });

  els.autoButton.addEventListener("click", autoSetScope);

  els.controlsToggle.addEventListener("click", () => {
    const controlsHidden = document.body.classList.toggle("controls-hidden");
    const label = controlsHidden ? "Show controls" : "Hide controls";
    els.controlsToggle.setAttribute("aria-pressed", String(controlsHidden));
    els.controlsToggle.setAttribute("aria-label", label);
    els.controlsToggle.title = label;
    els.controlsToggle.querySelector("span").textContent = controlsHidden ? "\u2039" : "\u203a";
    firstFrame = true;
  });

  els.inputSelect.addEventListener("change", () => {
    if (state.isCapturing && state.sourceMode === "input") {
      startCapture();
    }
  });

  els.sourceSelect.addEventListener("change", () => {
    syncControls();
    if (state.isCapturing) {
      startCapture();
    }
  });

  els.synthSpaceToTrace.addEventListener("click", () => {
    const next = els.synthSpaceToTrace.getAttribute("aria-pressed") !== "true";
    els.synthSpaceToTrace.setAttribute("aria-pressed", String(next));
    syncControls();
  });

  [els.ch1Toggle, els.ch2Toggle, els.detectorOverlay].forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.getAttribute("aria-pressed") !== "true";
      button.setAttribute("aria-pressed", String(next));
      syncControls();
    });
  });

  function handleRangeWheel(event) {
    const control = event.currentTarget;
    const min = Number(control.min);
    const max = Number(control.max);
    const baseStep = Number(control.dataset.wheelStep || control.step) || 1;
    const fineStep = Number(control.dataset.wheelFineStep || baseStep);
    const coarseStep = Number(control.dataset.wheelCoarseStep || baseStep * 5);
    const step = event.ctrlKey ? fineStep : event.shiftKey ? coarseStep : baseStep;
    const direction = event.deltaY < 0 ? 1 : -1;
    const next = clamp(Number(control.value) + direction * step, min, max);
    const precision = step < 1 ? String(step).split(".")[1].length : 0;

    event.preventDefault();
    control.value = precision ? next.toFixed(precision) : String(Math.round(next / step) * step);
    control.dispatchEvent(new Event("input", { bubbles: true }));
  }

  [
    els.sourceSelect,
    els.synthWave,
    els.synthPitch,
    els.synthDetune,
    els.synthFilter,
    els.synthMonitor,
    els.synthSpace,
    els.synthSpaceToTrace,
    els.displayMode,
    els.channelSelect,
    els.ch1Select,
    els.ch2Select,
    els.ch1Gain,
    els.ch2Gain,
    els.ch1Offset,
    els.ch2Offset,
    els.ch1Invert,
    els.ch2Invert,
    els.xChannelSelect,
    els.yChannelSelect,
    els.xInvert,
    els.yInvert,
    els.triggerMode,
    els.triggerSlope,
    els.triggerFilter,
    els.triggerSeek,
    els.triggerPeakMode,
    els.triggerPeakOffset,
    els.triggerSource,
    els.timeSlider,
    els.gainSlider,
    els.offsetSlider,
    els.triggerSlider,
    els.triggerPosSlider,
    els.persistSlider,
    els.brightSlider,
    els.gridSlider,
    els.focusSlider
  ].forEach((control) => control.addEventListener("input", syncControls));

  [
    els.synthPitch,
    els.synthDetune,
    els.synthFilter,
    els.synthMonitor,
    els.synthSpace,
    els.ch1Gain,
    els.ch2Gain,
    els.ch1Offset,
    els.ch2Offset,
    els.timeSlider,
    els.gainSlider,
    els.offsetSlider,
    els.triggerSlider,
    els.triggerFilter,
    els.triggerPosSlider,
    els.triggerPeakOffset,
    els.persistSlider,
    els.brightSlider,
    els.gridSlider,
    els.focusSlider
  ].forEach((control) => control.addEventListener("wheel", handleRangeWheel, { passive: false }));

  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
  }

  window.addEventListener("beforeunload", () => stopCapture(false));
  window.addEventListener("resize", () => {
    firstFrame = true;
  });

  els.displayMode.value = state.displayMode;
  syncControls();
  syncButtons();
  refreshDevices().catch(() => {});
  render();
})();
