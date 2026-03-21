import { apiClient } from './client';

export async function deleteAccount(password: string): Promise<void> {
  await apiClient.delete('/account', { data: { password } });
}

export async function exportMyData(): Promise<void> {
  const response = await apiClient.get('/account/export', {
    responseType: 'blob',
  });
  const blob = new Blob([response.data as BlobPart], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'agroconnect-dados.json';
  link.click();
  URL.revokeObjectURL(url);
}
