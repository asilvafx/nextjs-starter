"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CheckCircle, Clock, AlertCircle, User } from "lucide-react";
import { getAll, create, update, remove } from "@/lib/client/query";
import { toast } from "sonner";

export default function TasksPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tasks from database
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await getAll('tasks');
      
      if (response?.success && response.data) {
        setTasks(response.data);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async () => {
    try {
      const newTask = {
        title: "New Task",
        description: "Task description",
        status: "pending",
        priority: "medium",
        assignee: "Unassigned",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tags: [],
        createdAt: new Date().toISOString()
      };
      
      await create(newTask, 'tasks');
      toast.success('Task created successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    "in-progress": { color: "bg-blue-100 text-blue-800", icon: AlertCircle },
    completed: { color: "bg-green-100 text-green-800", icon: CheckCircle }
  };

  const priorityConfig = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-orange-100 text-orange-800", 
    high: "bg-red-100 text-red-800"
  };

  const filteredTasks = selectedStatus === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === selectedStatus);

  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    "in-progress": tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-2">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Task Board</h1>
          <p className="text-muted-foreground">
            Manage and track project tasks and assignments
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleCreateTask}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2">
        {Object.entries(taskCounts).map(([status, count]) => (
          <Button
            key={status}
            variant={selectedStatus === status ? "default" : "outline"}
            onClick={() => setSelectedStatus(status)}
            className="flex items-center gap-2"
          >
            {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            <Badge variant="secondary">{count}</Badge>
          </Button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map((task) => {
          const StatusIcon = statusConfig[task.status]?.icon || Clock;
          
          return (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{task.title || 'Untitled Task'}</CardTitle>
                  <Badge className={priorityConfig[task.priority] || priorityConfig.medium}>
                    {task.priority || 'medium'}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {task.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status and Assignee */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    <Badge className={statusConfig[task.status]?.color || statusConfig.pending.color}>
                      {(task.status || 'pending').replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    {task.assignee || 'Unassigned'}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {(task.tags || []).map((tag, index) => (
                    <Badge key={`${tag}-${index}`} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Due Date */}
                <div className="text-sm text-muted-foreground">
                  Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks found</h3>
            <p className="text-muted-foreground mb-4">
              {selectedStatus === 'all' 
                ? "Get started by creating your first task"
                : `No ${selectedStatus.replace('-', ' ')} tasks at the moment`
              }
            </p>
            <Button onClick={handleCreateTask}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}