package hacktip.demo.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "TECH_STACK")
public class TechStack {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_TECH_STACK_GENERATOR")
    @SequenceGenerator(
            name = "SEQ_TECH_STACK_GENERATOR",
            sequenceName = "SEQ_TECH_STACK",
            initialValue = 1,
            allocationSize = 1
    )
    @Column(name = "STACKID")
    private Long stackId;

    @Column(name = "STACKNAME", nullable = false, unique = true)
    private String stackName;

    //생성자
    public TechStack(String stackName) {
        this.stackName = stackName;
    }
}
