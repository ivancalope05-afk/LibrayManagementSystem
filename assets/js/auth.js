// Authentication functions
document.addEventListener('DOMContentLoaded', function() {
    // Wait for Supabase to initialize
    setTimeout(() => {
        checkAndRedirect();
    }, 100);
    
    // Form event listeners
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleStudentSignup);
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleStudentLogin);
    }
    
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Check if user is logged in and redirect to appropriate dashboard
// Check if user is logged in and redirect to appropriate dashboard
async function checkAndRedirect() {
    try {
        const session = await checkAuth();
        if (session) {
            const user = await getCurrentUser();
            const role = await getUserRole();
            
            console.log('User role:', role); // Debug log
            console.log('Current path:', window.location.pathname); // Debug log
            
            if (role === 'admin' && !window.location.pathname.includes('/admin/')) {
                // Fix the path - remove the extra /admin
                window.location.href = 'admin/dashboard.html';
            } else if (role === 'student' && !window.location.pathname.includes('/student/')) {
                window.location.href = 'student/dashboard.html';
            }
        }
    } catch (error) {
        console.error('Error in checkAndRedirect:', error);
    }
}

// Handle Student Signup
async function handleStudentSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const messageDiv = document.getElementById('message');
    
    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing up...';
        submitBtn.disabled = true;
        
        // Sign up the user with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    email: email
                }
            }
        });
        
        if (error) throw error;
        
        showMessage(messageDiv, 'Signup successful! Please check your email for verification.', 'success');
        document.getElementById('signupForm').reset();
        
        // Redirect to login after 5 seconds (give time for trigger to run)
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 5000);
        
    } catch (error) {
        console.error('Signup error:', error);
        showMessage(messageDiv, `Signup failed: ${error.message}`, 'error');
    } finally {
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Sign Up';
            submitBtn.disabled = false;
        }
    }
}

// Handle Student Login
async function handleStudentLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const messageDiv = document.getElementById('message');
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Check user role
        const role = await getUserRole();
        if (role === 'admin') {
            await supabase.auth.signOut();
            throw new Error('Please use admin login for admin accounts.');
        }
        
        showMessage(messageDiv, 'Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            window.location.href = 'student/dashboard.html';
        }, 1500);
        
    } catch (error) {
        showMessage(messageDiv, error.message, 'error');
    }
}

// Handle Admin Login
// Handle Admin Login
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const messageDiv = document.getElementById('message');
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Check if user has admin role
        const role = await getUserRole();
        if (role !== 'admin') {
            await supabase.auth.signOut();
            throw new Error('Access denied. Admin account required.');
        }
        
        showMessage(messageDiv, 'Admin login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            // Fix the redirect path
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        showMessage(messageDiv, error.message, 'error');
    }
}

// Handle Logout
async function handleLogout() {
    try {
        await supabase.auth.signOut();
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error logging out:', error);
        window.location.href = '../index.html';
    }
}

// Helper function to show messages
function showMessage(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}