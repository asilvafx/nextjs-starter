// app/dashboard/components/skeletons/SkeletonRow.jsx
"use client"
const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td><div className="h-4 bg-gray-300 rounded w-3/4"></div></td>
        <td><div className="h-4 bg-gray-300 rounded w-full"></div></td>
        <td><div className="h-4 bg-gray-300 rounded w-1/2"></div></td>
        <td><div className="h-6 bg-gray-300 rounded-full w-16"></div></td>
        <td><div className="h-4 bg-gray-300 rounded w-2/3"></div></td>
        <td>
            <div className="flex gap-1">
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
                <div className="h-6 w-6 bg-gray-300 rounded"></div>
            </div>
        </td>
    </tr>
);

export default SkeletonRow;
