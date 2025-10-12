'use client';

export const copyJsonToClipboard = async (
  content: string,
  showToast?: (title: string, description: string, variant?: string) => void
): Promise<boolean> => {
  if (!content) return false;

  try {
    await navigator.clipboard.writeText(content);
    showToast?.('Copied', 'JSON copied to clipboard');
    return true;
  } catch {
    showToast?.('Error', 'Failed to copy to clipboard', 'destructive');
    return false;
  }
};

export const copyShareLinkToClipboard = async (
  shareId: string,
  showToast?: (title: string, description: string, variant?: string) => void
): Promise<boolean> => {
  if (!shareId) return false;

  const url = `${window.location.origin}/library/${shareId}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast?.('Link copied', 'Share link copied to clipboard');
    return true;
  } catch {
    showToast?.('Error', 'Failed to copy link', 'destructive');
    return false;
  }
};

export const downloadJson = (
  content: string,
  filename?: string,
  showToast?: (title: string, description: string, variant?: string) => void
): boolean => {
  if (!content) return false;

  try {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `json-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast?.('Downloaded', 'JSON file downloaded successfully');
    return true;
  } catch {
    showToast?.('Error', 'Failed to download JSON', 'destructive');
    return false;
  }
};

export const validateJson = (text: string): boolean => {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

export const formatJson = (text: string): string | null => {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return null;
  }
};
