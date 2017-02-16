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
    const frequencyBinRaio = frequencyBins[i] / 255
    const barHeight = frequencyBinRaio * height
    canvasContext.fillStyle = `hsla(${frequencyBinRaio * 360 + hue}, 100%, 50%, 0.5)`
    canvasContext.shadowColor = `hsla(${frequencyBinRaio * 360 + hue}, 100%, 50%, 0.5)`
    canvasContext.fillRect((barWidth + 1) * i, height - barHeight, barWidth, height)
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
