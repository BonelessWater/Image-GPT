chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed.');
});

// Request screen access when the extension is opened
chrome.action.onClicked.addListener((tab) => {
  console.log('Requesting screen access...');
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: startScreenCapture
  });
});

// Handle the command to start the answering process
chrome.commands.onCommand.addListener((command) => {
  if (command === "start_answering_process") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error('No active tab found.');
        return;
      }
      // Send a message to the content script to start the answering process
      chrome.tabs.sendMessage(tabs[0].id, { action: "start_answering_process" });
    });
    console.log('Command to start answering process received.');
  }
});

// Function to request screen capture
function startScreenCapture() {
  navigator.mediaDevices.getDisplayMedia({
    video: { mediaSource: 'screen' }
  }).then((stream) => {
    window.screenCaptureStream = stream;
    console.log('Screen capture started.');
    chrome.runtime.sendMessage({ action: "screen_sharing_started" });
  }).catch((error) => {
    console.error('Error starting screen capture:', error);
    alert('Failed to start screen capture. Please allow screen sharing permissions.');
  });
}

