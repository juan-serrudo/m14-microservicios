/**
 * Convierte un nombre a mayusculas y reemplaza los guiones(-) por espacios
 * @param name
 * @returns
 */
export const nameParsePresentation = (name: string): string => {
  return name.toUpperCase().replace(/-/g, ' ');
};
