"use client"
const SkeletonSearch = () =>  (
    <div className="dashboard-card mb-4">
        <div className="animate-pulse">
            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-300 rounded"></div>
                </div>
                <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-300 rounded"></div>
                </div>
                <div className="w-20 h-10 bg-gray-300 rounded"></div>
                <div className="w-16 h-10 bg-gray-300 rounded"></div>
            </div>
        </div>
    </div>
);

export default SkeletonSearch
