/**
 * posts.js
 * 피드백 목록 페이지의 모든 동적 기능을 담당합니다.
 */
document.addEventListener('DOMContentLoaded', async () => {
  await window.APP_INITIALIZATION;
  const app = window.CommunityApp;

  let allComments = [];

  const pageState = {
    currentPage: 1,
    postsPerPage: 8,
    filteredPosts: [],
    currentCategory: 'all',
    likedPostIds: JSON.parse(localStorage.getItem('likedPostIds') || '[]'),
    sortBy: 'latest',
    filterTypes: ['feedback', 'casestudy'],
    filterStatus: ['ongoing', 'resolved', 'hired'],
    filterTags: ['코드 구조', '디자인', 'UX/UI', '프로젝트 설명', '기술 스택', '전반적 흐름'] // 초기값: 모두 선택
  };

  const elements = {
    layout: document.getElementById('posts-layout'),
    postList: document.getElementById('post-list'),
    postPreview: document.getElementById('post-preview'),
    categoryFilter: document.getElementById('category-filter'),
    pageInfo: document.getElementById('page-info'),
    prevButton: document.getElementById('prev-page-button'),
    nextButton: document.getElementById('next-page-button'),
    sortSelect: document.getElementById('sort-by'),
    typeCheckboxes: document.querySelectorAll('input[name="filter-type"]'),
    statusCheckboxes: document.querySelectorAll('input[name="filter-status"]'),
    tagsCheckboxes: document.querySelectorAll('input[name="filter-tag"]')
  };

  async function initializePostsPage() {
    allComments = await app.api.fetchAllComments();
    populateCategoryFilter();
    parseUrlParameters(); // URL 파라미터가 있다면 필터 상태보다 우선 적용
    // Initialize filter UI based on pageState before setting up listeners
    initializeFilterUI();
    setupEventListeners();
    renderAll();

    function showPostFromHash() {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#post-')) {
        const postId = parseInt(hash.substring(6), 10);
        if (!isNaN(postId)) {
          const postExists = app.state.posts.some(p => p.id === postId);
          if (postExists) {
             updateFilteredPosts();
             const postIndex = pageState.filteredPosts.findIndex((p) => p.id === postId);
             if (postIndex !== -1) {
                const targetPage = Math.floor(postIndex / pageState.postsPerPage) + 1;
                pageState.currentPage = targetPage;
                renderAll();
             } else { history.replaceState(null, null, ' '); }
             showPostPreview(postId);
          } else {
             history.replaceState(null, null, ' ');
             if(elements.postPreview) elements.postPreview.innerHTML = '<p>해당 게시글을 찾을 수 없습니다.</p>';
          }
        }
      }
    }
    showPostFromHash();
  }

  function parseUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    pageState.currentCategory = urlParams.get('category') || 'all';
    pageState.currentSearchTerm = urlParams.get('search') || '';
    pageState.currentAuthor = urlParams.get('author') || '';

    // URL 파라미터로 필터 상태 덮어쓰기 (예: ?filter-type=casestudy)
    if (urlParams.has('filter-type')) {
        pageState.filterTypes = urlParams.getAll('filter-type');
    }
    if (urlParams.has('filter-status')) {
        pageState.filterStatus = urlParams.getAll('filter-status');
    }
    if (urlParams.has('filter-tag')) {
        pageState.filterTags = urlParams.getAll('filter-tag');
    }
    if (urlParams.has('sort')) {
        pageState.sortBy = urlParams.get('sort');
    }

    if (elements.categoryFilter) {
      elements.categoryFilter.value = pageState.currentCategory;
    }
  }

  // 필터 UI 초기 상태 설정
  function initializeFilterUI() {
      if (elements.sortSelect) elements.sortSelect.value = pageState.sortBy;
      elements.typeCheckboxes.forEach(cb => cb.checked = pageState.filterTypes.includes(cb.value));
      elements.statusCheckboxes.forEach(cb => cb.checked = pageState.filterStatus.includes(cb.value));
      elements.tagsCheckboxes.forEach(cb => cb.checked = pageState.filterTags.includes(cb.value));
  }

  // 모든 필터/정렬에 대한 이벤트 리스너 추가
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

    elements.typeCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        pageState.filterTypes = Array.from(elements.typeCheckboxes)
          .filter(cb => cb.checked).map(cb => cb.value);
        pageState.currentPage = 1;
        renderAll(); updateUrl();
      });
    });

    elements.statusCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        pageState.filterStatus = Array.from(elements.statusCheckboxes)
          .filter(cb => cb.checked).map(cb => cb.value);
        pageState.currentPage = 1;
        renderAll(); updateUrl();
      });
    });

    elements.tagsCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
          pageState.filterTags = Array.from(elements.tagsCheckboxes)
            .filter(cb => cb.checked).map(cb => cb.value);
          pageState.currentPage = 1;
          renderAll(); updateUrl();
      });
    });

    if (elements.prevButton) elements.prevButton.addEventListener('click', () => changePage(-1));
    if (elements.nextButton) elements.nextButton.addEventListener('click', () => changePage(1));
    if (elements.postList) {
      elements.postList.addEventListener('click', (e) => {
        const postItem = e.target.closest('.post-item');
        if (postItem) { showPostPreview(parseInt(postItem.dataset.postId, 10)); }
      });
    }
  }

  // URL 업데이트 함수
  function updateUrl() {
      const params = new URLSearchParams();
      if (pageState.currentCategory !== 'all') params.set('category', pageState.currentCategory);
      if (pageState.sortBy !== 'latest') params.set('sort', pageState.sortBy);
      pageState.filterTypes.forEach(type => params.append('filter-type', type));
      pageState.filterStatus.forEach(status => params.append('filter-status', status));
      pageState.filterTags.forEach(tag => params.append('filter-tag', tag));
      // Add other params like search term if needed

      // Only push state if params changed (simple check)
      const currentUrl = window.location.pathname + '?' + params.toString();
      if (window.location.href.split('#')[0] !== currentUrl) {
         history.pushState({}, '', currentUrl); // Use pushState to allow back button
      }
  }


  function handleAuthorClick(e) {
    const authorId = e.target.dataset.authorId;
    if (!authorId) return;
    window.location.href = `profile.html?user=${encodeURIComponent(authorId)}`;
  }

  async function showPostPreview(postId) {
    const post = app.state.posts.find((p) => p.id === postId);
    if (!post || !elements.postPreview) return;

    const postType = post.postType || 'feedback';
    const authorCategory = post.authorCategory || '사용자';
    const currentUser = app.state.user;

    // Increment views only when showing preview
    if (!elements.layout.classList.contains('is-detail-view') ||
        (elements.layout.classList.contains('is-detail-view') &&
         !document.querySelector(`.post-item[data-post-id="${postId}"]`)?.classList.contains('is-active')))
    {
        post.views = (post.views || 0) + 1;
        updatePostItemInList(post);
        app.api.updatePost(postId, { views: post.views });
    }

    elements.layout.classList.add('is-detail-view');
    document.querySelectorAll('.post-item').forEach((item) => {
      item.classList.remove('is-active');
    });
    const currentPostItem = document.querySelector(`.post-item[data-post-id="${postId}"]`);
    if (currentPostItem) {
      currentPostItem.classList.add('is-active');
      currentPostItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    let portfolioLinkHTML = '';
    if (post.portfolioLink) {
        portfolioLinkHTML = `<a href="${post.portfolioLink.startsWith('http') ? post.portfolioLink : 'http://' + post.portfolioLink}" class="btn btn--primary" target="_blank" rel="noopener noreferrer" style="margin-bottom: 1.5rem; display: inline-block;">🔗 포트폴리오/이력서 보러가기</a>`;
    }
    let fileAttachmentHTML = '';
    if (post.file && post.file.name && post.file.content) {
      fileAttachmentHTML = `<div class="post-attachment"><div class="post-attachment-title">📎 첨부파일</div><a href="${post.file.content}" download="${post.file.name}" class="post-attachment-link">${post.file.name} 다운로드</a></div>`;
    }
    const authorHTML = `<span class="post-author-link" data-author-id="${post.author}" title="클릭해서 프로필 보기">(${authorCategory}) ${post.author}</span>`;

    let resolvedHTML = '';
    const isPostAuthor = currentUser && currentUser.id === post.author;

    if (postType === 'feedback') {
        if (post.isHiredSuccess) { resolvedHTML = `<div class="post-hired-badge">🎉 취업 성공 사례</div>`; }
        else if (post.isResolved) { resolvedHTML = `<div class="post-resolved-badge">✅ 피드백이 해결된 요청입니다.</div>`; }
        else if (isPostAuthor) {
            const editButtonHTML = `<a href="write.html?edit=${post.id}" class="btn btn--ghost" style="margin-right: 0.5rem;">✏️ 수정하기</a>`;
            resolvedHTML = `<div class="post-actions" style="margin-bottom: 1.5rem;">${editButtonHTML}<button id="mark-resolved-btn" class="btn btn--success" data-post-id="${post.id}">✅ 피드백 완료 (해결됨으로 표시)</button></div>`;
        }
    }

    let postActionsHTML = '';
    let bookmarkButtonHTML = '';
    if (currentUser) {
        const isBookmarked = post.bookmarkedBy && post.bookmarkedBy.includes(currentUser.id);
        bookmarkButtonHTML = `<button id="btn-bookmark" class="btn btn--ghost btn-bookmark ${isBookmarked ? 'is-active' : ''}" data-post-id="${post.id}">${isBookmarked ? '📌 스크랩 취소' : '📌 스크랩하기'}</button>`;
    }
    if (postType === 'casestudy') {
        const hasInsight = currentUser && post.insights && post.insights.includes(currentUser.id);
        postActionsHTML = `<button id="btn-insight-post" class="btn btn--ghost btn-insight ${hasInsight ? 'is-active' : ''}" data-post-id="${post.id}" ${!currentUser ? 'disabled' : ''}>💡 인사이트+ (${(post.insights || []).length})</button>`;
    } else {
        const hasLiked = pageState.likedPostIds.includes(postId);
        postActionsHTML = `<button id="like-button-${post.id}" class="btn ${hasLiked ? 'btn--primary' : ''}">❤️ 좋아요 (${post.likes || 0})</button>`;
    }

    // 본문 렌더링 로직 (JSON 파싱)
    let contentHTML = '';
    let feedbackTagsHTML = '';

    if (postType === 'feedback') {
        try {
            const data = JSON.parse(post.content);
            const escapeHTML = (str) => (str || '').replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');

            if (data.projects && Array.isArray(data.projects)) {
                contentHTML += data.projects.map((project, index) => {
                    let projectHTML = `<h3 class="template-header">프로젝트 ${index + 1}: ${escapeHTML(project.title)}</h3>`;
                    if(project.link) projectHTML += `<p class="template-field"><strong>링크:</strong> <a href="${project.link.startsWith('http') ? project.link : 'http://' + project.link}" target="_blank" rel="noopener noreferrer">${escapeHTML(project.link)}</a></p>`;
                    if(project.techStack) projectHTML += `<p class="template-field"><strong>기술 스택:</strong> ${escapeHTML(project.techStack)}</p>`;
                    if(project.desc) projectHTML += `<div class="template-content-box">${escapeHTML(project.desc)}</div>`;
                    return projectHTML;
                }).join('');
            }

            if(data.questions) {
                 contentHTML += `<h3 class="template-header">가장 피드백 받고 싶은 점</h3>`;
                 contentHTML += `<div class="template-content-box is-question">${escapeHTML(data.questions)}</div>`;
            }

            // 피드백 요청 태그 렌더링
            if (data.feedbackTags && data.feedbackTags.length > 0) {
                feedbackTagsHTML = `
                  <h3 class="template-header" style="margin-top: 2rem;">주요 요청 분야</h3>
                  <div class="post-tags">
                    ${data.feedbackTags.map(tag => `<span class="post-tag">#${escapeHTML(tag)}</span>`).join('')}
                  </div>
                `;
            }

            if (contentHTML.trim() === '') { throw new Error('Fallback to old data'); }
        } catch (e) { contentHTML = post.content.replace(/\n/g, '<br>'); }
    } else { contentHTML = post.content.replace(/\n/g, '<br>'); }


    elements.postPreview.innerHTML = `
        <h1>${post.title}</h1>
        <div class="post-meta">
            <span>[${post.category}]</span>
            <span>작성자: ${authorHTML}</span>
            <span>${app.utils.formatDate(post.createdAt)}</span>
        </div>
        ${resolvedHTML}
        ${portfolioLinkHTML}
        ${fileAttachmentHTML}
        <div class="post-content">
            ${contentHTML}
            ${feedbackTagsHTML} </div>
        <div class="post-actions">
            ${postActionsHTML}
            ${bookmarkButtonHTML}
        </div>
        <div class="comment-section">
          <h3 class="comment-title">💬 ${postType === 'casestudy' ? '토론' : '피드백'}</h3>
          <form id="comment-form" class="comment-form">
            <textarea id="comment-content" rows="3" placeholder="${currentUser ? (postType === 'casestudy' ? '의견을 남겨주세요...' : '피드백을 남겨주세요... (예: @admin)') : '로그인 후 댓글을 남길 수 있습니다.'}" ${!currentUser ? 'disabled' : ''}></textarea>
            <div class="comment-form-actions">
              <button type="submit" class="btn btn--primary" ${!currentUser ? 'disabled' : ''}>${postType === 'casestudy' ? '의견 등록' : '피드백 등록'}</button>
            </div>
          </form>
          <ul id="comment-list" class="comment-list"><li>댓글 로딩 중...</li></ul>
        </div>
    `;

    // --- 이벤트 리스너 동적 바인딩 ---
    const authorLink = elements.postPreview.querySelector('.post-author-link');
    if (authorLink) authorLink.addEventListener('click', handleAuthorClick);
    const markResolvedBtn = document.getElementById('mark-resolved-btn');
    if (markResolvedBtn) markResolvedBtn.addEventListener('click', () => handleMarkAsResolved(post.id));
    const likeButton = document.getElementById(`like-button-${post.id}`);
    if (likeButton) likeButton.addEventListener('click', () => handleLikeClick(post.id));
    const insightPostBtn = document.getElementById('btn-insight-post');
    if (insightPostBtn) insightPostBtn.addEventListener('click', () => handleInsightPostClick(post.id));
    const bookmarkBtn = document.getElementById('btn-bookmark');
    if (bookmarkBtn) bookmarkBtn.addEventListener('click', () => handleBookmarkClick(post.id));

    window.location.hash = `post-${postId}`;
    loadComments(post);
    const commentForm = document.getElementById('comment-form');
    if (commentForm) commentForm.addEventListener('submit', (e) => handleCommentSubmit(e, post));
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

  // 필터링 및 정렬 로직
  function updateFilteredPosts() {
    const term = (pageState.currentSearchTerm || '').toLowerCase();

    const filtered = app.state.posts.filter((post) => {
      const categoryMatch = pageState.currentCategory === 'all' || post.category === pageState.currentCategory;

      let contentSearchMatch = false;
      let feedbackTags = []; // 게시글의 태그

      if (post.postType === 'feedback') {
          try {
              const data = JSON.parse(post.content);
              const projectText = (data.projects || []).map(p => `${p.title} ${p.techStack} ${p.desc}`).join(' ');
              const questionText = data.questions || '';
              contentSearchMatch = (projectText + ' ' + questionText).toLowerCase().includes(term);
              feedbackTags = data.feedbackTags || [];
          } catch (e) {
              contentSearchMatch = (post.content || '').toLowerCase().includes(term);
          }
      } else {
          contentSearchMatch = (post.content || '').toLowerCase().includes(term);
      }
      const searchTermMatch = !term || post.title.toLowerCase().includes(term) || contentSearchMatch;

      const authorMatch = !pageState.currentAuthor || post.author === pageState.currentAuthor;
      const postType = post.postType || 'feedback';
      const typeMatch = pageState.filterTypes.includes(postType);

      let statusMatch = false;
      if (pageState.filterStatus.length === 0 || pageState.filterStatus.length === elements.statusCheckboxes.length) {
          statusMatch = true; // 아무것도 선택 안 하거나 모두 선택하면 통과
      } else {
          statusMatch = pageState.filterStatus.some(status => {
              if (status === 'ongoing') return !post.isResolved && !post.isHiredSuccess;
              if (status === 'resolved') return post.isResolved && !post.isHiredSuccess;
              if (status === 'hired') return post.isHiredSuccess;
              return false;
          });
      }

      // 태그 필터 로직
      let tagMatch = false;
      if (postType !== 'feedback') {
          tagMatch = true; // 피드백 요청 글이 아니면 태그 필터 무시
      } else if (pageState.filterTags.length === 0) {
          tagMatch = false; // 태그 필터를 모두 껐으면 피드백 요청 글은 보이지 않음
      } else if (pageState.filterTags.length === elements.tagsCheckboxes.length) {
          tagMatch = true; // 모든 태그가 켜져있으면 모두 통과
      } else {
          // 선택된 태그 중 하나라도 포함하는지 확인
          tagMatch = pageState.filterTags.some(tag => feedbackTags.includes(tag));
      }

      return categoryMatch && searchTermMatch && authorMatch && typeMatch && statusMatch && tagMatch;
    });

    const enhancedPosts = filtered.map(post => {
        const commentCount = allComments.filter(c => c.postId === post.id).length;
        const popularity = (post.likes || 0) + (post.insights || []).length;
        return { ...post, commentCount, popularity };
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

  // 목록에 요청 태그 표시
  function createPostItemHTML(post) {
      const authorCategory = post.authorCategory || '사용자';
      let tag = '';
      if (post.postType === 'casestudy') { tag = '<span style="font-size: 0.8rem; color: var(--color-highlight); margin-right: 0.25rem;">[💡 스터디]</span>'; }
      else if (post.isHiredSuccess) { tag = '<span style="font-size: 0.8rem; color: #D97706; margin-right: 0.25rem;">[🎉 성공]</span>'; }
      else if (post.isResolved) { tag = '<span style="font-size: 0.8rem; color: #16A34A; margin-right: 0.25rem;">[해결]</span>'; }
      const reactionHTML = (post.postType === 'casestudy') ? `💡 ${(post.insights || []).length}` : `❤️ ${post.likes || 0}`;

      // 목록에 표시할 태그 렌더링
      let tagsHTML = '';
      if (post.postType === 'feedback') {
          try {
              const data = JSON.parse(post.content);
              if (data.feedbackTags && data.feedbackTags.length > 0) {
                  tagsHTML = `<div class="post-tags" style="margin-top: 0.5rem; justify-content: flex-start;">` +
                      data.feedbackTags.slice(0, 2).map(tag => `<span class="post-tag">#${tag}</span>`).join('') +
                  (data.feedbackTags.length > 2 ? ` <span class="post-tag" style="background: none; padding-left: 0;">...</span>` : '') +
                  `</div>`;
              }
          } catch (e) { /* 파싱 실패 시 태그 없음 */ }
      }

      return `
        <li class="post-item" data-post-id="${post.id}">
          <div class="post-item-title">${tag}[${post.category}] ${post.title}</div>
          <div class="post-item-meta">
            <span>(${authorCategory}) ${post.author}</span> •
            <span>${app.utils.formatDate(post.createdAt)}</span> •
            <span>조회 ${post.views || 0}</span> •
            <span>${reactionHTML}</span> •
            <span>💬 ${post.commentCount}</span>
          </div>
          ${tagsHTML} </li>
      `;
  }

  function updatePostItemInList(post) {
      const item = document.querySelector(`.post-item[data-post-id="${post.id}"]`);
      if(item) {
          const viewsEl = item.querySelector('.post-item-meta span:nth-child(3)');
          const reactionEl = item.querySelector('.post-item-meta span:nth-child(4)');
          const commentEl = item.querySelector('.post-item-meta span:nth-child(5)');
          if(viewsEl) viewsEl.textContent = `조회 ${post.views || 0}`;
          if(reactionEl && post.postType === 'casestudy') reactionEl.textContent = `💡 ${(post.insights || []).length}`;
          else if(reactionEl) reactionEl.textContent = `❤️ ${post.likes || 0}`;
          if (commentEl && typeof post.commentCount !== 'undefined') {
              commentEl.textContent = `💬 ${post.commentCount}`;
          }
           // Update tags dynamically? Could be complex, maybe skip for list view update
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
    app.state.categories.forEach((category) => {
      elements.categoryFilter.add(new Option(category, category));
    });
  }

  initializePostsPage();
});