const API_KEY = ''; // Replace with your OpenAI API key
const OCR_API_KEY = ''; // Replace with your OCR API key

function removeCodeBlockMarkers(responseText) {
  // Use a regular expression to match ```python (or other languages) and ```
  return responseText.replace(/```[a-zA-Z]*\n([\s\S]*?)```/g, '$1').trim();
}

let systemPrompt = 'You are a programmer. You are quick and efficient, only providing answers without explanations. I will provide instructions to a coding problem and your job will be to respond with its answer. Do not explain anything, just reply with code. If the input includes leetcode, your response must include class Solution(object): and a function inside. If the input appears to be a multiple choice question, reply with letters corresponding to their respective order.' ; // Default system prompt

// Load the system prompt from chrome.storage
chrome.storage.local.get('systemPrompt', (data) => {
  if (data.systemPrompt) {
    systemPrompt = data.systemPrompt;
    console.log('Loaded system prompt:', systemPrompt);
  } else {
    console.log('Using default prompt');
  }
});

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "screen_sharing_started") {
    console.log('Screen sharing has started. Use the shortcut to start the process.');
  } else if (request.action === "start_answering_process") {
    console.log('Starting answering process...');
    captureFullScreen();
  }
});

// Function to capture the entire screen
function captureFullScreen() {
  if (!window.screenCaptureStream) {
    console.error('No active screen capture stream.');
    alert('Please start screen sharing before taking a screenshot.');
    return;
  }

  const video = document.createElement('video');
  video.srcObject = window.screenCaptureStream;
  video.play();

  video.onloadedmetadata = () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    // Draw the entire video frame onto the canvas
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    console.log('Full screen drawn to canvas.');

    // Convert the canvas to a Blob (image file)
    canvas.toBlob((blob) => {
      processCapturedImage(blob);
    }, 'image/jpeg', 0.7);
  };
}

// Function to process the captured image with OCR
function processCapturedImage(imageBlob) {
  if (!imageBlob) {
    console.error('Failed to capture the image.');
    return;
  }

  console.log('Processing captured image with OCR...');

  const formData = new FormData();
  formData.append("file", imageBlob, "screenshot.png");
  formData.append("language", "eng");
  formData.append("apikey", OCR_API_KEY); // Make sure to define OCR_API_KEY with your OCR API key

  // Send OCR request
  jQuery.ajax({
    url: 'https://api.ocr.space/parse/image',
    data: formData,
    dataType: 'json',
    cache: false,
    contentType: false,
    processData: false,
    type: 'POST',
    success: function (ocrParsedResult) {
      console.log('OCR request succeeded. Parsing results...');

      var parsedResults = ocrParsedResult["ParsedResults"];
      var ocrExitCode = ocrParsedResult["OCRExitCode"];

      if (parsedResults != null && ocrExitCode === 1) {
        var parsedText = parsedResults[0]["ParsedText"];
        console.log('OCR parsing successful. Parsed text:', parsedText);

        // Send the parsed text to GPT-4
        sendToGPT4(parsedText);
        console.log('Sent parsed text to GPT-4.');
      } else {
        console.error('OCR parsing failed:', ocrParsedResult["ErrorMessage"] || "Unknown error");
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.error('OCR request failed:', textStatus, errorThrown);
    }
  });
}

// Function to call GPT-4 API and print the response
async function sendToGPT4(inputText) {
  console.log('Preparing to send text to GPT-4...');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4', // Make sure the model name is correct
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `${inputText}`
          }
        ],
        max_tokens: 1000, // Limit the response length
        temperature: 0.3
      })
    });

    console.log('GPT-4 request sent. Awaiting response...');

    if (!response.ok) {
      // Log the response status and text for debugging
      const errorText = await response.text();
      console.error(`Error calling GPT-4 API: ${response.status} ${response.statusText}`);
      console.error('Response details:', errorText);
      return;
    }

    const data = await response.json();
    var gptResponse = data.choices[0].message.content;
    console.log('GPT-4 response received:', gptResponse);

    // Remove markdown code block markers
    gptResponse = removeCodeBlockMarkers(gptResponse);
    console.log('Removed markdown markers from GPT-4 response.');

    // Copy the response to the clipboard
    try {
      await navigator.clipboard.writeText(gptResponse);
      console.log('GPT-4 response copied to clipboard.');
       
    } catch (clipboardError) {
      console.error('Failed to copy GPT-4 response to clipboard:', clipboardError);
    }

  } catch (error) {
    console.error('Error sending request to GPT-4:', error);
  }
}

// Keyboard shortcut handling for starting the answering process
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.shiftKey && event.key === 'S') {
    event.preventDefault();
    chrome.runtime.sendMessage({ action: "start_answering_process" });
  }
});

