// assets/js/config.js
const getSupabaseConfig = () => {
    // Use environment variables if available (Netlify)
    if (typeof process !== 'undefined' && process.env) {
        return {
            url: process.env.SUPABASE_URL || 'https://oyuuvsqqkdzbrkntmkyt.supabase.co',
            key: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dXV2c3Fxa2R6YnJrbnRta3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDEzNDQsImV4cCI6MjA3NzA3NzM0NH0.lz7lhuARXcMljy4so7pNJ6hkLca6MFhaCHqZreBeWls'
        };
    }
    
    // Default to your Supabase project
    return {
        url: 'https://oyuuvsqqkdzbrkntmkyt.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dXV2c3Fxa2R6YnJrbnRta3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDEzNDQsImV4cCI6MjA3NzA3NzM0NH0.lz7lhuARXcMljy4so7pNJ6hkLca6MFhaCHqZreBeWls'
    };
};

const config = getSupabaseConfig();