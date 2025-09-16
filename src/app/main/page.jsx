// app/main/page.jsx (homepage)
"use client"

import { useEffect, useState } from "react"; 
import { toast } from 'sonner'; 
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
 
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
        <Card>
            <CardHeader>
                <CardTitle>Welcome to Next.js Starter!</CardTitle>
                <CardDescription>Your go-to boilerplate for Next.js projects.</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card> 
        </div>
    );
};

export default Homepage;
