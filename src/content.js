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
        if (!element) return;
        
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
          if (element) {
            element.style.border = originalBorder;
            element.style.background = originalBackground;
          }
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
    
    // Safe text extraction helper
    function getSafeText(element) {
      if (!element) return '';
      try {
        return (element.innerText || element.textContent || '').trim();
      } catch (e) {
        debugLog(`Error getting text: ${e.message}`);
        return '';
      }
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
    
    // Check if we're on a Grok share or chat page
    if (window.location.href.includes('grok.com/share') || window.location.href.includes('grok.com/chat')) {
      const isChat = window.location.href.includes('grok.com/chat');
      debugLog(`Detected Grok ${isChat ? 'chat' : 'share'} page. Extracting conversation...`);
      
      try {
        // Try to get conversation title
        const titleElements = document.querySelectorAll('h1, .title, header h1, [class*="title"]');
        if (titleElements && titleElements.length > 0) {
          debugLog(`Found ${titleElements.length} possible title elements`);
          for (const titleEl of titleElements) {
            if (!titleEl) continue;
            
            const titleText = getSafeText(titleEl);
            if (titleText && titleText.length > 0) {
              markdown = `# ${titleText}\n\n*Exported on: ${new Date().toLocaleString()}*\n\n`;
              debugLog(`Using title: ${titleText}`);
              break;
            }
          }
        } else {
          debugLog('No title elements found');
        }

        // SPECIAL HANDLING FOR CHAT PAGES
        if (isChat) {
          debugLog('Using special extraction for chat pages');
          
          // Create direct selectors for Grok chat page
          debugLog('Trying direct selectors for known Grok message elements');
          
          // These selectors are based on common patterns in chat UIs
          try {
            const userMessageSelector = '[class*="human-message"], [class*="user-message"], [class*="query"]';
            const aiMessageSelector = '[class*="bot-message"], [class*="ai-message"], [class*="assistant-message"], [class*="response"]';
            
            const userMessages = document.querySelectorAll(userMessageSelector);
            const aiMessages = document.querySelectorAll(aiMessageSelector);
            
            debugLog(`Found ${userMessages.length} user messages and ${aiMessages.length} AI messages with direct selectors`);
            
            if (userMessages.length > 0 || aiMessages.length > 0) {
              // We found some messages, map them to objects with text and position
              const allMessageElements = [];
              
              // Process user messages
              userMessages.forEach(el => {
                const text = getSafeText(el);
                if (text && text.length > 10) {
                  // Try to find a position indicator (like a timestamp or index attribute)
                  // If none exists, use the DOM order
                  const position = Array.from(document.querySelectorAll('*')).indexOf(el);
                  allMessageElements.push({
                    element: el,
                    text: text,
                    position: position,
                    type: 'user'
                  });
                  highlightElement(el, 'user');
                }
              });
              
              // Process AI messages
              aiMessages.forEach(el => {
                const text = getSafeText(el);
                if (text && text.length > 10) {
                  const position = Array.from(document.querySelectorAll('*')).indexOf(el);
                  allMessageElements.push({
                    element: el,
                    text: text,
                    position: position,
                    type: 'ai'
                  });
                  highlightElement(el, 'ai');
                }
              });
              
              // Sort by position in the DOM
              allMessageElements.sort((a, b) => a.position - b.position);
              
              // Add to markdown
              if (allMessageElements.length > 0) {
                conversationFound = true;
                
                allMessageElements.forEach((msg, index) => {
                  if (msg.type === 'user') {
                    markdown += `## Human\n\n${msg.text}\n\n`;
                    debugLog(`Added Human message ${index}: ${msg.text.substring(0, 30)}...`);
                  } else {
                    markdown += `## Grok\n\n${msg.text}\n\n`;
                    debugLog(`Added Grok message ${index}: ${msg.text.substring(0, 30)}...`);
                  }
                });
              }
            }
          } catch (e) {
            debugLog(`Error with direct selectors: ${e.message}`);
          }
          
          // If still no conversation, try group-based approach
          if (!conversationFound) {
            try {
              // For chat pages, look for elements with role=group that contain the conversation
              const messageGroups = document.querySelectorAll('[role="group"]');
              debugLog(`Found ${messageGroups.length} message groups`);
              
              if (messageGroups.length > 0) {
                // Examine each group to find the conversation container
                messageGroups.forEach((group, groupIndex) => {
                  if (!group) return;
                  
                  debugLog(`Examining group ${groupIndex}`);
                  
                  // Look for child elements with substantial text
                  const children = Array.from(group.children || []).filter(child => {
                    if (!child) return false;
                    const text = getSafeText(child);
                    return text && text.length > 10;
                  });
                  
                  if (children.length >= 2) {
                    debugLog(`Group ${groupIndex} has ${children.length} potential messages`);
                    
                    // Highlight the potential conversation container
                    highlightElement(group, 'user');
                    
                    // Create message pairs
                    let messagePairs = [];
                    
                    // Check if we can find pairs with user/AI markers
                    for (let i = 0; i < children.length; i += 2) {
                      if (i + 1 < children.length) {
                        // We have a potential user-AI pair
                        const userMsg = children[i];
                        const aiMsg = children[i + 1];
                        
                        // Check if elements exist
                        if (!userMsg || !aiMsg) continue;
                        
                        // Get text content
                        const userText = getSafeText(userMsg);
                        const aiText = getSafeText(aiMsg);
                        
                        // Skip if either message is empty
                        if (!userText || !aiText) continue;
                        
                        // Add to pairs
                        messagePairs.push({ 
                          user: { element: userMsg, text: userText },
                          ai: { element: aiMsg, text: aiText }
                        });
                        
                        // Highlight for debugging
                        highlightElement(userMsg, 'user');
                        highlightElement(aiMsg, 'ai');
                      }
                    }
                    
                    if (messagePairs.length > 0) {
                      debugLog(`Found ${messagePairs.length} message pairs`);
                      conversationFound = true;
                      
                      // Process message pairs
                      messagePairs.forEach((pair, index) => {
                        // Add user message
                        markdown += `## Human\n\n${pair.user.text}\n\n`;
                        debugLog(`Added Human message ${index}: ${pair.user.text.substring(0, 30)}...`);
                        
                        // Add AI message
                        markdown += `## Grok\n\n${pair.ai.text}\n\n`;
                        debugLog(`Added Grok message ${index}: ${pair.ai.text.substring(0, 30)}...`);
                      });
                    }
                  }
                });
              }
            } catch (e) {
              debugLog(`Error during group extraction: ${e.message}`);
            }
          }
          
          // If we still haven't found the conversation, try timeIndicator approach
          if (!conversationFound) {
            try {
              debugLog('Trying direct message extraction with time-based sorting');
              
              // Look for timestamps or sequential elements that might indicate a message flow
              const timeIndicators = document.querySelectorAll('[class*="time"], time, [datetime]');
              debugLog(`Found ${timeIndicators.length} time indicators`);
              
              if (timeIndicators.length > 1) {
                // Look at parent elements of time indicators - they often contain the messages
                const messageContainers = [];
                
                timeIndicators.forEach(timeEl => {
                  if (!timeEl) return;
                  
                  // Find parent element that contains the entire message
                  let parent = timeEl.parentElement;
                  while (parent && getSafeText(parent).length < 50 && parent !== document.body) {
                    parent = parent.parentElement;
                  }
                  
                  if (parent && getSafeText(parent).length >= 50) {
                    messageContainers.push(parent);
                    highlightElement(parent, 'user');
                  }
                });
                
                if (messageContainers.length >= 2) {
                  debugLog(`Found ${messageContainers.length} message containers with time indicators`);
                  
                  // Assume alternating pattern (user first, then AI)
                  let isUser = true;
                  messageContainers.forEach((container, index) => {
                    if (!container) return;
                    
                    const text = getSafeText(container);
                    if (text) {
                      if (isUser) {
                        markdown += `## Human\n\n${text}\n\n`;
                        highlightElement(container, 'user');
                      } else {
                        markdown += `## Grok\n\n${text}\n\n`;
                        highlightElement(container, 'ai');
                      }
                      isUser = !isUser;
                      conversationFound = true;
                    }
                  });
                }
              }
            } catch (e) {
              debugLog(`Error during time indicator extraction: ${e.message}`);
            }
          }
        }
        
        // GENERAL EXTRACTION APPROACH (works for both chat and share pages)
        // Only run if we haven't found the conversation yet
        if (!conversationFound) {
          try {
            debugLog('Starting direct DOM examination...');
            
            // Look for elements with specific classes or attributes that might indicate messages
            const messageSelectors = [
              '[class*="message"]', 
              '[class*="bubble"]', 
              '[class*="chat-"]', 
              '[role="listitem"]', 
              '[class*="thread-message"]'
            ];
            
            let messageElements = [];
            for (const selector of messageSelectors) {
              try {
                const elements = document.querySelectorAll(selector);
                if (elements && elements.length > 1) { // We need at least 2 for a conversation
                  debugLog(`Found ${elements.length} message elements with selector: ${selector}`);
                  messageElements = Array.from(elements);
                  break;
                }
              } catch (e) {
                debugLog(`Error with selector ${selector}: ${e.message}`);
              }
            }
            
            // If we found message elements, try to extract the conversation
            if (messageElements.length >= 2) {
              // Filter out elements with very little text or that are nested in other message elements
              const standaloneMessages = messageElements.filter(el => {
                if (!el) return false;
                
                const text = getSafeText(el);
                if (!text || text.length < 10) return false;
                
                // Check if this element is contained within another message element
                return !messageElements.some(other => 
                  other && other !== el && other.contains && other.contains(el)
                );
              });
              
              debugLog(`Found ${standaloneMessages.length} standalone message elements`);
              
              if (standaloneMessages.length >= 2) {
                // Assume alternating pattern starting with user
                let isUser = true;
                conversationFound = true;
                
                standaloneMessages.forEach((message, index) => {
                  if (!message) return;
                  
                  const text = getSafeText(message);
                  if (!text) return;
                  
                  // Try to determine if this is user or AI
                  const msgClassName = message.className ? message.className.toLowerCase() : '';
                  const hasUserIndicator = 
                    msgClassName.includes('user') ||
                    msgClassName.includes('human') ||
                    (message.getAttribute && message.getAttribute('data-sender-type') === 'user');
                    
                  const hasAIIndicator = 
                    msgClassName.includes('assistant') ||
                    msgClassName.includes('grok') ||
                    msgClassName.includes('bot') ||
                    msgClassName.includes('ai') ||
                    (message.getAttribute && message.getAttribute('data-sender-type') === 'assistant');
                    
                  // If we have clear indicators, use them
                  if (hasUserIndicator) isUser = true;
                  else if (hasAIIndicator) isUser = false;
                  
                  // Add to markdown
                  if (isUser) {
                    markdown += `## Human\n\n${text}\n\n`;
                    highlightElement(message, 'user');
                    debugLog(`Added Human message ${index}: ${text.substring(0, 30)}...`);
                  } else {
                    markdown += `## Grok\n\n${text}\n\n`;
                    highlightElement(message, 'ai');
                    debugLog(`Added Grok message ${index}: ${text.substring(0, 30)}...`);
                  }
                  
                  // Switch for next message if we don't have clear indicators
                  if (!hasUserIndicator && !hasAIIndicator) {
                    isUser = !isUser;
                  }
                });
              }
            }
          } catch (e) {
            debugLog(`Error during message element extraction: ${e.message}`);
          }
          
          // If still not found, try the original approach with potential messages
          if (!conversationFound) {
            try {
              debugLog('Trying simple message pattern with alternating roles...');
              
              // Get all divs and paragraphs that could be message containers
              const potentialMessages = document.querySelectorAll('div, p');
              
              // Filter to only elements with text content
              const elementsWithText = Array.from(potentialMessages).filter(el => {
                if (!el) return false;
                const text = getSafeText(el);
                return text && text.length > 15; // Only substantial content
              });
              
              debugLog(`Found ${elementsWithText.length} elements with substantial text`);
              
              // Check if there are at least 2 messages (one from user, one from AI)
              if (elementsWithText.length >= 2) {
                // Try to extract the conversation in a simple user-AI alternating pattern
                debugLog('Extracting conversation with alternating pattern...');
                let userTurn = true; // Start with user
                
                elementsWithText.forEach((el, index) => {
                  if (!el) return;
                  
                  const text = getSafeText(el);
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
            } catch (e) {
              debugLog(`Error during alternating pattern extraction: ${e.message}`);
            }
          }
        }
      } catch (e) {
        debugLog(`Error during extraction: ${e.message}`);
        console.error('Extraction error:', e);
      }
    }
    
    // If we still couldn't find conversation content, grab the entire page content
    if (!conversationFound) {
      try {
        debugLog('Could not identify conversation structure, using raw page content');
        
        // Get main content area, if possible
        const mainContent = document.querySelector('main') || document.body;
        const rawText = getSafeText(mainContent);
        
        markdown += `## Raw Content\n\n${rawText}\n\n`;
        markdown += `\n\n*Note: The scraper couldn't identify the conversation structure. This is the raw page content.*\n`;
      } catch (e) {
        debugLog(`Error getting raw content: ${e.message}`);
        markdown += `## Error\n\nFailed to extract content: ${e.message}\n`;
      }
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