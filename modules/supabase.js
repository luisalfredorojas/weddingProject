'use strict';

import { fetchJSON } from './utils.js';

const CONFIG_URL = 'data/site.config.json';
let config = null;

/**
 * Load configuration with caching
 */
async function getConfig() {
  if (!config) {
    config = await fetchJSON(CONFIG_URL, { cacheKey: 'config' });
  }
  return config;
}

/**
 * Insert a new RSVP record into Supabase
 * @param {Object} payload - RSVP data
 * @returns {Promise<Object>} Response with ok status
 */
export async function insertRSVP(payload) {
  const { supabaseUrl, supabaseAnonKey } = await getConfig();
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rsvps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorMessage = 'Supabase error';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch (e) {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return { ok: true };
}

/**
 * Fetch all RSVP records (admin only)
 * @param {string} authToken - Service role key or authenticated user token
 * @returns {Promise<Array>} Array of RSVP records
 */
export async function fetchRSVPs(authToken) {
  const { supabaseUrl } = await getConfig();
  
  if (!supabaseUrl) {
    throw new Error('Supabase URL missing');
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rsvps?order=created_at.desc`, {
    headers: {
      'Content-Type': 'application/json',
      'apikey': authToken,
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch RSVPs');
  }

  return response.json();
}

/**
 * Get statistics about RSVPs
 * @param {Array} rsvps - Array of RSVP records
 * @returns {Object} Statistics object
 */
export function getRSVPStats(rsvps) {
  const total = rsvps.length;
  const attending = rsvps.filter(r => r.attendance === 'yes').length;
  const notAttending = rsvps.filter(r => r.attendance === 'no').length;
  
  return {
    total,
    attending,
    notAttending
  };
}
