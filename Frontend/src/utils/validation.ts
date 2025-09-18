// Simple validation functions for book and live class data

export function validateRequest(req: any, res: any, next: any) {
  // Simple request validation - can be expanded as needed
  next();
}

export async function validateEntityRequest(entityClass: any, req: any, isUpdate: boolean = false): Promise<any> {
  // Simple validation that returns the request body
  // In a real application, you would use class-validator or similar
  return req.body;
}

export function validateBookData(bookData: any): string | null {
  if (!bookData.title || bookData.title.trim().length < 3) {
    return 'Book title must be at least 3 characters long';
  }
  
  if (bookData.description && bookData.description.length > 1000) {
    return 'Book description must be less than 1000 characters';
  }
  
  
  return null;
}

export function validateLiveClassData(liveClassData: any): string | null {
  if (!liveClassData.title || liveClassData.title.trim().length < 3) {
    return 'Live class title must be at least 3 characters long';
  }
  
  if (liveClassData.description && liveClassData.description.length > 1000) {
    return 'Live class description must be less than 1000 characters';
  }
  
  if (liveClassData.duration && (isNaN(liveClassData.duration) || liveClassData.duration < 15)) {
    return 'Live class duration must be at least 15 minutes';
  }
  
  if (liveClassData.maxStudents && (isNaN(liveClassData.maxStudents) || liveClassData.maxStudents < 1)) {
    return 'Maximum students must be at least 1';
  }
  
  return null;
}
