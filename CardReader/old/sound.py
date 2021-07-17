from gtts import gTTS
import playsound

tts = gTTS('ピッ!', lang='ja')
tts.save('b.mp3')
playsound.playsound('b.mp3')
