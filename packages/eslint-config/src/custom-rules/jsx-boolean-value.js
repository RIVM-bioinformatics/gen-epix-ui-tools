export const jsxBooleanValue = () => {
  return (context) => ({
    JSXAttribute: (node) => {
      const { value } = node;

      if (value?.type !== 'JSXExpressionContainer') {
        return;
      }

      if (value.expression.type !== 'Literal' || value.expression.value !== true) {
        return;
      }

      context.report({
        fix: (fixer) => fixer.removeRange([node.name.range[1], value.range[1]]),
        message: 'Omit the value for boolean attributes.',
        node,
      });
    },
  });
};
