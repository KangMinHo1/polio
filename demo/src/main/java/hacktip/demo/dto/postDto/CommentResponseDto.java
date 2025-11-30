package hacktip.demo.dto.postDto;

import lombok.Getter;

import java.sql.Timestamp;

@Getter
public class CommentResponseDto {

    private Long commentId;
    private Long postId;
    private String authorName;
    private String content;
    private Timestamp createDate;

    public CommentResponseDto(Long commentId, Long postId, String authorName, String content, Timestamp createDate) {
        this.commentId = commentId;
        this.postId = postId;
        this.authorName = authorName;
        this.content = content;
        this.createDate = createDate;
    }
}
