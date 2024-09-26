const url = window.location.hostname === 'localhost' ? 'http://127.0.0.1:8000' : 'https://your-production-url.com';

async function sendMessage() {
  const inputField = document.getElementById('chat-input');
  const chatHistory = document.getElementById('chat-history');
  const userMessage = inputField.value.trim();

  if (userMessage) {
    // Add user's message to chat history
    const userMessageElement = document.createElement('div');
    userMessageElement.classList.add('message', 'user-message');
    userMessageElement.textContent = userMessage;
    chatHistory.appendChild(userMessageElement);

    // Clear the input field
    inputField.value = '';

    // Send the message to FastAPI to generate a Vega-Lite chart
    try {
      const response = await fetch(`${url}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: userMessage }),  // Send user input as JSON
      });

      const data = await response.json();

      // Add bot's response to chat history
      const botMessageElement = document.createElement('div');
      botMessageElement.classList.add('message', 'bot-message');

      if (data.chart) {
        // Show the generated chart's specification (you can later render the chart here)
        botMessageElement.textContent = `Chart generated: ${JSON.stringify(data.chart, null, 2)}`;
      } else {
        botMessageElement.textContent = data.response;
      }

      chatHistory.appendChild(botMessageElement);

    } catch (error) {
      console.error("Error generating chart:", error);
      const botMessageElement = document.createElement('div');
      botMessageElement.classList.add('message', 'bot-message');
      botMessageElement.textContent = "There was an error generating the chart.";
      chatHistory.appendChild(botMessageElement);
    }

    // Scroll to the bottom of the chat history
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

function triggerFileInput() {
  document.getElementById('file-input').click();  // Trigger the file input click
}

async function handleFileUpload(event) {
  const file = event.target.files[0];  // Get the selected file
  const chatHistory = document.getElementById('chat-history');

  if (file) {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file);

    // Add user's message to chat history showing the uploaded file
    const userMessageElement = document.createElement('div');
    userMessageElement.classList.add('message', 'user-message');
    userMessageElement.textContent = `Uploaded file: ${file.name}`;
    chatHistory.appendChild(userMessageElement);

    // Send the file to FastAPI backend
    try {
      const response = await fetch(`${url}/upload_csv/`, {  // Ensure the correct endpoint
        method: "POST",
        body: formData,  // Send the FormData which contains the file
      });

      const data = await response.json();

      // Add bot's response to chat history
      const botMessageElement = document.createElement('div');
      botMessageElement.classList.add('message', 'bot-message');

      if (data.message) {
        botMessageElement.textContent = `${data.message}\nPreview: ${JSON.stringify(data.preview, null, 2)}`;
      } else {
        botMessageElement.textContent = "There was an error processing the file.";
      }

      chatHistory.appendChild(botMessageElement);

    } catch (error) {
      console.error("Error uploading file:", error);
      const botMessageElement = document.createElement('div');
      botMessageElement.classList.add('message', 'bot-message');
      botMessageElement.textContent = "There was an error uploading the file.";
      chatHistory.appendChild(botMessageElement);
    }

    // Scroll to the bottom of the chat history
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}
