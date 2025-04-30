// Grok Convo Scraper - Background Script
// This script manages the extension's lifecycle and handles background events

// Listen for when the extension is first installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log(`Grok Convo Scraper installed. Reason: ${details.reason}`);
  
  // Set up any initial state or configuration
  if (details.reason === 'install') {
    // First time installation
    chrome.storage.local.set({ 
      installDate: new Date().toISOString(),
      convosScraped: 0
    });
  }
});

// Listen for browser action clicks (icon in toolbar)
chrome.action.onClicked.addListener((tab) => {
  // This only fires if no popup is defined
  // Since we have a popup, this won't normally execute
  console.log('Extension icon clicked directly');
});

// Optional: Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'scraped') {
    // Update counter when a conversation is scraped
    chrome.storage.local.get(['convosScraped'], (result) => {
      const newCount = (result.convosScraped || 0) + 1;
      chrome.storage.local.set({ convosScraped: newCount });
      console.log(`Total conversations scraped: ${newCount}`);
    });
    sendResponse({ status: 'success' });
  }
  return true; // Required for async sendResponse
}); 