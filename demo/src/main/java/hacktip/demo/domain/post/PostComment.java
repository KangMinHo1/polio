package hacktip.demo.domain.post;

import hacktip.demo.domain.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "POST_COMMENT")
public class PostComment {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_COMMENT_GENERATOR")
    @SequenceGenerator(
            name = "SEQ_COMMENT_GENERATOR",
            sequenceName = "SEQ_COMMENT",
            initialValue = 1,
            allocationSize = 1
    )
    @Column(name = "COMMENTID")
    private Long commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POSTID", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBERID", nullable = false)
    private Member member;

    @Lob
    @Column(name = "CONTENTS", nullable = false)
    private String contents;

    @CreationTimestamp
    @Column(name = "CREATEDATE", nullable = false, updatable = false)
    private LocalDateTime createDate;

    @Builder
    public PostComment(Post post, Member member, String contents) {
        this.post = post;
        this.member = member;
        this.contents = contents;
    }

    // 댓글 내용 수정을 위한 편의 메서드
    public void update(String contents) {
        this.contents = contents;
    }
}