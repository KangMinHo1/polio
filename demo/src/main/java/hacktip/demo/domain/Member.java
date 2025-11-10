package hacktip.demo.domain;

import jakarta.persistence.*;
import lombok.*;

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

}
