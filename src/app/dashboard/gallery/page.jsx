// app/dashboard/gallery/page.jsx
"use client"
const DashboardGallery = () => (
    <div className="fade-in">
        <div className="dashboard-card-header">
            <div>
                <h1 className="dashboard-card-title">Gallery Management</h1>
                <p className="dashboard-card-subtitle">Manage images and media files</p>
            </div>
            <button className="button primary">Upload Images</button>
        </div>

        <div className="dashboard-card">
            <div className="file-upload">
                <div className="file-upload-icon">📁</div>
                <div className="file-upload-text">Drag and drop images here</div>
                <div className="file-upload-subtext">or click to browse files</div>
            </div>
        </div>
    </div>
);

export default DashboardGallery;
