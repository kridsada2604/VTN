export function ReportUploadForm({ action }: { action: (fd: FormData) => void }) {
  return (
    <form action={action} className="card space-y-4 p-5">
      <h2 className="font-black">Register Upload</h2>
      <div className="form-grid">
        <label>
          <span className="label">Report type</span>
          <select className="input" name="report_type" defaultValue="SALE_OUT">
            <option value="SALE_IN">Sale In</option>
            <option value="SALE_OUT">Sale Out</option>
            <option value="INVENTORY">Inventory</option>
            <option value="MOI">MOI</option>
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
          <span className="label">File name</span>
          <input className="input" name="file_name" required placeholder="dealer-sale-out-july.xlsx" />
        </label>
        <label>
          <span className="label">File size bytes</span>
          <input className="input" type="number" min="0" name="file_size_bytes" />
        </label>
        <label>
          <span className="label">Storage bucket</span>
          <input className="input" name="storage_bucket" placeholder="report-imports" />
        </label>
        <label>
          <span className="label">Storage path</span>
          <input className="input" name="storage_path" placeholder="sale-out/2026/07/file.xlsx" />
        </label>
        <label className="full">
          <span className="label">Notes</span>
          <textarea className="input textarea" name="notes" />
        </label>
      </div>
      <button className="btn-primary">Register File</button>
    </form>
  );
}
