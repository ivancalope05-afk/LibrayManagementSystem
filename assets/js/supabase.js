// Supabase configuration
const SUPABASE_URL = 'https://oyuuvsqqkdzbrkntmkyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dXV2c3Fxa2R6YnJrbnRta3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDEzNDQsImV4cCI6MjA3NzA3NzM0NH0.lz7lhuARXcMljy4so7pNJ6hkLca6MFhaCHqZreBeWls';

// Initialize Supabase client with error handling
let supabase;

try {
    if (typeof window !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        console.log('Supabase client initialized successfully');
    } else {
        console.error('Supabase CDN not loaded');
        throw new Error('Supabase not available');
    }
} catch (error) {
    console.error('Error initializing Supabase:', error);
}

// Helper function to check if Supabase is available
function isSupabaseAvailable() {
    return !!supabase;
}

// Enhanced helper functions with better error handling
async function checkAuth() {
    if (!isSupabaseAvailable()) {
        console.error('Supabase not available');
        return null;
    }
    
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Auth session error:', error);
            return null;
        }
        return session;
    } catch (error) {
        console.error('Error checking auth:', error);
        return null;
    }
}

async function getCurrentUser() {
    if (!isSupabaseAvailable()) {
        console.error('Supabase not available');
        return null;
    }
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Get user error:', error);
            return null;
        }
        return user;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

// Rest of your existing functions...
// [Keep all your existing helper functions but add error handling]

// Helper functions
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function getUserRole() {
    const user = await getCurrentUser();
    if (!user) return null;
    
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    
    if (error) {
        console.error('Error getting user role:', error);
        return 'student'; // Default to student if error
    }
    
    return data?.role || 'student';
}

function isAdmin(user) {
    return user && user.email && user.email.endsWith('@admin.library');
}

async function requireAuth(redirectUrl = 'index.html') {
    const session = await checkAuth();
    if (!session) {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}

async function requireAdmin(redirectUrl = 'index.html') {
    const user = await getCurrentUser();
    const role = await getUserRole();
    
    if (!user || role !== 'admin') {
        window.location.href = redirectUrl;
        return false;
    }
    return true;
}