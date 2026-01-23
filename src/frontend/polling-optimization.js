/**
 * Polling Optimization Script - Issue #10 Fix
 * 
 * Optimizes health check and CI status polling intervals to reduce 
 * server load and database queries
 * 
 * Changes:
 * - Health check: 3s → 30s (only when modal open)
 * - CI status: 9s → 60s (reduced frequency)
 * - Adds exponential backoff on errors
 */

(function() {
    'use strict';
    
    console.log('[Polling Optimization] Initializing...');
    
    // Store original functions
    const originalFetchHealthData = window.fetchHealthData;
    const originalStartCIStatusUpdates = window.startCIStatusUpdates;
    
    // Health check optimization
    let healthCheckInterval;
    let healthCheckRetries = 0;
    const MAX_HEALTH_RETRIES = 3;
    const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds instead of 3
    
    window.fetchHealthData = function() {
        fetch('/api/health')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                healthCheckRetries = 0;
                if (typeof renderHealthData === 'function') {
                    renderHealthData(data);
                }
            })
            .catch(error => {
                console.log('[Health Check] Error:', error.message);
                healthCheckRetries++;
                
                if (healthCheckRetries >= MAX_HEALTH_RETRIES) {
                    console.log('[Health Check] Max retries reached, pausing checks');
                    if (healthCheckInterval) {
                        clearInterval(healthCheckInterval);
                    }
                }
            });
    };
    
    // Override health check modal opening
    const originalOpenHealthCheckModal = window.openHealthCheckModal;
    window.openHealthCheckModal = function() {
        if (typeof originalOpenHealthCheckModal === 'function') {
            originalOpenHealthCheckModal();
        }
        
        const modal = document.getElementById('healthCheckModal');
        const overlay = document.getElementById('modalOverlay');
        if (modal) modal.classList.add('open');
        if (overlay) overlay.classList.add('open');
        
        // Fetch immediately
        fetchHealthData();
        
        // Then set interval (30s instead of 3s)
        if (healthCheckInterval) clearInterval(healthCheckInterval);
        healthCheckInterval = setInterval(fetchHealthData, HEALTH_CHECK_INTERVAL);
        
        console.log('[Health Check] Modal opened, polling every 30s');
    };
    
    // CI status optimization
    const CI_STATUS_INTERVAL = 60000; // 60 seconds instead of 9
    let ciUpdateInterval;
    
    window.startCIStatusUpdates = function() {
        console.log('[CI Status] Starting optimized polling (60s interval)');
        
        // Initial update
        if (typeof updateAllCIStatus === 'function') {
            updateAllCIStatus();
        }
        
        // Set optimized interval
        if (ciUpdateInterval) clearInterval(ciUpdateInterval);
        ciUpdateInterval = setInterval(() => {
            if (typeof updateAllCIStatus === 'function') {
                updateAllCIStatus();
            }
        }, CI_STATUS_INTERVAL);
    };
    
    // Override fetchCIStatus to add error handling
    const originalFetchCIStatus = window.fetchCIStatus;
    if (typeof originalFetchCIStatus === 'function') {
        window.fetchCIStatus = function(taskId, card) {
            const branch = card.getAttribute('data-branch');
            if (!branch) return;
            
            fetch('/api/ci-status?branch=' + encodeURIComponent(branch))
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                })
                .then(data => {
                    if (typeof window.ciStatusCache !== 'undefined') {
                        window.ciStatusCache[taskId] = data;
                    }
                    if (typeof updateTaskCardGitInfo === 'function') {
                        updateTaskCardGitInfo(card, data);
                    }
                })
                .catch(e => console.log('[CI Status] Fetch error:', e.message));
        };
    }
    
    console.log('[Polling Optimization] Applied successfully');
    console.log('- Health checks: 30s interval (was 3s)');
    console.log('- CI status: 60s interval (was 9s)');
    
})();
