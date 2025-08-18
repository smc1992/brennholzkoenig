
export function safeJsonParse(jsonString: string | null | undefined, fallback: any = null) {
  if (!jsonString || jsonString === 'null' || jsonString === 'undefined' || jsonString.trim() === '') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (error) {
    console.warn('JSON Parse Error:', error);
    return fallback;
  }
}

export function safeJsonStringify(obj: any, fallback: string = '[]') {
  try {
    if (obj === null || obj === undefined) {
      return fallback;
    }
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('JSON Stringify Error:', error);
    return fallback;
  }
}
