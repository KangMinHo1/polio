/**
 * CommunityApp - Shared JavaScript
 */
window.CommunityApp = {
  state: {
    posts: [],
    users: [],
    categories: ['공지', '프론트엔드', '백엔드', 'UX/UI 디자인', '데이터 분석', '기타'],
    user: null,
    isDarkMode: false,
  },

  utils: {
    formatDate(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = (now - date) / 1000;
      if (diff < 60) return '방금 전';
      if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
      return date.toLocaleDateString('ko-KR');
    },
    debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },
    showNotification(message, type = 'info') {
      document.querySelectorAll('.notification').forEach(n => n.remove());
      const notification = document.createElement('div');
      notification.className = `notification notification--${type}`;
      notification.textContent = message;
      Object.assign(notification.style, {
        position: 'fixed', top: '20px', right: '20px', padding: '1rem',
        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
        borderLeft: `4px solid var(--color-${type}, var(--color-primary))`,
        borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: '1001', transition: 'transform 0.3s ease, opacity 0.3s ease',
        transform: 'translateX(100%)', opacity: '0',
      });
      document.body.appendChild(notification);
      setTimeout(() => {
        Object.assign(notification.style, { transform: 'translateX(0)', opacity: '1' });
      }, 10);
      setTimeout(() => {
        Object.assign(notification.style, { transform: 'translateX(100%)', opacity: '0' });
        notification.addEventListener('transitionend', () => notification.remove());
      }, 3000);
    },
    async parseMentionsAndCreateNotifications(content, link, authorUser) {
        const users = await window.CommunityApp.api.fetchAllUsers();
        const mentions = content.match(/@(\w+)/g);
        if (!mentions) return;
        const mentionedUserIds = new Set();
        for (const mention of mentions) {
            const userId = mention.substring(1);
            if (userId === authorUser.id) continue;
            const userExists = users.some(u => u.id === userId);
            if (userExists) {
                mentionedUserIds.add(userId);
            }
        }
        for (const userId of mentionedUserIds) {
            const notificationData = { id: Date.now() + Math.random(), targetUserId: userId, authorId: authorUser.id, authorCategory: authorUser.category, content: content, link: link, isRead: false, createdAt: Date.now() };
            await window.CommunityApp.api.createNotification(notificationData);
        }
    }
  },

  api: {
    async fetchPosts() {
      const savedPosts = localStorage.getItem('posts');
      if (savedPosts) {
          try { return JSON.parse(savedPosts); } catch (e) { localStorage.removeItem('posts'); }
      }
      const noticePosts = [ { id: 1001, title: '피드백 사이트 리뉴얼 오픈', content: '포트폴리오/이력서 피드백 사이트가 새롭게 단장했습니다!', category: '공지', author: 'admin', authorCategory: '관리자', createdAt: new Date('2025-09-27').getTime(), views: 1200, likes: 150, image: null, isImportant: true, portfolioLink: null, file: null, isResolved: false, isHiredSuccess: false, postType: 'feedback', insights: [], bookmarkedBy: [] }, ];
      const samplePosts = Array.from({ length: 15 }, (_, i) => {
          const isResolved = i < 5; const isHired = i < 2;
          const sampleContent = {
              projects: [ { title: `샘플 프로젝트 ${i+1}`, link: `https://github.com/user/project${i+1}`, techStack: (i % 3 === 0) ? 'React, Node.js, 리액트' : 'Spring Boot, Java, AWS, 자바', desc: `이것은 샘플 프로젝트 ${i+1}에 대한 설명입니다.` } ],
              questions: '전반적인 코드 구조와 README 작성법에 대해 피드백 받고 싶습니다.',
              feedbackTags: (i % 3 === 0) ? ['코드 구조', '기술 스택', '커스텀태그1'] : ['디자인', '프로젝트 설명'] // '커스텀태그1' 추가
          };
          if (i % 4 === 0) { sampleContent.projects.push({ title: `샘플 프로젝트 ${i+1}-2`, link: '', techStack: 'Python, Django, 파이썬', desc: '두 번째 프로젝트입니다.' }); }
          return { id: i + 1, title: `[${window.CommunityApp.state.categories[(i % 4) + 1]}] 신입 포트폴리오 (React) 피드백 요청합니다. #${i + 1}`, content: JSON.stringify(sampleContent), category: window.CommunityApp.state.categories[(i % 4) + 1], author: `user${i + 1}`, authorCategory: (i % 2 === 0) ? '재직자' : '취준생', createdAt: Date.now() - i * 86400000 * Math.random(), views: Math.floor(Math.random() * 1000), likes: Math.floor(Math.random() * 100), image: null, isImportant: false, portfolioLink: 'https://github.com', file: null, isResolved: isResolved, isHiredSuccess: isHired, postType: 'feedback', insights: [], bookmarkedBy: [] };
      });
      const allPosts = [...noticePosts, ...samplePosts];
      localStorage.setItem('posts', JSON.stringify(allPosts));
      return allPosts;
    },
    async createPost(postData) {
      const posts = await this.fetchPosts();
      return new Promise((resolve) => {
        setTimeout(() => {
            const newPost = { ...postData, id: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1, createdAt: Date.now(), author: window.CommunityApp.state.user.id, authorCategory: window.CommunityApp.state.user.category, views: 0, likes: 0, file: postData.file || null, isResolved: false, isHiredSuccess: false, postType: postData.postType || 'feedback', insights: [], bookmarkedBy: [] };
            if (newPost.isImportant === undefined) { newPost.isImportant = false; }
            posts.unshift(newPost);
            localStorage.setItem('posts', JSON.stringify(posts));
            resolve(newPost);
        }, 500);
      });
    },
    async updatePost(postId, updatedData) {
      const posts = await this.fetchPosts();
      return new Promise((resolve) => {
        setTimeout(() => {
            const postIndex = posts.findIndex(p => p.id === postId);
            if (postIndex !== -1) {
                const originalPost = posts[postIndex];
                if (!originalPost.insights) originalPost.insights = [];
                if (!originalPost.bookmarkedBy) originalPost.bookmarkedBy = [];
                posts[postIndex] = { ...originalPost, ...updatedData };
                localStorage.setItem('posts', JSON.stringify(posts));
                resolve(posts[postIndex]);
            } else { resolve(null); }
        }, 100);
      });
    },
    async loginUser(inputId, password) {
      const users = await this.fetchAllUsers();
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const foundUser = users.find(u => u.id === inputId && u.password === password);
          if (foundUser) { const userToReturn = { id: foundUser.id, name: foundUser.name, email: foundUser.email, category: foundUser.category, role: foundUser.role, }; resolve(userToReturn); } else { reject(new Error('아이디 또는 비밀번호가 올바르지 않습니다.')); }
        }, 500);
      });
    },
    async fetchAllUsers() {
      const savedUsers = localStorage.getItem('users');
      if (savedUsers) { try { return JSON.parse(savedUsers); } catch(e) { localStorage.removeItem('users'); } }
      const sampleUsers = [ { id: 'admin', name: '관리자', email: 'admin@test.com', password: 'admin', category: '관리자', role: 'admin' }, { id: 'user1', name: '김재직', email: 'user1@test.com', password: 'user1', category: '재직자', role: 'user' }, { id: 'user10', name: '이취준', email: 'user10@test.com', password: 'user10', category: '취준생', role: 'user' } ];
      localStorage.setItem('users', JSON.stringify(sampleUsers));
      return sampleUsers;
    },
    async signupUser(userData) {
      const users = await this.fetchAllUsers();
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (users.some(u => u.id === userData.id)) { return reject(new Error('이미 사용 중인 아이디입니다.')); }
          if (users.some(u => u.email === userData.email)) { return reject(new Error('이미 등록된 이메일입니다.')); }
          const newUser = { ...userData, role: userData.id.toLowerCase() === 'admin' ? 'admin' : 'user' };
          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));
          resolve(newUser);
        }, 500);
      });
    },
    async deleteUser(userName) {
      let users = await this.fetchAllUsers(); let posts = await this.fetchPosts(); let comments = await this.fetchAllComments();
      return new Promise((resolve) => {
        setTimeout(() => {
            users = users.filter(u => u.id !== userName); localStorage.setItem('users', JSON.stringify(users)); window.CommunityApp.state.users = users;
            posts = posts.filter(p => p.author !== userName);
            posts.forEach(p => { if (p.bookmarkedBy && p.bookmarkedBy.includes(userName)) { p.bookmarkedBy = p.bookmarkedBy.filter(id => id !== userName); } });
            localStorage.setItem('posts', JSON.stringify(posts)); window.CommunityApp.state.posts = posts;
            comments = comments.filter(c => c.author !== userName); localStorage.setItem('comments', JSON.stringify(comments));
            resolve();
        }, 500);
      });
    },
    async deletePost(postId) {
      let posts = await this.fetchPosts(); let comments = await this.fetchAllComments();
      return new Promise((resolve) => {
        setTimeout(() => {
            posts = posts.filter(p => p.id !== postId); localStorage.setItem('posts', JSON.stringify(posts)); window.CommunityApp.state.posts = posts;
            comments = comments.filter(c => c.postId !== postId); localStorage.setItem('comments', JSON.stringify(comments));
            resolve();
        }, 300);
      });
    },
    async fetchComments(postId) {
      return new Promise(async (resolve) => {
        setTimeout(async () => {
          let allComments = await this.fetchAllComments(); const postComments = allComments.filter(c => c.postId === postId);
          resolve(postComments.sort((a, b) => { if (a.isBest && !b.isBest) return -1; if (!a.isBest && b.isBest) return 1; return a.createdAt - b.createdAt; }));
        }, 100);
      });
    },
    async fetchAllComments() {
      return new Promise((resolve) => {
        const savedComments = localStorage.getItem('comments');
        if (savedComments) { try { resolve(JSON.parse(savedComments)); return; } catch(e) { localStorage.removeItem('comments');} }
        const sampleComments = [ { postId: 1, id: 101, createdAt: Date.now() - 80000000, author: 'user1', authorCategory: '재직자', upvotes: ['admin'], isBest: true, insights: [], content: 'React 프로젝트 경험이 잘 드러나네요. 결과를 수치화하면 더 좋을 것 같아요.' }, { postId: 1, id: 102, createdAt: Date.now() - 70000000, author: 'admin', authorCategory: '관리자', upvotes: ['user1'], isBest: false, insights: [], content: '맞아요. 어떤 성과를 냈는지 구체적인 숫자로 보여주는 게 중요합니다.' }, { postId: 2, id: 103, createdAt: Date.now() - 60000000, author: 'user10', authorCategory: '취준생', upvotes: [], isBest: false, insights: [], content: 'Node.js 백엔드 부분 인상 깊었습니다!' }, { postId: 2, id: 104, createdAt: Date.now() - 50000000, author: 'user1', authorCategory: '재직자', upvotes: ['user10'], isBest: true, insights: [], content: '백엔드 API 설계 부분을 좀 더 자세히 설명하고, 사용한 DB 스키마를 보여주면 좋습니다.' }, ];
        localStorage.setItem('comments', JSON.stringify(sampleComments));
        resolve(sampleComments);
      });
    },
    async createComment(commentData) {
       return new Promise(async (resolve) => {
        setTimeout(async () => {
          let allComments = await this.fetchAllComments();
          const newComment = { ...commentData, id: allComments.length > 0 ? Math.max(...allComments.map(c => c.id)) + 1 : 1, createdAt: Date.now(), author: window.CommunityApp.state.user.id, authorCategory: window.CommunityApp.state.user.category, upvotes: [], isBest: false, insights: [] };
          allComments.push(newComment);
          localStorage.setItem('comments', JSON.stringify(allComments));
          resolve(newComment);
        }, 100);
      });
    },
    async fetchChatMessages() {
      return new Promise((resolve) => {
        let messages = [];
        try { messages = JSON.parse(localStorage.getItem('chatMessages') || '[]'); } catch(e) {localStorage.removeItem('chatMessages');}
        resolve(messages);
      });
    },
    async sendChatMessage(messageData) {
      return new Promise((resolve) => {
        let messages = [];
        try { messages = JSON.parse(localStorage.getItem('chatMessages') || '[]'); } catch(e) {localStorage.removeItem('chatMessages');}
        const newMessage = { ...messageData, messageId: 'msg-' + (Date.now() + Math.random().toString(36).substring(2, 9)) };
        messages.push(newMessage);
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        resolve(newMessage);
      });
    },
    async fetchNotifications(userId) {
        return new Promise((resolve) => {
            let allNotifications = [];
            try { allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]'); } catch(e) {localStorage.removeItem('notifications');}
            const userNotifications = allNotifications.filter(n => n.targetUserId === userId).sort((a, b) => b.createdAt - a.createdAt);
            resolve(userNotifications);
        });
    },
    async createNotification(notificationData) {
        return new Promise((resolve) => {
            let allNotifications = [];
            try { allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]'); } catch(e) {localStorage.removeItem('notifications');}
            allNotifications.push(notificationData);
            localStorage.setItem('notifications', JSON.stringify(allNotifications));
            resolve(notificationData);
        });
    },
    async markNotificationsAsRead(userId) {
        return new Promise((resolve) => {
            let allNotifications = [];
            try { allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]'); } catch(e) {localStorage.removeItem('notifications'); return resolve();}
            allNotifications.forEach(n => { if (n.targetUserId === userId) n.isRead = true; });
            localStorage.setItem('notifications', JSON.stringify(allNotifications));
            resolve();
        });
    },
    async upvoteComment(commentId, userId) {
        return new Promise(async (resolve, reject) => {
            let allComments = await this.fetchAllComments();
            const commentIndex = allComments.findIndex(c => c.id === commentId);
            if (commentIndex === -1) return reject(new Error('Comment not found'));
            const comment = allComments[commentIndex];
            if (!comment.upvotes) comment.upvotes = [];
            const upvoteIndex = comment.upvotes.indexOf(userId);
            if (upvoteIndex > -1) { comment.upvotes.splice(upvoteIndex, 1); } else { comment.upvotes.push(userId); }
            localStorage.setItem('comments', JSON.stringify(allComments));
            resolve(comment);
        });
    },
    async selectBestComment(postId, commentId) {
        return new Promise(async (resolve) => {
            let allComments = await this.fetchAllComments();
            allComments.forEach(c => { if (c.postId === postId) c.isBest = false; });
            const comment = allComments.find(c => c.id === commentId);
            if (comment) { comment.isBest = true; }
            localStorage.setItem('comments', JSON.stringify(allComments));
            resolve(comment);
        });
    },
    async markPostAsResolved(postId) {
        return new Promise(async (resolve) => {
            let posts = await this.fetchPosts();
            const post = posts.find(p => p.id === postId);
            if (post) { post.isResolved = true; localStorage.setItem('posts', JSON.stringify(posts)); resolve(post); } else {resolve(null);}
        });
    },
    async markAsHired(postId) {
        return new Promise(async (resolve) => {
            let posts = await this.fetchPosts();
            const post = posts.find(p => p.id === postId);
            if (post) { post.isHiredSuccess = true; localStorage.setItem('posts', JSON.stringify(posts)); resolve(post); } else {resolve(null);}
        });
    },
    async revertHired(postId) {
        return new Promise(async (resolve) => {
            let posts = await this.fetchPosts();
            const post = posts.find(p => p.id === postId);
            if (post) { post.isHiredSuccess = false; localStorage.setItem('posts', JSON.stringify(posts)); resolve(post); } else {resolve(null);}
        });
    },
    async addInsightPost(postId, userId) {
        return new Promise(async (resolve, reject) => {
            let posts = await this.fetchPosts();
            const postIndex = posts.findIndex(p => p.id === postId);
            if (postIndex === -1) return reject(new Error('Post not found'));
            const post = posts[postIndex];
            if (!post.insights) post.insights = [];
            const insightIndex = post.insights.indexOf(userId);
            if (insightIndex > -1) { post.insights.splice(insightIndex, 1); } else { post.insights.push(userId); }
            localStorage.setItem('posts', JSON.stringify(posts));
            resolve(post);
        });
    },
    async addInsightComment(commentId, userId) {
        return new Promise(async (resolve, reject) => {
            let allComments = await this.fetchAllComments();
            const commentIndex = allComments.findIndex(c => c.id === commentId);
            if (commentIndex === -1) return reject(new Error('Comment not found'));
            const comment = allComments[commentIndex];
            if (!comment.insights) comment.insights = [];
            const insightIndex = comment.insights.indexOf(userId);
            if (insightIndex > -1) { comment.insights.splice(insightIndex, 1); } else { comment.insights.push(userId); }
            localStorage.setItem('comments', JSON.stringify(allComments));
            resolve(comment);
        });
    },
    async toggleBookmark(postId, userId) {
        return new Promise(async (resolve, reject) => {
            let posts = await this.fetchPosts();
            const postIndex = posts.findIndex(p => p.id === postId);
            if (postIndex === -1) return reject(new Error('Post not found'));
            const post = posts[postIndex];
            if (!post.bookmarkedBy) post.bookmarkedBy = [];
            const bookmarkIndex = post.bookmarkedBy.indexOf(userId);
            let isBookmarked = false;
            if (bookmarkIndex > -1) { post.bookmarkedBy.splice(bookmarkIndex, 1); isBookmarked = false; }
            else { post.bookmarkedBy.push(userId); isBookmarked = true; }
            localStorage.setItem('posts', JSON.stringify(posts));
            resolve({ post, isBookmarked });
        });
    },
    async getMentorStatusList() {
        return new Promise((resolve) => {
            let statusList = [];
            try { statusList = JSON.parse(localStorage.getItem('mentorStatus') || '[]'); } catch(e) { localStorage.removeItem('mentorStatus'); }
            const now = Date.now();
            const activeMentors = statusList.filter(mentor => mentor.expiresAt > now);
            if (activeMentors.length < statusList.length) {
                localStorage.setItem('mentorStatus', JSON.stringify(activeMentors));
            }
            resolve(activeMentors);
        });
    },
    async setMentorStatus(userId, isOnline) {
        return new Promise(async (resolve) => {
            let statusList = await this.getMentorStatusList();
            statusList = statusList.filter(mentor => mentor.userId !== userId);
            if (isOnline) {
                const expiresAt = Date.now() + (2 * 60 * 60 * 1000); // 2 hours
                statusList.push({ userId, expiresAt });
            }
            localStorage.setItem('mentorStatus', JSON.stringify(statusList));
            resolve(statusList);
        });
    },
    async getOnlineMentors() {
        const activeMentorStatus = await this.getMentorStatusList();
        if (activeMentorStatus.length === 0) return [];
        const activeMentorIds = activeMentorStatus.map(m => m.userId);
        const allUsers = await this.fetchAllUsers();
        const allComments = await this.fetchAllComments();
        const allPosts = await this.fetchPosts();
        const mentorDetails = activeMentorIds.map(userId => {
            const user = allUsers.find(u => u.id === userId);
            if (!user) return null;
            let totalBestAnswers = 0;
            let hiredMentorCount = 0;
            const userComments = allComments.filter(c => c.author === userId);
            userComments.forEach(comment => { if (comment.isBest) totalBestAnswers++; });
            const bestCommentPostIds = userComments.filter(c => c.isBest).map(c => c.postId);
            if (bestCommentPostIds.length > 0) {
                hiredMentorCount = allPosts.filter(post => bestCommentPostIds.includes(post.id) && post.isHiredSuccess).length;
            }
            let badge = null;
            if (hiredMentorCount > 0) { badge = `🚀 취업시킨 멘토 (${hiredMentorCount}회)`; }
            else if ((user.category === '재직자' || user.role === 'admin') && totalBestAnswers >= 5) { badge = '🏅 신뢰하는 재직자'; }
            else if (user.category === '재직자' || user.role === 'admin') { badge = `(${user.category})`; }
            if (badge === null) return null;
            return { id: user.id, category: user.category, badge: badge, expiresAt: activeMentorStatus.find(m => m.userId === userId).expiresAt };
        }).filter(Boolean);
        return mentorDetails;
    },

    // ✅ [수정] 트렌드 분석 로직 (feedbackTags 집계 수정)
    async calculatePortfolioTrends() {
      return new Promise(async (resolve) => {
        const posts = await this.fetchPosts();
        const comments = await this.fetchAllComments();
        const users = await this.fetchAllUsers();

        const trends = { popularTechStacks: {}, commonFeedbackPoints: {}, mostRequestedFeedback: {}, successPortfolioStats: { count: 0, categories: {} }, topMentorCategories: {} };
        const bestComments = comments.filter(c => c.isBest);
        const bestFeedbackPostIds = new Set(bestComments.map(c => c.postId));
        
        // ✅ [추가] 트렌드 분석에 사용할 미리 정의된 태그 목록
        const predefinedFeedbackTags = ['코드 구조', '디자인', 'UX/UI', '프로젝트 설명', '기술 스택', '전반적 흐름'];

        bestFeedbackPostIds.forEach(postId => {
          const post = posts.find(p => p.id === postId);
          if (!post || post.postType !== 'feedback') return;

          let techStackString = (post.title || '').toLowerCase();
          try {
            const data = JSON.parse(post.content);
            if (data.projects && Array.isArray(data.projects)) {
                data.projects.forEach(project => { if (project.techStack) { techStackString += ' ' + project.techStack.toLowerCase(); } });
            }
            
            // ✅ [수정] '기타' 태그 집계 로직
            if (data.feedbackTags && Array.isArray(data.feedbackTags)) {
                data.feedbackTags.forEach(tag => {
                    if (predefinedFeedbackTags.includes(tag)) {
                        // 미리 정의된 태그
                        trends.mostRequestedFeedback[tag] = (trends.mostRequestedFeedback[tag] || 0) + 1;
                    } else if (tag.trim().length > 0) {
                        // '기타' (직접 입력) 태그
                        trends.mostRequestedFeedback['기타'] = (trends.mostRequestedFeedback['기타'] || 0) + 1;
                    }
                });
            }
          } catch (e) { techStackString += ' ' + (post.content || '').toLowerCase(); }
          
          const techKeywords = [ "React", "Vue", "Angular", "Node.js", "Spring Boot", "Python", "Django", "Figma", "SQL", "AWS", "리액트", "뷰", "앵귤러", "노드", "스프링 부트", "파이썬", "장고", "피그마", "Java", "자바", "C", "씨", "C++", "씨쁠쁠", "C#", "씨샵", "JavaScript", "자바스크립트", "TypeScript", "타입스크립트", "Kotlin", "코틀린", "Swift", "스위프트", "Go", "고" ];
          techKeywords.forEach(tech => {
            if (techStackString.includes(tech.toLowerCase())) {
              const representativeName = tech.match(/[a-zA-Z#+]+/)?.[0] || tech;
              trends.popularTechStacks[representativeName] = (trends.popularTechStacks[representativeName] || 0) + 1;
            }
          });

          const bestCommentForPost = bestComments.find(c => c.postId === postId);
          if (bestCommentForPost && bestCommentForPost.content) {
            const feedbackKeywords = ["수치화", "결과", "명확", "일관성", "가독성", "프로젝트 설명", "차별성"];
            feedbackKeywords.forEach(fb => { if (bestCommentForPost.content.includes(fb)) { trends.commonFeedbackPoints[fb] = (trends.commonFeedbackPoints[fb] || 0) + 1; } });
          }
        });
        
        const successPosts = posts.filter(p => p.isHiredSuccess);
        trends.successPortfolioStats.count = successPosts.length;
        successPosts.forEach(post => { trends.successPortfolioStats.categories[post.category] = (trends.successPortfolioStats.categories[post.category] || 0) + 1; });
        
        const hiredMentorUserIds = new Set();
        successPosts.forEach(post => { const bestCommentForPost = comments.find(c => c.postId === post.id && c.isBest); if (bestCommentForPost) { hiredMentorUserIds.add(bestCommentForPost.author); } });
        hiredMentorUserIds.forEach(userId => {
          const mentorUser = users.find(u => u.id === userId);
          if (mentorUser && (mentorUser.category === '재직자' || mentorUser.role === 'admin')) {
             comments.filter(c => c.author === userId && c.isBest).forEach(c => { const post = posts.find(p => p.id === c.postId); if (post) { trends.topMentorCategories[post.category] = (trends.topMentorCategories[post.category] || 0) + 1; } });
          }
        });

        const getTopItems = (obj, n) => Object.entries(obj).sort(([, a], [, b]) => b - a).slice(0, n).map(([key, value]) => ({ key, value }));
        resolve({ 
            popularTechStacks: getTopItems(trends.popularTechStacks, 5), 
            commonFeedbackPoints: getTopItems(trends.commonFeedbackPoints, 5),
            mostRequestedFeedback: getTopItems(trends.mostRequestedFeedback, 5), // '기타' 포함
            successPortfolioStats: { count: trends.successPortfolioStats.count, categories: getTopItems(trends.successPortfolioStats.categories, 3) }, 
            topMentorCategories: getTopItems(trends.topMentorCategories, 3) 
        });
      });
    }
  },

  ui: {
    updateLoginStatus() {
      const userActions = document.getElementById('user-actions');
      if (!userActions) return;
      const user = window.CommunityApp.state.user;
      if (user && typeof user === 'object' && user.id && user.category) {
        const userDisplay = `(${user.category}) ${user.id}님`;
        const adminButtonHTML = user.role === 'admin' ? `<a class="nav-btn" href="admin.html">관리자</a>` : '';
        userActions.innerHTML = `${adminButtonHTML}<a id="user-display-link" class="nav-btn" href="settings.html">${userDisplay}</a><button id="logout-button" class="btn btn--ghost">로그아웃</button>`;
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton && !logoutButton.dataset.listenerAttached) {
             logoutButton.addEventListener('click', () => { localStorage.removeItem('user'); window.CommunityApp.state.user = null; window.CommunityApp.utils.showNotification('로그아웃되었습니다.', 'info'); setTimeout(() => window.location.reload(), 1000); });
             logoutButton.dataset.listenerAttached = 'true';
        }
      } else {
        userActions.innerHTML = `<a class="nav-btn" href="signup.html">회원가입</a><a class="nav-btn btn--login" href="login.html">로그인</a>`;
        if (window.CommunityApp.state.user) {
             console.warn("Invalid user object found, logging out:", window.CommunityApp.state.user);
             window.CommunityApp.state.user = null;
             localStorage.removeItem('user');
        }
      }
    },
    updateActiveNav() {
      const navLinks = document.querySelectorAll('#main-nav .nav-btn');
      if (navLinks.length === 0) return;
      const currentPage = window.location.pathname.split('/').pop() || 'mainview.html';
      navLinks.forEach(link => {
        link.classList.remove('active');
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage) { link.classList.add('active'); }
        else if (currentPage.startsWith('posts.html') && linkHref.startsWith('posts.html')) { link.classList.add('active'); }
        else if (currentPage.startsWith('trends.html') && linkHref.startsWith('trends.html')) { link.classList.add('active'); }
        else if (currentPage === 'mainview.html' && linkHref === 'mainview.html') { link.classList.add('active'); }
      });
    },
    async updateNotificationBadge(forceCount = null) {
      if (!window.CommunityApp.state.user) return;
      const badge = document.getElementById('notification-badge');
      if (!badge) return;
      let unreadCount = 0;
      if (forceCount !== null) { unreadCount = forceCount; }
      else { const notifications = await window.CommunityApp.api.fetchNotifications(window.CommunityApp.state.user.id); unreadCount = notifications.filter(n => !n.isRead).length; }
      if (unreadCount > 0) { badge.textContent = unreadCount > 9 ? '9+' : unreadCount; badge.classList.add('show'); }
      else { badge.classList.remove('show'); }
    }
  },

  async initialize() {
    // 1. Load User State
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        try {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser && parsedUser.id && parsedUser.category) { this.state.user = parsedUser; }
            else { console.warn("Parsed user invalid:", parsedUser); localStorage.removeItem('user'); this.state.user = null; }
        } catch (error) { console.error("Error parsing user:", error); localStorage.removeItem('user'); this.state.user = null; }
    } else { this.state.user = null; }

    // 2. Load Theme
    const savedTheme = localStorage.getItem('isDarkMode') === 'true';
    this.state.isDarkMode = savedTheme;
    document.documentElement.classList.toggle('dark', savedTheme);

    // 3. Load Core Data
    try { this.state.posts = await this.api.fetchPosts(); } catch(e) { console.error("Failed to load posts", e); this.state.posts = []; }
    try { this.state.users = await this.api.fetchAllUsers(); } catch(e) { console.error("Failed to load users", e); this.state.users = []; }

    // 4. Update UI
    this.ui.updateLoginStatus();
    this.ui.updateActiveNav();

    const chatWidget = document.getElementById('chat-widget');
    if (chatWidget && !this.state.user) {
      chatWidget.style.display = 'none';
    }

    // 5. Update Notification Badge
    if (this.state.user) {
      this.ui.updateNotificationBadge().catch(e => console.error("Failed to update notification badge", e));
    }

    console.log('CommunityApp initialized.');
  },
};