const playNotificationSound = () => {
  try {
    const audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )()

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(
      800, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(
      600, audioContext.currentTime + 0.1)

    gainNode.gain.setValueAtTime(
      0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(
      0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch(err) {
    console.log('Sound error:', err)
  }
}

export default playNotificationSound