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
    
    // Check if we're on a Grok share or chat page
    if (window.location.href.includes('grok.com/share') || window.location.href.includes('grok.com/chat')) {
      const isChat = window.location.href.includes('grok.com/chat');
      debugLog(`Detected Grok ${isChat ? 'chat' : 'share'} page. Extracting conversation...`);
      
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

      // SPECIAL HANDLING FOR CHAT PAGES
      if (isChat) {
        debugLog('Using special extraction for chat pages');
        
        // For chat pages, look for elements with role=group that contain the conversation
        const messageGroups = document.querySelectorAll('[role="group"]');
        debugLog(`Found ${messageGroups.length} message groups`);
        
        if (messageGroups.length > 0) {
          // Examine each group to find the conversation container
          messageGroups.forEach((group, groupIndex) => {
            debugLog(`Examining group ${groupIndex}`);
            
            // Look for child elements with substantial text
            const children = Array.from(group.children).filter(child => {
              const text = child.innerText.trim();
              return text && text.length > 10;
            });
            
            if (children.length >= 2) {
              debugLog(`Group ${groupIndex} has ${children.length} potential messages`);
              
              // Highlight the potential conversation container
              highlightElement(group, 'user');
              
              // Look for a pattern where even indices are user and odd are AI
              let foundPattern = true;
              let messagePairs = [];
              
              // Check if we can find pairs with user/AI markers
              for (let i = 0; i < children.length; i += 2) {
                if (i + 1 < children.length) {
                  // We have a potential user-AI pair
                  const userMsg = children[i];
                  const aiMsg = children[i + 1];
                  
                  // Look for avatar or role indicators
                  const userHasAvatar = userMsg.querySelector('img, [class*="avatar"], [class*="user"]');
                  const aiHasAvatar = aiMsg.querySelector('img, [class*="avatar"], [class*="grok"], [class*="bot"]');
                  
                  // Check for other indicators
                  const userIndicators = 
                    userMsg.className.toLowerCase().includes('user') || 
                    userMsg.className.toLowerCase().includes('human') ||
                    userMsg.querySelector('[class*="user"]') != null;
                    
                  const aiIndicators = 
                    aiMsg.className.toLowerCase().includes('assistant') || 
                    aiMsg.className.toLowerCase().includes('grok') || 
                    aiMsg.className.toLowerCase().includes('bot') || 
                    aiMsg.className.toLowerCase().includes('ai') ||
                    aiMsg.querySelector('[class*="grok"]') != null ||
                    aiMsg.querySelector('[class*="assistant"]') != null;
                  
                  if ((userHasAvatar || userIndicators) && (aiHasAvatar || aiIndicators)) {
                    messagePairs.push({ user: userMsg, ai: aiMsg });
                  } else {
                    // If we can't confirm it's a user-AI pair, just assume alternating pattern
                    messagePairs.push({ user: userMsg, ai: aiMsg });
                  }
                  
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
                  const userText = pair.user.innerText.trim();
                  const aiText = pair.ai.innerText.trim();
                  
                  // Add user message
                  markdown += `## Human\n\n${userText}\n\n`;
                  debugLog(`Added Human message ${index}: ${userText.substring(0, 30)}...`);
                  
                  // Add AI message
                  markdown += `## Grok\n\n${aiText}\n\n`;
                  debugLog(`Added Grok message ${index}: ${aiText.substring(0, 30)}...`);
                });
              }
            }
          });
        }
        
        // If we still haven't found the conversation, try another approach
        if (!conversationFound) {
          debugLog('Trying direct message extraction with time-based sorting');
          
          // Look for timestamps or sequential elements that might indicate a message flow
          const timeIndicators = document.querySelectorAll('[class*="time"], time, [datetime]');
          debugLog(`Found ${timeIndicators.length} time indicators`);
          
          if (timeIndicators.length > 1) {
            // Look at parent elements of time indicators - they often contain the messages
            const messageContainers = [];
            
            timeIndicators.forEach(timeEl => {
              // Find parent element that contains the entire message
              let parent = timeEl.parentElement;
              while (parent && parent.innerText.length < 50 && parent !== document.body) {
                parent = parent.parentElement;
              }
              
              if (parent && parent.innerText.length >= 50) {
                messageContainers.push(parent);
                highlightElement(parent, 'user');
              }
            });
            
            if (messageContainers.length >= 2) {
              debugLog(`Found ${messageContainers.length} message containers with time indicators`);
              
              // Assume alternating pattern (user first, then AI)
              let isUser = true;
              messageContainers.forEach((container, index) => {
                const text = container.innerText.trim();
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
        }
      }
      
      // GENERAL EXTRACTION APPROACH (works for both chat and share pages)
      // Only run if we haven't found the conversation yet
      if (!conversationFound) {
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
            if (elements.length > 1) { // We need at least 2 for a conversation
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
            const text = el.innerText.trim();
            if (!text || text.length < 10) return false;
            
            // Check if this element is contained within another message element
            return !messageElements.some(other => 
              other !== el && other.contains(el)
            );
          });
          
          debugLog(`Found ${standaloneMessages.length} standalone message elements`);
          
          if (standaloneMessages.length >= 2) {
            // Assume alternating pattern starting with user
            let isUser = true;
            conversationFound = true;
            
            standaloneMessages.forEach((message, index) => {
              const text = message.innerText.trim();
              
              // Try to determine if this is user or AI
              const hasUserIndicator = 
                message.className.toLowerCase().includes('user') ||
                message.className.toLowerCase().includes('human') ||
                message.getAttribute('data-sender-type') === 'user';
                
              const hasAIIndicator = 
                message.className.toLowerCase().includes('assistant') ||
                message.className.toLowerCase().includes('grok') ||
                message.className.toLowerCase().includes('bot') ||
                message.className.toLowerCase().includes('ai') ||
                message.getAttribute('data-sender-type') === 'assistant';
                
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
        
        // If still not found, try the original approach with potential messages
        if (!conversationFound) {
          debugLog('Trying simple message pattern with alternating roles...');
          
          // Get all divs and paragraphs that could be message containers
          const potentialMessages = document.querySelectorAll('div, p');
          
          // Filter to only elements with text content
          const elementsWithText = Array.from(potentialMessages).filter(el => {
            const text = el.innerText.trim();
            return text && text.length > 15; // Only substantial content
          });
          
          debugLog(`Found ${elementsWithText.length} elements with substantial text`);
          
          // Check if there are at least 2 messages (one from user, one from AI)
          if (elementsWithText.length >= 2) {
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