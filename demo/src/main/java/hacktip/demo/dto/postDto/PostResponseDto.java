package hacktip.demo.dto.postDto;

import hacktip.demo.domain.Post;
import lombok.Getter;

import java.sql.Timestamp;

@Getter //(게시물 상세 조회 응답)
public class PostResponseDto {

    private Long postId;
    private String title;
    private String content;
    private String writerName;
    private int viewCount;
    private Timestamp createDate;
    private String category;

    /**
     * Post 엔티티를 PostResponseDto로 변환하는 생성자
     * (이 변환 로직은 DTO가 Entity를 아는 것이므로,
     * Service 계층에서 이 생성자를 호출하여 사용)
     */
    public PostResponseDto(Post post) {
        this.postId = post.getPostId();
        this.title = post.getTitle();
        this.content = post.getContent();
        this.writerName = post.getMember().getName(); // 3. (Lazy Loading 주의)
        this.viewCount = post.getViewCount();
        this.createDate = post.getCreateDate();
        this.category = post.getCategory();
    }

}
