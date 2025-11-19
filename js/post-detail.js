/**
 * post-detail.js
 * 게시글 상세 페이지의 동적 기능을 담당합니다.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await window.APP_INITIALIZATION;
    const app = window.CommunityApp;
    const currentUser = app.state.user;

    const elements = {
        container: document.getElementById('post-detail-container'),
    };

    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'), 10);

    if (!postId || isNaN(postId)) {
        elements.container.innerHTML = '<p>잘못된 접근입니다. 게시글 ID가 없습니다.</p>';
        return;
    }

    const post = app.state.posts.find((p) => p.id === postId);

    if (!post) {
        elements.container.innerHTML = '<p>해당 게시글을 찾을 수 없습니다.</p>';
        return;
    }

    // --- 함수들 (posts.js에서 가져옴) ---
    
    function handleAuthorClick(e) {
        const authorId = e.target.dataset.authorId;
        if (!authorId) return;
        window.location.href = `profile.html?user=${encodeURIComponent(authorId)}`;
    }

    async function handleLikeClick(postId) {
        const likedPostIds = JSON.parse(localStorage.getItem('likedPostIds') || '[]');
        const postIndex = app.state.posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = app.state.posts[postIndex];
        const likeIndex = likedPostIds.indexOf(postId);

        if (likeIndex > -1) {
            likedPostIds.splice(likeIndex, 1);
            post.likes = (post.likes || 1) - 1;
        } else {
            likedPostIds.push(postId);
            post.likes = (post.likes || 0) + 1;
        }

        localStorage.setItem('likedPostIds', JSON.stringify(likedPostIds));
        await app.api.updatePost(postId, { likes: post.likes });
        renderPostDetail(); // Re-render
    }

    async function handleInsightPostClick(postId) {
        if (!currentUser) return;
        await app.api.addInsightPost(postId, currentUser.id);
        renderPostDetail(); // Re-render
    }

    async function handleBookmarkClick(postId) {
        if (!currentUser) return;
        await app.api.toggleBookmark(postId, currentUser.id);
        renderPostDetail(); // Re-render
    }

    async function handleMarkAsResolved(postId) {
        if (confirm('피드백 요청을 "해결됨"으로 표시하시겠습니까?')) {
            await app.api.markPostAsResolved(postId);
            app.utils.showNotification('요청이 해결됨으로 표시되었습니다.', 'success');
            renderPostDetail(); // Re-render
        }
    }

    async function handleCommentSubmit(e, post) {
        e.preventDefault();
        const contentEl = document.getElementById('comment-content');
        const content = contentEl.value.trim();
        if (!content) return;

        const newComment = await app.api.createComment({ postId: post.id, content });
        await app.utils.parseMentionsAndCreateNotifications(content, `post-detail.html?id=${post.id}#comment-${newComment.id}`, currentUser);
        
        contentEl.value = '';
        loadComments(post); // Re-load comments
    }

    // 댓글의 '도움됨' 버튼 클릭 핸들러
    async function handleUpvoteClick(commentId) {
        if (!currentUser) return;
        await app.api.upvoteComment(commentId, currentUser.id);
        loadComments(post); // 댓글 목록 새로고침
    }

    // 댓글의 '인사이트' 버튼 클릭 핸들러
    async function handleInsightCommentClick(commentId) {
        if (!currentUser) return;
        await app.api.addInsightComment(commentId, currentUser.id);
        loadComments(post); // 댓글 목록 새로고침
    }

    // '베스트 피드백' 채택 핸들러
    async function handleSelectBestClick(postId, commentId) {
        if (confirm('이 댓글을 베스트 피드백으로 채택하시겠습니까?')) {
            await app.api.selectBestComment(postId, commentId);
            loadComments(post); // 댓글 목록 새로고침
        }
    }

    // 댓글 삭제 핸들러
    async function handleDeleteComment(commentId) {
        if (confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
            try {
                await app.api.deleteComment(commentId);
                app.utils.showNotification('댓글이 삭제되었습니다.', 'success');
                loadComments(post);
            } catch (error) {
                app.utils.showNotification('댓글 삭제에 실패했습니다.', 'danger');
            }
        }
    }

    // 댓글 수정 UI 토글 핸들러
    function handleEditComment(commentId, currentContent) {
        const commentItem = document.getElementById(`comment-${commentId}`);
        const contentWrapper = commentItem.querySelector('.comment-content-wrapper');
        
        contentWrapper.innerHTML = `
            <div class="comment-edit-form">
                <textarea class="comment-edit-textarea">${currentContent}</textarea>
                <div class="comment-edit-actions">
                    <button class="btn btn--ghost btn-cancel-edit">취소</button>
                    <button class="btn btn--primary btn-save-edit">저장</button>
                </div>
            </div>
        `;

        contentWrapper.querySelector('.btn-save-edit').addEventListener('click', async () => {
            const newContent = contentWrapper.querySelector('.comment-edit-textarea').value.trim();
            if (newContent) {
                try {
                    await app.api.updateComment(commentId, newContent);
                    app.utils.showNotification('댓글이 수정되었습니다.', 'success');
                    loadComments(post);
                } catch (error) {
                    app.utils.showNotification('댓글 수정에 실패했습니다.', 'danger');
                }
            }
        });

        contentWrapper.querySelector('.btn-cancel-edit').addEventListener('click', () => {
            contentWrapper.innerHTML = `<div class="comment-content">${currentContent.replace(/\n/g, '<br>')}</div>`;
        });
    }

    async function loadComments(post) {
        const commentList = document.getElementById('comment-list');
        if (!commentList) return;
        
        const comments = await app.api.fetchComments(post.id);
        const isPostAuthor = currentUser && currentUser.id === post.author;

        commentList.innerHTML = comments.length > 0 ? comments.map(comment => {
            const isCommentAuthor = currentUser && currentUser.id === comment.author;
            let authorActions = '';
            if (isCommentAuthor) {
                authorActions = `
                    <button class="btn-comment-action btn-edit-comment" data-comment-id="${comment.id}" data-comment-content="${escape(comment.content)}">수정</button>
                    <button class="btn-comment-action btn-delete-comment" data-comment-id="${comment.id}">삭제</button>
                `;
            }

            const upvoted = currentUser && comment.upvotes && comment.upvotes.includes(currentUser.id);
            const insighted = currentUser && comment.insights && comment.insights.includes(currentUser.id);
            const reactionButton = post.postType === 'casestudy'
                ? `<button class="btn btn--ghost btn-insight ${insighted ? 'is-active' : ''}" data-comment-id="${comment.id}">💡 인사이트 (${(comment.insights || []).length})</button>`
                : `<button class="btn btn--ghost btn-upvote ${upvoted ? 'is-active' : ''}" data-comment-id="${comment.id}">👍 도움됨 (${(comment.upvotes || []).length})</button>`;
            
            const bestButton = isPostAuthor && !post.isResolved && !comment.isBest && post.postType !== 'casestudy'
                ? `<button class="btn btn--ghost btn-select-best" data-comment-id="${comment.id}">🏆 베스트 채택</button>` : '';

            return `
                <li class="comment-item ${comment.isBest ? 'is-best' : ''}" id="comment-${comment.id}">
                    <div class="comment-header">
                        <span class="comment-author" data-author-id="${comment.author}">${comment.author}</span>
                        <span class="comment-date">${app.utils.formatDate(comment.createdAt)}</span>
                        <div class="comment-author-actions">${authorActions}</div>
                    </div>
                    <div class="comment-content-wrapper"><div class="comment-content">${comment.content.replace(/\n/g, '<br>')}</div></div>
                    <div class="comment-actions">${reactionButton}${bestButton}</div>
                    ${comment.isBest ? '<div class="best-badge">🏆 베스트 피드백</div>' : ''}
                </li>
            `;
        }).join('') : '<li>아직 댓글이 없습니다.</li>';

        // 이벤트 리스너 동적 바인딩
        commentList.querySelectorAll('.comment-author').forEach(el => el.addEventListener('click', handleAuthorClick));
        commentList.querySelectorAll('.btn-upvote').forEach(btn => btn.addEventListener('click', () => handleUpvoteClick(parseInt(btn.dataset.commentId))));
        commentList.querySelectorAll('.btn-insight').forEach(btn => btn.addEventListener('click', () => handleInsightCommentClick(parseInt(btn.dataset.commentId))));
        commentList.querySelectorAll('.btn-select-best').forEach(btn => btn.addEventListener('click', () => handleSelectBestClick(post.id, parseInt(btn.dataset.commentId))));
        commentList.querySelectorAll('.btn-delete-comment').forEach(btn => btn.addEventListener('click', () => handleDeleteComment(parseInt(btn.dataset.commentId))));
        commentList.querySelectorAll('.btn-edit-comment').forEach(btn => btn.addEventListener('click', () => handleEditComment(parseInt(btn.dataset.commentId), unescape(btn.dataset.commentContent))));
    }

    // --- 상세 페이지 렌더링 함수 ---
    async function renderPostDetail() {
        // 조회수 증가
        post.views = (post.views || 0) + 1;
        await app.api.updatePost(postId, { views: post.views });

        const postType = post.postType || 'feedback';
        const authorCategory = post.authorCategory || '사용자';

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
            const likedPostIds = JSON.parse(localStorage.getItem('likedPostIds') || '[]');
            const hasLiked = likedPostIds.includes(postId);
            postActionsHTML = `<button id="like-button-${post.id}" class="btn ${hasLiked ? 'btn--primary' : ''}">❤️ 좋아요 (${post.likes || 0})</button>`;
        }

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

        elements.container.innerHTML = `
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
                ${feedbackTagsHTML}
            </div>
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

        // 이벤트 리스너 동적 바인딩
        const authorLink = elements.container.querySelector('.post-author-link');
        if (authorLink) authorLink.addEventListener('click', handleAuthorClick);
        const markResolvedBtn = document.getElementById('mark-resolved-btn');
        if (markResolvedBtn) markResolvedBtn.addEventListener('click', () => handleMarkAsResolved(post.id));
        const likeButton = document.getElementById(`like-button-${post.id}`);
        if (likeButton) likeButton.addEventListener('click', () => handleLikeClick(post.id));
        const insightPostBtn = document.getElementById('btn-insight-post');
        if (insightPostBtn) insightPostBtn.addEventListener('click', () => handleInsightPostClick(post.id));
        const bookmarkBtn = document.getElementById('btn-bookmark');
        if (bookmarkBtn) bookmarkBtn.addEventListener('click', () => handleBookmarkClick(post.id));

        loadComments(post);
        const commentForm = document.getElementById('comment-form');
        if (commentForm) commentForm.addEventListener('submit', (e) => handleCommentSubmit(e, post));
    }

    renderPostDetail();
});