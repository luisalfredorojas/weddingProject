'use strict';

import { fetchRSVPs, getRSVPStats } from './supabase.js';

// Session storage key for authentication
const AUTH_KEY = 'admin_authenticated';
const SERVICE_KEY_STORAGE = 'admin_service_key';

// Passwords (these should be set via environment variables in production)
// For now, using a default password - CHANGE THIS!
const ADMIN_PASSWORD = 'wedding2026';

// DOM Elements
let authScreen, adminScreen, authForm, authError;
let searchInput, filterAttendance, exportBtn, refreshBtn, logoutBtn;
let rsvpTbody, emptyState;
let statTotal, statYes, statNo;

// Data
let allRSVPs = [];
let filteredRSVPs = [];
let serviceRoleKey = null;

/**
 * Initialize the admin dashboard
 */
async function init() {
  // Get DOM elements
  authScreen = document.getElementById('auth-screen');
  adminScreen = document.getElementById('admin-screen');
  authForm = document.getElementById('auth-form');
  authError = document.getElementById('auth-error');
  
  searchInput = document.getElementById('search-input');
  filterAttendance = document.getElementById('filter-attendance');
  exportBtn = document.getElementById('export-csv');
  refreshBtn = document.getElementById('refresh-btn');
  logoutBtn = document.getElementById('logout-btn');
  
  rsvpTbody = document.getElementById('rsvp-tbody');
  emptyState = document.getElementById('empty-state');
  
  statTotal = document.getElementById('stat-total');
  statYes = document.getElementById('stat-yes');
  statNo = document.getElementById('stat-no');

  // Check if already authenticated
  if (checkAuth()) {
    showAdminScreen();
    await loadRSVPs();
  }

  // Setup event listeners
  setupEventListeners();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  authForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  searchInput.addEventListener('input', applyFilters);
  filterAttendance.addEventListener('change', applyFilters);
  exportBtn.addEventListener('click', exportToCSV);
  refreshBtn.addEventListener('click', handleRefresh);
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById('admin-password').value;
  
  authError.hidden = true;
  
  // For now, using simple password check
  // In production, this should validate against Supabase or a secure backend
  if (password === ADMIN_PASSWORD) {
    // Store authentication
    sessionStorage.setItem(AUTH_KEY, 'true');
    
    // Prompt for Supabase Service Role Key
    const key = prompt('Ingresa tu Supabase Service Role Key (empieza con eyJ...):\n\n(Esta key se guarda solo en tu sesión)');
    if (key && key.startsWith('eyJ')) {
      sessionStorage.setItem(SERVICE_KEY_STORAGE, key);
      serviceRoleKey = key;
      showAdminScreen();
      await loadRSVPs();
    } else {
      authError.textContent = 'Service Role Key inválida';
      authError.hidden = false;
      sessionStorage.removeItem(AUTH_KEY);
    }
  } else {
    authError.textContent = 'Contraseña incorrecta';
    authError.hidden = false;
  }
}

/**
 * Check if user is authenticated
 */
function checkAuth() {
  const isAuth = sessionStorage.getItem(AUTH_KEY) === 'true';
  const key = sessionStorage.getItem(SERVICE_KEY_STORAGE);
  
  if (isAuth && key) {
    serviceRoleKey = key;
    return true;
  }
  
  return false;
}

/**
 * Show admin screen and hide auth screen
 */
function showAdminScreen() {
  authScreen.hidden = true;
  adminScreen.hidden = false;
}

/**
 * Handle logout
 */
function handleLogout() {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(SERVICE_KEY_STORAGE);
  serviceRoleKey = null;
  authScreen.hidden = false;
  adminScreen.hidden = true;
  authForm.reset();
}

/**
 * Load RSVPs from Supabase
 */
async function loadRSVPs() {
  try {
    showLoading();
    allRSVPs = await fetchRSVPs(serviceRoleKey);
    filteredRSVPs = [...allRSVPs];
    updateStats();
    renderTable();
  } catch (error) {
    console.error('Error loading RSVPs:', error);
    showError('Error al cargar las confirmaciones. Verifica tu Service Role Key.');
  }
}

/**
 * Handle refresh button click
 */
async function handleRefresh() {
  refreshBtn.disabled = true;
  await loadRSVPs();
  setTimeout(() => {
    refreshBtn.disabled = false;
  }, 1000);
}

/**
 * Show loading state
 */
function showLoading() {
  rsvpTbody.innerHTML = `
    <tr class="loading-row">
      <td colspan="5">
        <div class="loading-spinner"></div>
        <span>Cargando confirmaciones...</span>
      </td>
    </tr>
  `;
  emptyState.hidden = true;
}

/**
 * Show error message
 */
function showError(message) {
  rsvpTbody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align: center; padding: 2rem; color: var(--color-danger);">
        ⚠️ ${message}
      </td>
    </tr>
  `;
}

/**
 * Update statistics cards
 */
function updateStats() {
  const stats = getRSVPStats(filteredRSVPs);
  statTotal.textContent = stats.total;
  statYes.textContent = stats.attending;
  statNo.textContent = stats.notAttending;
}

/**
 * Render the RSVP table
 */
function renderTable() {
  if (filteredRSVPs.length === 0) {
    rsvpTbody.innerHTML = '';
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  
  rsvpTbody.innerHTML = filteredRSVPs.map(rsvp => {
    const date = new Date(rsvp.created_at);
    const formattedDate = date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const attendanceBadge = rsvp.attendance === 'yes' 
      ? '<span class="badge badge-yes">✅ Sí asiste</span>'
      : '<span class="badge badge-no">❌ No asiste</span>';
    
    const allergies = rsvp.allergies || '<em style="color: var(--color-text-muted);">Sin alergias</em>';
    const songs = rsvp.songs || '<em style="color: var(--color-text-muted);">Sin canciones</em>';
    
    return `
      <tr>
        <td>${formattedDate}</td>
        <td><strong>${escapeHtml(rsvp.name)}</strong></td>
        <td>${attendanceBadge}</td>
        <td>${escapeHtml(allergies)}</td>
        <td>${escapeHtml(songs)}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Apply search and filters
 */
function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const attendanceFilter = filterAttendance.value;
  
  filteredRSVPs = allRSVPs.filter(rsvp => {
    // Search filter
    const matchesSearch = !searchTerm || 
      rsvp.name.toLowerCase().includes(searchTerm);
    
    // Attendance filter
    const matchesAttendance = !attendanceFilter || 
      rsvp.attendance === attendanceFilter;
    
    return matchesSearch && matchesAttendance;
  });
  
  updateStats();
  renderTable();
}

/**
 * Export RSVPs to CSV
 */
function exportToCSV() {
  if (filteredRSVPs.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  const headers = ['Fecha', 'Nombre', 'Asistencia', 'Alergias', 'Canciones'];
  const rows = filteredRSVPs.map(rsvp => {
    const date = new Date(rsvp.created_at).toLocaleString('es-ES');
    const attendance = rsvp.attendance === 'yes' ? 'Sí' : 'No';
    
    return [
      date,
      rsvp.name,
      attendance,
      rsvp.allergies || '',
      rsvp.songs || ''
    ];
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create download link
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rsvps-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
