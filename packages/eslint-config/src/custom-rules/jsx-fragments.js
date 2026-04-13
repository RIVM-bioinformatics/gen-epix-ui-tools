export const jsxFragments = (options = {}) => {
  const { mode = 'syntax' } = options;

  return (context) => {
    const reportSyntaxPreferred = (node, pattern) => {
      const hasAttributes = node.attributes.length > 0;

      if (hasAttributes) {
        return;
      }

      context.report({
        fix: (fixer) => {
          const closing = node.parent?.closingElement;

          if (!closing) {
            return null;
          }

          return [
            fixer.replaceText(node, '<>'),
            fixer.replaceText(closing, '</>'),
          ];
        },
        message: `Use shorthand fragment syntax '<>...</>' instead of '<${pattern}>...</${pattern}>'.`,
        node,
      });
    };

    return {
      JSXFragment: (node) => {
        if (mode !== 'element') {
          return;
        }

        context.report({
          fix: (fixer) => {
            return [
              fixer.replaceText(node.openingFragment, '<React.Fragment>'),
              fixer.replaceText(node.closingFragment, '</React.Fragment>'),
            ];
          },
          message: "Use '<React.Fragment>...</React.Fragment>' instead of shorthand '<>...</>'.",
          node,
        });
      },
      JSXOpeningElement: (node) => {
        const name = node.name;

        if (name.type === 'JSXIdentifier' && name.name === 'Fragment') {
          if (mode === 'syntax') {
            reportSyntaxPreferred(node, 'Fragment');
          }
          return;
        }

        if (name.type !== 'JSXMemberExpression') {
          return;
        }

        if (name.object.type !== 'JSXIdentifier' || name.object.name !== 'React') {
          return;
        }

        if (name.property.type !== 'JSXIdentifier' || name.property.name !== 'Fragment') {
          return;
        }

        if (mode === 'syntax') {
          reportSyntaxPreferred(node, 'React.Fragment');
        }
      },
    };
  };
};
