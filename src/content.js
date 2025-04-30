// Grok Conversation Scraper
// This script interacts with the Grok AI webpage to scrape conversations

console.log('Grok Convo Scraper loaded.');

// Function to scrape Grok conversations and format to markdown
function scrapeGrokConversations() {
  console.log('Scraping Grok conversations...');
  
  let markdown = '# Grok Conversation\n\n';
  let conversationFound = false;
  
  // Check if we're on a Grok share page
  if (window.location.href.includes('grok.com/share')) {
    console.log('Detected Grok share page. Extracting conversation...');
    
    // Target the conversation thread container
    // For shared Grok conversations, the container often has specific classes
    const conversationContainers = [
      document.querySelectorAll('div[class*="conversation-thread"]'),
      document.querySelectorAll('div[class*="thread"]'),
      document.querySelectorAll('div[class*="message-container"]'),
      document.querySelectorAll('div[class*="chat-container"]'),
      document.querySelectorAll('div[class*="chat-thread"]')
    ];
    
    // Find the container that exists
    let threadContainer = null;
    for (const container of conversationContainers) {
      if (container && container.length > 0) {
        threadContainer = container;
        console.log('Found conversation container:', container);
        break;
      }
    }
    
    // If we found the thread container, extract messages
    if (threadContainer && threadContainer.length > 0) {
      conversationFound = true;
      
      // Process all messages in the thread
      Array.from(threadContainer).forEach(thread => {
        // Find user and assistant messages
        const allMessages = thread.querySelectorAll('div[class*="message"], div[class*="bubble"], div[class*="content"]');
        
        if (allMessages && allMessages.length > 0) {
          console.log(`Found ${allMessages.length} messages`);
          
          // Process each message
          Array.from(allMessages).forEach((message, index) => {
            // Determine if this is a user or assistant message
            const isUser = 
              message.classList.contains('user-message') || 
              message.getAttribute('data-role') === 'user' || 
              message.classList.contains('human') ||
              message.classList.contains('user') ||
              // Check if it's every other message starting with user (common pattern)
              (index % 2 === 0);
            
            const isAssistant = 
              message.classList.contains('assistant-message') || 
              message.getAttribute('data-role') === 'assistant' || 
              message.classList.contains('grok') ||
              message.classList.contains('assistant') ||
              message.classList.contains('bot') ||
              // Check if it's every other message starting with assistant
              (index % 2 === 1);
            
            // Extract the text content
            const messageText = message.innerText.trim();
            
            // Skip empty messages
            if (!messageText) return;
            
            // Format as markdown
            if (isUser) {
              markdown += `## User\n\n${messageText}\n\n`;
            } else if (isAssistant) {
              markdown += `## Assistant\n\n${messageText}\n\n`;
            } else {
              // If we can't determine, use a generic header
              markdown += `## Message ${index + 1}\n\n${messageText}\n\n`;
            }
          });
        }
      });
    }
    
    // If no messages found using the container approach, try to identify by semantic structure
    if (!conversationFound) {
      // Look for page title or conversation title to add to the markdown
      const titleElements = document.querySelectorAll('h1, .title, .conversation-title');
      if (titleElements && titleElements.length > 0) {
        const title = titleElements[0].innerText.trim();
        markdown = `# ${title}\n\n`;
      }
      
      // Try to find elements that might contain messages
      const possibleUserElements = document.querySelectorAll('div[class*="user"], div[class*="human"], p[class*="user"], div[role="user"]');
      const possibleAssistantElements = document.querySelectorAll('div[class*="assistant"], div[class*="grok"], p[class*="assistant"], div[role="assistant"]');
      
      if (possibleUserElements.length > 0 && possibleAssistantElements.length > 0) {
        conversationFound = true;
        
        // Process user messages
        Array.from(possibleUserElements).forEach((element, index) => {
          const text = element.innerText.trim();
          if (text) {
            markdown += `## User\n\n${text}\n\n`;
          }
        });
        
        // Process assistant messages
        Array.from(possibleAssistantElements).forEach((element, index) => {
          const text = element.innerText.trim();
          if (text) {
            markdown += `## Assistant\n\n${text}\n\n`;
          }
        });
      }
    }
    
    // Last resort: try to find alternating paragraphs or divs with substantial content
    if (!conversationFound) {
      const paragraphs = document.querySelectorAll('p, div > div');
      if (paragraphs.length > 3) { // Ensure we have enough content for a conversation
        let userTurn = true; // Assume conversation starts with user
        let hasContent = false;
        
        Array.from(paragraphs).forEach((p, index) => {
          const text = p.innerText.trim();
          // Only consider paragraphs with substantial content
          if (text && text.length > 15) {
            hasContent = true;
            if (userTurn) {
              markdown += `## User\n\n${text}\n\n`;
            } else {
              markdown += `## Assistant\n\n${text}\n\n`;
            }
            userTurn = !userTurn; // Alternate between user and assistant
          }
        });
        
        conversationFound = hasContent;
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
  if (message.action === 'scrape') {
    console.log('Received scrape command');
    const markdown = scrapeGrokConversations();
    downloadMarkdown(markdown);
    sendResponse({ success: true, message: 'Conversation scraped and downloaded' });
  }
  return true; // Required for async sendResponse
}); 