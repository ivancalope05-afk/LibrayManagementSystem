// Admin-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check admin authentication
    if (window.location.pathname.includes('dashboard.html')) {
        checkAdminAuth();
    }
});

// Check admin authentication
async function checkAdminAuth() {
    try {
        const isAdmin = await requireAdmin('../index.html');
        if (isAdmin) {
            initializeAdminDashboard();
        }
    } catch (error) {
        console.error('Admin auth check failed:', error);
        window.location.href = '../index.html';
    }
}

// Initialize admin dashboard
function initializeAdminDashboard() {
    // Setup tab functionality
    setupTabs();
    
    // Load books for management
    loadAdminBooks();
    
    // Load borrowing records
    loadBorrowingRecords();
    
    // Setup book modal
    setupBookModal();
    
    // Display admin info
    displayAdminInfo();
}

// Display admin information
async function displayAdminInfo() {
    try {
        const user = await getCurrentUser();
        if (user && user.email) {
            // You can display admin name/email in the header if needed
            console.log('Admin logged in:', user.email);
        }
    } catch (error) {
        console.error('Error loading admin info:', error);
    }
}

// Setup tab functionality
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
            
            // Refresh data if needed
            if (tabId === 'borrowings') {
                loadBorrowingRecords();
            } else if (tabId === 'books') {
                loadAdminBooks();
            }
        });
    });
}

// Load books for admin management
async function loadAdminBooks() {
    try {
        showLoading('booksList');
        
        const { data: books, error } = await supabase
            .from('books')
            .select('*')
            .order('title');
        
        if (error) throw error;
        
        const booksList = document.getElementById('booksList');
        
        if (books && books.length > 0) {
            booksList.innerHTML = '';
            books.forEach(book => {
                const bookItem = createAdminBookItem(book);
                booksList.appendChild(bookItem);
            });
        } else {
            booksList.innerHTML = '<p class="no-data">No books in the library.</p>';
        }
        
    } catch (error) {
        console.error('Error loading books:', error);
        document.getElementById('booksList').innerHTML = '<p class="error">Error loading books. Please try again.</p>';
    }
}

// Create admin book item
function createAdminBookItem(book) {
    const bookItem = document.createElement('div');
    bookItem.className = 'admin-book-item';
    
    const imageUrl = book.image_url || `https://source.unsplash.com/random/300x400/?book,${encodeURIComponent(book.title)}`;
    
    bookItem.innerHTML = `
        <img src="${imageUrl}" alt="${book.title}" class="admin-book-image">
        <div class="book-details">
            <h3>${book.title}</h3>
            <p class="book-author">By ${book.author}</p>
            <span class="book-status status-${book.status.toLowerCase()}">${book.status}</span>
        </div>
        <div class="book-actions">
            <button class="btn btn-primary edit-btn" data-book-id="${book.id}">Edit</button>
            <button class="btn btn-danger delete-btn" data-book-id="${book.id}">Delete</button>
        </div>
    `;
    
    return bookItem;
}

// Load borrowing records
// Load borrowing records
// Load borrowing records with manual joins
async function loadBorrowingRecords() {
    try {
        showLoading('borrowingsList');
        
        console.log('Loading borrowing records with manual joins...');
        
        // First, get all borrowing records
        const { data: borrowings, error: borrowingsError } = await supabase
            .from('borrowed_books')
            .select('*')
            .order('borrow_date', { ascending: false });
        
        if (borrowingsError) {
            console.error('Error fetching borrowings:', borrowingsError);
            throw borrowingsError;
        }
        
        console.log('Raw borrowings data:', borrowings);
        
        if (!borrowings || borrowings.length === 0) {
            document.getElementById('borrowingsList').innerHTML = '<p class="no-data">No borrowing records found.</p>';
            return;
        }
        
        // Get unique user IDs and book IDs
        const userIds = [...new Set(borrowings.map(b => b.user_id))];
        const bookIds = [...new Set(borrowings.map(b => b.book_id))];
        
        console.log('User IDs to fetch:', userIds);
        console.log('Book IDs to fetch:', bookIds);
        
        // Fetch user emails
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email')
            .in('id', userIds);
        
        if (usersError) {
            console.error('Error fetching users:', usersError);
            // Continue without user data
        }
        
        console.log('Users data:', users);
        
        // Fetch book details
        const { data: books, error: booksError } = await supabase
            .from('books')
            .select('id, title, author')
            .in('id', bookIds);
        
        if (booksError) {
            console.error('Error fetching books:', booksError);
            // Continue without book data
        }
        
        console.log('Books data:', books);
        
        // Combine the data
        const borrowingsWithDetails = borrowings.map(borrowing => {
            const user = users?.find(u => u.id === borrowing.user_id);
            const book = books?.find(b => b.id === borrowing.book_id);
            
            return {
                ...borrowing,
                user_email: user?.email || 'Unknown User',
                book_title: book?.title || 'Unknown Book',
                book_author: book?.author || 'Unknown Author'
            };
        });
        
        console.log('Combined borrowings data:', borrowingsWithDetails);
        
        // Display the data
        const borrowingsList = document.getElementById('borrowingsList');
        borrowingsList.innerHTML = '';
        
        borrowingsWithDetails.forEach(borrowing => {
            const borrowingItem = createBorrowingItem(borrowing);
            borrowingsList.appendChild(borrowingItem);
        });
        
        console.log(`Successfully loaded ${borrowingsWithDetails.length} borrowing records`);
        
    } catch (error) {
        console.error('Error loading borrowing records:', error);
        document.getElementById('borrowingsList').innerHTML = 
            '<p class="error">Error loading borrowing records: ' + error.message + '</p>';
    }
}

