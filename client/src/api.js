
const API_BASE_URL = 'http://localhost:5000/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('startupfund_token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data;
}

// Get all startups with optional filters
export async function getStartups(filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);

  if (filters.industry && filters.industry !== 'All industries') {
    params.set('industry', filters.industry);
  }

  if (filters.fundingStage && filters.fundingStage !== 'All stages') {
    params.set('fundingStage', filters.fundingStage);
  }

  const query = params.toString();

  return apiRequest(`/discover${query ? `?${query}` : ''}`);
}

// Register a new user
export async function registerUser(userData) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

// Log in an existing user
export async function loginUser(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

// Get startups created by the logged-in founder
export async function getMyStartups() {
  return apiRequest('/startups/mine');
}

// Create a startup
export async function createStartup(startupData) {
  return apiRequest('/startups', {
    method: 'POST',
    body: JSON.stringify(startupData),
  });
}

// Update a startup
export async function updateStartup(startupId, startupData) {
  return apiRequest(`/startups/${startupId}`, {
    method: 'PATCH',
    body: JSON.stringify(startupData),
  });
}

// Delete a startup
export async function deleteStartup(startupId) {
  return apiRequest(`/startups/${startupId}`, {
    method: 'DELETE',
  });
}
// Get the logged-in investor's saved startups
export async function getShortlist() {
  return apiRequest('/shortlist');
}

// Save a startup to the investor's shortlist
export async function addToShortlist(startupId) {
  return apiRequest(`/shortlist/${startupId}`, {
    method: 'POST',
  });
}

// Remove a startup from the investor's shortlist
export async function removeFromShortlist(startupId) {
  return apiRequest(`/shortlist/${startupId}`, {
    method: 'DELETE',
  });
}