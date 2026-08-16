package com.lms.enrollmentservice.dto;

import lombok.*;
import java.math.BigDecimal;

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
}
