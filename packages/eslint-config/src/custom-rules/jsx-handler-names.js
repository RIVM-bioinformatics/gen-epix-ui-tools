export const jsxHandlerNames = (options = {}) => {
  const {
    checkInlineFunction = false,
    eventHandlerPrefix = 'handle',
    eventHandlerPropPrefix = 'on',
  } = options;
  const eventHandlerRegex = new RegExp(`^${eventHandlerPropPrefix}[A-Z]`);
  const handlerFuncRegex = new RegExp(`^${eventHandlerPrefix}[A-Z]`);

  return (context) => ({
    JSXAttribute: (node) => {
      if (node.name.type !== 'JSXIdentifier') {
        return;
      }

      const propName = node.name.name;

      if (!eventHandlerRegex.test(propName)) {
        return;
      }

      const value = node.value;

      if (!value || value.type !== 'JSXExpressionContainer') {
        return;
      }

      const expression = value.expression;

      if (expression.type === 'Identifier') {
        const handlerName = expression.name;

        if (!handlerFuncRegex.test(handlerName)) {
          context.report({
            message: `Handler function "${handlerName}" should be named "${eventHandlerPrefix}${propName.slice(eventHandlerPropPrefix.length)}...".`,
            node: expression,
          });
        }
        return;
      }

      if (checkInlineFunction
        && (expression.type === 'ArrowFunctionExpression' || expression.type === 'FunctionExpression')) {
        context.report({
          message: `Inline function handlers are not allowed for "${propName}". Extract it to a named "${eventHandlerPrefix}${propName.slice(eventHandlerPropPrefix.length)}" function.`,
          node: expression,
        });
      }
    },
  });
};
