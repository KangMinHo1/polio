package hacktip.demo.domain;

import hacktip.demo.domain.post.Post;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@AllArgsConstructor
@Table(name = "MEMBERS")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_MEMBERS_GENERATOR")
    @SequenceGenerator(
            name = "SEQ_MEMBERS_GENERATOR", // Java에서 사용할 제너레이터 이름
            sequenceName = "SEQ_MEMBERS",    // DB의 시퀀스 이름
            initialValue = 1,
            allocationSize = 1
    )
    @Column(name = "MEMBERID", nullable = false)
    private Long memberId;

    @Column(name = "EMAIL", nullable = false, unique = true) // 5. DDL의 컬럼 이름
    private String email;

    @Column(name = "PASSWORD", nullable = false)
    private String password;


    @Column(name = "NAME", nullable = false, unique = true)
    private String name;

    //@Enumerated는 **JPA(Java Persistence API)**에서 사용하는 애너테이션으로, enum 타입 필드를 데이터베이스에 저장할 때 어떻게 저장할지를 지정합니다.
    // 속성 값 의미 : Enum의 이름 자체를 문자열로 DB에 저장
    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE", nullable = false)
    private Role role;


    // cascade = ALL: 회원이 삭제되면 연결된 기술 스택 정보도 같이 삭제됨 (DB의 ON DELETE CASCADE와 맞춤)
    // orphanRemoval = true: 리스트에서 제거하면 DB에서도 삭제됨
    @Builder.Default
    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MemberStack> memberStacks = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Post> posts = new ArrayList<>();
}
