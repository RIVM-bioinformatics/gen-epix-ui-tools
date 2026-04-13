export const jsxNoDuplicateProps = (options = {}) => {
  const { ignoreCase = false } = options;

  return (context) => ({
    JSXOpeningElement: (node) => {
      const seen = new Map();

      for (const attr of node.attributes) {
        if (attr.type !== 'JSXAttribute' || attr.name.type !== 'JSXIdentifier') {
          continue;
        }

        const name = ignoreCase ? attr.name.name.toLowerCase() : attr.name.name;

        if (seen.has(name)) {
          context.report({
            message: `Duplicate prop "${attr.name.name}" found.`,
            node: attr,
          });
        } else {
          seen.set(name, attr.name.name);
        }
      }
    },
  });
};
