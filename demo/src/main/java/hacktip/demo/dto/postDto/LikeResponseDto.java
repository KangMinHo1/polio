package hacktip.demo.dto.postDto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LikeResponseDto {

    private int likesCount;
    private boolean isLiked;


}
