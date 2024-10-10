// Load the saved system prompt when the popup is opened
window.onload = () => {
  chrome.storage.local.get('systemPrompt', (data) => {
    if (data.systemPrompt) {
      document.getElementById('systemPrompt').value = data.systemPrompt;
    }
  });
};

// Save the system prompt to chrome.storage
document.getElementById('savePrompt').addEventListener('click', () => {
  const systemPrompt = document.getElementById('systemPrompt').value;
  chrome.storage.local.set({ systemPrompt }, () => {
    console.log('System prompt saved:', systemPrompt);
    alert('System prompt has been saved.');
  });
});

// Start screen sharing when the "Start Screen Sharing" button is clicked
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
    chrome.runtime.sendMessage({ action: "screen_sharing_started" });
  }).catch((error) => {
    console.error('Error starting screen capture:', error);
    alert('Failed to start screen capture. Please allow screen sharing permissions.');
  });
}

