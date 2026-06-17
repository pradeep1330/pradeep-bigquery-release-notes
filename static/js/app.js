// JavaScript code for BigQuery Release Notes Broadcaster

document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let allUpdates = [];
    let activeFilter = 'all';
    let currentSort = 'newest';
    let selectedUpdate = null;
    const HASHTAGS = ' #BigQuery #GoogleCloud';

    // DOM Elements
    const timelineContainer = document.getElementById('timeline-container');
    const loadingSkeleton = document.getElementById('loading-skeleton');
    const emptyState = document.getElementById('empty-state');
    const btnRefresh = document.getElementById('btn-refresh');
    const spinnerIcon = document.getElementById('spinner-icon');
    const searchInput = document.getElementById('search-input');
    const btnSearchClear = document.getElementById('btn-search-clear');
    const sortSelect = document.getElementById('sort-select');
    const filterPillsContainer = document.getElementById('filter-pills-container');
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const btnResetFilters = document.getElementById('btn-reset-filters');
    const fetchStatusBar = document.getElementById('fetch-status-bar');
    const statusText = document.getElementById('status-text');

    // Stat Values
    const valTotal = document.getElementById('val-total');
    const valFeatures = document.getElementById('val-features');
    const valAnnouncements = document.getElementById('val-announcements');
    const valFixes = document.getElementById('val-fixes');

    // Tweet Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const tweetPreviewText = document.getElementById('tweet-preview-text');
    const btnAddTags = document.getElementById('btn-add-hashtags');
    const btnShortenTweet = document.getElementById('btn-shorten-tweet');
    const btnModalCancel = document.getElementById('btn-modal-cancel');
    const btnModalClose = document.getElementById('btn-modal-close');
    const btnModalTweet = document.getElementById('btn-modal-tweet');
    const tweetWarningMsg = document.getElementById('tweet-warning-msg');

    // Theme Setup
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        btnThemeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        btnThemeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

    // Toggle Theme Handler
    btnThemeToggle.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            btnThemeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            btnThemeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem('theme', 'dark');
        }
    });

    // Fetch Release Notes
    async function fetchReleaseNotes(forceRefresh = false) {
        setLoadingState(true);
        showStatusBar(true, forceRefresh ? 'Fetching live BigQuery release notes...' : 'Loading release notes...');
        
        try {
            const url = forceRefresh ? '/api/release-notes?refresh=true' : '/api/release-notes';
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.status === 'success' || result.status === 'fallback') {
                allUpdates = result.notes || [];
                calculateStats(allUpdates);
                renderTimeline();
                
                const timeString = result.last_fetched ? `(Last updated: ${result.last_fetched})` : '';
                showStatusBar(true, `Successfully loaded ${allUpdates.length} updates ${timeString}`);
                setTimeout(() => showStatusBar(false), 5000);
            } else {
                showErrorState(result.message || 'Failed to fetch release notes.');
            }
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showErrorState('Network error occurred while fetching release notes.');
        } finally {
            setLoadingState(false);
        }
    }

    // Set Loading UI state
    function setLoadingState(isLoading) {
        if (isLoading) {
            loadingSkeleton.style.display = 'block';
            timelineContainer.style.display = 'none';
            emptyState.style.display = 'none';
            btnRefresh.classList.add('loading');
            btnRefresh.disabled = true;
        } else {
            loadingSkeleton.style.display = 'none';
            btnRefresh.classList.remove('loading');
            btnRefresh.disabled = false;
        }
    }

    // Show status bar messages
    function showStatusBar(show, text = '') {
        if (show) {
            fetchStatusBar.style.display = 'block';
            statusText.textContent = text;
        } else {
            fetchStatusBar.style.display = 'none';
        }
    }

    // Show Error Alert
    function showErrorState(message) {
        showStatusBar(true, `Error: ${message}`);
        timelineContainer.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.querySelector('h3').textContent = 'Error Loading Feed';
        emptyState.querySelector('p').textContent = message;
    }

    // Calculate Dashboard Stats
    function calculateStats(updates) {
        const stats = {
            total: updates.length,
            features: 0,
            announcements: 0,
            fixes: 0
        };

        updates.forEach(update => {
            const type = update.type.toLowerCase();
            if (type.includes('feature')) {
                stats.features++;
            } else if (type.includes('announcement')) {
                stats.announcements++;
            } else if (type.includes('fix') || type.includes('issue')) {
                stats.fixes++;
            }
        });

        // Update UI counters with animation
        animateCounter(valTotal, stats.total);
        animateCounter(valFeatures, stats.features);
        animateCounter(valAnnouncements, stats.announcements);
        animateCounter(valFixes, stats.fixes);
    }

    // Animate Number Counter
    function animateCounter(element, targetValue) {
        let current = 0;
        const duration = 800; // ms
        const stepTime = Math.max(Math.floor(duration / (targetValue || 1)), 15);
        
        element.textContent = '0';
        if (targetValue === 0) return;

        const timer = setInterval(() => {
            current += Math.ceil(targetValue / 20);
            if (current >= targetValue) {
                element.textContent = targetValue;
                clearInterval(timer);
            } else {
                element.textContent = current;
            }
        }, stepTime);
    }

    // Filter type normalization
    function getNormalizedFilterGroup(type) {
        const t = type.toLowerCase();
        if (t.includes('feature')) return 'feature';
        if (t.includes('announcement')) return 'announcement';
        if (t.includes('fix')) return 'fix';
        if (t.includes('issue')) return 'issue';
        return 'other';
    }

    // Filter and Sort Updates
    function getFilteredUpdates() {
        let filtered = [...allUpdates];

        // Apply Category Pill Filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(update => {
                const group = getNormalizedFilterGroup(update.type);
                return group === activeFilter;
            });
        }

        // Apply Search Term Filter
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
            filtered = filtered.filter(update => {
                return (
                    update.type.toLowerCase().includes(query) ||
                    update.date.toLowerCase().includes(query) ||
                    update.text.toLowerCase().includes(query)
                );
            });
        }

        // Apply Sort Order (Newest or Oldest)
        filtered.sort((a, b) => {
            // Atom ISO timestamp is usually standard for comparison. Fallback to simple index if timestamps match.
            const timeA = new Date(a.updated || 0).getTime();
            const timeB = new Date(b.updated || 0).getTime();
            
            if (currentSort === 'newest') {
                return timeB - timeA;
            } else {
                return timeA - timeB;
            }
        });

        return filtered;
    }

    // Render Timeline Feed
    function renderTimeline() {
        const filtered = getFilteredUpdates();

        if (filtered.length === 0) {
            timelineContainer.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        timelineContainer.innerHTML = '';
        timelineContainer.style.display = 'block';

        // Group updates by date
        const groups = {};
        filtered.forEach(update => {
            if (!groups[update.date]) {
                groups[update.date] = [];
            }
            groups[update.date].push(update);
        });

        // The date keys ordered based on current sort direction
        const dates = Object.keys(groups).sort((a, b) => {
            // Take the updated timestamp of the first item in each group for sorting
            const timeA = new Date(groups[a][0].updated || 0).getTime();
            const timeB = new Date(groups[b][0].updated || 0).getTime();
            return currentSort === 'newest' ? timeB - timeA : timeA - timeB;
        });

        // Inject HTML
        dates.forEach(date => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'timeline-group';
            
            // Date node header
            groupDiv.innerHTML = `
                <div class="timeline-date-header">
                    <div class="timeline-dot"></div>
                    <h2 class="timeline-date-title">${date}</h2>
                </div>
                <div class="timeline-cards" id="cards-${date.replace(/\s+/g, '-')}"></div>
            `;
            
            timelineContainer.appendChild(groupDiv);
            const cardsContainer = groupDiv.querySelector('.timeline-cards');
            
            // Render each card inside this date
            groups[date].forEach(update => {
                const card = document.createElement('div');
                card.className = 'update-card card';
                card.dataset.id = update.id;
                
                const badgeClass = getBadgeClass(update.type);
                const badgeIcon = getBadgeIcon(update.type);
                
                card.innerHTML = `
                    <div class="card-header">
                        <span class="badge ${badgeClass}">
                            <i class="${badgeIcon}"></i> ${update.type}
                        </span>
                    </div>
                    <div class="card-body">
                        ${update.content}
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-secondary btn-share-tweet" data-id="${update.id}">
                            <i class="fa-brands fa-x-twitter"></i> Tweet Update
                        </button>
                    </div>
                `;
                
                cardsContainer.appendChild(card);
            });
        });

        // Bind event listeners to new share buttons
        document.querySelectorAll('.btn-share-tweet').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                openTweetComposer(id);
            });
        });
    }

    // Get Badge CSS Class based on release type
    function getBadgeClass(type) {
        const t = type.toLowerCase();
        if (t.includes('feature')) return 'badge-feature';
        if (t.includes('announcement')) return 'badge-announcement';
        if (t.includes('fix')) return 'badge-fix';
        if (t.includes('issue')) return 'badge-issue';
        if (t.includes('deprecat')) return 'badge-deprecated';
        return 'badge-general';
    }

    // Get FontAwesome Icon for Badge
    function getBadgeIcon(type) {
        const t = type.toLowerCase();
        if (t.includes('feature')) return 'fa-solid fa-wand-magic-sparkles';
        if (t.includes('announcement')) return 'fa-solid fa-bullhorn';
        if (t.includes('fix')) return 'fa-solid fa-screwdriver-wrench';
        if (t.includes('issue')) return 'fa-solid fa-circle-exclamation';
        if (t.includes('deprecat')) return 'fa-solid fa-ban';
        return 'fa-solid fa-circle-info';
    }

    // --- Tweet composer Logic ---
    
    function openTweetComposer(updateId) {
        selectedUpdate = allUpdates.find(u => u.id === updateId);
        if (!selectedUpdate) return;

        // Compose pre-filled tweet draft
        const datePrefix = `📢 Google BigQuery (${selectedUpdate.date})`;
        const typeStr = `[${selectedUpdate.type}]`;
        
        // Truncate plain text description so it fits Twitter character limits (280)
        // Fixed parts: prefix, type, spacing, hashtags
        const fixedLength = datePrefix.length + typeStr.length + HASHTAGS.length + 8; // spacing, newlines, etc.
        const maxDescLength = 280 - fixedLength;
        
        let descText = selectedUpdate.text;
        if (descText.length > maxDescLength) {
            descText = descText.slice(0, maxDescLength - 3).trim() + '...';
        }
        
        const prefilledText = `${datePrefix}\n${typeStr} ${descText}\n\n#BigQuery #GoogleCloud`;
        
        tweetTextarea.value = prefilledText;
        updateTweetPreview();
        
        // Show modal
        tweetModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Lock background scrolling
    }

    function closeTweetComposer() {
        tweetModal.style.display = 'none';
        document.body.style.overflow = ''; // Unlock scrolling
        selectedUpdate = null;
    }

    function updateTweetPreview() {
        const text = tweetTextarea.value;
        const count = text.length;
        
        charCounter.textContent = count;
        
        // Show warning if exceeding limits
        if (count > 280) {
            charCounter.classList.add('warning');
            tweetWarningMsg.style.display = 'inline-block';
            btnModalTweet.disabled = true;
        } else {
            charCounter.classList.remove('warning');
            tweetWarningMsg.style.display = 'none';
            btnModalTweet.disabled = false;
        }
        
        // Render preview mock text (handles line breaks correctly)
        tweetPreviewText.textContent = text;
    }

    // Auto-shorten the tweet to fit 280 character limit
    function handleAutoShorten() {
        if (!selectedUpdate) return;
        
        const datePrefix = `📢 Google BigQuery (${selectedUpdate.date})`;
        const typeStr = `[${selectedUpdate.type}]`;
        
        const text = tweetTextarea.value;
        if (text.length <= 280) return; // No need to shorten
        
        // Calculate max allowed size for the core description
        const fixedLength = datePrefix.length + typeStr.length + HASHTAGS.length + 8;
        const maxDescLength = 280 - fixedLength;
        
        let descText = selectedUpdate.text;
        if (descText.length > maxDescLength) {
            descText = descText.slice(0, maxDescLength - 3).trim() + '...';
        } else {
            // If the original description itself was short enough, but user added custom text, truncate description further
            descText = descText.slice(0, Math.max(30, maxDescLength - 20)).trim() + '...';
        }
        
        tweetTextarea.value = `${datePrefix}\n${typeStr} ${descText}\n\n#BigQuery #GoogleCloud`;
        updateTweetPreview();
    }

    // Toggle default tags
    function handleAddTags() {
        const text = tweetTextarea.value;
        if (!text.includes('#BigQuery')) {
            tweetTextarea.value = text.trim() + '\n\n#BigQuery #GoogleCloud';
        }
        updateTweetPreview();
    }

    // Action Tweet Draft
    function publishTweet() {
        const text = tweetTextarea.value;
        if (text.length > 280) return;
        
        // Encode and open Twitter web intent
        const encodedText = encodeURIComponent(text);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        closeTweetComposer();
    }

    // --- Event Listeners Bindings ---

    // Refresh Button Click
    btnRefresh.addEventListener('click', () => {
        fetchReleaseNotes(true);
    });

    // Reset Filters Button
    btnResetFilters.addEventListener('click', () => {
        searchInput.value = '';
        btnSearchClear.style.display = 'none';
        activeFilter = 'all';
        
        document.querySelectorAll('.filter-pills .pill').forEach(p => {
            p.classList.toggle('active', p.dataset.filter === 'all');
        });
        
        renderTimeline();
    });

    // Search Input Typing
    searchInput.addEventListener('input', () => {
        btnSearchClear.style.display = searchInput.value ? 'block' : 'none';
        renderTimeline();
    });

    // Clear Search Input
    btnSearchClear.addEventListener('click', () => {
        searchInput.value = '';
        btnSearchClear.style.display = 'none';
        renderTimeline();
        searchInput.focus();
    });

    // Sort Dropdown Change
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderTimeline();
    });

    // Filter Pills Clicks
    filterPillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;

        // Toggle Active
        document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        activeFilter = pill.dataset.filter;
        renderTimeline();
    });

    // Modal Events
    btnModalCancel.addEventListener('click', closeTweetComposer);
    btnModalClose.addEventListener('click', closeTweetComposer);
    tweetTextarea.addEventListener('input', updateTweetPreview);
    btnShortenTweet.addEventListener('click', handleAutoShorten);
    btnAddTags.addEventListener('click', handleAddTags);
    btnModalTweet.addEventListener('click', publishTweet);

    // Close Modal on clicking outside the modal content
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetComposer();
        }
    });

    // Close Modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetModal.style.display === 'flex') {
            closeTweetComposer();
        }
    });

    // Initialize Page
    fetchReleaseNotes(false);
});
