export const jsxMaxDepth = (options = {}) => {
  const { max = 3 } = options;

  return (context) => ({
    JSXElement: (node) => {
      let depth = 0;
      let parent = node.parent;

      while (parent) {
        if (parent.type === 'JSXElement') {
          depth += 1;
        }

        parent = parent.parent;
      }

      if (depth > max) {
        context.report({
          message: `JSX element exceeds maximum depth of ${max} (found ${depth}).`,
          node,
        });
      }
    },
  });
};
