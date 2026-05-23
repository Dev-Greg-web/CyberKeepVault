import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

export function useItems(activeFolderId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    if (!activeFolderId) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/folders/${activeFolderId}/items`);
      setItems(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Nie udało się pobrać wpisów.');
    } finally {
      setLoading(false);
    }
  }, [activeFolderId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function createItem(payload) {
    const response = await api.post(`/folders/${activeFolderId}/items`, payload);
    setItems((current) => [response.data, ...current]);
    return response.data;
  }

  async function updateItem(itemId, payload) {
    const response = await api.patch(`/items/${itemId}`, payload);
    setItems((current) => current.map((item) => (item.id === itemId ? response.data : item)));
    return response.data;
  }

  async function deleteItem(itemId) {
    await api.delete(`/items/${itemId}`);
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  return { items, loading, error, fetchItems, createItem, updateItem, deleteItem };
}

