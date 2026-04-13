import { merge } from '@eslint-react/kit';

export const functionComponentDefinition = () => {
  return (context, { collect, hint }) => {
    const { query, visitor } = collect.components(context, {
      hint: hint.component.Default & ~hint.component.DoNotIncludeFunctionDefinedAsObjectMethod,
    });

    return merge(visitor, {
      'Program:exit': (program) => {
        for (const { node } of query.all(program)) {
          if (node.type === 'ArrowFunctionExpression') {
            continue;
          }

          context.report({
            message: 'Function components must be defined with arrow functions.',
            node,
            suggest: [
              {
                desc: 'Convert to arrow function.',
                fix: (fixer) => {
                  const src = context.sourceCode;

                  if (node.generator) {
                    return null;
                  }

                  const prefix = node.async ? 'async ' : '';
                  const typeParams = node.typeParameters ? src.getText(node.typeParameters) : '';
                  const params = `(${node.params.map((parameter) => src.getText(parameter)).join(', ')})`;
                  const returnType = node.returnType ? src.getText(node.returnType) : '';
                  const body = src.getText(node.body);

                  if (node.type === 'FunctionDeclaration' && node.id) {
                    return fixer.replaceText(node, `const ${node.id.name} = ${prefix}${typeParams}${params}${returnType} => ${body};`);
                  }

                  if (node.type === 'FunctionExpression' && node.parent.type === 'VariableDeclarator') {
                    return fixer.replaceText(node, `${prefix}${typeParams}${params}${returnType} => ${body}`);
                  }

                  if (node.type === 'FunctionExpression' && node.parent.type === 'Property') {
                    return fixer.replaceText(node.parent, `${src.getText(node.parent.key)}: ${prefix}${typeParams}${params}${returnType} => ${body}`);
                  }

                  return null;
                },
              },
            ],
          });
        }
      },
    });
  };
};
