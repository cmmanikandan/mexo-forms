import { useEffect } from 'react';

export const useDocumentTitle = (title: string, prefixAppName = true) => {
  useEffect(() => {
    const defaultTitle = 'MEXO Forms — Create. Collect. Understand.';
    if (!title) {
      document.title = defaultTitle;
      return;
    }
    document.title = prefixAppName ? `${title} — MEXO Forms` : title;

    return () => {
      document.title = defaultTitle;
    };
  }, [title, prefixAppName]);
};
