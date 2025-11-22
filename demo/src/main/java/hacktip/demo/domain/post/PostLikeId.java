package hacktip.demo.domain.post;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@NoArgsConstructor
@EqualsAndHashCode
public class PostLikeId implements Serializable {
    private Long post;   // PostLike 엔티티의 'post' 필드명과 일치해야 함
    private Long member; // PostLike 엔티티의 'member' 필드명과 일치해야 함
}