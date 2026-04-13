export const jsxNoBind = (options = {}) => {
  const {
    allowArrowFunctions = false,
    allowBind = false,
    allowFunctions = false,
    ignoreRefs = false,
    requireUseCallback = true,
  } = options;

  const isBindCall = (node) => {
    return node.type === 'CallExpression'
      && node.callee.type === 'MemberExpression'
      && node.callee.property.type === 'Identifier'
      && node.callee.property.name === 'bind';
  };

  const isUseCallbackCall = (node) => {
    if (node.type !== 'CallExpression') {
      return false;
    }

    if (node.callee.type === 'Identifier') {
      return node.callee.name === 'useCallback';
    }

    return node.callee.type === 'MemberExpression'
      && node.callee.property.type === 'Identifier'
      && node.callee.property.name === 'useCallback';
  };

  const findNearestFunction = (node) => {
    let current = node.parent;

    while (current) {
      if (current.type === 'ArrowFunctionExpression'
        || current.type === 'FunctionDeclaration'
        || current.type === 'FunctionExpression') {
        return current;
      }

      current = current.parent;
    }

    return null;
  };

  const isNodeWithin = (node, ancestor) => {
    if (!ancestor) {
      return false;
    }

    let current = node;

    while (current) {
      if (current === ancestor) {
        return true;
      }

      current = current.parent;
    }

    return false;
  };

  const findVariable = (scope, name) => {
    let currentScope = scope;

    while (currentScope) {
      const variable = currentScope.set.get(name);

      if (variable) {
        return variable;
      }

      currentScope = currentScope.upper;
    }

    return null;
  };

  const resolvesToNonMemoizedFunction = (expression, componentFunction, sourceCode, seenNames = new Set()) => {
    if (expression.type !== 'Identifier') {
      return false;
    }

    if (seenNames.has(expression.name)) {
      return false;
    }

    seenNames.add(expression.name);

    const variable = findVariable(sourceCode.getScope(expression), expression.name);

    if (!variable || variable.defs.length === 0) {
      return false;
    }

    const [definition] = variable.defs;

    if (definition.type === 'ImportBinding') {
      return false;
    }

    if (definition.type === 'FunctionName') {
      return isNodeWithin(definition.node, componentFunction);
    }

    if (definition.type !== 'Variable' || !isNodeWithin(definition.node, componentFunction)) {
      return false;
    }

    const initializer = definition.node.init;

    if (!initializer) {
      return false;
    }

    if (isUseCallbackCall(initializer)) {
      return false;
    }

    if (isBindCall(initializer)) {
      return true;
    }

    if (initializer.type === 'ArrowFunctionExpression' || initializer.type === 'FunctionExpression') {
      return true;
    }

    if (initializer.type === 'Identifier') {
      return resolvesToNonMemoizedFunction(initializer, componentFunction, sourceCode, seenNames);
    }

    return false;
  };

  return (context) => ({
    JSXAttribute: (node) => {
      if (ignoreRefs && node.name.type === 'JSXIdentifier' && node.name.name === 'ref') {
        return;
      }

      const value = node.value;

      if (value?.type !== 'JSXExpressionContainer') {
        return;
      }

      if ((!allowArrowFunctions && value.expression.type === 'ArrowFunctionExpression')
        || (!allowFunctions && value.expression.type === 'FunctionExpression')) {
        context.report({
          message: 'JSX props should not use inline functions; wrap the callback in useCallback.',
          node,
        });
        return;
      }

      if (!allowBind && isBindCall(value.expression)) {
        context.report({
          message: 'JSX props should not use .bind(); wrap the callback in useCallback instead.',
          node,
        });
        return;
      }

      if (!requireUseCallback || value.expression.type !== 'Identifier') {
        return;
      }

      const componentFunction = findNearestFunction(node);

      if (!componentFunction) {
        return;
      }

      if (resolvesToNonMemoizedFunction(value.expression, componentFunction, context.sourceCode)) {
        context.report({
          message: `JSX prop function "${value.expression.name}" should be wrapped in useCallback.`,
          node,
        });
      }
    },
  });
};
