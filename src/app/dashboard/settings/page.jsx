// app/dashboard/settings/page.jsx
"use client"
const DashboardSettings = () => (
    <div className="fade-in">
        <div className="dashboard-card-header">
            <div>
                <h1 className="dashboard-card-title">Settings</h1>
                <p className="dashboard-card-subtitle">Configure your application settings</p>
            </div>
        </div>

        <div className="dashboard-card">
            <div className="dashboard-form">
                <div className="form-group">
                    <label className="form-label">Site Name</label>
                    <input type="text" className="form-input" placeholder="Enter site name" />
                </div>

                <div className="form-group">
                    <label className="form-label">Site Description</label>
                    <textarea className="form-textarea" placeholder="Enter site description"></textarea>
                </div>

                <div className="form-group">
                    <label className="form-label">Email Notifications</label>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="email-notifications" className="form-checkbox" />
                        <label htmlFor="email-notifications" className="text-sm text-slate-300">
                            Enable email notifications
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <button className="button primary">Save Settings</button>
                </div>
            </div>
        </div>
    </div>
);

export default DashboardSettings;
