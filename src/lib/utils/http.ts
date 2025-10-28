import { NextResponse } from 'next/server'
import { keysToCamel, keysToSnake } from './case'

export async function readJsonSnake<T = any>(req: Request): Promise<T> {
  const body = await req.json().catch(() => ({}))
  return keysToSnake(body) as T
}

export function jsonCamel(data: any, init?: ResponseInit) {
  return NextResponse.json(keysToCamel(data), init)
}


