package hacktip.demo.dto.postDto;

import hacktip.demo.domain.Post;
import lombok.Getter;

import java.sql.Timestamp;

@Getter //(게시물 목록 조회 응답)
public class PostSimpleResponseDto {

    private Long postId;
    private String title;
    private String writerName;
    private int viewCount;
    private Timestamp createDate;
    private String category;

    /**
     * 목록 조회용 DTO 변환 생성자
     */
    public PostSimpleResponseDto(Post post) {
        this.postId = post.getPostId();
        this.title = post.getTitle();
        this.writerName = post.getMember().getName(); // (Lazy Loading 주의)
        this.viewCount = post.getViewCount();
        this.createDate = post.getCreateDate();
        this.category = post.getCategory();
    }
}
