export function validateSearch(name: string): string | null {
  const query = name.trim();
  if (!query) return 'Digite o nome de uma cidade.';
  if ([...query].length > 100) return 'A busca deve ter até 100 caracteres.';
  return null;
}
