import { ApiResponse } from './types';

export const successResponse = <T>(data: T, statusCode = 200): ApiResponse<T> => ({
  statusCode,
  body: JSON.stringify({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }),
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
  }
});

export const errorResponse = (
  message: string, 
  statusCode = 500, 
  details?: any
): ApiResponse => ({
  statusCode,
  body: JSON.stringify({
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString()
  }),
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
  }
});
