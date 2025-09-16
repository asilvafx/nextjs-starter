// app/main/page.jsx (homepage)
"use client"

import { useEffect, useState } from "react"; 
import { toast } from 'sonner'; 
 
const Homepage = () => { 
    const [setupData, setSetupData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to check setup
    useEffect(() => {
        const setupDbEnv = async () => {
        try {
        fetch('/api/setup')
            .then(res => res.json())
            .then(data => {
                setSetupData(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Setup check failed:', error);
                setLoading(false);
            });
        } catch (err) {
            console.error("❌ Error loading setup:", err);
            toast.error(`Error loading setup: ${err.message}`);
        }
        }
        setupDbEnv();
    }, []); 

    if (loading) return <div className="section"><span>Loading...</span></div>;

    return (
        <div className="section"> 
            <div className="border border-gray-300 dark:border-gray-700 p-4 mb-6 rounded bg-black/5 dark:bg-white/5">
                <h1>Environment Setup Status</h1>
                {setupData?.setupComplete ? (
                    <p className="text-green-600">✅ Setup is complete!</p>
                ) : (
                    <div>
                        <p className="text-red-600">❌ Setup incomplete</p>
                        <p>Progress: {setupData?.setupPercentage}%</p>
                        <p>Missing: {setupData?.status?.missing?.join(', ')}</p>
                        <p>Empty: {setupData?.status?.empty?.join(', ')}</p>
                    </div>
                )}
            </div>
 
        </div>
    );
};

export default Homepage;
