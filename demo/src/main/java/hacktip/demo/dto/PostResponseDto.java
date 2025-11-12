package hacktip.demo.dto;

import hacktip.demo.domain.Post;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * 게시글 생성(Create) 또는 조회(Read) 응답을 위한 DTO
 * (Member 엔티티와 호환되도록 수정됨)
 */
@Data
@Builder
public class PostResponseDto {

    private Long postId;

    // [수정] 작성자 정보를 Long ID와 String Name으로 분리
    private Long authorId; // 작성자의 Member PK (Long)
    private String authorName; // 작성자의 이름 (예: "홍길동")

    private String title;
    private String content;
    private String category;
    private String postType;
    private String portfolioLink;
    private Instant createdAt;
    private int views;
    private char isResolved;
    private char isHiredSuccess;

    /**
     * Post 엔티티를 PostResponseDto로 변환하는 정적 팩토리 메서드
     * (N+1 문제를 방지하려면 @Transactional(readOnly=true) 또는 Fetch Join 필요)
     * * @param post Post 엔티티
     * @return 변환된 PostResponseDto
     */
    public static PostResponseDto fromEntity(Post post) {
        return PostResponseDto.builder()
                .postId(post.getPostId())
                // [수정] 연관된 Member 엔티티에서 ID와 Name을 추출
                .authorId(post.getAuthor().getMemberId())
                .authorName(post.getAuthor().getName())
                .title(post.getTitle())
                .content(post.getContent())
                .category(post.getCategory())
                .postType(post.getPostType())
                .portfolioLink(post.getPortfolioLink())
                .createdAt(post.getCreatedAt())
                .views(post.getViews())
                .isResolved(post.getIsResolved())
                .isHiredSuccess(post.getIsHiredSuccess())
                .build();
    }
}