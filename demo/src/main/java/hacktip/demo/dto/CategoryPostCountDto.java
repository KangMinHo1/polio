package hacktip.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CategoryPostCountDto {
    private String category;
    private long count;
}