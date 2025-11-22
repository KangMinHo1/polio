package hacktip.demo.domain.post;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "CATEGORY")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "SEQ_CATEGORY_GENERATOR")
    @SequenceGenerator(name = "SEQ_CATEGORY_GENERATOR", sequenceName = "SEQ_CATEGORY", initialValue = 1, allocationSize = 1)
    @Column(name = "CATEGORYID")
    private Long categoryId;

    @Column(name = "CATEGORYNAME", nullable = false, unique = true)
    private String categoryName;

    public Category(String categoryName) {
        this.categoryName = categoryName;
    }
}
