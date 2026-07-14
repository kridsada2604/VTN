export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={active ? "status-badge status-active" : "status-badge status-inactive"}>
      {active ? "ใช้งาน" : "ปิดใช้งาน"}
    </span>
  );
}
