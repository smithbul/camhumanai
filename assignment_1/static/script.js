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
      const response = await fetch("/query", {
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

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}
