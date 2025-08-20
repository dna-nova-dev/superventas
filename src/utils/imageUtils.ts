
export const getDefaultImage = (
  type: 'producto' | 'usuario' | 'empresa' | 'cliente',
  name: string
): string => {

  let bgColor = '';
  switch (type) {
    case 'producto':
      bgColor = 'bg-blue-100';
      break;
    case 'usuario':
      bgColor = 'bg-green-100';
      break;
    case 'empresa':
      bgColor = 'bg-purple-100';
      break;
    case 'cliente':
      bgColor = 'bg-orange-100';
      break;
    default:
      bgColor = 'bg-gray-100';
  }
  
  // Get the first letter of the name for initials
  const initials = name.charAt(0).toUpperCase();
  
  // Return a data URL for an SVG
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23${bgColor.replace('bg-', '').replace('-100', '')}" /><text x="50" y="50" font-family="Arial" font-size="35" fill="%23555" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
};

// Function to check if an image exists and return a placeholder if it doesn't
export const getImageSrc = (
  imagePath: string | undefined,
  type: 'producto' | 'usuario' | 'empresa' | 'cliente',
  name: string
): string => {
  if (!imagePath || imagePath === '') {
    return getDefaultImage(type, name);
  }
  
  // Check if the image path is absolute (has http/https)
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // For a real app, you would handle image paths properly
  // For demo, we'll return a placeholder
  return getDefaultImage(type, name);
};
