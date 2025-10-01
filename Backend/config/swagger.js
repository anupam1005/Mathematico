const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mathematico Backend API',
      version: '2.0.0',
      description: 'Comprehensive API documentation for the Mathematico educational platform backend',
      contact: {
        name: 'Mathematico Team',
        email: 'support@mathematico.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      },
      {
        url: 'https://mathematico-backend-new.vercel.app',
        description: 'Production Vercel server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            message: {
              type: 'string',
              description: 'Human-readable message about the response'
            },
            data: {
              description: 'Response data (varies by endpoint)'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO timestamp of the response'
            }
          },
          required: ['success']
        },
        Book: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the book'
            },
            title: {
              type: 'string',
              description: 'Book title'
            },
            author: {
              type: 'string',
              description: 'Book author'
            },
            description: {
              type: 'string',
              description: 'Book description'
            },
            category: {
              type: 'string',
              description: 'Book category'
            },
            level: {
              type: 'string',
              enum: ['Foundation', 'Intermediate', 'Advanced', 'Expert'],
              description: 'Book difficulty level'
            },
            pages: {
              type: 'integer',
              description: 'Number of pages'
            },
            isbn: {
              type: 'string',
              description: 'ISBN number'
            },
            cover_image_url: {
              type: 'string',
              description: 'URL to book cover image'
            },
            pdf_url: {
              type: 'string',
              description: 'URL to book PDF file'
            },
            status: {
              type: 'string',
              enum: ['draft', 'active', 'archived'],
              description: 'Book publication status'
            },
            is_published: {
              type: 'boolean',
              description: 'Whether the book is published'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Course: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the course'
            },
            title: {
              type: 'string',
              description: 'Course title'
            },
            description: {
              type: 'string',
              description: 'Course description'
            },
            category: {
              type: 'string',
              description: 'Course category'
            },
            level: {
              type: 'string',
              enum: ['Foundation', 'Intermediate', 'Advanced', 'Expert'],
              description: 'Course difficulty level'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Course price'
            },
            original_price: {
              type: 'number',
              format: 'decimal',
              description: 'Original course price (before discount)'
            },
            students: {
              type: 'integer',
              description: 'Number of enrolled students'
            },
            image_url: {
              type: 'string',
              description: 'URL to course image'
            },
            pdf_url: {
              type: 'string',
              description: 'URL to course PDF materials'
            },
            status: {
              type: 'string',
              enum: ['draft', 'active', 'archived'],
              description: 'Course publication status'
            },
            is_published: {
              type: 'boolean',
              description: 'Whether the course is published'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        LiveClass: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the live class'
            },
            title: {
              type: 'string',
              description: 'Live class title'
            },
            description: {
              type: 'string',
              description: 'Live class description'
            },
            category: {
              type: 'string',
              description: 'Live class category'
            },
            level: {
              type: 'string',
              enum: ['Foundation', 'Intermediate', 'Advanced', 'Expert'],
              description: 'Live class difficulty level'
            },
            scheduled_at: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled date and time'
            },
            duration: {
              type: 'integer',
              description: 'Duration in minutes'
            },
            max_students: {
              type: 'integer',
              description: 'Maximum number of students'
            },
            meeting_link: {
              type: 'string',
              description: 'Meeting link for the live class'
            },
            image_url: {
              type: 'string',
              description: 'URL to live class image'
            },
            status: {
              type: 'string',
              enum: ['draft', 'scheduled', 'live', 'completed', 'cancelled'],
              description: 'Live class status'
            },
            is_published: {
              type: 'boolean',
              description: 'Whether the live class is published'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the user'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role'
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the user account is active'
            },
            email_verified: {
              type: 'boolean',
              description: 'Whether the user email is verified'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Number of items per page'
            },
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Detailed error information'
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ]
  },
  apis: ['./index.js', './routes/*.js'], // Path to the API files
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
  swaggerOptions: {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Mathematico API Documentation',
    customfavIcon: '/icon.png'
  }
};
