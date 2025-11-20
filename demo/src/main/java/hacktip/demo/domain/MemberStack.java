package hacktip.demo.domain;

import hacktip.demo.service.MemberService;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "MEMBER_STACK",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"MEMBERID", "STACKID"})// DB의 uq_member_stack 제약조건 반영
        }
)
public class MemberStack {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_MEMBER_STACK_GENERATOR")
    @SequenceGenerator(
            name = "SEQ_MEMBER_STACK_GENERATOR",
            sequenceName = "SEQ_MEMBER_STACK",
            initialValue = 1,
            allocationSize = 1
    )
    @Column(name = "MEMBERSTACKID")
    private Long memberStackId;

    // Member(1) : MemberStack(N)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBERID", nullable = false)
    private Member member;

    // TechStack(1) : MemberStack(N)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "STACKID", nullable = false)
    private TechStack techStack;

    @Builder
    public MemberStack(Member member, TechStack techStack){
        this.member = member;
        this.techStack = techStack;
    }

}
