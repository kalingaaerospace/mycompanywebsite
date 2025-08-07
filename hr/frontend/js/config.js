/**
 * Frontend Configuration
 * Contains public configuration values that are safe to expose in client-side code
 * 
 * Note: Only include public values here - never include service role keys or secrets!
 */

// Configuration object
const CONFIG = {
    supabase: {
        url: 'https://ddyrpqrnxtquthalgjqg.supabase.co', // Supabase project URL
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXJwcXJueHRxdXRoYWxnanFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMjkwODksImV4cCI6MjA2OTkwNTA4OX0._VcxFRIYl9UbddXTjdG6ZjoTsDbI5pbi_4M5E9seS6M', // Supabase anon key (safe for client-side)
    },
    api: {
        baseUrl: 'http://localhost:8000', // Backend API URL
    },
    app: {
        name: 'HR Management System',
        version: '1.0.0',
    }
};

// Make config globally available
window.APP_CONFIG = CONFIG;

// Export for module systems (if used)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
