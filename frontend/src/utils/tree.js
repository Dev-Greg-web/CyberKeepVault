export function buildTree(folders) {
  const byId = new Map();
  const roots = [];

  folders.forEach((folder) => {
    byId.set(folder.id, { ...folder, children: [] });
  });

  byId.forEach((folder) => {
    if (folder.parent_id && byId.has(folder.parent_id)) {
      byId.get(folder.parent_id).children.push(folder);
    } else {
      roots.push(folder);
    }
  });

  const sortByOrderThenName = (a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return a.name.localeCompare(b.name, 'pl');
  };

  const sortNode = (node) => {
    node.children.sort(sortByOrderThenName);
    node.children.forEach(sortNode);
  };

  roots.sort(sortByOrderThenName);
  roots.forEach(sortNode);
  return roots;
}

export function getDescendantIds(folders, folderId) {
  const result = new Set();
  const queue = folders.filter((folder) => folder.parent_id === folderId).map((folder) => folder.id);

  while (queue.length) {
    const id = queue.shift();
    result.add(id);
    folders
      .filter((folder) => folder.parent_id === id)
      .forEach((folder) => queue.push(folder.id));
  }

  return result;
}

export function flattenTree(nodes, level = 0) {
  return nodes.flatMap((node) => [
    { ...node, level },
    ...flattenTree(node.children || [], level + 1),
  ]);
}

