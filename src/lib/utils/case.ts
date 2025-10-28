// Utilities to convert object keys between camelCase and snake_case (deep)

function isObjectLike(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function camelToSnake(key: string): string {
  return key
    .replace(/([A-Z])/g, '_$1')
    .replace(/-/g, '_')
    .toLowerCase();
}

export function snakeToCamel(key: string): string {
  return key.replace(/[_-](\w)/g, (_, c: string) => (c ? c.toUpperCase() : ''));
}

export function keysToSnake<T = any>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => keysToSnake(item)) as unknown as T;
  }
  if (isObjectLike(input)) {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) {
      result[camelToSnake(k)] = keysToSnake(v as any);
    }
    return result as T;
  }
  return input;
}

export function keysToCamel<T = any>(input: T): T {
  if (Array.isArray(input)) {
    return input.map((item) => keysToCamel(item)) as unknown as T;
  }
  if (isObjectLike(input)) {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) {
      result[snakeToCamel(k)] = keysToCamel(v as any);
    }
    return result as T;
  }
  return input;
}


