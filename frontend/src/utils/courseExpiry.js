/**
 * Utility to calculate days left until a course enrollment expires.
 * @param {Object} enrollment The enrollment record ({ enrolledAt, enrollmentDate, createdAt, ... })
 * @param {Object} course The course record ({ duration, ... })
 * @returns {number|null} Days remaining (positive = active, 0 = expires today, negative = expired), or null if invalid.
 */
export const calculateDaysLeft = (enrollment, course) => {
  if (!enrollment) return null;

  // 1. Get enrollment timestamp
  const startDate = enrollment.enrolledAt || enrollment.enrollmentDate || enrollment.createdAt;
  const start = startDate ? new Date(startDate) : new Date();

  // 2. Extract duration in months (default 3 months if not specified)
  let months = 3;
  if (course && course.duration) {
    const match = course.duration.match(/(\d+(\.\d+)?)/);
    if (match) {
      months = parseFloat(match[1]);
    }
  }

  // 3. Compute expiry date
  const expiryDate = new Date(start);
  expiryDate.setMonth(expiryDate.getMonth() + Math.round(months));

  const fractionalMonths = months - Math.floor(months);
  if (fractionalMonths > 0) {
    expiryDate.setDate(expiryDate.getDate() + Math.round(fractionalMonths * 30));
  }

  // 4. Calculate diff in calendar days
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Checks if a course was completed by the student (100% progress or quiz passed).
 * Completed courses earn permanent lifetime shelf access and never expire.
 */
export const isCourseCompleted = (enrollment) => {
  if (!enrollment) return false;
  if ((enrollment.progressPercentage || 0) >= 100) return true;
  if (typeof localStorage !== "undefined" && localStorage.getItem(`quiz_passed_${enrollment.id}`)) {
    return true;
  }
  return false;
};

/**
 * Checks if an enrollment is currently active and not expired.
 * Completed courses are always active & permanent.
 */
export const isEnrollmentActiveAndValid = (enrollment, course) => {
  if (!enrollment || enrollment.status !== "ACTIVE") return false;
  if (isCourseCompleted(enrollment)) return true;
  const daysLeft = calculateDaysLeft(enrollment, course);
  return daysLeft !== null ? daysLeft >= 0 : true;
};
