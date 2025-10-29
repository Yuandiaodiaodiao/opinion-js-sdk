import { OpenApiError } from '../errors.js';
import { ProxyAgent } from 'undici';

/**
 * API response structure
 */
interface ApiResponse<T = any> {
  errno: number;
  errmsg?: string;
  result?: {
    data?: T;
    list?: T[];
    total?: number;
  };
}

/**
 * HTTP API client with API key authentication
 */
export class ApiClient {
  private proxyAgent?: ProxyAgent;

  constructor(
    private host: string,
    private apiKey: string,
  ) {
    // Auto-detect proxy from environment variables
    const proxy = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
    if (proxy) {
      this.proxyAgent = new ProxyAgent(proxy);
    }
  }

  /**
   * Make a GET request
   */
  async get<T>(
    endpoint: string,
    params: Record<string, any> = {},
    pathParams?: Record<string, any>,
  ): Promise<T> {
    // Replace path parameters in endpoint
    let finalEndpoint = endpoint;
    if (pathParams) {
      for (const [key, value] of Object.entries(pathParams)) {
        finalEndpoint = finalEndpoint.replace(`{${key}}`, String(value));
      }
    }

    const url = new URL(`${this.host}${finalEndpoint}`);
    url.searchParams.append('apikey', this.apiKey);

    // Add other parameters
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    }

    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add proxy agent if available
    if (this.proxyAgent) {
      (fetchOptions as any).dispatcher = this.proxyAgent;
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      throw new OpenApiError(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();
    // Debug: Log raw API response
    console.log('\n=== RAW API RESPONSE ===');
    console.log('Endpoint:', finalEndpoint);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('========================\n');
    return this.validateResponse(data, `GET ${finalEndpoint}`);
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, body: any): Promise<T> {
    const url = new URL(`${this.host}${endpoint}`);
    url.searchParams.append('apikey', this.apiKey);

    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    };

    // Add proxy agent if available
    if (this.proxyAgent) {
      (fetchOptions as any).dispatcher = this.proxyAgent;
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      throw new OpenApiError(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();
    // Debug: Log raw API response
    console.log('\n=== RAW API POST RESPONSE ===');
    console.log('Endpoint:', endpoint);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('=============================\n');
    return this.validateResponse(data, `POST ${endpoint}`);
  }

  /**
   * Validate API response structure
   */
  private validateResponse<T>(response: ApiResponse<T>, operationName: string): T {
    if (response.errno !== undefined && response.errno !== 0) {
      throw new OpenApiError(
        `Failed to ${operationName}: ${response.errmsg || 'Unknown error'}`,
      );
    }

    if (!response.result) {
      throw new OpenApiError(`Invalid response format from ${operationName}`);
    }

    // Return data, list, history, or the entire result object
    if (response.result.data !== undefined) {
      return response.result.data as T;
    } else if (response.result.list !== undefined) {
      return response.result.list as T;
    } else if ((response.result as any).history !== undefined) {
      return (response.result as any).history as T;
    } else {
      // For APIs that return data directly in result (like balance, auth)
      return response.result as unknown as T;
    }
  }

  /**
   * Parse list response with pagination info
   */
  async getList<T>(
    endpoint: string,
    params: Record<string, any> = {},
  ): Promise<{ list: T[]; total?: number }> {
    const url = new URL(`${this.host}${endpoint}`);
    url.searchParams.append('apikey', this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    }

    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add proxy agent if available
    if (this.proxyAgent) {
      (fetchOptions as any).dispatcher = this.proxyAgent;
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      throw new OpenApiError(`HTTP error! status: ${response.status}`);
    }

    const data: ApiResponse<T> = await response.json();

    // Debug: Log raw API response for list endpoints
    console.log('\n=== RAW API LIST RESPONSE ===');
    console.log('Endpoint:', endpoint);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('============================\n');

    if (data.errno !== undefined && data.errno !== 0) {
      throw new OpenApiError(`Failed to GET ${endpoint}: ${data.errmsg || 'Unknown error'}`);
    }

    return {
      list: (data.result?.list || []) as T[],
      total: data.result?.total,
    };
  }
}
