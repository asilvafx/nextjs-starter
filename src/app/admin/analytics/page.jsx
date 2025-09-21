"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton} from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Eye,
  Globe,
  Activity,
  Clock,
  Settings,
  RefreshCw,
} from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const StatCard = ({ title, value, icon: Icon, trend, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {trend !== undefined && (
        <p className={`text-xs ${trend > 0 ? "text-green-500" : "text-red-500"}`}>
          {trend > 0 ? "+" : ""}
          {trend}% from last period
        </p>
      )}
    </CardContent>
  </Card>
);

export default function AnalyticsPage() {
  const [webStatsLoading, setWebStatsLoading] = useState(true);
  const [googleAnalyticsOpen, setGoogleAnalyticsOpen] = useState(false);
  const [googleApiKey, setGoogleApiKey] = useState("");
  
  // Web Stats Data
  const [webStats, setWebStats] = useState({
    totalVisitors: 0,
    uniqueVisitors: 0,
    pageViews: 0,
    avgLoadTime: 0,
    bounceRate: 0,
  });
  const [visitorData, setVisitorData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [browserData, setBrowserData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [topPages, setTopPages] = useState([]);
  const [hourlyStats, setHourlyStats] = useState([]);
  


  const fetchWebStats = async () => {
    try {
      setWebStatsLoading(true);
      const response = await fetch('/api/web-stats');
      const result = await response.json();
      
      if (result.success && result.data) {
        const data = result.data;
        
        setWebStats({
          totalVisitors: data.overview.totalVisitors,
          uniqueVisitors: data.overview.uniqueVisitors,
          pageViews: data.overview.pageViews,
          avgLoadTime: data.overview.avgLoadTime,
          bounceRate: data.overview.bounceRate,
        });
        
        setVisitorData(data.daily || []);
        setCountryData(data.countries || []);
        setBrowserData(data.browsers || []);
        setDeviceData(data.devices || []);
        setTopPages(data.pages || []);
        setHourlyStats(data.hourly || []);
      }
    } catch (error) {
      console.error('Failed to fetch web stats:', error);
      toast.error("Failed to fetch visitor analytics");
    } finally {
      setWebStatsLoading(false);
    }
  };



  useEffect(() => {
    fetchWebStats();
  }, []);

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const handleGoogleAnalyticsSubmit = (e) => {
    e.preventDefault();
    if (googleApiKey.trim()) {
      // Save Google Analytics API key (you might want to save this to database)
      localStorage.setItem('google_analytics_api_key', googleApiKey);
      toast.success("Google Analytics API key saved successfully");
      setGoogleAnalyticsOpen(false);
      setGoogleApiKey("");
    }
  };

  const refreshData = () => {
    fetchWebStats();
  };

  return (
    <ScrollArea className="h-[calc(100vh-80px)]">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Website Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive visitor statistics and website performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={googleAnalyticsOpen} onOpenChange={setGoogleAnalyticsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Google Analytics
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Google Analytics Integration</DialogTitle>
                  <DialogDescription>
                    Enter your Google Analytics API key to integrate analytics data
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGoogleAnalyticsSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="text"
                      placeholder="Enter your Google Analytics API key"
                      value={googleApiKey}
                      onChange={(e) => setGoogleApiKey(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setGoogleAnalyticsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save API Key</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Website Analytics Section */}
        <div className="space-y-4">
          {/* Web Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {webStatsLoading ? (
              <>
                <Card><CardContent className="pt-6"><Skeleton className="h-8 w-full" /></CardContent></Card>
                <Card><CardContent className="pt-6"><Skeleton className="h-8 w-full" /></CardContent></Card>
                <Card><CardContent className="pt-6"><Skeleton className="h-8 w-full" /></CardContent></Card>
                <Card><CardContent className="pt-6"><Skeleton className="h-8 w-full" /></CardContent></Card>
                <Card><CardContent className="pt-6"><Skeleton className="h-8 w-full" /></CardContent></Card>
              </>
            ) : (
              <>
                <StatCard
                  title="Total Visitors"
                  value={formatNumber(webStats.totalVisitors)}
                  icon={Users}
                  description="Total page visits"
                />
                <StatCard
                  title="Unique Visitors"
                  value={formatNumber(webStats.uniqueVisitors)}
                  icon={Eye}
                  description="Unique IP addresses"
                />
                <StatCard
                  title="Page Views"
                  value={formatNumber(webStats.pageViews)}
                  icon={Globe}
                  description="Total page views"
                />
                <StatCard
                  title="Avg Load Time"
                  value={`${webStats.avgLoadTime}ms`}
                  icon={Clock}
                  description="Average page load"
                />
                <StatCard
                  title="Bounce Rate"
                  value={`${webStats.bounceRate}%`}
                  icon={Activity}
                  description="Single page visits"
                />
              </>
            )}
          </div>
        </div>



        {/* Website Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Daily Visitors Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Visitors</CardTitle>
              <CardDescription>Visitor traffic over time</CardDescription>
            </CardHeader>
            <CardContent>
              {webStatsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={visitorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Countries */}
          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
              <CardDescription>Visitors by country</CardDescription>
            </CardHeader>
            <CardContent>
              {webStatsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={countryData.slice(0, 5)}
                      dataKey="count"
                      nameKey="country"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {countryData.slice(0, 5).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Browser Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Browser Usage</CardTitle>
              <CardDescription>Most used browsers</CardDescription>
            </CardHeader>
            <CardContent>
              {webStatsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={browserData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="browser" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Device Types */}
          <Card>
            <CardHeader>
              <CardTitle>Device Types</CardTitle>
              <CardDescription>Desktop vs Mobile traffic</CardDescription>
            </CardHeader>
            <CardContent>
              {webStatsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={deviceData}
                      dataKey="count"
                      nameKey="device"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {deviceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "#0088FE" : "#FF8042"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Hourly Traffic */}
          <Card>
            <CardHeader>
              <CardTitle>Hourly Traffic</CardTitle>
              <CardDescription>Traffic distribution by hour</CardDescription>
            </CardHeader>
            <CardContent>
              {webStatsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="visitors"
                      stroke="#FFBB28"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Most visited pages</CardDescription>
            </CardHeader>
            <CardContent>
              {webStatsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : (
                <div className="space-y-2">
                  {topPages.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm truncate flex-1">{page.page}</span>
                      <span className="text-sm font-medium ml-2">{page.views}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>


      </div>
    </ScrollArea>
  );
}