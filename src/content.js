// Grok Conversation Scraper
// This script interacts with the Grok AI webpage to scrape conversations

// Set a flag to prevent duplicate initialization
if (!window.grokScraperInitialized) {
  window.grokScraperInitialized = true;
  
  console.log('Grok Convo Scraper loaded.');

  // Function to scrape Grok conversations and format to markdown
  function scrapeGrokConversations() {
    console.log('Scraping Grok conversations...');
    
    let markdown = '# Grok Conversation\n\n';
    let conversationFound = false;
    
    // Add timestamp
    const timestamp = new Date().toISOString();
    markdown += `*Exported on: ${new Date().toLocaleString()}*\n\n`;
    
    // Check if we're on a Grok share page
    if (window.location.href.includes('grok.com/share')) {
      console.log('Detected Grok share page. Extracting conversation...');
      
      // Try to get conversation title
      const titleElements = document.querySelectorAll('h1, .title, header h1, [class*="title"]');
      if (titleElements && titleElements.length > 0) {
        for (const titleEl of titleElements) {
          const titleText = titleEl.innerText.trim();
          if (titleText && titleText.length > 0) {
            markdown = `# ${titleText}\n\n*Exported on: ${new Date().toLocaleString()}*\n\n`;
            break;
          }
        }
      }
      
      // Enhanced detection of message patterns
      // First, look for specific UI patterns in Grok's interface

      // Look for message role indicators (common in AI chat interfaces)
      const userRoleIndicators = [
        'user-avatar', 'user-icon', 'user-profile', 'human-avatar',
        'user-message', 'user-query', 'user-input', 'human-message'
      ];
      
      const aiRoleIndicators = [
        'assistant-avatar', 'ai-avatar', 'bot-avatar', 'grok-avatar',
        'assistant-message', 'ai-message', 'bot-message', 'grok-message',
        'response', 'answer', 'completion'
      ];

      // Try to find message containers with role indicators
      let userMessages = [];
      let aiMessages = [];
      
      // Check for role indicators in class names
      for (const indicator of userRoleIndicators) {
        const elements = document.querySelectorAll(`[class*="${indicator}"]`);
        if (elements.length > 0) {
          userMessages = [...userMessages, ...elements];
        }
      }
      
      for (const indicator of aiRoleIndicators) {
        const elements = document.querySelectorAll(`[class*="${indicator}"]`);
        if (elements.length > 0) {
          aiMessages = [...aiMessages, ...elements];
        }
      }
      
      // Check for role attributes
      const roleAttrMessages = document.querySelectorAll('[data-role], [role]');
      if (roleAttrMessages.length > 0) {
        Array.from(roleAttrMessages).forEach(el => {
          const role = el.getAttribute('data-role') || el.getAttribute('role');
          if (role && role.toLowerCase().includes('user')) {
            userMessages.push(el);
          } else if (role && (role.toLowerCase().includes('assistant') || role.toLowerCase().includes('bot'))) {
            aiMessages.push(el);
          }
        });
      }
      
      // If we found distinct user and AI messages
      if (userMessages.length > 0 && aiMessages.length > 0) {
        conversationFound = true;
        console.log(`Found ${userMessages.length} user messages and ${aiMessages.length} AI messages`);
        
        // Sort messages by their position in the DOM to maintain conversation order
        const allMessages = [...userMessages, ...aiMessages].sort((a, b) => {
          const position = a.compareDocumentPosition(b);
          return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });
        
        // Process messages in DOM order
        let lastRole = null;
        allMessages.forEach(message => {
          // Determine if this is a user or AI message
          const isUser = userMessages.includes(message);
          const isAI = aiMessages.includes(message);
          
          // Skip messages that are containers of other messages we've already processed
          if (lastRole === 'user' && isUser) {
            const isContainer = Array.from(userMessages).some(m => 
              m !== message && message.contains(m)
            );
            if (isContainer) return;
          }
          
          if (lastRole === 'ai' && isAI) {
            const isContainer = Array.from(aiMessages).some(m => 
              m !== message && message.contains(m)
            );
            if (isContainer) return;
          }
          
          // Get message text
          const messageText = message.innerText.trim();
          if (!messageText) return;
          
          // Add to markdown with clear role distinction
          if (isUser) {
            markdown += `## Human\n\n${messageText}\n\n`;
            lastRole = 'user';
          } else if (isAI) {
            markdown += `## Grok\n\n${messageText}\n\n`;
            lastRole = 'ai';
          }
        });
      }
      
      // Fallback 1: Try to find message pairs in a conversation thread
      if (!conversationFound) {
        // Look for conversation thread containers
        const threadContainers = document.querySelectorAll('[class*="thread"], [class*="conversation"], [class*="chat"]');
        
        if (threadContainers.length > 0) {
          for (const container of threadContainers) {
            // Look for child elements that might be messages
            const messages = container.querySelectorAll('div, p, section');
            
            if (messages.length >= 2) { // Need at least one pair of messages
              // Try to identify alternating pattern (common in chat interfaces)
              const messageArray = Array.from(messages).filter(m => m.innerText.trim().length > 0);
              
              if (messageArray.length >= 2) {
                conversationFound = true;
                console.log(`Found ${messageArray.length} messages in thread container`);
                
                // Assume first message is from user, followed by AI, then alternating
                messageArray.forEach((message, index) => {
                  const text = message.innerText.trim();
                  if (!text) return;
                  
                  if (index % 2 === 0) {
                    markdown += `## Human\n\n${text}\n\n`;
                  } else {
                    markdown += `## Grok\n\n${text}\n\n`;
                  }
                });
                
                break; // Stop once we've found a valid container
              }
            }
          }
        }
      }
      
      // Fallback 2: Try semantic structure based on more general selectors
      if (!conversationFound) {
        // Look for paragraphs or divs with substantial content
        const paragraphs = document.querySelectorAll('p, div > div');
        const substantialParagraphs = Array.from(paragraphs).filter(p => {
          const text = p.innerText.trim();
          return text && text.length > 15;
        });
        
        if (substantialParagraphs.length >= 2) {
          conversationFound = true;
          console.log(`Using ${substantialParagraphs.length} paragraphs as conversation`);
          
          // Assume conversation starts with human
          let isHuman = true;
          
          substantialParagraphs.forEach((p, index) => {
            const text = p.innerText.trim();
            if (!text) return;
            
            if (isHuman) {
              markdown += `## Human\n\n${text}\n\n`;
            } else {
              markdown += `## Grok\n\n${text}\n\n`;
            }
            
            isHuman = !isHuman; // Alternate between human and AI
          });
        }
      }
    }
    
    // If we still couldn't find conversation content, grab the entire page content
    if (!conversationFound) {
      markdown += `## Raw Content\n\n${document.body.innerText}\n\n`;
      markdown += `\n\n*Note: The scraper couldn't identify the conversation structure. This is the raw page content.*\n`;
    }
    
    console.log('Markdown generated:', markdown.substring(0, 100) + '...');
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