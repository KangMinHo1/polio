package hacktip.demo.dto.postDto;

import hacktip.demo.domain.post.Post;
import lombok.Getter;

import java.sql.Timestamp;
import java.util.List;
import java.util.stream.Collectors;

@Getter //(게시물 목록 조회 응답)
public class PostSimpleResponseDto {

    private Long id;
    private String title;
    private String author;
    private int views;
    private Timestamp createDate;
    private String category;
    private int commentCount;
    private int likesCount;


    /**
     * 목록 조회용 DTO 변환 생성자
     */
    public PostSimpleResponseDto(Post post) {
        this.id = post.getPostId();
        this.title = post.getTitle();
        this.author = post.getMember().getName(); // (Lazy Loading 주의)
        this.views = post.getViewCount();
        this.createDate = post.getCreateDate();
        this.category = post.getCategory().getCategoryName();
        this.commentCount = post.getCommentCount(); // [성능 개선] @Formula 필드 사용
        this.likesCount = post.getLikesCount();

    }
}
