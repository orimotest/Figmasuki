let insertedSvgCount = 0;

export function createSvgNode(svg: string, name = "Generated SVG Layout"): SceneNode {
  if (!svg.trim()) {
    throw new Error("SVG is empty.");
  }

  const node = figma.createNodeFromSvg(svg);
  node.name = name;
  const offset = insertedSvgCount * 36;
  node.x = figma.viewport.center.x - 400 + offset;
  node.y = figma.viewport.center.y - 225 + offset;
  insertedSvgCount += 1;
  figma.currentPage.appendChild(node);
  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
  return node;
}
