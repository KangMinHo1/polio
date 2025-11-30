document.addEventListener('DOMContentLoaded', async () => {
  await window.APP_INITIALIZATION;
  const app = window.CommunityApp;

  const pageState = {
    currentPage: 1,
    postsPerPage: 8,
    filteredPosts: [],
    currentCategory: 'all',
    sortBy: 'latest',
  };

  const elements = {
    layout: document.getElementById('posts-layout'),
    postList: document.getElementById('post-list'),
    postPreview: document.getElementById('post-preview'),
    categoryFilter: document.getElementById('category-filter'),
    pageInfo: document.getElementById('page-info'),
    prevButton: document.getElementById('prev-page-button'),
    nextButton: document.getElementById('next-page-button'),
    sortSelect: document.getElementById('sort-by')
  };

  async function initializePostsPage() {
    populateCategoryFilter();
    parseUrlParameters();
    initializeFilterUI();
    setupEventListeners();
    renderAll();

    function showPostFromHash() {
    }
    showPostFromHash();
  }

  function parseUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    pageState.currentCategory = urlParams.get('category') || 'all';
    pageState.currentSearchTerm = urlParams.get('search') || '';
    pageState.currentAuthor = urlParams.get('author') || '';

    if (urlParams.has('sort')) {
        pageState.sortBy = urlParams.get('sort');
    }

    if (elements.categoryFilter) {
      elements.categoryFilter.value = pageState.currentCategory;
    }
  }

  function initializeFilterUI() {
      if (elements.sortSelect) elements.sortSelect.value = pageState.sortBy;
  }

  function setupEventListeners() {
    if (elements.categoryFilter)
      elements.categoryFilter.addEventListener('change', (e) => {
        pageState.currentCategory = e.target.value;
        pageState.currentPage = 1;
        renderAll(); updateUrl(); // URL 업데이트
      });

    if (elements.sortSelect)
      elements.sortSelect.addEventListener('change', (e) => {
        pageState.sortBy = e.target.value;
        pageState.currentPage = 1;
        renderAll(); updateUrl();
      });

    if (elements.prevButton) elements.prevButton.addEventListener('click', () => changePage(-1));
    if (elements.nextButton) elements.nextButton.addEventListener('click', () => changePage(1));
    if (elements.postList) {
      elements.postList.addEventListener('click', (e) => {
        const postItem = e.target.closest('.post-item');
        if (postItem) {
          const postId = postItem.dataset.postId;
          window.location.href = `post-detail.html?id=${postId}`;
        }
      });
    }
  }

  function updateUrl() {
      const params = new URLSearchParams();
      if (pageState.currentCategory !== 'all') params.set('category', pageState.currentCategory);
      if (pageState.sortBy !== 'latest') params.set('sort', pageState.sortBy);
      // Add other params like search term if needed

      // Only push state if params changed (simple check)
      const currentUrl = window.location.pathname + '?' + params.toString();
      if (window.location.href.split('#')[0] !== currentUrl) {
         history.pushState({}, '', currentUrl);
      }
  }


  function handleAuthorClick(e) {
    const authorId = e.target.dataset.authorId;
    if (!authorId) return;
    window.location.href = `profile.html?user=${encodeURIComponent(authorId)}`;
  }

  async function loadComments(post) { /* ... (이전과 동일) ... */ }
  async function handleCommentSubmit(e, post) { /* ... (이전과 동일) ... */ }
  async function handleLikeClick(postId) { /* ... (이전과 동일) ... */ }
  async function handleInsightPostClick(postId) { /* ... (이전과 동일) ... */ }
  async function handleBookmarkClick(postId) { /* ... (이전과 동일) ... */ }
  async function handleInsightCommentClick(post, commentIdStr) { /* ... (이전과 동일) ... */ }
  async function handleUpvoteClick(post, commentIdStr) { /* ... (이전과 동일) ... */ }
  async function handleSelectBestClick(post, commentIdStr) { /* ... (이전과 동일) ... */ }
  async function handleMarkAsResolved(postId) { /* ... (이전과 동일) ... */ }
  
  function renderAll() {
    updateFilteredPosts();
    renderPostList();
    renderPagination();
  }

  function updateFilteredPosts() {
    const term = (pageState.currentSearchTerm || '').toLowerCase();

    const filtered = app.state.posts.filter((post) => {
      const categoryMatch = pageState.currentCategory === 'all' || post.category === pageState.currentCategory;

      const contentSearchMatch = (post.content || '').toLowerCase().includes(term);
      const searchTermMatch = !term || post.title.toLowerCase().includes(term) || contentSearchMatch;

      const authorMatch = !pageState.currentAuthor || post.author === pageState.currentAuthor; 

      const tagMatch = true; 

      return categoryMatch && searchTermMatch && authorMatch;
    });

    
    const enhancedPosts = filtered.map(post => {
        const authorInfo = app.state.users.find(u => u.name === post.author);
        const authorCategory = authorInfo ? authorInfo.role : '사용자';
        const popularity = (post.likes || 0) + (post.insights || []).length;
        return { ...post, authorCategory, popularity };
    });

    enhancedPosts.sort((a, b) => {
      switch (pageState.sortBy) {
        case 'popular': return b.popularity - a.popularity;
        case 'comments': return b.commentCount - a.commentCount;
        case 'latest': default:
          if (a.isImportant && !b.isImportant) return -1;
          if (!a.isImportant && b.isImportant) return 1;
          return b.createdAt - a.createdAt;
      }
    });
    pageState.filteredPosts = enhancedPosts;
  }

  function renderPostList() {
    const { currentPage, postsPerPage, filteredPosts } = pageState;
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
    pageState.currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (pageState.currentPage - 1) * postsPerPage;
    const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);
    if (elements.postList) {
      if (paginatedPosts.length === 0) {
        elements.postList.innerHTML = '<li class="post-item" style="text-align: center; color: var(--text-secondary); padding: 2rem;">선택한 조건에 맞는 게시글이 없습니다.</li>';
      } else {
        elements.postList.innerHTML = paginatedPosts.map(post => createPostItemHTML(post)).join('');
      }
    }
  }

  function createPostItemHTML(post) {
      const authorCategory = post.authorCategory || '사용자';
      const tag = '';
      const reactionHTML = `❤️ ${post.likes || 0}`;

      return `
        <li class="post-item" data-post-id="${post.id}">
          <div class="post-item-title">${tag}[${post.category}] ${post.title}</div>
          <div class="post-item-meta">
            <span>(${authorCategory}) ${post.author}</span> •
            <span>${app.utils.formatDate(post.createdAt)}</span> •
            <span>조회 ${post.views || 0}</span> •
            <span>${reactionHTML}</span> •
            <span>💬 ${post.commentCount || 0}</span>
          </div>
           </li>
      `;
  }

  function updatePostItemInList(post) {
      const item = document.querySelector(`.post-item[data-post-id="${post.id}"]`);
      if(item) {
          const viewsEl = item.querySelector('.post-item-meta span:nth-child(3)');
          const reactionEl = item.querySelector('.post-item-meta span:nth-child(4)');
          const commentEl = item.querySelector('.post-item-meta span:nth-child(5)');          
          if(viewsEl) viewsEl.textContent = `조회 ${post.views || 0}`;
          if(reactionEl) reactionEl.textContent = `❤️ ${post.likes || 0}`;
          if (commentEl && typeof post.commentCount !== 'undefined') {
              commentEl.textContent = `💬 ${post.commentCount}`;
          }
      }
  }

  function renderPagination() {
    const { currentPage, postsPerPage, filteredPosts } = pageState;
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
    if (elements.pageInfo)
      elements.pageInfo.textContent = `${currentPage} / ${totalPages}`;
    if (elements.prevButton) elements.prevButton.disabled = currentPage <= 1;
    if (elements.nextButton)
      elements.nextButton.disabled = currentPage >= totalPages;
  }

  function changePage(direction) {
    pageState.currentPage += direction;
    renderAll();
  }

  function populateCategoryFilter() {
    if (!elements.categoryFilter) return;
    while (elements.categoryFilter.options.length > 1) {
        elements.categoryFilter.remove(1);
    }
    (app.state.categories || []).forEach((category) => {
      elements.categoryFilter.add(new Option(category, category));
    });
    if (!app.state.categories.includes('공지')) {
        const noticeOption = new Option('공지', '공지');
        elements.categoryFilter.add(noticeOption, 1); 
    }
  }
  if (app.state.categories && app.state.categories.length > 0) {
    initializePostsPage();
  } else {
    document.addEventListener('app-data-loaded', initializePostsPage, { once: true });
  }
});