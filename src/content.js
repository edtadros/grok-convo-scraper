// Grok Conversation Scraper
// This script interacts with the Grok AI webpage to scrape conversations

// Set a flag to prevent duplicate initialization
if (!window.grokScraperInitialized) {
  window.grokScraperInitialized = true;
  
  console.log('Grok Convo Scraper loaded.');

  // Function to scrape Grok conversations and format to markdown
  function scrapeGrokConversations() {
    console.log('Scraping Grok conversations...');
    
    // Add visual debugging to the page (temporary)
    function addDebugOverlay() {
      // Create a debug container
      const debugContainer = document.createElement('div');
      debugContainer.id = 'grok-scraper-debug';
      debugContainer.style.cssText = 'position: fixed; top: 0; right: 0; width: 300px; height: 100%; background: rgba(0,0,0,0.8); color: white; padding: 20px; overflow: auto; z-index: 9999; font-family: monospace; font-size: 12px;';
      document.body.appendChild(debugContainer);
      
      // Helper function to log to the debug overlay
      window.debugLog = function(message) {
        const logEntry = document.createElement('div');
        logEntry.textContent = message;
        logEntry.style.borderBottom = '1px solid #333';
        logEntry.style.padding = '5px 0';
        debugContainer.appendChild(logEntry);
        console.log(message);
      };
      
      // Helper to highlight elements
      window.highlightElement = function(element, type) {
        const originalBorder = element.style.border;
        const originalBackground = element.style.background;
        
        if (type === 'user') {
          element.style.border = '2px solid blue';
          element.style.background = 'rgba(0, 0, 255, 0.1)';
        } else if (type === 'ai') {
          element.style.border = '2px solid green';
          element.style.background = 'rgba(0, 255, 0, 0.1)';
        } else {
          element.style.border = '2px solid red';
        }
        
        // Reset after 2 seconds
        setTimeout(() => {
          element.style.border = originalBorder;
          element.style.background = originalBackground;
        }, 2000);
      };
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close Debug';
      closeButton.style.cssText = 'position: absolute; top: 10px; right: 10px; padding: 5px;';
      closeButton.onclick = function() {
        document.body.removeChild(debugContainer);
      };
      debugContainer.appendChild(closeButton);
      
      return debugContainer;
    }
    
    // Add debug overlay if not in headless mode
    const debugContainer = addDebugOverlay();
    
    // Log page details
    debugLog('Page URL: ' + window.location.href);
    debugLog('Page title: ' + document.title);
    
    let markdown = '# Grok Conversation\n\n';
    let conversationFound = false;
    
    // Add timestamp
    const timestamp = new Date().toISOString();
    markdown += `*Exported on: ${new Date().toLocaleString()}*\n\n`;
    
    // Dump HTML structure to console for inspection
    debugLog('Dumping HTML structure for debugging...');
    console.log('HTML Body:', document.body.innerHTML);
    
    // Check if we're on a Grok share page
    if (window.location.href.includes('grok.com/share')) {
      debugLog('Detected Grok share page. Extracting conversation...');
      
      // Try to get conversation title
      const titleElements = document.querySelectorAll('h1, .title, header h1, [class*="title"]');
      if (titleElements && titleElements.length > 0) {
        debugLog(`Found ${titleElements.length} possible title elements`);
        for (const titleEl of titleElements) {
          const titleText = titleEl.innerText.trim();
          if (titleText && titleText.length > 0) {
            markdown = `# ${titleText}\n\n*Exported on: ${new Date().toLocaleString()}*\n\n`;
            debugLog(`Using title: ${titleText}`);
            break;
          }
        }
      } else {
        debugLog('No title elements found');
      }
      
      // DIRECT DOM EXAMINATION APPROACH
      debugLog('Starting direct DOM examination...');
      
      // Get all divs and paragraphs that could be message containers
      const potentialMessages = document.querySelectorAll('div, p');
      debugLog(`Found ${potentialMessages.length} potential message elements`);
      
      // Create a special debug function to get element details
      function getElementDetails(element) {
        return {
          tag: element.tagName,
          id: element.id,
          classes: element.className,
          text: element.innerText.slice(0, 50) + (element.innerText.length > 50 ? '...' : ''),
          hasChildren: element.children.length > 0,
          childCount: element.children.length
        };
      }
      
      // Log first 10 elements with their details
      debugLog('First 10 potential message elements:');
      for (let i = 0; i < Math.min(10, potentialMessages.length); i++) {
        const details = getElementDetails(potentialMessages[i]);
        console.log(`Element ${i}:`, details);
        debugLog(`Element ${i}: ${details.tag}, classes: ${details.classes}, text: ${details.text}`);
      }
      
      // Look for message pattern: check if elements alternate between user and AI
      // This typically happens in a conversation UI
      
      // First, filter to only elements with text content
      const elementsWithText = Array.from(potentialMessages).filter(el => {
        const text = el.innerText.trim();
        return text && text.length > 15; // Only substantial content
      });
      
      debugLog(`Found ${elementsWithText.length} elements with substantial text`);
      
      // Check if there are at least 2 messages (one from user, one from AI)
      if (elementsWithText.length >= 2) {
        // Analyze first few messages to look for patterns
        for (let i = 0; i < Math.min(10, elementsWithText.length); i++) {
          const el = elementsWithText[i];
          // Check if this element looks like a message container
          const hasTextChild = Array.from(el.childNodes).some(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
          );
          
          const hasMessageClasses = el.className.toLowerCase().includes('message') || 
                                   el.className.toLowerCase().includes('bubble') ||
                                   el.className.toLowerCase().includes('text');
          
          // Log potential message details
          if (hasTextChild || hasMessageClasses) {
            debugLog(`Potential message ${i}: ${el.innerText.slice(0, 30)}...`);
            console.log(`Potential message ${i}:`, el);
            // Highlight in the UI
            highlightElement(el, i % 2 === 0 ? 'user' : 'ai');
          }
        }
        
        // Try to extract the conversation in a simple user-AI alternating pattern
        debugLog('Extracting conversation with alternating pattern...');
        let userTurn = true; // Start with user
        
        elementsWithText.forEach((el, index) => {
          const text = el.innerText.trim();
          if (text) {
            // Add to markdown
            if (userTurn) {
              markdown += `## Human\n\n${text}\n\n`;
              highlightElement(el, 'user');
              debugLog(`Added Human message: ${text.slice(0, 30)}...`);
            } else {
              markdown += `## Grok\n\n${text}\n\n`;
              highlightElement(el, 'ai');
              debugLog(`Added Grok message: ${text.slice(0, 30)}...`);
            }
            userTurn = !userTurn; // Switch turns
            conversationFound = true;
          }
        });
      }
      
      // If we found a conversation, log it
      if (conversationFound) {
        debugLog('Successfully extracted conversation using alternating pattern');
      } else {
        debugLog('Failed to extract conversation with alternating pattern');
        
        // BACKUP APPROACH: Try specific class matching
        debugLog('Trying backup approach with specific class matching');
        
        // Look for elements with specific classes
        const userSelectors = [
          '.user-message', '[data-role="user"]', '.user', '.human',
          '[class*="user"]', '[class*="human"]'
        ];
        
        const aiSelectors = [
          '.ai-message', '[data-role="assistant"]', '.assistant', '.grok', '.bot',
          '[class*="assistant"]', '[class*="ai"]', '[class*="grok"]', '[class*="bot"]'
        ];
        
        // Try each user selector
        let userMessages = [];
        for (const selector of userSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              debugLog(`Found ${elements.length} user messages using selector: ${selector}`);
              userMessages = [...userMessages, ...Array.from(elements)];
              
              // Highlight user messages
              elements.forEach(el => highlightElement(el, 'user'));
            }
          } catch (e) {
            debugLog(`Error with selector ${selector}: ${e.message}`);
          }
        }
        
        // Try each AI selector
        let aiMessages = [];
        for (const selector of aiSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              debugLog(`Found ${elements.length} AI messages using selector: ${selector}`);
              aiMessages = [...aiMessages, ...Array.from(elements)];
              
              // Highlight AI messages
              elements.forEach(el => highlightElement(el, 'ai'));
            }
          } catch (e) {
            debugLog(`Error with selector ${selector}: ${e.message}`);
          }
        }
        
        // Process messages if found
        if (userMessages.length > 0 || aiMessages.length > 0) {
          debugLog(`Processing ${userMessages.length} user messages and ${aiMessages.length} AI messages`);
          
          // Process user messages
          userMessages.forEach((el, i) => {
            const text = el.innerText.trim();
            if (text) {
              markdown += `## Human\n\n${text}\n\n`;
              debugLog(`Added Human message ${i}: ${text.slice(0, 30)}...`);
            }
          });
          
          // Process AI messages
          aiMessages.forEach((el, i) => {
            const text = el.innerText.trim();
            if (text) {
              markdown += `## Grok\n\n${text}\n\n`;
              debugLog(`Added Grok message ${i}: ${text.slice(0, 30)}...`);
            }
          });
          
          conversationFound = true;
        }
      }
    }
    
    // If we still couldn't find conversation content, grab the entire page content
    if (!conversationFound) {
      debugLog('Could not identify conversation structure, using raw page content');
      markdown += `## Raw Content\n\n${document.body.innerText}\n\n`;
      markdown += `\n\n*Note: The scraper couldn't identify the conversation structure. This is the raw page content.*\n`;
    }
    
    // Log the final markdown structure with message counts
    const humanCount = (markdown.match(/## Human/g) || []).length;
    const grokCount = (markdown.match(/## Grok/g) || []).length;
    debugLog(`Final markdown contains ${humanCount} Human messages and ${grokCount} Grok messages`);
    
    console.log('Markdown generated:', markdown);
    return markdown;
  }

  // Function to download markdown as a file
  function downloadMarkdown(markdown, filename = 'grok-conversation.md') {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Listen for messages from the popup or background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message:', message);
    
    if (message.action === 'scrape') {
      console.log('Received scrape command');
      try {
        const markdown = scrapeGrokConversations();
        downloadMarkdown(markdown);
        sendResponse({ success: true, message: 'Conversation scraped and downloaded' });
      } catch (error) {
        console.error('Error scraping conversation:', error);
        sendResponse({ success: false, message: 'Error: ' + error.message });
      }
    }
    return true; // Required for async sendResponse
  });
}

// If this script is being executed directly (not as part of initialization)
// and a direct scrape is requested, do it immediately
if (window.grokScraperDirectScrape) {
  try {
    const markdown = scrapeGrokConversations();
    downloadMarkdown(markdown);
    console.log('Direct scrape completed');
  } catch (error) {
    console.error('Error during direct scrape:', error);
  }
}

// Helper function for console debugging
function debugLog(message) {
  if (typeof window.debugLog === 'function') {
    window.debugLog(message);
  } else {
    console.log(message);
  }
} 