// Create borrowing record item
// Create borrowing record item with new data structure
function createBorrowingItem(borrowing) {
    const borrowingItem = document.createElement('div');
    borrowingItem.className = 'borrowing-item';
    borrowingItem.style.padding = '20px';
    borrowingItem.style.marginBottom = '15px';
    borrowingItem.style.border = '1px solid #ddd';
    borrowingItem.style.borderRadius = '8px';
    borrowingItem.style.backgroundColor = 'white';
    
    borrowingItem.innerHTML = `
        <div class="borrowing-details">
            <h3 style="margin-bottom: 10px; color: #85120e;">${borrowing.book_title}</h3>
            <p class="book-author" style="margin-bottom: 15px; color: #666;">By ${borrowing.book_author}</p>
            <div class="borrowing-meta" style="display: grid; gap: 8px;">
                <p><strong>Student Email:</strong> ${borrowing.user_email}</p>
                <p><strong>Borrowed Date:</strong> ${formatDate(borrowing.borrow_date)}</p>
                <p><strong>Pickup Date:</strong> ${formatDate(borrowing.pickup_date)}</p>
                <p><strong>Receipt Number:</strong> <code>${borrowing.receipt_no}</code></p>
                <p><strong>Record ID:</strong> ${borrowing.id}</p>
            </div>
        </div>
    `;
    
    return borrowingItem;
}

// Setup book modal functionality
function setupBookModal() {
    // Add book button
    const addBookBtn = document.getElementById('addBookBtn');
    if (addBookBtn) {
        addBookBtn.addEventListener('click', () => {
            openBookModal();
        });
    }
    
    // Edit and delete buttons (event delegation)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const bookId = e.target.getAttribute('data-book-id');
            openBookModal(bookId);
        }
        
        if (e.target.classList.contains('delete-btn')) {
            const bookId = e.target.getAttribute('data-book-id');
            deleteBook(bookId);
        }
    });
    
    // Modal close functionality
    const modal = document.getElementById('bookModal');
    const closeBtn = document.querySelector('#bookModal .close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Book form submission
    const bookForm = document.getElementById('bookForm');
    if (bookForm) {
        bookForm.addEventListener('submit', handleBookSubmission);
    }
}

// Open book modal for adding or editing
async function openBookModal(bookId = null) {
    const modal = document.getElementById('bookModal');
    const modalTitle = document.getElementById('modalTitle');
    const bookForm = document.getElementById('bookForm');
    
    // Reset form
    bookForm.reset();
    document.getElementById('bookId').value = '';
    
    if (bookId) {
        // Edit mode
        modalTitle.textContent = 'Edit Book';
        
        try {
            const { data: book, error } = await supabase
                .from('books')
                .select('*')
                .eq('id', bookId)
                .single();
            
            if (error) throw error;
            
            // Populate form with book data
            document.getElementById('bookId').value = book.id;
            document.getElementById('title').value = book.title;
            document.getElementById('author').value = book.author;
            document.getElementById('image_url').value = book.image_url || '';
            
        } catch (error) {
            console.error('Error loading book for editing:', error);
            alert('Error loading book details. Please try again.');
            return;
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add New Book';
    }
    
    // Show modal
    modal.classList.add('active');
}

// Handle book form submission (add or edit)
async function handleBookSubmission(e) {
    e.preventDefault();
    
    const bookId = document.getElementById('bookId').value;
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const image_url = document.getElementById('image_url').value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.textContent = 'Saving...';
        submitBtn.disabled = true;
        
        if (bookId) {
            // Update existing book
            const { error } = await supabase
                .from('books')
                .update({
                    title,
                    author,
                    image_url: image_url || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', bookId);
            
            if (error) throw error;
        } else {
            // Add new book
            const { error } = await supabase
                .from('books')
                .insert([
                    {
                        title,
                        author,
                        image_url: image_url || null,
                        status: 'Available'
                    }
                ]);
            
            if (error) throw error;
        }
        
        // Close modal and refresh books list
        document.getElementById('bookModal').classList.remove('active');
        loadAdminBooks();
        
        // Show success message
        showNotification('Book saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving book:', error);
        alert('Error saving book. Please try again.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Delete book
async function deleteBook(bookId) {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Check if book is currently borrowed
        const { data: borrowing, error: borrowingError } = await supabase
            .from('borrowed_books')
            .select('id')
            .eq('book_id', bookId)
            .single();
        
        if (borrowing) {
            alert('Cannot delete book that is currently borrowed.');
            return;
        }
        
        // Delete book
        const { error } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId);
        
        if (error) throw error;
        
        // Refresh books list
        loadAdminBooks();
        
        // Show success message
        showNotification('Book deleted successfully!', 'success');
        
    } catch (error) {
        console.error('Error deleting book:', error);
        alert('Error deleting book. Please try again.');
    }
}

// Helper function to show loading state
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading">Loading...</div>';
    }
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
    // You can implement a toast notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
    alert(message); // Simple alert for now
}

// Helper function to format dates
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}