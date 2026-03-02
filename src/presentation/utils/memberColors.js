// Stable color palette for member badges.
// Each entry has a light background and a dark text/border color.
export const MEMBER_COLORS = [
  { bg: '#dbeafe', text: '#1e40af' }, // blue
  { bg: '#dcfce7', text: '#166534' }, // green
  { bg: '#fef3c7', text: '#92400e' }, // amber
  { bg: '#fce7f3', text: '#9d174d' }, // pink
  { bg: '#e0e7ff', text: '#3730a3' }, // indigo
  { bg: '#f3e8ff', text: '#6b21a8' }, // purple
  { bg: '#ccfbf1', text: '#115e59' }, // teal
  { bg: '#fee2e2', text: '#991b1b' }, // red
  { bg: '#ffedd5', text: '#9a3412' }, // orange
  { bg: '#ecfccb', text: '#3f6212' }, // lime
]

// Returns a color object for a member.
// If colorIndex is a valid index, use it; otherwise fall back to a UID-based hash.
export function getMemberColor(uid, colorIndex) {
  if (colorIndex != null && colorIndex >= 0 && colorIndex < MEMBER_COLORS.length) {
    return MEMBER_COLORS[colorIndex]
  }
  let hash = 0
  for (let i = 0; i < uid.length; i++) {
    hash = ((hash << 5) - hash + uid.charCodeAt(i)) | 0
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length]
}
