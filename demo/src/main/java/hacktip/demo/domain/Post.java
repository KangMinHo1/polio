package hacktip.demo.domain;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "POST")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_POST_GENERATOR")
    @SequenceGenerator(
            name = "SEQ_POST_GENERATOR",
            sequenceName = "SEQ_POST",
            initialValue = 1,
            allocationSize = 1
    )
    @Column(name = "POSTID")
    private long postId;

    // 5. (중요) 작성자 연관관계 (Post(N) : Member(1))
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBERID", nullable = false)
    private Member member;

    @Column(name = "TITLE", nullable = false, length = 200)
    private String title;

    @Lob // 7. (중요) DDL의 CLOB 타입 매핑
    @Column(name = "CONTENT", nullable = false)
    private String content;

    @Column(name = "VIEWCOUNT")
    private int viewCount = 0; // 8. (JPA) DDL의 DEFAULT 0을 엔티티 레벨에서 초기화

    @CreationTimestamp
    @Column(name = "CREATEDATE", nullable = false, updatable = false)
    private Timestamp createDate;

    @Column(name = "CATEGORY", length = 50)
    private String category;

    @Builder
    public Post(Member member, String title, String content, String category){
        this.member = member;
        this.title = title;
        this.content = content;
        this.category = category;
    }

    // 게시글 수정 매서드 (서비스 로직용)
    public void update(String title, String content, String category){
        this.title = title;
        this.content = content;
        this.category = category;
    }

    // 조회수 증가 매서드 (서비스 로직용)
    public void increaseViewCount(){
        this.viewCount++;
    }
}
