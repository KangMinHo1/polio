/**
 * posts.js
 * 피드백 목록 페이지의 모든 동적 기능을 담당합니다.
 */
document.addEventListener('DOMContentLoaded', async () => {
  await window.APP_INITIALIZATION;
  const app = window.CommunityApp;

  const pageState = {
    currentPage: 1,
    postsPerPage: 8,
    filteredPosts: [],
    currentCategory: 'all',
    likedPostIds: JSON.parse(localStorage.getItem('likedPostIds') || '[]'),
    sortBy: 'latest',
    filterTypes: ['feedback'],
    filterStatus: [], // 상태 필터 기능 제거
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

  /**
   * 페이지의 모든 동적 기능을 초기화하는 메인 함수.
   */
  async function initializePostsPage() {
    // ✅ [수정] 다른 비동기 작업보다 먼저 카테고리 필터 UI를 채웁니다.
    populateCategoryFilter(); //서버에서 가져온 게시글 카테고리를 받아와서 설정
    parseUrlParameters(); // URL 파라미터가 있다면 필터 상태보다 우선 적용
    initializeFilterUI();
    setupEventListeners();
    renderAll();

    function showPostFromHash() {
      // 상세 페이지가 분리되었으므로 hash를 이용한 미리보기 기능은 제거합니다.
      // 페이지 로딩 시 특정 게시글로 스크롤이 필요하다면 다른 방식으로 구현해야 합니다.
      // 예: URL 파라미터(?postId=123)를 읽고 해당 post-item으로 스크롤
      // 하지만 현재 요구사항은 페이지 이동이므로 이 함수는 비워둡니다.
    }
    showPostFromHash();
  }

  /**
   * URL의 쿼리 파라미터(예: ?category=질문)를 분석하여 페이지의 초기 필터 상태를 설정합니다.
   */
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

  /**
   * 필터 UI(정렬 드롭다운 등)의 초기 상태를 현재 페이지 상태(pageState)에 맞게 설정합니다.
   */
  function initializeFilterUI() {
      if (elements.sortSelect) elements.sortSelect.value = pageState.sortBy;
  }

  /**
   * 카테고리 필터, 정렬 드롭다운, 페이지네이션 버튼 등
   * 사용자와 상호작용하는 모든 요소에 이벤트 리스너를 설정합니다.
   */
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

  /**
   * 현재 필터 및 정렬 상태를 브라우저 URL의 쿼리 파라미터에 반영합니다.
   * 이를 통해 사용자는 필터링된 페이지를 북마크하거나 공유할 수 있습니다.
   */
  function updateUrl() {
      const params = new URLSearchParams();
      if (pageState.currentCategory !== 'all') params.set('category', pageState.currentCategory);
      if (pageState.sortBy !== 'latest') params.set('sort', pageState.sortBy);
      // Add other params like search term if needed

      // Only push state if params changed (simple check)
      const currentUrl = window.location.pathname + '?' + params.toString();
      if (window.location.href.split('#')[0] !== currentUrl) {
         history.pushState({}, '', currentUrl); // Use pushState to allow back button
      }
  }


  /**
   * 게시글 작성자 이름을 클릭했을 때 해당 사용자의 프로필 페이지로 이동시킵니다.
   */
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
  
  /**
   * 게시글 목록과 페이지네이션을 다시 렌더링하는 마스터 함수.
   */
  function renderAll() {
    updateFilteredPosts();
    renderPostList();
    renderPagination();
  }

  /**
   * 전역 상태(app.state.posts)의 게시글 목록을 현재 필터(카테고리, 검색어)와 정렬 순서에 맞게 가공하여 pageState.filteredPosts에 저장합니다.
   */
  function updateFilteredPosts() {
    const term = (pageState.currentSearchTerm || '').toLowerCase();

    const filtered = app.state.posts.filter((post) => {
      const categoryMatch = pageState.currentCategory === 'all' || post.category === pageState.currentCategory;

      const contentSearchMatch = (post.content || '').toLowerCase().includes(term);
      const searchTermMatch = !term || post.title.toLowerCase().includes(term) || contentSearchMatch;

      const authorMatch = !pageState.currentAuthor || post.author === pageState.currentAuthor;
      const typeMatch = true; 

      const statusMatch = true; 
      const tagMatch = true; 

      return categoryMatch && searchTermMatch && authorMatch && typeMatch && statusMatch;
    });

    
    // 이렇게 해야 'category'와 'categories' 속성이 다음 로직으로 전달됩니다.
    const enhancedPosts = filtered.map(post => {
        // ✅ [추가] 게시글 작성자의 역할(role) 정보를 전역 사용자 목록에서 찾아 추가합니다.
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

  /**
   * 필터링 및 정렬된 게시글 목록(pageState.filteredPosts)을 현재 페이지에 맞게 잘라내어 화면에 렌더링합니다.
   */
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

  /**
   * 단일 게시글 객체를 받아 목록에 표시될 HTML 문자열을 생성하여 반환합니다.
   */
  function createPostItemHTML(post) {
      const authorCategory = post.authorCategory || '사용자';
      const tag = ''; // 케이스 스터디 태그 제거
      const reactionHTML = `❤️ ${post.likes || 0}`;

      // ✅ [수정] 태그 표시 로직을 제거합니다.
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

  /**
   * (현재 사용되지 않음) 특정 게시글의 정보가 변경되었을 때, 전체 목록을 다시 렌더링하지 않고 해당 항목만 업데이트합니다.
   */
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
           // Update tags dynamically? Could be complex, maybe skip for list view update
      }
  }

  /**
   * 현재 페이지 번호와 전체 페이지 수를 계산하여 페이지네이션 UI(버튼 활성화 등)를 업데이트합니다.
   */
  function renderPagination() {
    const { currentPage, postsPerPage, filteredPosts } = pageState;
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));
    if (elements.pageInfo)
      elements.pageInfo.textContent = `${currentPage} / ${totalPages}`;
    if (elements.prevButton) elements.prevButton.disabled = currentPage <= 1;
    if (elements.nextButton)
      elements.nextButton.disabled = currentPage >= totalPages;
  }

  /**
   * '이전' 또는 '다음' 버튼 클릭 시 현재 페이지 번호를 변경하고 목록을 다시 렌더링합니다.
   */
  function changePage(direction) {
    pageState.currentPage += direction;
    renderAll();
  }

  /**
   * 서버에서 가져온 카테고리 목록(app.state.categories)을 사용하여 카테고리 필터 드롭다운 메뉴를 동적으로 채웁니다.
   */
  function populateCategoryFilter() {
    if (!elements.categoryFilter) return;
    while (elements.categoryFilter.options.length > 1) {
        elements.categoryFilter.remove(1);
    }
    (app.state.categories || []).forEach((category) => {
      elements.categoryFilter.add(new Option(category, category));
    });
    // 관리자 여부와 상관없이 모든 사용자가 '공지' 카테고리를 볼 수 있도록 수정합니다.
    // 서버에서 받은 카테고리 목록에 '공지'가 없을 경우에만 추가합니다.
    if (!app.state.categories.includes('공지')) {
        const noticeOption = new Option('공지', '공지');
        // '전체' 옵션 바로 다음에 '공지'를 추가합니다.
        elements.categoryFilter.add(noticeOption, 1); 
    }
  }

  // 데이터 로딩 경쟁 상태를 방지하기 위해 write.js와 동일한 방식으로 초기화합니다.
  // 데이터 로딩이 이 스크립트 실행보다 먼저 끝났을 경우를 대비하여, 이미 데이터가 있는지 확인합니다.
  if (app.state.categories && app.state.categories.length > 0) {
    initializePostsPage();
  } else {
    // 아직 데이터가 없다면, 데이터 로딩 완료 이벤트를 기다립니다.
    document.addEventListener('app-data-loaded', initializePostsPage, { once: true });
  }
});