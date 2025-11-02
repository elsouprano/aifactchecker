document.addEventListener('DOMContentLoaded', () => {
   console.log("DOM is loaded from app.js! App is ready.");
   
   const form = document.getElementById('search-form');
   const input = document.getElementById('search-input');
   const button = document.getElementById('search-button');
   const loadingSpinner = document.getElementById('loading-spinner');
   const errorMessage = document.getElementById('error-message');
   const errorText = document.getElementById('error-text');
   const successResults = document.getElementById('success-results');
   const answerText = document.getElementById('answer-text');
   const sourcesList = document.getElementById('sources-list');

   // --- UI Statement Management Functions ---

   function showLoading() {
    console.log("Showing Loading...");
    // 1. Disable the button and input
    button.disabled = true;
    button.textContent = 'Searching...';
    input.disabled = true;

    // 2. Hide the error and success message
    errorMessage.classList.add('hidden');
    successResults.classList.add('hidden');

    // 3. Show the loading spinner
    loadingSpinner.classList.remove('hidden');
    loadingSpinner.classList.add('flex');
   }

   function showError(message) {
    console.log("Showing error:", message);
    // 1. Re-enable the button and input
    button.disabled = false;
    button.textContent = 'Search';
    input.disabled = false;

    // 2. Hide the loading spinner and success messages
    loadingSpinner.classList.add('hidden');
    successResults.classList.add('hidden');

    // 3. Show the error message
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
   }

   function showSuccess(answer, sources) {
    console.log("Showing success!");
    // Re-enable the button and input
    button.disabled = false;
    button.textContent = 'Search';
    input.disabled = false;

    // 2. Hide the loading spinner and error message
    loadingSpinner.classList.add('hidden');
    errorMessage.classList.add('hidden');

    // 3. Populate and show the success results
    answerText.textContent = answer;
    successResults.classList.remove('hidden');

    // 3a. Clear any old sources from a previous search
    sourcesList.innerHTML = '';

    // 3b. Check if the sources array has anything in it
    if (sources.length > 0) {
        // 3c. Loop through each source in the array
        sources.forEach((source, index) => {
            // Create a new list item element
            const li = document.createElement('li');

            li.className = "text-gray-700";

            // Set the HTML inside the list item
            li.innerHTML = `
                <span class="inline-flex items-center justify-center w-5 h-5 bg-green-800 rounded-full text-xs font-bold mr-2">${index + 1}</span>
                <a
                    href="${source.uri}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-blue-600 hover:underline"
                >
                    ${source.title}
                </a>
            `;

            sourcesList.appendChild(li);
        });
    } else {
        // Show a message if there are no sources
        const li = document.createElement('li');
        li.className = "text-gray-500 italic"; 
        li.textContent = "No sources were cited for this response.";

        sourcesList.appendChild(li);
    }
    // 3d. Show the success container
    successResults.classList.remove('hidden');
  }
  async function runRealSearch(query) {
    const apiKey = "YOUR_API_KEY_GOES_HERE";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    // This is the "system prompt" that guides the AI
    const systemPrompt = "You are a helpful and concise fact-checker. Answer the user's question based *only* on the provided search results. Your answer must be a single, clear paragraph. Do not add any greeting or sign-off. Do not use your own knowledge.";

    // This is the data to send to the API
    const payload = {
        // 1. The user's question
        contents: [
            { parts: [{ text: query }] }
        ],
        // 2. The "magic" instruction to force Google search
        tools: [
            { "google_search": {} }
        ],
        // 3. The system prompt to control the AI's persona
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    try {
        // 1. Make the API call
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // 2. Check if the request was successful
        if (!response.ok) {
            // If not, throw an error to be caught by the 'catch' block
            throw new Error(`API error! Status: ${response.status}`);
        }

        // 3. Get the JSON data from the response
        const result = await response.json();

        // 4. Extract the answer and sources from the JSON
        // The AI-generated answer text
        const answer = result.candidates?.[0]?.content?.parts?.[0]?.text;

        // The array of sources AI used
        const attributions = result.candidates?.[0]?.groundingMetadata?.groundingAttributions;

        // 5. Check if we actually got an answer
        if (!answer) {
            throw new Error("No answer was generated by the API.");
        }

        // 6. Format the sources into the {title, uri} format
        let sources = [];
        if (attributions) {
            sources = attributions.map(attr => ({
                title: attr.web?.title,
                uri: attr.web?.uri
            })).filter(source => source.title && source.uri); // Filter out any empty sources
        }

        // 7. Success! Send the data to UI function
        showSuccess(answer, sources);
    } catch (err) {
        // 8. If anything went wrong (network error, API error, etc.)
        console.error("Search failed.", err);
        showError("Failed to get a response. Please check your internet connection or try a different query.");
    }
  }
   

   // --- Form Submit Handler ---
  form.addEventListener('submit', (e) => {
      // Stop the page from reloading
      e.preventDefault();

      // Get the user's text from the input field
      const query = input.value;

      // Check if the query is empty
      if (!query.trim()) {
        showError("Please enter a question.");
        return;
      }
      console.log('Search query:', query);
      showLoading();
      runRealSearch(query);
   });
});