// the js file for the voice input feature 
// https://web.dev/articles/media-recording-audio
// i REALLY tried to get everything work using C++ but it doesn't seem to be worth the effort
// it just feels like i am trying to fit a square peg into a round hole
// so i am pretty much stuck with js for now

// check if the browser supports the MediaDevices API
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  console.error("MediaDevices API or getUserMedia method not supported.");
  Promise.reject(new Error('Get a proper browser dude.'));;
}

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

async function getAudio() {
  console.log('Requesting microphone access...');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const recordedAudio = document.createElement("audio");
          recordedAudio.src = audioUrl;
          console.log('audioBlob:', audioBlob);
          console.log('audioChunks:', audioChunks);
          console.log('audioUrl:', audioUrl);
          console.log('recordedAudio:', recordedAudio);
      } catch (error) {
          console.error('Error in onstop:', error);
      }
    };
    
  } catch (error) {
    console.error('Error accessing the microphone:', error);
    throw error; // Re-throw the error to be handled in toggleRecording
  }
}

// const player = document.getElementById('player');
const recordButton = document.getElementById('recordButton');

// event listener for the start and stop buttons
recordButton.addEventListener('click', toggleRecording);

// toggle recording
async function toggleRecording() {
  console.log('toggleRecording()');
  if (isRecording) {
    console.log('stopping recording');
    // stop recording
    try {
      await mediaRecorder.stop();
      isRecording = false;
      // swap between the icon
      document.getElementById('recordButton').innerHTML = '<i class="ri-mic-fill"></i>';
    } catch (error) {
      console.error('Error stopping recording:', error);
    }

  } else {
    console.log('start recording');
    // start recording
    audioChunks = [];
    try {
      await getAudio();
      console.log('mediaRecorder:', mediaRecorder);
      mediaRecorder.start();
      document.getElementById('recordButton').innerHTML = '<i class="ri-stop-circle-fill"></i>';
      isRecording = true;
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }
}