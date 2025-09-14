const SkeletonItems = ({arr = 5}) => (
    <div className="dashboard-card">
        <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        </div>
        {Array.from({ length: arr }).map((_, index) => (
            <div key={index} className="animate-pulse border-b border-gray-200 pb-4">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-300 rounded"></div>
                    <div className="w-12 h-6 bg-gray-300 rounded"></div>
                    <div className="w-20 h-6 bg-gray-300 rounded"></div>
                    <div className="w-24 h-8 bg-gray-300 rounded"></div>
                </div>
            </div>
        ))}
    </div>
);

export default SkeletonItems;
