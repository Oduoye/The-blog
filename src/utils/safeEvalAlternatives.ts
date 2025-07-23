/**
 * Safe alternatives to eval() and other CSP-violating functions
 * These utilities help avoid Content Security Policy violations
 */

// Safe JSON parsing with error handling
export const safeJsonParse = <T = any>(jsonString: string, fallback?: T): T | null => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback ?? null;
  }
};

// Safe property access using bracket notation
export const safePropertyAccess = (obj: any, path: string): any => {
  if (!obj || typeof path !== 'string') return undefined;
  
  // Handle nested property paths like "user.profile.name"
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }
  
  return result;
};

// Safe property setting using bracket notation
export const safePropertySet = (obj: any, path: string, value: any): boolean => {
  if (!obj || typeof path !== 'string') return false;
  
  const keys = path.split('.');
  const lastKey = keys.pop();
  
  if (!lastKey) return false;
  
  let current = obj;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
  return true;
};

// Safe function dispatcher - alternative to dynamic function calls
export const safeFunctionDispatch = (
  functionMap: Record<string, Function>,
  functionName: string,
  ...args: any[]
): any => {
  if (functionName in functionMap && typeof functionMap[functionName] === 'function') {
    try {
      return functionMap[functionName](...args);
    } catch (error) {
      console.error(`Error executing function ${functionName}:`, error);
      return null;
    }
  }
  
  console.warn(`Function ${functionName} not found in function map`);
  return null;
};

// Safe mathematical expression evaluator for simple arithmetic
export const safeMathEvaluator = (expression: string): number | null => {
  // Only allow basic mathematical operations and numbers
  const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
  
  if (sanitized !== expression) {
    console.warn('Invalid characters in mathematical expression');
    return null;
  }
  
  try {
    // Use Function constructor with restricted scope (safer than eval)
    // This is still not ideal but better than eval for mathematical expressions
    const func = new Function('return (' + sanitized + ')');
    const result = func();
    
    if (typeof result === 'number' && !isNaN(result)) {
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error evaluating mathematical expression:', error);
    return null;
  }
};

// Safe template string processor
export const safeTemplateProcessor = (
  template: string,
  variables: Record<string, any>
): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
};

// Safe configuration object merger
export const safeConfigMerge = (
  defaultConfig: Record<string, any>,
  userConfig: Record<string, any>
): Record<string, any> => {
  const result = { ...defaultConfig };
  
  for (const [key, value] of Object.entries(userConfig)) {
    if (key in defaultConfig) {
      if (typeof defaultConfig[key] === 'object' && typeof value === 'object') {
        result[key] = safeConfigMerge(defaultConfig[key], value);
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
};

// Safe event handler dispatcher
export const safeEventDispatch = (
  eventHandlers: Record<string, Function>,
  eventType: string,
  eventData?: any
): void => {
  if (eventType in eventHandlers && typeof eventHandlers[eventType] === 'function') {
    try {
      eventHandlers[eventType](eventData);
    } catch (error) {
      console.error(`Error handling event ${eventType}:`, error);
    }
  }
};