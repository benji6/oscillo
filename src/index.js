const audioContext = new AudioContext()

const canvas = document.querySelector('canvas')
onresize = () => {
  canvas.width = innerWidth
  canvas.height = innerHeight
}
onresize()
const canvasContext = canvas.getContext('2d')
canvasContext.lineWidth = 1
canvasContext.shadowBlur = 1

const timeDomain = new Uint8Array(1024)
const analyser = audioContext.createAnalyser()

const frequencyBins = new Uint8Array(analyser.frequencyBinCount)
const trails = Array.from({length: analyser.frequencyBinCount}).map(() => ({value: -1}))
const trailHeight = 3

analyser.fftSize = timeDomain.length

const render = timeStamp => {
  requestAnimationFrame(render)
  const {height, width} = canvas
  const hue = Math.round(timeStamp / 50)
  const step = width / timeDomain.length
  const scopeHeight = height

  canvasContext.clearRect(0, 0, width, height)

  analyser.getByteFrequencyData(frequencyBins)
  const barWidth = width / frequencyBins.length * 2
  for (let i = 0; i < frequencyBins.length; i++) {
    const frequency = frequencyBins[i]
    const frequencyRatio = frequency / 255
    const barHeight = frequencyRatio * height - trailHeight
    const barHue = frequencyRatio * 360 + hue
    const barColor = `hsla(${barHue}, 100%, 50%, 0.5)`
    const trailColor = `hsla(${barHue + 180}, 100%, 50%, 0.5)`

    let trail = trails[i]
    if (trail.value < frequency) {
      trail = {
        timeStamp,
        value: frequency,
        y: height - frequency / 255 * height - trailHeight,
      }
      trails[i] = trail
    } else if (trail.timeStamp < timeStamp - 300) {
      trail.value -= 2
      trail.y = height - trail.value / 255 * height - trailHeight
    }

    const x = (barWidth + 1) * i

    canvasContext.fillStyle = canvasContext.shadowColor = trailColor
    canvasContext.fillRect(x, trail.y, barWidth, trailHeight)

    canvasContext.fillStyle = canvasContext.shadowColor = barColor
    canvasContext.fillRect(x, height - barHeight, barWidth, height)
  }

  analyser.getByteTimeDomainData(timeDomain)
  canvasContext.beginPath()
  for (let i = 0; i < timeDomain.length; i += 2) {
    canvasContext.lineTo(i * step, scopeHeight * timeDomain[i] / 255)
  }
  canvasContext.strokeStyle = `hsl(${hue}, 100%, 50%)`
  canvasContext.shadowColor = `hsl(${hue}, 100%, 50%)`
  canvasContext.stroke()
}

navigator.mediaDevices.getUserMedia({audio: true})
  .then(stream => {
    audioContext.createMediaStreamSource(stream).connect(analyser)
    requestAnimationFrame(render)
  })
