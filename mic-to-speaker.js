var micToSpeaker = (function () {
	var audioContext,
		audioSource,
		audioProcessor,
		spectrumAudioAnalyser,
		canvas,
		canvasContext,
		barGradient

	var grainSize = 0,
		spectrumFFTSize = 128,
		spectrumSmoothing = 0.8,
		sonogramFFTSize = 2048,
		sonogramSmoothing = 0

	initAudio = function () {
		if (!navigator.webkitGetUserMedia) {
			alert('Your browser does not support the Media Stream API')
		} else {
			navigator.webkitGetUserMedia(
				{
					audio: true,
					video: false,
				},

				function (stream) {
					audioSource = audioContext.createMediaStreamSource(stream)
					audioSource.connect(audioProcessor)
				},

				function (error) {
					alert('Unable to get the user media')
				}
			)
		}

		spectrumAudioAnalyser = audioContext.createAnalyser()
		spectrumAudioAnalyser.fftSize = spectrumFFTSize
		spectrumAudioAnalyser.smoothingTimeConstant = spectrumSmoothing
	}

	initProcessor = function () {
		if (audioProcessor) {
			audioProcessor.disconnect()
		}

		if (audioContext.createScriptProcessor) {
			audioProcessor = audioContext.createScriptProcessor(grainSize, 1, 1)
		} else if (audioContext.createJavaScriptNode) {
			audioProcessor = audioContext.createJavaScriptNode(grainSize, 1, 1)
		}

		audioProcessor.buffer = new Float32Array(1024 * 2)

		audioProcessor.onaudioprocess = function (event) {
			for (var channel = 0; channel < event.outputBuffer.numberOfChannels; channel++) {
				var inputData = event.inputBuffer.getChannelData(0)
				var outputData = event.outputBuffer.getChannelData(0)

				for (i = 0; i < inputData.length; i++) {
					outputData[i] = inputData[i]
				}
			}
		}

		audioProcessor.connect(spectrumAudioAnalyser)
		audioProcessor.connect(audioContext.destination)
	}

	initCanvas = function () {
		canvas = document.querySelector('canvas')
		canvasContext = canvas.getContext('2d')

		barGradient = canvasContext.createLinearGradient(0, 0, 1, canvas.height - 1)
		barGradient.addColorStop(0, '#3c763d')
		barGradient.addColorStop(0.995, '#d6e9c6')
		barGradient.addColorStop(1, '#dff0d8')
	}

	renderCanvas = function () {
		var frequencyData = new Uint8Array(spectrumAudioAnalyser.frequencyBinCount)
		spectrumAudioAnalyser.getByteFrequencyData(frequencyData)

		canvasContext.clearRect(0, 0, canvas.width, canvas.height)
		canvasContext.fillStyle = barGradient

		var barWidth = canvas.width / frequencyData.length
		for (i = 0; i < frequencyData.length; i++) {
			var magnitude = frequencyData[i]
			canvasContext.fillRect(barWidth * i, canvas.height, barWidth - 1, -magnitude - 1)
		}

		window.requestAnimFrame(renderCanvas)
	}

	return {
		init: function () {
			audioContext = new (window.AudioContext || window.webkitAudioContext)()

			initAudio()
			initProcessor()
			initCanvas()

			window.requestAnimFrame(renderCanvas)
		},
	}
})()

window.requestAnimFrame = (function () {
	console.log('here')
	return (
		window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		function (callback) {
			window.setTimeout(callback, 1000 / 60)
		}
	)
})()

setTimeout(() => {
	micToSpeaker.init()
}, 1000)
// window.addEventListener('DOMContentLoaded', micToSpeaker.init, true)
