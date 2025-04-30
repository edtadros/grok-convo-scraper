// Grok Convo Scraper - Popup Script
// This script handles the popup UI and interactions

document.addEventListener('DOMContentLoaded', () => {
    const scrapeButton = document.getElementById('scrapeButton');
    const statusElement = document.getElementById('status');

    // Get the current tab URL and update UI accordingly
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        
        // Check if we're on a Grok conversation page
        if (currentTab && currentTab.url && currentTab.url.includes('grok.com')) {
            scrapeButton.disabled = false;
            statusElement.textContent = 'Ready to scrape Grok conversation.';
            statusElement.className = 'status';
        } else {
            // Not on a Grok page
            scrapeButton.disabled = true;
            statusElement.textContent = 'Please navigate to a Grok conversation page first.';
            statusElement.className = 'status error';
        }
    });

    scrapeButton.addEventListener('click', () => {
        statusElement.textContent = 'Scraping...';
        statusElement.className = 'status';
        
        // Query for the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            
            // First, try to inject the content script if it's not already there
            chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                files: ['src/content.js']
            }).then(() => {
                // After ensuring the content script is injected, send the message
                chrome.tabs.sendMessage(
                    currentTab.id,
                    { action: 'scrape' },
                    (response) => {
                        handleResponse(response);
                    }
                );
            }).catch(error => {
                // Handle injection error
                statusElement.textContent = 'Error: Could not inject content script. ' + error.message;
                statusElement.className = 'status error';
            });
        });
    });
    
    // Helper function to handle message response
    function handleResponse(response) {
        if (chrome.runtime.lastError) {
            // Handle error
            statusElement.textContent = 'Error: ' + chrome.runtime.lastError.message;
            statusElement.className = 'status error';
            return;
        }
        
        if (response && response.success) {
            statusElement.textContent = 'Success! Conversation downloaded.';
            statusElement.className = 'status success';
        } else {
            statusElement.textContent = 'Error: ' + (response ? response.message : 'Unknown error');
            statusElement.className = 'status error';
        }
    }
}); 