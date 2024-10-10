document.getElementById('startCapture').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: startScreenCapture
    });
  });
});

// Function to start screen recording
function startScreenCapture() {
  navigator.mediaDevices.getDisplayMedia({
    video: { mediaSource: 'screen' }
  }).then((stream) => {
    window.screenCaptureStream = stream;
    console.log('Screen sharing started.');
    // Notify the content script that screen sharing has started
    chrome.runtime.sendMessage({ action: "screen_sharing_started" });
  }).catch((error) => {
    console.error('Error starting screen capture:', error);
    alert('Failed to start screen capture. Please allow screen sharing permissions.');
  });
}


