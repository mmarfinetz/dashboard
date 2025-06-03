/**
 * API Middleware with caching and retry functionality
 * This module provides reusable utilities for API requests
 */

import axios from 'axios';

// Simple in-memory cache
const cache = new Map();

/**
 * Cached API request function with retry logic
 * 
 * @param {Object} options - Request options
 * @param {string} options.url - API endpoint URL
 * @param {Object} options.params - URL parameters
 * @param {string} options.cacheKey - Key for caching (usually URL + serialized params)
 * @param {number} options.cacheTTL - Cache time-to-live in milliseconds
 * @param {number} options.maxRetries - Maximum number of retry attempts
 * @param {number} options.retryDelay - Base delay between retries in milliseconds
 * @returns {Promise<Object>} - API response data
 */
export async function cachedRequest({
  url,
  params,
  cacheKey,
  cacheTTL = 15 * 60 * 1000, // Default: 15 minutes
  maxRetries = 3,
  retryDelay = 1000,
  forceRefresh = false
}) {
  // Generate cache key if not provided
  if (!cacheKey) {
    cacheKey = `${url}:${JSON.stringify(params || {})}`;
  }
  
  // Check cache first (unless force refresh)
  if (!forceRefresh && cache.has(cacheKey)) {
    const { data, expiry } = cache.get(cacheKey);
    if (expiry > Date.now()) {
      console.log(`Cache hit for: ${cacheKey.substring(0, 50)}...`);
      return data;
    } else {
      // Clear expired cache entry
      console.log(`Cache expired for: ${cacheKey.substring(0, 50)}...`);
      cache.delete(cacheKey);
    }
  }
  
  // Make the actual request with retries
  let lastError = null;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      console.log(`API request (attempt ${attempt + 1}/${maxRetries}): ${url}`);
      
      const response = await axios.get(url, { params });
      
      // Cache the successful response
      cache.set(cacheKey, {
        data: response.data,
        expiry: Date.now() + cacheTTL,
        timestamp: Date.now()
      });
      
      // Log cache statistics periodically
      if (Math.random() < 0.1) {  // ~10% chance to log stats
        console.log(`Cache stats: ${cache.size} entries`);
      }
      
      return response.data;
    } catch (error) {
      lastError = error;
      attempt++;
      
      // Determine if we should retry based on error type
      const status = error.response?.status;
      
      // Don't retry on 4xx client errors (except 429 rate limiting)
      if (status && status >= 400 && status < 500 && status !== 429) {
        break;
      }
      
      // Calculate exponential backoff delay with jitter
      const jitter = Math.random() * 200;
      const delay = Math.min(
        retryDelay * Math.pow(2, attempt - 1) + jitter, 
        30000 // Cap at 30 seconds
      );
      
      console.warn(`API request failed (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${Math.round(delay)}ms.`);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries failed
  console.error(`All ${maxRetries} API request attempts failed:`, lastError);
  throw lastError;
}

/**
 * Clears the API cache for specific keys or all entries
 * 
 * @param {string} keyPattern - Optional pattern to match cache keys
 * @returns {number} - Number of cache entries cleared
 */
export function clearApiCache(keyPattern = null) {
  if (!keyPattern) {
    const count = cache.size;
    cache.clear();
    return count;
  }
  
  let clearCount = 0;
  const pattern = new RegExp(keyPattern);
  
  for (const key of cache.keys()) {
    if (pattern.test(key)) {
      cache.delete(key);
      clearCount++;
    }
  }
  
  return clearCount;
}

/**
 * Returns statistics about the API cache
 * 
 * @returns {Object} - Cache statistics
 */
export function getApiCacheStats() {
  const now = Date.now();
  let expiredCount = 0;
  let totalSize = 0;
  let oldestTimestamp = now;
  
  for (const [key, value] of cache.entries()) {
    if (value.expiry < now) {
      expiredCount++;
    }
    
    totalSize += JSON.stringify(value.data).length;
    
    if (value.timestamp < oldestTimestamp) {
      oldestTimestamp = value.timestamp;
    }
  }
  
  return {
    totalEntries: cache.size,
    expiredEntries: expiredCount,
    totalSizeBytes: totalSize,
    oldestEntryAge: now - oldestTimestamp,
    keys: [...cache.keys()]
  };
}