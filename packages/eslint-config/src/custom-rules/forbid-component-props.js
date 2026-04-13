export const forbidComponentProps = (options = {}) => {
  const { forbidden = [] } = options;

  return (context) => ({
    JSXAttribute: (node) => {
      const propName = node.name.type === 'JSXIdentifier' ? node.name.name : null;

      if (propName === null || !forbidden.includes(propName)) {
        return;
      }

      const parent = node.parent;

      if (parent?.type !== 'JSXOpeningElement') {
        return;
      }

      const elemName = parent.name.type === 'JSXIdentifier' ? parent.name.name : null;
      const firstChar = elemName?.[0];

      if (firstChar === undefined || firstChar !== firstChar.toUpperCase()) {
        return;
      }

      context.report({
        message: `Prop "${propName}" is forbidden on components.`,
        node,
      });
    },
  });
};
