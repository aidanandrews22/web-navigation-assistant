export interface AIResponse {
  instructions: string;
  mouseAction?: MouseAction;
}

export interface MouseAction {
  x: number;
  y: number;
  action: 'move' | 'click' | 'dblclick' | 'hover';
  targetElement?: string;
}

export interface ScreenshotRequest {
  imageData: string;
  url: string;
}

export interface AnalysisRequest {
  screenshot: ScreenshotRequest;
  userPrompt: string;
  mode: 'navigation' | 'qa';
}

export interface MessageRequest {
  action: 'captureScreenshot' | 'analyzeScreenshot' | 'showInstructions' | 'moveMouse' | 'getApiKey' | 'saveApiKey';
  data?: any;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
} 