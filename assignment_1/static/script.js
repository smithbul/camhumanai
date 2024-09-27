const url = 'http://127.0.0.1:8000';
let dataset = null;

// Handle key press event in the chat input
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// Trigger file input click
function triggerFileInput() {
  document.getElementById('file-input').click();
}

// Handle file upload
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    await processFile(file);
  }
}

// Handle drag over event
function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = 'copy';
}

// Handle file drop event
async function handleFileDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const file = event.dataTransfer.files[0];
  if (file) {
    await processFile(file);
  }
}

// Process the uploaded file
async function processFile(file) {
  const errorMessage = document.getElementById('error-message');
  const tablePreview = document.getElementById('table-preview');
  errorMessage.textContent = '';
  tablePreview.innerHTML = '';

  if (!file.name.endsWith('.csv')) {
    errorMessage.textContent = 'Please upload a valid CSV file.';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    const csvData = event.target.result;
    dataset = d3.csvParse(csvData, d3.autoType);
    console.log('Parsed dataset:', dataset); // Log the parsed dataset
    displayTablePreview(dataset);
  };
  reader.readAsText(file);
}

// Display table preview
function displayTablePreview(data) {
  const tablePreview = document.getElementById('table-preview');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // Create table header
  const headerRow = document.createElement('tr');
  Object.keys(data[0]).forEach(key => {
    const th = document.createElement('th');
    th.textContent = key;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Create table body
  data.slice(0, 10).forEach(row => {
    const tr = document.createElement('tr');
    Object.values(row).forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  tablePreview.appendChild(table);
}

// Construct prompt for Vega-Lite specification
function constructPrompt(userMessage) {
  const columns = Object.keys(dataset[0]);
  const sampleValues = dataset.slice(0, 5).map(row => {
    const sampleRow = {};
    columns.forEach(col => {
      sampleRow[col] = row[col];
    });
    return sampleRow;
  });

  const columnTypes = columns.map(col => {
    const sampleValue = dataset[0][col];
    if (typeof sampleValue === 'number') {
      return `${col} (numerical)`;
    } else if (typeof sampleValue === 'string' && !isNaN(Date.parse(sampleValue))) {
      return `${col} (temporal)`;
    } else {
      return `${col} (categorical)`;
    }
  });

  const prompt = `
    Given the following dataset information:
    Columns: ${columnTypes.join(', ')}
    Sample Values: ${JSON.stringify(sampleValues, null, 2)}
    User Query: ${userMessage}
    Generate a Vega-Lite specification for a chart that best represents the user's query.
  `;

  console.log('Constructed prompt:', prompt); // Log the constructed prompt
  return prompt;
}

// Send message to the server
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

    // Construct the prompt
    const prompt = constructPrompt(userMessage);

    // Send the message to FastAPI to generate a Vega-Lite chart
    try {
      console.log('Sending query:', prompt);
      const response = await fetch(`${url}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),  // Send constructed prompt as JSON
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Query response:', data);

        // Add bot's response to chat history
        const botMessageElement = document.createElement('div');
        botMessageElement.classList.add('message', 'bot-message');

        if (data.chart) {
          // Show the generated chart's specification
          botMessageElement.textContent = `Here's your ${data.chart.mark} chart:`;
          chatHistory.appendChild(botMessageElement);

          // Create a container for the chart
          const chartContainer = document.createElement('div');
          chartContainer.classList.add('chart-message');
          chatHistory.appendChild(chartContainer);

          // Render the chart using Vega-Embed
          vegaEmbed(chartContainer, data.chart).then(result => {
            console.log('Chart rendered successfully:', result);
          }).catch(error => {
            console.error('Error rendering chart:', error);
          });
        } else {
          botMessageElement.textContent = data.response;
          chatHistory.appendChild(botMessageElement);
        }
      } else {
        console.error('Query failed:', response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Error querying:', error);
      const botMessageElement = document.createElement('div');
      botMessageElement.classList.add('message', 'bot-message');
      botMessageElement.textContent = 'Error querying the server.';
      chatHistory.appendChild(botMessageElement);
    }
  }
}

// Add event listeners for drag-and-drop
const dropZone = document.getElementById('drop-zone');
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('drop', handleFileDrop);