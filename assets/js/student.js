// Student-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('signup.html') &&
        !window.location.pathname.includes('index.html')) {
        checkAuthentication();
    }
    
    // Load dashboard data if on dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboardData();
    }
    
    // Load books if on books page
    if (window.location.pathname.includes('books.html')) {
        loadBooks();
        setupBookBorrowing();
    }
});

// Check authentication and redirect if needed
async function checkAuthentication() {
    try {
        const authenticated = await requireAuth('../index.html');
        if (authenticated) {
            const user = await getCurrentUser();
            if (isAdmin(user)) {
                window.location.href = '../admin/dashboard.html';
            }
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        window.location.href = '../index.html';
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const user = await getCurrentUser();
        
        // Display user name (from email)
        const userName = user.email.split('@')[0];
        document.getElementById('studentName').textContent = userName;
        
        // Get book counts
        const { data: availableBooks, error: availableError } = await supabase
            .from('books')
            .select('id', { count: 'exact' })
            .eq('status', 'Available');
        
        if (!availableError) {
            document.getElementById('availableCount').textContent = availableBooks.length;
        }
        
        // Get user's borrowed books count
        const { data: borrowedBooks, error: borrowedError } = await supabase
            .from('borrowed_books')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id);
        
        if (!borrowedError) {
            document.getElementById('borrowedCount').textContent = borrowedBooks.length;
        }
        
        // Load recent borrowings
        loadRecentBorrowings();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load recent borrowings for dashboard
async function loadRecentBorrowings() {
    try {
        const user = await getCurrentUser();
        
        const { data: borrowings, error } = await supabase
            .from('borrowed_books')
            .select(`
                id,
                borrow_date,
                pickup_date,
                receipt_no,
                books (
                    title,
                    author
                )
            `)
            .eq('user_id', user.id)
            .order('borrow_date', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        const activityList = document.getElementById('recentBorrowings');
        
        if (borrowings && borrowings.length > 0) {
            activityList.innerHTML = '';
            
            borrowings.forEach(borrowing => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                
                const book = borrowing.books;
                activityItem.innerHTML = `
                    <h4>${book.title}</h4>
                    <p>By ${book.author}</p>
                    <p><small>Borrowed: ${formatDate(borrowing.borrow_date)} | Pickup: ${formatDate(borrowing.pickup_date)}</small></p>
                `;
                
                activityList.appendChild(activityItem);
            });
        } else {
            activityList.innerHTML = '<p>No recent borrowings.</p>';
        }
        
    } catch (error) {
        console.error('Error loading recent borrowings:', error);
    }
}

// In assets/js/student.js - update the loadBooks function:
async function loadBooks(searchTerm = '') {
    try {
        console.log('Loading books...');
        
        if (!supabase) {
            throw new Error('Supabase client not available');
        }
        
        let query = supabase
            .from('books')
            .select('*')
            .order('title');
        
        if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`);
        }
        
        const { data: books, error } = await query;
        
        console.log('Books query result:', { books, error });
        
        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }
        
        const booksGrid = document.getElementById('booksGrid');
        if (!booksGrid) {
            console.error('Books grid element not found');
            return;
        }
        
        booksGrid.innerHTML = '';
        
        if (books && books.length > 0) {
            console.log(`Displaying ${books.length} books`);
            books.forEach(book => {
                const bookCard = createBookCard(book);
                booksGrid.appendChild(bookCard);
            });
        } else {
            console.log('No books found');
            booksGrid.innerHTML = '<p class="no-data">No books found in the library.</p>';
        }
        
    } catch (error) {
        console.error('Error loading books:', error);
        const booksGrid = document.getElementById('booksGrid');
        if (booksGrid) {
            booksGrid.innerHTML = `
                <div class="error-message">
                    <p>Error loading books. Please check:</p>
                    <ul>
                        <li>Internet connection</li>
                        <li>Browser console for details</li>
                        <li>Try refreshing the page</li>
                    </ul>
                    <p>Error details: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Create book card element
function createBookCard(book) {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    
    const imageUrl = book.image_url || `https://source.unsplash.com/random/300x400/?book,${encodeURIComponent(book.title)}`;
    
    bookCard.innerHTML = `
        <img src="${imageUrl}" alt="${book.title}" class="book-image">
        <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <p class="book-author">By ${book.author}</p>
            <span class="book-status status-${book.status.toLowerCase()}">${book.status}</span>
            ${book.status === 'Available' ? 
                `<button class="btn btn-primary borrow-btn" data-book-id="${book.id}">Borrow</button>` : 
                `<button class="btn btn-secondary" disabled>Unavailable</button>`
            }
        </div>
    `;
    
    return bookCard;
}

// Setup book borrowing functionality
function setupBookBorrowing() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            loadBooks(searchInput.value);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadBooks(searchInput.value);
            }
        });
    }
    
    // Borrow button event delegation
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('borrow-btn')) {
            const bookId = e.target.getAttribute('data-book-id');
            await openBorrowModal(bookId);
        }
    });
    
    // Modal close functionality
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modals.forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Borrow form submission
    const borrowForm = document.getElementById('borrowForm');
    if (borrowForm) {
        borrowForm.addEventListener('submit', handleBorrowSubmission);
    }
    
    // Print receipt button
    const printReceiptBtn = document.getElementById('printReceipt');
    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', printReceipt);
    }
}

