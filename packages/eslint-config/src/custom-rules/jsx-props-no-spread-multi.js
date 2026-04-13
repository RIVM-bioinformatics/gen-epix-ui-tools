export const jsxPropsNoSpreadMulti = () => {
  return (context) => ({
    JSXOpeningElement: (node) => {
      const seen = new Set();
      for (const attr of node.attributes) {
        if (attr.type !== 'JSXSpreadAttribute') {
          continue;
        }
        let spreadKey;
        if (attr.argument.type === 'Identifier') {
          spreadKey = attr.argument.name;
        } else {
          spreadKey = context.sourceCode.getText(attr.argument);
        }
        if (seen.has(spreadKey)) {
          context.report({
            message: `Spreading the same expression "${spreadKey}" multiple times is not allowed.`,
            node: attr,
          });
        } else {
          seen.add(spreadKey);
        }
      }
    },
  });
};
