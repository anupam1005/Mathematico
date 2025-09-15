import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load components with proper type annotations
const Dashboard = lazy(() => import('./Dashboard'));
const Courses = lazy(() => import('./Courses'));
const Users = lazy(async () => {
  const module = await import('./Users');
  return { default: module.default };
});

const Settings = lazy(() => import('./Settings'));
const LiveClasses = lazy(() => import('./LiveClasses'));
const Books = lazy(() => import('./Books'));
const CourseForm = lazy(async () => {
  const module = await import('./CourseForm');
  return { default: module.CourseForm };
});
const BookForm = lazy(() => import('./BookForm'));
const LiveClassForm = lazy(() => import('./LiveClassForm'));

// Loading fallback for dashboard-style pages
const LoadingFallback = () => (
  <div className="p-8">
    <Skeleton className="h-8 w-48 mb-8" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-36 w-full" />
      ))}
    </div>
  </div>
);

// Loading component for other pages
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      <p className="mt-2 text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export const AdminRoutes = () => {
  return (
    <Routes>
      {/* Dashboard - uses skeleton loading */}
      <Route 
        path="/" 
        element={
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        } 
      />
      
      {/* Courses - with form routes (specific routes first) */}
      <Route 
        path="/courses/new" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <CourseForm course={undefined} isEditing={false} onSuccess={() => {}} />
          </Suspense>
        } 
      />
      <Route 
        path="/courses/:id/edit" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <CourseForm course={undefined} isEditing={true} onSuccess={() => {}} />
          </Suspense>
        } 
      />
      <Route 
        path="/courses" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <Courses />
          </Suspense>
        } 
      />
      
      {/* Books - with form routes */}
      <Route 
        path="/books/new" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <BookForm book={undefined} isEditing={false} onSuccess={() => {}} />
          </Suspense>
        } 
      />
      <Route 
        path="/books/:id/edit" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <BookForm book={undefined} isEditing={true} onSuccess={() => {}} />
          </Suspense>
        } 
      />
      <Route 
        path="/books" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <Books />
          </Suspense>
        } 
      />
      
      {/* Live Classes - with form routes */}
      <Route 
        path="/live-classes/new" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <LiveClassForm liveClass={undefined} isEditing={false} onSuccess={() => {}} />
          </Suspense>
        } 
      />
      <Route 
        path="/live-classes/:id/edit" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <LiveClassForm liveClass={undefined} isEditing={true} onSuccess={() => {}} />
          </Suspense>
        } 
      />
      <Route 
        path="/live-classes" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <LiveClasses />
          </Suspense>
        } 
      />
      
      {/* Users */}
      <Route 
        path="/users" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <Users />
          </Suspense>
        } 
      />
      

      
      {/* Settings */}
      <Route 
        path="/settings" 
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <Settings />
          </Suspense>
        } 
      />
    </Routes>
  );
};

