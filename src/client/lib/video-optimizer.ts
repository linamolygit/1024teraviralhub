// src/client/lib/video-optimizer.ts — Client-Side Smart Video Compression for Zero-Buffering Playback

export interface VideoOptimizationResult {
  file: File
  liteFile?: File
  originalSize: number
  optimizedSize: number
  liteSize?: number
  savedPct: number
  wasCompressed: boolean
  durationSeconds?: number
  width?: number
  height?: number
}

/**
 * Optimizes a video file in the browser for high-speed, 0-buffering web playback.
 * - Simultaneously produces two streams in a single playback pass:
 *   1. Master 720p HD stream (~850Kbps - 1.1Mbps) for high-speed WiFi / 4G / 5G visitors.
 *   2. Adaptive 480p Lite stream (~380Kbps - 450Kbps) for instant 0-buffering playback on 2G / 3G / Mobile Data Saver.
 * - Original audio is preserved using Web Audio API destination routing without speaker blast.
 * - If browser lacks recording capabilities, gracefully falls back to the original file.
 */
export async function optimizeVideo(
  sourceFile: File,
  onProgress?: (stage: string, progressPct: number) => void
): Promise<VideoOptimizationResult> {
  const originalSize = sourceFile.size
  const isWebFormat = /\.(mp4|webm)$/i.test(sourceFile.name)

  // 1. If already ultra-lightweight (< 400KB) and web-format, no re-encoding needed
  if (originalSize <= 400 * 1024 && isWebFormat) {
    onProgress?.('Video is already ultra-lightweight (<400KB)', 100)
    return {
      file: sourceFile,
      originalSize,
      optimizedSize: originalSize,
      savedPct: 0,
      wasCompressed: false,
    }
  }

  // 2. Check browser support for MediaRecorder and canvas stream capture
  const hasMediaRecorder = typeof window !== 'undefined' && 'MediaRecorder' in window
  const hasCaptureStream = typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype

  if (!hasMediaRecorder || !hasCaptureStream) {
    onProgress?.('Browser direct upload mode active', 100)
    return {
      file: sourceFile,
      originalSize,
      optimizedSize: originalSize,
      savedPct: 0,
      wasCompressed: false,
    }
  }

  onProgress?.('Analyzing video specifications & dual-stream bitrates...', 8)

  // Create temporary in-memory video element
  const video = document.createElement('video')
  video.playsInline = true
  video.crossOrigin = 'anonymous'
  const objectUrl = URL.createObjectURL(sourceFile)
  video.src = objectUrl

  let audioCtx: AudioContext | null = null

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Unable to read video metadata'))
      setTimeout(() => reject(new Error('Video loading timed out')), 15000)
    })

    const duration = video.duration && !isNaN(video.duration) && isFinite(video.duration) ? video.duration : 10
    const originalWidth = video.videoWidth || 1280
    const originalHeight = video.videoHeight || 720

    // Compute HD Dimensions (Max 720p short dimension, 1280 max dimension)
    let hdWidth = originalWidth
    let hdHeight = originalHeight
    const maxDimensionHD = 1280
    const maxShortDimensionHD = 720

    if (Math.max(originalWidth, originalHeight) > maxDimensionHD) {
      if (originalWidth >= originalHeight) {
        hdWidth = maxDimensionHD
        hdHeight = Math.round((originalHeight * maxDimensionHD) / originalWidth)
      } else {
        hdHeight = maxDimensionHD
        hdWidth = Math.round((originalWidth * maxDimensionHD) / originalHeight)
      }
    }

    const minDimHD = Math.min(hdWidth, hdHeight)
    if (minDimHD > maxShortDimensionHD) {
      const scale = maxShortDimensionHD / minDimHD
      hdWidth = Math.round(hdWidth * scale)
      hdHeight = Math.round(hdHeight * scale)
    }

    hdWidth = hdWidth % 2 === 0 ? hdWidth : hdWidth - 1
    hdHeight = hdHeight % 2 === 0 ? hdHeight : hdHeight - 1

    // Compute Lite Dimensions (Max 480p short dimension, 854 max dimension)
    let liteWidth = originalWidth
    let liteHeight = originalHeight
    const maxDimensionLite = 854
    const maxShortDimensionLite = 480

    if (Math.max(originalWidth, originalHeight) > maxDimensionLite) {
      if (originalWidth >= originalHeight) {
        liteWidth = maxDimensionLite
        liteHeight = Math.round((originalHeight * maxDimensionLite) / originalWidth)
      } else {
        liteHeight = maxDimensionLite
        liteWidth = Math.round((originalWidth * maxDimensionLite) / originalHeight)
      }
    }

    const minDimLite = Math.min(liteWidth, liteHeight)
    if (minDimLite > maxShortDimensionLite) {
      const scale = maxShortDimensionLite / minDimLite
      liteWidth = Math.round(liteWidth * scale)
      liteHeight = Math.round(liteHeight * scale)
    }

    liteWidth = liteWidth % 2 === 0 ? liteWidth : liteWidth - 1
    liteHeight = liteHeight % 2 === 0 ? liteHeight : liteHeight - 1

    // Setup HD Canvas
    const canvasHD = document.createElement('canvas')
    canvasHD.width = hdWidth
    canvasHD.height = hdHeight
    const ctxHD = canvasHD.getContext('2d', { alpha: false })
    if (!ctxHD) throw new Error('Could not create HD canvas context')

    // Setup Lite Canvas
    const canvasLite = document.createElement('canvas')
    canvasLite.width = liteWidth
    canvasLite.height = liteHeight
    const ctxLite = canvasLite.getContext('2d', { alpha: false })
    if (!ctxLite) throw new Error('Could not create Lite canvas context')

    // Target Bitrates
    let targetBitrateHD = 950_000
    if (duration > 0) {
      const targetBytes = Math.min(originalSize * 0.5, duration * 125_000)
      targetBitrateHD = Math.max(550_000, Math.min(1_200_000, Math.round((targetBytes * 8) / duration)))
    }
    const targetBitrateLite = Math.max(300_000, Math.min(500_000, Math.round(targetBitrateHD * 0.45)))

    onProgress?.(`Encoding Dual Adaptive Streams: 720p HD (${hdWidth}x${hdHeight}) + 480p Lite (${liteWidth}x${liteHeight})...`, 15)

    // Select optimal mime type
    const mimeTypes = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ]
    const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm'

    const streamHD = canvasHD.captureStream(30)
    const streamLite = canvasLite.captureStream(30)

    // Route audio via Web Audio API
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      try {
        audioCtx = new AudioContextClass()
        const source = audioCtx.createMediaElementSource(video)
        const destination = audioCtx.createMediaStreamDestination()
        source.connect(destination)
        destination.stream.getAudioTracks().forEach((track) => {
          streamHD.addTrack(track.clone ? track.clone() : track)
          streamLite.addTrack(track.clone ? track.clone() : track)
        })
        video.muted = false
      } catch {
        // Fallback: captureStream directly from video element
        // @ts-expect-error captureStream is supported in Chrome/Safari/Firefox
        const audioStream = typeof video.captureStream === 'function' ? video.captureStream() : null
        if (audioStream && audioStream.getAudioTracks().length > 0) {
          audioStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
            streamHD.addTrack(track.clone ? track.clone() : track)
            streamLite.addTrack(track.clone ? track.clone() : track)
          })
        }
      }
    }

    // Recorders for both streams simultaneously
    const recorderHD = new MediaRecorder(streamHD, {
      mimeType: selectedMime,
      videoBitsPerSecond: targetBitrateHD,
      audioBitsPerSecond: 96_000,
    })

    const recorderLite = new MediaRecorder(streamLite, {
      mimeType: selectedMime,
      videoBitsPerSecond: targetBitrateLite,
      audioBitsPerSecond: 64_000,
    })

    const chunksHD: Blob[] = []
    recorderHD.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksHD.push(e.data)
    }

    const chunksLite: Blob[] = []
    recorderLite.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksLite.push(e.data)
    }

    let isRecording = true
    const hdPromise = new Promise<Blob>((resolve, reject) => {
      recorderHD.onstop = () => resolve(new Blob(chunksHD, { type: selectedMime }))
      recorderHD.onerror = (err) => reject(err)
    })

    const litePromise = new Promise<Blob>((resolve, reject) => {
      recorderLite.onstop = () => resolve(new Blob(chunksLite, { type: selectedMime }))
      recorderLite.onerror = (err) => reject(err)
    })

    recorderHD.start(100)
    recorderLite.start(100)

    // Render loop
    try {
      video.currentTime = 0
      await video.play()
    } catch {
      video.muted = true
      await video.play()
    }

    const drawFrame = () => {
      if (!isRecording) return
      ctxHD.drawImage(video, 0, 0, hdWidth, hdHeight)
      ctxLite.drawImage(video, 0, 0, liteWidth, liteHeight)

      const currentSec = Math.round(video.currentTime)
      const totalSec = Math.round(duration)
      const pct = Math.min(84, Math.round((video.currentTime / duration) * 70) + 15)
      onProgress?.(`Encoding HD & Lite streams... ${pct}% (${currentSec}s / ${totalSec}s)`, pct)

      if (!video.paused && !video.ended) {
        requestAnimationFrame(drawFrame)
      }
    }
    requestAnimationFrame(drawFrame)

    await new Promise<void>((resolve) => {
      video.onended = () => resolve()
      setTimeout(() => resolve(), (duration + 2) * 1000)
    })

    isRecording = false
    try {
      recorderHD.stop()
    } catch {}
    try {
      recorderLite.stop()
    } catch {}

    video.pause()
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {})
    }

    const [blobHD, blobLite] = await Promise.all([hdPromise, litePromise])
    URL.revokeObjectURL(objectUrl)

    const isMp4 = selectedMime.includes('mp4')
    const extension = isMp4 ? '.mp4' : '.webm'
    const baseName = sourceFile.name.replace(/\.[^/.]+$/, '')

    let finalHDFile: File
    let finalHDSize: number
    let wasCompressed = false

    if (blobHD.size > 0 && blobHD.size < originalSize) {
      finalHDFile = new File([blobHD], `${baseName}_hd${extension}`, { type: selectedMime })
      finalHDSize = blobHD.size
      wasCompressed = true
    } else {
      finalHDFile = sourceFile
      finalHDSize = originalSize
    }

    let finalLiteFile: File | undefined = undefined
    let liteSize = 0

    if (blobLite.size > 0) {
      finalLiteFile = new File([blobLite], `${baseName}_lite${extension}`, { type: selectedMime })
      liteSize = blobLite.size
    }

    const savedPct = Math.round(((originalSize - finalHDSize) / originalSize) * 100)
    onProgress?.(`Compression complete! Dual adaptive streams ready. Saved ${savedPct}%.`, 85)

    return {
      file: finalHDFile,
      liteFile: finalLiteFile,
      originalSize,
      optimizedSize: finalHDSize,
      liteSize,
      savedPct,
      wasCompressed,
      durationSeconds: duration,
      width: hdWidth,
      height: hdHeight,
    }
  } catch (err) {
    console.warn('[VideoOptimizer] Fallback to direct upload:', err)
    URL.revokeObjectURL(objectUrl)
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {})
    }
    onProgress?.('Direct upload mode ready', 85)
    return {
      file: sourceFile,
      originalSize,
      optimizedSize: originalSize,
      savedPct: 0,
      wasCompressed: false,
    }
  }
}
