/** Enforce PascalCase for user-defined JSX components. */
export const jsxPascalCase = (options = {}) => {
  const { allowAllCaps = false, allowLeadingUnderscore = false } = options;
  // Check PascalCase: first letter uppercase, rest can be mixed but no underscores
  const pascalCaseRegex = /^[A-Z][a-zA-Z0-9]*$/;
  return (context) => ({
    JSXOpeningElement: (node) => {
      const name = node.name;
      if (name.type !== 'JSXIdentifier') {
        return;
      }
      const componentName = name.name;
      // Check for leading underscore (before lowercase check since "_".toLowerCase() === "_")
      if (componentName.startsWith('_')) {
        if (!allowLeadingUnderscore) {
          context.report({
            message: `Component name "${componentName}" should not start with an underscore.`,
            node: name,
          });
        }
        return;
      }
      // Ignore DOM elements (lowercase first letter)
      const firstChar = componentName[0];
      if (firstChar === undefined) {
        return;
      }
      if (firstChar === firstChar.toLowerCase()) {
        return;
      }
      // Check for all caps
      if (componentName === componentName.toUpperCase()) {
        if (!allowAllCaps) {
          context.report({
            message: `Component name "${componentName}" should use PascalCase, not all uppercase.`,
            node: name,
          });
        }
        return;
      }
      if (!pascalCaseRegex.test(componentName)) {
        context.report({
          message: `Component name "${componentName}" should be in PascalCase.`,
          node: name,
        });
      }
    },
  });
};
