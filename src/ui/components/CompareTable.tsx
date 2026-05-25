import type { ComparisonResult } from "../../schemas/comparison";
import { EmptyState } from "./EmptyState";

type CompareTableProps = {
  result?: ComparisonResult;
};

export function CompareTable({ result }: CompareTableProps) {
  if (!result) {
    return (
      <EmptyState
        title={"\u6bd4\u8f03\u7d50\u679c\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093"}
        body={"Figma\u4e0a\u3067\u6bd4\u8f03\u3057\u305f\u3044\u6848\u30922\u304b\u30895\u500b\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002"}
      />
    );
  }

  return (
    <div className="compare-table-wrap nice-scrollbar scroll-fade-bottom">
      <table className="compare-table">
        <thead>
          <tr>
            <th>{"\u6848"}</th>
            <th>{"\u5f79\u5272"}</th>
            <th>{"\u5411\u3044\u3066\u3044\u308b\u7528\u9014"}</th>
            <th>{"\u5f37\u307f"}</th>
            <th>{"\u61f8\u5ff5"}</th>
          </tr>
        </thead>
        <tbody>
          {result.frameRoles.map((role) => (
            <tr key={role.frameId}>
              <td>{role.frameName}</td>
              <td>{role.role}</td>
              <td>{role.bestFor}</td>
              <td>{role.strength}</td>
              <td>{role.risk}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
