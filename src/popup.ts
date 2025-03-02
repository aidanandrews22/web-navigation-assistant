import { MessageRequest, MessageResponse } from './types';

document.addEventListener('DOMContentLoaded', async () => {
  const analyzeBtn = document.getElementById('analyzeBtn') as HTMLButtonElement;
  const askQuestionBtn = document.getElementById('askQuestionBtn') as HTMLButtonElement;
  const saveApiKeyBtn = document.getElementById('saveApiKey') as HTMLButtonElement;
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  const userPromptInput = document.getElementById('userPrompt') as HTMLTextAreaElement;
  const userQuestionInput = document.getElementById('userQuestion') as HTMLTextAreaElement;
  const statusElement = document.getElementById('status') as HTMLDivElement;
  const instructionsElement = document.getElementById('instructions') as HTMLDivElement;
  
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Show corresponding content
      const tabName = (tab as HTMLElement).dataset.tab;
      const content = tabName === 'navigation' 
        ? document.getElementById('navigationTab') 
        : document.getElementById('qaTab');
      
      if (content) {
        content.classList.add('active');
      }
    });
  });

  // Load saved API key if available
  try {
    const response = await sendMessage({ action: 'getApiKey' });
    if (response.success && response.data) {
      apiKeyInput.value = response.data;
    }
  } catch (error) {
    console.error('Error loading API key:', error);
  }

  // Save API key
  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showStatus('Please enter a valid API key');
      return;
    }

    try {
      const response = await sendMessage({ 
        action: 'saveApiKey', 
        data: apiKey 
      });
      
      if (response.success) {
        showStatus('API key saved successfully');
      } else {
        showStatus(`Error: ${response.error || 'Failed to save API key'}`);
      }
    } catch (error) {
      showStatus('Error saving API key');
      console.error(error);
    }
  });

  // Analyze current page for navigation help
  analyzeBtn.addEventListener('click', async () => {
    const userPrompt = userPromptInput.value.trim();
    
    if (!userPrompt) {
      showStatus('Please enter what you need help with');
      return;
    }
    
    analyzeBtn.disabled = true;
    showStatus('Capturing screenshot...');

    try {
      // First, capture the screenshot
      const captureResponse = await sendMessage({ action: 'captureScreenshot' });
      
      if (!captureResponse.success) {
        throw new Error(captureResponse.error || 'Failed to capture screenshot');
      }
      
      showStatus('Analyzing with AI...');
      
      // Then, analyze the screenshot with user prompt
      const analyzeResponse = await sendMessage({ 
        action: 'analyzeScreenshot', 
        data: {
          screenshot: captureResponse.data,
          userPrompt: userPrompt,
          mode: 'navigation'
        }
      });
      
      if (!analyzeResponse.success) {
        throw new Error(analyzeResponse.error || 'Failed to analyze screenshot');
      }
      
      // Display instructions
      const aiResponse = analyzeResponse.data;
      instructionsElement.textContent = aiResponse.instructions;
      showStatus('Analysis complete');
      
    } catch (error) {
      console.error('Error during analysis:', error);
      showStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      analyzeBtn.disabled = false;
    }
  });
  
  // Ask general question about the page
  askQuestionBtn.addEventListener('click', async () => {
    const question = userQuestionInput.value.trim();
    
    if (!question) {
      showStatus('Please enter a question');
      return;
    }
    
    askQuestionBtn.disabled = true;
    showStatus('Capturing screenshot...');

    try {
      // First, capture the screenshot
      const captureResponse = await sendMessage({ action: 'captureScreenshot' });
      
      if (!captureResponse.success) {
        throw new Error(captureResponse.error || 'Failed to capture screenshot');
      }
      
      showStatus('Analyzing with AI...');
      
      // Then, analyze the screenshot with user question
      const analyzeResponse = await sendMessage({ 
        action: 'analyzeScreenshot', 
        data: {
          screenshot: captureResponse.data,
          userPrompt: question,
          mode: 'qa'
        }
      });
      
      if (!analyzeResponse.success) {
        throw new Error(analyzeResponse.error || 'Failed to analyze screenshot');
      }
      
      // Display answer
      const aiResponse = analyzeResponse.data;
      instructionsElement.textContent = aiResponse.instructions;
      showStatus('Question answered');
      
    } catch (error) {
      console.error('Error getting answer:', error);
      showStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      askQuestionBtn.disabled = false;
    }
  });

  function showStatus(message: string) {
    statusElement.textContent = message;
  }

  function sendMessage(message: MessageRequest): Promise<MessageResponse> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response: MessageResponse) => {
        resolve(response);
      });
    });
  }
}); 