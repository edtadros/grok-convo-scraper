// Grok Conversation Scraper
// This script interacts with the Grok AI webpage to scrape conversations

// Set a flag to prevent duplicate initialization
if (!window.grokScraperInitialized) {
  window.grokScraperInitialized = true;
  
  console.log('Grok Convo Scraper loaded.');

  // Function to scrape Grok conversations and format to markdown
  function scrapeGrokConversations() {
    console.log('Scraping Grok conversations...');

    // Safe text extraction helper
    function getSafeText(element) {
      if (!element) return '';
      try {
        return (element.innerText || element.textContent || '').trim();
      } catch (e) {
        console.log(`Error getting text: ${e.message}`);
        return '';
      }
    }

    // Refactor the getFormattedHtml function to improve markdown conversion
    function getFormattedHtml(element) {
      if (!element) return '';
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.innerHTML;

        const processElementsInOrder = () => {
          let markdownContent = '';

          const elements = tempDiv.childNodes;
          elements.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              let nodeHtml = node.innerHTML;

              let nodeText = nodeHtml.trim();
              if (node.tagName.startsWith('H')) {
                const level = parseInt(node.tagName[1]);
                nodeText = `${'#'.repeat(level)} ${nodeText}`;
              } else if (['UL', 'OL'].includes(node.tagName)) {
                nodeText = processList(node);
              }

              // Process <strong> and <em> tags after handling lists
              nodeText = nodeText.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
              nodeText = nodeText.replace(/<em>(.*?)<\/em>/g, '*$1*');

              // Remove any remaining HTML tags
              nodeText = nodeText.replace(/<[^>]+>/g, '');

              markdownContent += `${nodeText}\n\n`;
              if (node.tagName.toLowerCase() === 'p') {
                markdownContent += '\n\r';
              }
            }
          });

          return markdownContent;
        };

        const markdownOutput = processElementsInOrder();
        return markdownOutput.trim();
      } catch (e) {
        console.log(`Error converting HTML to markdown: ${e.message}`);
        return getSafeText(element);
      }
    }

    // Log page details
    console.log('Page URL: ' + window.location.href);
    console.log('Page title: ' + document.title);

    let markdown = '# Grok Conversation\n\n';
    let conversationFound = false;

    // Add timestamp
    const timestamp = new Date().toISOString();
    markdown += `*Exported on: ${new Date().toLocaleString()}*\n\n`;

    console.log('Detected Grok chat page. Extracting conversation...');

    try {
      // Try to get conversation title
      const titleElements = document.querySelectorAll('h1, .title, header h1, [class*="title"]');
      if (titleElements && titleElements.length > 0) {
        console.log(`Found ${titleElements.length} possible title elements`);
        for (const titleEl of titleElements) {
          if (!titleEl) continue;

          const titleText = getSafeText(titleEl);
          if (titleText && titleText.length > 0) {
            markdown = `# ${titleText}\n\n*Exported on: ${new Date().toLocaleString()}*\n\n`;
            console.log(`Using title: ${titleText}`);
            break;
          }
        }
      } else {
        console.log('No title elements found');
      }

      // SPECIAL HANDLING FOR CHAT PAGES WITH KNOWN STRUCTURE
      console.log('Using special extraction for chat pages based on items-end/items-start classes');

      // Direct targeting of the user and AI message containers based on the provided structure
      const userMessages = document.querySelectorAll('.items-end');
      const aiMessages = document.querySelectorAll('.items-start');

      console.log(`Found ${userMessages.length} user messages and ${aiMessages.length} AI messages using items-end/items-start selectors`);

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

            console.log(`Found user message: ${text.substring(0, 30)}...`);
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

            console.log(`Found AI message: ${text.substring(0, 30)}...`);
          }
        });

        // Sort by DOM position to maintain conversation order
        allMessages.sort((a, b) => a.position - b.position);

        // Generate markdown
        if (allMessages.length > 0) {
          conversationFound = true;

          allMessages.forEach((message) => {
            if (message.type === 'user') {
              const userLines = message.text.split('\n').map(line => `> ${line}`).join('\n');
              markdown += `## User\n\n${userLines}\n\n`;
              console.log(`Added User message`);
            } else {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = message.element.innerHTML;
              let grokMarkdown = '';

              // Find the 'message-bubble' div
              const messageBubble = tempDiv.querySelector('.message-bubble');
              if (messageBubble) {
                messageBubble.childNodes.forEach((node, idx) => {
                  console.log(`Node type: ${node.nodeType}, Node name: ${node.nodeName}`);
                  if (node.nodeType === Node.ELEMENT_NODE && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'LI', 'OL'].includes(node.tagName)) {
                    let nodeHtml = node.innerHTML;

                    // Process <strong> and <em> tags
                    nodeHtml = nodeHtml.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
                    nodeHtml = nodeHtml.replace(/<em>(.*?)<\/em>/g, '*$1*');

                    let nodeText = nodeHtml.trim();
                    if (node.tagName.startsWith('H')) {
                      const level = parseInt(node.tagName[1]);
                      nodeText = `${'#'.repeat(level)} ${nodeText}`;
                    } else if (['UL', 'OL'].includes(node.tagName)) {
                      nodeText = processList(node);
                    }

                    console.log(`Processing node: ${node.tagName}, Text: ${nodeText}`);
                    grokMarkdown += `${nodeText}\n\n`;
                    if (node.tagName.toLowerCase() === 'p') {
                      grokMarkdown += '\n\r';
                      console.log(`Added newline and carriage return after <p> node`);
                    }
                    if (idx < messageBubble.childNodes.length - 1) {
                      const nextNode = messageBubble.childNodes[idx + 1];
                      if (nextNode.nodeType === Node.ELEMENT_NODE && node.tagName !== nextNode.tagName) {
                        grokMarkdown += '\n\r';
                        console.log(`Added newline and carriage return between different node types: ${node.tagName} and ${nextNode.tagName}`);
                      }
                    }
                  }
                  console.log(`Current grokMarkdown content: ${grokMarkdown}`);
                });
              }

              markdown += `## Grok\n\n${grokMarkdown}`;
              console.log(`Added Grok message`);
            }
          });

          // Add instructions section
          markdown += `## Instructions for Grok\n\nContinue the conversation from the last message, using the context provided above.\n`;

          console.log(`Successfully extracted ${allMessages.length} messages`);
        }
      }

      // If we couldn't find messages with the above approach, try alternative selectors
      if (!conversationFound) {
        console.log('Trying alternative selectors for Grok chat page');

        // Try a more general approach - looking for message-like containers
        try {
          // Look for all flex containers with relative positioning (common in chat UIs)
          const chatContainers = document.querySelectorAll('.relative.group.flex');
          console.log(`Found ${chatContainers.length} possible chat containers`);

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

                console.log(`Found ${isUserMessage ? 'user' : 'AI'} message: ${messageText.substring(0, 30)}...`);
              }
            });

            // Sort by position
            messages.sort((a, b) => a.position - b.position);

            if (messages.length > 0) {
              conversationFound = true;

              // Generate markdown
              messages.forEach((message) => {
                if (message.type === 'user') {
                  const userLines = message.text.split('\n').map(line => `> ${line}`).join('\n');
                  markdown += `## User\n\n${userLines}\n\n`;
                  console.log(`Added User message`);
                } else {
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = message.element.innerHTML;
                  let grokMarkdown = '';

                  // Find the 'message-bubble' div
                  const messageBubble = tempDiv.querySelector('.message-bubble');
                  if (messageBubble) {
                    messageBubble.childNodes.forEach((node, idx) => {
                      console.log(`Node type: ${node.nodeType}, Node name: ${node.nodeName}`);
                      if (node.nodeType === Node.ELEMENT_NODE && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'LI', 'OL'].includes(node.tagName)) {
                        let nodeHtml = node.innerHTML;

                        // Process <strong> and <em> tags
                        nodeHtml = nodeHtml.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
                        nodeHtml = nodeHtml.replace(/<em>(.*?)<\/em>/g, '*$1*');

                        // Remove any remaining HTML tags
                        nodeHtml = nodeHtml.replace(/<[^>]+>/g, '');

                        let nodeText = nodeHtml.trim();
                        if (node.tagName.startsWith('H')) {
                          const level = parseInt(node.tagName[1]);
                          nodeText = `${'#'.repeat(level)} ${nodeText}`;
                        } else if (['UL', 'OL'].includes(node.tagName)) {
                          nodeText = processList(node);
                        }

                        console.log(`Processing node: ${node.tagName}, Text: ${nodeText}`);
                        grokMarkdown += `${nodeText}\n\n`;
                        if (node.tagName.toLowerCase() === 'p') {
                          grokMarkdown += '\n\r';
                          console.log(`Added newline and carriage return after <p> node`);
                        }
                        if (idx < messageBubble.childNodes.length - 1) {
                          const nextNode = messageBubble.childNodes[idx + 1];
                          if (nextNode.nodeType === Node.ELEMENT_NODE && node.tagName !== nextNode.tagName) {
                            grokMarkdown += '\n\r';
                            console.log(`Added newline and carriage return between different node types: ${node.tagName} and ${nextNode.tagName}`);
                          }
                        }
                      }
                      console.log(`Current grokMarkdown content: ${grokMarkdown}`);
                    });
                  }

                  markdown += `## Grok\n\n${grokMarkdown}`;
                  console.log(`Added Grok message`);
                }
              });

              // Add instructions section
              markdown += `## Instructions for Grok\n\nContinue the conversation from the last message, using the context provided above.\n`;

              console.log(`Successfully extracted ${messages.length} messages using alternative selectors`);
            }
          }
        } catch (e) {
          console.log(`Error with alternative selectors: ${e.message}`);
        }
      }

      // For shared pages or as fallback for chat pages
      if (!conversationFound) {
        // Try general extraction approaches...
        // [Keeping the existing fallback code for brevity]
        try {
          console.log('Starting direct DOM examination...');

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
                console.log(`Found ${elements.length} message elements with selector: ${selector}`);
                messageElements = Array.from(elements);
                break;
              }
            } catch (e) {
              console.log(`Error with selector ${selector}: ${e.message}`);
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

            console.log(`Found ${standaloneMessages.length} standalone message elements`);

            if (standaloneMessages.length >= 2) {
              // Assume alternating pattern starting with user
              let isUser = true;
              conversationFound = true;

              standaloneMessages.forEach((message) => {
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
                  const userLines = text.split('\n').map(line => `> ${line}`).join('\n');
                  markdown += `## User\n\n${userLines}\n\n`;
                  console.log(`Added User message`);
                } else {
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = message.element.innerHTML;
                  let grokMarkdown = '';

                  // Find the 'message-bubble' div
                  const messageBubble = tempDiv.querySelector('.message-bubble');
                  if (messageBubble) {
                    messageBubble.childNodes.forEach((node, idx) => {
                      console.log(`Node type: ${node.nodeType}, Node name: ${node.nodeName}`);
                      if (node.nodeType === Node.ELEMENT_NODE && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'LI', 'OL'].includes(node.tagName)) {
                        let nodeHtml = node.innerHTML;

                        // Process <strong> and <em> tags
                        nodeHtml = nodeHtml.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
                        nodeHtml = nodeHtml.replace(/<em>(.*?)<\/em>/g, '*$1*');

                        // Remove any remaining HTML tags
                        nodeHtml = nodeHtml.replace(/<[^>]+>/g, '');

                        let nodeText = nodeHtml.trim();
                        if (node.tagName.startsWith('H')) {
                          const level = parseInt(node.tagName[1]);
                          nodeText = `${'#'.repeat(level)} ${nodeText}`;
                        } else if (['UL', 'OL'].includes(node.tagName)) {
                          nodeText = processList(node);
                        }

                        console.log(`Processing node: ${node.tagName}, Text: ${nodeText}`);
                        grokMarkdown += `${nodeText}\n\n`;
                        if (node.tagName.toLowerCase() === 'p') {
                          grokMarkdown += '\n\r';
                          console.log(`Added newline and carriage return after <p> node`);
                        }
                        if (idx < messageBubble.childNodes.length - 1) {
                          const nextNode = messageBubble.childNodes[idx + 1];
                          if (nextNode.nodeType === Node.ELEMENT_NODE && node.tagName !== nextNode.tagName) {
                            grokMarkdown += '\n\r';
                            console.log(`Added newline and carriage return between different node types: ${node.tagName} and ${nextNode.tagName}`);
                          }
                        }
                      }
                      console.log(`Current grokMarkdown content: ${grokMarkdown}`);
                    });
                  }

                  markdown += `## Grok\n\n${grokMarkdown}`;
                  console.log(`Added Grok message`);
                }

                // Switch for next message if we don't have clear indicators
                if (!hasUserIndicator && !hasAIIndicator) {
                  isUser = !isUser;
                }
              });
            }
          }
        } catch (e) {
          console.log(`Error during message element extraction: ${e.message}`);
        }

        // If still not found, try the original approach with potential messages
        if (!conversationFound) {
          try {
            console.log('Trying simple message pattern with alternating roles...');

            // Get all divs and paragraphs that could be message containers
            const potentialMessages = document.querySelectorAll('div, p');

            // Filter to only elements with text content
            const elementsWithText = Array.from(potentialMessages).filter(el => {
              if (!el) return false;
              const text = getSafeText(el);
              return text && text.length > 15; // Only substantial content
            });

            console.log(`Found ${elementsWithText.length} elements with substantial text`);

            // Check if there are at least 2 messages (one from user, one from AI)
            if (elementsWithText.length >= 2) {
              // Try to extract the conversation in a simple user-AI alternating pattern
              console.log('Extracting conversation with alternating pattern...');
              let userTurn = true; // Start with user

              elementsWithText.forEach((el) => {
                if (!el) return;

                const text = getSafeText(el);
                if (text) {
                  // Add to markdown
                  if (userTurn) {
                    const userLines = text.split('\n').map(line => `> ${line}`).join('\n');
                    markdown += `## User\n\n${userLines}\n\n`;
                    console.log(`Added User message`);
                  } else {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = el.innerHTML;
                    let grokMarkdown = '';

                    // Find the 'message-bubble' div
                    const messageBubble = tempDiv.querySelector('.message-bubble');
                    if (messageBubble) {
                      messageBubble.childNodes.forEach((node, idx) => {
                        console.log(`Node type: ${node.nodeType}, Node name: ${node.nodeName}`);
                        if (node.nodeType === Node.ELEMENT_NODE && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'LI', 'OL'].includes(node.tagName)) {
                          let nodeHtml = node.innerHTML;

                          // Process <strong> and <em> tags
                          nodeHtml = nodeHtml.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
                          nodeHtml = nodeHtml.replace(/<em>(.*?)<\/em>/g, '*$1*');

                          // Remove any remaining HTML tags
                          nodeHtml = nodeHtml.replace(/<[^>]+>/g, '');

                          let nodeText = nodeHtml.trim();
                          if (node.tagName.startsWith('H')) {
                            const level = parseInt(node.tagName[1]);
                            nodeText = `${'#'.repeat(level)} ${nodeText}`;
                          } else if (['UL', 'OL'].includes(node.tagName)) {
                            nodeText = processList(node);
                          }

                          console.log(`Processing node: ${node.tagName}, Text: ${nodeText}`);
                          grokMarkdown += `${nodeText}\n\n`;
                          if (node.tagName.toLowerCase() === 'p') {
                            grokMarkdown += '\n\r';
                            console.log(`Added newline and carriage return after <p> node`);
                          }
                          if (idx < messageBubble.childNodes.length - 1) {
                            const nextNode = messageBubble.childNodes[idx + 1];
                            if (nextNode.nodeType === Node.ELEMENT_NODE && node.tagName !== nextNode.tagName) {
                              grokMarkdown += '\n\r';
                              console.log(`Added newline and carriage return between different node types: ${node.tagName} and ${nextNode.tagName}`);
                            }
                          }
                        }
                        console.log(`Current grokMarkdown content: ${grokMarkdown}`);
                      });
                    }

                    markdown += `## Grok\n\n${grokMarkdown}\n`;
                    console.log(`Added Grok message`);
                  }
                  userTurn = !userTurn; // Switch turns
                  conversationFound = true;
                }
              });
            }
          } catch (e) {
            console.log(`Error during alternating pattern extraction: ${e.message}`);
          }
        }
      }
    } catch (e) {
      console.log(`Error during extraction: ${e.message}`);
      console.error('Extraction error:', e);
    }

    // If we still couldn't find conversation content, grab the entire page content
    if (!conversationFound) {
      try {
        console.log('Could not identify conversation structure, using raw page content');

        // Get main content area, if possible
        const mainContent = document.querySelector('main') || document.body;
        const rawText = getSafeText(mainContent);

        markdown += `## Raw Content\n\n${rawText}\n\n`;
        markdown += `\n\n*Note: The scraper couldn't identify the conversation structure. This is the raw page content.*\n`;
      } catch (e) {
        console.log(`Error getting raw content: ${e.message}`);
        markdown += `## Error\n\nFailed to extract content: ${e.message}\n`;
      }
    }

    // Log the final markdown structure with message counts
    const userCount = (markdown.match(/## User/g) || []).length;
    const grokCount = (markdown.match(/## Grok/g) || []).length;
    console.log(`Final markdown contains ${userCount} User messages and ${grokCount} Grok messages`);

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
  console.log(message);
}

// Update the script to handle nested lists correctly
function processList(node, indentLevel = 0) {
  const indent = '  '.repeat(indentLevel);
  let listMarkdown = '';

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      if (child.tagName === 'LI') {
        // Extract text content from direct text nodes only
        let childText = Array.from(child.childNodes)
          .filter(n => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && !['UL', 'OL'].includes(n.tagName)))
          .map(n => n.textContent.trim())
          .join(' ');

        // Process <strong> and <em> tags
        childText = childText.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
        childText = childText.replace(/<em>(.*?)<\/em>/g, '*$1*');

        // Add the parent list item text
        if (node.tagName === 'UL') {
          listMarkdown += `${indent}- ${childText}\n`;
        } else if (node.tagName === 'OL') {
          const index = Array.from(node.children).indexOf(child) + 1;
          listMarkdown += `${indent}${index}. ${childText}\n`;
        }

        // Process nested lists separately
        child.childNodes.forEach((nestedChild) => {
          if (nestedChild.nodeType === Node.ELEMENT_NODE && ['UL', 'OL'].includes(nestedChild.tagName)) {
            listMarkdown += processList(nestedChild, indentLevel + 1);
          }
        });
      }
    }
  });

  return listMarkdown;
} 