// Open borrow modal with book details
async function openBorrowModal(bookId) {
    try {
        const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();
        
        if (error) throw error;
        
        const bookDetails = document.getElementById('bookDetails');
        const imageUrl = book.image_url || `https://source.unsplash.com/random/300x400/?book,${encodeURIComponent(book.title)}`;
        
        bookDetails.innerHTML = `
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <img src="${imageUrl}" alt="${book.title}" style="width: 80px; height: 100px; object-fit: cover; border-radius: 4px;">
                <div>
                    <h3>${book.title}</h3>
                    <p>By ${book.author}</p>
                </div>
            </div>
        `;
        
        // Set minimum pickup date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];
        
        document.getElementById('pickupDate').min = minDate;
        document.getElementById('pickupDate').value = minDate;
        
        // Store book ID in form for submission
        document.getElementById('borrowForm').setAttribute('data-book-id', bookId);
        
        // Show modal
        document.getElementById('borrowModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading book details:', error);
        alert('Error loading book details. Please try again.');
    }
}

// Handle borrow form submission
async function handleBorrowSubmission(e) {
    e.preventDefault();
    
    const bookId = document.getElementById('borrowForm').getAttribute('data-book-id');
    const pickupDate = document.getElementById('pickupDate').value;
    
    try {
        const user = await getCurrentUser();
        
        // Get book info
        const { data: bookData, error: bookError } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();
        
        if (bookError) throw bookError;
        
        // Generate receipt number
        const receiptNo = `BRW-${Date.now()}`;
        
        // Create borrowing record
        const { data: borrowingData, error: borrowingError } = await supabase
            .from('borrowed_books')
            .insert([
                {
                    user_id: user.id,
                    book_id: parseInt(bookId),
                    borrow_date: new Date().toISOString().split('T')[0],
                    pickup_date: pickupDate,
                    receipt_no: receiptNo
                }
            ])
            .select()
            .single();
        
        if (borrowingError) throw borrowingError;
        
        // Update book status to "Borrowed"
        const { error: updateError } = await supabase
            .from('books')
            .update({ status: 'Borrowed' })
            .eq('id', bookId);
        
        if (updateError) throw updateError;
        
        // Close borrow modal
        document.getElementById('borrowModal').classList.remove('active');
        
        // Show receipt
        showReceipt({
            studentName: user.email.split('@')[0],
            bookTitle: bookData.title,
            borrowDate: new Date().toISOString().split('T')[0],
            pickupDate: pickupDate,
            receiptNo: receiptNo
        });
        
        // Reload books to reflect status change
        loadBooks();
        
    } catch (error) {
        console.error('Error borrowing book:', error);
        alert('Error borrowing book. Please try again.');
    }
}

// Show receipt after successful borrowing
function showReceipt(borrowingDetails) {
    const receiptDetails = document.getElementById('receiptDetails');
    
    receiptDetails.innerHTML = `
        <div class="receipt-detail">
            <span>Student:</span>
            <span>${borrowingDetails.studentName}</span>
        </div>
        <div class="receipt-detail">
            <span>Book:</span>
            <span>"${borrowingDetails.bookTitle}"</span>
        </div>
        <div class="receipt-detail">
            <span>Borrow Date:</span>
            <span>${formatDate(borrowingDetails.borrowDate)}</span>
        </div>
        <div class="receipt-detail">
            <span>Pickup Date:</span>
            <span>${formatDate(borrowingDetails.pickupDate)}</span>
        </div>
        <div class="receipt-detail">
            <span>Receipt No:</span>
            <span>${borrowingDetails.receiptNo}</span>
        </div>
    `;
    
    document.getElementById('receiptModal').classList.add('active');
}

// Print receipt
function printReceipt() {
    const receiptContent = document.querySelector('.receipt-content').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h2 style="text-align: center; color: #85120e;">📚 Borrow Receipt</h2>
            ${receiptContent}
        </div>
    `;
    
    window.print();
    
    document.body.innerHTML = originalContent;
    window.location.reload();
}

// Helper function to format dates
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}