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
    
    // Get formatted HTML content (preserves formatting like bold)
    function getFormattedHtml(element) {
      if (!element) return '';
      try {
        // Create temporary div to handle conversion
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.innerHTML;
        
        // Process HTML formatting to markdown
        
        // Debug logging function for list processing
        const debugListProcessing = (name, content) => {
          console.log(`[DEBUG] ${name}:`, content);
        };
        
        // Process code blocks first (pre and code elements)
        const transformCodeBlocks = () => {
          const preElements = tempDiv.querySelectorAll('pre');
          preElements.forEach(pre => {
            const codeContent = pre.textContent || '';
            const wrapper = document.createElement('div');
            // Add triple backticks for code blocks
            wrapper.textContent = '```\n' + codeContent + '\n```\n';
            pre.parentNode.replaceChild(wrapper, pre);
          });
          
          // Handle inline code (not in pre blocks)
          const codeElements = tempDiv.querySelectorAll('code');
          codeElements.forEach(code => {
            const codeContent = code.textContent || '';
            const wrapper = document.createElement('span');
            // Add single backtick for inline code
            wrapper.textContent = '`' + codeContent + '`';
            code.parentNode.replaceChild(wrapper, code);
          });
        };
        
        // Process emphasis formatting
        const transformEmphasis = () => {
          // Bold
          ['b', 'strong'].forEach(tag => {
            const elements = tempDiv.querySelectorAll(tag);
            elements.forEach(el => {
              const wrapper = document.createElement('span');
              wrapper.textContent = `**${el.textContent}**`;
              el.parentNode.replaceChild(wrapper, el);
            });
          });
          
          // Italic
          ['i', 'em'].forEach(tag => {
            const elements = tempDiv.querySelectorAll(tag);
            elements.forEach(el => {
              const wrapper = document.createElement('span');
              wrapper.textContent = `*${el.textContent}*`;
              el.parentNode.replaceChild(wrapper, el);
            });
          });
        };
        
        // Process links
        const transformLinks = () => {
          const linkElements = tempDiv.querySelectorAll('a');
          linkElements.forEach(link => {
            const text = link.textContent || '';
            const href = link.getAttribute('href') || '';
            if (href) {
              const wrapper = document.createElement('span');
              wrapper.textContent = `[${text}](${href})`;
              link.parentNode.replaceChild(wrapper, link);
            }
          });
        };
        
        // Process images
        const transformImages = () => {
          const imageElements = tempDiv.querySelectorAll('img');
          imageElements.forEach(img => {
            const alt = img.getAttribute('alt') || '';
            const src = img.getAttribute('src') || '';
            if (src) {
              const wrapper = document.createElement('span');
              wrapper.textContent = `![${alt}](${src})`;
              img.parentNode.replaceChild(wrapper, img);
            }
          });
        };
        
        // Process blockquotes
        const transformBlockquotes = () => {
          const quotes = tempDiv.querySelectorAll('blockquote');
          quotes.forEach(quote => {
            const text = quote.textContent || '';
            // Split by lines and prefix each with >
            const lines = text.split('\n');
            const quotedText = lines.map(line => `> ${line}`).join('\n');
            
            const wrapper = document.createElement('div');
            wrapper.textContent = quotedText;
            quote.parentNode.replaceChild(wrapper, quote);
          });
        };
        
        // Process horizontal rules
        const transformHorizontalRules = () => {
          const rules = tempDiv.querySelectorAll('hr');
          rules.forEach(rule => {
            const wrapper = document.createElement('div');
            wrapper.textContent = '\n---\n';
            rule.parentNode.replaceChild(wrapper, rule);
          });
        };
        
        // Use a simplified approach just for lists that handles the nesting properly
        const handleLists = () => {
          // Clean slate - create a new result with proper formatting
          let markdownContent = '';
          
          // First, try to find any main heading
          const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
          if (headings.length > 0) {
            for (const heading of headings) {
              const level = parseInt(heading.tagName.substring(1), 10);
              const hashes = '#'.repeat(level);
              markdownContent += `${hashes} ${heading.textContent.trim()}\n\n`;
            }
          }
          
          // Find all top-level ordered lists
          const orderedLists = tempDiv.querySelectorAll('ol');
          for (const ol of orderedLists) {
            // Ignore nested lists
            if (ol.closest('li') !== null) continue;
            
            markdownContent += '\n';
            
            // Get all list items
            const items = ol.querySelectorAll(':scope > li');
            items.forEach((item, index) => {
              // Get the main text directly attached to the list item (not including nested elements)
              let mainText = '';
              
              // Collect text content from direct child text nodes and elements that aren't lists
              for (const node of item.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                  mainText += node.textContent.trim() + ' ';
                } else if (node.nodeType === Node.ELEMENT_NODE && 
                          node.tagName.toLowerCase() !== 'ul' && 
                          node.tagName.toLowerCase() !== 'ol' &&
                          !node.querySelector('ul, ol')) {
                  mainText += node.textContent.trim() + ' ';
                }
              }
              mainText = mainText.trim();
              
              // Add numbered item with its content
              markdownContent += `${index + 1}. ${mainText}\n`;
              
              // Check for nested lists
              const nestedLists = item.querySelectorAll(':scope > ul, :scope > ol');
              if (nestedLists.length > 0) {
                // Process each nested list
                nestedLists.forEach(nestedList => {
                  const isOrdered = nestedList.tagName.toLowerCase() === 'ol';
                  const nestedItems = nestedList.querySelectorAll(':scope > li');
                  
                  nestedItems.forEach((nestedItem, nestedIndex) => {
                    const nestedText = nestedItem.textContent.trim();
                    const prefix = isOrdered ? `   ${nestedIndex + 1}.` : '   -';
                    markdownContent += `${prefix} ${nestedText}\n`;
                  });
                });
                
                // Add spacing after nested lists
                markdownContent += '\n';
              } else {
                // Add spacing after main item
                markdownContent += '\n';
              }
            });
          }
          
          // Find all top-level unordered lists
          const unorderedLists = tempDiv.querySelectorAll('ul');
          for (const ul of unorderedLists) {
            // Ignore nested lists
            if (ul.closest('li') !== null) continue;
            
            markdownContent += '\n';
            
            // Get all list items
            const items = ul.querySelectorAll(':scope > li');
            items.forEach(item => {
              // Get the main text directly attached to the list item
              let mainText = '';
              
              // Collect text content from direct child text nodes and elements that aren't lists
              for (const node of item.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                  mainText += node.textContent.trim() + ' ';
                } else if (node.nodeType === Node.ELEMENT_NODE && 
                          node.tagName.toLowerCase() !== 'ul' && 
                          node.tagName.toLowerCase() !== 'ol' &&
                          !node.querySelector('ul, ol')) {
                  mainText += node.textContent.trim() + ' ';
                }
              }
              mainText = mainText.trim();
              
              // Add bullet point
              markdownContent += `- ${mainText}\n`;
              
              // Check for nested lists
              const nestedLists = item.querySelectorAll(':scope > ul, :scope > ol');
              if (nestedLists.length > 0) {
                // Process each nested list
                nestedLists.forEach(nestedList => {
                  const isOrdered = nestedList.tagName.toLowerCase() === 'ol';
                  const nestedItems = nestedList.querySelectorAll(':scope > li');
                  
                  nestedItems.forEach((nestedItem, nestedIndex) => {
                    const nestedText = nestedItem.textContent.trim();
                    const prefix = isOrdered ? `   ${nestedIndex + 1}.` : '   -';
                    markdownContent += `${prefix} ${nestedText}\n`;
                  });
                });
                
                // Add spacing after nested lists
                markdownContent += '\n';
              } else {
                // Add spacing after main item
                markdownContent += '\n';
              }
            });
          }
          
          // Find all paragraphs and add them properly
          const paragraphs = tempDiv.querySelectorAll('p');
          for (const p of paragraphs) {
            if (p.textContent.trim()) {
              markdownContent += `${p.textContent.trim()}\n\n`;
            }
          }
          
          // Clean up by removing excessive blank lines
          markdownContent = markdownContent.replace(/\n{3,}/g, '\n\n');
          
          debugListProcessing('Final Markdown Content', markdownContent);
          return markdownContent;
        };
        
        // Apply basic formatting first
        transformCodeBlocks();
        transformEmphasis();
        transformLinks();
        transformImages();
        transformBlockquotes();
        transformHorizontalRules();
        
        // Now use our specialized list handling
        const listContent = handleLists();
        // If we got list content, use it
        if (listContent && listContent.trim().length > 0) {
          return listContent;
        }
        
        // Otherwise, fall back to getting the formatted text
        let result = tempDiv.textContent || '';
        // Clean up extra whitespace while preserving meaningful line breaks
        result = result.replace(/\n{3,}/g, '\n\n'); // Replace 3+ consecutive line breaks with 2
        
        return result.trim();
      } catch (e) {
        debugLog(`Error converting HTML to markdown: ${e.message}`);
        return getSafeText(element); // Fallback to plain text
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

        // SPECIAL HANDLING FOR CHAT PAGES WITH KNOWN STRUCTURE
        if (isChat) {
          debugLog('Using special extraction for chat pages based on items-end/items-start classes');
          
          // Direct targeting of the user and AI message containers based on the provided structure
          const userMessages = document.querySelectorAll('.items-end');
          const aiMessages = document.querySelectorAll('.items-start');
          
          debugLog(`Found ${userMessages.length} user messages and ${aiMessages.length} AI messages using items-end/items-start selectors`);
          
          if (userMessages.length > 0 && aiMessages.length > 0) {
            // We found both user and AI messages
            
            // Create arrays of messages with their position in the DOM
            const allMessages = [];
            
            // Process user messages
            userMessages.forEach(el => {
              if (!el || !el.classList) return;
              
              // Skip elements that aren't directly user messages (nested items or other UI elements)
              // We want the main container divs
              const isMainContainer = el.classList.contains('group') && 
                                    el.classList.contains('flex') && 
                                    el.classList.contains('flex-col');
              
              if (!isMainContainer) return;
              
              const text = getSafeText(el);
              if (text && text.length > 10) {
                // Determine position for sorting (DOM tree index)
                const position = Array.from(document.querySelectorAll('*')).indexOf(el);
                
                allMessages.push({
                  element: el,
                  text: text,
                  position: position,
                  type: 'user'
                });
                
                highlightElement(el, 'user');
                debugLog(`Found user message: ${text.substring(0, 30)}...`);
              }
            });
            
            // Process AI messages
            aiMessages.forEach(el => {
              if (!el || !el.classList) return;
              
              // Skip elements that aren't directly AI messages
              const isMainContainer = el.classList.contains('group') && 
                                    el.classList.contains('flex') && 
                                    el.classList.contains('flex-col');
              
              if (!isMainContainer) return;
              
              // For AI messages, use the formatted HTML to preserve formatting
              const text = getFormattedHtml(el);
              if (text && text.length > 10) {
                const position = Array.from(document.querySelectorAll('*')).indexOf(el);
                
                allMessages.push({
                  element: el,
                  text: text,
                  position: position,
                  type: 'ai'
                });
                
                highlightElement(el, 'ai');
                debugLog(`Found AI message: ${text.substring(0, 30)}...`);
              }
            });
            
            // Sort by DOM position to maintain conversation order
            allMessages.sort((a, b) => a.position - b.position);
            
            // Generate markdown
            if (allMessages.length > 0) {
              conversationFound = true;
              
              allMessages.forEach((message, index) => {
                if (message.type === 'user') {
                  markdown += `## User [${index + 1}]\n\n> ${message.text}\n\n`;
                  debugLog(`Added User message ${index + 1}`);
                } else {
                  markdown += `## Grok [${index + 2}]\n\n${message.text}\n\n`;
                  debugLog(`Added Grok message ${index + 1}`);
                }
              });
              
              // Add instructions section
              markdown += `## Instructions for Grok\n\nContinue the conversation from the last message, using the context provided above.\n`;
              
              debugLog(`Successfully extracted ${allMessages.length} messages`);
            }
          }
          
          // If we couldn't find messages with the above approach, try alternative selectors
          if (!conversationFound) {
            debugLog('Trying alternative selectors for Grok chat page');
            
            // Try a more general approach - looking for message-like containers
            try {
              // Look for all flex containers with relative positioning (common in chat UIs)
              const chatContainers = document.querySelectorAll('.relative.group.flex');
              debugLog(`Found ${chatContainers.length} possible chat containers`);
              
              if (chatContainers.length > 0) {
                const messages = [];
                
                // Process each container
                chatContainers.forEach((container, index) => {
                  if (!container || !container.classList) return;
                  
                  const text = getSafeText(container);
                  if (!text || text.length < 10) return;
                  
                  // Determine if it's a user message (items-end) or AI message (items-start)
                  const isUserMessage = container.classList.contains('items-end');
                  const isAIMessage = container.classList.contains('items-start');
                  
                  if (isUserMessage || isAIMessage) {
                    // Get position for sorting
                    const position = Array.from(document.querySelectorAll('*')).indexOf(container);
                    
                    // Use formatted HTML for AI messages to preserve formatting
                    const messageText = isAIMessage ? getFormattedHtml(container) : getSafeText(container);
                    
                    messages.push({
                      element: container,
                      text: messageText,
                      position: position,
                      type: isUserMessage ? 'user' : 'ai'
                    });
                    
                    highlightElement(container, isUserMessage ? 'user' : 'ai');
                    debugLog(`Found ${isUserMessage ? 'user' : 'AI'} message: ${messageText.substring(0, 30)}...`);
                  }
                });
                
                // Sort by position
                messages.sort((a, b) => a.position - b.position);
                
                if (messages.length > 0) {
                  conversationFound = true;
                  
                  // Generate markdown
                  messages.forEach((message, index) => {
                    if (message.type === 'user') {
                      markdown += `## User [${index + 1}]\n\n> ${message.text}\n\n`;
                      debugLog(`Added User message ${index + 1}`);
                    } else {
                      markdown += `## Grok [${index + 2}]\n\n${message.text}\n\n`;
                      debugLog(`Added Grok message ${index + 1}`);
                    }
                  });
                  
                  // Add instructions section
                  markdown += `## Instructions for Grok\n\nContinue the conversation from the last message, using the context provided above.\n`;
                  
                  debugLog(`Successfully extracted ${messages.length} messages using alternative selectors`);
                }
              }
            } catch (e) {
              debugLog(`Error with alternative selectors: ${e.message}`);
            }
          }
        }
        
        // For shared pages or as fallback for chat pages
        if (!conversationFound) {
          // Try general extraction approaches...
          // [Keeping the existing fallback code for brevity]
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
                    msgClassName.includes('items-end') ||
                    (message.getAttribute && message.getAttribute('data-sender-type') === 'user');
                    
                  const hasAIIndicator = 
                    msgClassName.includes('assistant') ||
                    msgClassName.includes('grok') ||
                    msgClassName.includes('bot') ||
                    msgClassName.includes('ai') ||
                    msgClassName.includes('items-start') ||
                    (message.getAttribute && message.getAttribute('data-sender-type') === 'assistant');
                    
                  // If we have clear indicators, use them
                  if (hasUserIndicator) isUser = true;
                  else if (hasAIIndicator) isUser = false;
                  
                  // Add to markdown
                  if (isUser) {
                    markdown += `## User [${index + 1}]\n\n> ${text}\n\n`;
                    highlightElement(message, 'user');
                    debugLog(`Added User message ${index}: ${text.substring(0, 30)}...`);
                  } else {
                    markdown += `## Grok [${index + 2}]\n\n${text}\n\n`;
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
                      markdown += `## User [${index + 1}]\n\n> ${text}\n\n`;
                      highlightElement(el, 'user');
                      debugLog(`Added User message: ${text.slice(0, 30)}...`);
                    } else {
                      markdown += `## Grok [${index + 2}]\n\n${text}\n\n`;
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
    const userCount = (markdown.match(/## User/g) || []).length;
    const grokCount = (markdown.match(/## Grok/g) || []).length;
    debugLog(`Final markdown contains ${userCount} User messages and ${grokCount} Grok messages`);
    
    // Add instructions section if not already added and some conversation content was found
    if (conversationFound && !markdown.includes('## Instructions for Grok')) {
      markdown += `\n## Instructions for Grok\n\nContinue the conversation from the last message, using the context provided above.\n`;
    }
    
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