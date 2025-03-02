import { MessageRequest, MessageResponse, MouseAction } from './types';

// Create and append the mouse pointer element
const mousePointer = document.createElement('div');
mousePointer.style.cssText = `
  position: fixed;
  width: 32px;
  height: 32px;
  border-radius: 50% 50% 50% 0;
  background-color: rgba(255, 0, 0, 0.85);
  transform: rotate(-45deg) translate(-50%, -50%);
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-in-out;
  box-shadow: 0 0 10px 4px rgba(255, 0, 0, 0.5), 0 0 5px rgba(255, 0, 0, 1);
`;

// Create an inner element for better visibility
const pointerInner = document.createElement('div');
pointerInner.style.cssText = `
  position: absolute;
  top: 7px;
  left: 7px;
  width: 18px;
  height: 18px;
  background-color: white;
  border-radius: 50% 50% 50% 0;
  transform: scale(0.8);
`;
mousePointer.appendChild(pointerInner);

// Create a trail element for motion blur effect
const cursorTrail = document.createElement('div');
cursorTrail.style.cssText = `
  position: fixed;
  width: 32px;
  height: 32px;
  border-radius: 50% 50% 50% 0;
  background-color: rgba(255, 0, 0, 0.3);
  transform: rotate(-45deg) translate(-50%, -50%);
  pointer-events: none;
  z-index: 9998;
  opacity: 0;
  transition: transform 0.3s ease-out, opacity 0.5s ease-in-out;
  filter: blur(5px);
`;
document.body.appendChild(cursorTrail);
document.body.appendChild(mousePointer);

// Create and append the instruction element
const instructionElement = document.createElement('div');
instructionElement.style.cssText = `
  position: fixed;
  bottom: 20px;
  left: 20px;
  max-width: 350px;
  background-color: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  font-family: Arial, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  z-index: 9998;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease-in-out;
  opacity: 0;
  border-left: 5px solid #FF0000;
`;
document.body.appendChild(instructionElement);

// Listen for messages from the background script
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
      case 'moveMouse':
        const mouseAction = request.data as MouseAction;
        await animateMouse(mouseAction);
        sendResponse({ success: true });
        break;
        
      case 'showInstructions':
        showInstructions(request.data);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error in content script:', error);
    sendResponse({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

function showInstructions(text: string) {
  instructionElement.innerHTML = text;
  instructionElement.style.opacity = '1';
  
  // Hide instructions after 20 seconds to give user more time to read
  setTimeout(() => {
    instructionElement.style.opacity = '0';
  }, 20000);
}

let lastPositions: {x: number, y: number}[] = [];

async function animateMouse(action: MouseAction): Promise<void> {
  return new Promise((resolve) => {
    // Calculate actual pixel position based on percentages
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const xPos = (action.x / 100) * viewportWidth;
    const yPos = (action.y / 100) * viewportHeight;
    
    // Store position for trail effect
    lastPositions.push({x: xPos, y: yPos});
    if (lastPositions.length > 5) {
      lastPositions.shift();
    }
    
    // Show the mouse pointer
    mousePointer.style.opacity = '1';
    
    // Move the mouse pointer
    mousePointer.style.transform = `rotate(-45deg) translate(${xPos}px, ${yPos}px)`;
    
    // Show trail with slight delay for motion blur effect
    setTimeout(() => {
      if (lastPositions.length > 1) {
        const prevPos = lastPositions[lastPositions.length - 2];
        cursorTrail.style.opacity = '1';
        cursorTrail.style.transform = `rotate(-45deg) translate(${prevPos.x}px, ${prevPos.y}px)`;
        
        setTimeout(() => {
          cursorTrail.style.opacity = '0';
        }, 200);
      }
    }, 50);
    
    // If there's a target element description, show it as instructions
    if (action.targetElement) {
      showInstructions(`
        <div style="font-weight: bold; margin-bottom: 8px; color: #FF6666;">
          ${action.action === 'move' ? 'Move to' : 'Click on'}:
        </div>
        <div>${action.targetElement}</div>
      `);
    }
    
    // Add a pulsating effect to make it more noticeable
    const pulseAnimation = setInterval(() => {
      mousePointer.style.boxShadow = '0 0 20px 5px rgba(255, 0, 0, 0.8), 0 0 10px rgba(255, 0, 0, 1)';
      setTimeout(() => {
        mousePointer.style.boxShadow = '0 0 10px 4px rgba(255, 0, 0, 0.5), 0 0 5px rgba(255, 0, 0, 1)';
      }, 500);
    }, 1000);
    
    // Simulate click or double-click if needed
    if (action.action === 'click' || action.action === 'dblclick') {
      setTimeout(() => {
        // Add a temporary click animation
        mousePointer.style.transform = `rotate(-45deg) translate(${xPos}px, ${yPos}px) scale(0.8)`;
        
        setTimeout(() => {
          mousePointer.style.transform = `rotate(-45deg) translate(${xPos}px, ${yPos}px) scale(1)`;
          
          if (action.action === 'dblclick') {
            // For double-click, repeat the animation
            setTimeout(() => {
              mousePointer.style.transform = `rotate(-45deg) translate(${xPos}px, ${yPos}px) scale(0.8)`;
              
              setTimeout(() => {
                mousePointer.style.transform = `rotate(-45deg) translate(${xPos}px, ${yPos}px) scale(1)`;
                
                // Hide the pointer after completing animation
                setTimeout(() => {
                  mousePointer.style.opacity = '0';
                  cursorTrail.style.opacity = '0';
                  clearInterval(pulseAnimation);
                  resolve();
                }, 2000);
              }, 100);
            }, 200);
          } else {
            // For single click, hide after animation completes
            setTimeout(() => {
              mousePointer.style.opacity = '0';
              cursorTrail.style.opacity = '0';
              clearInterval(pulseAnimation);
              resolve();
            }, 2000);
          }
        }, 100);
      }, 500);
    } else {
      // For just movement or hover, hide after a delay
      setTimeout(() => {
        mousePointer.style.opacity = '0';
        cursorTrail.style.opacity = '0';
        clearInterval(pulseAnimation);
        resolve();
      }, 3000);
    }
  });
} 