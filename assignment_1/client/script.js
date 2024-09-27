document.addEventListener('DOMContentLoaded', function() {
    const sendBtn = document.querySelector('#send-btn');
    const promptInput = document.querySelector('#prompt-input');
    const responseText = document.querySelector('#response-text');
    let dataset = null;

    // Enable or disable the send button based on input value
    promptInput.addEventListener('input', function(event) {
        sendBtn.disabled = event.target.value ? false : true;
    });

    // Function to send the message
    function sendMessage() {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            return;
        }
        promptInput.value = '';
        sendBtn.disabled = true;

        fetch('/query', {
            method: 'POST',
            body: JSON.stringify({ prompt }),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }).then(data => {
            console.log(data);
            responseText.textContent = data.response;
        }).catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            responseText.textContent = 'Error: Could not fetch the response.';
        }).finally(() => {
            sendBtn.disabled = false;
        });
    }

    // Send message on Enter key press
    promptInput.addEventListener('keyup', function(event) {
        if (event.keyCode === 13) {
            sendBtn.click();
        }
    });

    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);

    // Function to handle file upload
    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/upload_csv/', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                console.log('Dataset uploaded successfully:', data);
                dataset = data.preview; // Store the dataset preview
            } catch (error) {
                console.error('There was a problem with the file upload:', error);
            }
        }
    }

    // Add event listener for file input
    const fileInput = document.querySelector('#file-input');
    fileInput.addEventListener('change', handleFileUpload);
});