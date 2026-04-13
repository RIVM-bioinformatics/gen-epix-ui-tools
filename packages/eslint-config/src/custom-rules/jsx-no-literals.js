export const jsxNoLiterals = (options = {}) => {
  const { allowedStrings = [], ignoreProps = true, noStrings = false } = options;
  const allowedSet = new Set(allowedStrings);
  return (context) => ({
    JSXText: (node) => {
      const text = node.value.trim();
      if (text === '' || allowedSet.has(text)) {
        return;
      }
      if (noStrings) {
        context.report({
          message: `String literals are not allowed as JSX children.`,
          node,
        });
      } else {
        context.report({
          message: `String literals should be wrapped in JSX expression: {'${text}'}`,
          node,
        });
      }
    },
    Literal: (node) => {
      if (typeof node.value !== 'string') {
        return;
      }
      const text = node.value.trim();
      if (text === '' || allowedSet.has(text)) {
        return;
      }
      const parent = node.parent;
      if (!parent) {
        return;
      }
      if (parent.type === 'JSXAttribute') {
        if (!ignoreProps) {
          context.report({
            message: `String literals are not allowed in JSX props. Use {'${text}'} instead.`,
            node,
          });
        }
        return;
      }
      if (parent.type === 'JSXExpressionContainer') {
        return;
      }
      if (parent.type === 'JSXElement' || parent.type === 'JSXFragment') {
        if (noStrings) {
          context.report({
            message: `String literals are not allowed as JSX children.`,
            node,
          });
        } else {
          context.report({
            message: `String literals should be wrapped in JSX expression: {'${text}'}`,
            node,
          });
        }
      }
    },
  });
};
