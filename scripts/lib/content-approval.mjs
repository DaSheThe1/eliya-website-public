export function authorizedContentApprovalSource(
  brief,
  { owner, sourceKind, sourceReference },
) {
  if (!brief.project.owners.includes(owner)) {
    throw new Error(
      `Content approver must be one of project.owners: ${brief.project.owners.join(", ")}.`,
    );
  }
  const approvedAuthority = brief.content.authority.find(
    (source) =>
      source.kind === sourceKind &&
      source.reference === sourceReference &&
      source.kind !== "placeholder" &&
      source.kind !== "agent-derived",
  );
  if (!approvedAuthority) {
    throw new Error(
      "Content approval source must exactly match a non-placeholder content.authority entry.",
    );
  }
  return approvedAuthority;
}
