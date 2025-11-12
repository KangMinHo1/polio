package hacktip.demo.service;

import hacktip.demo.domain.Member;
import hacktip.demo.domain.Post;
import hacktip.demo.dto.PostRequestDto;
import hacktip.demo.repository.MemberRepository;
import hacktip.demo.repository.PostRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 'POSTS' 관련 비즈니스 로직
 * (사용자의 Member.java 스키마와 호환되도록 수정됨)
 */
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;

    // (중요) 사용자가 업로드한 MemberRepository를 주입받음
    private final MemberRepository memberRepository;

    /**
     * DTO와 인증된 사용자의 이메일을 받아 새 게시글을 생성합니다.
     *
     * @param dto   컨트롤러에서 받은 게시글 폼 데이터
     * @param authorEmail JWT 토큰에서 추출한 사용자의 이메일 (예: "user@example.com")
     * @return 저장된 Post 엔티티
     */
    @Transactional
    public Post createPost(PostRequestDto dto, String authorEmail) {

        // 1. JWT 토큰의 이메일(email)로 'Member' 엔티티를 조회
        //    (사용자의 MemberRepository.java에 findByEmail이 있으므로 정상 동작)
        Member author = memberRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new IllegalArgumentException("해당 이메일의 사용자를 찾을 수 없습니다: " + authorEmail));

        // 2. 새 Post 엔티티 생성
        Post post = new Post();

        // 3. DTO의 값으로 엔티티 필드 채우기
        post.setTitle(dto.getTitle());
        post.setCategory(dto.getCategory());
        post.setPostType(dto.getPostType());

        // 'content' 필드는 write.js에서 이미 JSON 문자열 또는 일반 텍스트로 가공됨
        post.setContent(dto.getContent());

        post.setPortfolioLink(dto.getPortfolioLink()); // 'casestudy'의 경우 null

        // 4. (핵심) 인증 정보로 'author' (Member 엔티티) 설정
        //    JPA가 author에서 PK (Long memberId)를 추출하여 FK로 사용합니다.
        post.setAuthor(author);

        // 5. DDL(또는 엔티티)에 정의된 기본값 설정
        post.setViews(0);
        post.setIsResolved('N');
        post.setIsHiredSuccess('N');

        // (createdAt는 @CreationTimestamp가 자동 처리)

        // 6. Repository를 통해 DB에 저장
        return postRepository.save(post);
    }
}