export const jsxPropsNoSpreading = () => {
  return (context) => ({
    JSXSpreadAttribute: (node) => {
      context.report({
        message: 'Props spreading is not allowed.',
        node,
      });
    },
  });
};
