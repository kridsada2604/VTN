export function ReportUploadForm({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card space-y-4 p-5">
      <h2 className="font-black">Upload Report File</h2>
      <div className="form-grid">
        <label>
          <span className="label">Report type</span>
          <select className="input" name="report_type" defaultValue="SALE_OUT">
            <option value="SALE_IN">Sale In</option>
            <option value="SALE_OUT">Sale Out</option>
            <option value="INVENTORY">Inventory</option>
            <option value="MOI">MOI - Month of Inventory</option>
            <option value="RUNRATE">Runrate</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>
          <span className="label">Source</span>
          <input className="input" name="source_name" required placeholder="Dealer, marketplace, warehouse, or team" />
        </label>
        <label>
          <span className="label">Period start</span>
          <input className="input" type="date" name="period_start" />
        </label>
        <label>
          <span className="label">Period end</span>
          <input className="input" type="date" name="period_end" />
        </label>
        <label>
          <span className="label">File</span>
          <input className="input" type="file" name="file" required accept=".csv,.xlsx,.xls,.txt,.json" />
        </label>
        <label className="full">
          <span className="label">Notes</span>
          <textarea className="input textarea" name="notes" />
        </label>
      </div>
      <button className="btn-primary">Upload File</button>
    </form>
  );
}
