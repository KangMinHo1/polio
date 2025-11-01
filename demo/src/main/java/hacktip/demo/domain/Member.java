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
    // 1. 전략을 IDENTITY에서 SEQUENCE로 변경합니다.
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "MEMBER_SEQ_GENERATOR")
    // 2. 사용할 시퀀스 제너레이터를 정의합니다.
    @SequenceGenerator(
            name = "MEMBER_SEQ_GENERATOR",   // @GeneratedValue에서 사용할 제너레이터 이름
            sequenceName = "MEMBER_SEQ",      // DB에 생성될(또는 매핑될) 시퀀스 이름
            initialValue = 1,                 // 시퀀스 시작 값
            allocationSize = 1                // (중요) 시퀀스 한 번 호출에 1씩 증가
    )
    @Column(name = "USERID", nullable = false)
    private Long userId;

    @Column(name = "EMAIL", nullable = false)
    private String email;

    @Column(name = "PASSWORD", nullable = false)
    private String password;


    @Column(name ="NAME")
    private String name;

}
