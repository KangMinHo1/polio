package hacktip.demo.dto;

import hacktip.demo.domain.post.PostComment;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class CommentResponseDto {
    private final Long commentId;
    private final String contents;
    private final String authorName; // 작성자 닉네임
    private final LocalDateTime createDate;
    private final Long postId;

    // Entity를 DTO로 변환하는 생성자
    public CommentResponseDto(PostComment comment) {
        this.commentId = comment.getCommentId();
        this.contents = comment.getContents();
        this.authorName = comment.getMember().getName(); // Member 엔티티에서 이름을 가져옴
        this.createDate = comment.getCreateDate();
        this.postId = comment.getPost().getPostId();
    }
}