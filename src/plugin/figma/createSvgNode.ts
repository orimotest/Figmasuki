let insertedSvgCount = 0;

type CreateSvgNodeOptions = {
  x?: number;
  y?: number;
  select?: boolean;
  zoom?: boolean;
};

export function createSvgNode(svg: string, name = "Generated SVG Layout", options: CreateSvgNodeOptions = {}): SceneNode {
  if (!svg.trim()) {
    throw new Error("SVG is empty.");
  }

  const node = figma.createNodeFromSvg(svg);
  node.name = name;
  const offset = insertedSvgCount * 36;
  node.x = options.x ?? figma.viewport.center.x - 400 + offset;
  node.y = options.y ?? figma.viewport.center.y - 225 + offset;
  insertedSvgCount += 1;
  figma.currentPage.appendChild(node);
  if (options.select !== false) {
    figma.currentPage.selection = [node];
  }
  if (options.zoom !== false) {
    figma.viewport.scrollAndZoomIntoView([node]);
  }
  return node;
}
