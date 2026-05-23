import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { buildTree, flattenTree } from '../utils/tree';

export function useFolders() {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/folders');
      setFolders(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się pobrać folderów.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  async function createFolder(payload) {
    const response = await api.post('/folders', payload);
    setFolders((current) => [...current, response.data]);
    return response.data;
  }

  async function updateFolder(folderId, payload) {
    const response = await api.patch(`/folders/${folderId}`, payload);
    setFolders((current) => current.map((folder) => (folder.id === folderId ? response.data : folder)));
    return response.data;
  }

  async function moveFolder(folderId, parentId) {
    const response = await api.patch(`/folders/${folderId}/move`, { parent_id: parentId });
    setFolders((current) => current.map((folder) => (folder.id === folderId ? response.data : folder)));
    return response.data;
  }

  async function deleteFolder(folderId) {
    await api.delete(`/folders/${folderId}`);
    const removeIds = new Set([folderId]);
    let changed = true;

    while (changed) {
      changed = false;
      folders.forEach((folder) => {
        if (folder.parent_id && removeIds.has(folder.parent_id) && !removeIds.has(folder.id)) {
          removeIds.add(folder.id);
          changed = true;
        }
      });
    }

    setFolders((current) => current.filter((folder) => !removeIds.has(folder.id)));
  }

  const tree = useMemo(() => buildTree(folders), [folders]);
  const flatFolders = useMemo(() => flattenTree(tree), [tree]);

  return {
    folders,
    tree,
    flatFolders,
    loading,
    error,
    fetchFolders,
    createFolder,
    updateFolder,
    moveFolder,
    deleteFolder,
  };
}

