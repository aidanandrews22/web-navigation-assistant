import { MessageRequest, MessageResponse, ScreenshotRequest, AIResponse, AnalysisRequest } from './types';
import axios from 'axios';

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request: MessageRequest, sender, sendResponse: (response: MessageResponse) => void) => {
  handleMessage(request, sender, sendResponse);
  return true; // Required to use sendResponse asynchronously
});

async function handleMessage(
  request: MessageRequest, 
  sender: chrome.runtime.MessageSender, 
  sendResponse: (response: MessageResponse) => void
) {
  try {
    switch (request.action) {
      case 'captureScreenshot':
        const screenshotData = await captureScreenshot();
        sendResponse({ success: true, data: screenshotData });
        break;
        
      case 'analyzeScreenshot':
        const apiKey = await getApiKey();
        if (!apiKey) {
          sendResponse({ success: false, error: 'No API key found. Please set your OpenAI API key.' });
          return;
        }
        
        // Extract data from the request
        const analysisRequest = request.data as AnalysisRequest;
        
        // Analyze the screenshot based on the mode
        const aiResponse = await analyzeScreenshot(
          analysisRequest.screenshot, 
          analysisRequest.userPrompt, 
          analysisRequest.mode, 
          apiKey
        );
        
        // Forward the mouse action to the content script if it exists and we're in navigation mode
        if (aiResponse.mouseAction) {
          await sendMessageToActiveTab({
            action: 'moveMouse',
            data: aiResponse.mouseAction
          });
        }
        
        sendResponse({ success: true, data: aiResponse });
        break;
        
      case 'getApiKey':
        const key = await getApiKey();
        sendResponse({ success: true, data: key });
        break;
        
      case 'saveApiKey':
        await saveApiKey(request.data);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error in background script:', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function captureScreenshot(): Promise<ScreenshotRequest> {
  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.id) {
    throw new Error('No active tab found');
  }
  
  try {
    // Capture screenshot using a more explicit typing approach
    const imageData: string = await new Promise((resolve) => {
      chrome.tabs.captureVisibleTab(
        { format: 'png' } as chrome.tabs.CaptureVisibleTabOptions, 
        (dataUrl) => resolve(dataUrl)
      );
    });
    
    return {
      imageData,
      url: tab.url || ''
    };
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    throw error;
  }
}

async function analyzeScreenshot(
  screenshotData: ScreenshotRequest, 
  userPrompt: string,
  mode: 'navigation' | 'qa',
  apiKey: string
): Promise<AIResponse> {
  try {
    // Convert base64 image to a blob for sending
    const base64Data = screenshotData.imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Create a system prompt for the AI based on the mode
    let systemPrompt = '';
    
    if (mode === 'navigation') {
      systemPrompt = `
      You are an AI assistant that helps users navigate websites. Your task is to:
      1. Analyze the provided screenshot of a website
      2. Provide brief, clear instructions on how to interact with the page based on the user's goal
      3. Specify mouse actions for a virtual cursor to guide the user

      The user is asking: "${userPrompt}"

      Respond with JSON in this format:
      {
        "instructions": "Brief instructions explaining what to do on this page to achieve the user's goal",
        "mouseAction": {
          "x": 0-100 (percentage of screen width),
          "y": 0-100 (percentage of screen height),
          "action": "move" or "click" or "dblclick" or "hover",
          "targetElement": "description of what's being targeted"
        }
      }
      
      You MUST include a mouseAction whenever possible to visually guide the user.
      If you can't determine a specific action, only provide general instructions.
      `;
    } else {
      // Q&A mode
      systemPrompt = `
      You are an AI assistant that helps users understand website content. Your task is to:
      1. Analyze the provided screenshot of a website
      2. Answer the user's question about the content shown in the screenshot
      3. Provide detailed, informative responses

      The user is asking: "${userPrompt}"

      Respond with a direct, informative answer. No need to include mouse actions.
      `;
    }
    
    // Prepare the API request
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { 
                type: 'text', 
                text: `I'm looking at a website with the URL: ${screenshotData.url}. ${userPrompt}` 
              },
              { 
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Parse the AI response
    const assistantMessage = response.data.choices[0].message.content;
    let parsedResponse: AIResponse;
    
    if (mode === 'navigation') {
      try {
        // Try to parse as JSON
        parsedResponse = JSON.parse(assistantMessage);
      } catch (e) {
        // If parsing fails, extract what we can from the text
        parsedResponse = {
          instructions: assistantMessage
        };
      }
    } else {
      // For Q&A mode, just use the text response
      parsedResponse = {
        instructions: assistantMessage
      };
    }
    
    return parsedResponse;
    
  } catch (error) {
    console.error('Error analyzing screenshot:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`OpenAI API error: ${error.response.status} - ${error.response.data.error?.message || JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get('openaiApiKey');
  return result.openaiApiKey || null;
}

async function saveApiKey(apiKey: string): Promise<void> {
  await chrome.storage.local.set({ openaiApiKey: apiKey });
}

async function sendMessageToActiveTab(message: MessageRequest): Promise<MessageResponse | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }
    
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id!, message, (response) => {
        resolve(response || null);
      });
    });
  } catch (error) {
    console.error('Error sending message to tab:', error);
    return null;
  }
} 