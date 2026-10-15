// First neutral male frame: opaque head y=5, sole y=590 in a 496×608 image.
// Preserve the requested 5cm downward placement, but put the head at 183cm
// above the scene floor. Frame padding must not count as person height.
export const MALE_DROP_CM = 5;
export const MALE_CM_PER_PIXEL = (183 + MALE_DROP_CM) / (590 - 5);
