const inlineElements = new Set([
  'a',
  'abbr',
  'acronym',
  'b',
  'bdi',
  'bdo',
  'big',
  'br',
  'cite',
  'code',
  'dfn',
  'em',
  'i',
  'img',
  'input',
  'kbd',
  'label',
  'map',
  'object',
  'q',
  'samp',
  'script',
  'select',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'textarea',
  'time',
  'tt',
  'var',
]);

export const noAdjacentInlineElements = () => {
  return (context) => ({
    JSXElement: (node) => {
      const children = node.children;

      for (let index = 0; index < children.length - 1; index += 1) {
        const current = children[index];
        const next = children[index + 1];

        if (current?.type !== 'JSXElement' || current.openingElement.name.type !== 'JSXIdentifier') {
          continue;
        }

        const currentName = current.openingElement.name.name;

        if (!inlineElements.has(currentName)) {
          continue;
        }

        if (next?.type !== 'JSXElement' || next.openingElement.name.type !== 'JSXIdentifier') {
          continue;
        }

        const nextName = next.openingElement.name.name;

        if (!inlineElements.has(nextName)) {
          continue;
        }

        context.report({
          message: `Adjacent inline elements "${currentName}" and "${nextName}" should be separated by whitespace.`,
          node: current,
        });
      }
    },
  });
};
