// Grok Convo Scraper - Popup Script
// This script handles the popup UI and interactions

document.addEventListener('DOMContentLoaded', () => {
    const scrapeButton = document.getElementById('scrapeButton');
    const statusElement = document.getElementById('status');

    scrapeButton.addEventListener('click', () => {
        statusElement.textContent = 'Scraping...';
        statusElement.className = 'status';
        
        // Query for the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            // Send a message to the content script
            chrome.tabs.sendMessage(
                tabs[0].id,
                { action: 'scrape' },
                (response) => {
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
            );
        });
    });
}); 