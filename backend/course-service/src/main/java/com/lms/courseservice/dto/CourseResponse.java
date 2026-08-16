package com.lms.courseservice.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Long instructorId;
    private BigDecimal price;
    private Boolean published;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
