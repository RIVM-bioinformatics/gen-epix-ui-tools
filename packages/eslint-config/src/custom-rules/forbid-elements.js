export const forbidElements = (options = {}) => {
  const { forbidden = new Map() } = options;

  return (context) => ({
    JSXOpeningElement: (node) => {
      const name = node.name.type === 'JSXIdentifier' ? node.name.name : null;

      if (name !== null && forbidden.has(name)) {
        context.report({
          message: forbidden.get(name),
          node,
        });
      }
    },
  });
};
