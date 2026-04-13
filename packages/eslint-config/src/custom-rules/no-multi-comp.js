import { merge } from '@eslint-react/kit';

export const noMultiComp = () => {
  return (context, { collect }) => {
    const { query, visitor } = collect.components(context);

    return merge(visitor, {
      'Program:exit': (program) => {
        const components = query.all(program);

        for (const { name, node } of components.slice(1)) {
          context.report({
            message: `Declare only one component per file. Found extra component "${name ?? 'anonymous'}".`,
            node,
          });
        }
      },
    });
  };
};
