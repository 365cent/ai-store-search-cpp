// the js file for the voice input feature 
// https://web.dev/articles/media-recording-audio
// i REALLY tried to get everything work using C++ but it doesn't seem to be worth the effort
// it just feels like i am trying to fit a square peg into a round hole
// so i am pretty much stuck with js for now

// handle port number 
const SERVER_URL = window.location.protocol + "//" + window.location.hostname + ":" + window.location.port + "/";
const TOKEN = "r8_X1ErZq5FO5J4XZc00HphUvYTWLr3zdP1utzio"

// check if the browser supports the MediaDevices API
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  console.error("MediaDevices API or getUserMedia method not supported.");
  Promise.reject(new Error('Get a proper browser dude.'));;
}

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

function blobToBase64(blob) {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise(resolve => {
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};

// get the audio from the microphone
async function getAudio() {
  console.log('Requesting microphone access...');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };
    mediaRecorder.onstop = async () => {
      try {
        // convert the audio to a blob
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });

        // URLs are generated for debugging purposes only
        const audioUrl = URL.createObjectURL(audioBlob);
        const recordedAudio = document.createElement("audio");
        recordedAudio.src = audioUrl;
        console.log('recordedAudio:', recordedAudio);

        // send the audio to the server
        const formData = new FormData();
        const file = await blobToBase64(audioBlob);
        formData.append('file', file);
        // console.log('formData:', formData);

        // try to send the audio to the server
        try {
          const response = await fetch(SERVER_URL + "voiceUpload", {
            method: 'POST',
            body: formData
          });
          // the data should be 
          const data = await response.json();
          const id = data.Rep_id;
          console.log('id:', id);

          // fuck this bullshit
          // FUCK
          async function refetch(id) {
            let maxRetries = 4;
            let attempt = 0;
            let delay = 1500; 
          
            while (attempt < maxRetries) {
              try {
                const response = await fetch(SERVER_URL + 'refetch/' + id);
                console.log('Attempt:', attempt, 'HTTP Response:', response);
          
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
          
                const responseText = await response.text(); 
                const jsonResponse = JSON.parse(JSON.parse(responseText)); 
                console.log('JSON Response:', jsonResponse);

                if (jsonResponse['status'] === 'succeeded') {
                  console.log('Success:', jsonResponse);
                  console.log('Final result:', jsonResponse['output']['transcription']);
                  return jsonResponse['output']['transcription']; 
                } else {
                  console.log('Status not succeeded, retrying...');
                }
              } catch (error) {
                console.error('Fetch error:', error);
              }
          
              await new Promise(resolve => setTimeout(resolve, delay)); 
              attempt++;
            }
          
            throw new Error('Max retries reached');
          }                    

          refetch(id).then(result => {
            console.log('Final result:', result);
          }).catch(error => {
            console.error('Refetch error:', error);
          });


          // console.log(data);
          // console.log("id is ", id);
        } catch (error) {
          console.error('Error:', error);
        }

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
      recordButton.classList.toggle('recording');
      recordButton.innerHTML = '<i class="ri-mic-fill"></i>';
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
      recordButton.classList.toggle('recording');
      recordButton.innerHTML = '<i class="ri-stop-circle-fill"></i>';
      isRecording = true;
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }
}